import type { Chunk } from "@/types";
import {
  organizeElementsIntoChunks,
  processFileUpload,
} from "@/lib/document-utils";
import {
  sampleElements,
  unstructuredConfigMissing,
  unstructuredFixturesEnabled,
} from "@/lib/unstructured-fixtures";
import {
  DEMO_BANNER,
  DEMO_CREDITS_BANNER,
  DEMO_UNCONFIGURED_BANNER,
  UNAVAILABLE_MESSAGE,
  friendlyParseMessage,
} from "@/lib/parse-errors";
import { authorizeParse, type HeaderReader } from "@/lib/parse-guard";
import { parseWithTransform, resolveTransformBase, TransformRequestError } from "@/lib/transform-api";

export type ParseResponseBody = {
  ok: boolean;
  message: string | null;
  chunks: Chunk[] | null;
  demoMessage: string | null;
};

export type ParseOutcome = {
  status: number;
  body: ParseResponseBody;
};

function failure(status: number, message: string): ParseOutcome {
  return {
    status,
    body: { ok: false, message, chunks: null, demoMessage: null },
  };
}

function demoResult(
  filename: string,
  status: number,
  ok: boolean,
  message: string | null,
  demoMessage: string,
): ParseOutcome {
  return {
    status,
    body: {
      ok,
      message,
      chunks: organizeElementsIntoChunks(sampleElements(filename)),
      demoMessage,
    },
  };
}

/**
 * Authorize, validate, then partition or return sample results.
 * Validation always runs before demo mode so rejected files stay rejected.
 */
export async function runParse(
  headerBag: HeaderReader,
  formData: FormData,
): Promise<ParseOutcome> {
  const decision = authorizeParse(headerBag);
  if (!decision.ok) {
    const status = /too many/i.test(decision.message) ? 429 : 403;
    return failure(status, decision.message);
  }

  let filename: string;
  let buffer: ArrayBuffer;
  try {
    ({ buffer, filename } = await processFileUpload(formData));
  } catch (error) {
    return failure(400, friendlyParseMessage(error));
  }

  if (unstructuredFixturesEnabled()) {
    return demoResult(filename, 200, true, null, DEMO_BANNER);
  }

  if (unstructuredConfigMissing()) {
    return demoResult(filename, 200, true, null, DEMO_UNCONFIGURED_BANNER);
  }

  try {
    const elements = await parseWithTransform({
      buffer,
      filename,
      apiKey: process.env.UNSTRUCTURED_API_KEY?.trim() ?? "",
      baseURL: resolveTransformBase(process.env.UNSTRUCTURED_API_URL),
    });
    const chunks = organizeElementsIntoChunks(elements);
    if (chunks.length === 0) {
      return failure(422, "No readable content found.");
    }
    return {
      status: 200,
      body: { ok: true, message: null, chunks, demoMessage: null },
    };
  } catch (error) {
    if (error instanceof TransformRequestError && error.demoFallback) {
      return demoResult(filename, error.statusCode, false, error.message, DEMO_CREDITS_BANNER);
    }
    if (error instanceof TransformRequestError) {
      return failure(error.statusCode, error.message);
    }
    return failure(503, UNAVAILABLE_MESSAGE);
  }
}
