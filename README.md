# Unstructured API Demo

<div align="center">

[![Next.js](https://img.shields.io/badge/Next.js-14-black)](https://nextjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue)](https://www.typescriptlang.org/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind-3.4-38B2AC)](https://tailwindcss.com/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

[Demo](your-demo-url) · [Documentation](your-docs-url) · [Report Bug](issues-url) · [Request Feature](issues-url)

</div>

## 🚀 Quick Start

```bash
# Clone the repository
git clone https://github.com/brown2020/unstructured-api-demo.git

# Install dependencies
npm install

# Set up environment variables
cp .env.example .env.local

# Start development server
npm run dev
```

## 📖 Overview

A modern web application demonstrating the power of Unstructured.io's API for processing and analyzing unstructured data. Built with Next.js 14, TypeScript, and Tailwind CSS, this demo showcases how to transform complex documents into structured, actionable data.

### ✨ Key Features

- 📄 **Multi-Format Support**: Process PDFs, DOCX, images, and more
- 🔄 **Real-Time Processing**: Instant document parsing and structuring
- 🎨 **Modern UI**: Clean, responsive interface with Tailwind CSS
- 🔒 **Type Safety**: Full TypeScript implementation
- ⚡ **Server Actions**: Efficient server-side processing with Next.js
- 🔍 **Smart Parsing**: Intelligent document structure recognition

## 🛠️ Technical Stack

### Core Technologies

- **[Next.js 15](https://nextjs.org/)**: Latest React framework with server components and server actions
- **[React 19](https://reactjs.org/)**: Latest React version with improved performance
- **[TypeScript](https://www.typescriptlang.org/)**: Type-safe development with version 5.6.2
- **[Tailwind CSS](https://tailwindcss.com/)**: Utility-first CSS framework version 3.4.12
- **[Unstructured API](https://unstructured.io/)**: Document processing engine with version 0.18.1

### Key Dependencies

```json
{
  "dependencies": {
    "next": "^15.0.2",
    "react": "^19.0.0",
    "react-dom": "^19.0.0",
    "react-dropzone": "^14.2.3",
    "unstructured-client": "^0.18.1"
  },
  "devDependencies": {
    "@types/node": "^22.5.5",
    "@types/react": "^19.0.1",
    "@types/react-dom": "^19.0.2",
    "eslint": "^9.15.0",
    "eslint-config-next": "^15.0.2",
    "postcss": "^8.4.47",
    "tailwindcss": "^3.4.12",
    "typescript": "^5.6.2"
  }
}
```

### Development Scripts

```bash
# Available commands
npm run dev      # Start development server
npm run build    # Build for production
npm run start    # Start production server
npm run lint     # Run ESLint checks
```

## 🏗️ Project Structure

```
src/
├── actions/
│   └── parse.ts           # Server actions for document processing
├── components/
│   ├── DocumentContent.tsx # Document rendering component
│   ├── ErrorBoundary.tsx  # Error handling wrapper
│   ├── LoadingSkeleton.tsx # Loading state component
│   └── UploadAndParse.tsx # Main upload component
├── types/
│   └── types.d.ts        # TypeScript definitions
└── utils/
    ├── cache.ts          # Caching utilities
    └── rateLimit.ts      # Rate limiting implementation
```

## 🚀 Getting Started

### Prerequisites

- Node.js 18+
- npm or yarn
- Unstructured API credentials

### Environment Setup

Create a `.env.local` file with:

```env
UNSTRUCTURED_API_KEY=your_api_key
UNSTRUCTURED_API_URL=your_api_url
```

### Development

```bash
# Start development server
npm run dev

# Run type checking
npm run type-check

# Build for production
npm run build

# Start production server
npm start
```

## 🔧 Configuration

### Rate Limiting

```typescript
// src/utils/rateLimit.ts
const REQUESTS_PER_MINUTE = 10;
```

### Cache Duration

```typescript
// src/utils/cache.ts
const CACHE_DURATION = 1000 * 60 * 60; // 1 hour
```

## 🤝 Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📝 License

Distributed under the MIT License. See `LICENSE` for more information.

## 🙏 Acknowledgments

- [Unstructured.io](https://unstructured.io/) for their excellent API
- [Vercel](https://vercel.com) for Next.js and hosting
- [Tailwind Labs](https://tailwindcss.com/) for the CSS framework

## 📫 Contact

Email: [info@ignitechannel.com](mailto:info@ignitechannel.com)

Project Link: [https://github.com/brown2020/unstructured-api-demo](https://github.com/brown2020/unstructured-api-demo)

---

<div align="center">
Made with ❤️ by Ignite Channel
</div>
