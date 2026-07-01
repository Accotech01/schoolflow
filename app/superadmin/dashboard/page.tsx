import { auth } from "@/auth";
import { db } from "@/lib/db";
import { schools, schoolAdmins, teachers, students } from "@/lib/db/schema";
import { count } from "drizzle-orm";
import { Topbar } from "@/components/nav/topbar";
import { StatCard } from "@/components/dashboard/stat-card";
import { School, Users, GraduationCap, BookOpen } from "lucide-react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { formatDate } from "@/lib/utils";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export default async function SuperadminDashboard() {
  const [schoolCount] = await db.select({ count: count() }).from(schools);
  const [adminCount] = await db.select({ count: count() }).from(schoolAdmins);
  const [teacherCount] = await db.select({ count: count() }).from(teachers);
  const [studentCount] = await db.select({ count: count() }).from(students);

  const recentSchools = await db.query.schools.findMany({
    orderBy: (s, { desc }) => [desc(s.createdAt)],
    limit: 10,
    with: { admins: true, students: true, teachers: true },
  });

  return (
    <div>
      <Topbar
        title="Superadmin Dashboard"
        subtitle="Platform-wide overview"
      />
      <div className="p-6 space-y-6">
        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard
            title="Total Schools"
            value={schoolCount.count}
            icon={School}
            color="blue"
            description="Registered institutions"
          />
          <StatCard
            title="School Admins"
            value={adminCount.count}
            icon={Users}
            color="green"
            description="Active administrators"
          />
          <StatCard
            title="Total Teachers"
            value={teacherCount.count}
            icon={BookOpen}
            color="purple"
            description="Across all schools"
          />
          <StatCard
            title="Total Students"
            value={studentCount.count}
            icon={GraduationCap}
            color="orange"
            description="Enrolled students"
          />
        </div>

        {/* Recent Schools */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-lg">Registered Schools</CardTitle>
            <Link href="/superadmin/schools">
              <Button size="sm" variant="outline">View All</Button>
            </Link>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>School Name</TableHead>
                  <TableHead>Location</TableHead>
                  <TableHead>Admins</TableHead>
                  <TableHead>Teachers</TableHead>
                  <TableHead>Students</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Created</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {recentSchools.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center text-muted-foreground py-8">
                      No schools registered yet.{" "}
                      <Link href="/superadmin/schools" className="text-blue-600 underline">
                        Create the first one
                      </Link>
                    </TableCell>
                  </TableRow>
                ) : (
                  recentSchools.map((school) => (
                    <TableRow key={school.id}>
                      <TableCell className="font-medium">{school.name}</TableCell>
                      <TableCell>{school.city}, {school.state}</TableCell>
                      <TableCell>{school.admins.length}</TableCell>
                      <TableCell>{school.teachers.length}</TableCell>
                      <TableCell>{school.students.length}</TableCell>
                      <TableCell>
                        <Badge
                          variant={school.subscriptionStatus === "active" ? "success" : "warning"}
                        >
                          {school.subscriptionStatus}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-muted-foreground text-xs">
                        {formatDate(school.createdAt)}
                      </TableCell>
                      <TableCell>
                        <Link href={`/superadmin/schools/${school.id}`}>
                          <Button size="sm" variant="ghost">Manage</Button>
                        </Link>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
