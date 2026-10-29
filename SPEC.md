# Unstructured API Demo Spec

## Purpose

Upload one BMP, DOCX, HEIC, JPEG, PDF, PNG, PPTX, or TIFF file and parse it with the Unstructured Transform API. Show the result as readable chunks or as raw JSON.

## Features as built

- Homepage is a server-rendered shell (`UploadAndParse`) around a client upload island.
- `react-dropzone` accepts one BMP, DOCX, HEIC, JPEG, PDF, PNG, PPTX, or TIFF file up to 4 MB.
- The server accepts the same extensions when the MIME type matches or is empty or `application/octet-stream`, and the bytes match that format. Anything else is rejected before the API is called.
- The upload UI posts the file to `POST /api/parse`. `parseFile` calls the same `runParse` helper.
- The route requires an `Origin` whose host matches `x-forwarded-host` or `host`.
- The route rate-limits each client address to 8 calls per 10 minutes and the process to 40 calls per 10 minutes. The limiter is in memory for that server instance.
- JSON responses are `{ ok, message, chunks, demoMessage }`. HTTP status is 200 for a live parse or an intentional demo, 400 for a rejected file, 401 or 403 for a bad key, 402 for an out-of-credits response (with sample chunks), 415 for an unsupported type, 429 for a rate limit, 503 for an upstream 5xx, and 504 for a timeout.
- User-facing copy is fixed. The API key and raw upstream bodies are not logged or returned.
- A Demo data badge and sample chunks are returned when `UNSTRUCTURED_USE_FIXTURES=true`, when `UNSTRUCTURED_API_KEY` is missing, or when the upstream status is 402 or the payload mentions credits or quota. Validation still runs first.
- Live parsing posts multipart field `input` to `{UNSTRUCTURED_API_URL}/parse`, default base `https://transform.unstructured.io/api/v2`, with header `unstructured-api-key` and `Prefer: wait=60`, and form field `output=elements`. HTTP 200 is read as elements (`type`, `text`, `element_id`, `metadata.page_number`) or, if elements are empty, as markdown. HTTP 202 is polled at the `Location` header or `poll_url` (`/api/v2/jobs/<id>`) with backoff until `completed` or `completed_with_warnings`, or the overall timeout. A legacy `api.unstructuredapp.io` base is replaced with the Transform default. The poll URL must stay on that host.
- Chunks break on `Title`, `Heading`, and `PageBreak`. Heading elements stay in the chunk. The readable view does not repeat that heading.
- Rendered lines and table cells are keyed by position so repeated text is not dropped.
- Email text becomes a `mailto` link only when it is a single plain address.
- Upload state lives in a Zustand store. A newer upload or `reset()` discards a late response.
- The error boundary remounts when a new successful parse arrives.
- There is no account system, database, Firebase, Stripe, or AI model.

## Environment

| Name | When it is read |
| --- | --- |
| `UNSTRUCTURED_API_KEY` | Live parse only. Sent as `unstructured-api-key` |
| `UNSTRUCTURED_API_URL` | Optional. Transform base. Defaults to `https://transform.unstructured.io/api/v2` |
| `UNSTRUCTURED_USE_FIXTURES` | After validation. Exact value `true` skips the live API in every environment |

A missing key returns sample results and a Demo data badge. Production build and CI do not need the API key.

## User workflow

1. Open `/`.
2. Drop or choose a supported file under 4 MB.
3. See a loading state while `POST /api/parse` runs.
4. Read chunks, or toggle raw JSON.
5. See an inline error for a rejected file, a bad key, a rate limit, or an unavailable service. A missing key or an out-of-credits response shows the Demo data badge and sample sections. The page shell stays up.

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
| Transform client | `src/lib/transform-api.ts` |
| Fixtures | `src/lib/unstructured-fixtures.ts` |
| Error copy | `src/lib/parse-errors.ts` |
| Mailto allowlist | `src/lib/safe-mailto.ts` |
| Types | `src/types/index.ts` |

UI and hooks use the upload store, which posts to `/api/parse`. The Transform client stays behind `src/lib/transform-api.ts` and `server-only`.

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
