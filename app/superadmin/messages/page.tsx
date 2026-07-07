import { db } from "@/lib/db";
import { schoolAdmins } from "@/lib/db/schema";
import { getSentPlatformMessages } from "@/actions/platform-messages";
import { Topbar } from "@/components/nav/topbar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatDate } from "@/lib/utils";
import { Megaphone, Mail } from "lucide-react";
import { ComposeMessageDialog } from "./compose-message-dialog";
import { DeleteMessageButton } from "./delete-message-button";

export default async function SuperadminMessagesPage() {
  const admins = await db.query.schoolAdmins.findMany({
    with: { school: true },
    orderBy: (a, { asc }) => [asc(a.name)],
  });

  const sent = await getSentPlatformMessages();

  return (
    <div>
      <Topbar title="Messages" subtitle="Send messages and announcements to school administrators" />
      <div className="p-6 space-y-6">
        <div className="flex justify-end">
          <ComposeMessageDialog admins={admins} />
        </div>

        {sent.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center text-muted-foreground">
              No messages sent yet. Click &ldquo;New Message&rdquo; to reach a school admin or broadcast
              an announcement.
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {sent.map((m) => (
              <Card key={m.id}>
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
                          {m.toSchoolAdminId
                            ? `To: ${m.toSchoolAdmin?.name || "Unknown"} (${m.toSchoolAdmin?.school?.name || "—"})`
                            : "Broadcast to all admins"}
                        </Badge>
                        <span className="text-xs text-muted-foreground">{formatDate(m.createdAt)}</span>
                      </div>
                    </div>
                  </div>
                  <DeleteMessageButton messageId={m.id} title={m.title} />
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-gray-700 whitespace-pre-wrap">{m.message}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
