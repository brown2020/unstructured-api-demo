# Unstructured API Demo

A Next.js demo for [Unstructured](https://unstructured.io). Drop a supported document, parse it with the Transform API, and inspect a readable chunk view or the raw JSON.

## Features

- Drag-and-drop upload for one BMP, DOCX, HEIC, JPEG, PDF, PNG, PPTX, or TIFF file (`react-dropzone`)
- 4 MB client and server limit, under the 4.5 MB Vercel function body cap
- File type check requires a matching extension and a matching file signature
- `POST /api/parse` checks the request origin and rate-limits calls, then posts the file to the Transform API as multipart field `input`
- A 200 response is mapped from `elements` (or markdown) into the existing chunk view. A 202 response is polled at `Location` or `poll_url` until the job finishes
- Upstream failures become fixed messages and HTTP status codes. The API key and raw response bodies are not returned
- A **Demo data** badge and sample results appear when the key is missing, when `UNSTRUCTURED_USE_FIXTURES=true`, or when the account is out of credits
- Chunks grouped by titles, headings, and page breaks, with type-aware rendering
- Plain-address `mailto` links only
- Raw JSON toggle
- No authentication, Firebase, Stripe, or AI providers

## Tech stack

| Layer | Package |
| --- | --- |
| Framework | `next` `^16.4.3` (App Router) |
| UI | `react` `^19.3.1`, `react-dom` `^19.3.1`, `tailwindcss` `^4.3.3`, `react-dropzone` `^20.1.4` |
| Language | `typescript` `^6.0.3` |
| Parsing | Transform API `POST /api/v2/parse` (fetch, no SDK) |
| State | `zustand` `^5.0.16` |
| Tests | `vitest` `^5.0.5`, `vite` `^8.3.5` |
| Lint | `eslint` `^10.13.0`, `eslint-config-next` `^16.4.3` |
| Node | `>=24` (CI uses 24) |

## Project structure

```
src/
  app/                 # /, layout, not-found, api/parse
  actions/parse.ts     # Server Action wrapper around the same parse path
  components/          # Upload shell, document views, upload panel, error/loading UI
  hooks/useFileUpload.ts
  stores/upload-store.ts
  lib/                 # Transform client, fixtures, validation, rate limit, errors
  types/
.env.example
.github/workflows/ci.yml
vitest.config.mts
SPEC.md
roadmap.md
```

## Getting started

### Prerequisites

- Node.js 24 or newer
- npm
- An Unstructured API key for live parsing. Fixture mode does not need one.

### Install

```bash
git clone https://github.com/brown2020/unstructured-api-demo.git
cd unstructured-api-demo
npm install
```

### Environment variables

Copy `.env.example` to `.env.local`. Do not commit real keys. Names only:

| Name | Required | Purpose |
| --- | --- | --- |
| `UNSTRUCTURED_API_KEY` | Live parsing | Server-only key sent as `unstructured-api-key`. Never logged or returned |
| `UNSTRUCTURED_API_URL` | No | Transform base URL. Defaults to `https://transform.unstructured.io/api/v2`. A legacy `api.unstructuredapp.io` value uses that default |
| `UNSTRUCTURED_USE_FIXTURES` | No | Set to `true` to return sample results and skip the live API, including in production |

The app reads these at request time. `next build` does not need them.

### Run

```bash
npm run dev
```

Open the local dev server (port 3000 by default).

Fixture-only checks:

```bash
UNSTRUCTURED_USE_FIXTURES=true npm test
npm run build
```

## Scripts

| Script | Description |
| --- | --- |
| `npm run dev` | Development server |
| `npm run build` | Production build |
| `npm start` | Serve the production build |
| `npm run lint` | ESLint |
| `npm run typecheck` | `tsc --noEmit` |
| `npm test` | Vitest |
| `npm run validate` | lint, typecheck, test, and build |

## Testing and CI

`.github/workflows/ci.yml` runs on `dev`, `main`, and pull requests:

1. `npm ci --ignore-scripts`
2. `npm run lint`
3. `npm run typecheck`
4. `npm test` with `UNSTRUCTURED_USE_FIXTURES` enabled
5. `npm run build` with `UNSTRUCTURED_USE_FIXTURES` enabled

The gate does not use a live API key. Tests mock `fetch` for Transform responses (200, 202 then poll, 401, 402, and 415) and cover validation, fixtures, and upload-store races. CI runs on Node 24.

## Deployment

Deploy to Vercel or any Node host that supports Next.js. Set `UNSTRUCTURED_API_KEY` for live parsing. `UNSTRUCTURED_API_URL` is optional and defaults to the Transform v2 base. A missing key or an account that is out of credits shows sample results with a Demo data badge. A rejected key, unsupported file, rate limit, or outage returns a fixed error instead.

## Contributing

1. Work on `dev`.
2. Use fixtures when changing UI or chunking so you do not spend API credits.
3. Run `npm run validate` before pushing.
4. Do not commit `.env.local` or secrets.

## License

[GNU Affero General Public License v3.0](LICENSE.md) (AGPL-3.0).
