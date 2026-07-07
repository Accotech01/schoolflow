import { auth } from "@/auth";
import { db } from "@/lib/db";
import { parents } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { getMyChildren } from "@/actions/parents";
import { Topbar } from "@/components/nav/topbar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { GraduationCap, ArrowRight } from "lucide-react";
import Link from "next/link";

interface Props {
  params: Promise<{ schoolSlug: string }>;
}

export default async function ParentDashboard({ params }: Props) {
  const { schoolSlug } = await params;
  const session = await auth();

  const parent = await db.query.parents.findFirst({
    where: eq(parents.id, session!.user.id),
  });

  const children = await getMyChildren();

  return (
    <div>
      <Topbar
        title={`Welcome, ${parent?.name?.split(" ")[0] || "Parent"}`}
        subtitle="Your children's details, all in one place"
      />
      <div className="p-6 space-y-6">
        {children.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center text-muted-foreground">
              No children are linked to your account yet. Please contact your school
              administrator if this is unexpected.
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {children.map((child) => (
              <Card key={child.id}>
                <CardHeader className="flex flex-row items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0">
                      <GraduationCap className="h-5 w-5 text-blue-600" />
                    </div>
                    <div>
                      <CardTitle className="text-base">{child.name}</CardTitle>
                      <p className="text-xs text-muted-foreground">{child.admissionNumber}</p>
                    </div>
                  </div>
                  <Badge variant={child.status === "active" ? "success" : "warning"}>
                    {child.status}
                  </Badge>
                </CardHeader>
                <CardContent className="flex items-center justify-between">
                  <div className="text-sm">
                    <span className="text-muted-foreground">Class: </span>
                    <span className="font-medium">{child.className || "Not enrolled"}</span>
                  </div>
                  <Link href={`/${schoolSlug}/parent/children/${child.id}`}>
                    <Button size="sm" variant="outline" className="gap-1.5">
                      View Details
                      <ArrowRight className="h-3.5 w-3.5" />
                    </Button>
                  </Link>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
