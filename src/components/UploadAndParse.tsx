"use client";

import { useState } from "react";
import { useDropzone } from "react-dropzone";
import { parseFile } from "../actions/parse";
import { Element, Chunk } from "@/types/types";

export default function UploadAndParse() {
  const [parsedData, setParsedData] = useState<Chunk[] | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [showRawJson, setShowRawJson] = useState<boolean>(false);

  const onDrop = async (acceptedFiles: File[]) => {
    if (acceptedFiles.length === 0) return;

    setIsLoading(true);
    setError(null);

    const formData = new FormData();
    formData.append("file", acceptedFiles[0]);

    try {
      const data: Chunk[] = await parseFile(formData);
      if (data && data.length > 0) {
        setParsedData(data);
      } else {
        setError("No readable content found.");
      }
    } catch (err) {
      setError(
        (err as Error).message || "An error occurred while parsing the file."
      );
    } finally {
      setIsLoading(false);
    }
  };

  const {
    getRootProps,
    getInputProps,
    isDragActive,
    isDragAccept,
    isDragReject,
  } = useDropzone({ onDrop });

  const extractReadableText = (data: Chunk[] | null) => {
    if (!data) return <p>No content to display.</p>;

    const contentArray = data[0]?.content || [];
    if (contentArray.length === 0)
      return <p>No readable content found in the file.</p>;

    // Group elements by their parent ID, if applicable
    const groupedContent = contentArray.reduce((acc, item) => {
      const parentId = item.metadata.parent_id || "root"; // "root" for elements without a parent
      if (!acc[parentId]) {
        acc[parentId] = [];
      }
      acc[parentId].push(item);
      return acc;
    }, {} as Record<string, Element[]>);

    // Render the grouped elements, filtering out "PageBreak" items
    return Object.keys(groupedContent).map((parentId) => {
      const elements = groupedContent[parentId].filter(
        (item) => item.type !== "PageBreak"
      );
      return (
        <div key={parentId} className="grouped-content">
          {elements.map((item, index) => {
            const uniqueKey = `${parentId}-${item.element_id}-${index}`;
            switch (item.type) {
              case "Title":
              case "NarrativeText":
                return (
                  <div key={uniqueKey} className="mb-2">
                    <strong>{item.type}:</strong> {item.text}
                  </div>
                );

              case "UncategorizedText":
                if (/^\d+$/.test(item.text || "")) {
                  return null;
                }
                return (
                  <div key={uniqueKey} className="mb-2 text-gray-500">
                    <strong>Uncategorized:</strong> {item.text}
                  </div>
                );

              case "Header":
              case "Footer":
                return (
                  <div key={uniqueKey} className="mb-2 font-bold text-lg">
                    {item.text} ({item.type})
                  </div>
                );

              case "PageNumber":
                return (
                  <div key={uniqueKey} className="mb-2">
                    <strong>Page:</strong> {item.text}
                  </div>
                );

              case "Image":
                return (
                  <div key={uniqueKey} className="mb-2">
                    <strong>Image:</strong> {item.text || "No descriptive text"}
                  </div>
                );

              default:
                return (
                  <div key={uniqueKey} className="mb-2">
                    <strong>{item.type}:</strong> {item.text || "N/A"}
                  </div>
                );
            }
          })}
        </div>
      );
    });
  };

  return (
    <div>
      <div
        {...getRootProps()}
        className={`
          dropzone 
          border-2 border-dashed border-gray-300 
          rounded-lg p-6 text-center cursor-pointer 
          transition-colors duration-300 
          ${isDragActive ? "bg-gray-100" : ""}
          ${isDragAccept ? "border-green-500" : ""}
          ${isDragReject ? "border-red-500" : ""}
        `}
      >
        <input {...getInputProps()} />
        <p>
          {isDragAccept
            ? "Drop it here!"
            : isDragReject
            ? "File type not accepted"
            : "Drag & drop a file here, or click to select one"}
        </p>
      </div>

      {isLoading && <p className="mt-4 text-gray-500">Parsing...</p>}
      {error && <p className="mt-4 text-red-500">Error: {error}</p>}

      {parsedData && (
        <div className="mt-4">
          <button
            onClick={() => setShowRawJson(!showRawJson)}
            className="mb-4 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
          >
            {showRawJson ? "Show Readable Format" : "Show Raw JSON"}
          </button>
          {showRawJson ? (
            <pre className="bg-gray-100 whitespace-pre-wrap p-4 rounded-lg overflow-x-auto">
              {JSON.stringify(parsedData, null, 2)}
            </pre>
          ) : (
            <div className="bg-gray-100 p-4 rounded-lg">
              {extractReadableText(parsedData)}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
