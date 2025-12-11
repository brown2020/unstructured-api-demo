import { Chunk } from "@/types";
import { DocumentElement } from "./DocumentElements";

interface DocumentContentProps {
  data: Chunk[] | null;
  showRawJson: boolean;
}

export function DocumentContent({ data, showRawJson }: DocumentContentProps) {
  if (!data) return null;

  if (showRawJson) {
    return (
      <pre className="bg-gray-50 whitespace-pre-wrap p-6 rounded-xl border border-gray-200 overflow-x-auto">
        {JSON.stringify(data, null, 2)}
      </pre>
    );
  }

  const normalizedChunks = data
    .map((chunk) => ({
      heading: chunk.heading,
      content: chunk.content.filter((item) => item.type !== "PageBreak"),
    }))
    .filter((chunk) => chunk.content.length > 0);

  if (normalizedChunks.length === 0) {
    return (
      <div className="text-gray-500 text-center py-8">
        No readable content found in the file.
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {normalizedChunks.map((chunk, chunkIndex) => (
        <section
          key={`${chunk.heading ?? "chunk"}-${chunkIndex}`}
          className="bg-white rounded-xl border border-gray-200 p-8 shadow-sm space-y-4"
        >
          {chunk.heading && (
            <h3 className="text-xl font-semibold text-gray-900">
              {chunk.heading}
            </h3>
          )}
          <div className="space-y-4">
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
