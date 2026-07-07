import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { Sidebar } from "@/components/nav/sidebar";
import { db } from "@/lib/db";
import { schools } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { LayoutDashboard, MessageSquare } from "lucide-react";

interface Props {
  children: React.ReactNode;
  params: Promise<{ schoolSlug: string }>;
}

export default async function ParentLayout({ children, params }: Props) {
  const { schoolSlug } = await params;
  const session = await auth();

  if (!session || session.user.role !== "parent") {
    redirect("/login");
  }

  const school = await db.query.schools.findFirst({
    where: eq(schools.slug, schoolSlug),
  });

  if (!school || school.id !== session.user.schoolId) {
    redirect("/login");
  }

  const base = `/${schoolSlug}/parent`;
  const navItems = [
    { label: "Dashboard", href: `${base}/dashboard`, icon: "LayoutDashboard" },
    { label: "Complaints & Suggestions", href: `${base}/complaints`, icon: "MessageSquare" },
  ];

  return (
    <div className="flex min-h-screen">
      <Sidebar
        items={navItems}
        schoolName={school.name}
        schoolLogoUrl={school.logoUrl}
        userName={session.user.name || "Parent"}
        userRole="parent"
      />
      <main className="flex-1 ml-64 min-h-screen bg-gray-50">
        {children}
      </main>
    </div>
  );
}
