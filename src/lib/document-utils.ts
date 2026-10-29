import { Element, Chunk } from "@/types";
import { UNSUPPORTED_TYPE_MESSAGE } from "@/lib/parse-errors";

const HEADING_TYPES = new Set<string>(["Heading", "Title"]);
// Stay under Vercel's 4.5MB function body cap after multipart overhead.
export const MAX_FILE_SIZE_BYTES = 4 * 1024 * 1024; // 4MB

export const ACCEPTED_FILE_TYPES = [
  "application/pdf",
  "application/vnd.openxmlformats-officedocument.presentationml.presentation",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "image/bmp",
  "image/heic",
  "image/heif",
  "image/jpeg",
  "image/jpg",
  "image/png",
  "image/tiff",
  "image/x-ms-bmp",
] as const;

const MIME_FOR_EXTENSION: Record<string, readonly string[]> = {
  ".bmp": ["image/bmp", "image/x-ms-bmp"],
  ".docx": ["application/vnd.openxmlformats-officedocument.wordprocessingml.document"],
  ".heic": ["image/heic", "image/heif"],
  ".jpeg": ["image/jpeg", "image/jpg"],
  ".jpg": ["image/jpeg", "image/jpg"],
  ".pdf": ["application/pdf"],
  ".png": ["image/png"],
  ".pptx": ["application/vnd.openxmlformats-officedocument.presentationml.presentation"],
  ".tiff": ["image/tiff"],
};

const PDF_MAGIC = [0x25, 0x50, 0x44, 0x46]; // %PDF
const PNG_MAGIC = [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a];
const JPEG_MAGIC = [0xff, 0xd8, 0xff];
const BMP_MAGIC = [0x42, 0x4d];
const ZIP_MAGIC = [0x50, 0x4b, 0x03, 0x04];
const TIFF_LE = [0x49, 0x49, 0x2a, 0x00];
const TIFF_BE = [0x4d, 0x4d, 0x00, 0x2a];
const HEIC_BRANDS = new Set(["heic", "heix", "hevc", "hevx", "heim", "heis", "heif", "mif1", "msf1"]);

export const ACCEPTED_DROPZONE_TYPES: Record<string, string[]> = {
  "application/pdf": [".pdf"],
  "image/png": [".png"],
  "image/jpeg": [".jpg", ".jpeg"],
  "image/bmp": [".bmp"],
  "image/heic": [".heic"],
  "image/tiff": [".tiff"],
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document": [".docx"],
  "application/vnd.openxmlformats-officedocument.presentationml.presentation": [".pptx"],
};

export const SUPPORTED_EXTENSIONS = Object.keys(MIME_FOR_EXTENSION);

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
    throw new Error(UNSUPPORTED_TYPE_MESSAGE);
  }

  if (file.size > MAX_FILE_SIZE_BYTES) {
    throw new Error("File is too large. Please keep uploads under 4MB.");
  }

  const buffer = await file.arrayBuffer();
  if (!validateFileSignature(file.name, buffer)) {
    throw new Error("The file content does not match a supported document or image.");
  }
  return { buffer, filename: file.name };
}

export function validateFileType(file: File): boolean {
  const extension = getFileExtension(file.name);
  const allowedMimes = MIME_FOR_EXTENSION[extension];
  if (!allowedMimes) return false;
  if (!file.type || file.type === "application/octet-stream") return true;
  return allowedMimes.includes(file.type);
}

export function validateFileSignature(filename: string, buffer: ArrayBuffer): boolean {
  const extension = getFileExtension(filename);
  const bytes = new Uint8Array(buffer);
  if (extension === ".pdf") return hasPrefix(bytes, PDF_MAGIC);
  if (extension === ".png") return hasPrefix(bytes, PNG_MAGIC);
  if (extension === ".jpg" || extension === ".jpeg") return hasPrefix(bytes, JPEG_MAGIC);
  if (extension === ".bmp") return hasPrefix(bytes, BMP_MAGIC);
  if (extension === ".tiff") return hasPrefix(bytes, TIFF_LE) || hasPrefix(bytes, TIFF_BE);
  if (extension === ".docx" || extension === ".pptx") return hasPrefix(bytes, ZIP_MAGIC);
  if (extension === ".heic") return isHeic(bytes);
  return false;
}

function isHeic(bytes: Uint8Array): boolean {
  if (bytes.length < 12) return false;
  const box = String.fromCharCode(bytes[4], bytes[5], bytes[6], bytes[7]);
  if (box !== "ftyp") return false;
  const brand = String.fromCharCode(bytes[8], bytes[9], bytes[10], bytes[11]).toLowerCase();
  return HEIC_BRANDS.has(brand);
}

function hasPrefix(bytes: Uint8Array, prefix: number[]): boolean {
  if (bytes.byteLength < prefix.length) return false;
  return prefix.every((value, index) => bytes[index] === value);
}

function getFileExtension(filename: string): string {
  const extension = filename.split(".").pop();
  return extension ? `.${extension.toLowerCase()}` : "";
}
