/**
 * DeepSeekInterpreter — the live LLM back end. DeepSeek's API is
 * OpenAI-compatible (POST {baseURL}/chat/completions), so this file wires
 * it into the Vercel AI SDK's model-agnostic `generateObject` / `streamText`
 * by implementing a small `LanguageModelV2` (the AI SDK's own provider
 * interface, from `@ai-sdk/provider` — a hard dependency of the `ai`
 * package already in node_modules). No pre-built OpenAI-compatible provider
 * package (`@ai-sdk/openai-compatible` or similar) is installed in this
 * project and this module must not `npm install` one, so the HTTP + SSE
 * plumbing below is hand-rolled instead of imported from one. Only TYPES
 * are imported from `@ai-sdk/provider` (erased at compile time — zero
 * runtime dependency footprint); everything else is plain `fetch`.
 *
 * Once wired up this way, `generateObject`/`streamText` from `ai` give us
 * zod-validated structured output and token streaming "for free" on top of
 * this one small adapter.
 */
import { generateObject, streamText } from "ai";
import type {
  LanguageModelV2,
  LanguageModelV2CallOptions,
  LanguageModelV2FinishReason,
  LanguageModelV2Prompt,
  LanguageModelV2StreamPart,
  LanguageModelV2Usage,
} from "@ai-sdk/provider";
import {
  CardSchema,
  CardContentSchema,
  ReadingSchema,
  DailyFortuneSchema,
  CompatSchema,
  type Chart,
  type Card,
  type Reading,
  type ChatMessage,
  type DailyFortune,
  type DailyInteractionFact,
  type Compat,
  type RelationFacts,
  type Interpreter,
  type NatalReadingOptions,
} from "./types";
import { CARD_SPECS, type CardSpec } from "./card-specs";
import {
  SYSTEM_PROMPT,
  buildCardPrompt,
  buildChatSystemPrompt,
  buildDailyFortunePrompt,
  buildCompatibilityPrompt,
  toModelMessages,
} from "./prompts";

export interface DeepSeekConfig {
  apiKey: string;
  /** Defaults to https://api.deepseek.com. */
  baseURL?: string;
  /** Defaults to 'deepseek-chat'. */
  modelId?: string;
}

const DEFAULT_BASE_URL = "https://api.deepseek.com";
const DEFAULT_MODEL_ID = "deepseek-chat";

// ---------------------------------------------------------------------------
// A minimal LanguageModelV2 implementation for DeepSeek's OpenAI-compatible
// chat completions endpoint.
// ---------------------------------------------------------------------------

function mapFinishReason(reason: string | undefined | null): LanguageModelV2FinishReason {
  switch (reason) {
    case "stop":
      return "stop";
    case "length":
      return "length";
    case "content_filter":
      return "content-filter";
    case "tool_calls":
      return "tool-calls";
    case undefined:
    case null:
      return "unknown";
    default:
      return "other";
  }
}

function toDeepSeekMessages(
  prompt: LanguageModelV2Prompt,
  jsonInstruction?: string
): { role: "system" | "user" | "assistant"; content: string }[] {
  const messages: { role: "system" | "user" | "assistant"; content: string }[] = [];
  for (const message of prompt) {
    if (message.role === "system") {
      messages.push({ role: "system", content: message.content });
    } else if (message.role === "user") {
      const text = message.content
        .filter((part): part is Extract<typeof part, { type: "text" }> => part.type === "text")
        .map((part) => part.text)
        .join("\n");
      messages.push({ role: "user", content: text });
    } else if (message.role === "assistant") {
      const text = message.content
        .filter((part): part is Extract<typeof part, { type: "text" }> => part.type === "text")
        .map((part) => part.text)
        .join("\n");
      messages.push({ role: "assistant", content: text });
    }
    // 'tool' role messages are not used by this app (no tool calling) — skipped.
  }
  if (jsonInstruction) {
    messages.push({ role: "system", content: jsonInstruction });
  }
  return messages;
}

function buildJsonInstruction(responseFormat: LanguageModelV2CallOptions["responseFormat"]): string | undefined {
  if (!responseFormat || responseFormat.type !== "json") return undefined;
  const schemaText = responseFormat.schema ? JSON.stringify(responseFormat.schema, null, 2) : undefined;
  return [
    "Respond with a single valid JSON object only.",
    "No markdown code fences, no commentary before or after, no explanation — raw JSON text only.",
    schemaText
      ? `The JSON must conform to this schema:\n${schemaText}`
      : "Produce well-formed JSON matching the fields you were asked for.",
  ].join(" ");
}

function removeUndefined(obj: Record<string, unknown>): Record<string, unknown> {
  return Object.fromEntries(Object.entries(obj).filter(([, v]) => v !== undefined));
}

/** Creates a LanguageModelV2 that talks to DeepSeek's OpenAI-compatible chat completions endpoint. */
export function createDeepSeekLanguageModel(config: DeepSeekConfig): LanguageModelV2 {
  const baseURL = (config.baseURL ?? DEFAULT_BASE_URL).replace(/\/$/, "");
  const modelId = config.modelId ?? DEFAULT_MODEL_ID;
  const apiKey = config.apiKey;

  function headers(): Record<string, string> {
    return {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    };
  }

  function buildBody(options: LanguageModelV2CallOptions, stream: boolean) {
    const jsonInstruction = buildJsonInstruction(options.responseFormat);
    const messages = toDeepSeekMessages(options.prompt, jsonInstruction);
    return removeUndefined({
      model: modelId,
      messages,
      stream,
      temperature: options.temperature,
      top_p: options.topP,
      max_tokens: options.maxOutputTokens,
      stop: options.stopSequences,
      frequency_penalty: options.frequencyPenalty,
      presence_penalty: options.presencePenalty,
      response_format: options.responseFormat?.type === "json" ? { type: "json_object" } : undefined,
    });
  }

  const model: LanguageModelV2 = {
    specificationVersion: "v2",
    provider: "deepseek",
    modelId,
    supportedUrls: {},

    async doGenerate(options: LanguageModelV2CallOptions) {
      const body = buildBody(options, false);
      const res = await fetch(`${baseURL}/chat/completions`, {
        method: "POST",
        headers: headers(),
        body: JSON.stringify(body),
        signal: options.abortSignal,
      });
      if (!res.ok) {
        const errText = await res.text().catch(() => "");
        throw new Error(`DeepSeek API error ${res.status} ${res.statusText}: ${errText}`);
      }
      const json = await res.json();
      const choice = json.choices?.[0];
      const text: string = choice?.message?.content ?? "";
      const usage: LanguageModelV2Usage = {
        inputTokens: json.usage?.prompt_tokens,
        outputTokens: json.usage?.completion_tokens,
        totalTokens: json.usage?.total_tokens,
      };
      return {
        content: [{ type: "text" as const, text }],
        finishReason: mapFinishReason(choice?.finish_reason),
        usage,
        warnings: [],
      };
    },

    async doStream(options: LanguageModelV2CallOptions) {
      const body = buildBody(options, true);
      const res = await fetch(`${baseURL}/chat/completions`, {
        method: "POST",
        headers: headers(),
        body: JSON.stringify(body),
        signal: options.abortSignal,
      });
      if (!res.ok || !res.body) {
        const errText = await res.text().catch(() => "");
        throw new Error(`DeepSeek API error ${res.status} ${res.statusText}: ${errText}`);
      }

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      const textId = "text-0";

      const stream = new ReadableStream<LanguageModelV2StreamPart>({
        async start(controller) {
          controller.enqueue({ type: "stream-start", warnings: [] });
          let buffer = "";
          let started = false;
          let finishReason: LanguageModelV2FinishReason = "unknown";
          let usage: LanguageModelV2Usage = {
            inputTokens: undefined,
            outputTokens: undefined,
            totalTokens: undefined,
          };

          try {
            while (true) {
              const { done, value } = await reader.read();
              if (done) break;
              buffer += decoder.decode(value, { stream: true });
              const lines = buffer.split("\n");
              buffer = lines.pop() ?? "";

              for (const rawLine of lines) {
                const line = rawLine.trim();
                if (!line.startsWith("data:")) continue;
                const data = line.slice("data:".length).trim();
                if (data === "[DONE]") continue;
                let parsed: {
                  choices?: Array<{
                    delta?: { content?: string };
                    finish_reason?: string | null;
                  }>;
                  usage?: { prompt_tokens?: number; completion_tokens?: number; total_tokens?: number };
                };
                try {
                  parsed = JSON.parse(data);
                } catch {
                  continue;
                }
                const choice = parsed.choices?.[0];
                const delta = choice?.delta?.content;
                if (typeof delta === "string" && delta.length > 0) {
                  if (!started) {
                    controller.enqueue({ type: "text-start", id: textId });
                    started = true;
                  }
                  controller.enqueue({ type: "text-delta", id: textId, delta });
                }
                if (choice?.finish_reason) {
                  finishReason = mapFinishReason(choice.finish_reason);
                }
                if (parsed.usage) {
                  usage = {
                    inputTokens: parsed.usage.prompt_tokens,
                    outputTokens: parsed.usage.completion_tokens,
                    totalTokens: parsed.usage.total_tokens,
                  };
                }
              }
            }
            if (started) controller.enqueue({ type: "text-end", id: textId });
            controller.enqueue({ type: "finish", usage, finishReason });
            controller.close();
          } catch (err) {
            controller.enqueue({ type: "error", error: err });
            controller.close();
          }
        },
      });

      return { stream };
    },
  };

  return model;
}

// ---------------------------------------------------------------------------
// The interpreter
// ---------------------------------------------------------------------------

function specsFor(opts?: NatalReadingOptions): CardSpec[] {
  if (!opts?.cardIds || opts.cardIds.length === 0) return CARD_SPECS;
  const wanted = new Set(opts.cardIds);
  return CARD_SPECS.filter((spec) => wanted.has(spec.id));
}

export class DeepSeekInterpreter implements Interpreter {
  readonly model = "deepseek-chat";
  private readonly languageModel: LanguageModelV2;

  constructor(config: DeepSeekConfig) {
    this.languageModel = createDeepSeekLanguageModel({
      apiKey: config.apiKey,
      baseURL: config.baseURL ?? DEFAULT_BASE_URL,
      modelId: config.modelId ?? DEFAULT_MODEL_ID,
    });
  }

  private async generateCard(chart: Chart, spec: CardSpec): Promise<Card> {
    const { object } = await generateObject({
      model: this.languageModel,
      schema: CardContentSchema,
      system: SYSTEM_PROMPT,
      prompt: buildCardPrompt(chart, spec),
    });
    return CardSchema.parse({ id: spec.id, ...object });
  }

  async natalReading(chart: Chart, opts?: NatalReadingOptions): Promise<Reading> {
    const cards = await Promise.all(specsFor(opts).map((spec) => this.generateCard(chart, spec)));
    return ReadingSchema.parse({ cards, model: this.model });
  }

  async *streamNatalReading(chart: Chart, opts?: NatalReadingOptions): AsyncIterable<Card> {
    for (const spec of specsFor(opts)) {
      yield await this.generateCard(chart, spec);
    }
  }

  async *chat(chart: Chart, reading: Reading, messages: ChatMessage[]): AsyncIterable<string> {
    const result = streamText({
      model: this.languageModel,
      system: buildChatSystemPrompt(chart, reading),
      messages: toModelMessages(messages),
    });
    for await (const chunk of result.textStream) {
      yield chunk;
    }
  }

  async dailyFortune(
    chart: Chart,
    dayGanZhi: string,
    date: string,
    interaction?: DailyInteractionFact | null
  ): Promise<DailyFortune> {
    const { object } = await generateObject({
      model: this.languageModel,
      schema: DailyFortuneSchema,
      system: SYSTEM_PROMPT,
      prompt: buildDailyFortunePrompt(chart, dayGanZhi, date, interaction),
    });
    return DailyFortuneSchema.parse(object);
  }

  async compatibility(chartA: Chart, chartB: Chart, relationFacts: RelationFacts): Promise<Compat> {
    const { object } = await generateObject({
      model: this.languageModel,
      schema: CompatSchema,
      system: SYSTEM_PROMPT,
      prompt: buildCompatibilityPrompt(chartA, chartB, relationFacts),
    });
    return CompatSchema.parse(object);
  }
}
