// Metadata for most elements
export interface Metadata {
  filetype: string;
  languages: string[];
  page_number: number;
  filename: string;
  parent_id?: string; // Optional, for hierarchical elements
}

// Element type now includes new types like Footer and PageNumber
export interface Element {
  type:
    | "Title"
    | "NarrativeText"
    | "EmailAddress"
    | "UncategorizedText"
    | "PageNumber"
    | "Image"
    | "Heading"
    | "Header"
    | "Table"
    | "Footer"
    | "PageBreak";
  element_id: string;
  text?: string; // Optional, since some elements (like images) may not have text
  metadata: Metadata; // General metadata for the element
}

// Represents a chunk of content, which could have multiple elements
export interface Chunk {
  heading: string | null; // Chunks may or may not have headings
  content: Element[]; // Array of elements within the chunk
}

// API related types
export interface ParseError extends Error {
  statusCode?: number;
  details?: string;
}

export interface UnstructuredConfig {
  apiKey: string;
  apiURL: string;
}
