// app/components/UploadAndParse.tsx
"use client";

import { useState } from "react";
import { useDropzone } from "react-dropzone";
import { parseFile } from "../actions/parse";

type Props = {};

export default function UploadAndParse({}: Props) {
  const [parsedData, setParsedData] = useState<any | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const onDrop = async (acceptedFiles: File[]) => {
    if (acceptedFiles.length === 0) return;

    setIsLoading(true);
    setError(null);

    const formData = new FormData();
    formData.append("file", acceptedFiles[0]);

    try {
      const data = await parseFile(formData);
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
        <pre className="mt-4 bg-gray-100 whitespace-pre-wrap p-4 rounded-lg overflow-x-auto">
          {JSON.stringify(parsedData, null, 2)}
        </pre>
      )}
    </div>
  );
}
