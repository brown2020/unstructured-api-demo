"use server";

import { headers } from "next/headers";
import { Chunk } from "@/types";
import { UnstructuredService } from "@/lib/unstructured-client";
import {
  organizeElementsIntoChunks,
  processFileUpload,
} from "@/lib/document-utils";
import {
  fixtureChunks,
  unstructuredFixturesEnabled,
} from "@/lib/unstructured-fixtures";
import { friendlyParseMessage } from "@/lib/parse-errors";
import { authorizeParse } from "@/lib/parse-guard";

export type ParseFileResult =
  | { ok: true; chunks: Chunk[] }
  | { ok: false; message: string };

/**
 * Server Action: authorize the caller, validate the upload, then partition.
 * Validation always runs before the fixture short-circuit so denial proofs stay honest.
 * Failures are returned as data. Thrown Server Action errors are redacted in production,
 * which previously replaced every friendly message with a minified React error.
 * Hi-Res is server-only (`UNSTRUCTURED_HI_RES=true`); callers cannot select it.
 */
export async function parseFile(formData: FormData): Promise<ParseFileResult> {
  try {
    const decision = authorizeParse(await headers());
    if (!decision.ok) return decision;

    const { buffer, filename } = await processFileUpload(formData);

    if (unstructuredFixturesEnabled()) {
      return { ok: true, chunks: fixtureChunks(filename) };
    }

    const config = UnstructuredService.getConfig();
    const service = new UnstructuredService(config);
    const elements = await service.parseDocument(
      buffer,
      filename,
      process.env.UNSTRUCTURED_HI_RES === "true",
    );
    const chunks = organizeElementsIntoChunks(elements);
    if (chunks.length === 0) {
      return { ok: false, message: "No readable content found." };
    }
    return { ok: true, chunks };
  } catch (error) {
    return { ok: false, message: friendlyParseMessage(error) };
  }
}
