"use server";

import { db } from "@/lib/db";
import {
  announcements,
  announcementReads,
  studentEnrollments,
  teacherAssignments,
} from "@/lib/db/schema";
import { eq, and, or, isNull } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { auth } from "@/auth";
import { z } from "zod";

const announcementSchema = z.object({
  title: z.string().min(1),
  message: z.string().min(1),
  audience: z.enum(["students", "teachers", "both"]),
});

// School-wide announcement, sent by a school admin.
export async function createAnnouncement(data: z.infer<typeof announcementSchema>) {
  const session = await auth();
  if (session?.user?.role !== "school_admin" || !session.user.schoolId) {
    return { success: false, error: "Unauthorized: Only school administrators can send announcements" };
  }

  const parsed = announcementSchema.safeParse(data);
  if (!parsed.success) return { success: false, error: "Invalid data" };

  await db.insert(announcements).values({
    ...parsed.data,
    schoolId: session.user.schoolId,
    classId: null,
    createdByRole: "school_admin",
    createdBy: session.user.id,
  });

  revalidatePath(`/[schoolSlug]/admin/announcements`);
  revalidatePath(`/[schoolSlug]/student/announcements`);
  revalidatePath(`/[schoolSlug]/teacher/announcements`);
  return { success: true };
}

const classAnnouncementSchema = z.object({
  classId: z.string().uuid(),
  title: z.string().min(1),
  message: z.string().min(1),
});

// Class-scoped announcement, sent by a teacher to the students of one of
// their assigned classes.
export async function createClassAnnouncement(data: z.infer<typeof classAnnouncementSchema>) {
  const session = await auth();
  if (session?.user?.role !== "teacher" || !session.user.schoolId) {
    return { success: false, error: "Unauthorized: Only teachers can send class announcements" };
  }

  const parsed = classAnnouncementSchema.safeParse(data);
  if (!parsed.success) return { success: false, error: "Invalid data" };

  const assignment = await db.query.teacherAssignments.findFirst({
    where: and(
      eq(teacherAssignments.teacherId, session.user.id),
      eq(teacherAssignments.classId, parsed.data.classId)
    ),
  });
  if (!assignment) {
    return { success: false, error: "You are not assigned to this class" };
  }

  await db.insert(announcements).values({
    schoolId: session.user.schoolId,
    classId: parsed.data.classId,
    title: parsed.data.title,
    message: parsed.data.message,
    audience: "students",
    createdByRole: "teacher",
    createdBy: session.user.id,
  });

  revalidatePath(`/[schoolSlug]/teacher/announcements`);
  revalidatePath(`/[schoolSlug]/student/announcements`);
  return { success: true };
}

export async function deleteAnnouncement(announcementId: string) {
  const session = await auth();
  if (!session?.user?.schoolId) return { success: false, error: "Unauthorized" };

  const record = await db.query.announcements.findFirst({
    where: eq(announcements.id, announcementId),
  });
  if (!record || record.schoolId !== session.user.schoolId) {
    return { success: false, error: "Announcement not found" };
  }

  const isOwner = record.createdBy === session.user.id;
  const isAdmin = session.user.role === "school_admin";
  if (!isOwner && !isAdmin) {
    return { success: false, error: "Unauthorized" };
  }

  await db.delete(announcements).where(eq(announcements.id, announcementId));

  revalidatePath(`/[schoolSlug]/admin/announcements`);
  revalidatePath(`/[schoolSlug]/student/announcements`);
  revalidatePath(`/[schoolSlug]/teacher/announcements`);
  return { success: true };
}

// Announcements relevant to the signed-in viewer, unfiltered by read status.
async function getRelevantAnnouncements(limit?: number) {
  const session = await auth();
  if (!session?.user?.schoolId) {
    return { userId: null as string | null, rows: [] as (typeof announcements.$inferSelect)[] };
  }

  const { role, schoolId, id: userId } = session.user;
  let rows: (typeof announcements.$inferSelect)[] = [];

  if (role === "student") {
    const enrollment = await db.query.studentEnrollments.findFirst({
      where: and(eq(studentEnrollments.studentId, userId), eq(studentEnrollments.isActive, true)),
    });
    const classCondition = enrollment
      ? or(isNull(announcements.classId), eq(announcements.classId, enrollment.classId))
      : isNull(announcements.classId);

    rows = await db.query.announcements.findMany({
      where: and(
        eq(announcements.schoolId, schoolId),
        or(eq(announcements.audience, "students"), eq(announcements.audience, "both")),
        classCondition
      ),
      orderBy: (a, { desc }) => [desc(a.createdAt)],
      limit,
    });
  } else if (role === "teacher") {
    rows = await db.query.announcements.findMany({
      where: and(
        eq(announcements.schoolId, schoolId),
        or(eq(announcements.audience, "teachers"), eq(announcements.audience, "both")),
        isNull(announcements.classId)
      ),
      orderBy: (a, { desc }) => [desc(a.createdAt)],
      limit,
    });
  } else if (role === "school_admin") {
    rows = await db.query.announcements.findMany({
      where: eq(announcements.schoolId, schoolId),
      orderBy: (a, { desc }) => [desc(a.createdAt)],
      limit,
    });
  }

  return { userId, rows };
}

async function getReadIds(userId: string) {
  const readRows = await db.query.announcementReads.findMany({
    where: eq(announcementReads.readerId, userId),
  });
  return new Set(readRows.map((r) => r.announcementId));
}

// Used by the notification bell: only unread items, most recent first.
export async function getMyAnnouncements() {
  const { userId, rows } = await getRelevantAnnouncements(30);
  if (!userId) return [];

  const readIds = await getReadIds(userId);
  return rows.filter((r) => !readIds.has(r.id)).slice(0, 10);
}

// Used by the dedicated Announcements pages: full history with read flags.
export async function getAnnouncementsForPage() {
  const { userId, rows } = await getRelevantAnnouncements();
  if (!userId) return [];

  const readIds = await getReadIds(userId);
  return rows.map((r) => ({ ...r, isRead: readIds.has(r.id) }));
}

export async function markAnnouncementRead(announcementId: string) {
  const session = await auth();
  if (!session?.user?.id) return { success: false };

  await db
    .insert(announcementReads)
    .values({ announcementId, readerId: session.user.id })
    .onConflictDoNothing({
      target: [announcementReads.announcementId, announcementReads.readerId],
    });

  return { success: true };
}

export async function markAllAnnouncementsRead() {
  const { userId, rows } = await getRelevantAnnouncements();
  if (!userId || rows.length === 0) return { success: true };

  await db
    .insert(announcementReads)
    .values(rows.map((r) => ({ announcementId: r.id, readerId: userId })))
    .onConflictDoNothing({
      target: [announcementReads.announcementId, announcementReads.readerId],
    });

  return { success: true };
}

// Classes the signed-in teacher currently teaches, for the class picker.
export async function getMyTeachingClasses() {
  const session = await auth();
  if (session?.user?.role !== "teacher") return [];

  const rows = await db.query.teacherAssignments.findMany({
    where: eq(teacherAssignments.teacherId, session.user.id),
    with: { class: true },
  });

  const seen = new Map<string, { id: string; name: string }>();
  for (const r of rows) {
    if (!seen.has(r.classId)) seen.set(r.classId, { id: r.class.id, name: r.class.name });
  }
  return Array.from(seen.values());
}
