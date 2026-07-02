import { auth } from "@/auth";
import { db } from "@/lib/db";
import { announcements } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { Topbar } from "@/components/nav/topbar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatDate } from "@/lib/utils";
import { Megaphone } from "lucide-react";
import { CreateAnnouncementDialog } from "./create-announcement-dialog";
import { DeleteAnnouncementButton } from "@/components/announcements/delete-announcement-button";

const audienceLabel = {
  students: "Students Only",
  teachers: "Teachers Only",
  both: "Students & Teachers",
} as const;

interface Props {
  params: Promise<{ schoolSlug: string }>;
}

export default async function AnnouncementsPage({ params }: Props) {
  await params;
  const session = await auth();
  const schoolId = session!.user.schoolId!;

  const allAnnouncements = await db.query.announcements.findMany({
    where: eq(announcements.schoolId, schoolId),
    orderBy: (a, { desc }) => [desc(a.createdAt)],
    with: { class: true },
  });

  return (
    <div>
      <Topbar title="Announcements" subtitle="Send newsletters and updates to students and teachers" />
      <div className="p-6 space-y-6">
        <div className="flex justify-end">
          <CreateAnnouncementDialog />
        </div>

        {allAnnouncements.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center text-muted-foreground">
              No announcements sent yet. Click &ldquo;New Announcement&rdquo; to send your first one.
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {allAnnouncements.map((a) => (
              <Card key={a.id}>
                <CardHeader className="flex flex-row items-start justify-between space-y-0">
                  <div className="flex items-start gap-3">
                    <div className="h-9 w-9 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0">
                      <Megaphone className="h-4 w-4 text-blue-600" />
                    </div>
                    <div>
                      <CardTitle className="text-base">{a.title}</CardTitle>
                      <div className="flex items-center gap-2 mt-1 flex-wrap">
                        <Badge variant="info">{a.class ? a.class.name : audienceLabel[a.audience]}</Badge>
                        {a.createdByRole === "teacher" && (
                          <Badge variant="secondary">By Teacher</Badge>
                        )}
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
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
