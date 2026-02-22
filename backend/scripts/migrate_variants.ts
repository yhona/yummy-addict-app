import { db } from '../src/db'
import { sql } from 'drizzle-orm'

async function migrate() {
  console.log('🔄 Applying variants migration...')
  
  // Add parent_id column if not exists
  await db.execute(sql`
    DO $$
    BEGIN
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'products' AND column_name = 'parent_id') THEN
            ALTER TABLE "products" ADD COLUMN "parent_id" uuid;
        END IF;
    END
    $$;
  `)
  
  console.log('✅ Migration applied!')
  process.exit(0)
}

migrate().catch(e => {
  console.error(e)
  process.exit(1)
})
