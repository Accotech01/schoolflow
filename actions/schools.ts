"use server";

import { db } from "@/lib/db";
import { schools, schoolAdmins } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import bcrypt from "bcryptjs";
import { slugify } from "@/lib/utils";
import { z } from "zod";
import { revalidatePath } from "next/cache";

const createSchoolSchema = z.object({
  schoolName: z.string().min(2),
  slug: z.string().min(2),
  address: z.string().min(5),
  city: z.string().min(1),
  state: z.string().min(1),
  phone: z.string().min(7),
  email: z.string().email(),
  motto: z.string().optional(),
  adminName: z.string().min(2),
  adminEmail: z.string().email(),
  adminPassword: z.string().min(8),
  adminPhone: z.string().optional(),
});

export async function createSchoolWithAdmin(data: unknown) {
  const parsed = createSchoolSchema.safeParse(data);
  if (!parsed.success) {
    return { success: false, error: "Invalid data: " + parsed.error.message };
  }

  const {
    schoolName, slug, address, city, state, phone, email, motto,
    adminName, adminEmail, adminPassword, adminPhone,
  } = parsed.data;

  // Check slug uniqueness
  const existing = await db.query.schools.findFirst({
    where: eq(schools.slug, slug),
  });
  if (existing) {
    return { success: false, error: "A school with this slug already exists" };
  }

  // Check admin email uniqueness
  const existingAdmin = await db.query.schoolAdmins.findFirst({
    where: eq(schoolAdmins.email, adminEmail),
  });
  if (existingAdmin) {
    return { success: false, error: "An account with this admin email already exists" };
  }

  const [newSchool] = await db.insert(schools).values({
    name: schoolName,
    slug,
    address,
    city,
    state,
    phone,
    email,
    motto: motto || null,
    subscriptionStatus: "trial",
  }).returning();

  const passwordHash = await bcrypt.hash(adminPassword, 12);
  await db.insert(schoolAdmins).values({
    schoolId: newSchool.id,
    name: adminName,
    email: adminEmail,
    passwordHash,
    phone: adminPhone || null,
    status: "active",
  });

  revalidatePath("/superadmin/schools");
  revalidatePath("/superadmin/dashboard");

  return { success: true, school: newSchool };
}

export async function updateSchool(schoolId: string, data: Partial<typeof schools.$inferInsert>) {
  await db.update(schools).set({ ...data, updatedAt: new Date() }).where(eq(schools.id, schoolId));
  revalidatePath("/superadmin/schools");
  return { success: true };
}

export async function deleteSchool(schoolId: string) {
  await db.delete(schools).where(eq(schools.id, schoolId));
  revalidatePath("/superadmin/schools");
  revalidatePath("/superadmin/dashboard");
  return { success: true };
}
