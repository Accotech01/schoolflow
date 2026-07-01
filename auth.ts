import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { authConfig } from "./auth.config";
import { db } from "@/lib/db";
import {
  superadmins,
  schoolAdmins,
  teachers,
  students,
} from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import bcrypt from "bcryptjs";
import { z } from "zod";

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
  role: z.enum(["superadmin", "school_admin", "teacher", "student"]),
  schoolSlug: z.string().optional(),
});

export const { handlers, auth, signIn, signOut } = NextAuth({
  ...authConfig,
  providers: [
    Credentials({
      id: "credentials",
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
        role: { label: "Role", type: "text" },
        schoolSlug: { label: "School Slug", type: "text" },
      },
      async authorize(credentials) {
        const parsed = loginSchema.safeParse(credentials);
        if (!parsed.success) return null;

        const { email, password, role, schoolSlug } = parsed.data;

        try {
          if (role === "superadmin") {
            const admin = await db.query.superadmins.findFirst({
              where: eq(superadmins.email, email),
            });
            if (!admin) return null;
            const match = await bcrypt.compare(password, admin.passwordHash);
            if (!match) return null;
            return {
              id: admin.id,
              email: admin.email,
              name: admin.name,
              role: "superadmin",
              schoolId: undefined,
              schoolSlug: undefined,
            };
          }

          if (role === "school_admin") {
            const admin = await db.query.schoolAdmins.findFirst({
              where: eq(schoolAdmins.email, email),
              with: { school: true },
            });
            if (!admin || admin.status !== "active") return null;
            if (schoolSlug && admin.school.slug !== schoolSlug) return null;
            const match = await bcrypt.compare(password, admin.passwordHash);
            if (!match) return null;
            return {
              id: admin.id,
              email: admin.email,
              name: admin.name,
              role: "school_admin",
              schoolId: admin.schoolId,
              schoolSlug: admin.school.slug,
            };
          }

          if (role === "teacher") {
            const teacher = await db.query.teachers.findFirst({
              where: eq(teachers.email, email),
              with: { school: true },
            });
            if (!teacher || teacher.status !== "active") return null;
            if (schoolSlug && teacher.school.slug !== schoolSlug) return null;
            const match = await bcrypt.compare(password, teacher.passwordHash);
            if (!match) return null;
            return {
              id: teacher.id,
              email: teacher.email,
              name: teacher.name,
              role: "teacher",
              schoolId: teacher.schoolId,
              schoolSlug: teacher.school.slug,
            };
          }

          if (role === "student") {
            const student = await db.query.students.findFirst({
              where: eq(students.email, email),
              with: { school: true },
            });
            if (!student || student.status !== "active") return null;
            if (schoolSlug && student.school.slug !== schoolSlug) return null;
            const match = await bcrypt.compare(password, student.passwordHash);
            if (!match) return null;
            return {
              id: student.id,
              email: student.email,
              name: student.name,
              role: "student",
              schoolId: student.schoolId,
              schoolSlug: student.school.slug,
            };
          }

          return null;
        } catch (error) {
          console.error("Auth error:", error);
          return null;
        }
      },
    }),
  ],
});
