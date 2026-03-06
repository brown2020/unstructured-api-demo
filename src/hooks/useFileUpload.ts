import { useCallback } from "react";
import {
  useDropzone,
  DropzoneRootProps,
  DropzoneInputProps,
  FileRejection,
} from "react-dropzone";
import { useShallow } from "zustand/react/shallow";
import type { Chunk } from "@/types";
import { useUploadStore } from "@/stores/upload-store";
import {
  ACCEPTED_DROPZONE_TYPES,
  MAX_FILE_SIZE_BYTES,
} from "@/lib/document-utils";

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
  const {
    parsedData,
    status,
    error,
    showRawJson,
    toggleShowRaw,
    uploadDocument,
    reset,
    setError,
  } = useUploadStore(
    useShallow((state) => ({
      parsedData: state.chunks,
      status: state.status,
      error: state.errorMessage,
      showRawJson: state.showRawJson,
      toggleShowRaw: state.toggleShowRaw,
      uploadDocument: state.uploadDocument,
      reset: state.reset,
      setError: state.setError,
    }))
  );

  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    if (acceptedFiles.length === 0) return;
    // react-dropzone handles validation via accept and maxSize props
    // Server-side validation in processFileUpload is the authoritative check
    await uploadDocument(acceptedFiles[0]);
  }, [uploadDocument]);

  const onDropRejected = useCallback((rejections: FileRejection[]) => {
    const firstError = rejections[0]?.errors[0];
    if (!firstError) {
      setError("Unable to upload this file. Please try again.");
      return;
    }

    if (firstError.code === "file-too-large") {
      setError("File is too large. Please keep uploads under 10MB.");
      return;
    }

    if (firstError.code === "file-invalid-type") {
      setError("Unsupported file type. Please upload a PDF or image file.");
      return;
    }

    setError(firstError.message);
  }, [setError]);

  const {
    getRootProps,
    getInputProps,
    isDragActive,
    isDragAccept,
    isDragReject,
  } = useDropzone({
    onDrop,
    onDropRejected,
    multiple: false,
    maxSize: MAX_FILE_SIZE_BYTES,
    accept: ACCEPTED_DROPZONE_TYPES,
    disabled: status === "uploading",
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
