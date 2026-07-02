"use client";

import { Suspense, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { signIn } from "next-auth/react";
import { GraduationCap, Eye, EyeOff, Loader2, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import Link from "next/link";

type Role = "superadmin" | "school_admin" | "teacher" | "student";

export default function LoginPage() {
  const router = useRouter();
  const [callbackUrl, setCallbackUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    setCallbackUrl(params.get("callbackUrl"));
  }, []);
  const [showPassword, setShowPassword] = useState(false);
  const [form, setForm] = useState({
    email: "",
    password: "",
    role: "student" as Role,
    schoolSlug: "",
  });

  const roleLabels: Record<Role, string> = {
    superadmin: "Super Administrator",
    school_admin: "School Administrator",
    teacher: "Teacher",
    student: "Student",
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!form.email || !form.password || !form.role) {
      setError("Please fill in all required fields.");
      return;
    }

    setLoading(true);
    try {
      const result = await signIn("credentials", {
        email: form.email,
        password: form.password,
        role: form.role,
        schoolSlug: form.schoolSlug,
        redirect: false,
      });

      if (result?.error) {
        if (result.code === "account_deactivated") {
          setError(
            "Your account has been deactivated. Please contact the super administrator to restore access."
          );
        } else {
          setError("Invalid email or password. Please check your details and try again.");
        }
        return;
      }

      // Redirect based on role
      if (form.role === "superadmin") {
        router.push("/superadmin/dashboard");
      } else if (form.role === "school_admin") {
        router.push(`/${form.schoolSlug}/admin/dashboard`);
      } else if (form.role === "teacher") {
        router.push(`/${form.schoolSlug}/teacher/dashboard`);
      } else {
        router.push(`/${form.schoolSlug}/student/dashboard`);
      }

      router.refresh();
    } catch {
      setError("An error occurred. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center">Loading...</div>}>
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50 flex items-center justify-center p-4">
        <div className="w-full max-w-md">
          {/* Logo */}
          <div className="text-center mb-8">
          <Link href="/" className="inline-flex items-center gap-2 justify-center">
            <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center">
              <GraduationCap className="h-6 w-6 text-white" />
            </div>
            <span className="text-2xl font-bold text-gray-900">
              EduManage <span className="text-blue-600">NG</span>
            </span>
          </Link>
          <p className="text-gray-500 text-sm mt-2">Sign in to your account</p>
        </div>

        <Card className="shadow-lg border-0">
          <CardHeader className="pb-4">
            <CardTitle className="text-xl">Welcome back</CardTitle>
            <CardDescription>
              Enter your credentials to access your portal
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Role Selection */}
              <div className="space-y-2">
                <Label>Login as</Label>
                <Select
                  value={form.role}
                  onValueChange={(v) => {
                    setForm({ ...form, role: v as Role });
                    setError(null);
                  }}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select role" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="student">Student</SelectItem>
                    <SelectItem value="teacher">Teacher</SelectItem>
                    <SelectItem value="school_admin">School Administrator</SelectItem>
                    <SelectItem value="superadmin">Super Administrator</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* School Slug (for non-superadmin) */}
              {form.role !== "superadmin" && (
                <div className="space-y-2">
                  <Label>School ID / Slug</Label>
                  <Input
                    placeholder="e.g. bright-stars-school"
                    value={form.schoolSlug}
                    onChange={(e) => {
                      setForm({ ...form, schoolSlug: e.target.value.toLowerCase().trim() });
                      setError(null);
                    }}
                  />
                  <p className="text-xs text-muted-foreground">
                    Ask your school administrator for your school&apos;s ID
                  </p>
                </div>
              )}

              {/* Email */}
              <div className="space-y-2">
                <Label>Email Address</Label>
                <Input
                  type="email"
                  placeholder="yourname@example.com"
                  value={form.email}
                  onChange={(e) => {
                    setForm({ ...form, email: e.target.value });
                    setError(null);
                  }}
                  required
                />
              </div>

              {/* Password */}
              <div className="space-y-2">
                <Label>Password</Label>
                <div className="relative">
                  <Input
                    type={showPassword ? "text" : "password"}
                    placeholder="Enter your password"
                    value={form.password}
                    onChange={(e) => {
                      setForm({ ...form, password: e.target.value });
                      setError(null);
                    }}
                    required
                  />
                  <button
                    type="button"
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              {error && (
                <div className="flex items-start gap-2 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
                  <AlertCircle className="h-4 w-4 mt-0.5 flex-shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              <Button
                type="submit"
                className="w-full bg-blue-600 hover:bg-blue-700"
                disabled={loading}
              >
                {loading ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    Signing in...
                  </>
                ) : (
                  `Sign in as ${roleLabels[form.role]}`
                )}
              </Button>
            </form>

            <div className="mt-6 p-4 bg-blue-50 rounded-lg text-xs text-blue-800 space-y-1">
              <p className="font-semibold">Demo Superadmin Credentials:</p>
              <p>Email: superadmin@schoolmgmt.ng</p>
              <p>Password: SuperAdmin@2025</p>
            </div>
          </CardContent>
        </Card>

        <p className="text-center text-xs text-gray-500 mt-6">
          © 2025 EduManage NG · Powered by modern technology
        </p>
      </div>
    </div>
    </Suspense>
  );
}
