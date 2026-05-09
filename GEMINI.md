# Chat Reader

A Next.js application for reading and visualizing AI chat session JSON files. It provides a clean, web-based interface for exploring chat histories with markdown support and fullscreen viewing options.

## Project Overview

- **Frontend:** Next.js (App Router), React, TypeScript, Tailwind CSS.
- **Backend:** Hono (running on Vercel/Next.js runtime) for API endpoints.
- **Features:**
  - JSON file upload and drag-and-drop support.
  - API-based file listing and chat content retrieval (from a local `jsons` directory).
  - Custom markdown parsing for chat messages.
  - Responsive design with fullscreen mode.

## Key Technologies

- **Next.js 16:** React framework for the application structure.
- **Hono:** Lightweight web framework used for API routes (`/api/chat`, `/api/files`).
- **Tailwind CSS 4:** Styling and layout.
- **Lucide React:** Icon library (though imports suggest usage, mostly custom icons used in `page.tsx`).

## Getting Started

### Prerequisites

- Node.js installed.
- Dependencies installed via `npm install`.

### Available Scripts

- `npm run dev`: Starts the development server.
- `npm run build`: Builds the project for production.
- `npm run start`: Starts the production server.
- `npm run lint`: Runs ESLint for code quality checks.

## Architecture

- `app/page.tsx`: Main client-side entry point containing the chat reader UI and logic.
- `app/api/[[...route]]/route.ts`: Hono API entry point, routing requests to handlers.
- `api-chat.ts`: Handler for retrieving and processing specific chat JSON files.
- `api-files.ts`: Handler for listing available folders and JSON files in the `jsons` directory.
- `jsons/`: Directory intended to store chat session JSON files for server-side access.

## Development Conventions

- **API Handlers:** Logic for API endpoints is kept in top-level `api-*.ts` files for better organization.
- **Styling:** Uses utility-first CSS with Tailwind. Custom styles for markdown elements are handled via a `parseMarkdown` function in the main page.
- **Types:** TypeScript is used throughout the project for type safety.
