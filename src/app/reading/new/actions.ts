"use server";

/**
 * Birth-form submission (PRD §5.1/§5.2 flow step 1): validate → resolve the
 * picked city to lat/lng + IANA tzId → `computeChart` (deterministic,
 * <100ms) → persist a `Profile` row (tied to the anon session User, with
 * the computed chart cached as JSON) → redirect to the reading page, which
 * generates and streams the actual natal reading.
 *
 * Deliberately does NOT call the interpreter here: a Server Action's
 * response is a single roundtrip (no incremental streaming to the client —
 * see Next.js's Server Actions guide), so card-by-card streaming happens
 * from the reading page instead, against a Route Handler.
 */
import { redirect } from "next/navigation";
import { computeChart } from "@/lib/bazi";
import { db } from "@/lib/db";
import { findCityById, resolveTimezone } from "@/lib/geocode";
import { getOrCreateUser } from "@/lib/session";
import { BirthFormSchema, resolveBirthInput } from "@/lib/reading/birth-schema";

export interface CreateProfileState {
  error?: string;
  fieldErrors?: Partial<Record<"name" | "date" | "time" | "cityId", string>>;
}

export async function createProfile(
  _prevState: CreateProfileState,
  formData: FormData
): Promise<CreateProfileState> {
  const raw = {
    name: (formData.get("name") as string | null) ?? "",
    date: (formData.get("date") as string | null) ?? "",
    time: (formData.get("time") as string | null) ?? "",
    timeUnknown: (formData.get("timeUnknown") as string | null) ?? "",
    cityId: (formData.get("cityId") as string | null) ?? "",
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

  let profileId: string;
  try {
    const chart = computeChart({
      date: resolved.date,
      time: resolved.time,
      lat: city.lat,
      lng: city.lng,
      tzId,
    });

    const user = await getOrCreateUser();
    const profile = await db.profile.create({
      data: {
        userId: user.id,
        name: resolved.name,
        birthDate: new Date(`${resolved.date}T00:00:00.000Z`),
        birthTime: resolved.time,
        lat: city.lat,
        lng: city.lng,
        tzId,
        isSelf: true,
        chartCache: JSON.stringify(chart),
      },
    });
    profileId = profile.id;
  } catch (err) {
    console.error("createProfile: failed to compute chart or save profile", err);
    return {
      error: "Something went wrong computing your chart. Please double-check your birth details and try again.",
    };
  }

  // Outside the try/catch: redirect() throws a control-flow exception by
  // design, which a surrounding catch would otherwise swallow.
  redirect(`/reading/${profileId}`);
}
