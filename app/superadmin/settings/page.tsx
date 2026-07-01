import { auth } from "@/auth";
import { db } from "@/lib/db";
import { superadmins } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { Topbar } from "@/components/nav/topbar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { formatDate } from "@/lib/utils";
import { User, Mail, Shield, Calendar, Info } from "lucide-react";

export default async function SuperadminSettingsPage() {
  const session = await auth();
  const superadmin = await db.query.superadmins.findFirst({
    where: eq(superadmins.id, session!.user.id),
  });

  return (
    <div>
      <Topbar title="Settings" subtitle="Platform configuration and account settings" />
      <div className="p-6 space-y-6">
        {/* Account Info */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Superadmin Account</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-4">
              <div className="h-16 w-16 rounded-full bg-purple-100 flex items-center justify-center">
                <Shield className="h-8 w-8 text-purple-600" />
              </div>
              <div>
                <h2 className="text-xl font-bold">{superadmin?.name || session?.user.name}</h2>
                <div className="flex items-center gap-2 mt-1">
                  <Badge className="bg-purple-100 text-purple-800">Superadmin</Badge>
                  <Badge variant="success">Active</Badge>
                </div>
              </div>
            </div>

            <Separator />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex items-center gap-3">
                <Mail className="h-4 w-4 text-muted-foreground" />
                <div>
                  <p className="text-xs text-muted-foreground">Email</p>
                  <p className="text-sm font-medium">{superadmin?.email}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <User className="h-4 w-4 text-muted-foreground" />
                <div>
                  <p className="text-xs text-muted-foreground">Name</p>
                  <p className="text-sm font-medium">{superadmin?.name}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Calendar className="h-4 w-4 text-muted-foreground" />
                <div>
                  <p className="text-xs text-muted-foreground">Account Created</p>
                  <p className="text-sm font-medium">
                    {superadmin?.createdAt ? formatDate(superadmin.createdAt) : "—"}
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Platform Info */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Platform Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center justify-between py-2 border-b">
              <span className="text-sm text-muted-foreground">Platform Name</span>
              <span className="text-sm font-medium">EduManage NG</span>
            </div>
            <div className="flex items-center justify-between py-2 border-b">
              <span className="text-sm text-muted-foreground">Grading Standard</span>
              <span className="text-sm font-medium">WAEC (A1–F9)</span>
            </div>
            <div className="flex items-center justify-between py-2 border-b">
              <span className="text-sm text-muted-foreground">School Structure</span>
              <span className="text-sm font-medium">Nigerian (Primary, JSS, SS)</span>
            </div>
            <div className="flex items-center justify-between py-2 border-b">
              <span className="text-sm text-muted-foreground">Terms per Session</span>
              <span className="text-sm font-medium">3 (First, Second, Third)</span>
            </div>
            <div className="flex items-center justify-between py-2 border-b">
              <span className="text-sm text-muted-foreground">Promotion Threshold</span>
              <span className="text-sm font-medium">C6 and above (50%+)</span>
            </div>
            <div className="flex items-center justify-between py-2">
              <span className="text-sm text-muted-foreground">Platform Version</span>
              <span className="text-sm font-medium">1.0.0</span>
            </div>
          </CardContent>
        </Card>

        {/* Security Note */}
        <Card className="border-amber-200 bg-amber-50">
          <CardContent className="pt-4 flex gap-3">
            <Info className="h-4 w-4 text-amber-600 flex-shrink-0 mt-0.5" />
            <div className="space-y-1">
              <p className="text-sm font-semibold text-amber-800">Security Reminder</p>
              <p className="text-sm text-amber-700">
                Your superadmin credentials provide full platform access. Keep them secure and change
                your password regularly. To update your password, use the database seed script or
                update the record directly in the database.
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Environment Info */}
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Deployment Checklist</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {[
                { item: "DATABASE_URL", desc: "Neon PostgreSQL connection string" },
                { item: "AUTH_SECRET", desc: "NextAuth secret key (min 32 chars)" },
                { item: "NEXTAUTH_URL", desc: "Your production URL (optional on Vercel)" },
                { item: "SUPERADMIN_EMAIL", desc: "Initial superadmin email for seeding" },
                { item: "SUPERADMIN_PASSWORD", desc: "Initial superadmin password for seeding" },
              ].map(({ item, desc }) => (
                <div key={item} className="flex items-start gap-2 py-1.5 border-b last:border-0">
                  <code className="text-xs bg-gray-100 px-1.5 py-0.5 rounded font-mono text-gray-700 flex-shrink-0">
                    {item}
                  </code>
                  <span className="text-xs text-muted-foreground">{desc}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
