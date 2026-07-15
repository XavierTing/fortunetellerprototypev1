import type { ReactNode } from "react";
import { Tag } from "./badge";
import { cn } from "./cn";

interface PaywallSlotProps {
  /** Short name for the future paywall boundary, e.g. "Full natal book". */
  label: string;
  /** One line of context shown next to the marker. */
  note?: string;
  children?: ReactNode;
  className?: string;
}

/**
 * PaywallSlot — a designed-but-UNLOCKED marker for a future freemium
 * boundary (PRD §7.6: "In the prototype everything is unlocked; wall
 * points are marked with a PaywallSlot component so they're trivial to
 * switch on later"). It renders a small "Premium" tag and a one-line note
 * ABOVE whatever it wraps; the wrapped content always renders, unlocked —
 * this component only marks *where* a gate would eventually sit, it never
 * hides anything.
 *
 * FUTURE PAYWALL BOUNDARY: when real billing lands, this is the seam to
 * wrap with an actual entitlement check (e.g. `{entitled ? children :
 * <UpsellCard />}`) — do not add conditional-rendering/gating logic to
 * this component itself; keep it a pure, always-visible marker so every
 * call site stays a trivial diff away from "on."
 *
 * Deliberately restrained per DESIGN.md: a dashed top hairline (not a
 * side-stripe — those are a named anti-pattern) and the kit's existing
 * gold "Premium" tag vocabulary (Badge's own doc comment: "gold =
 * premium/featured") rather than an invented banner/ribbon treatment.
 */
export function PaywallSlot({ label, note, children, className }: PaywallSlotProps) {
  return (
    <div className={cn("flex flex-col gap-4", className)}>
      <div className="flex flex-wrap items-baseline gap-x-2.5 gap-y-1 border-t border-dashed border-hairline-gold pt-5">
        <Tag variant="gold">Premium</Tag>
        <span className="font-mono text-[0.66rem] font-medium tracking-[0.1em] text-faint uppercase">{label}</span>
        {note ? <span className="text-xs leading-relaxed text-faint">{note}</span> : null}
      </div>
      {children}
    </div>
  );
}
