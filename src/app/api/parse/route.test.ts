import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";
import { POST } from "./route";
import { resetParseGuardForTests } from "@/lib/parse-guard";
import { UnstructuredService } from "@/lib/unstructured-client";
import {
  AUTH_OR_CREDIT_MESSAGE,
  QUOTA_MESSAGE,
  UNAVAILABLE_MESSAGE,
} from "@/lib/parse-errors";

const SECRET = "super-secret-key-value";

function setNodeEnv(value: string | undefined) {
  (process.env as Record<string, string | undefined>).NODE_ENV = value;
}

function pdfRequest() {
  const form = new FormData();
  form.append("file", new File(["%PDF-1.4"], "quarterly.pdf", { type: "application/pdf" }));
  return new NextRequest("https://example.com/api/parse", {
    method: "POST",
    headers: {
      origin: "https://example.com",
      host: "example.com",
      "x-forwarded-for": "198.51.100.40",
    },
    body: form,
  });
}

function upstream(status: number) {
  const error = new Error(`API error occurred: raw body ${SECRET}`);
  error.name = "UnstructuredClientError";
  return Object.assign(error, { statusCode: status, body: `raw body ${SECRET}` });
}

describe("POST /api/parse", () => {
  const prevFixture = process.env.UNSTRUCTURED_USE_FIXTURES;
  const prevKey = process.env.UNSTRUCTURED_API_KEY;
  const prevUrl = process.env.UNSTRUCTURED_API_URL;
  const prevNodeEnv = process.env.NODE_ENV;

  beforeEach(() => {
    resetParseGuardForTests();
    delete process.env.UNSTRUCTURED_USE_FIXTURES;
    delete process.env.UNSTRUCTURED_API_KEY;
    delete process.env.UNSTRUCTURED_API_URL;
    setNodeEnv("production");
    vi.restoreAllMocks();
  });

  afterEach(() => {
    if (prevFixture === undefined) delete process.env.UNSTRUCTURED_USE_FIXTURES;
    else process.env.UNSTRUCTURED_USE_FIXTURES = prevFixture;
    if (prevKey === undefined) delete process.env.UNSTRUCTURED_API_KEY;
    else process.env.UNSTRUCTURED_API_KEY = prevKey;
    if (prevUrl === undefined) delete process.env.UNSTRUCTURED_API_URL;
    else process.env.UNSTRUCTURED_API_URL = prevUrl;
    setNodeEnv(prevNodeEnv);
    vi.restoreAllMocks();
  });

  async function read(response: Response) {
    const body = await response.json();
    expect(JSON.stringify(body)).not.toContain(SECRET);
    return body as {
      ok: boolean;
      message: string | null;
      chunks: Array<{ heading: string | null; content: Array<{ text?: string }> }> | null;
      demoMessage: string | null;
    };
  }

  it("returns sample results when the key is missing, including in production", async () => {
    const response = await POST(pdfRequest());
    const body = await read(response);
    expect(response.status).toBe(200);
    expect(body.ok).toBe(true);
    expect(body.demoMessage).toBe(
      "Demo mode: sample results. The parsing service is not configured.",
    );
    expect(body.chunks?.[0]?.heading).toBe("Quarterly Operations Summary");
  });

  it("returns sample results when UNSTRUCTURED_USE_FIXTURES=true", async () => {
    process.env.UNSTRUCTURED_USE_FIXTURES = "true";
    process.env.UNSTRUCTURED_API_KEY = SECRET;
    process.env.UNSTRUCTURED_API_URL = "https://api.unstructuredapp.io/general/v0/general";
    const parseDocument = vi.spyOn(UnstructuredService.prototype, "parseDocument");

    const response = await POST(pdfRequest());
    const body = await read(response);

    expect(response.status).toBe(200);
    expect(body.demoMessage).toBe("Demo mode: sample results");
    expect(body.chunks?.[0]?.heading).toBe("Quarterly Operations Summary");
    expect(parseDocument).not.toHaveBeenCalled();
  });

  it("falls back to sample results after a 401 and keeps the status", async () => {
    process.env.UNSTRUCTURED_API_KEY = SECRET;
    process.env.UNSTRUCTURED_API_URL = "https://api.unstructuredapp.io/general/v0/general";
    vi.spyOn(UnstructuredService.prototype, "parseDocument").mockRejectedValue(upstream(401));

    const response = await POST(pdfRequest());
    const body = await read(response);

    expect(response.status).toBe(401);
    expect(body.ok).toBe(false);
    expect(body.message).toBe(AUTH_OR_CREDIT_MESSAGE);
    expect(body.demoMessage).toBe(`Demo mode: sample results. ${AUTH_OR_CREDIT_MESSAGE}`);
    expect(body.chunks?.[0]?.heading).toBe("Quarterly Operations Summary");
  });

  it("falls back after 402 and returns 429 without samples", async () => {
    process.env.UNSTRUCTURED_API_KEY = SECRET;
    process.env.UNSTRUCTURED_API_URL = "https://api.unstructuredapp.io";
    const parseDocument = vi
      .spyOn(UnstructuredService.prototype, "parseDocument")
      .mockRejectedValueOnce(upstream(402))
      .mockRejectedValueOnce(upstream(429));

    const credit = await POST(pdfRequest());
    const creditBody = await read(credit);
    expect(credit.status).toBe(402);
    expect(creditBody.demoMessage).toBe(`Demo mode: sample results. ${QUOTA_MESSAGE}`);
    expect(creditBody.chunks?.length).toBeGreaterThan(0);

    resetParseGuardForTests();
    const limited = await POST(pdfRequest());
    const limitedBody = await read(limited);
    expect(limited.status).toBe(429);
    expect(limitedBody.ok).toBe(false);
    expect(limitedBody.message).toBe(QUOTA_MESSAGE);
    expect(limitedBody.chunks).toBeNull();
    expect(limitedBody.demoMessage).toBeNull();
    expect(parseDocument).toHaveBeenCalledTimes(2);
  });

  it("returns 503 for an upstream 500 and 504 for a timeout", async () => {
    process.env.UNSTRUCTURED_API_KEY = SECRET;
    process.env.UNSTRUCTURED_API_URL = "https://api.unstructuredapp.io/general/v0/general";
    const timeout = new Error(`timed out ${SECRET}`);
    timeout.name = "RequestTimeoutError";
    vi.spyOn(UnstructuredService.prototype, "parseDocument")
      .mockRejectedValueOnce(upstream(500))
      .mockRejectedValueOnce(timeout);

    const serverError = await POST(pdfRequest());
    const serverBody = await read(serverError);
    expect(serverError.status).toBe(503);
    expect(serverBody.message).toBe(UNAVAILABLE_MESSAGE);
    expect(serverBody.chunks).toBeNull();
    expect(serverBody.demoMessage).toBeNull();

    resetParseGuardForTests();
    const timedOut = await POST(pdfRequest());
    const timedBody = await read(timedOut);
    expect(timedOut.status).toBe(504);
    expect(timedBody.message).toBe(UNAVAILABLE_MESSAGE);
    expect(timedBody.chunks).toBeNull();
  });
});
