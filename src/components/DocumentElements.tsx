import { Element } from "@/types";

interface DocumentElementProps {
  element: Element;
}

const getTextLines = (text: string) =>
  text
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);

const getTableRows = (text: string) => {
  const rows = text
    .split(/\r?\n/)
    .map((row) => row.split("\t").map((cell) => cell.trim()))
    .filter((cells) => cells.some(Boolean));

  const hasStructuredColumns = rows.some((cells) => cells.length > 1);
  return hasStructuredColumns ? rows : null;
};

const elementComponents = {
  Title: ({ element }: DocumentElementProps) => {
    if (!element.text) return null;
    return (
      <h3 className="text-lg font-semibold text-gray-900">{element.text}</h3>
    );
  },

  NarrativeText: ({ element }: DocumentElementProps) => {
    if (!element.text) return null;
    const lines = getTextLines(element.text);
    if (lines.length === 0) return null;
    return (
      <div className="space-y-3 break-words">
        {lines.map((line, index) => (
          <p
            key={`narrative-${index}`}
            className="text-gray-700 leading-relaxed"
          >
            {line}
          </p>
        ))}
      </div>
    );
  },

  UncategorizedText: ({ element }: DocumentElementProps) => {
    if (!element.text) return null;
    // Skip numeric-only content
    if (/^\d+$/.test(element.text)) return null;
    const lines = getTextLines(element.text);
    if (lines.length === 0) return null;
    return (
      <div className="space-y-2 break-words">
        {lines.map((line, index) => (
          <p
            key={`uncategorized-${index}`}
            className="text-gray-500 italic leading-relaxed"
          >
            {line}
          </p>
        ))}
      </div>
    );
  },

  Header: ({ element }: DocumentElementProps) => {
    if (!element.text) return null;
    return (
      <div className="text-lg font-medium text-gray-800 mb-2">
        {element.text}
      </div>
    );
  },

  Footer: ({ element }: DocumentElementProps) => {
    if (!element.text) return null;
    return (
      <div className="text-sm font-medium text-gray-600 mt-4 pt-4 border-t border-gray-100">
        {element.text}
      </div>
    );
  },

  EmailAddress: ({ element }: DocumentElementProps) => {
    if (!element.text) return null;
    return (
      <a
        href={`mailto:${element.text}`}
        className="text-blue-600 hover:text-blue-500 underline decoration-dotted"
      >
        {element.text}
      </a>
    );
  },

  PageNumber: ({ element }: DocumentElementProps) => {
    if (!element.text) return null;
    return <div className="text-sm text-gray-400">Page {element.text}</div>;
  },

  Image: ({ element }: DocumentElementProps) => (
    <div className="border-l-4 border-blue-500 pl-4 py-2">
      <p className="text-gray-600">
        <span className="font-medium">Image:</span>{" "}
        {element.text || "No description available"}
      </p>
    </div>
  ),

  Table: ({ element }: DocumentElementProps) => {
    if (!element.text) return null;
    const rows = getTableRows(element.text);

    if (!rows) {
      return (
        <pre className="bg-gray-50 whitespace-pre-wrap rounded-lg border border-gray-200 p-4 text-sm text-gray-700">
          {element.text}
        </pre>
      );
    }

    return (
      <div className="overflow-x-auto rounded-lg border border-gray-200">
        <table className="min-w-full divide-y divide-gray-200 text-sm">
          <tbody className="divide-y divide-gray-100">
            {rows.map((cells, rowIndex) => (
              <tr key={`row-${rowIndex}`}>
                {cells.map((cell, cellIndex) => (
                  <td
                    key={`cell-${rowIndex}-${cellIndex}`}
                    className="px-3 py-2 align-top text-gray-700"
                  >
                    {cell}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  },

  Default: ({ element }: DocumentElementProps) => (
    element.text ? (
      <div className="text-gray-700">
        <span className="font-medium">{element.type}:</span> {element.text}
      </div>
    ) : null
  ),
};

export function DocumentElement({ element }: DocumentElementProps) {
  const Component =
    elementComponents[element.type as keyof typeof elementComponents] ||
    elementComponents.Default;
  return <Component element={element} />;
}
