# Unstructured API Demo

A Next.js demo for [Unstructured.io](https://unstructured.io). Drop a PDF or image, parse it on the server with the Unstructured SDK, and inspect a readable chunk view or the raw JSON.

## Features

- Drag-and-drop upload for a single PDF, PNG, or JPEG (`react-dropzone`)
- 4 MB client and server limit, under the 4.5 MB Vercel function body cap
- File type check requires a matching extension and PDF/PNG/JPEG magic bytes
- `parseFile` Server Action checks the request origin and rate-limits calls, then partitions the file
- Parse failures are returned as data so production does not redact the message
- Chunks grouped by titles, headings, and page breaks, with type-aware rendering
- Plain-address `mailto` links only
- Raw JSON toggle
- Hi-Res strategy is server-only
- Fixture mode for development and test. Production ignores it
- No authentication, Firebase, Stripe, or AI providers

## Tech stack

| Layer | Package |
| --- | --- |
| Framework | `next` `^16.4.3` (App Router) |
| UI | `react` `^19.3.1`, `react-dom` `^19.3.1`, `tailwindcss` `^4.3.3`, `react-dropzone` `^20.1.4` |
| Language | `typescript` `^6.0.3` |
| Parsing | `unstructured-client` `^0.31.0` |
| State | `zustand` `^5.0.16` |
| Tests | `vitest` `^5.0.5`, `vite` `^8.3.5` |
| Lint | `eslint` `^10.13.0`, `eslint-config-next` `^16.4.3` |
| Node | `>=20.9.0` (CI uses 22) |

## Project structure

```
src/
  app/                 # /, layout, not-found
  actions/parse.ts     # Server Action entry
  components/          # Upload shell, document views, upload panel, error/loading UI
  hooks/useFileUpload.ts
  stores/upload-store.ts
  lib/                 # Unstructured client, fixtures, validation, rate limit, errors
  types/
.env.example
.github/workflows/ci.yml
vitest.config.mts
SPEC.md
roadmap.md
```

## Getting started

### Prerequisites

- Node.js 20.9+ (22 recommended)
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
| `UNSTRUCTURED_API_KEY` | Live parsing | Server-only Unstructured API key |
| `UNSTRUCTURED_API_URL` | Live parsing | Server-only partition endpoint |
| `UNSTRUCTURED_HI_RES` | No | Set to `true` on the server to use the Hi-Res strategy. Unset uses Auto. Callers cannot turn this on |
| `UNSTRUCTURED_USE_FIXTURES` | No | Set to `true` in development or test for labeled fixture chunks. Ignored when `NODE_ENV` is `production` |

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

The gate does not use a live API key. Tests cover the parse action, origin and rate limits, file validation, chunking, the Unstructured request shape, fixtures, and upload-store races.

## Deployment

Deploy to Vercel or any Node host that supports Next.js. Set `UNSTRUCTURED_API_KEY` and `UNSTRUCTURED_API_URL` in the host environment for live parsing. Leave `UNSTRUCTURED_USE_FIXTURES` unset in production.

## Contributing

1. Work on `dev`.
2. Use fixtures when changing UI or chunking so you do not spend API credits.
3. Run `npm run validate` before pushing.
4. Do not commit `.env.local` or secrets.

## License

[GNU Affero General Public License v3.0](LICENSE.md) (AGPL-3.0).
