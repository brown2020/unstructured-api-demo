import type { Chunk } from "@/types";
import { UnstructuredService } from "@/lib/unstructured-client";
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
  DEMO_UNCONFIGURED_BANNER,
  classifyUpstreamFailure,
  demoBannerForFailure,
  friendlyParseMessage,
} from "@/lib/parse-errors";
import { authorizeParse, type HeaderReader } from "@/lib/parse-guard";

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
    const config = UnstructuredService.getConfig();
    const service = new UnstructuredService(config);
    const elements = await service.parseDocument(
      buffer,
      filename,
      process.env.UNSTRUCTURED_HI_RES === "true",
    );
    const chunks = organizeElementsIntoChunks(elements);
    if (chunks.length === 0) {
      return failure(422, "No readable content found.");
    }
    return {
      status: 200,
      body: { ok: true, message: null, chunks, demoMessage: null },
    };
  } catch (error) {
    const upstream = classifyUpstreamFailure(error);
    if (upstream.demoFallback) {
      return demoResult(
        filename,
        upstream.status,
        false,
        upstream.message,
        demoBannerForFailure(upstream),
      );
    }
    return failure(upstream.status, upstream.message);
  }
}
