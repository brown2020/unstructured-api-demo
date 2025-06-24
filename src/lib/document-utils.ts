import { Element, Chunk } from "@/types";

export function organizeElementsIntoChunks(elements: Element[]): Chunk[] {
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

export async function processFileUpload(formData: FormData): Promise<{ buffer: ArrayBuffer; filename: string }> {
  const file = formData.get("file") as File;

  if (!file) {
    throw new Error("No file uploaded");
  }

  const buffer = await file.arrayBuffer();
  return { buffer, filename: file.name };
}

export function validateFileType(file: File): boolean {
  const allowedTypes = ['application/pdf', 'image/png', 'image/jpeg', 'image/jpg'];
  return allowedTypes.includes(file.type);
}
