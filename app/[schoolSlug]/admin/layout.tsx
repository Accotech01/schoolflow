import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { Sidebar } from "@/components/nav/sidebar";
import { db } from "@/lib/db";
import { schools } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import {
  LayoutDashboard,
  Users,
  BookOpen,
  GraduationCap,
  Layers,
  Link2,
  Calendar,
  TrendingUp,
  FileText,
  Settings,
} from "lucide-react";

interface Props {
  children: React.ReactNode;
  params: Promise<{ schoolSlug: string }>;
}

export default async function AdminLayout({ children, params }: Props) {
  const { schoolSlug } = await params;
  const session = await auth();

  if (!session || session.user.role !== "school_admin") {
    redirect("/login");
  }

  const school = await db.query.schools.findFirst({
    where: eq(schools.slug, schoolSlug),
  });

  if (!school || school.id !== session.user.schoolId) {
    redirect("/login");
  }

  const base = `/${schoolSlug}/admin`;
  const navItems = [
    { label: "Dashboard", href: `${base}/dashboard`, icon: "LayoutDashboard" },
    { label: "Students", href: `${base}/students`, icon: "GraduationCap" },
    { label: "Teachers", href: `${base}/teachers`, icon: "Users" },
    { label: "Classes", href: `${base}/classes`, icon: "Layers" },
    { label: "Subjects", href: `${base}/subjects`, icon: "BookOpen" },
    { label: "Assignments", href: `${base}/assignments`, icon: "Link2" },
    { label: "Sessions & Terms", href: `${base}/sessions`, icon: "Calendar" },
    { label: "Promotions", href: `${base}/promotions`, icon: "TrendingUp" },
    { label: "Reports", href: `${base}/reports`, icon: "FileText" },
    { label: "Settings", href: `${base}/settings`, icon: "Settings" },
  ];

  return (
    <div className="flex min-h-screen">
      <Sidebar
        items={navItems}
        schoolName={school.name}
        userName={session.user.name || "Admin"}
        userRole="school_admin"
      />
      <main className="flex-1 ml-64 min-h-screen bg-gray-50">
        {children}
      </main>
    </div>
  );
}
