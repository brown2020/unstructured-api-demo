import { useMemo } from "react";
import type { Chunk } from "@/types";
import { DocumentElement } from "./DocumentElements";

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
      <pre className="bg-gray-50 whitespace-pre-wrap break-all p-6 rounded-xl border border-gray-200 overflow-x-hidden" style={{ overflowWrap: "anywhere" }}>
        {rawJson}
      </pre>
    );
  }

  if (normalizedChunks.length === 0) {
    return (
      <div className="text-gray-500 text-center py-8">
        No readable content found in the file.
      </div>
    );
  }

  return (
    <div className="space-y-6" style={{ overflowWrap: "anywhere" }}>
      {normalizedChunks.map((chunk, chunkIndex) => (
        <section
          key={`${chunk.heading ?? "chunk"}-${chunkIndex}`}
          className="bg-white rounded-xl border border-gray-200 p-8 shadow-sm space-y-6 break-words"
        >
          {chunk.heading && (
            <h2 className="text-xl font-semibold text-gray-900">
              {chunk.heading}
            </h2>
          )}
          <div className="space-y-5">
            {chunk.content.map((item, elementIndex) => (
              <DocumentElement
                key={`${item.element_id}-${elementIndex}`}
                element={item}
              />
            ))}
          </div>
        </section>
      ))}
    </div>
  );
}
