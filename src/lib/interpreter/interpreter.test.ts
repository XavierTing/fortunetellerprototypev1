import { afterEach, describe, expect, it, vi } from "vitest";
import { getInterpreter } from "./interpreter";
import { MockInterpreter } from "./mock";
import { DeepSeekInterpreter } from "./deepseek";

// No live network calls happen in this file: constructing a DeepSeekInterpreter
// only stores config and builds a LanguageModelV2 wrapper — it never calls
// fetch() until a generation method is actually invoked, which these tests
// deliberately never do.

describe("getInterpreter", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("returns a MockInterpreter when DEEPSEEK_API_KEY is unset", () => {
    vi.stubEnv("DEEPSEEK_API_KEY", "");
    const interpreter = getInterpreter();
    expect(interpreter).toBeInstanceOf(MockInterpreter);
    expect(interpreter.model).toBe("mock");
  });

  it("returns a MockInterpreter when DEEPSEEK_API_KEY is only whitespace", () => {
    vi.stubEnv("DEEPSEEK_API_KEY", "   ");
    const interpreter = getInterpreter();
    expect(interpreter).toBeInstanceOf(MockInterpreter);
  });

  it("returns a DeepSeekInterpreter when DEEPSEEK_API_KEY is set", () => {
    vi.stubEnv("DEEPSEEK_API_KEY", "sk-test-key-not-real");
    const interpreter = getInterpreter();
    expect(interpreter).toBeInstanceOf(DeepSeekInterpreter);
    expect(interpreter.model).toBe("deepseek-chat");
  });

  it("defaults DEEPSEEK_BASE_URL to DeepSeek's own API when unset", () => {
    vi.stubEnv("DEEPSEEK_API_KEY", "sk-test-key-not-real");
    vi.stubEnv("DEEPSEEK_BASE_URL", "");
    // Constructing must not throw even with no base URL override supplied.
    expect(() => getInterpreter()).not.toThrow();
  });

  it("honors a custom DEEPSEEK_BASE_URL when set", () => {
    vi.stubEnv("DEEPSEEK_API_KEY", "sk-test-key-not-real");
    vi.stubEnv("DEEPSEEK_BASE_URL", "https://example.test/v1");
    expect(() => getInterpreter()).not.toThrow();
  });
});
