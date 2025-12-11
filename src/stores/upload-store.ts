"use client";

import { create } from "zustand";
import { Chunk } from "@/types";
import { parseFile } from "@/actions/parse";

type UploadStatus = "idle" | "uploading" | "ready" | "error";

interface UploadState {
  chunks: Chunk[] | null;
  status: UploadStatus;
  errorMessage: string | null;
  showRawJson: boolean;
  uploadDocument: (file: File, opts?: { isHighRes?: boolean }) => Promise<void>;
  toggleShowRaw: () => void;
  setError: (message: string) => void;
  reset: () => void;
}

export const useUploadStore = create<UploadState>((set, get) => ({
  chunks: null,
  status: "idle",
  errorMessage: null,
  showRawJson: false,
  uploadDocument: async (file, opts) => {
    if (get().status === "uploading") {
      return;
    }

    set({
      status: "uploading",
      errorMessage: null,
      chunks: null,
      showRawJson: false,
    });

    const formData = new FormData();
    formData.append("file", file);

    try {
      const chunks = await parseFile(formData, opts?.isHighRes ?? false);

      if (!chunks?.length) {
        set({
          chunks: null,
          status: "error",
          errorMessage: "No readable content found.",
        });
        return;
      }

      set({ chunks, status: "ready" });
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : "An unexpected error occurred while parsing the file.";

      set({
        status: "error",
        errorMessage: message,
      });
    }
  },
  toggleShowRaw: () =>
    set((state) => ({
      showRawJson: !state.showRawJson,
    })),
  setError: (message) =>
    set({
      status: "error",
      errorMessage: message,
    }),
  reset: () =>
    set({
      chunks: null,
      status: "idle",
      errorMessage: null,
      showRawJson: false,
    }),
}));

