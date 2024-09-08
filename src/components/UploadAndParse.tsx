"use client";

import { useState } from "react";
import { useDropzone } from "react-dropzone";
import { parseFile } from "../actions/parse";
import { Element, Chunk } from "@/types/types";

export default function UploadAndParse() {
  const [parsedData, setParsedData] = useState<Chunk[] | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [showRawJson, setShowRawJson] = useState<boolean>(false); // State for toggling JSON view

  const onDrop = async (acceptedFiles: File[]) => {
    if (acceptedFiles.length === 0) return;

    setIsLoading(true);
    setError(null);

    const formData = new FormData();
    formData.append("file", acceptedFiles[0]);

    try {
      const data: Chunk[] = await parseFile(formData);
      setParsedData(data);
    } catch (err) {
      setError((err as Error).message || "An error occurred");
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
    // Function to extract readable text from JSON
    if (!data) return null;

    const contentArray = data[0]?.content || [];
    return contentArray
      .filter(
        (item: Element) =>
          item.type === "Title" ||
          item.type === "NarrativeText" ||
          item.type === "EmailAddress" ||
          item.type === "UncategorizedText"
      )
      .map((item: Element) => (
        <div key={item.element_id} className="mb-2">
          <strong>{item.type}:</strong> {item.text}
        </div>
      ));
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
          ${isDragActive && "bg-gray-100"} 
          ${isDragAccept && "border-green-500"} 
          ${isDragReject && "border-red-500"}
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
