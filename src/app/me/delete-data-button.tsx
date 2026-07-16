"use client";

/**
 * Confirm-before-delete control for `deleteMyData` (see `./actions.ts`).
 * A plain `<form action={...}>` (the canonical, redirect()-safe way to
 * invoke a Server Action from a Client Component — see Next.js's Server
 * Actions guide) gated by a native `window.confirm` on submit rather than
 * a custom modal: this is a single, irreversible, no-follow-up-fields
 * action, so a confirm dialog is enough friction without new UI surface.
 * `action` is the Server Action passed down as a prop from the Server
 * Component page (`page.tsx`) — Next.js transparently serializes a
 * "use server" function reference across that boundary.
 */
import { useFormStatus } from "react-dom";
import { Button } from "@/components/ui";

const CONFIRM_MESSAGE =
  "Delete all your saved data? This permanently removes your chart, readings, Master conversations, and compatibility checks. This can't be undone.";

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" variant="secondary" tone="cinnabar" size="sm" disabled={pending}>
      {pending ? "Deleting…" : "Delete my data"}
    </Button>
  );
}

export function DeleteDataButton({ action }: { action: () => Promise<void> }) {
  return (
    <form
      action={action}
      onSubmit={(e) => {
        if (!window.confirm(CONFIRM_MESSAGE)) {
          e.preventDefault();
        }
      }}
    >
      <SubmitButton />
    </form>
  );
}
