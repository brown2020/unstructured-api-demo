/**
 * Sample partition results for demo mode.
 * Used when UNSTRUCTURED_USE_FIXTURES=true, when the API key or URL is missing,
 * or as a fallback after an auth or credit failure. This does not call Unstructured.
 */

import type { Element } from "@/types";

export function unstructuredFixturesEnabled(): boolean {
  return process.env.UNSTRUCTURED_USE_FIXTURES === "true";
}

export function unstructuredConfigMissing(): boolean {
  const key = process.env.UNSTRUCTURED_API_KEY?.trim();
  const url = process.env.UNSTRUCTURED_API_URL?.trim();
  return !key || !url;
}

export function sampleElements(filename: string): Element[] {
  const baseMeta = {
    filetype: filename.toLowerCase().endsWith(".png")
      ? "image/png"
      : filename.toLowerCase().endsWith(".jpg") || filename.toLowerCase().endsWith(".jpeg")
        ? "image/jpeg"
        : "application/pdf",
    languages: ["eng"],
    page_number: 1,
    filename,
  };

  return [
    {
      type: "Title",
      element_id: "sample-title",
      text: "Quarterly Operations Summary",
      metadata: { ...baseMeta },
    },
    {
      type: "NarrativeText",
      element_id: "sample-intro",
      text: "This sample shows how a parsed document is grouped into sections. It is not a live partition of the uploaded file.",
      metadata: { ...baseMeta },
    },
    {
      type: "Heading",
      element_id: "sample-heading",
      text: "Highlights",
      metadata: { ...baseMeta },
    },
    {
      type: "NarrativeText",
      element_id: "sample-highlight",
      text: "North region shipments stayed on schedule. West region inventory was restocked mid-quarter.",
      metadata: { ...baseMeta },
    },
    {
      type: "Table",
      element_id: "sample-table",
      text: "Region\tShipments\nNorth\t128\nWest\t96",
      metadata: { ...baseMeta },
    },
    {
      type: "EmailAddress",
      element_id: "sample-email",
      text: "ops@example.com",
      metadata: { ...baseMeta },
    },
    {
      type: "Footer",
      element_id: "sample-footer",
      text: filename,
      metadata: { ...baseMeta, page_number: 1 },
    },
  ];
}
