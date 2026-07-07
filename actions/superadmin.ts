"use server";

import { db } from "@/lib/db";
import { schools, schoolAdmins } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { auth } from "@/auth";

// ─── School Admin Access ───────────────────────────────────────────────────────
export async function updateSchoolAdminAccess(
  adminId: string,
  data: {
    status: "active" | "inactive";
    lastPaymentDate: string | null;
    nextPaymentDueDate: string | null;
  }
) {
  try {
    const session = await auth();

    // Verify user is superadmin
    if (session?.user?.role !== "superadmin") {
      return { success: false, error: "Unauthorized: Only superadmins can manage admin access" };
    }

    const admin = await db.query.schoolAdmins.findFirst({
      where: eq(schoolAdmins.id, adminId),
    });

    if (!admin) {
      return { success: false, error: "School admin not found" };
    }

    await db
      .update(schoolAdmins)
      .set({
        status: data.status,
        lastPaymentDate: data.lastPaymentDate ? new Date(data.lastPaymentDate) : null,
        nextPaymentDueDate: data.nextPaymentDueDate ? new Date(data.nextPaymentDueDate) : null,
        updatedAt: new Date(),
      })
      .where(eq(schoolAdmins.id, adminId));

    revalidatePath("/superadmin/admins");
    revalidatePath(`/superadmin/schools/${admin.schoolId}`);
    return { success: true, message: `Access updated for ${admin.name}` };
  } catch (error) {
    console.error("Error updating school admin access:", error);
    return { success: false, error: "Failed to update admin access" };
  }
}

// ─── Schools ──────────────────────────────────────────────────────────────────
export async function updateSchoolBillingRate(schoolId: string, amountPerStudent: number) {
  const session = await auth();
  if (session?.user?.role !== "superadmin") {
    return { success: false, error: "Unauthorized: Only superadmins can set billing rates" };
  }

  if (!(amountPerStudent >= 0)) {
    return { success: false, error: "Amount per student must be zero or more" };
  }

  await db
    .update(schools)
    .set({ amountPerStudent: String(amountPerStudent), updatedAt: new Date() })
    .where(eq(schools.id, schoolId));

  revalidatePath("/superadmin/schools");
  revalidatePath(`/superadmin/schools/${schoolId}`);
  return { success: true };
}

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
