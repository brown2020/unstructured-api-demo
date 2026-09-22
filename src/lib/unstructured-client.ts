import "server-only";

import { UnstructuredClient } from "unstructured-client";
import type { PartitionResponse } from "unstructured-client/sdk/models/operations/index.js";
import { Strategy } from "unstructured-client/sdk/models/shared/index.js";
import { Element, UnstructuredConfig, ParseError } from "@/types";

/**
 * Deferred Unstructured SDK wrapper.
 * The Speakeasy client is constructed on first parseDocument call so empty-env
 * CI / SSG never initializes the SDK at module import time.
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
      throw new Error("Missing Unstructured API configuration");
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
    const parseError: ParseError = new Error(
      error instanceof Error
        ? error.message
        : "An unexpected error occurred while processing the file"
    );
    parseError.name = "ParseError";

    if (error && typeof error === "object") {
      const errorObj = error as Record<string, unknown>;
      if (typeof errorObj.statusCode === "number") {
        parseError.statusCode = errorObj.statusCode;
      } else if (typeof errorObj.status === "number") {
        parseError.statusCode = errorObj.status;
      }
      if (typeof errorObj.body === "string") {
        parseError.details = errorObj.body;
      } else if (typeof errorObj.details === "string") {
        parseError.details = errorObj.details;
      }
    }

    return parseError;
  }
}
