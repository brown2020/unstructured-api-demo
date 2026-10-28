import { describe, expect, it } from "vitest";
import { friendlyParseMessage, toFriendlyParseError } from "./parse-errors";

describe("friendlyParseMessage", () => {
  it("maps SplitPdfHook page-send failures", () => {
    const err = new Error(
      "Unexpected HTTP client error: Error: Failed to send request for page 2."
    );
    const msg = friendlyParseMessage(err);
    expect(msg).toMatch(/page|Unstructured|API key|network|PDF/i);
    expect(msg).not.toMatch(/Unexpected HTTP client error/i);
  });

  it("maps missing API configuration", () => {
    const msg = friendlyParseMessage(
      new Error(
        "Missing Unstructured API configuration. Set UNSTRUCTURED_API_KEY and UNSTRUCTURED_API_URL."
      )
    );
    expect(msg).toMatch(/UNSTRUCTURED_API_KEY/i);
  });

  it("maps connection failures", () => {
    const err = new Error("Unable to make request");
    err.name = "ConnectionError";
    expect(friendlyParseMessage(err)).toMatch(/reach|network|URL/i);
  });

  it("hides production server-action redaction", () => {
    const msg = friendlyParseMessage(
      new Error(
        "Minified React error #441; visit https://react.dev/errors/441 for the full message or use the non-minified dev environment for full errors and additional helpful warnings.",
      ),
    );
    expect(msg).not.toMatch(/minified react error/i);
    expect(msg).toMatch(/couldn't parse|API key/i);
  });

  it("preserves short human messages", () => {
    expect(
      friendlyParseMessage(
        new Error("Unsupported file type. Please upload a PDF or image file.")
      )
    ).toBe("Unsupported file type. Please upload a PDF or image file.");
  });
});

describe("toFriendlyParseError", () => {
  it("returns ParseError with friendly message", () => {
    const err = toFriendlyParseError(
      new Error(
        "Unexpected HTTP client error: Error: Failed to send request for page 2."
      )
    );
    expect(err.name).toBe("ParseError");
    expect(err.message).not.toMatch(/Unexpected HTTP/i);
  });
});
