import { db } from "@/lib/db";
import { schoolAdmins, schools } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { Topbar } from "@/components/nav/topbar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatDate, isPaymentOverdue } from "@/lib/utils";
import { Users, Building2, Mail, Calendar } from "lucide-react";
import { TableSearch } from "@/components/ui/table-search";
import { ManageAdminAccessDialog } from "./manage-access-dialog";

export default async function AdminsPage() {
  const admins = await db.query.schoolAdmins.findMany({
    with: { school: true },
    orderBy: (a, { desc }) => [desc(a.createdAt)],
  });

  const activeAdmins = admins.filter((a) => a.status === "active").length;
  const inactiveAdmins = admins.filter((a) => a.status !== "active").length;

  return (
    <div>
      <Topbar
        title="School Administrators"
        subtitle="All school admin accounts across the platform"
      />
      <div className="p-6 space-y-6">
        {/* Summary Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card>
            <CardContent className="pt-4 flex items-center gap-3">
              <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center">
                <Users className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Total Admins</p>
                <p className="text-2xl font-bold">{admins.length}</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4 flex items-center gap-3">
              <div className="h-10 w-10 rounded-full bg-green-100 flex items-center justify-center">
                <Users className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Active</p>
                <p className="text-2xl font-bold">{activeAdmins}</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4 flex items-center gap-3">
              <div className="h-10 w-10 rounded-full bg-gray-100 flex items-center justify-center">
                <Users className="h-5 w-5 text-gray-500" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Inactive</p>
                <p className="text-2xl font-bold">{inactiveAdmins}</p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Admins Table */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between flex-wrap gap-3">
            <CardTitle className="text-base">All Administrators</CardTitle>
            <TableSearch targetId="superadmin-admins-table" placeholder="Search administrators..." />
          </CardHeader>
          <CardContent>
            {admins.length === 0 ? (
              <p className="text-sm text-muted-foreground py-8 text-center">
                No school administrators created yet. Create a school to add an admin.
              </p>
            ) : (
              <div className="overflow-x-auto">
                <table id="superadmin-admins-table" className="w-full text-sm">
                  <thead>
                    <tr className="bg-gray-50 border-b">
                      <th className="text-left px-4 py-3 font-medium">Administrator</th>
                      <th className="text-left px-4 py-3 font-medium">School</th>
                      <th className="text-left px-4 py-3 font-medium">Email</th>
                      <th className="text-center px-4 py-3 font-medium">Status</th>
                      <th className="text-left px-4 py-3 font-medium">Last Payment</th>
                      <th className="text-left px-4 py-3 font-medium">Next Due</th>
                      <th className="text-left px-4 py-3 font-medium">Joined</th>
                      <th className="text-right px-4 py-3 font-medium">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr data-search-empty style={{ display: "none" }}>
                      <td colSpan={8} className="text-center py-8 text-muted-foreground">
                        No matching administrators found.
                      </td>
                    </tr>
                    {admins.map((admin, i) => (
                      <tr
                        key={admin.id}
                        data-search={`${admin.name} ${admin.email} ${admin.school?.name || ""}`.toLowerCase()}
                        className={`border-b hover:bg-gray-50 ${i % 2 === 0 ? "bg-white" : "bg-gray-50/30"}`}
                      >
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-3">
                            <div className="h-8 w-8 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0">
                              <Users className="h-4 w-4 text-blue-600" />
                            </div>
                            <div>
                              <p className="font-medium">{admin.name}</p>
                              <p className="text-xs text-muted-foreground">School Admin</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2">
                            <Building2 className="h-3.5 w-3.5 text-muted-foreground" />
                            <span>{admin.school?.name || "—"}</span>
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2">
                            <Mail className="h-3.5 w-3.5 text-muted-foreground" />
                            <span className="text-muted-foreground">{admin.email}</span>
                          </div>
                        </td>
                        <td className="px-4 py-3 text-center">
                          <Badge
                            variant={admin.status === "active" ? "success" : "secondary"}
                            className="capitalize"
                          >
                            {admin.status}
                          </Badge>
                        </td>
                        <td className="px-4 py-3 text-muted-foreground">
                          {formatDate(admin.lastPaymentDate)}
                        </td>
                        <td className="px-4 py-3">
                          <span
                            className={
                              isPaymentOverdue(admin.nextPaymentDueDate)
                                ? "text-red-600 font-medium"
                                : "text-muted-foreground"
                            }
                          >
                            {formatDate(admin.nextPaymentDueDate)}
                            {isPaymentOverdue(admin.nextPaymentDueDate) && (
                              <Badge variant="destructive" className="ml-2 align-middle">
                                Overdue
                              </Badge>
                            )}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-1 text-muted-foreground">
                            <Calendar className="h-3.5 w-3.5" />
                            <span>{formatDate(admin.createdAt)}</span>
                          </div>
                        </td>
                        <td className="px-4 py-3 text-right">
                          <ManageAdminAccessDialog
                            adminId={admin.id}
                            adminName={admin.name}
                            status={admin.status}
                            lastPaymentDate={admin.lastPaymentDate}
                            nextPaymentDueDate={admin.nextPaymentDueDate}
                          />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="border-blue-200 bg-blue-50">
          <CardContent className="pt-4">
            <p className="text-sm text-blue-800">
              <strong>Note:</strong> School administrators are automatically created when you create a school.
              Use &quot;Manage Access&quot; to deactivate a login or set payment dates. To add a new administrator, visit the school&apos;s detail page.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
