---
description: Scaffold a new feature module (types, hooks, backend, frontend, sidebar)
---

# New Module Workflow

When creating a new module, follow these steps in order:

## Step 0 — Database Schema
Update backend schema: `backend/src/db/schema/index.ts`
- Define the table schema using Drizzle ORM
- Define explicit `relations` using `relationName` for any foreign keys to prevent ambiguous joins.
- Always include `createdAt`, `updatedAt`, and `isActive` boolean (for soft deletes).
- Generate and apply Drizzle migrations.

## Step 1 — Types & API Hooks
Create frontend types and React Query hooks:

- **Types**: `src/features/<module>/types/index.ts`
  - Define interfaces for the module's data models
  - Include list response type with pagination
  
- **API Hooks**: `src/features/<module>/api/<module>.ts`
  - Query key factory pattern:
    ```ts
    export const moduleKeys = {
      all: ['<module>'] as const,
      lists: () => [...moduleKeys.all, 'list'] as const,
      list: (params?: object) => [...moduleKeys.lists(), params] as const,
      detail: (id: string) => [...moduleKeys.all, 'detail', id] as const,
    }
    ```
  - Helper for api.get params: `toRecord()` that filters undefined/empty values
  - Hooks: useList, useDetail, useCreate, useUpdate, useDelete
  - **CRITICAL**: Ensure the payload structure in the `useMutation` exactly matches the backend Hono expectation (e.g., if backend expects `{ items: [...] }`, the frontend must send `{ items: [...] }`, not single objects).
  - **CRITICAL**: Double check the endpoint URLs. A mismatch between frontend `/api/module/:id/items` and backend `/api/module/:id` will cause a 404.

## Step 2 — Backend Endpoints
Create Hono route file: `backend/src/routes/<module>.ts`

- Import from `backend/src/db/schema`
- Use Zod for validation
- Standard endpoints: GET / (with filter/pagination), GET /:id, POST /, PUT /:id, DELETE /:id
- **CRITICAL DELETE BEHAVIOR**: Use Soft Delete (`isActive: false`) instead of hard deleting rows if the data has foreign key history (e.g. products, categories).
- **CRITICAL ERROR HANDLING**: Ensure endpoints return `{ message: string }` exactly upon custom errors so the frontend fetch client can extract it.
- **CRITICAL LOGIC**: Verify the shape of the Zod schemas match the Frontend API Hook interfaces exactly.
- Register in `backend/src/index.ts`:
  ```ts
  import { <module>Routes } from './routes/<module>'
  api.route('/<module>', <module>Routes)
  ```

## Step 3 — Frontend Pages
Create route files in `src/routes/_authenticated/<module>/`:

- `index.tsx` — List page (summary cards, filters, table, pagination)
- `$id.tsx` — Detail page (info cards, actions)
- Other pages as needed

Route pattern:
```ts
export const Route = createFileRoute('/_authenticated/<module>/')({
  component: PageComponent,
})
```

## Step 4 — Sidebar Navigation
Update `src/components/layout/data/sidebar-data.ts`:
- Add menu section with icon and sub-items
- Use existing icon imports from lucide-react

## Step 5 — Verify
// turbo
```bash
cd /Users/yhonadewanata/Documents/DEVELOPMENT/React/yummy-addict-app && npx tsc --noEmit
```

## Conventions
- Language: Indonesian for UI labels, English for code
- Use `formatCurrency()` from `@/lib/utils` for IDR amounts
- Use `date-fns` for date formatting
- Use shadcn/ui Badge with colored variants for status indicators
- Use `toast` from `sonner` for notifications. **IMPORTANT:** Do not use `toast.error` in `catch` blocks for React Query mutations if `api-client.ts` or `handle-server-error.ts` already fires global error toasts. Simply `throw error` or `return` to prevent false success toasts in the UI.
- Use 'Nonaktifkan' instead of 'Delete' in UI labels for Soft Deletes.
- API client: `api.get(path, params?)`, `api.post(path, body)`, `api.put(path, body)`, `api.delete(path)`
