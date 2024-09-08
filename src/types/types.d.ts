// types.ts

export interface Metadata {
  filetype: string;
  languages: string[];
  page_number: number;
  filename: string;
  parent_id?: string; // Optional, not all elements have this
}

export interface Element {
  type:
    | "Title"
    | "NarrativeText"
    | "EmailAddress"
    | "UncategorizedText"
    | "PageNumber"
    | "Image"
    | "Heading";
  element_id: string;
  text: string;
  metadata: Metadata;
}

export interface Chunk {
  heading: string | null;
  content: Element[];
}
