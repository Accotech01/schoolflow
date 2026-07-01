"use server";

import { db } from "@/lib/db";
import { schools } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { auth } from "@/auth";

// ─── Schools ──────────────────────────────────────────────────────────────────
export async function deleteSchool(schoolId: string) {
  try {
    const session = await auth();
    
    // Verify user is superadmin
    if (session?.user?.role !== "superadmin") {
      return { success: false, error: "Unauthorized: Only superadmins can delete schools" };
    }

    // Check if school exists
    const school = await db.query.schools.findFirst({
      where: eq(schools.id, schoolId),
    });
    
    if (!school) {
      return { success: false, error: "School not found" };
    }

    // Delete the school (cascading deletes will handle related records)
    await db.delete(schools).where(eq(schools.id, schoolId));

    revalidatePath("/superadmin/schools");
    return { success: true, message: `School "${school.name}" has been deleted successfully` };
  } catch (error) {
    console.error("Error deleting school:", error);
    return { success: false, error: "Failed to delete school. There may be active data preventing deletion." };
  }
}
