"use server";

import { db } from "@/lib/db";
import { platformMessages, platformMessageReads, schoolAdmins } from "@/lib/db/schema";
import { eq, and, or, isNull } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { auth } from "@/auth";
import { z } from "zod";

const messageSchema = z.object({
  title: z.string().min(1),
  message: z.string().min(1),
});

// Direct message to one specific school admin.
export async function sendMessageToAdmin(schoolAdminId: string, data: z.infer<typeof messageSchema>) {
  const session = await auth();
  if (session?.user?.role !== "superadmin") {
    return { success: false, error: "Unauthorized: Only superadmins can send messages" };
  }

  const parsed = messageSchema.safeParse(data);
  if (!parsed.success) return { success: false, error: "Invalid data" };

  const admin = await db.query.schoolAdmins.findFirst({ where: eq(schoolAdmins.id, schoolAdminId) });
  if (!admin) return { success: false, error: "School admin not found" };

  await db.insert(platformMessages).values({
    ...parsed.data,
    toSchoolAdminId: schoolAdminId,
  });

  revalidatePath("/superadmin/messages");
  revalidatePath(`/[schoolSlug]/admin/messages`);
  return { success: true };
}

// Broadcast announcement to every school admin on the platform.
export async function createPlatformAnnouncement(data: z.infer<typeof messageSchema>) {
  const session = await auth();
  if (session?.user?.role !== "superadmin") {
    return { success: false, error: "Unauthorized: Only superadmins can post announcements" };
  }

  const parsed = messageSchema.safeParse(data);
  if (!parsed.success) return { success: false, error: "Invalid data" };

  await db.insert(platformMessages).values({
    ...parsed.data,
    toSchoolAdminId: null,
  });

  revalidatePath("/superadmin/messages");
  revalidatePath(`/[schoolSlug]/admin/messages`);
  return { success: true };
}

// Superadmin's own outbox: every message/announcement they've sent.
export async function getSentPlatformMessages() {
  const session = await auth();
  if (session?.user?.role !== "superadmin") return [];

  return db.query.platformMessages.findMany({
    orderBy: (m, { desc }) => [desc(m.createdAt)],
    with: { toSchoolAdmin: { with: { school: true } } },
  });
}

export async function deletePlatformMessage(messageId: string) {
  const session = await auth();
  if (session?.user?.role !== "superadmin") {
    return { success: false, error: "Unauthorized" };
  }

  await db.delete(platformMessages).where(eq(platformMessages.id, messageId));
  revalidatePath("/superadmin/messages");
  return { success: true };
}

// Messages/announcements relevant to the signed-in school admin, unfiltered
// by read status.
async function getRelevantMessages(schoolAdminId: string, limit?: number) {
  return db.query.platformMessages.findMany({
    where: or(eq(platformMessages.toSchoolAdminId, schoolAdminId), isNull(platformMessages.toSchoolAdminId)),
    orderBy: (m, { desc }) => [desc(m.createdAt)],
    limit,
  });
}

async function getReadIds(readerId: string) {
  const readRows = await db.query.platformMessageReads.findMany({
    where: eq(platformMessageReads.readerId, readerId),
  });
  return new Set(readRows.map((r) => r.messageId));
}

// Used by the notification bell: only unread items, most recent first.
export async function getMyPlatformMessages() {
  const session = await auth();
  if (session?.user?.role !== "school_admin") return [];

  const rows = await getRelevantMessages(session.user.id, 30);
  const readIds = await getReadIds(session.user.id);
  return rows.filter((r) => !readIds.has(r.id)).slice(0, 10);
}

// Used by the dedicated Messages page: full history with read flags.
export async function getPlatformMessagesForPage() {
  const session = await auth();
  if (session?.user?.role !== "school_admin") return [];

  const rows = await getRelevantMessages(session.user.id);
  const readIds = await getReadIds(session.user.id);
  return rows.map((r) => ({ ...r, isRead: readIds.has(r.id) }));
}

export async function markPlatformMessageRead(messageId: string) {
  const session = await auth();
  if (!session?.user?.id) return { success: false };

  await db
    .insert(platformMessageReads)
    .values({ messageId, readerId: session.user.id })
    .onConflictDoNothing({
      target: [platformMessageReads.messageId, platformMessageReads.readerId],
    });

  return { success: true };
}

export async function markAllPlatformMessagesRead() {
  const session = await auth();
  if (session?.user?.role !== "school_admin") return { success: true };

  const rows = await getRelevantMessages(session.user.id);
  if (rows.length === 0) return { success: true };

  await db
    .insert(platformMessageReads)
    .values(rows.map((r) => ({ messageId: r.id, readerId: session.user.id })))
    .onConflictDoNothing({
      target: [platformMessageReads.messageId, platformMessageReads.readerId],
    });

  return { success: true };
}
