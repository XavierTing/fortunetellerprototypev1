/**
 * Presentational pieces for the 师傅 chat transcript. Bubbles are hand-rolled
 * flat surfaces (hairline border + a token background, `rounded-xl` — the
 * same radius the Card primitive uses) rather than the `Card` component
 * itself: `cn()` here has no `tailwind-merge`, so overriding Card's default
 * `p-6` padding from a caller className isn't a safe class-merge (see
 * src/components/ui/cn.ts) — reusing the raw tokens sidesteps that instead
 * of fighting it. No side-stripe borders, no gradients, no glass — DESIGN.md
 * §6.
 */
import { Button } from "@/components/ui";

export function AssistantBubble({ content, pending }: { content: string; pending?: boolean }) {
  return (
    <div className="flex items-start gap-3">
      <span
        aria-hidden="true"
        className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-hairline font-display text-base text-cinnabar"
      >
        師
      </span>
      <div className="max-w-[85%] rounded-xl border border-hairline bg-raised px-4 py-3 sm:max-w-[70%] sm:px-5 sm:py-4">
        {content ? (
          <p className="whitespace-pre-wrap text-[0.95rem] leading-relaxed text-text">{content}</p>
        ) : (
          <span className="sr-only">The 师傅 is replying…</span>
        )}
        {pending && (
          <span aria-hidden="true" className="mt-2 inline-flex gap-1">
            <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-faint" />
            <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-faint [animation-delay:150ms]" />
            <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-faint [animation-delay:300ms]" />
          </span>
        )}
      </div>
    </div>
  );
}

export function UserBubble({ content }: { content: string }) {
  return (
    <div className="flex justify-end">
      <div className="max-w-[85%] rounded-xl border border-hairline bg-graphite px-4 py-3 sm:max-w-[70%] sm:px-5 sm:py-4">
        <p className="whitespace-pre-wrap text-[0.95rem] leading-relaxed text-ink">{content}</p>
      </div>
    </div>
  );
}

export function EmptyChatIntro({
  prompts,
  onPick,
  disabled,
}: {
  prompts: readonly string[];
  onPick: (prompt: string) => void;
  disabled?: boolean;
}) {
  return (
    <div className="flex flex-col gap-5 border-y border-hairline py-10">
      <p className="max-w-[56ch] text-[1.02rem] leading-relaxed text-muted">
        Ask anything about your chart — your Day Master, your favorable elements, timing, relationships. The 师傅
        answers from your actual pillars, not a generic horoscope.
      </p>
      <div className="flex flex-wrap gap-2.5">
        {prompts.map((p) => (
          <Button
            key={p}
            type="button"
            variant="secondary"
            tone="cinnabar"
            size="sm"
            disabled={disabled}
            onClick={() => onPick(p)}
          >
            {p}
          </Button>
        ))}
      </div>
    </div>
  );
}
