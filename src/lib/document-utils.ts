import { Element, Chunk } from "@/types";

const HEADING_TYPES = new Set<Element["type"]>(["Heading", "Title"]);
// Stay under Vercel's 4.5MB function body cap after multipart overhead.
export const MAX_FILE_SIZE_BYTES = 4 * 1024 * 1024; // 4MB
export const ACCEPTED_FILE_TYPES = [
  "application/pdf",
  "image/png",
  "image/jpeg",
  "image/jpg",
] as const;

const MIME_FOR_EXTENSION: Record<string, readonly string[]> = {
  ".pdf": ["application/pdf"],
  ".png": ["image/png"],
  ".jpg": ["image/jpeg", "image/jpg"],
  ".jpeg": ["image/jpeg", "image/jpg"],
};

const PDF_MAGIC = [0x25, 0x50, 0x44, 0x46]; // %PDF
const PNG_MAGIC = [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a];
const JPEG_MAGIC = [0xff, 0xd8, 0xff];

export const ACCEPTED_DROPZONE_TYPES: Record<string, string[]> = {
  "application/pdf": [".pdf"],
  "image/png": [".png"],
  "image/jpeg": [".jpg", ".jpeg"],
};

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
      currentHeading = element.text?.trim() || null;
      // Keep the heading element so a heading-only section is not discarded.
      currentChunk.push(element);
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
  const file = formData.get("file");

  if (!(file instanceof File)) {
    throw new Error("No file uploaded");
  }

  if (!validateFileType(file)) {
    throw new Error("Unsupported file type. Please upload a PDF or image file.");
  }

  if (file.size > MAX_FILE_SIZE_BYTES) {
    throw new Error("File is too large. Please keep uploads under 4MB.");
  }

  const buffer = await file.arrayBuffer();
  if (!validateFileSignature(file.name, buffer)) {
    throw new Error("The file content does not match a PDF or image.");
  }
  return { buffer, filename: file.name };
}

export function validateFileType(file: File): boolean {
  const extension = getFileExtension(file.name);
  const allowedMimes = MIME_FOR_EXTENSION[extension];
  if (!allowedMimes) return false;
  if (!file.type) return true;
  return (
    ACCEPTED_FILE_TYPES.includes(file.type as (typeof ACCEPTED_FILE_TYPES)[number]) &&
    allowedMimes.includes(file.type)
  );
}

export function validateFileSignature(filename: string, buffer: ArrayBuffer): boolean {
  const extension = getFileExtension(filename);
  const bytes = new Uint8Array(buffer);
  if (extension === ".pdf") return hasPrefix(bytes, PDF_MAGIC);
  if (extension === ".png") return hasPrefix(bytes, PNG_MAGIC);
  if (extension === ".jpg" || extension === ".jpeg") return hasPrefix(bytes, JPEG_MAGIC);
  return false;
}

function hasPrefix(bytes: Uint8Array, prefix: number[]): boolean {
  if (bytes.byteLength < prefix.length) return false;
  return prefix.every((value, index) => bytes[index] === value);
}

function getFileExtension(filename: string): string {
  const extension = filename.split(".").pop();
  return extension ? `.${extension.toLowerCase()}` : "";
}
