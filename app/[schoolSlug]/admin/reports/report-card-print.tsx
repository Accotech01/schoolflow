"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { getGradeColor, cn } from "@/lib/utils";
import { Printer } from "lucide-react";

interface Grade {
  id: string;
  test1: string | null;
  test2: string | null;
  assignment: string | null;
  attendance: string | null;
  exam: string | null;
  total: string | null;
  grade: string | null;
  remark: string | null;
  teacherRemark: string | null;
  subject: { name: string; code: string };
  teacher: { name: string };
}

interface Props {
  student: { name: string; admissionNumber: string; gender: string | null };
  grades: Grade[];
  school: { name: string; address: string; motto?: string | null; logoUrl?: string | null };
  session: string;
  term: string;
  className: string;
}

export function ReportCardPrint({ student, grades, school, session, term, className }: Props) {
  const totalScore = grades.reduce((sum, g) => sum + parseFloat(g.total || "0"), 0);
  const averageScore = grades.length > 0 ? (totalScore / grades.length).toFixed(1) : "0";
  const passedSubjects = grades.filter((g) => parseFloat(g.total || "0") >= 50).length;

  return (
    <Card>
      <CardHeader className="border-b pb-6">
        <div className="flex flex-col items-center text-center mb-4 space-y-2">
          {school.logoUrl && (
            <img src={school.logoUrl} alt={school.name} className="h-16 w-auto" />
          )}
          <div>
            <h1 className="font-bold text-lg">{school.name}</h1>
            {school.motto && (
              <p className="text-xs text-muted-foreground italic">&quot;{school.motto}&quot;</p>
            )}
            <p className="text-xs text-muted-foreground">{school.address}</p>
          </div>
        </div>
        <div className="flex items-center justify-between">
          <div>
            <h2 className="font-bold text-lg">Report Card</h2>
            <p className="text-sm text-muted-foreground">{session} · {term} Term</p>
          </div>
          <Button
            size="sm"
            variant="outline"
            className="gap-2 no-print"
            onClick={() => window.print()}
          >
            <Printer className="h-4 w-4" /> Print
          </Button>
        </div>
      </CardHeader>
      <CardContent className="pt-4">
        {/* School Header */}
        <div className="text-center mb-6 border-b pb-4">
          <h1 className="text-xl font-bold uppercase">{school.name}</h1>
          <p className="text-sm text-muted-foreground">{school.address}</p>
          {school.motto && <p className="text-xs italic text-blue-600 mt-1">&ldquo;{school.motto}&rdquo;</p>}
          <h2 className="text-lg font-semibold mt-2">STUDENT REPORT CARD</h2>
          <p className="text-sm">{session} Academic Session — {term} Term</p>
        </div>

        {/* Student Info */}
        <div className="grid grid-cols-2 gap-4 mb-4 text-sm border rounded-lg p-4 bg-gray-50">
          <div><span className="font-medium">Name:</span> {student.name}</div>
          <div><span className="font-medium">Admission No.:</span> {student.admissionNumber}</div>
          <div><span className="font-medium">Class:</span> {className}</div>
          <div><span className="font-medium">Gender:</span> {student.gender || "—"}</div>
        </div>

        {/* Grades Table */}
        <div className="overflow-x-auto mb-4">
          <table className="w-full text-sm border-collapse">
            <thead>
              <tr className="bg-blue-600 text-white">
                <th className="border border-blue-500 px-3 py-2 text-left">Subject</th>
                <th className="border border-blue-500 px-2 py-2 text-center">Test 1</th>
                <th className="border border-blue-500 px-2 py-2 text-center">Test 2</th>
                <th className="border border-blue-500 px-2 py-2 text-center">Assign.</th>
                <th className="border border-blue-500 px-2 py-2 text-center">Attend.</th>
                <th className="border border-blue-500 px-2 py-2 text-center">Exam</th>
                <th className="border border-blue-500 px-2 py-2 text-center">Total</th>
                <th className="border border-blue-500 px-2 py-2 text-center">Grade</th>
                <th className="border border-blue-500 px-3 py-2 text-center">Remark</th>
              </tr>
            </thead>
            <tbody>
              {grades.length === 0 ? (
                <tr>
                  <td colSpan={9} className="text-center py-6 text-muted-foreground border">
                    No grades recorded yet
                  </td>
                </tr>
              ) : (
                grades.map((g, i) => (
                  <tr key={g.id} className={i % 2 === 0 ? "bg-white" : "bg-gray-50"}>
                    <td className="border px-3 py-1.5 font-medium">{g.subject.name}</td>
                    <td className="border px-2 py-1.5 text-center">{g.test1 || 0}</td>
                    <td className="border px-2 py-1.5 text-center">{g.test2 || 0}</td>
                    <td className="border px-2 py-1.5 text-center">{g.assignment || 0}</td>
                    <td className="border px-2 py-1.5 text-center">{g.attendance || 0}</td>
                    <td className="border px-2 py-1.5 text-center">{g.exam || 0}</td>
                    <td className="border px-2 py-1.5 text-center font-bold">{g.total || 0}</td>
                    <td className="border px-2 py-1.5 text-center">
                      {g.grade && (
                        <span className={cn("text-xs font-bold px-1.5 py-0.5 rounded", getGradeColor(g.grade))}>
                          {g.grade}
                        </span>
                      )}
                    </td>
                    <td className="border px-3 py-1.5 text-center text-xs">{g.remark || "—"}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Summary */}
        <div className="grid grid-cols-3 gap-4 mb-4 text-sm">
          <div className="bg-blue-50 rounded-lg p-3 text-center">
            <p className="text-2xl font-bold text-blue-600">{averageScore}%</p>
            <p className="text-xs text-blue-700">Average Score</p>
          </div>
          <div className="bg-green-50 rounded-lg p-3 text-center">
            <p className="text-2xl font-bold text-green-600">{passedSubjects}/{grades.length}</p>
            <p className="text-xs text-green-700">Subjects Passed</p>
          </div>
          <div className="bg-purple-50 rounded-lg p-3 text-center">
            <p className="text-2xl font-bold text-purple-600">{grades.length}</p>
            <p className="text-xs text-purple-700">Total Subjects</p>
          </div>
        </div>

        {/* Grading Key */}
        <div className="border rounded-lg p-3 bg-gray-50">
          <p className="text-xs font-semibold mb-2">Grading Key (WAEC Standard)</p>
          <div className="flex flex-wrap gap-2">
            {[
              { grade: "A1", range: "75-100", remark: "Excellent" },
              { grade: "B2", range: "70-74", remark: "Very Good" },
              { grade: "B3", range: "65-69", remark: "Good" },
              { grade: "C4", range: "60-64", remark: "Credit" },
              { grade: "C5", range: "55-59", remark: "Credit" },
              { grade: "C6", range: "50-54", remark: "Credit" },
              { grade: "D7", range: "45-49", remark: "Pass" },
              { grade: "E8", range: "40-44", remark: "Pass" },
              { grade: "F9", range: "0-39", remark: "Fail" },
            ].map((g) => (
              <div key={g.grade} className="flex items-center gap-1 text-xs">
                <span className={cn("font-bold px-1.5 py-0.5 rounded", getGradeColor(g.grade))}>{g.grade}</span>
                <span className="text-gray-500">{g.range} — {g.remark}</span>
              </div>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
