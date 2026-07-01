import { neon } from "@neondatabase/serverless";

const databaseUrl = process.env.DATABASE_URL;

if (!databaseUrl) {
  console.error("DATABASE_URL not set");
  process.exit(1);
}

const sql = neon(databaseUrl);

// Simple CREATE TABLE statement
const createTableSQL = `
  CREATE TABLE IF NOT EXISTS "student_subject_assignments" (
    "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
    "student_id" uuid NOT NULL,
    "class_id" uuid NOT NULL,
    "subject_id" uuid NOT NULL,
    "session_id" uuid NOT NULL,
    "school_id" uuid NOT NULL,
    "is_active" boolean DEFAULT true NOT NULL,
    "created_at" timestamp DEFAULT now() NOT NULL
  )
`;

// Simple index creation statements
const createIndexesSQL = [
  `CREATE INDEX IF NOT EXISTS "ssa_student_idx" ON "student_subject_assignments" ("student_id")`,
  `CREATE INDEX IF NOT EXISTS "ssa_class_idx" ON "student_subject_assignments" ("class_id")`,
  `CREATE UNIQUE INDEX IF NOT EXISTS "ssa_unique_idx" ON "student_subject_assignments" ("student_id","subject_id","session_id")`
];

async function runMigration() {
  try {
    console.log("Creating student_subject_assignments table...");
    await sql(createTableSQL);
    console.log("✓ Table created");

    console.log("Creating indexes...");
    for (const indexSQL of createIndexesSQL) {
      await sql(indexSQL);
    }
    console.log("✓ Indexes created");

    console.log("✓ Migration completed successfully!");
    process.exit(0);
  } catch (error) {
    console.error("✗ Migration failed:", error.message);
    console.error("Details:", error);
    process.exit(1);
  }
}

runMigration();
