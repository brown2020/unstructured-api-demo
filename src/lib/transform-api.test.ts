import { describe, expect, it } from "vitest";
import {
  DEFAULT_TRANSFORM_BASE,
  classifyTransformStatus,
  elementsFromTransformPayload,
  parseWithTransform,
  resolvePollUrl,
  resolveTransformBase,
} from "./transform-api";
import { BAD_KEY_MESSAGE, OUT_OF_CREDITS_MESSAGE, UNSUPPORTED_TYPE_MESSAGE } from "./parse-errors";

const SECRET = "super-secret-key-value";

function jsonResponse(status: number, body: unknown, headers?: Record<string, string>) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "content-type": "application/json", ...headers },
  });
}

const completedElements = {
  id: "job-1",
  status: "completed",
  markdown: null,
  elements: [
    {
      element_id: "e1",
      type: "Title",
      text: "SYNTHETIC TEST INVOICE",
      metadata: { page_number: 1, coordinates: null, text_as_html: null },
    },
    {
      element_id: "e2",
      type: "NarrativeText",
      text: "Invoice number: DEMO-001",
      metadata: { page_number: 1 },
    },
  ],
  source: { filename: "invoice.pdf" },
};

describe("resolveTransformBase", () => {
  it("defaults and rewrites the legacy partition URL to the Transform base", () => {
    expect(resolveTransformBase(undefined)).toBe(DEFAULT_TRANSFORM_BASE);
    expect(resolveTransformBase("")).toBe(DEFAULT_TRANSFORM_BASE);
    expect(
      resolveTransformBase("https://api.unstructuredapp.io/general/v0/general"),
    ).toBe(DEFAULT_TRANSFORM_BASE);
    expect(resolveTransformBase("https://transform.unstructured.io/api/v2/parse")).toBe(
      DEFAULT_TRANSFORM_BASE,
    );
  });
});

describe("elementsFromTransformPayload", () => {
  it("maps a completed elements payload and a polled result wrapper", () => {
    const direct = elementsFromTransformPayload(completedElements, "upload.pdf");
    expect(direct[0]?.type).toBe("Title");
    expect(direct[0]?.text).toBe("SYNTHETIC TEST INVOICE");
    expect(direct[0]?.metadata.page_number).toBe(1);
    expect(direct[0]?.metadata.filename).toBe("invoice.pdf");

    const wrapped = elementsFromTransformPayload(
      { status: "completed", result: completedElements },
      "upload.pdf",
    );
    expect(wrapped).toHaveLength(2);
  });
});

describe("parseWithTransform", () => {
  const calls: Array<{ url: string; init: RequestInit }> = [];

  async function run(fetchImpl: typeof fetch) {
    calls.length = 0;
    return parseWithTransform({
      buffer: new TextEncoder().encode("%PDF").buffer,
      filename: "quarterly.pdf",
      apiKey: SECRET,
      baseURL: DEFAULT_TRANSFORM_BASE,
      fetchImpl,
      sleepImpl: async () => {},
    });
  }

  function record(fetchImpl: (url: string, init: RequestInit) => Promise<Response>): typeof fetch {
    return (async (url: RequestInfo | URL, init?: RequestInit) => {
      const href = String(url);
      calls.push({ url: href, init: init ?? {} });
      return fetchImpl(href, init ?? {});
    }) as typeof fetch;
  }

  it("posts multipart input and maps a 200 elements body", async () => {
    const elements = await run(
      record(async () => jsonResponse(200, completedElements)),
    );
    expect(elements[0]?.text).toBe("SYNTHETIC TEST INVOICE");
    expect(calls[0]?.url).toBe(`${DEFAULT_TRANSFORM_BASE}/parse`);
    const headers = calls[0]?.init.headers as Record<string, string>;
    expect(headers.Prefer).toBe("wait=60");
    expect(headers["unstructured-api-key"]).toBe(SECRET);
    const form = calls[0]?.init.body as FormData;
    expect(form.get("output")).toBe("elements");
    const input = form.get("input");
    expect(input).toBeInstanceOf(File);
    expect((input as File).name).toBe("quarterly.pdf");
  });

  it("polls Location after 202 until the job result is ready", async () => {
    let attempt = 0;
    const elements = await run(
      record(async (url) => {
        attempt += 1;
        if (url.endsWith("/parse")) {
          return jsonResponse(
            202,
            {
              id: "job-1",
              status: "queued",
              poll_url: `${DEFAULT_TRANSFORM_BASE}/jobs/job-1`,
            },
            { Location: "/api/v2/jobs/job-1" },
          );
        }
        expect(url).toBe(`${DEFAULT_TRANSFORM_BASE}/jobs/job-1`);
        return jsonResponse(200, { status: "completed", result: completedElements });
      }),
    );
    expect(attempt).toBe(2);
    expect(elements[1]?.text).toBe("Invoice number: DEMO-001");
    const pollHeaders = calls[1]?.init.headers as Record<string, string>;
    expect(pollHeaders["unstructured-api-key"]).toBe(SECRET);
    expect(resolvePollUrl(DEFAULT_TRANSFORM_BASE, "/api/v2/jobs/job-1", null)).toBe(
      `${DEFAULT_TRANSFORM_BASE}/jobs/job-1`,
    );
  });

  it("maps 401 without returning the upstream body", async () => {
    await expect(
      run(
        record(async () =>
          jsonResponse(401, { code: "unauthorized", message: `invalid ${SECRET}` }),
        ),
      ),
    ).rejects.toMatchObject({ statusCode: 401, message: BAD_KEY_MESSAGE, demoFallback: false });
  });

  it("maps 402 and a quota message to out of credits", async () => {
    await expect(
      run(
        record(async () =>
          jsonResponse(402, { code: "quota_exceeded", message: `no credits ${SECRET}` }),
        ),
      ),
    ).rejects.toMatchObject({
      statusCode: 402,
      message: OUT_OF_CREDITS_MESSAGE,
      demoFallback: true,
    });

    expect(classifyTransformStatus(429, { message: `quota exceeded ${SECRET}` }).demoFallback).toBe(
      true,
    );
    expect(classifyTransformStatus(429, { message: `quota exceeded ${SECRET}` }).message).toBe(
      OUT_OF_CREDITS_MESSAGE,
    );
    expect(classifyTransformStatus(429, { code: "rate_limited", message: "slow down" }).message).not.toContain(
      SECRET,
    );
  });

  it("maps 415 to the unsupported-file message", async () => {
    await expect(
      run(
        record(async () =>
          jsonResponse(415, { code: "unsupported_file_type", message: `nope ${SECRET}` }),
        ),
      ),
    ).rejects.toMatchObject({
      statusCode: 415,
      message: UNSUPPORTED_TYPE_MESSAGE,
      demoFallback: false,
    });
  });

  it("does not follow a poll URL on another host", () => {
    expect(() =>
      resolvePollUrl(DEFAULT_TRANSFORM_BASE, "https://evil.example/api/v2/jobs/job-1", null),
    ).toThrow(/unavailable/i);
  });
});
