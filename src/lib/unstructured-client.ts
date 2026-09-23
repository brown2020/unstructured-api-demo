import "server-only";

import { UnstructuredClient } from "unstructured-client";
import type { PartitionResponse } from "unstructured-client/sdk/models/operations/index.js";
import { Strategy } from "unstructured-client/sdk/models/shared/index.js";
import { Element, UnstructuredConfig, ParseError } from "@/types";
import { toFriendlyParseError } from "@/lib/parse-errors";

/**
 * Deferred Unstructured SDK wrapper.
 * The Speakeasy client is constructed on first parseDocument call so empty-env
 * CI / SSG never initializes the SDK at module import time.
 *
 * Multi-page PDFs: unstructured-client defaults splitPdfPage=true, which fans
 * out parallel per-page requests via SplitPdfHook. Failures surface as
 * "Unexpected HTTP client error: Error: Failed to send request for page N"
 * plus SDK console.error overlays. We send the whole file in one partition
 * call (splitPdfPage: false) so multi-page docs work through the API.
 */
export class UnstructuredService {
  private client: UnstructuredClient | null = null;
  private readonly config: UnstructuredConfig;

  constructor(config: UnstructuredConfig) {
    this.config = config;
  }

  static getConfig(): UnstructuredConfig {
    const apiKey = process.env.UNSTRUCTURED_API_KEY;
    const apiURL = process.env.UNSTRUCTURED_API_URL;

    if (!apiKey || !apiURL) {
      throw new Error(
        "Missing Unstructured API configuration. Set UNSTRUCTURED_API_KEY and UNSTRUCTURED_API_URL."
      );
    }

    return { apiKey, apiURL };
  }

  private getClient(): UnstructuredClient {
    if (!this.client) {
      this.client = new UnstructuredClient({
        security: { apiKeyAuth: this.config.apiKey },
        serverURL: this.config.apiURL,
      });
    }
    return this.client;
  }

  async parseDocument(
    buffer: ArrayBuffer,
    filename: string,
    isHighRes: boolean = false
  ): Promise<Element[]> {
    try {
      const partitionResponse = await this.getClient().general.partition({
        partitionParameters: {
          files: {
            content: buffer,
            fileName: filename,
          },
          strategy: isHighRes ? Strategy.HiRes : Strategy.Auto,
          // Disable SplitPdfHook parallel page requests (page-2 failure root cause).
          splitPdfPage: false,
          // Soft-fail if a future default re-enables splitting.
          splitPdfAllowFailed: true,
        },
      });

      return this.processResponse(partitionResponse);
    } catch (error) {
      throw this.createParseError(error);
    }
  }

  private processResponse(
    response: PartitionResponse | { elements?: Element[] }
  ): Element[] {
    const parsedResponse =
      typeof response === "string" ? this.parseJsonResponse(response) : response;

    const parsedElements = Array.isArray(parsedResponse)
      ? (parsedResponse as Element[])
      : this.hasElements(parsedResponse)
        ? parsedResponse.elements
        : [];

    if (parsedElements.length === 0) {
      throw new Error("No elements found in the response");
    }

    return parsedElements;
  }

  private parseJsonResponse(response: string): unknown {
    try {
      return JSON.parse(response);
    } catch {
      throw new Error("Invalid response format from API");
    }
  }

  private hasElements(response: unknown): response is { elements: Element[] } {
    return (
      typeof response === "object" &&
      response !== null &&
      "elements" in response &&
      Array.isArray(response.elements)
    );
  }

  private createParseError(error: unknown): ParseError {
    return toFriendlyParseError(error) as ParseError;
  }
}
