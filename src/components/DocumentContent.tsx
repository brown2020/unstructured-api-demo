import { Chunk, Element } from "@/types/types";

interface DocumentContentProps {
  data: Chunk[] | null;
  showRawJson: boolean;
}

interface DocumentElementProps {
  element: Element;
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
    <div className="bg-white rounded-xl border border-gray-200 p-8 shadow-sm space-y-4">
      {contentArray
        .filter((item) => item.type !== "PageBreak")
        .map((item, index) => (
          <DocumentElement key={`${item.element_id}-${index}`} element={item} />
        ))}
    </div>
  );
}

function DocumentElement({ element }: DocumentElementProps) {
  switch (element.type) {
    case "Title":
      return (
        <h2 className="text-2xl font-semibold text-gray-900">{element.text}</h2>
      );

    case "NarrativeText":
      return <p className="text-gray-700 leading-relaxed">{element.text}</p>;

    case "UncategorizedText":
      if (/^\d+$/.test(element.text || "")) return null;
      return (
        <p className="text-gray-500 italic leading-relaxed">{element.text}</p>
      );

    case "Header":
      return (
        <div className="text-lg font-medium text-gray-800 mb-2">
          {element.text}
        </div>
      );

    case "Footer":
      return (
        <div className="text-sm font-medium text-gray-600 mt-4 pt-4 border-t border-gray-100">
          {element.text}
        </div>
      );

    case "PageNumber":
      return <div className="text-sm text-gray-400">Page {element.text}</div>;

    case "Image":
      return (
        <div className="border-l-4 border-blue-500 pl-4 py-2">
          <p className="text-gray-600">
            <span className="font-medium">Image:</span>{" "}
            {element.text || "No description available"}
          </p>
        </div>
      );

    default:
      return (
        <div className="text-gray-700">
          <span className="font-medium">{element.type}:</span>{" "}
          {element.text || "N/A"}
        </div>
      );
  }
}
