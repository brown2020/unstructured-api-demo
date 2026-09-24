# Unstructured API Demo

A Next.js demo for [Unstructured.io](https://unstructured.io): drag-and-drop a PDF or image, parse it on the server with the Unstructured SDK, and inspect either a readable chunk view or the raw JSON element list.

## Features

- **Drag-and-drop upload** — `react-dropzone` client island; single file; PDF / PNG / JPEG
- **10 MB server + client limit** — validated in `document-utils` and the upload UI
- **Server Action parsing** — `parseFile` sends the buffer through `unstructured-client`
- **Chunked rendering** — elements grouped by titles/headings and page breaks; type-aware display
- **Raw JSON toggle** — inspect the structured response alongside the readable view
- **Error handling** — validation and API failures surface without crashing the page (`ErrorBoundary` + store errors)
- **Fixture mode** — `UNSTRUCTURED_USE_FIXTURES=true` short-circuits live API calls for CI / local demos

No authentication, Firebase, Stripe, or AI providers in this repo.

## Tech stack

| Layer | Choice |
| --- | --- |
| Framework | Next.js `^16.3.6` (App Router) |
| UI | React `^19.3.0`, Tailwind CSS `^4.3.3`, react-dropzone `^15` |
| Language | TypeScript `^6` |
| Parsing | `unstructured-client` `^0.31` |
| State | Zustand `^5` |
| Tests | Vitest `^5` |
| Lint | ESLint `^10` + `eslint-config-next` |
| Node | `>=20.9.0` (CI uses 22) |

## Project structure

```
src/
  app/                 # /, layout, not-found
  actions/parse.ts     # Server Action entry
  components/          # UploadAndParse, document views, upload panel, error/loading UI
  hooks/useFileUpload.ts
  stores/upload-store.ts
  lib/                 # UnstructuredService, fixtures, validation/chunking, errors
  types/
.env.example
.github/workflows/ci.yml
vitest.config.ts
```

## Getting started

### Prerequisites

- Node.js 20.9+ (22 recommended)
- npm
- An Unstructured API key (unless using fixtures only)

### Clone and install

```bash
git clone https://github.com/brown2020/unstructured-api-demo.git
cd unstructured-api-demo
npm install
```

### Environment variables

Copy `.env.example` to `.env.local`. **Never commit real keys.**

| Variable | Purpose | Where to get it |
| --- | --- | --- |
| `UNSTRUCTURED_API_KEY` | Auth for Unstructured partition API | [Unstructured](https://unstructured.io) dashboard |
| `UNSTRUCTURED_API_URL` | API endpoint (default in example: `https://api.unstructured.io/general/v0/general`) | Unstructured docs / dashboard |
| `UNSTRUCTURED_USE_FIXTURES` | `true` to use labeled fixture responses (CI / no credits) | Set locally or in CI |

### Run locally

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

Fixture-only checks:

```bash
UNSTRUCTURED_USE_FIXTURES=true npm test
UNSTRUCTURED_USE_FIXTURES=true npm run build
```

## Scripts

| Script | Description |
| --- | --- |
| `npm run dev` | Development server |
| `npm run build` | Production build |
| `npm start` | Serve production build |
| `npm run lint` | ESLint |
| `npm run typecheck` | `tsc --noEmit` |
| `npm test` | Vitest |
| `npm run validate` | lint + typecheck + test + build |

## Testing and CI

CI (`.github/workflows/ci.yml`) on `dev` / `main` and PRs:

1. `npm ci --ignore-scripts`
2. `npm run lint`
3. `npm run typecheck`
4. `npm test` with `UNSTRUCTURED_USE_FIXTURES=true`
5. `npm run build` with `UNSTRUCTURED_USE_FIXTURES=true`

Live Unstructured keys are optional for this gate. Tests cover parse action behavior (fixtures), document utils, and parse error mapping.

## Deployment

Deploy to Vercel or any Node host that supports Next.js. Set `UNSTRUCTURED_API_KEY` and `UNSTRUCTURED_API_URL` in the host environment for live parsing. No GitHub `homepageUrl` is configured for this repository.

## Contributing

1. Work on `dev`.
2. Prefer fixtures when iterating on UI/chunking without spending API credits.
3. Run `npm run validate` (or at least lint/typecheck/test) before pushing.
4. Do not commit `.env.local` or secrets.

## License

No `LICENSE` file is present in this repository.
