import { useState, useCallback } from "react";
import { useDropzone, DropzoneRootProps, DropzoneInputProps } from "react-dropzone";
import { Chunk } from "@/types";
import { parseFile } from "@/actions/parse";

interface UseFileUploadReturn {
  parsedData: Chunk[] | null;
  isLoading: boolean;
  error: string | null;
  getRootProps: () => DropzoneRootProps;
  getInputProps: () => DropzoneInputProps;
  isDragActive: boolean;
  isDragAccept: boolean;
  isDragReject: boolean;
  reset: () => void;
}

export function useFileUpload(): UseFileUploadReturn {
  const [parsedData, setParsedData] = useState<Chunk[] | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    if (acceptedFiles.length === 0) return;

    setIsLoading(true);
    setError(null);

    const formData = new FormData();
    formData.append("file", acceptedFiles[0]);

    try {
      const data = await parseFile(formData);
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
  }, []);

  const {
    getRootProps,
    getInputProps,
    isDragActive,
    isDragAccept,
    isDragReject,
  } = useDropzone({
    onDrop,
    accept: {
      "application/pdf": [".pdf"],
      "image/*": [".png", ".jpg", ".jpeg"],
    },
  });

  const reset = useCallback(() => {
    setParsedData(null);
    setError(null);
    setIsLoading(false);
  }, []);

  return {
    parsedData,
    isLoading,
    error,
    getRootProps,
    getInputProps,
    isDragActive,
    isDragAccept,
    isDragReject,
    reset,
  };
}
