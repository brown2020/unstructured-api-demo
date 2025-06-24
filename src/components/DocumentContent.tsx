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

  const contentArray = data[0]?.content || [];
  if (contentArray.length === 0) {
    return (
      <div className="text-gray-500 text-center py-8">
        No readable content found in the file.
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-8 shadow-xs space-y-4">
      {contentArray
        .filter((item) => item.type !== "PageBreak")
        .map((item, index) => (
          <DocumentElement key={`${item.element_id}-${index}`} element={item} />
        ))}
    </div>
  );
}
