# Unstructured API Demo Spec

## Current Purpose

This application demonstrates uploading PDF, PNG, JPG, or JPEG files and parsing them through the Unstructured API. It renders parsed elements in a readable document view and can show the raw JSON chunk structure for inspection.

## Current Implementation

- The app uses Next.js 16 App Router with React 19 and TypeScript.
- The homepage renders `UploadAndParse`, which places a client-only upload panel inside a mostly server-rendered route.
- `react-dropzone` handles drag-and-drop selection, single-file upload, client-side MIME/size filtering, and rejected-file messages.
- Zustand stores upload status, parsed chunks, errors, and the raw JSON toggle.
- `parseFile` is a Server Action that validates the uploaded `FormData`, creates an `UnstructuredService`, sends the file buffer to the SDK, and organizes returned elements into chunks.
- `document-utils.ts` enforces a 10 MB upload limit and accepted PDF/PNG/JPEG file types on the server.
- `unstructured-client.ts` reads `UNSTRUCTURED_API_KEY` and `UNSTRUCTURED_API_URL` from server environment variables and maps SDK failures into `ParseError`.

## Key User Workflows

- Upload a supported file under 10 MB.
- See parsing progress while the Server Action runs.
- Read parsed document chunks grouped by headings and page breaks.
- Toggle between readable rendering and raw JSON.
- See validation or parsing errors without losing the whole page.

## Architecture Boundaries

| Area | Current Boundary |
| --- | --- |
| Route shell | `src/app/page.tsx`, `src/app/layout.tsx` |
| Upload UI | `src/components/upload/ClientUploadPanel.tsx` |
| Upload state | `src/stores/upload-store.ts` |
| Upload/dropzone wiring | `src/hooks/useFileUpload.ts` |
| Server action | `src/actions/parse.ts` |
| Validation/chunking | `src/lib/document-utils.ts` |
| Unstructured SDK wrapper | `src/lib/unstructured-client.ts` |
| Types | `src/types/index.ts` |

## Validation

Available project checks:

- `npm run lint`
- `npm run build`

No automated test script is currently defined in `package.json`.

## Known Quality Risks

- There is no test suite covering file validation, chunking, upload race handling, or rendering edge cases.
- Parsing requires live Unstructured credentials and network access, so local build/lint cannot prove the external workflow end-to-end.
- README package inventory can drift from `package.json`; current codebase-improvement runs should reconcile it when package versions change.

## Improvement Goals

- Keep upload validation consistent between client and server.
- Preserve clear boundaries between UI state, server action transport, document utilities, and SDK integration.
- Add tests before making risky parsing, chunking, or race-condition changes.
- Avoid product roadmap decisions in codebase-health passes; future feature direction belongs in a PRD/PIP workflow.
