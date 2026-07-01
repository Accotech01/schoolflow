import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { Sidebar } from "@/components/nav/sidebar";
import { db } from "@/lib/db";
import { schools } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import {
  LayoutDashboard,
  BarChart3,
  BookOpen,
  Link2,
  User,
} from "lucide-react";

interface Props {
  children: React.ReactNode;
  params: Promise<{ schoolSlug: string }>;
}

export default async function StudentLayout({ children, params }: Props) {
  const { schoolSlug } = await params;
  const session = await auth();

  if (!session || session.user.role !== "student") {
    redirect("/login");
  }

  const school = await db.query.schools.findFirst({
    where: eq(schools.slug, schoolSlug),
  });

  if (!school || school.id !== session.user.schoolId) {
    redirect("/login");
  }

  const base = `/${schoolSlug}/student`;
  const navItems = [
    { label: "Dashboard", href: `${base}/dashboard`, icon: "LayoutDashboard" },
    { label: "My Results", href: `${base}/results`, icon: "BarChart3" },
    { label: "Lesson Notes", href: `${base}/resources`, icon: "BookOpen" },
    { label: "Resources", href: `${base}/resources?tab=links`, icon: "Link2" },
    { label: "Profile", href: `${base}/profile`, icon: "User" },
  ];

  return (
    <div className="flex min-h-screen">
      <Sidebar
        items={navItems}
        schoolName={school.name}
        userName={session.user.name || "Student"}
        userRole="student"
      />
      <main className="flex-1 ml-64 min-h-screen bg-gray-50">
        {children}
      </main>
    </div>
  );
}
