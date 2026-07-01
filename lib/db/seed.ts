import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
import * as schema from "./schema";
import bcrypt from "bcryptjs";
import * as dotenv from "dotenv";

dotenv.config({ path: ".env.local" });

const sql = neon(process.env.DATABASE_URL!);
const db = drizzle(sql, { schema });

async function seed() {
  console.log("🌱 Seeding database...");

  const name =
    process.env.SUPERADMIN_NAME || "Super Administrator";
  const email =
    process.env.SUPERADMIN_EMAIL || "superadmin@schoolmgmt.ng";
  const password = process.env.SUPERADMIN_PASSWORD || "SuperAdmin@2025";

  const existing = await db.query.superadmins.findFirst({
    where: (t, { eq }) => eq(t.email, email),
  });

  if (existing) {
    console.log(`✅ Superadmin already exists: ${email}`);
    return;
  }

  const passwordHash = await bcrypt.hash(password, 12);

  await db.insert(schema.superadmins).values({
    name,
    email,
    passwordHash,
  });

  console.log(`✅ Superadmin created:`);
  console.log(`   Email: ${email}`);
  console.log(`   Password: ${password}`);
  console.log("🎉 Seeding complete!");
}

seed().catch((err) => {
  console.error("❌ Seed failed:", err);
  process.exit(1);
});
