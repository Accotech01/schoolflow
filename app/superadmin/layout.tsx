import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { Sidebar } from "@/components/nav/sidebar";
import {
  LayoutDashboard,
  School,
  Settings,
  Users,
  MessageSquare,
} from "lucide-react";

const navItems = [
  { label: "Dashboard", href: "/superadmin/dashboard", icon: "LayoutDashboard" },
  { label: "Schools", href: "/superadmin/schools", icon: "School" },
  { label: "Administrators", href: "/superadmin/admins", icon: "Users" },
  { label: "Messages", href: "/superadmin/messages", icon: "MessageSquare" },
  { label: "Settings", href: "/superadmin/settings", icon: "Settings" },
];

export default async function SuperadminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();
  if (!session || session.user.role !== "superadmin") {
    redirect("/login");
  }

  return (
    <div className="flex min-h-screen">
      <Sidebar
        items={navItems}
        schoolName="EduManage NG"
        userName={session.user.name || "Superadmin"}
        userRole="superadmin"
      />
      <main className="flex-1 ml-64 min-h-screen bg-gray-50">
        {children}
      </main>
    </div>
  );
}
