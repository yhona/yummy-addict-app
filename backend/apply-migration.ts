import { sql } from 'drizzle-orm'
import { db } from './src/db'

async function run() {
  try {
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS "bundle_items" (
        "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
        "bundle_id" uuid NOT NULL,
        "product_id" uuid NOT NULL,
        "quantity" integer DEFAULT 1 NOT NULL
      );
    `);
    
    // Add column if it doesn't exist
    await db.execute(sql`
      DO $$ BEGIN
        BEGIN
          ALTER TABLE "products" ADD COLUMN "type" varchar(20) DEFAULT 'standard' NOT NULL;
        EXCEPTION
          WHEN duplicate_column THEN null;
        END;
      END $$;
    `);

    // Add constraints if they don't exist
    await db.execute(sql`
      DO $$ BEGIN
        BEGIN
          ALTER TABLE "bundle_items" ADD CONSTRAINT "bundle_items_bundle_id_products_id_fk" FOREIGN KEY ("bundle_id") REFERENCES "public"."products"("id") ON DELETE cascade ON UPDATE no action;
        EXCEPTION
          WHEN duplicate_object THEN null;
        END;
        BEGIN
          ALTER TABLE "bundle_items" ADD CONSTRAINT "bundle_items_product_id_products_id_fk" FOREIGN KEY ("product_id") REFERENCES "public"."products"("id") ON DELETE cascade ON UPDATE no action;
        EXCEPTION
          WHEN duplicate_object THEN null;
        END;
      END $$;
    `);
    
    console.log("Migration 0006 applied successfully via simple script.");
    process.exit(0);
  } catch (err) {
    console.error("Migration failed:", err);
    process.exit(1);
  }
}

run();
