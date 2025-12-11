import { useCallback } from "react";
import {
  useDropzone,
  DropzoneRootProps,
  DropzoneInputProps,
} from "react-dropzone";
import { Chunk } from "@/types";
import { useUploadStore } from "@/stores/upload-store";
import { validateFileType } from "@/lib/document-utils";

interface UseFileUploadReturn {
  parsedData: Chunk[] | null;
  isLoading: boolean;
  error: string | null;
  showRawJson: boolean;
  toggleShowRaw: () => void;
  getRootProps: () => DropzoneRootProps;
  getInputProps: () => DropzoneInputProps;
  isDragActive: boolean;
  isDragAccept: boolean;
  isDragReject: boolean;
  reset: () => void;
}

export function useFileUpload(): UseFileUploadReturn {
  const parsedData = useUploadStore((state) => state.chunks);
  const status = useUploadStore((state) => state.status);
  const error = useUploadStore((state) => state.errorMessage);
  const showRawJson = useUploadStore((state) => state.showRawJson);
  const toggleShowRaw = useUploadStore((state) => state.toggleShowRaw);
  const uploadDocument = useUploadStore((state) => state.uploadDocument);
  const reset = useUploadStore((state) => state.reset);
  const setError = useUploadStore((state) => state.setError);

  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    if (acceptedFiles.length === 0) return;

    const file = acceptedFiles[0];
    if (!validateFileType(file)) {
      setError("Unsupported file type. Please upload a PDF or image file.");
      return;
    }

    await uploadDocument(file);
  }, [setError, uploadDocument]);

  const {
    getRootProps,
    getInputProps,
    isDragActive,
    isDragAccept,
    isDragReject,
  } = useDropzone({
    onDrop,
    multiple: false,
    accept: {
      "application/pdf": [".pdf"],
      "image/*": [".png", ".jpg", ".jpeg"],
    },
  });

  return {
    parsedData,
    isLoading: status === "uploading",
    error,
    showRawJson,
    toggleShowRaw,
    getRootProps,
    getInputProps,
    isDragActive,
    isDragAccept,
    isDragReject,
    reset,
  };
}
