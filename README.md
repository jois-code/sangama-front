# Sangama Frontend

Sangama Frontend is a modern React Single-Page Application (SPA) built with Vite and Tailwind CSS. It serves as the user interface for the PESU-Exclusive Social Platform, providing students and faculty with tools to manage clubs, academic resources, events, and capstone teams.

## Tech Stack

- **Framework:** React 19
- **Build Tool:** Vite
- **Language:** TypeScript
- **Styling:** Tailwind CSS v4
- **Routing:** React Router v7
- **Icons:** Lucide React
- **HTTP Client:** Axios
- **State Management:** React Context API & custom hooks
- **PDF Viewer:** React-PDF
- **Drag and Drop:** dnd-kit
- **Markdown Rendering:** react-markdown
- **Offline Caching:** idb-keyval

## Features

- **PESU Authentication**: Secure login flow integrating with backend PESU credentials.
- **Dashboards**: Dedicated dashboard views for general users, club management, and global administrators.
- **Academic Hub**: Access course materials, custom course notes, and academic summaries (ISA/ESA results).
- **Clubs & Events**: Discover, join, and manage campus clubs, as well as browse upcoming events.
- **Capstone Team Finder**: Connect with peers for capstone projects.
- **Global Search**: Quickly find clubs, events, users, and resources.

## Project Structure

The source code is organized within the `src/` directory to maintain a clean architecture:

```text
frontend/
├── src/
│   ├── api/          # Axios interceptors, API clients, and TypeScript interfaces (types.ts)
│   ├── assets/       # Static assets like images and fonts
│   ├── components/   # Reusable UI components and layouts (Sidebar, ProtectedRoute, etc.)
│   ├── hooks/        # Custom React hooks (e.g., useAuth)
│   ├── pages/        # Page-level components organized by feature (Clubs, Events, Notes, Admin)
│   ├── utils/        # Helper functions and utilities
│   ├── App.tsx       # Main application routing and entry point
│   ├── index.css     # Global Tailwind CSS imports and custom base styles
│   └── main.tsx      # React DOM rendering entry point
├── index.html        # Vite HTML template
├── package.json      # Dependencies and scripts
├── tailwind.config.* # Tailwind CSS configuration
├── tsconfig.json     # TypeScript configuration
└── vite.config.ts    # Vite bundler configuration
```

## Prerequisites

- **Node.js** (v18+ recommended)
- **npm** (comes with Node.js)

## Installation & Setup

1. **Install dependencies:**
   Ensure you are in the `frontend` directory, then run:
   ```bash
   npm install
   ```

2. **Configure Environment Variables:**
   If your backend is running on a different port or host, you may need to specify the base URL. By default, the frontend is configured to communicate with the local backend running at `http://127.0.0.1:8000`.

## Running the Application

Start the Vite development server:

```bash
npm run dev
```

The application will be available at `http://localhost:5173`.

## Available Scripts

- `npm run dev`: Starts the local development server with Hot Module Replacement (HMR).
- `npm run build`: Compiles TypeScript and builds the app for production into the `dist/` folder.
- `npm run preview`: Locally previews the production build.
- `npm run lint`: Runs ESLint to identify code quality issues.
