CREATE TABLE "announcement_reads" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"announcement_id" uuid NOT NULL,
	"reader_id" uuid NOT NULL,
	"read_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "announcements" DROP CONSTRAINT "announcements_created_by_school_admins_id_fk";
--> statement-breakpoint
ALTER TABLE "announcements" ADD COLUMN "class_id" uuid;--> statement-breakpoint
ALTER TABLE "announcements" ADD COLUMN "created_by_role" text DEFAULT 'school_admin' NOT NULL;--> statement-breakpoint
ALTER TABLE "announcement_reads" ADD CONSTRAINT "announcement_reads_announcement_id_announcements_id_fk" FOREIGN KEY ("announcement_id") REFERENCES "public"."announcements"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "announcement_reads_unique_idx" ON "announcement_reads" USING btree ("announcement_id","reader_id");--> statement-breakpoint
CREATE INDEX "announcement_reads_reader_idx" ON "announcement_reads" USING btree ("reader_id");--> statement-breakpoint
ALTER TABLE "announcements" ADD CONSTRAINT "announcements_class_id_classes_id_fk" FOREIGN KEY ("class_id") REFERENCES "public"."classes"("id") ON DELETE cascade ON UPDATE no action;