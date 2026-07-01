-- Create student_subject_assignments table if not exists
CREATE TABLE IF NOT EXISTS "student_subject_assignments" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"student_id" uuid NOT NULL,
	"class_id" uuid NOT NULL,
	"subject_id" uuid NOT NULL,
	"session_id" uuid NOT NULL,
	"school_id" uuid NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);

-- Add foreign key constraints if they don't exist
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'student_subject_assignments_student_id_students_id_fk') THEN
    ALTER TABLE "student_subject_assignments" ADD CONSTRAINT "student_subject_assignments_student_id_students_id_fk" 
    FOREIGN KEY ("student_id") REFERENCES "public"."students"("id") ON DELETE cascade ON UPDATE no action;
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'student_subject_assignments_class_id_classes_id_fk') THEN
    ALTER TABLE "student_subject_assignments" ADD CONSTRAINT "student_subject_assignments_class_id_classes_id_fk" 
    FOREIGN KEY ("class_id") REFERENCES "public"."classes"("id") ON DELETE cascade ON UPDATE no action;
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'student_subject_assignments_subject_id_subjects_id_fk') THEN
    ALTER TABLE "student_subject_assignments" ADD CONSTRAINT "student_subject_assignments_subject_id_subjects_id_fk" 
    FOREIGN KEY ("subject_id") REFERENCES "public"."subjects"("id") ON DELETE cascade ON UPDATE no action;
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'student_subject_assignments_session_id_academic_sessions_id_fk') THEN
    ALTER TABLE "student_subject_assignments" ADD CONSTRAINT "student_subject_assignments_session_id_academic_sessions_id_fk" 
    FOREIGN KEY ("session_id") REFERENCES "public"."academic_sessions"("id") ON DELETE cascade ON UPDATE no action;
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'student_subject_assignments_school_id_schools_id_fk') THEN
    ALTER TABLE "student_subject_assignments" ADD CONSTRAINT "student_subject_assignments_school_id_schools_id_fk" 
    FOREIGN KEY ("school_id") REFERENCES "public"."schools"("id") ON DELETE cascade ON UPDATE no action;
  END IF;
END $$;

-- Create indexes
CREATE INDEX IF NOT EXISTS "ssa_student_idx" ON "student_subject_assignments" USING btree ("student_id");
CREATE INDEX IF NOT EXISTS "ssa_class_idx" ON "student_subject_assignments" USING btree ("class_id");
CREATE UNIQUE INDEX IF NOT EXISTS "ssa_unique_idx" ON "student_subject_assignments" USING btree ("student_id","subject_id","session_id");
