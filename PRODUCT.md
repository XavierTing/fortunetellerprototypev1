# Product

## Register

product

## Platform

web

## Users

**Primary — "The Curious Skeptic" (Maya, late-20s, US/UK/AU).** Design-literate, already uses Co-Star or The Pattern, curious about Chinese culture but arrives with zero 八字 vocabulary. Wants insight that feels smart and specific enough to screenshot, doesn't require belief to enjoy, and bounces instantly from jargon or a paywall before the first payoff.

**Secondary — "The Self-Knowledge Seeker" (Daniel, early-30s).** Wellness- and journaling-adjacent. Wants depth and reflection, will read a substantial report, and values a non-fatalistic, growth-oriented tone over a quick horoscope hit.

**Tertiary — "The Diaspora Returner" (Grace, early-30s).** Chinese heritage, English-first, curious about a system she never learned. Trusts authenticity signals (correct calendar math, real terminology available on request) and shares into mixed-language friend groups.

**Anti-persona:** the practitioner who wants a raw 排盘 calculator with every 神煞 exposed. Cinnabar is not a professional tool — that reader is actively better served elsewhere, and building for them would dilute the plain-English promise for everyone else.

## Product Purpose

Cinnabar is the Chinese astrology app that explains itself. It computes an authentic 八字 (BaZi / Four Pillars) chart deterministically — correct calendar math, true solar time, timezone and historical DST resolved automatically — then has an AI voice interpret that chart in native, plain English. The chart is calculated, never guessed; the model interprets, it never invents chart facts. Success is a visitor who gets one true-feeling, specific insight in under 30 seconds with no signup, keeps reading because the voice feels like a smart, honest friend rather than a fortune-cookie, and comes back the next day or shares a result with someone else.

## Positioning

The Chinese astrology app that is simultaneously beautiful, accessible to someone with zero background, authentically computed, and built to be shared — an intersection none of the existing options (Chinese-only incumbents, polished-but-translated AI apps, bare practitioner calculators) currently occupy.

## Brand Personality

Cinnabar reads as a warm, precise teacher, not a mystic and not a cold calculator: a 师傅 (master) who is knowledgeable, a little wry, and never a sycophant or a doom-monger. It explains before it dumps jargon — plain English first, 八字 terminology available a tap away for anyone who wants it, always with pinyin and a gloss. Every reading resolves into something the reader can act on; prediction without agency is the failure mode this product exists to avoid.

Three-word personality: **grounded, warm, direct.**

## Anti-references

- **Fear-marketed or cluttered incumbents** (the Chinese-market apps this product studied): dense grids, doom-forward copy, no onboarding for a reader with zero vocabulary. Cinnabar leads with plain English, never fatalism.
- **Localized-not-native AI voice**: translated-Chinese phrasing tells, generic horoscope filler that ignores the reader's actual chart. Every line must be traceable to the reader's real pillars.
- **Bare-calculator tools**: correct output with no packaging, warmth, or narrative — respected by practitioners, useless to a first-time visitor.
- **Generic AI-tool visual tells**: purple-galaxy gradients, glowing crystal-ball clichés, glassmorphism, neon-on-black. See DESIGN.md (**朱墨 — Cinnabar & Ink**: near-white washi paper, sumi ink, one cinnabar seal, light by default) for the full visual anti-pattern list this product actively avoids.
- **Dark-pattern monetization**: freemium placements are designed into the UI, never enforced through guilt, urgency copy, or hidden cancellation flows.

## Design Principles

1. **Explain, don't dump.** Lead with what a reading means for the reader's life, never with unglossed terminology. Jargon is an opt-in layer, not the front door.
2. **Agency over fate.** Every reading ends in something the reader can do. Prescriptive beats predictive, always.
3. **Calculated, not guessed.** The chart is deterministic and correct; only the interpretation is generated. This is both the quality bar and the trust story.
4. **Native English, by design.** The voice is engineered for a native-English reader, not translated for one — this is the product's most defensible, most copyable-if-we-slip gap.
5. **Share-native.** Every meaningful output — a reading, a daily card, a compatibility result — is built to be beautiful enough to screenshot and send, not bolted on after the fact.

## Accessibility & Inclusion

WCAG AA contrast in both themes (verified with real contrast checks against the OKLCH token system in DESIGN.md, not eyeballed). All interactive elements keyboard-navigable with a visible focus state. `prefers-reduced-motion` respected for every animation, with an instant or crossfade alternative. No horizontal body scroll on any breakpoint, including generated share-card imagery. Fortune-telling content is framed for entertainment and self-reflection, never as medical, legal, or financial advice — the product actively redirects those asks rather than answering them in character.
