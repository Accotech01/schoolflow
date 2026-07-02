import { db } from "@/lib/db";
import { notFound } from "next/navigation";
import { Topbar } from "@/components/nav/topbar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { formatDate, isPaymentOverdue } from "@/lib/utils";
import Link from "next/link";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { ArrowLeft, Mail, Phone, MapPin } from "lucide-react";
import { eq } from "drizzle-orm";
import { schools } from "@/lib/db/schema";
import { ManageAdminAccessDialog } from "@/app/superadmin/admins/manage-access-dialog";

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function SchoolDetailPage({ params }: PageProps) {
  const { id } = await params;

  const school = await db.query.schools.findFirst({
    where: eq(schools.id, id),
    with: {
      admins: true,
      teachers: true,
      students: true,
      sessions: {
        with: { terms: true },
        orderBy: (s, { desc }) => [desc(s.createdAt)],
      },
    },
  });

  if (!school) notFound();

  return (
    <div>
      <Topbar title={school.name} subtitle="School Details" />
      <div className="p-6 space-y-6">
        <Link href="/superadmin/schools">
          <Button variant="ghost" size="sm" className="gap-2">
            <ArrowLeft className="h-4 w-4" /> Back to Schools
          </Button>
        </Link>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* School Info */}
          <Card className="md:col-span-2">
            <CardHeader>
              <div className="flex items-start justify-between">
                <div>
                  <CardTitle>{school.name}</CardTitle>
                  <code className="text-xs text-muted-foreground bg-gray-100 px-2 py-0.5 rounded mt-1 inline-block">
                    {school.slug}
                  </code>
                </div>
                <Badge
                  variant={school.subscriptionStatus === "active" ? "success" : "info"}
                  className="capitalize"
                >
                  {school.subscriptionStatus}
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <MapPin className="h-4 w-4 text-gray-400" />
                {school.address}, {school.city}, {school.state}
              </div>
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <Phone className="h-4 w-4 text-gray-400" />
                {school.phone}
              </div>
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <Mail className="h-4 w-4 text-gray-400" />
                {school.email}
              </div>
              {school.motto && (
                <p className="text-sm italic text-gray-500">
                  &ldquo;{school.motto}&rdquo;
                </p>
              )}
              <p className="text-xs text-muted-foreground">
                Registered: {formatDate(school.createdAt)}
              </p>
            </CardContent>
          </Card>

          {/* Quick Stats */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Quick Stats</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {[
                { label: "Admins", value: school.admins.length, color: "text-blue-600" },
                { label: "Teachers", value: school.teachers.length, color: "text-green-600" },
                { label: "Students", value: school.students.length, color: "text-purple-600" },
                { label: "Sessions", value: school.sessions.length, color: "text-orange-600" },
              ].map((stat) => (
                <div key={stat.label} className="flex justify-between items-center py-2 border-b last:border-0">
                  <span className="text-sm text-gray-600">{stat.label}</span>
                  <span className={`font-bold text-lg ${stat.color}`}>{stat.value}</span>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>

        {/* Admins Table */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">School Administrators</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Phone</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Last Payment</TableHead>
                  <TableHead>Next Due</TableHead>
                  <TableHead>Created</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {school.admins.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                      No administrators assigned
                    </TableCell>
                  </TableRow>
                ) : (
                  school.admins.map((admin) => (
                    <TableRow key={admin.id}>
                      <TableCell className="font-medium">{admin.name}</TableCell>
                      <TableCell>{admin.email}</TableCell>
                      <TableCell>{admin.phone || "—"}</TableCell>
                      <TableCell>
                        <Badge variant={admin.status === "active" ? "success" : "warning"}>
                          {admin.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground">
                        {formatDate(admin.lastPaymentDate)}
                      </TableCell>
                      <TableCell className="text-xs">
                        <span
                          className={
                            isPaymentOverdue(admin.nextPaymentDueDate)
                              ? "text-red-600 font-medium"
                              : "text-muted-foreground"
                          }
                        >
                          {formatDate(admin.nextPaymentDueDate)}
                        </span>
                        {isPaymentOverdue(admin.nextPaymentDueDate) && (
                          <Badge variant="destructive" className="ml-2">
                            Overdue
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground">
                        {formatDate(admin.createdAt)}
                      </TableCell>
                      <TableCell className="text-right">
                        <ManageAdminAccessDialog
                          adminId={admin.id}
                          adminName={admin.name}
                          status={admin.status}
                          lastPaymentDate={admin.lastPaymentDate}
                          nextPaymentDueDate={admin.nextPaymentDueDate}
                        />
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
