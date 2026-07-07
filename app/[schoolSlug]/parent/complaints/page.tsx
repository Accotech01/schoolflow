import { getMyComplaints } from "@/actions/complaints";
import { getMyChildren } from "@/actions/parents";
import { Topbar } from "@/components/nav/topbar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatDate } from "@/lib/utils";
import { MessageSquare } from "lucide-react";
import { NewComplaintDialog } from "./new-complaint-dialog";

export default async function ParentComplaintsPage() {
  const [myComplaints, children] = await Promise.all([getMyComplaints(), getMyChildren()]);

  return (
    <div>
      <Topbar title="Complaints & Suggestions" subtitle="Reach out to your school administrator" />
      <div className="p-6 space-y-6">
        <div className="flex justify-end">
          <NewComplaintDialog children={children} />
        </div>

        {myComplaints.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center text-muted-foreground">
              You haven&apos;t submitted anything yet.
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {myComplaints.map((c) => (
              <Card key={c.id}>
                <CardHeader className="flex flex-row items-start justify-between space-y-0">
                  <div className="flex items-start gap-3">
                    <div className="h-9 w-9 rounded-full bg-amber-100 flex items-center justify-center flex-shrink-0">
                      <MessageSquare className="h-4 w-4 text-amber-600" />
                    </div>
                    <div>
                      <CardTitle className="text-base">{c.subject}</CardTitle>
                      <div className="flex items-center gap-2 mt-1 flex-wrap">
                        {c.student && <Badge variant="info">{c.student.name}</Badge>}
                        <span className="text-xs text-muted-foreground">{formatDate(c.createdAt)}</span>
                      </div>
                    </div>
                  </div>
                  <Badge variant={c.status === "open" ? "warning" : "success"} className="capitalize">
                    {c.status}
                  </Badge>
                </CardHeader>
                <CardContent className="space-y-3">
                  <p className="text-sm text-gray-700 whitespace-pre-wrap">{c.message}</p>
                  {c.response && (
                    <div className="rounded-md bg-blue-50 border border-blue-200 p-3">
                      <p className="text-xs font-semibold text-blue-800 mb-1">School&apos;s Response</p>
                      <p className="text-sm text-blue-900 whitespace-pre-wrap">{c.response}</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
