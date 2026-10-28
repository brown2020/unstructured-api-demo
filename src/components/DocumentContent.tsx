"use client";

import { useMemo } from "react";
import type { Chunk, Element } from "@/types";
import { DocumentElement } from "./DocumentElements";

function isPromotedHeading(chunk: Chunk, element: Element, index: number): boolean {
  if (index !== 0 || chunk.heading == null) return false;
  if (element.type !== "Title" && element.type !== "Heading") return false;
  return (element.text?.trim() || null) === chunk.heading;
}

interface DocumentContentProps {
  data: Chunk[] | null;
  showRawJson: boolean;
}

export function DocumentContent({ data, showRawJson }: DocumentContentProps) {
  const normalizedChunks = useMemo(() => {
    if (!data) return [];
    return data.filter((chunk) => chunk.content.length > 0);
  }, [data]);

  const rawJson = useMemo(() => {
    if (!showRawJson || !data) {
      return null;
    }

    return JSON.stringify(data, null, 2);
  }, [data, showRawJson]);

  if (!data) return null;

  if (showRawJson) {
    return (
      <pre
        className="bg-gray-50 whitespace-pre-wrap break-all p-6 rounded-xl border border-gray-200 overflow-x-hidden"
        style={{ overflowWrap: "anywhere" }}
      >
        {rawJson}
      </pre>
    );
  }

  if (normalizedChunks.length === 0) {
    return (
      <div className="text-gray-600 text-center py-8">
        No readable content found in the file.
      </div>
    );
  }

  return (
    <div className="space-y-6" style={{ overflowWrap: "anywhere" }}>
      {normalizedChunks.map((chunk, chunkIndex) => {
        const firstId = chunk.content[0]?.element_id ?? "empty";
        const sectionKey = `${chunkIndex}:${firstId}`;
        const visibleContent = chunk.content.filter(
          (item, index) => !isPromotedHeading(chunk, item, index),
        );
        return (
          <section
            key={sectionKey}
            className="bg-white rounded-xl border border-gray-200 p-8 shadow-sm space-y-6 break-words"
          >
            {chunk.heading && (
              <h2 className="text-xl font-semibold text-gray-900">
                {chunk.heading}
              </h2>
            )}
            <div className="space-y-5">
              {visibleContent.map((item, index) => (
                <DocumentElement key={`${chunkIndex}:${index}:${item.element_id}`} element={item} />
              ))}
            </div>
          </section>
        );
      })}
    </div>
  );
}
