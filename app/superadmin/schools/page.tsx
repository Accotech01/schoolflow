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
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-lg">All Schools ({allSchools.length})</CardTitle>
            <CreateSchoolDialog />
          </CardHeader>
          <CardContent>
            <Table>
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
                  allSchools.map((school) => (
                    <TableRow key={school.id}>
                      <TableCell className="font-medium">{school.name}</TableCell>
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
