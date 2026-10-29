"use client";

import type { Chunk } from "@/types";
import { UNAVAILABLE_MESSAGE } from "@/lib/parse-errors";

export type ClientParseResult =
  | { ok: true; chunks: Chunk[]; demoMessage: string | null; status: number }
  | { ok: false; message: string; status: number };

type ParsePayload = {
  ok?: unknown;
  message?: unknown;
  chunks?: unknown;
  demoMessage?: unknown;
};

function isChunkArray(value: unknown): value is Chunk[] {
  return Array.isArray(value);
}

function safeMessage(message: unknown, status: number): string {
  if (typeof message !== "string" || message.length === 0 || message.length > 300) {
    return status === 429 ? "The parsing quota or rate limit was reached. Try again later." : UNAVAILABLE_MESSAGE;
  }
  if (/bearer\s+|api[_-]?key\s*[:=]/i.test(message)) {
    return UNAVAILABLE_MESSAGE;
  }
  return message;
}

function safeDemoMessage(message: unknown): string | null {
  if (typeof message !== "string" || !message.startsWith("Demo mode:")) return null;
  if (message.length > 300) return "Demo mode: sample results";
  return message;
}

export async function postParse(file: File): Promise<ClientParseResult> {
  const formData = new FormData();
  formData.append("file", file);

  let response: Response;
  try {
    response = await fetch("/api/parse", { method: "POST", body: formData });
  } catch {
    return { ok: false, message: UNAVAILABLE_MESSAGE, status: 0 };
  }

  let payload: ParsePayload;
  try {
    payload = (await response.json()) as ParsePayload;
  } catch {
    return { ok: false, message: UNAVAILABLE_MESSAGE, status: response.status };
  }

  const chunks = isChunkArray(payload.chunks) ? payload.chunks : null;
  const demoMessage = safeDemoMessage(payload.demoMessage);

  if (chunks && chunks.length > 0) {
    return { ok: true, chunks, demoMessage, status: response.status };
  }

  return {
    ok: false,
    message: safeMessage(payload.message, response.status),
    status: response.status,
  };
}
