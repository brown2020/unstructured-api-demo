"use server";

import { Chunk } from "@/types";
import { UnstructuredService } from "@/lib/unstructured-client";
import { organizeElementsIntoChunks, processFileUpload } from "@/lib/document-utils";

export async function parseFile(
  formData: FormData,
  isHighRes: boolean = false
): Promise<Chunk[]> {
  try {
    const config = UnstructuredService.getConfig();
    const service = new UnstructuredService(config);
    const { buffer, filename } = await processFileUpload(formData);

    const elements = await service.parseDocument(buffer, filename, isHighRes);
    return organizeElementsIntoChunks(elements);
  } catch (error) {
    console.error("File parsing error:", error);
    throw error instanceof Error
      ? error
      : new Error("An unexpected error occurred while processing the file.");
  }
}
