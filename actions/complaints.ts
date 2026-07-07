"use server";

import { db } from "@/lib/db";
import { complaints, parentStudents } from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { auth } from "@/auth";
import { z } from "zod";

const complaintSchema = z.object({
  subject: z.string().min(1),
  message: z.string().min(1),
  studentId: z.string().uuid().optional(),
});

export async function submitComplaint(data: z.infer<typeof complaintSchema>) {
  const session = await auth();
  if (session?.user?.role !== "parent" || !session.user.schoolId) {
    return { success: false, error: "Unauthorized: Only parents can submit complaints" };
  }

  const parsed = complaintSchema.safeParse(data);
  if (!parsed.success) return { success: false, error: "Invalid data" };

  if (parsed.data.studentId) {
    const link = await db.query.parentStudents.findFirst({
      where: and(
        eq(parentStudents.parentId, session.user.id),
        eq(parentStudents.studentId, parsed.data.studentId)
      ),
    });
    if (!link) return { success: false, error: "That child is not linked to your account" };
  }

  await db.insert(complaints).values({
    schoolId: session.user.schoolId,
    parentId: session.user.id,
    studentId: parsed.data.studentId || null,
    subject: parsed.data.subject,
    message: parsed.data.message,
  });

  revalidatePath(`/[schoolSlug]/parent/complaints`);
  revalidatePath(`/[schoolSlug]/admin/complaints`);
  return { success: true };
}

export async function getMyComplaints() {
  const session = await auth();
  if (session?.user?.role !== "parent") return [];

  return db.query.complaints.findMany({
    where: eq(complaints.parentId, session.user.id),
    orderBy: (c, { desc }) => [desc(c.createdAt)],
    with: { student: true },
  });
}

export async function getSchoolComplaints() {
  const session = await auth();
  if (session?.user?.role !== "school_admin" || !session.user.schoolId) return [];

  return db.query.complaints.findMany({
    where: eq(complaints.schoolId, session.user.schoolId),
    orderBy: (c, { desc }) => [desc(c.createdAt)],
    with: { parent: true, student: true },
  });
}

export async function respondToComplaint(complaintId: string, response: string) {
  const session = await auth();
  if (session?.user?.role !== "school_admin" || !session.user.schoolId) {
    return { success: false, error: "Unauthorized" };
  }

  const complaint = await db.query.complaints.findFirst({ where: eq(complaints.id, complaintId) });
  if (!complaint || complaint.schoolId !== session.user.schoolId) {
    return { success: false, error: "Complaint not found" };
  }

  await db
    .update(complaints)
    .set({ response, status: "resolved", respondedAt: new Date(), updatedAt: new Date() })
    .where(eq(complaints.id, complaintId));

  revalidatePath(`/[schoolSlug]/admin/complaints`);
  revalidatePath(`/[schoolSlug]/parent/complaints`);
  return { success: true };
}
