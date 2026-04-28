# 🏖️ Beach AI Project Assistant

Personal AI Project Management Assistant with a white beach theme.

## Features

- **Dashboard** — Overview of all projects with progress tracking and key metrics
- **Project Management** — Detailed project views with tasks, resources, contacts, and finances
- **AI Assistant** — Chat-based AI helper for project guidance and recommendations
- **Settings** — User profile and application configuration

## Tech Stack

- **Frontend:** React + TypeScript + Vite + shadcn/ui + Tailwind CSS
- **Backend:** FastAPI (Python) + Atoms Cloud
- **Database:** PostgreSQL (via Atoms Cloud)

## Getting Started

### Prerequisites

- Node.js 18+
- pnpm

### Frontend

```bash
cd frontend
pnpm install
pnpm dev
```

### Backend

```bash
cd backend
pip install -r requirements.txt
uvicorn main:app --reload
```

## Project Structure

```
app/
├── frontend/          # React + Vite frontend
│   ├── src/
│   │   ├── pages/     # Page components (Dashboard, ProjectDetail, AIAssistant, Settings)
│   │   ├── components/# Shared UI components (AppLayout)
│   │   └── lib/       # API client and utilities
│   └── public/        # Static assets
├── backend/           # FastAPI backend
│   ├── models/        # Database models
│   ├── routers/       # API route handlers
│   ├── schemas/       # Request/response schemas
│   └── services/      # Business logic
└── README.md
```

## License

MIT