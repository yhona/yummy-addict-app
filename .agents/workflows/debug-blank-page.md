---
description: Debug and fix a page that shows blank or error
---

# Debug Blank Page Workflow

When a page shows blank/error, follow these debugging steps:

## Step 1 — Check Terminal for Errors
Look at the Vite dev server terminal output for compile errors or warnings.

## Step 2 — Check Imports
Common causes of blank pages:

### Missing barrel exports
Check if the component being imported is actually exported from the barrel file (index.ts):
```bash
grep -n "export" <barrel-file-path>
```

### Wrong api.get parameter pattern
`api.get` expects params directly, NOT nested:
```ts
// ❌ WRONG
api.get('/api/endpoint', { params: data })

// ✅ CORRECT  
api.get('/api/endpoint', data)
```

### Missing component
Check if all imported components exist:
```bash
# Search for component definition
grep -rn "export.*ComponentName" src/
```

## Step 3 — TypeScript Check
// turbo
```bash
cd /Users/yhonadewanata/Documents/DEVELOPMENT/React/yummy-addict-app && npx tsc --noEmit 2>&1 | head -30
```

## Step 4 — Check Browser Console
Ask the user to open browser DevTools (F12) → Console tab and share the error message.

## Common Fixes
| Issue | Fix |
|-------|-----|
| Import not found | Add missing export to barrel index.ts |
| api.get fails | Pass params directly, not in `{ params }` |
| Route not found | Check `routeTree.gen.ts` was regenerated |
| Component undefined | Check named export matches import |
