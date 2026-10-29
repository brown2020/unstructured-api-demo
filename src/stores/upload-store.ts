"use client";

import { create } from "zustand";
import type { Chunk } from "@/types";
import { postParse } from "@/lib/parse-client";
import { friendlyParseMessage } from "@/lib/parse-errors";

type UploadStatus = "idle" | "uploading" | "ready" | "error";

interface UploadState {
  chunks: Chunk[] | null;
  status: UploadStatus;
  errorMessage: string | null;
  demoMessage: string | null;
  showRawJson: boolean;
  uploadDocument: (file: File) => Promise<void>;
  parseGeneration: number;
  toggleShowRaw: () => void;
  setError: (message: string) => void;
  reset: () => void;
}

// Track current upload to prevent race conditions
let currentUploadId = 0;
const initialState = {
  chunks: null,
  status: "idle" as const,
  errorMessage: null,
  demoMessage: null,
  showRawJson: false,
  parseGeneration: 0,
};

let parseGeneration = 0;

export const useUploadStore = create<UploadState>((set) => ({
  ...initialState,
  uploadDocument: async (file) => {
    // Increment upload ID to invalidate any in-flight requests
    const uploadId = ++currentUploadId;

    set({
      ...initialState,
      status: "uploading",
    });

    try {
      const result = await postParse(file);

      // Check if this upload is still current (not superseded by another)
      if (uploadId !== currentUploadId) {
        return;
      }

      if (!result.ok) {
        set({
          status: "error",
          errorMessage: result.message,
          demoMessage: null,
        });
        return;
      }

      if (!result.chunks.length) {
        set({
          status: "error",
          errorMessage: "No readable content found.",
        });
        return;
      }

      parseGeneration += 1;
      set({
        chunks: result.chunks,
        status: "ready",
        errorMessage: null,
        demoMessage: result.demoMessage,
        parseGeneration,
      });
    } catch (error) {
      // Check if this upload is still current
      if (uploadId !== currentUploadId) {
        return;
      }

      // Soft-catch unexpected client failures — UI banner only
      set({
        status: "error",
        errorMessage: friendlyParseMessage(error),
        demoMessage: null,
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
  reset: () => {
    currentUploadId += 1;
    set(initialState);
  },
}));
