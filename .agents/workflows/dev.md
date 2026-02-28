---
description: Start the development servers (frontend + backend)
---

# Dev Server Workflow

// turbo-all

1. Start the frontend dev server (Vite):
```bash
cd /Users/yhonadewanata/Documents/DEVELOPMENT/React/yummy-addict-app && npm run dev
```

2. Start the backend dev server (Bun + Hono):
```bash
cd /Users/yhonadewanata/Documents/DEVELOPMENT/React/yummy-addict-app/backend && bun run dev
```

## URLs
- Frontend: http://localhost:5173
- Backend API: http://localhost:3001
- Health check: http://localhost:3001/health

## Notes
- Frontend uses Vite with HMR (auto-refresh on save)
- Backend uses Bun with watch mode
- Make sure PostgreSQL is running before starting backend
