# task-management

A simple task management app built with Next.js 15 and tRPC. Tasks are stored in memory on the server — no database required.

## Stack

- Next.js 15 (App Router)
- tRPC v11 for type-safe API calls
- React Query v5 for data fetching and caching
- Zod for input validation
- Tailwind CSS for styling

## Features

- List, create, edit, and delete tasks
- Server-side rendering for the task list on initial load
- Infinite scroll to load tasks in pages
- Visual feedback on success and error states
- Form validation on the client and server

## Getting started

Install dependencies:

```bash
npm install
```

Run the development server:

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## How it works

Tasks live in a module-level array on the server. The tRPC router exposes five procedures: `listTasks` (with cursor-based pagination), `getTaskById`, `createTask`, `updateTask`, and `deleteTask`.

The home page is a React Server Component that prefetches the first page of tasks and passes the serialized cache to the client via `HydrateClient`. The `TaskList` client component picks up that data immediately on hydration and uses an `IntersectionObserver` to trigger subsequent page loads as the user scrolls.

The create and edit pages share a single `TaskForm` component. When a task prop is passed the form enters edit mode; otherwise it creates a new task.
