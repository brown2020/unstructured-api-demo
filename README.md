# Unstructured API Demo

This repository demonstrates how to use the Unstructured API to process and analyze various types of unstructured data, such as PDFs and DOCX files. The goal is to make it easier to extract meaningful information from documents that are often difficult to parse and structure.

## Motivation

In many applications, unstructured data (like scanned documents, emails, and reports) holds valuable information. However, extracting and structuring this information is often challenging. The Unstructured API simplifies this process by providing a robust, flexible solution to convert unstructured data into structured formats, making it easier to analyze and integrate into your applications.

## Features

- **Data Ingestion:** Supports multiple data formats (PDF, DOCX, HTML, etc.).
- **Data Processing:** Converts unstructured data into structured formats.
- **Integration:** Examples of integrating the API with Next.js and React.

## Getting Started

### Prerequisites

- Node.js (latest LTS version)
- An API key and URL from [Unstructured.io](https://unstructured.io/)

### Installation

1. Clone the repository:

   ```bash
   git clone https://github.com/brown2020/unstructured-api-demo.git
   cd unstructured-api-demo
   ```

2. Install dependencies:

   ```bash
   npm install
   ```

3. Create a `.env.local` file by copying `.env.example`:

   ```bash
   cp .env.example .env.local
   ```

4. Replace the placeholder values in `.env.local` with your actual `UNSTRUCTURED_API_KEY` and `UNSTRUCTURED_API_URL`.

### Running the Application

- **Development Server**:

  ```bash
  npm run dev
  ```

- **Build for Production**:

  ```bash
  npm run build
  npm start
  ```

### Usage

1. Navigate to the upload page.
2. Drag & drop or select a file to upload.
3. The file will be parsed, and the structured data will be displayed.

## Technologies Used

### [Unstructured.io](https://unstructured.io/)

The core API for parsing unstructured data, enabling the conversion of diverse document formats into structured, machine-readable data.

### [Next.js 14](https://nextjs.org/)

A powerful React framework for building fast, server-rendered web applications with rich features like static generation, server-side rendering, and server actions.

### [Next.js Server Actions](https://nextjs.org/docs/app/building-your-application/data-fetching/server-actions)

Server Actions in Next.js 14 allow for seamless integration of server-side logic directly into your React components, improving data handling and performance.

### [Tailwind CSS](https://tailwindcss.com/)

A utility-first CSS framework that enables rapid UI development by providing a set of classes for styling directly in your HTML.

### [TypeScript](https://www.typescriptlang.org/)

A typed superset of JavaScript that adds static types, making code more robust and easier to debug.

### [React Dropzone](https://react-dropzone.js.org/)

A React component for handling file uploads through drag-and-drop, simplifying user interactions with file input fields.

## Code Overview

- **Server Actions**: Located in `app/actions/parse.ts`, handles file parsing using the Unstructured API.
- **Components**:
  - `UploadAndParse`: Handles file uploads and displays parsed data.

### Contributing

Submit issues and pull requests for enhancements and bug fixes.

### License

This project is licensed under the MIT License.
