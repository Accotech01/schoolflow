import { getSchoolComplaints } from "@/actions/complaints";
import { Topbar } from "@/components/nav/topbar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatDate } from "@/lib/utils";
import { MessageSquare } from "lucide-react";
import { RespondComplaintDialog } from "./respond-complaint-dialog";

export default async function AdminComplaintsPage() {
  const allComplaints = await getSchoolComplaints();
  const openCount = allComplaints.filter((c) => c.status === "open").length;

  return (
    <div>
      <Topbar title="Complaints & Suggestions" subtitle={`${openCount} open of ${allComplaints.length} total`} />
      <div className="p-6 space-y-4">
        {allComplaints.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center text-muted-foreground">
              No complaints or suggestions submitted yet.
            </CardContent>
          </Card>
        ) : (
          allComplaints.map((c) => (
            <Card key={c.id} className={c.status === "open" ? "border-amber-300 bg-amber-50/30" : ""}>
              <CardHeader className="flex flex-row items-start justify-between space-y-0">
                <div className="flex items-start gap-3">
                  <div className="h-9 w-9 rounded-full bg-amber-100 flex items-center justify-center flex-shrink-0">
                    <MessageSquare className="h-4 w-4 text-amber-600" />
                  </div>
                  <div>
                    <CardTitle className="text-base">{c.subject}</CardTitle>
                    <div className="flex items-center gap-2 mt-1 flex-wrap">
                      <span className="text-xs text-muted-foreground">
                        From {c.parent?.name || "Unknown parent"}
                        {c.student && ` — regarding ${c.student.name}`}
                      </span>
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
                    <p className="text-xs font-semibold text-blue-800 mb-1">Your Response</p>
                    <p className="text-sm text-blue-900 whitespace-pre-wrap">{c.response}</p>
                  </div>
                )}
                {c.status === "open" && (
                  <div className="flex justify-end">
                    <RespondComplaintDialog complaintId={c.id} subject={c.subject} />
                  </div>
                )}
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}
