import { Element } from "@/types";

interface DocumentElementProps {
  element: Element;
}

const elementComponents = {
  Title: ({ element }: DocumentElementProps) => (
    <h2 className="text-2xl font-semibold text-gray-900">{element.text}</h2>
  ),

  NarrativeText: ({ element }: DocumentElementProps) => (
    <p className="text-gray-700 leading-relaxed">{element.text}</p>
  ),

  UncategorizedText: ({ element }: DocumentElementProps) => {
    // Skip numeric-only content
    if (/^\d+$/.test(element.text || "")) return null;
    return (
      <p className="text-gray-500 italic leading-relaxed">{element.text}</p>
    );
  },

  Header: ({ element }: DocumentElementProps) => (
    <div className="text-lg font-medium text-gray-800 mb-2">
      {element.text}
    </div>
  ),

  Footer: ({ element }: DocumentElementProps) => (
    <div className="text-sm font-medium text-gray-600 mt-4 pt-4 border-t border-gray-100">
      {element.text}
    </div>
  ),

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

  PageNumber: ({ element }: DocumentElementProps) => (
    <div className="text-sm text-gray-400">Page {element.text}</div>
  ),

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
    const rows = element.text
      .split("\n")
      .map((row) => row.split("\t"))
      .filter((cells) => cells.length > 0);

    if (rows.length === 0) {
      return null;
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
                    className="px-3 py-2 whitespace-nowrap text-gray-700"
                  >
                    {cell || "\u00A0"}
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
    <div className="text-gray-700">
      <span className="font-medium">{element.type}:</span>{" "}
      {element.text || "N/A"}
    </div>
  ),
};

export function DocumentElement({ element }: DocumentElementProps) {
  const Component = elementComponents[element.type as keyof typeof elementComponents] || elementComponents.Default;
  return <Component element={element} />;
}
