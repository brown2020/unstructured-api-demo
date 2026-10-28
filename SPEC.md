# Unstructured API Demo Spec

## Purpose

Upload one PDF, PNG, or JPEG and partition it with the Unstructured API. Show the result as readable chunks or as raw JSON.

## Features as built

- Homepage is a server-rendered shell (`UploadAndParse`) around a client upload island.
- `react-dropzone` accepts one PDF, PNG, or JPEG up to 4 MB.
- The server accepts the same types only when the extension matches the MIME type (an empty MIME is allowed) and the bytes match a PDF, PNG, or JPEG signature.
- `parseFile` is the only parse transport. It is a Server Action, not a route handler.
- The action requires an `Origin` whose host matches `x-forwarded-host` or `host`.
- The action rate-limits each client address to 8 calls per 10 minutes and the process to 40 calls per 10 minutes. The limiter is in memory for that server instance.
- Callers cannot select Hi-Res. `UNSTRUCTURED_HI_RES=true` on the server selects it. Otherwise the strategy is Auto.
- Failures return `{ ok: false, message }`. Success returns `{ ok: true, chunks }`. The action does not throw user-facing errors.
- When `UNSTRUCTURED_USE_FIXTURES=true` and `NODE_ENV` is not `production`, a valid upload returns labeled fixture chunks and does not call Unstructured. Validation still runs first.
- Live parsing uses `UNSTRUCTURED_API_KEY` and `UNSTRUCTURED_API_URL`. The SDK client is created on the first live call, with a 120 second timeout and a 15 second retry budget.
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
| `UNSTRUCTURED_API_URL` | Live partition only |
| `UNSTRUCTURED_HI_RES` | Live partition only. Exact value `true` enables Hi-Res |
| `UNSTRUCTURED_USE_FIXTURES` | After validation, and only outside production |

Missing live configuration returns a readable error. Production build and CI do not need the API key.

## User workflow

1. Open `/`.
2. Drop or choose a supported file under 4 MB.
3. See a loading state while `parseFile` runs.
4. Read chunks, or toggle raw JSON.
5. See an inline error for a rejected file, a blocked origin, a rate limit, or a parse failure. The page shell stays up.

## Architecture

| Area | File |
| --- | --- |
| Routes | `src/app/page.tsx`, `src/app/layout.tsx`, `src/app/not-found.tsx` |
| Upload UI | `src/components/upload/ClientUploadPanel.tsx` |
| Document view | `src/components/DocumentContent.tsx`, `src/components/DocumentElements.tsx` |
| Dropzone wiring | `src/hooks/useFileUpload.ts` |
| Upload state | `src/stores/upload-store.ts` |
| Server action | `src/actions/parse.ts` |
| Origin and rate limit | `src/lib/parse-guard.ts` |
| Validation and chunking | `src/lib/document-utils.ts` |
| SDK wrapper | `src/lib/unstructured-client.ts` |
| Fixtures | `src/lib/unstructured-fixtures.ts` |
| Error copy | `src/lib/parse-errors.ts` |
| Mailto allowlist | `src/lib/safe-mailto.ts` |
| Types | `src/types/index.ts` |

UI and hooks may use the store, the server action, and utilities. The Unstructured SDK stays behind `src/lib/unstructured-client.ts` and `server-only`.

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
