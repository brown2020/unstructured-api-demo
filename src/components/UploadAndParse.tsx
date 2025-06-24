"use client";

import { useState } from "react";
import { useFileUpload } from "@/hooks/useFileUpload";
import { DocumentContent } from "./DocumentContent";
import { LoadingSkeleton } from "./LoadingSkeleton";

export default function UploadAndParse() {
  const [showRawJson, setShowRawJson] = useState<boolean>(false);
  const {
    parsedData,
    isLoading,
    error,
    getRootProps,
    getInputProps,
    isDragActive,
    isDragAccept,
    isDragReject,
  } = useFileUpload();

  return (
    <div className="max-w-4xl mx-auto px-4">
      <div
        {...getRootProps()}
        className={`
          relative overflow-hidden
          border-2 border-dashed rounded-xl
          p-8 text-center cursor-pointer
          transition-all duration-200 ease-in-out
          ${isDragActive ? "bg-gray-50 border-gray-400" : "border-gray-300"}
          ${isDragAccept ? "border-green-500 bg-green-50" : ""}
          ${isDragReject ? "border-red-500 bg-red-50" : ""}
        `}
      >
        <input {...getInputProps()} />
        <div className="space-y-4">
          <div className="text-4xl text-gray-400">📄</div>
          <p className="text-lg text-gray-600">
            {isDragAccept
              ? "Drop it like it's hot! 🔥"
              : isDragReject
              ? "Sorry, this file type is not supported 😕"
              : "Drag & drop your document here, or click to browse"}
          </p>
          <p className="text-sm text-gray-400">
            Supports PDF, PNG, and JPEG files
          </p>
        </div>
      </div>

      {error && (
        <div className="mt-6 p-4 bg-red-50 border border-red-200 rounded-xl">
          <p className="text-red-600 flex items-center">
            <span className="mr-2">⚠️</span>
            {error}
          </p>
        </div>
      )}

      {isLoading && (
        <div className="mt-6">
          <LoadingSkeleton />
        </div>
      )}

      {parsedData && !isLoading && (
        <div className="mt-6 space-y-4">
          <div className="flex justify-end">
            <button
              onClick={() => setShowRawJson(!showRawJson)}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 
                         rounded-lg hover:bg-gray-50 focus:outline-hidden focus:ring-2 
                         focus:ring-offset-2 focus:ring-blue-500 transition-colors"
            >
              {showRawJson ? "Show Readable Format" : "Show Raw JSON"}
            </button>
          </div>
          <DocumentContent data={parsedData} showRawJson={showRawJson} />
        </div>
      )}
    </div>
  );
}
