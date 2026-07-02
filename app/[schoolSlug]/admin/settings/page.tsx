import { auth } from "@/auth";
import { db } from "@/lib/db";
import { schools } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { Topbar } from "@/components/nav/topbar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Building2 } from "lucide-react";

interface Props {
  params: Promise<{ schoolSlug: string }>;
}

export default async function SettingsPage({ params }: Props) {
  const { schoolSlug } = await params;
  const session = await auth();
  const schoolId = session!.user.schoolId!;

  const school = await db.query.schools.findFirst({
    where: eq(schools.id, schoolId),
  });

  return (
    <div>
      <Topbar title="School Settings" subtitle="Manage school information" />
      <div className="p-6 space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">School Information</CardTitle>
          </CardHeader>
          <CardContent>
            {school && (
              <>
                <div className="flex items-center gap-4 mb-6 pb-6 border-b">
                  {school.logoUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={school.logoUrl}
                      alt={school.name}
                      className="h-16 w-16 rounded-lg object-cover border"
                    />
                  ) : (
                    <div className="h-16 w-16 rounded-lg bg-gray-100 flex items-center justify-center">
                      <Building2 className="h-7 w-7 text-gray-400" />
                    </div>
                  )}
                  <div>
                    <p className="font-semibold">{school.name}</p>
                    <p className="text-xs text-muted-foreground">School Logo</p>
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-muted-foreground">School Name</p>
                  <p className="font-medium">{school.name}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">School Slug</p>
                  <code className="bg-gray-100 px-2 py-0.5 rounded">{school.slug}</code>
                </div>
                <div>
                  <p className="text-muted-foreground">Email</p>
                  <p className="font-medium">{school.email}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Phone</p>
                  <p className="font-medium">{school.phone}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Location</p>
                  <p className="font-medium">{school.city}, {school.state}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Subscription</p>
                  <Badge variant={school.subscriptionStatus === "active" ? "success" : "info"}>
                    {school.subscriptionStatus}
                  </Badge>
                </div>
                {school.motto && (
                  <div className="col-span-2">
                    <p className="text-muted-foreground">Motto</p>
                    <p className="font-medium italic">&ldquo;{school.motto}&rdquo;</p>
                  </div>
                )}
                </div>
              </>
            )}
          </CardContent>
        </Card>

        <Card className="bg-blue-50 border-blue-200">
          <CardContent className="pt-4">
            <p className="text-sm font-semibold text-blue-800">Need to update school information?</p>
            <p className="text-sm text-blue-700 mt-1">
              Contact the platform superadmin at{" "}
              <a href="mailto:superadmin@schoolmgmt.ng" className="underline">
                superadmin@schoolmgmt.ng
              </a>{" "}
              to update core school details.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
