"use server";

import { headers } from "next/headers";
import type { Chunk } from "@/types";
import { runParse } from "@/lib/run-parse";

export type ParseFileResult =
  | { ok: true; chunks: Chunk[]; demoMessage: string | null }
  | { ok: false; message: string; chunks: Chunk[] | null; demoMessage: string | null };

/**
 * Server Action wrapper around the same parse path as POST /api/parse.
 * The upload UI uses the route so HTTP status codes reach the browser.
 * Hi-Res is server-only (`UNSTRUCTURED_HI_RES=true`); callers cannot select it.
 */
export async function parseFile(formData: FormData): Promise<ParseFileResult> {
  const outcome = await runParse(await headers(), formData);
  if (!outcome.body.ok && !outcome.body.chunks) {
    return {
      ok: false,
      message: outcome.body.message ?? "The parsing service is unavailable.",
      chunks: null,
      demoMessage: null,
    };
  }
  return {
    ok: true,
    chunks: outcome.body.chunks ?? [],
    demoMessage: outcome.body.demoMessage,
  };
}
