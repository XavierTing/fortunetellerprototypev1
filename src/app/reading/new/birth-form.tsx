"use client";

/**
 * Birth-data form (PRD §5.1): name (optional), date, time with an
 * "I don't know my time" fallback, and a place resolved via a keyboard-
 * navigable city-autocomplete combobox backed by `/api/geocode/search`
 * (offline dataset, no external geocoding API). Submits through the
 * `createProfile` Server Action, which computes the chart and redirects to
 * the reading page.
 */
import { useActionState, useEffect, useId, useRef, useState } from "react";
import { useFormStatus } from "react-dom";
import { Button, Field, Input, cn } from "@/components/ui";
import type { City } from "@/lib/geocode";
import { cityLabel } from "@/lib/geocode";
import { createProfile, type CreateProfileState } from "./actions";

const INITIAL_STATE: CreateProfileState = {};

const TODAY = new Date().toISOString().slice(0, 10);

function SubmitButton({ citySelected }: { citySelected: boolean }) {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" disabled={pending || !citySelected} className="self-start">
      {pending ? "Casting your chart…" : "Reveal your chart"}
      {!pending && <span aria-hidden="true">→</span>}
    </Button>
  );
}

export function BirthForm() {
  const [state, formAction] = useActionState(createProfile, INITIAL_STATE);

  const [timeUnknown, setTimeUnknown] = useState(false);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<City[]>([]);
  const [selectedCity, setSelectedCity] = useState<City | null>(null);
  const [open, setOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);

  const listboxId = useId();
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const skipNextFetchRef = useRef(false);

  useEffect(() => {
    if (skipNextFetchRef.current) {
      skipNextFetchRef.current = false;
      return;
    }
    const trimmed = query.trim();
    // A too-short query schedules no fetch; results were already cleared
    // synchronously in the onChange handler below (setState belongs in the
    // event handler that originated the change, not the effect that reacts
    // to it — react-hooks/set-state-in-effect).
    if (trimmed.length < 2) return;
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      fetch(`/api/geocode/search?q=${encodeURIComponent(trimmed)}`)
        .then((res) => (res.ok ? res.json() : { results: [] }))
        .then((data: { results: City[] }) => {
          setResults(data.results ?? []);
          setOpen(true);
          setActiveIndex(-1);
        })
        .catch(() => setResults([]));
    }, 150);
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [query]);

  function selectCity(city: City) {
    skipNextFetchRef.current = true;
    setSelectedCity(city);
    setQuery(cityLabel(city));
    setResults([]);
    setOpen(false);
  }

  function onCityKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (!open || results.length === 0) return;
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActiveIndex((i) => Math.min(i + 1, results.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActiveIndex((i) => Math.max(i - 1, 0));
    } else if (e.key === "Enter") {
      if (activeIndex >= 0) {
        e.preventDefault();
        selectCity(results[activeIndex]);
      }
    } else if (e.key === "Escape") {
      setOpen(false);
    }
  }

  return (
    <form action={formAction} className="flex flex-col gap-6" noValidate>
      <Field label="Name (optional)" htmlFor="name">
        <Input id="name" name="name" placeholder="What should we call you?" autoComplete="name" maxLength={80} />
      </Field>

      <div className="grid gap-5 sm:grid-cols-2">
        <Field label="Birth date" htmlFor="date" hint={state.fieldErrors?.date}>
          <Input
            id="date"
            name="date"
            type="date"
            required
            max={TODAY}
            aria-invalid={state.fieldErrors?.date ? true : undefined}
            className={state.fieldErrors?.date ? "border-cinnabar/60" : undefined}
          />
        </Field>

        <Field
          label="Birth time"
          htmlFor="time"
          hint={
            timeUnknown
              ? "We'll compute your day pillar precisely; hour-based detail won't be available."
              : state.fieldErrors?.time
          }
        >
          <Input
            id="time"
            name="time"
            type="time"
            disabled={timeUnknown}
            required={!timeUnknown}
            aria-invalid={state.fieldErrors?.time ? true : undefined}
            className={cn("disabled:opacity-40", state.fieldErrors?.time ? "border-cinnabar/60" : undefined)}
          />
        </Field>
      </div>

      <label className="-mt-2 flex items-center gap-2.5 text-sm text-muted">
        <input
          type="checkbox"
          name="timeUnknown"
          checked={timeUnknown}
          onChange={(e) => setTimeUnknown(e.target.checked)}
          className="h-4 w-4 rounded border border-hairline bg-graphite accent-gold"
        />
        I don&apos;t know my birth time
      </label>

      <Field
        label="Gender"
        htmlFor="gender-male"
        hint="Used to determine your luck-cycle (大运) direction in traditional BaZi — the sequence runs forward or backward depending on gender and your birth year. Not shown anywhere else."
      >
        <div className="flex items-center gap-5">
          <label className="flex items-center gap-2 text-sm text-text">
            <input
              type="radio"
              id="gender-male"
              name="gender"
              value="male"
              defaultChecked
              className="h-4 w-4 border border-hairline bg-graphite accent-gold"
            />
            Male
          </label>
          <label className="flex items-center gap-2 text-sm text-text">
            <input type="radio" name="gender" value="female" className="h-4 w-4 border border-hairline bg-graphite accent-gold" />
            Female
          </label>
        </div>
      </Field>

      <Field label="Birthplace" htmlFor="city-input" hint={state.fieldErrors?.cityId}>
        <div className="relative">
          <Input
            id="city-input"
            role="combobox"
            aria-expanded={open}
            aria-controls={listboxId}
            aria-autocomplete="list"
            aria-activedescendant={activeIndex >= 0 ? `${listboxId}-${activeIndex}` : undefined}
            aria-invalid={state.fieldErrors?.cityId ? true : undefined}
            autoComplete="off"
            placeholder="Start typing a city…"
            value={query}
            onChange={(e) => {
              const value = e.target.value;
              setQuery(value);
              setSelectedCity(null);
              if (value.trim().length < 2) {
                setResults([]);
                setOpen(false);
              }
            }}
            onKeyDown={onCityKeyDown}
            onFocus={() => results.length > 0 && setOpen(true)}
            onBlur={() => setTimeout(() => setOpen(false), 120)}
            className={cn("w-full", state.fieldErrors?.cityId ? "border-cinnabar/60" : undefined)}
          />
          {open && results.length > 0 && (
            <ul
              id={listboxId}
              role="listbox"
              aria-label="City suggestions"
              className="absolute z-10 mt-1.5 max-h-64 w-full overflow-auto rounded-lg border border-hairline bg-raised py-1"
            >
              {results.map((city, i) => (
                <li
                  key={city.id}
                  id={`${listboxId}-${i}`}
                  role="option"
                  aria-selected={i === activeIndex}
                  className={cn(
                    "cursor-pointer px-3.5 py-2 text-sm transition-colors duration-150 ease-out-expo",
                    i === activeIndex ? "bg-graphite text-ink" : "text-text"
                  )}
                  onMouseDown={(e) => {
                    e.preventDefault();
                    selectCity(city);
                  }}
                  onMouseEnter={() => setActiveIndex(i)}
                >
                  {cityLabel(city)}
                </li>
              ))}
            </ul>
          )}
        </div>
        <input type="hidden" name="cityId" value={selectedCity?.id ?? ""} />
      </Field>

      {state.error && (
        <p role="alert" className="text-sm text-cinnabar">
          {state.error}
        </p>
      )}

      <SubmitButton citySelected={selectedCity !== null} />
    </form>
  );
}
