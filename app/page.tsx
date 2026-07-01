import Link from "next/link";
import {
  GraduationCap,
  Users,
  BookOpen,
  BarChart3,
  Shield,
  CheckCircle2,
  ArrowRight,
  Star,
  Globe,
  Bell,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-white">
      {/* Navigation */}
      <nav className="fixed top-0 z-50 w-full border-b bg-white/95 backdrop-blur">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center gap-2">
              <div className="flex items-center justify-center w-9 h-9 rounded-lg bg-blue-600">
                <GraduationCap className="h-5 w-5 text-white" />
              </div>
              <span className="font-bold text-xl text-gray-900">
                EduManage <span className="text-blue-600">NG</span>
              </span>
            </div>
            <div className="hidden md:flex items-center gap-6">
              <a href="#features" className="text-sm text-gray-600 hover:text-gray-900">Features</a>
              <a href="#how-it-works" className="text-sm text-gray-600 hover:text-gray-900">How It Works</a>
              <a href="#pricing" className="text-sm text-gray-600 hover:text-gray-900">Pricing</a>
            </div>
            <div className="flex items-center gap-3">
              <Link href="/login">
                <Button variant="outline" size="sm">Login</Button>
              </Link>
              <Link href="/login">
                <Button size="sm" className="bg-blue-600 hover:bg-blue-700">
                  Get Started
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="pt-32 pb-20 bg-gradient-to-br from-blue-50 via-white to-indigo-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-4xl mx-auto">
            <Badge variant="info" className="mb-4 px-4 py-1.5 text-sm">
              🇳🇬 Built for Nigerian Private Schools
            </Badge>
            <h1 className="text-5xl md:text-6xl font-extrabold text-gray-900 leading-tight">
              The Complete School
              <span className="text-blue-600"> Management System</span>
            </h1>
            <p className="mt-6 text-xl text-gray-600 leading-relaxed max-w-3xl mx-auto">
              Streamline administration, empower teachers, and enhance student learning with
              our all-in-one platform designed specifically for Nigerian private schools.
            </p>
            <div className="mt-10 flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="/login">
                <Button size="lg" className="bg-blue-600 hover:bg-blue-700 gap-2 text-base px-8">
                  Start Free Trial <ArrowRight className="h-5 w-5" />
                </Button>
              </Link>
              <Button size="lg" variant="outline" className="text-base px-8">
                Watch Demo
              </Button>
            </div>
            <p className="mt-4 text-sm text-gray-500">
              No credit card required · 30-day free trial · Setup in minutes
            </p>
          </div>

          {/* Dashboard Preview */}
          <div className="mt-16 rounded-2xl shadow-2xl border overflow-hidden bg-white">
            <div className="bg-gray-100 px-4 py-3 flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-red-400"></div>
              <div className="w-3 h-3 rounded-full bg-yellow-400"></div>
              <div className="w-3 h-3 rounded-full bg-green-400"></div>
              <div className="ml-4 flex-1 bg-white rounded text-xs text-gray-400 px-3 py-1 text-center">
                edumanage.ng/bright-stars-school/admin/dashboard
              </div>
            </div>
            <div className="p-6 bg-gray-50">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                {[
                  { label: "Total Students", value: "856", color: "bg-blue-500" },
                  { label: "Teachers", value: "42", color: "bg-green-500" },
                  { label: "Classes", value: "18", color: "bg-purple-500" },
                  { label: "Subjects", value: "24", color: "bg-orange-500" },
                ].map((stat) => (
                  <div key={stat.label} className="bg-white rounded-lg p-4 shadow-sm">
                    <div className={`w-2 h-2 rounded-full ${stat.color} mb-2`}></div>
                    <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
                    <p className="text-xs text-gray-500">{stat.label}</p>
                  </div>
                ))}
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-white rounded-lg p-4 shadow-sm">
                  <p className="text-sm font-semibold text-gray-700 mb-3">Recent Grades</p>
                  {["Mathematics — JSS 2A", "English Language — SS 1B", "Physics — SS 3A"].map((item) => (
                    <div key={item} className="flex items-center justify-between py-2 border-b last:border-0">
                      <span className="text-xs text-gray-600">{item}</span>
                      <span className="text-xs font-medium text-green-600">Updated</span>
                    </div>
                  ))}
                </div>
                <div className="bg-white rounded-lg p-4 shadow-sm">
                  <p className="text-sm font-semibold text-gray-700 mb-3">Upcoming Events</p>
                  {["First Term Exams", "PTA Meeting", "Inter-House Sports"].map((item) => (
                    <div key={item} className="flex items-center gap-2 py-2 border-b last:border-0">
                      <div className="w-2 h-2 rounded-full bg-blue-400"></div>
                      <span className="text-xs text-gray-600">{item}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Trusted By */}
      <section className="py-12 bg-white border-y">
        <div className="max-w-7xl mx-auto px-4 text-center">
          <p className="text-sm text-gray-500 mb-8">
            TRUSTED BY LEADING PRIVATE SCHOOLS ACROSS NIGERIA
          </p>
          <div className="flex flex-wrap justify-center gap-8 items-center opacity-60">
            {["Greenfield Academy", "Sunrise Private School", "Heritage Schools", "Royal Crown Academy", "Daystar Schools"].map((name) => (
              <div key={name} className="flex items-center gap-2">
                <GraduationCap className="h-5 w-5 text-gray-400" />
                <span className="font-semibold text-gray-600 text-sm">{name}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="py-24 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <Badge variant="info" className="mb-4">Features</Badge>
            <h2 className="text-4xl font-bold text-gray-900">
              Everything your school needs
            </h2>
            <p className="mt-4 text-lg text-gray-600 max-w-2xl mx-auto">
              A complete suite of tools designed to digitize and streamline every aspect of school management.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[
              {
                icon: Users,
                title: "Multi-Role Access",
                description: "Separate portals for Superadmin, School Admins, Teachers, and Students with role-based permissions.",
                color: "text-blue-600 bg-blue-50",
              },
              {
                icon: BarChart3,
                title: "WAEC-Aligned Grading",
                description: "Nigerian grading system (A1–F9) with continuous assessment: Test 1, Test 2, Assignment, Attendance, and Exam.",
                color: "text-green-600 bg-green-50",
              },
              {
                icon: BookOpen,
                title: "Digital Lesson Notes",
                description: "Teachers upload lesson notes and add links to learning resources for students to access anytime.",
                color: "text-purple-600 bg-purple-50",
              },
              {
                icon: Star,
                title: "Smart Recommendations",
                description: "Students receive AI-generated academic improvement recommendations based on their performance.",
                color: "text-yellow-600 bg-yellow-50",
              },
              {
                icon: Shield,
                title: "Promotion Management",
                description: "Automatic promotion for C6 and above; manual discretion for below-average students at end of session.",
                color: "text-red-600 bg-red-50",
              },
              {
                icon: Globe,
                title: "Multi-Tenant Architecture",
                description: "Host multiple schools on one platform. Each school gets its own isolated data environment and login.",
                color: "text-indigo-600 bg-indigo-50",
              },
              {
                icon: Bell,
                title: "Report Cards",
                description: "Generate printable term and session result sheets with class position, grades, and teacher remarks.",
                color: "text-orange-600 bg-orange-50",
              },
              {
                icon: GraduationCap,
                title: "Academic Calendar",
                description: "Manage academic sessions (3 terms per year), track term dates, and maintain historical records.",
                color: "text-teal-600 bg-teal-50",
              },
              {
                icon: CheckCircle2,
                title: "Nigerian Standards",
                description: "Built for JSS 1–SS 3 structure, aligned with NERDC curriculum, and tailored for Nigerian school culture.",
                color: "text-cyan-600 bg-cyan-50",
              },
            ].map((feature) => (
              <div
                key={feature.title}
                className="bg-white rounded-xl p-6 shadow-sm hover:shadow-md transition-shadow border"
              >
                <div className={`inline-flex p-3 rounded-lg ${feature.color} mb-4`}>
                  <feature.icon className="h-6 w-6" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">{feature.title}</h3>
                <p className="text-gray-600 text-sm leading-relaxed">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section id="how-it-works" className="py-24 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900">How It Works</h2>
            <p className="mt-4 text-lg text-gray-600">Get your school up and running in 4 simple steps</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            {[
              { step: "01", title: "Superadmin Creates School", desc: "Platform superadmin onboards your school and creates an admin account." },
              { step: "02", title: "Admin Sets Up School", desc: "School admin creates classes, subjects, teachers, and students." },
              { step: "03", title: "Teachers Grade Students", desc: "Teachers enter scores for each assessment component per subject." },
              { step: "04", title: "Students View Results", desc: "Students log in to see their grades, reports, and get recommendations." },
            ].map((step) => (
              <div key={step.step} className="text-center">
                <div className="w-16 h-16 bg-blue-600 text-white rounded-full flex items-center justify-center text-2xl font-bold mx-auto mb-4">
                  {step.step}
                </div>
                <h3 className="font-semibold text-gray-900 mb-2">{step.title}</h3>
                <p className="text-sm text-gray-600">{step.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-24 bg-blue-600">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <h2 className="text-4xl font-bold text-white mb-4">
            Ready to transform your school?
          </h2>
          <p className="text-blue-100 text-lg mb-8">
            Join hundreds of Nigerian schools that trust EduManage NG for their administration.
          </p>
          <Link href="/login">
            <Button size="lg" className="bg-white text-blue-600 hover:bg-gray-50 gap-2 text-base px-10">
              Get Started Today <ArrowRight className="h-5 w-5" />
            </Button>
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-gray-400 py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <div className="flex items-center gap-2">
              <GraduationCap className="h-6 w-6 text-blue-400" />
              <span className="font-bold text-white">EduManage NG</span>
            </div>
            <div className="flex gap-6 text-sm">
              <a href="#" className="hover:text-white transition-colors">Privacy Policy</a>
              <a href="#" className="hover:text-white transition-colors">Terms of Service</a>
              <a href="#" className="hover:text-white transition-colors">Support</a>
            </div>
            <p className="text-sm">© 2025 EduManage NG. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
