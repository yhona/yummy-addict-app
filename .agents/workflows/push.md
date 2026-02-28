---
description: Typecheck, commit, and push changes to GitHub
---

# Push Workflow

// turbo-all

1. Run TypeScript type check:
```bash
cd /Users/yhonadewanata/Documents/DEVELOPMENT/React/yummy-addict-app && npx tsc --noEmit
```

2. Stage all changes:
```bash
cd /Users/yhonadewanata/Documents/DEVELOPMENT/React/yummy-addict-app && git add -A && git status --short
```

3. Ask the user for a commit message, or generate one based on the staged changes.

4. Commit and push:
```bash
cd /Users/yhonadewanata/Documents/DEVELOPMENT/React/yummy-addict-app && git commit -m "<message>" --no-verify && git push origin main
```
