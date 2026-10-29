# Unstructured API Demo Spec

## Purpose

Upload one PDF, PNG, or JPEG and partition it with the Unstructured API. Show the result as readable chunks or as raw JSON.

## Features as built

- Homepage is a server-rendered shell (`UploadAndParse`) around a client upload island.
- `react-dropzone` accepts one PDF, PNG, or JPEG up to 4 MB.
- The server accepts the same types only when the extension matches the MIME type (an empty MIME is allowed) and the bytes match a PDF, PNG, or JPEG signature.
- The upload UI posts the file to `POST /api/parse`. `parseFile` calls the same `runParse` helper.
- The route requires an `Origin` whose host matches `x-forwarded-host` or `host`.
- The route rate-limits each client address to 8 calls per 10 minutes and the process to 40 calls per 10 minutes. The limiter is in memory for that server instance.
- Callers cannot select Hi-Res. `UNSTRUCTURED_HI_RES=true` on the server selects it. Otherwise the strategy is Auto.
- JSON responses are `{ ok, message, chunks, demoMessage }`. HTTP status is 200 for a live parse or an intentional demo, 400 for a rejected file, 401 or 403 for an upstream auth or credit failure (with sample chunks), 402 for an upstream quota failure (with sample chunks), 429 for a rate limit, 503 for an upstream 5xx, and 504 for a timeout.
- User-facing copy is fixed. The API key and raw upstream bodies are not included.
- Demo mode returns sample chunks and `demoMessage` starting with `Demo mode: sample results` when `UNSTRUCTURED_USE_FIXTURES=true`, when the key or URL is missing, or after an upstream 401, 402, or 403. Validation still runs first. The flag works in production.
- Live parsing uses `UNSTRUCTURED_API_KEY` and `UNSTRUCTURED_API_URL`. The URL may be the API origin or the full `/general/v0/general` path. The app strips that suffix before giving it to the SDK, which appends the path itself. The client is created on the first live call, with a 120 second timeout and a 15 second retry budget.
- Partition requests send the whole file (`splitPdfPage: false`), fail if a split page errors, include page breaks, and ask for unique element ids.
- Chunks break on `Title`, `Heading`, and `PageBreak`. Heading elements stay in the chunk. The readable view does not repeat that heading.
- Rendered lines and table cells are keyed by position so repeated text is not dropped.
- Email text becomes a `mailto` link only when it is a single plain address.
- Upload state lives in a Zustand store. A newer upload or `reset()` discards a late response.
- The error boundary remounts when a new successful parse arrives.
- There is no account system, database, Firebase, Stripe, or AI model.

## Environment

| Name | When it is read |
| --- | --- |
| `UNSTRUCTURED_API_KEY` | Live partition only |
| `UNSTRUCTURED_API_URL` | Live partition only. Origin or full partition URL |
| `UNSTRUCTURED_HI_RES` | Live partition only. Exact value `true` enables Hi-Res |
| `UNSTRUCTURED_USE_FIXTURES` | After validation. Exact value `true` skips the live API in every environment |

A missing key or URL returns sample results and a demo banner. Production build and CI do not need the API key.

## User workflow

1. Open `/`.
2. Drop or choose a supported file under 4 MB.
3. See a loading state while `POST /api/parse` runs.
4. Read chunks, or toggle raw JSON.
5. See an inline error for a rejected file, a blocked origin, a rate limit, or an unavailable service. An auth, credit, or missing-key result shows the demo banner and sample sections. The page shell stays up.

## Architecture

| Area | File |
| --- | --- |
| Routes | `src/app/page.tsx`, `src/app/layout.tsx`, `src/app/not-found.tsx` |
| Upload UI | `src/components/upload/ClientUploadPanel.tsx` |
| Document view | `src/components/DocumentContent.tsx`, `src/components/DocumentElements.tsx` |
| Dropzone wiring | `src/hooks/useFileUpload.ts` |
| Upload state | `src/stores/upload-store.ts` |
| Parse route | `src/app/api/parse/route.ts` |
| Shared parse path | `src/lib/run-parse.ts` |
| Server action | `src/actions/parse.ts` |
| Origin and rate limit | `src/lib/parse-guard.ts` |
| Validation and chunking | `src/lib/document-utils.ts` |
| SDK wrapper | `src/lib/unstructured-client.ts` |
| Fixtures | `src/lib/unstructured-fixtures.ts` |
| Error copy | `src/lib/parse-errors.ts` |
| Mailto allowlist | `src/lib/safe-mailto.ts` |
| Types | `src/types/index.ts` |

UI and hooks use the upload store, which posts to `/api/parse`. The Unstructured SDK stays behind `src/lib/unstructured-client.ts` and `server-only`.

## Element rendering

Custom renderers: Title, NarrativeText, UncategorizedText, Header, Footer, EmailAddress, PageNumber, Image, Table.

Other element types, including ListItem, use the default type-and-text renderer. Numeric-only uncategorized text is hidden.

## Checks

- `npm run lint`
- `npm run typecheck`
- `npm test`
- `npm run build`
- `npm run validate` runs all four

CI is `.github/workflows/ci.yml`. It uses fixtures and does not call the live API.

## Out of scope

- Accounts, billing, and saved documents
- Choosing Hi-Res in the browser
- A distributed rate limiter or a live partition smoke test in the gate job
