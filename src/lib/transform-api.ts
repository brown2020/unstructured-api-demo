import "server-only";

import type { Element } from "@/types";
import {
  BAD_KEY_MESSAGE,
  OUT_OF_CREDITS_MESSAGE,
  RATE_LIMIT_MESSAGE,
  UNAVAILABLE_MESSAGE,
  UNSUPPORTED_TYPE_MESSAGE,
} from "@/lib/parse-errors";

export const DEFAULT_TRANSFORM_BASE = "https://transform.unstructured.io/api/v2";
export const TRANSFORM_WAIT_SECONDS = 60;
export const TRANSFORM_OVERALL_TIMEOUT_MS = 110_000;

const LEGACY_HOST = "api.unstructuredapp.io";
const JOB_PATH = "/api/v2/jobs/";

export class TransformRequestError extends Error {
  readonly statusCode: number;
  readonly demoFallback: boolean;

  constructor(statusCode: number, message: string, demoFallback = false) {
    super(message);
    this.name = "TransformRequestError";
    this.statusCode = statusCode;
    this.demoFallback = demoFallback;
  }
}

export function resolveTransformBase(raw: string | undefined): string {
  const trimmed = raw?.trim() ?? "";
  if (!trimmed) return DEFAULT_TRANSFORM_BASE;

  let url: URL;
  try {
    url = new URL(trimmed);
  } catch {
    throw new TransformRequestError(503, UNAVAILABLE_MESSAGE);
  }

  if (url.protocol !== "https:" && url.protocol !== "http:") {
    throw new TransformRequestError(503, UNAVAILABLE_MESSAGE);
  }

  const path = url.pathname.replace(/\/+$/, "");
  if (
    url.hostname.toLowerCase() === LEGACY_HOST ||
    path.includes("/general/v0/general")
  ) {
    return DEFAULT_TRANSFORM_BASE;
  }

  const withoutParse = path.endsWith("/parse") ? path.slice(0, -"/parse".length) : path;
  url.pathname = withoutParse || "/";
  url.search = "";
  url.hash = "";
  if (url.pathname === "/") return url.origin;
  return `${url.origin}${url.pathname.replace(/\/+$/, "")}`;
}

export function resolvePollUrl(
  base: string,
  location: string | null,
  pollUrl: unknown,
): string {
  const baseURL = new URL(base.endsWith("/") ? base : `${base}/`);
  const candidate =
    (typeof pollUrl === "string" && pollUrl.trim()) || location?.trim() || "";
  if (!candidate) {
    throw new TransformRequestError(503, UNAVAILABLE_MESSAGE);
  }

  let resolved: URL;
  try {
    resolved = new URL(candidate, baseURL.origin);
  } catch {
    throw new TransformRequestError(503, UNAVAILABLE_MESSAGE);
  }

  if (resolved.origin !== baseURL.origin || !resolved.pathname.startsWith(JOB_PATH)) {
    throw new TransformRequestError(503, UNAVAILABLE_MESSAGE);
  }

  resolved.search = "";
  resolved.hash = "";
  return resolved.toString();
}

function mimeForFilename(filename: string): string {
  const extension = filename.split(".").pop()?.toLowerCase() ?? "";
  switch (extension) {
    case "bmp":
      return "image/bmp";
    case "docx":
      return "application/vnd.openxmlformats-officedocument.wordprocessingml.document";
    case "heic":
      return "image/heic";
    case "jpg":
    case "jpeg":
      return "image/jpeg";
    case "png":
      return "image/png";
    case "pptx":
      return "application/vnd.openxmlformats-officedocument.presentationml.presentation";
    case "tiff":
      return "image/tiff";
    default:
      return "application/pdf";
  }
}

function asRecord(value: unknown): Record<string, unknown> | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) return null;
  return value as Record<string, unknown>;
}

function payloadHints(payload: unknown): { code: string; message: string } {
  const root = asRecord(payload);
  const nested = asRecord(root?.error) ?? root;
  const code = typeof nested?.code === "string" ? nested.code : "";
  const message =
    typeof nested?.message === "string" ? nested.message.slice(0, 500) : "";
  return { code, message };
}

function mentionsCredits(code: string, message: string): boolean {
  if (code === "quota_exceeded") return true;
  return /\bcredits?\b|\bquota\b|\bbilling\b|\bpayment required\b/i.test(message);
}

export function classifyTransformStatus(
  status: number,
  payload: unknown,
): TransformRequestError {
  const { code, message } = payloadHints(payload);
  if (status === 402 || mentionsCredits(code, message)) {
    return new TransformRequestError(402, OUT_OF_CREDITS_MESSAGE, true);
  }
  if (status === 401 || status === 403 || code === "unauthorized" || code === "forbidden") {
    return new TransformRequestError(status === 403 ? 403 : 401, BAD_KEY_MESSAGE, false);
  }
  if (status === 415 || code === "unsupported_file_type") {
    return new TransformRequestError(415, UNSUPPORTED_TYPE_MESSAGE, false);
  }
  if (status === 429 || code === "rate_limited") {
    return new TransformRequestError(429, RATE_LIMIT_MESSAGE, false);
  }
  if (status === 413 || code === "file_too_large") {
    return new TransformRequestError(
      413,
      "The document is too large for the parsing service. Try a smaller file (under 4MB).",
      false,
    );
  }
  return new TransformRequestError(status >= 500 ? 503 : 503, UNAVAILABLE_MESSAGE, false);
}

export function elementsFromTransformPayload(
  payload: unknown,
  filename: string,
): Element[] {
  const root = asRecord(payload);
  const result = asRecord(root?.result) ?? root;
  const source = asRecord(result?.source);
  const sourceName =
    typeof source?.filename === "string" && source.filename.trim()
      ? source.filename
      : filename;
  const rawElements = Array.isArray(result?.elements) ? result.elements : [];
  const mapped = rawElements.flatMap((item, index) => {
    const element = toElement(item, sourceName, index);
    return element ? [element] : [];
  });
  if (mapped.length > 0) return mapped;

  const markdown = typeof result?.markdown === "string" ? result.markdown.trim() : "";
  if (!markdown) return [];
  return [
    {
      type: "NarrativeText",
      element_id: "transform-markdown",
      text: markdown,
      metadata: {
        filetype: mimeForFilename(sourceName),
        languages: ["eng"],
        page_number: 1,
        filename: sourceName,
      },
    },
  ];
}

function toElement(value: unknown, filename: string, index: number): Element | null {
  const record = asRecord(value);
  if (!record || typeof record.type !== "string" || !record.type.trim()) return null;
  const metadata = asRecord(record.metadata);
  const page =
    typeof metadata?.page_number === "number" && metadata.page_number > 0
      ? metadata.page_number
      : 1;
  const text = typeof record.text === "string" ? record.text : undefined;
  const html = typeof metadata?.text_as_html === "string" ? metadata.text_as_html : "";
  return {
    type: record.type,
    element_id:
      typeof record.element_id === "string" && record.element_id.trim()
        ? record.element_id
        : `transform-${index + 1}`,
    text: text && text.trim() ? text : html || undefined,
    metadata: {
      filetype: mimeForFilename(filename),
      languages: ["eng"],
      page_number: page,
      filename,
    },
  };
}

function isTimeout(error: unknown): boolean {
  if (!error || typeof error !== "object") return false;
  const name = (error as { name?: string }).name;
  return name === "TimeoutError" || name === "AbortError";
}

async function readJson(response: Response): Promise<unknown> {
  try {
    return await response.json();
  } catch {
    return null;
  }
}

function jobStatus(payload: unknown): string {
  const root = asRecord(payload);
  return typeof root?.status === "string" ? root.status : "";
}

function isPending(status: string): boolean {
  return status === "queued" || status === "processing";
}

function isFinished(status: string): boolean {
  return status === "completed" || status === "completed_with_warnings";
}

async function sleep(ms: number, sleepImpl?: (ms: number) => Promise<void>) {
  if (sleepImpl) {
    await sleepImpl(ms);
    return;
  }
  await new Promise((resolve) => setTimeout(resolve, ms));
}

export async function parseWithTransform(options: {
  buffer: ArrayBuffer;
  filename: string;
  apiKey: string;
  baseURL: string;
  fetchImpl?: typeof fetch;
  sleepImpl?: (ms: number) => Promise<void>;
  overallTimeoutMs?: number;
  now?: () => number;
}): Promise<Element[]> {
  const fetchImpl = options.fetchImpl ?? fetch;
  const now = options.now ?? Date.now;
  const deadline = now() + (options.overallTimeoutMs ?? TRANSFORM_OVERALL_TIMEOUT_MS);
  const base = options.baseURL.replace(/\/+$/, "");

  const form = new FormData();
  form.append(
    "input",
    new File([options.buffer], options.filename, {
      type: mimeForFilename(options.filename),
    }),
  );
  form.append("output", "elements");

  let first: Response;
  try {
    first = await fetchImpl(`${base}/parse`, {
      method: "POST",
      headers: {
        "unstructured-api-key": options.apiKey,
        Prefer: `wait=${TRANSFORM_WAIT_SECONDS}`,
        Accept: "application/json",
      },
      body: form,
      signal: AbortSignal.timeout(Math.max(1, Math.min(70_000, deadline - now()))),
    });
  } catch (error) {
    if (isTimeout(error)) throw new TransformRequestError(504, UNAVAILABLE_MESSAGE);
    throw new TransformRequestError(503, UNAVAILABLE_MESSAGE);
  }

  const firstPayload = await readJson(first);
  if (first.status === 200) {
    return requireElements(firstPayload, options.filename);
  }
  if (first.status !== 202) {
    throw classifyTransformStatus(first.status, firstPayload);
  }

  const pollUrl = resolvePollUrl(
    base,
    first.headers.get("location"),
    asRecord(firstPayload)?.poll_url,
  );

  let delay = 500;
  while (now() < deadline) {
    const remaining = deadline - now();
    let response: Response;
    try {
      response = await fetchImpl(pollUrl, {
        method: "GET",
        headers: {
          "unstructured-api-key": options.apiKey,
          Accept: "application/json",
        },
        signal: AbortSignal.timeout(Math.max(1, Math.min(15_000, remaining))),
      });
    } catch (error) {
      if (isTimeout(error)) throw new TransformRequestError(504, UNAVAILABLE_MESSAGE);
      throw new TransformRequestError(503, UNAVAILABLE_MESSAGE);
    }

    const payload = await readJson(response);
    if (response.status === 200 || response.status === 202) {
      const status = jobStatus(payload);
      if (isPending(status) || response.status === 202) {
        await sleep(Math.min(delay, Math.max(0, deadline - now())), options.sleepImpl);
        delay = Math.min(delay * 2, 4_000);
        continue;
      }
      if (isFinished(status) || !status) {
        return requireElements(payload, options.filename);
      }
      if (status === "failed" || status === "cancelled") {
        throw classifyTransformStatus(502, asRecord(payload)?.error ?? payload);
      }
    }

    throw classifyTransformStatus(response.status, payload);
  }

  throw new TransformRequestError(504, UNAVAILABLE_MESSAGE);
}

function requireElements(payload: unknown, filename: string): Element[] {
  const elements = elementsFromTransformPayload(payload, filename);
  if (elements.length === 0) {
    throw new TransformRequestError(422, "No readable content found.");
  }
  return elements;
}
