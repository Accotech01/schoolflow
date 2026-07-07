DROP TABLE "attendance_rating_bands" CASCADE;--> statement-breakpoint
ALTER TABLE "classes" ADD COLUMN "attendance_max_score" numeric(5, 2) DEFAULT '10' NOT NULL;