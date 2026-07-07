import { getAnnouncementsForPage, markAllAnnouncementsRead } from "@/actions/announcements";
import { db } from "@/lib/db";
import { classes } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { Topbar } from "@/components/nav/topbar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatDate } from "@/lib/utils";
import { Megaphone } from "lucide-react";
import { MarkAllRead } from "@/components/dashboard/mark-all-read";

export default async function StudentAnnouncementsPage() {
  const items = await getAnnouncementsForPage();

  const classIds = [...new Set(items.filter((a) => a.classId).map((a) => a.classId!))];
  const classRows = classIds.length
    ? await db.query.classes.findMany({ where: (c, { inArray }) => inArray(c.id, classIds) })
    : [];
  const classNameById = new Map(classRows.map((c) => [c.id, c.name]));

  return (
    <div>
      <MarkAllRead action={markAllAnnouncementsRead} />
      <Topbar title="Announcements" subtitle="Updates from your school and teachers" />
      <div className="p-6 space-y-4">
        {items.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center text-muted-foreground">
              No announcements yet.
            </CardContent>
          </Card>
        ) : (
          items.map((a) => (
            <Card key={a.id} className={a.isRead ? "" : "border-blue-300 bg-blue-50/30"}>
              <CardHeader className="flex flex-row items-start justify-between space-y-0">
                <div className="flex items-start gap-3">
                  <div className="h-9 w-9 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0">
                    <Megaphone className="h-4 w-4 text-blue-600" />
                  </div>
                  <div>
                    <CardTitle className="text-base">{a.title}</CardTitle>
                    <div className="flex items-center gap-2 mt-1">
                      {a.classId && (
                        <Badge variant="info">{classNameById.get(a.classId) || "Class"}</Badge>
                      )}
                      <span className="text-xs text-muted-foreground">{formatDate(a.createdAt)}</span>
                    </div>
                  </div>
                </div>
                {!a.isRead && <Badge variant="success">New</Badge>}
              </CardHeader>
              <CardContent>
                <p className="text-sm text-gray-700 whitespace-pre-wrap">{a.message}</p>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}
