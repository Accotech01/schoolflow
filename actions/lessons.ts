"use server";

import { db } from "@/lib/db";
import { lessonNotes, learningResources } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { z } from "zod";

const lessonNoteSchema = z.object({
  teacherId: z.string().uuid(),
  classId: z.string().uuid(),
  subjectId: z.string().uuid(),
  termId: z.string().uuid(),
  schoolId: z.string().uuid(),
  title: z.string().min(1),
  content: z.string().min(1),
  week: z.number().int().min(1).max(15).optional(),
});

export async function createLessonNote(data: z.infer<typeof lessonNoteSchema>) {
  const parsed = lessonNoteSchema.safeParse(data);
  if (!parsed.success) return { success: false, error: "Invalid data" };

  const [note] = await db.insert(lessonNotes).values(parsed.data).returning();
  revalidatePath("/[schoolSlug]/teacher/lessons");
  return { success: true, note };
}

export async function updateLessonNote(noteId: string, data: Partial<z.infer<typeof lessonNoteSchema>>) {
  await db.update(lessonNotes).set({ ...data, updatedAt: new Date() }).where(eq(lessonNotes.id, noteId));
  revalidatePath("/[schoolSlug]/teacher/lessons");
  return { success: true };
}

export async function deleteLessonNote(noteId: string) {
  try {
    await db.delete(lessonNotes).where(eq(lessonNotes.id, noteId));
    revalidatePath("/[schoolSlug]/teacher/lessons");
    return { success: true } as const;
  } catch (error) {
    return { success: false as const, error: "Failed to delete lesson note" };
  }
}

const resourceSchema = z.object({
  teacherId: z.string().uuid(),
  classId: z.string().uuid(),
  subjectId: z.string().uuid(),
  termId: z.string().uuid(),
  schoolId: z.string().uuid(),
  title: z.string().min(1),
  url: z.string().url(),
  description: z.string().optional(),
  resourceType: z.enum(["link", "video", "document", "pdf", "article", "exercise", "other"]).default("link"),
});

export async function createResource(data: z.infer<typeof resourceSchema>) {
  const parsed = resourceSchema.safeParse(data);
  if (!parsed.success) return { success: false, error: "Invalid data" };

  const [resource] = await db.insert(learningResources).values(parsed.data).returning();
  revalidatePath("/[schoolSlug]/teacher/lessons");
  return { success: true, resource };
}

export async function updateResource(resourceId: string, data: Partial<z.infer<typeof resourceSchema>>) {
  await db.update(learningResources).set({ ...data, updatedAt: new Date() }).where(eq(learningResources.id, resourceId));
  revalidatePath("/[schoolSlug]/teacher/lessons");
  return { success: true };
}

export async function deleteResource(resourceId: string) {
  try {
    await db.delete(learningResources).where(eq(learningResources.id, resourceId));
    revalidatePath("/[schoolSlug]/teacher/lessons");
    return { success: true } as const;
  } catch (error) {
    return { success: false as const, error: "Failed to delete resource" };
  }
}
