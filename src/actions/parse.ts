"use server";

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
import { toFriendlyParseError } from "@/lib/parse-errors";

/**
 * Server Action: validate upload, then partition via Unstructured (or fixtures).
 * Validation always runs before the fixture short-circuit so denial proofs stay honest.
 * API keys never leave the server; fixtures avoid burning paid credits in CI / app-eval.
 *
 * Network / SDK failures are mapped to friendly ParseErrors (no opaque
 * "Unexpected HTTP client error: Failed to send request for page N").
 */
export async function parseFile(
  formData: FormData,
  isHighRes: boolean = false
): Promise<Chunk[]> {
  try {
    // Authoritative validation first (deny bad uploads even when fixtures are on)
    const { buffer, filename } = await processFileUpload(formData);

    if (unstructuredFixturesEnabled()) {
      return fixtureChunks(filename);
    }

    const config = UnstructuredService.getConfig();
    const service = new UnstructuredService(config);
    const elements = await service.parseDocument(buffer, filename, isHighRes);
    return organizeElementsIntoChunks(elements);
  } catch (error) {
    // Soft-catch: always surface a friendly Error (never raw SDK / network objects)
    throw toFriendlyParseError(error);
  }
}
