ALTER TABLE "orders" ADD COLUMN "shipping_cost" numeric(15, 2) DEFAULT '0';--> statement-breakpoint
ALTER TABLE "orders" ADD COLUMN "delivery_method" varchar(20) DEFAULT 'pickup';--> statement-breakpoint
ALTER TABLE "orders" ADD COLUMN "courier_name" varchar(100);--> statement-breakpoint
ALTER TABLE "orders" ADD COLUMN "tracking_number" varchar(100);--> statement-breakpoint
ALTER TABLE "transactions" ADD COLUMN "shipping_cost" numeric(15, 2) DEFAULT '0';--> statement-breakpoint
ALTER TABLE "transactions" ADD COLUMN "delivery_method" varchar(20) DEFAULT 'pickup';--> statement-breakpoint
ALTER TABLE "transactions" ADD COLUMN "courier_name" varchar(100);--> statement-breakpoint
ALTER TABLE "transactions" ADD COLUMN "tracking_number" varchar(100);