import { getPlatformMessagesForPage, markAllPlatformMessagesRead } from "@/actions/platform-messages";
import { Topbar } from "@/components/nav/topbar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatDate } from "@/lib/utils";
import { Megaphone, Mail } from "lucide-react";
import { MarkAllRead } from "@/components/dashboard/mark-all-read";

export default async function AdminMessagesPage() {
  const items = await getPlatformMessagesForPage();

  return (
    <div>
      <MarkAllRead action={markAllPlatformMessagesRead} />
      <Topbar title="Messages" subtitle="Messages and announcements from the platform administrator" />
      <div className="p-6 space-y-4">
        {items.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center text-muted-foreground">
              No messages yet.
            </CardContent>
          </Card>
        ) : (
          items.map((m) => (
            <Card key={m.id} className={m.isRead ? "" : "border-blue-300 bg-blue-50/30"}>
              <CardHeader className="flex flex-row items-start justify-between space-y-0">
                <div className="flex items-start gap-3">
                  <div className={`h-9 w-9 rounded-full flex items-center justify-center flex-shrink-0 ${m.toSchoolAdminId ? "bg-purple-100" : "bg-blue-100"}`}>
                    {m.toSchoolAdminId ? (
                      <Mail className="h-4 w-4 text-purple-600" />
                    ) : (
                      <Megaphone className="h-4 w-4 text-blue-600" />
                    )}
                  </div>
                  <div>
                    <CardTitle className="text-base">{m.title}</CardTitle>
                    <div className="flex items-center gap-2 mt-1">
                      <Badge variant={m.toSchoolAdminId ? "secondary" : "info"}>
                        {m.toSchoolAdminId ? "Direct Message" : "Announcement"}
                      </Badge>
                      <span className="text-xs text-muted-foreground">{formatDate(m.createdAt)}</span>
                    </div>
                  </div>
                </div>
                {!m.isRead && <Badge variant="success">New</Badge>}
              </CardHeader>
              <CardContent>
                <p className="text-sm text-gray-700 whitespace-pre-wrap">{m.message}</p>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}
