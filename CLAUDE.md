# CLAUDE.md

This file provides guidance for Claude Code (claude.ai/code) when working with this repository.

## Project Overview

This is a Next.js 16 demo application for the Unstructured API, showcasing document parsing with drag-and-drop file uploads. It processes PDFs and images using the Unstructured API and displays parsed content in a structured, readable format.

## Tech Stack

- **Framework**: Next.js 16 with App Router and React Server Components
- **React**: 19.x
- **State Management**: Zustand 5.x
- **Styling**: Tailwind CSS v4
- **File Upload**: react-dropzone
- **API Client**: unstructured-client SDK

## Common Commands

```bash
npm run dev      # Start development server (localhost:3000)
npm run build    # Production build
npm run start    # Serve production build
npm run lint     # Run ESLint
```

## Project Structure

```
src/
├── actions/parse.ts              # Server action for document parsing
├── app/
│   ├── layout.tsx                # Root layout with metadata
│   ├── page.tsx                  # Home page
│   ├── not-found.tsx             # Custom 404 page
│   └── globals.css               # Tailwind v4 styles
├── components/
│   ├── DocumentContent.tsx       # Renders parsed chunks with JSON toggle
│   ├── DocumentElements.tsx      # Element type-specific renderers
│   ├── ErrorBoundary.tsx         # React error boundary for graceful failures
│   ├── LoadingSkeleton.tsx       # Loading placeholder
│   ├── UploadAndParse.tsx        # Main hero/layout component
│   └── upload/ClientUploadPanel.tsx  # Drag-and-drop upload UI
├── hooks/useFileUpload.ts        # Custom hook for react-dropzone + Zustand
├── lib/
│   ├── document-utils.ts         # File validation, chunking logic
│   └── unstructured-client.ts    # UnstructuredService API wrapper
├── stores/upload-store.ts        # Zustand store for upload state (with race condition protection)
└── types/index.ts                # TypeScript interfaces
```

## Architecture Patterns

### Server Actions
All document processing uses Next.js Server Actions (not API routes). The main entry point is `parseFile()` in `src/actions/parse.ts`.

### State Management
Zustand store (`upload-store.ts`) manages:
- `chunks`: Parsed document data
- `status`: "idle" | "uploading" | "ready" | "error"
- `showRawJson`: Toggle for JSON view
- Actions: `uploadDocument()`, `toggleShowRaw()`, `setError()`, `reset()`

### File Validation
- Accepted types: PDF, PNG, JPEG
- Max size: 10MB
- Constants in `lib/document-utils.ts`: `ACCEPTED_FILE_TYPES`, `MAX_FILE_SIZE_BYTES`

### Document Chunking
Elements are organized into chunks by heading types (Title, Header, Heading) and PageBreak markers. See `organizeElementsIntoChunks()` in `lib/document-utils.ts`.

## Environment Variables

Required in `.env.local`:
```
UNSTRUCTURED_API_KEY=your_api_key
UNSTRUCTURED_API_URL=https://api.unstructured.io/general/v0/general
```

## Key Files for Common Tasks

| Task | Primary Files |
|------|---------------|
| Modify upload behavior | `hooks/useFileUpload.ts`, `components/upload/ClientUploadPanel.tsx` |
| Change file validation | `lib/document-utils.ts` |
| Modify API calls | `lib/unstructured-client.ts`, `actions/parse.ts` |
| Add element renderers | `components/DocumentElements.tsx` |
| Adjust chunking logic | `lib/document-utils.ts` |
| Modify state management | `stores/upload-store.ts` |

## Type Definitions

Core types in `types/index.ts`:
- `Element`: Document segment with type, element_id, text, metadata
- `Chunk`: Heading + array of Elements
- `Metadata`: Filetype, languages, page_number, filename
- `ParseError`: Error with statusCode and details

## Server Action Configuration

`next.config.mjs` sets:
- Body size limit: 20MB
- Max duration: 120 seconds

## Element Types Supported

Title, NarrativeText, EmailAddress, UncategorizedText, PageNumber, Image, Heading, Header, Table, Footer, PageBreak
