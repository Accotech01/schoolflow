"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Loader2, Save } from "lucide-react";
import { toast } from "sonner";
import { saveBulkGrades } from "@/actions/grades";
import { calculateGrade, getGradeColor, cn } from "@/lib/utils";

interface Student {
  id: string;
  name: string;
  admissionNumber: string;
}

interface GradeData {
  studentId: string;
  test1: string | null;
  test2: string | null;
  assignment: string | null;
  attendance: string | null;
  exam: string | null;
  total: string | null;
  grade: string | null;
  teacherRemark: string | null;
}

interface MaxScores {
  maxTest1: number;
  maxTest2: number;
  maxAssignment: number;
  maxAttendance: number;
  maxExam: number;
}

interface Props {
  students: Student[];
  existingGrades: GradeData[];
  teacherId: string;
  classId: string;
  subjectId: string;
  termId: string;
  sessionId: string;
  schoolId: string;
  maxScores: MaxScores;
}

export function GradeEntryTable({
  students,
  existingGrades,
  teacherId,
  classId,
  subjectId,
  termId,
  sessionId,
  schoolId,
  maxScores,
}: Props) {
  const totalMax =
    maxScores.maxTest1 + maxScores.maxTest2 + maxScores.maxAssignment +
    maxScores.maxAttendance + maxScores.maxExam;

  const [gradeInputs, setGradeInputs] = useState<
    Record<string, { test1: string; test2: string; assignment: string; attendance: string; exam: string; remark: string }>
  >(() => {
    const initial: Record<string, { test1: string; test2: string; assignment: string; attendance: string; exam: string; remark: string }> = {};
    for (const student of students) {
      const existing = existingGrades.find((g) => g.studentId === student.id);
      initial[student.id] = {
        test1: existing?.test1 || "0",
        test2: existing?.test2 || "0",
        assignment: existing?.assignment || "0",
        attendance: existing?.attendance || "0",
        exam: existing?.exam || "0",
        remark: existing?.teacherRemark || "",
      };
    }
    return initial;
  });

  const [loading, setLoading] = useState(false);

  const updateGrade = (studentId: string, field: string, value: string) => {
    setGradeInputs((prev) => ({
      ...prev,
      [studentId]: { ...prev[studentId], [field]: value },
    }));
  };

  const getTotal = (studentId: string) => {
    const g = gradeInputs[studentId];
    if (!g) return 0;
    return (
      parseFloat(g.test1 || "0") +
      parseFloat(g.test2 || "0") +
      parseFloat(g.assignment || "0") +
      parseFloat(g.attendance || "0") +
      parseFloat(g.exam || "0")
    );
  };

  const handleSave = async () => {
    setLoading(true);
    try {
      const gradesData = students.map((student) => {
        const g = gradeInputs[student.id];
        return {
          studentId: student.id,
          teacherId,
          subjectId,
          classId,
          termId,
          sessionId,
          schoolId,
          test1: parseFloat(g.test1 || "0"),
          test2: parseFloat(g.test2 || "0"),
          assignment: parseFloat(g.assignment || "0"),
          attendance: parseFloat(g.attendance || "0"),
          exam: parseFloat(g.exam || "0"),
          teacherRemark: g.remark || undefined,
        };
      });

      await saveBulkGrades(gradesData);
      toast.success("All grades saved successfully!");
    } catch {
      toast.error("Failed to save grades");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      {/* Max Score Header */}
      <div className="flex items-center justify-between text-xs text-muted-foreground bg-gray-50 px-4 py-2 rounded-lg">
        <span>Maximum Scores: Test 1: {maxScores.maxTest1} | Test 2: {maxScores.maxTest2} | Assignment: {maxScores.maxAssignment} | Attendance: {maxScores.maxAttendance} | Exam: {maxScores.maxExam} | Total: {totalMax}</span>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-gray-50 border-b">
              <th className="text-left px-3 py-2 font-medium">Student</th>
              <th className="text-center px-2 py-2 font-medium">Test 1<br/><span className="text-xs font-normal text-muted-foreground">/{maxScores.maxTest1}</span></th>
              <th className="text-center px-2 py-2 font-medium">Test 2<br/><span className="text-xs font-normal text-muted-foreground">/{maxScores.maxTest2}</span></th>
              <th className="text-center px-2 py-2 font-medium">Assign.<br/><span className="text-xs font-normal text-muted-foreground">/{maxScores.maxAssignment}</span></th>
              <th className="text-center px-2 py-2 font-medium">Attend.<br/><span className="text-xs font-normal text-muted-foreground">/{maxScores.maxAttendance}</span></th>
              <th className="text-center px-2 py-2 font-medium">Exam<br/><span className="text-xs font-normal text-muted-foreground">/{maxScores.maxExam}</span></th>
              <th className="text-center px-2 py-2 font-medium">Total</th>
              <th className="text-center px-2 py-2 font-medium">Grade</th>
              <th className="text-left px-3 py-2 font-medium">Remark</th>
            </tr>
          </thead>
          <tbody>
            {students.map((student, i) => {
              const total = getTotal(student.id);
              const normalizedTotal = totalMax > 0 ? (total / totalMax) * 100 : 0;
              const { grade, remark } = calculateGrade(normalizedTotal);
              const g = gradeInputs[student.id];

              return (
                <tr key={student.id} className={`border-b ${i % 2 === 0 ? "bg-white" : "bg-gray-50/50"}`}>
                  <td className="px-3 py-2">
                    <p className="font-medium">{student.name}</p>
                    <p className="text-xs text-muted-foreground">{student.admissionNumber}</p>
                  </td>
                  {(["test1", "test2", "assignment", "attendance", "exam"] as const).map((field) => {
                    const maxField = {
                      test1: maxScores.maxTest1,
                      test2: maxScores.maxTest2,
                      assignment: maxScores.maxAssignment,
                      attendance: maxScores.maxAttendance,
                      exam: maxScores.maxExam,
                    }[field];
                    const val = parseFloat(g?.[field] || "0");
                    const isOver = val > maxField;
                    return (
                      <td key={field} className="px-2 py-2 text-center">
                        <Input
                          type="number"
                          min={0}
                          max={maxField}
                          step={0.5}
                          value={g?.[field] || "0"}
                          onChange={(e) => updateGrade(student.id, field, e.target.value)}
                          className={`w-16 text-center text-sm h-8 ${isOver ? "border-red-400 bg-red-50" : ""}`}
                        />
                      </td>
                    );
                  })}
                  <td className="px-2 py-2 text-center font-bold">
                    {total.toFixed(1)}
                    <br/>
                    <span className="text-xs text-muted-foreground">({normalizedTotal.toFixed(0)}%)</span>
                  </td>
                  <td className="px-2 py-2 text-center">
                    <span className={cn("text-xs font-bold px-1.5 py-0.5 rounded", getGradeColor(grade))}>
                      {grade}
                    </span>
                  </td>
                  <td className="px-3 py-2">
                    <Input
                      value={g?.remark || ""}
                      onChange={(e) => updateGrade(student.id, "remark", e.target.value)}
                      placeholder="Optional remark"
                      className="text-xs h-8 min-w-32"
                    />
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <div className="flex justify-end pt-2">
        <Button onClick={handleSave} disabled={loading} className="gap-2 bg-blue-600 hover:bg-blue-700">
          {loading ? <><Loader2 className="h-4 w-4 animate-spin" />Saving...</> : <><Save className="h-4 w-4" />Save All Grades</>}
        </Button>
      </div>
    </div>
  );
}
