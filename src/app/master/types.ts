/**
 * Wire shape for a persisted chat turn, shared between the Server
 * Component (page.tsx, hydrating from the DB) and the client ChatPanel
 * (appending live turns as they stream). Deliberately narrower than the
 * Prisma `ChatMessage` row — only what the UI needs to render.
 */
export interface ChatWireMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  createdAt: string;
}
