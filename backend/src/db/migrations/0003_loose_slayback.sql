CREATE TABLE "couriers" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"code" varchar(50) NOT NULL,
	"name" varchar(100) NOT NULL,
	"description" text,
	"default_cost" numeric(15, 2) DEFAULT '0',
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "couriers_code_unique" UNIQUE("code")
);
--> statement-breakpoint
ALTER TABLE "orders" ADD COLUMN "discount_amount" numeric(15, 2) DEFAULT '0' NOT NULL;--> statement-breakpoint
ALTER TABLE "orders" ADD COLUMN "final_amount" numeric(15, 2) DEFAULT '0' NOT NULL;--> statement-breakpoint
ALTER TABLE "purchases" ADD COLUMN "payment_status" varchar(20) DEFAULT 'UNPAID' NOT NULL;--> statement-breakpoint
ALTER TABLE "purchases" ADD COLUMN "amount_paid" numeric(15, 2) DEFAULT '0' NOT NULL;--> statement-breakpoint
ALTER TABLE "purchases" ADD COLUMN "due_date" timestamp;--> statement-breakpoint
ALTER TABLE "transactions" ADD COLUMN "payment_status" varchar(20) DEFAULT 'PAID' NOT NULL;--> statement-breakpoint
ALTER TABLE "transactions" ADD COLUMN "due_date" timestamp;