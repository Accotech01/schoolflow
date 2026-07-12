import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function slugify(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, "")
    .replace(/[\s_-]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

// Nigerian WAEC-aligned grading
export function calculateGrade(total: number): { grade: string; remark: string } {
  if (total >= 75) return { grade: "A1", remark: "Excellent" };
  if (total >= 70) return { grade: "B2", remark: "Very Good" };
  if (total >= 65) return { grade: "B3", remark: "Good" };
  if (total >= 60) return { grade: "C4", remark: "Credit" };
  if (total >= 55) return { grade: "C5", remark: "Credit" };
  if (total >= 50) return { grade: "C6", remark: "Credit" };
  if (total >= 45) return { grade: "D7", remark: "Pass" };
  if (total >= 40) return { grade: "E8", remark: "Pass" };
  return { grade: "F9", remark: "Fail" };
}

export function isPromotionEligible(grade: string): boolean {
  return ["A1", "B2", "B3", "C4", "C5", "C6"].includes(grade);
}

// Whether the given day falls within any of the school's declared holidays,
// and which one. Dates are compared at day granularity.
export function findHolidayForDate<T extends { startDate: Date | string; endDate: Date | string }>(
  date: Date | string,
  holidays: T[]
): T | null {
  const day = new Date(date);
  day.setUTCHours(0, 0, 0, 0);

  return (
    holidays.find((h) => {
      const start = new Date(h.startDate);
      start.setUTCHours(0, 0, 0, 0);
      const end = new Date(h.endDate);
      end.setUTCHours(0, 0, 0, 0);
      return day.getTime() >= start.getTime() && day.getTime() <= end.getTime();
    }) || null
  );
}

export function ordinal(n: number): string {
  const rem100 = n % 100;
  if (rem100 >= 11 && rem100 <= 13) return `${n}th`;
  switch (n % 10) {
    case 1: return `${n}st`;
    case 2: return `${n}nd`;
    case 3: return `${n}rd`;
    default: return `${n}th`;
  }
}

export function getGradeColor(grade: string): string {
  if (["A1"].includes(grade)) return "text-emerald-600 bg-emerald-50";
  if (["B2", "B3"].includes(grade)) return "text-blue-600 bg-blue-50";
  if (["C4", "C5", "C6"].includes(grade)) return "text-yellow-600 bg-yellow-50";
  if (["D7", "E8"].includes(grade)) return "text-orange-600 bg-orange-50";
  return "text-red-600 bg-red-50";
}

export function formatDate(date: Date | string | null): string {
  if (!date) return "N/A";
  return new Date(date).toLocaleDateString("en-NG", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

export function isPaymentOverdue(nextPaymentDueDate: Date | string | null): boolean {
  if (!nextPaymentDueDate) return false;
  return new Date(nextPaymentDueDate).getTime() < Date.now();
}

export function generateAdmissionNumber(schoolCode: string, year: number, count: number): string {
  const paddedCount = String(count).padStart(4, "0");
  return `${schoolCode.toUpperCase()}/${year}/${paddedCount}`;
}

export function getAcademicRecommendation(averageScore: number, grade: string): string {
  const recommendations = {
    excellent: [
      "Outstanding performance! Keep up the excellent work and consider joining academic competitions.",
      "Brilliant results! Your dedication is inspiring. Explore advanced learning opportunities.",
      "Exceptional achievement! Challenge yourself with enrichment activities and peer mentoring.",
      "Superb performance! Your consistent effort is paying off. Aim even higher this term.",
    ],
    veryGood: [
      "Great work! You are performing very well. Focus on maintaining this momentum.",
      "Impressive results! A little more effort could push you to the top of your class.",
      "Very good performance! Identify your weakest subjects and give them extra attention.",
      "Excellent progress! Stay consistent and you will achieve even greater results.",
    ],
    good: [
      "Good performance! You are on the right track. Increase your study time for better results.",
      "Well done! Focus on understanding concepts rather than memorizing facts.",
      "Good effort! Consider forming study groups to strengthen areas of weakness.",
      "Solid performance! Regular revision and practice will help you improve further.",
    ],
    credit: [
      "Satisfactory performance. You can do better with more consistent study habits.",
      "You have potential! Create a structured study timetable and stick to it.",
      "Average performance. Seek help from your teachers in subjects you find difficult.",
      "You are making progress. Focus on practising past questions to improve your scores.",
    ],
    pass: [
      "You need to work harder. Attend all classes and participate actively in lessons.",
      "Below average performance. Please seek extra coaching or tutoring in weak subjects.",
      "More effort is required. Review your study habits and eliminate distractions.",
      "You can do better! Talk to your teachers and create a personal improvement plan.",
    ],
    fail: [
      "Urgent improvement needed. Please speak with your class teacher and parents immediately.",
      "This is a wake-up call. Dedicate more time to studying and avoid distractions.",
      "You must improve significantly. Attend extra classes and revise all topics thoroughly.",
      "Immediate action required. Seek help from teachers, parents, and study groups.",
    ],
  };

  let category: keyof typeof recommendations;
  if (averageScore >= 75) category = "excellent";
  else if (averageScore >= 70) category = "veryGood";
  else if (averageScore >= 65) category = "good";
  else if (averageScore >= 50) category = "credit";
  else if (averageScore >= 40) category = "pass";
  else category = "fail";

  const list = recommendations[category];
  return list[Math.floor(Math.random() * list.length)];
}

export function nigerianStates(): string[] {
  return [
    "Abia", "Adamawa", "Akwa Ibom", "Anambra", "Bauchi", "Bayelsa",
    "Benue", "Borno", "Cross River", "Delta", "Ebonyi", "Edo",
    "Ekiti", "Enugu", "FCT - Abuja", "Gombe", "Imo", "Jigawa",
    "Kaduna", "Kano", "Katsina", "Kebbi", "Kogi", "Kwara",
    "Lagos", "Nasarawa", "Niger", "Ogun", "Ondo", "Osun",
    "Oyo", "Plateau", "Rivers", "Sokoto", "Taraba", "Yobe", "Zamfara",
  ];
}
