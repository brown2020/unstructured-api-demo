# Unstructured API Demo

Modern document-parsing demo that showcases how to stream PDFs and images through [Unstructured.io](https://unstructured.io) using **Next.js 16**, **React 19**, and **TypeScript**. The UI runs primarily as server components, while a small upload client island handles drag-and-drop, Zustand-powered state, and raw JSON inspection.

<p align="center">
  <a href="https://nextjs.org/"><img alt="Next.js" src="https://img.shields.io/badge/Next.js-16-black" /></a>
  <a href="https://www.typescriptlang.org/"><img alt="TypeScript" src="https://img.shields.io/badge/TypeScript-5.6-3178C6" /></a>
  <a href="https://tailwindcss.com/"><img alt="Tailwind" src="https://img.shields.io/badge/Tailwind-4.0-06B6D4" /></a>
  <a href="./LICENSE"><img alt="License: MIT" src="https://img.shields.io/badge/License-MIT-yellow" /></a>
</p>

---

## Table of Contents

1. [Features](#features)
2. [Architecture](#architecture)
3. [Package Inventory](#package-inventory)
4. [Getting Started](#getting-started)
5. [Environment Variables](#environment-variables)
6. [Development Scripts](#development-scripts)
7. [Project Structure](#project-structure)
8. [Contributing](#contributing)
9. [License](#license)

---

## Features

- **Drag-and-drop uploads** powered by `react-dropzone`, limited to PDFs and images under 10 MB.
- **Server Actions pipeline** that streams the file buffer directly to `unstructured-client` using the Hi-Res strategy toggle.
- **Smart chunk rendering**: headings, tables, images, footers, and email addresses are normalized and rendered with semantic UI primitives.
- **Zustand store** for upload state (loading, errors, raw JSON toggle) to keep the client bundle small and predictable.
- **Tailwind CSS v4** design system with responsive typography and subtle motion for dropzone states.

---

## Architecture

| Layer | Responsibilities | Key files |
| --- | --- | --- |
| **App Router (RSC)** | Layout, metadata, hero copy | `src/app/layout.tsx`, `src/components/UploadAndParse.tsx` |
| **Client Upload Island** | Drag-and-drop, progress UI, raw JSON toggle | `src/components/upload/ClientUploadPanel.tsx`, `src/hooks/useFileUpload.ts` |
| **Zustand Store** | Atomic upload state, server action orchestration | `src/stores/upload-store.ts` |
| **Server Actions** | File validation, parsing via Unstructured | `src/actions/parse.ts`, `src/lib/document-utils.ts`, `src/lib/unstructured-client.ts` |
| **Rendering** | Typed document elements & chunk layout | `src/components/DocumentContent.tsx`, `src/components/DocumentElements.tsx`, `src/types/index.ts` |

---

## Package Inventory

The stack below mirrors the `package-lock.json` and reflects every top-level dependency currently used:

### Runtime Dependencies

| Package | Version | Purpose |
| --- | --- | --- |
| `next` | ^16.0.3 | App Router, server actions, RSC |
| `react`, `react-dom` | ^19.0.0 | UI runtime |
| `react-dropzone` | ^14.2.3 | Accessible drag-and-drop uploads |
| `unstructured-client` | ^0.29.1 | Official SDK for Unstructured API |
| `zustand` | ^5.0.9 | Lightweight upload store |

### Dev / Build Tooling

| Package | Version | Purpose |
| --- | --- | --- |
| `tailwindcss`, `@tailwindcss/postcss` | ^4.0.8 | Styling via Tailwind v4 pipeline |
| `postcss` | ^8.4.47 | CSS transforms |
| `typescript` | ^5.6.2 | Type safety |
| `eslint`, `eslint-config-next` | ^9.15.0 / ^16.0.3 | Linting |
| `@types/node`, `@types/react`, `@types/react-dom` | Latest | Type defs for Node/React |

---

## Getting Started

### Prerequisites

- Node.js **18.18+** or **20+**
- npm **10+**
- Active Unstructured API key and server URL

### Installation

```bash
git clone https://github.com/brown2020/unstructured-api-demo.git
cd unstructured-api-demo
npm install
cp .env.example .env.local
```

### Development

```bash
npm run dev        # Start Next.js in development mode
npm run build      # Create an optimized production build
npm run start      # Serve the production build
npm run lint       # Run ESLint (Next.js 16 CLI)
```

> **Heads-up:** Next.js 16 currently treats `next lint` script names as project directories. If you encounter “Invalid project directory …/lint”, run `npx next lint` directly as a workaround until the upstream bug is fixed.

---

## Environment Variables

Create `.env.local` with the following keys:

```env
UNSTRUCTURED_API_KEY=your_api_key
UNSTRUCTURED_API_URL=https://api.unstructured.io/general/v0/general
```

Optional tweaks:

| Variable | Description |
| --- | --- |
| `UNSTRUCTURED_API_URL` | Override default base URL / proxy |
| `NEXT_PUBLIC_ANALYTICS_ENABLED` | Wire up custom logging if you add it |

---

## Project Structure

```
src/
├── actions/
│   └── parse.ts               # Server action entry point
├── app/
│   ├── layout.tsx             # RSC root layout
│   └── page.tsx               # Home route compostion
├── components/
│   ├── DocumentContent.tsx    # Renders normalized chunks
│   ├── DocumentElements.tsx   # Per-element presenters
│   ├── LoadingSkeleton.tsx
│   ├── UploadAndParse.tsx     # Hero + client island slot
│   └── upload/
│       └── ClientUploadPanel.tsx
├── hooks/
│   └── useFileUpload.ts       # Dropzone + store wiring
├── lib/
│   ├── document-utils.ts      # File validation + chunking
│   └── unstructured-client.ts # SDK wrapper
├── stores/
│   └── upload-store.ts        # Zustand store definition
└── types/
    └── index.ts               # Shared TypeScript contracts
```

---

## Contributing

1. Fork the repository.
2. Create a feature branch: `git checkout -b feature/my-improvement`.
3. Commit with context: `git commit -m "feat: add table renderer"`.
4. Push and open a PR describing motivation, testing, and screenshots/video of the flow.

We welcome ideas such as streaming progress indicators, AI summarization via Vercel AI SDK, additional file validations, or automated tests (Jest + React Testing Library).

---

## License

Distributed under the [MIT License](./LICENSE). See the license file for details.

---

### Support

Questions or ideas? Open an issue or reach out at [info@ignitechannel.com](mailto:info@ignitechannel.com). Contributions and feedback are always appreciated!
