/**
 * Labeled fixtures for Unstructured partition responses.
 * Used when UNSTRUCTURED_USE_FIXTURES=true (CI / app-eval) to avoid burning paid credits.
 * Fixtures cannot prove live Unstructured partition quality, Hi-Res latency, or credit metering.
 */

import type { Chunk, Element } from "@/types";

export function unstructuredFixturesEnabled(): boolean {
  return process.env.UNSTRUCTURED_USE_FIXTURES === "true";
}

export function fixtureElements(filename: string): Element[] {
  const baseMeta = {
    filetype: "application/pdf",
    languages: ["eng"],
    page_number: 1,
    filename,
  };

  return [
    {
      type: "Title",
      element_id: "fixture-title-1",
      text: "[fixture] Sample Document",
      metadata: { ...baseMeta },
    },
    {
      type: "NarrativeText",
      element_id: "fixture-narrative-1",
      text: "[fixture] This paragraph is a labeled Unstructured fixture — no live API call.",
      metadata: { ...baseMeta },
    },
    {
      type: "NarrativeText",
      element_id: "fixture-narrative-2",
      text: "Second line of fixture content for multi-line rendering.",
      metadata: { ...baseMeta },
    },
    {
      type: "EmailAddress",
      element_id: "fixture-email-1",
      text: "demo@example.com",
      metadata: { ...baseMeta },
    },
  ];
}

export function fixtureChunks(filename: string): Chunk[] {
  const elements = fixtureElements(filename);
  return [
    {
      heading: "[fixture] Sample Document",
      content: elements.filter((el) => el.type !== "Title"),
    },
  ];
}
