import { UnstructuredClient } from "unstructured-client";
import { Strategy } from "unstructured-client/sdk/models/shared/index.js";
import { Element, UnstructuredConfig, ParseError } from "@/types";

export class UnstructuredService {
  private client: UnstructuredClient;

  constructor(config: UnstructuredConfig) {
    this.client = new UnstructuredClient({
      security: { apiKeyAuth: config.apiKey },
      serverURL: config.apiURL,
    });
  }

  static getConfig(): UnstructuredConfig {
    const apiKey = process.env.UNSTRUCTURED_API_KEY;
    const apiURL = process.env.UNSTRUCTURED_API_URL;

    if (!apiKey || !apiURL) {
      throw new Error("Missing Unstructured API configuration");
    }

    return { apiKey, apiURL };
  }

  async parseDocument(
    buffer: ArrayBuffer,
    filename: string,
    isHighRes: boolean = false
  ): Promise<Element[]> {
    try {
      const partitionResponse = await this.client.general.partition({
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
      console.error("Document parsing error:", error);
      throw this.createParseError(error);
    }
  }

  private processResponse(response: unknown): Element[] {
    let parsedElements: Element[] = [];

    if (typeof response === "string") {
      try {
        const parsedResponse = JSON.parse(response);
        if (Array.isArray(parsedResponse)) {
          parsedElements = parsedResponse as Element[];
        }
      } catch (e) {
        console.error("Error parsing response string:", e);
        throw new Error("Invalid response format from API");
      }
    } else if (Array.isArray(response)) {
      parsedElements = response as Element[];
    } else {
      throw new Error("Unexpected response format from API");
    }

    if (!parsedElements.length) {
      throw new Error("No elements found in the response");
    }

    return parsedElements;
  }

  private createParseError(error: unknown): ParseError {
    if (error instanceof Error) {
      const parseError: ParseError = new Error(error.message);
      parseError.name = "ParseError";
      return parseError;
    }
    
    const parseError: ParseError = new Error("An unexpected error occurred while processing the file");
    parseError.name = "ParseError";
    return parseError;
  }
}
