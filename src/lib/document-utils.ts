import { Element, Chunk } from "@/types";

const HEADING_TYPES = new Set<Element["type"]>(["Heading", "Header", "Title"]);
const MAX_FILE_SIZE_BYTES = 10 * 1024 * 1024; // 10MB

export function organizeElementsIntoChunks(elements: Element[]): Chunk[] {
  const chunks: Chunk[] = [];
  let currentChunk: Element[] = [];
  let currentHeading: string | null = null;

  const pushChunk = () => {
    if (currentChunk.length > 0) {
      chunks.push({ heading: currentHeading, content: currentChunk });
      currentChunk = [];
    }
  };

  for (const element of elements) {
    if (HEADING_TYPES.has(element.type)) {
      pushChunk();
      currentHeading = element.text || null;
      continue;
    }

    if (element.type === "PageBreak") {
      pushChunk();
      currentHeading = null;
      continue;
    }

    currentChunk.push(element);
  }

  pushChunk();

  return chunks;
}

export async function processFileUpload(
  formData: FormData
): Promise<{ buffer: ArrayBuffer; filename: string }> {
  const file = formData.get("file") as File;

  if (!file) {
    throw new Error("No file uploaded");
  }

  if (!validateFileType(file)) {
    throw new Error("Unsupported file type. Please upload a PDF or image file.");
  }

  if (file.size > MAX_FILE_SIZE_BYTES) {
    throw new Error("File is too large. Please keep uploads under 10MB.");
  }

  const buffer = await file.arrayBuffer();
  return { buffer, filename: file.name };
}

export function validateFileType(file: File): boolean {
  const allowedTypes = [
    "application/pdf",
    "image/png",
    "image/jpeg",
    "image/jpg",
  ];
  return allowedTypes.includes(file.type);
}
