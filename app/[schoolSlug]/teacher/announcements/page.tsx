import { auth } from "@/auth";
import { getAnnouncementsForPage } from "@/actions/announcements";
import { db } from "@/lib/db";
import { announcements } from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";
import { Topbar } from "@/components/nav/topbar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatDate } from "@/lib/utils";
import { Megaphone } from "lucide-react";
import { CreateClassAnnouncementDialog } from "./create-class-announcement-dialog";
import { DeleteAnnouncementButton } from "@/components/announcements/delete-announcement-button";
import { MarkAllAnnouncementsRead } from "@/components/dashboard/mark-all-announcements-read";

export default async function TeacherAnnouncementsPage() {
  const session = await auth();
  const teacherId = session!.user.id;

  const received = await getAnnouncementsForPage();

  const sent = await db.query.announcements.findMany({
    where: and(eq(announcements.createdBy, teacherId), eq(announcements.createdByRole, "teacher")),
    orderBy: (a, { desc }) => [desc(a.createdAt)],
    with: { class: true },
  });

  return (
    <div>
      <MarkAllAnnouncementsRead />
      <Topbar title="Announcements" subtitle="School updates and your class announcements" />
      <div className="p-6 space-y-8">
        {/* Received from school admin */}
        <div className="space-y-4">
          <h2 className="text-sm font-semibold text-gray-700">From School Administration</h2>
          {received.length === 0 ? (
            <Card>
              <CardContent className="py-8 text-center text-muted-foreground">
                No announcements yet.
              </CardContent>
            </Card>
          ) : (
            received.map((a) => (
              <Card key={a.id} className={a.isRead ? "" : "border-blue-300 bg-blue-50/30"}>
                <CardHeader className="flex flex-row items-start justify-between space-y-0">
                  <div className="flex items-start gap-3">
                    <div className="h-9 w-9 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0">
                      <Megaphone className="h-4 w-4 text-blue-600" />
                    </div>
                    <div>
                      <CardTitle className="text-base">{a.title}</CardTitle>
                      <span className="text-xs text-muted-foreground">{formatDate(a.createdAt)}</span>
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

        {/* Sent to my classes */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold text-gray-700">My Class Announcements</h2>
            <CreateClassAnnouncementDialog />
          </div>
          {sent.length === 0 ? (
            <Card>
              <CardContent className="py-8 text-center text-muted-foreground">
                You haven&apos;t sent any class announcements yet.
              </CardContent>
            </Card>
          ) : (
            sent.map((a) => (
              <Card key={a.id}>
                <CardHeader className="flex flex-row items-start justify-between space-y-0">
                  <div className="flex items-start gap-3">
                    <div className="h-9 w-9 rounded-full bg-purple-100 flex items-center justify-center flex-shrink-0">
                      <Megaphone className="h-4 w-4 text-purple-600" />
                    </div>
                    <div>
                      <CardTitle className="text-base">{a.title}</CardTitle>
                      <div className="flex items-center gap-2 mt-1">
                        <Badge variant="info">{a.class?.name || "Class"}</Badge>
                        <span className="text-xs text-muted-foreground">{formatDate(a.createdAt)}</span>
                      </div>
                    </div>
                  </div>
                  <DeleteAnnouncementButton announcementId={a.id} title={a.title} />
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-gray-700 whitespace-pre-wrap">{a.message}</p>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
