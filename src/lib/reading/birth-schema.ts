/**
 * Zod contract for the birth-data form (PRD §5.1). Pure and framework-free
 * so it's unit-testable on its own and shared between the client form (for
 * shape reference) and the `createProfile` Server Action (the source of
 * truth for validation — client-side checks are a UX nicety only).
 *
 * FormData values always arrive as strings (or are normalized to "" for a
 * missing/disabled field by the caller), so every raw field is typed as a
 * plain string here and the semantic checks (date shape, time-required-
 * unless-unknown, year range) happen in `superRefine`.
 */
import { z } from "zod";

export const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;
export const TIME_RE = /^([01]\d|2[0-3]):[0-5]\d$/;

export const MIN_BIRTH_YEAR = 1900;
export const MAX_BIRTH_YEAR = new Date().getUTCFullYear() + 1;

/**
 * "male" | "female" — collected so `computeChart`'s `gender` option can
 * determine 大运 (luck-pillar) direction correctly (src/lib/bazi/luck.ts:
 * forward vs. reverse through the sexagenary cycle depends on gender ×
 * year-stem polarity; the engine silently defaulted to "male" for every
 * user before this field existed, quietly reversing the luck sequence for
 * roughly half of them). Not validated as a hard-fail field — an
 * unexpected/missing value falls back to "male" in `resolveBirthInput`
 * rather than blocking submission, since the form always renders one
 * option pre-selected.
 */
export type Gender = "male" | "female";

function normalizeGender(raw: string): Gender {
  return raw === "female" ? "female" : "male";
}

export const BirthFormSchema = z
  .object({
    name: z.string().trim().max(80, "Keep the name under 80 characters."),
    date: z.string(),
    time: z.string(),
    /** "on" when the "I don't know my birth time" checkbox is checked, "" otherwise. */
    timeUnknown: z.string(),
    cityId: z.string().min(1, "Pick a city from the suggestions list."),
    /** "male" | "female", see `Gender` above — normalized by `resolveBirthInput`. */
    gender: z.string(),
  })
  .superRefine((data, ctx) => {
    if (!DATE_RE.test(data.date)) {
      ctx.addIssue({ code: "custom", path: ["date"], message: "Enter a valid birth date." });
    } else {
      const year = Number(data.date.slice(0, 4));
      if (year < MIN_BIRTH_YEAR || year > MAX_BIRTH_YEAR) {
        ctx.addIssue({
          code: "custom",
          path: ["date"],
          message: `Enter a birth year between ${MIN_BIRTH_YEAR} and ${MAX_BIRTH_YEAR}.`,
        });
      }
    }

    const timeUnknown = data.timeUnknown === "on";
    if (!timeUnknown && !TIME_RE.test(data.time)) {
      ctx.addIssue({ code: "custom", path: ["time"], message: "Enter a birth time, or mark it unknown." });
    }
  });

export type BirthFormInput = z.infer<typeof BirthFormSchema>;

export interface ResolvedBirthInput {
  name: string | null;
  date: string;
  /** null when the time is unknown — degrades to a 3-pillar chart (PRD §5.1). */
  time: string | null;
  cityId: string;
  gender: Gender;
}

/** Collapses the validated form shape into what the engine + Profile row need. */
export function resolveBirthInput(input: BirthFormInput): ResolvedBirthInput {
  const timeUnknown = input.timeUnknown === "on";
  return {
    name: input.name.length > 0 ? input.name : null,
    date: input.date,
    time: timeUnknown ? null : input.time,
    cityId: input.cityId,
    gender: normalizeGender(input.gender),
  };
}
