"use server";

/**
 * Person-B submission (PRD §5.5 flow): validate → resolve the picked city to
 * lat/lng + IANA tzId (same offline geocoding pattern as
 * `reading/new/actions.ts`) → `computeChart` for person B → compute
 * cross-chart `RelationFacts` (`./lib`) → `interpreter.compatibility()` →
 * persist a `CompatibilityPair` (person A = the caller's saved self profile,
 * person B = ad-hoc, no account) → redirect to the result page.
 *
 * Unlike the natal reading (streamed card-by-card from a Route Handler,
 * since a Server Action is a single roundtrip), a compatibility reading is
 * one `Compat` object, not a stream of cards — so, like `dailyFortune`
 * (`today/lib.ts`), it's fine to await the interpreter directly here.
 *
 * Cost control (PRD §11, FIX-report.md item 1): every submission pays for
 * one LLM compatibility generation, so it's rate-limited (per-session +
 * per-IP) right after the self-profile check, before doing any chart math
 * or hitting the interpreter.
 */
import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { computeChart } from "@/lib/bazi";
import { db } from "@/lib/db";
import { cityLabel, findCityById, resolveTimezone } from "@/lib/geocode";
import { getInterpreter } from "@/lib/interpreter/interpreter";
import type { Chart } from "@/lib/interpreter/types";
import { checkDualRateLimit, getClientIp, rateLimitMessage } from "@/lib/rate-limit";
import { BirthFormSchema, resolveBirthInput } from "@/lib/reading/birth-schema";
import { getSessionUserId } from "@/lib/session";
import { computeRelationFacts } from "./lib";
import type { PersonBRecord } from "./types";

export interface CreateCompatibilityState {
  error?: string;
  fieldErrors?: Partial<Record<"name" | "date" | "time" | "cityId", string>>;
}

const NO_SELF_PROFILE_ERROR = "Reveal your own chart first — compatibility needs a Day Master to weigh against.";

export async function createCompatibility(
  _prevState: CreateCompatibilityState,
  formData: FormData
): Promise<CreateCompatibilityState> {
  const userId = await getSessionUserId();
  if (!userId) {
    return { error: NO_SELF_PROFILE_ERROR };
  }

  const profileA = await db.profile.findFirst({
    where: { userId, isSelf: true, chartCache: { not: null } },
    orderBy: { createdAt: "desc" },
  });
  if (!profileA || !profileA.chartCache) {
    return { error: NO_SELF_PROFILE_ERROR };
  }

  const headersList = await headers();
  const rateLimit = checkDualRateLimit("compat", userId, getClientIp(headersList));
  if (!rateLimit.allowed) {
    return { error: rateLimitMessage("compat") };
  }

  const raw = {
    name: (formData.get("name") as string | null) ?? "",
    date: (formData.get("date") as string | null) ?? "",
    time: (formData.get("time") as string | null) ?? "",
    timeUnknown: (formData.get("timeUnknown") as string | null) ?? "",
    cityId: (formData.get("cityId") as string | null) ?? "",
    gender: (formData.get("gender") as string | null) ?? "",
  };

  const parsed = BirthFormSchema.safeParse(raw);
  if (!parsed.success) {
    const flat = parsed.error.flatten().fieldErrors;
    return {
      error: "Please check the highlighted fields.",
      fieldErrors: {
        name: flat.name?.[0],
        date: flat.date?.[0],
        time: flat.time?.[0],
        cityId: flat.cityId?.[0],
      },
    };
  }

  const city = findCityById(parsed.data.cityId);
  if (!city) {
    return {
      error: "Pick a city from the suggestions list.",
      fieldErrors: { cityId: "Unrecognized city — pick one from the dropdown." },
    };
  }

  const resolved = resolveBirthInput(parsed.data);
  const tzId = resolveTimezone(city.lat, city.lng);

  let pairId: string;
  try {
    const chartA = JSON.parse(profileA.chartCache) as Chart;
    const chartB = computeChart({
      date: resolved.date,
      time: resolved.time,
      lat: city.lat,
      lng: city.lng,
      tzId,
      gender: resolved.gender,
    });

    const relationFacts = computeRelationFacts(chartA, chartB);
    const interpreter = getInterpreter();
    const result = await interpreter.compatibility(chartA, chartB, relationFacts);

    const personB: PersonBRecord = {
      name: resolved.name,
      date: resolved.date,
      time: resolved.time,
      lat: city.lat,
      lng: city.lng,
      tzId,
      gender: resolved.gender,
      cityLabel: cityLabel(city),
      chart: chartB,
    };

    const pair = await db.compatibilityPair.create({
      data: {
        profileAId: profileA.id,
        personB: JSON.stringify(personB),
        result: JSON.stringify(result),
      },
    });
    pairId = pair.id;
  } catch (err) {
    console.error("createCompatibility: failed to compute or persist compatibility", err);
    return {
      error:
        "Something went wrong reading the compatibility between these two charts. Please double-check the birth details and try again.",
    };
  }

  // Outside the try/catch: redirect() throws a control-flow exception by
  // design, which a surrounding catch would otherwise swallow.
  redirect(`/match/${pairId}`);
}
