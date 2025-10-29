# Simple MERN Kanban Board

This project provides a minimal Kanban board built with the MERN stack. The backend exposes a REST API for managing tasks, while the frontend renders three columns (To Do, In Progress, Done) and allows creating, updating and deleting cards.

## Prerequisites

- Node.js 18+

## Backend (Node HTTP API)

The API persists data to a small JSON file on disk so it can run without MongoDB or any third-party packages. Tasks are seeded with a few example cards on first launch.

```bash
cd server
cp .env.example .env # optional; customise the PORT if needed
npm run start
```

The API will be available at `http://localhost:5000`. Endpoints include:

- `GET /api/tasks` – list tasks grouped by status
- `POST /api/tasks` – create a new task (`title`, optional `description`, optional `status`)
- `PUT /api/tasks/:id` – update task fields (e.g. move between columns)
- `DELETE /api/tasks/:id` – remove a task

## Frontend (React + Vite)

```bash
cd client
npm install
npm run dev
```

The development server runs on `http://localhost:5173` and proxies API calls to the backend. Create tasks using the form and move them across columns with the status dropdown.

## Project structure

```
.
├── client/    # React application
└── server/    # Node API and JSON data store
```

Feel free to extend the styling, add authentication, or introduce drag-and-drop interactions as next steps.
