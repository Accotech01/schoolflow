-- Create student_subject_assignments table
CREATE TABLE IF NOT EXISTS "student_subject_assignments" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "student_id" uuid NOT NULL,
  "class_id" uuid NOT NULL,
  "subject_id" uuid NOT NULL,
  "session_id" uuid NOT NULL,
  "school_id" uuid NOT NULL,
  "is_active" boolean NOT NULL DEFAULT true,
  "created_at" timestamp NOT NULL DEFAULT now(),
  FOREIGN KEY ("student_id") REFERENCES "students"("id") ON DELETE cascade,
  FOREIGN KEY ("class_id") REFERENCES "classes"("id") ON DELETE cascade,
  FOREIGN KEY ("subject_id") REFERENCES "subjects"("id") ON DELETE cascade,
  FOREIGN KEY ("session_id") REFERENCES "academic_sessions"("id") ON DELETE cascade,
  FOREIGN KEY ("school_id") REFERENCES "schools"("id") ON DELETE cascade
);

-- Create indexes
CREATE INDEX "ssa_student_idx" ON "student_subject_assignments"("student_id");
CREATE INDEX "ssa_class_idx" ON "student_subject_assignments"("class_id");
CREATE UNIQUE INDEX "ssa_unique_idx" ON "student_subject_assignments"("student_id", "subject_id", "session_id");
