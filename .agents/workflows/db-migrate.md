---
description: Generate and apply Drizzle ORM database migration
---

# Database Migration Workflow

1. Generate migration from schema changes:
```bash
cd /Users/yhonadewanata/Documents/DEVELOPMENT/React/yummy-addict-app/backend && bunx drizzle-kit generate
```

2. Review the generated SQL file in `backend/src/db/migrations/` — confirm with the user before applying.

3. Apply the migration:
```bash
cd /Users/yhonadewanata/Documents/DEVELOPMENT/React/yummy-addict-app/backend && bunx drizzle-kit migrate
```

4. Verify migration was applied by checking the database or inspecting the migration journal:
```bash
cat /Users/yhonadewanata/Documents/DEVELOPMENT/React/yummy-addict-app/backend/src/db/migrations/meta/_journal.json | tail -20
```

## Notes
- Schema file: `backend/src/db/schema/index.ts`
- Config file: `backend/drizzle.config.ts`
- Make sure PostgreSQL is running before applying migration
