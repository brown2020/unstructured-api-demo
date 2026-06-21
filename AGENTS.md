# Repository Guidance

## Project Shape

This repository is a Next.js 16 App Router demo for parsing PDF and image uploads with the Unstructured API. The UI uses React 19, Tailwind CSS 4, a small client upload island, and a Zustand store. Server-side parsing flows through a Server Action rather than an API route.

## Common Commands

- `npm run dev`: start the local Next.js development server.
- `npm run build`: build the production app.
- `npm run start`: serve the built app.
- `npm run lint`: run ESLint across the repository.

Run `npm run lint` before committing code changes. For behavior that touches framework output, upload handling, server actions, or package changes, run `npm run build` as well.

## Architecture Notes

- `src/app/` contains App Router pages, layout, and global styles.
- `src/components/upload/ClientUploadPanel.tsx` is the client upload UI.
- `src/hooks/useFileUpload.ts` connects `react-dropzone` to the upload store.
- `src/stores/upload-store.ts` owns upload state and guards against stale in-flight uploads.
- `src/actions/parse.ts` is the Server Action boundary for document parsing.
- `src/lib/document-utils.ts` owns file validation and chunking.
- `src/lib/unstructured-client.ts` wraps the Unstructured SDK and environment configuration.
- `src/types/index.ts` contains shared document and API types.

Keep the dependency direction boring: UI and hooks may use store/actions/utilities; server-only SDK code should stay under `src/lib/unstructured-client.ts`; shared types should remain side-effect free.

## Operating Rules

- Do not read or commit `.env.local`; use `.env.example` for documented environment variable names.
- Preserve Server Actions for parsing unless a product decision explicitly changes the transport.
- Keep file validation aligned between `ACCEPTED_DROPZONE_TYPES`, `ACCEPTED_FILE_TYPES`, and server-side checks.
- Treat `UNSTRUCTURED_API_KEY` and `UNSTRUCTURED_API_URL` as required runtime configuration for real parsing.
- Prefer focused changes with lint/build verification over broad refactors.
- Run reports from `$sb-cbi` live under `agent-runs/` and should be committed only as workflow artifacts.
