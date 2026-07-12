import { db } from "@/lib/db";
import { Topbar } from "@/components/nav/topbar";
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
import { Building2 } from "lucide-react";
import { TableSearch } from "@/components/ui/table-search";
import { CreateSchoolDialog } from "./create-school-dialog";
import { DeleteSchoolButton } from "./delete-school-button";

export default async function SchoolsPage() {
  const allSchools = await db.query.schools.findMany({
    orderBy: (s, { desc }) => [desc(s.createdAt)],
    with: {
      admins: true,
      teachers: true,
      students: true,
    },
  });

  return (
    <div>
      <Topbar title="Schools" subtitle="Manage all registered schools" />
      <div className="p-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between flex-wrap gap-3">
            <CardTitle className="text-lg">All Schools ({allSchools.length})</CardTitle>
            <div className="flex items-center gap-3">
              <TableSearch targetId="schools-table" placeholder="Search schools..." />
              <CreateSchoolDialog />
            </div>
          </CardHeader>
          <CardContent>
            <Table id="schools-table">
              <TableHeader>
                <TableRow>
                  <TableHead>School Name</TableHead>
                  <TableHead>Slug</TableHead>
                  <TableHead>Location</TableHead>
                  <TableHead>Phone</TableHead>
                  <TableHead>Admins</TableHead>
                  <TableHead>Students</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Created</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {allSchools.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={9} className="text-center py-12 text-muted-foreground">
                      No schools registered yet. Create your first school.
                    </TableCell>
                  </TableRow>
                ) : (
                  <>
                  <TableRow data-search-empty style={{ display: "none" }}>
                    <TableCell colSpan={9} className="text-center py-8 text-muted-foreground">
                      No matching schools found.
                    </TableCell>
                  </TableRow>
                  {allSchools.map((school) => (
                    <TableRow
                      key={school.id}
                      data-search={`${school.name} ${school.slug} ${school.city} ${school.state}`.toLowerCase()}
                    >
                      <TableCell className="font-medium">
                        <div className="flex items-center gap-2">
                          {school.logoUrl ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img
                              src={school.logoUrl}
                              alt={school.name}
                              className="h-8 w-8 rounded-md object-cover flex-shrink-0 border"
                            />
                          ) : (
                            <div className="h-8 w-8 rounded-md bg-gray-100 flex items-center justify-center flex-shrink-0">
                              <Building2 className="h-4 w-4 text-gray-400" />
                            </div>
                          )}
                          {school.name}
                        </div>
                      </TableCell>
                      <TableCell>
                        <code className="text-xs bg-gray-100 px-2 py-1 rounded">{school.slug}</code>
                      </TableCell>
                      <TableCell>{school.city}, {school.state}</TableCell>
                      <TableCell>{school.phone}</TableCell>
                      <TableCell>{school.admins.length}</TableCell>
                      <TableCell>{school.students.length}</TableCell>
                      <TableCell>
                        <Badge
                          variant={
                            school.subscriptionStatus === "active"
                              ? "success"
                              : school.subscriptionStatus === "trial"
                              ? "info"
                              : "warning"
                          }
                        >
                          {school.subscriptionStatus}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground">
                        {formatDate(school.createdAt)}
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-2">
                          <Link href={`/superadmin/schools/${school.id}`}>
                            <Button size="sm" variant="outline">
                              Manage
                            </Button>
                          </Link>
                          <DeleteSchoolButton schoolId={school.id} schoolName={school.name} />
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                  </>
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
