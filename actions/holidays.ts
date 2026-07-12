"use server";

import { db } from "@/lib/db";
import { schoolHolidays } from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { auth } from "@/auth";
import { z } from "zod";

const holidaySchema = z
  .object({
    name: z.string().min(1),
    startDate: z.string().min(1),
    endDate: z.string().min(1),
  })
  .refine((d) => new Date(d.endDate) >= new Date(d.startDate), {
    message: "End date must be on or after the start date",
    path: ["endDate"],
  });

export async function createHoliday(data: z.infer<typeof holidaySchema>) {
  const session = await auth();
  if (session?.user?.role !== "school_admin" || !session.user.schoolId) {
    return { success: false, error: "Unauthorized: Only school administrators can set holidays" };
  }

  const parsed = holidaySchema.safeParse(data);
  if (!parsed.success) return { success: false, error: parsed.error.errors[0]?.message || "Invalid data" };

  await db.insert(schoolHolidays).values({
    schoolId: session.user.schoolId,
    name: parsed.data.name,
    startDate: new Date(parsed.data.startDate),
    endDate: new Date(parsed.data.endDate),
  });

  revalidatePath(`/[schoolSlug]/admin/holidays`);
  return { success: true };
}

export async function deleteHoliday(holidayId: string) {
  const session = await auth();
  if (session?.user?.role !== "school_admin" || !session.user.schoolId) {
    return { success: false, error: "Unauthorized" };
  }

  const holiday = await db.query.schoolHolidays.findFirst({ where: eq(schoolHolidays.id, holidayId) });
  if (!holiday || holiday.schoolId !== session.user.schoolId) {
    return { success: false, error: "Holiday not found" };
  }

  await db.delete(schoolHolidays).where(eq(schoolHolidays.id, holidayId));
  revalidatePath(`/[schoolSlug]/admin/holidays`);
  return { success: true };
}

export async function getSchoolHolidays() {
  const session = await auth();
  if (session?.user?.role !== "school_admin" || !session.user.schoolId) return [];

  return db.query.schoolHolidays.findMany({
    where: eq(schoolHolidays.schoolId, session.user.schoolId),
    orderBy: (h, { desc }) => [desc(h.startDate)],
  });
}

// Every holiday for a school — used internally by attendance logic (not
// gated to admins, since teachers/students need it too to know which days
// don't count).
export async function getHolidaysForSchool(schoolId: string) {
  return db.query.schoolHolidays.findMany({
    where: eq(schoolHolidays.schoolId, schoolId),
  });
}
