"use server";

import { Element, Chunk } from "@/types/types";
import { UnstructuredClient } from "unstructured-client";
import { Strategy } from "unstructured-client/sdk/models/shared/index.js";

interface UnstructuredConfig {
  apiKey: string;
  apiURL: string;
}

interface ParseError extends Error {
  statusCode?: number;
  details?: string;
}

function getUnstructuredConfig(): UnstructuredConfig {
  const apiKey = process.env.UNSTRUCTURED_API_KEY;
  const apiURL = process.env.UNSTRUCTURED_API_URL;

  if (!apiKey || !apiURL) {
    throw new Error("Missing Unstructured API configuration");
  }

  return { apiKey, apiURL };
}

function createUnstructuredClient(
  config: UnstructuredConfig
): UnstructuredClient {
  return new UnstructuredClient({
    security: { apiKeyAuth: config.apiKey },
    serverURL: config.apiURL,
  });
}

async function processFileUpload(
  formData: FormData
): Promise<{ buffer: ArrayBuffer; filename: string }> {
  const file = formData.get("file") as File;

  if (!file) {
    throw new Error("No file uploaded");
  }

  const buffer = await file.arrayBuffer();
  return { buffer, filename: file.name };
}

function organizeElementsIntoChunks(elements: Element[]): Chunk[] {
  const chunks: Chunk[] = [];
  let currentChunk: Element[] = [];
  let currentHeading: string | null = null;

  for (const element of elements) {
    if (element.type === "Heading") {
      if (currentChunk.length > 0) {
        chunks.push({ heading: currentHeading, content: currentChunk });
      }
      currentChunk = [];
      currentHeading = element.text || null;
    } else {
      currentChunk.push(element);
    }
  }

  if (currentChunk.length > 0) {
    chunks.push({ heading: currentHeading, content: currentChunk });
  }

  return chunks;
}

// Update the UnstructuredResponse interface to match the API response
interface UnstructuredResponse {
  statusCode: number;
  elements?: Element[];
  rawResponse?: Response;
}

async function handleUnstructuredResponse(
  response: UnstructuredResponse
): Promise<Element[]> {
  if (response.statusCode !== 200) {
    const error: ParseError = new Error("Error processing file");
    error.statusCode = response.statusCode;

    if (response.rawResponse) {
      try {
        const errorData = await response.rawResponse.json();
        error.details = errorData.error;
      } catch {
        // Ignore JSON parsing errors in error response
      }
    }

    throw error;
  }

  if (!response.elements?.length) {
    throw new Error("No elements found in the response");
  }

  return response.elements as Element[];
}

export async function parseFile(
  formData: FormData,
  isHighRes: boolean = false
): Promise<Chunk[]> {
  try {
    const config = getUnstructuredConfig();
    const client = createUnstructuredClient(config);
    const { buffer, filename } = await processFileUpload(formData);

    const partitionResponse = await client.general.partition({
      partitionParameters: {
        files: {
          content: buffer,
          fileName: filename,
        },
        strategy: isHighRes ? Strategy.HiRes : Strategy.Auto,
      },
    });

    // Debug the response structure
    console.log("partitionResponse type:", typeof partitionResponse);

    // Process the response based on its type
    // According to the SDK, PartitionResponse can be string | Array<{[k: string]: any}>
    let parsedElements: Element[] = [];

    if (typeof partitionResponse === "string") {
      // If it's a string, parse it to JSON
      try {
        const parsedResponse = JSON.parse(partitionResponse);
        if (Array.isArray(parsedResponse)) {
          parsedElements = parsedResponse as Element[];
        }
      } catch (e) {
        console.error("Error parsing response string:", e);
      }
    } else if (Array.isArray(partitionResponse)) {
      // If it's already an array, use it directly
      parsedElements = partitionResponse as Element[];
    }

    const response: UnstructuredResponse = {
      statusCode: 200,
      elements: parsedElements,
    };

    const elements = await handleUnstructuredResponse(response);
    return organizeElementsIntoChunks(elements);
  } catch (error) {
    console.error("File parsing error:", error);
    throw error instanceof Error
      ? error
      : new Error("An unexpected error occurred while processing the file.");
  }
}
