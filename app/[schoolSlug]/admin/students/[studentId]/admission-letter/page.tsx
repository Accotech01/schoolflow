import { auth } from "@/auth";
import { db } from "@/lib/db";
import { students, schools, studentEnrollments } from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";
import { notFound } from "next/navigation";
import { formatDate } from "@/lib/utils";
import { PrintLetterButton } from "./print-letter-button";

interface Props {
  params: Promise<{ schoolSlug: string; studentId: string }>;
}

export default async function AdmissionLetterPage({ params }: Props) {
  const { studentId } = await params;
  const session = await auth();
  const schoolId = session!.user.schoolId!;

  const student = await db.query.students.findFirst({
    where: eq(students.id, studentId),
  });

  if (!student || student.schoolId !== schoolId) notFound();

  const school = await db.query.schools.findFirst({
    where: eq(schools.id, schoolId),
  });

  if (!school) notFound();

  const enrollment = await db.query.studentEnrollments.findFirst({
    where: and(eq(studentEnrollments.studentId, studentId), eq(studentEnrollments.isActive, true)),
    with: { class: true, session: true },
  });

  const today = formatDate(new Date());

  return (
    <div className="min-h-screen bg-gray-100 py-8 px-4">
      <div className="max-w-3xl mx-auto mb-4 flex justify-end no-print">
        <PrintLetterButton />
      </div>

      <div className="max-w-3xl mx-auto bg-white shadow-lg rounded-lg p-10 print:shadow-none print:rounded-none">
        {/* Letterhead */}
        <div className="flex flex-col items-center text-center border-b pb-6 mb-8">
          {school.logoUrl && (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={school.logoUrl} alt={school.name} className="h-16 w-auto mb-2" />
          )}
          <h1 className="text-2xl font-bold uppercase tracking-wide">{school.name}</h1>
          {school.motto && (
            <p className="text-sm italic text-muted-foreground">&ldquo;{school.motto}&rdquo;</p>
          )}
          <p className="text-sm text-muted-foreground mt-1">
            {school.address}, {school.city}, {school.state}
          </p>
          <p className="text-sm text-muted-foreground">
            {school.phone} · {school.email}
          </p>
        </div>

        <p className="text-sm text-right mb-8">{today}</p>

        <h2 className="text-lg font-bold text-center underline mb-8">LETTER OF ADMISSION</h2>

        <div className="space-y-4 text-sm leading-relaxed text-gray-800">
          <p>Dear {student.name} / Parent / Guardian,</p>

          <p>
            We are pleased to inform you that <strong>{student.name}</strong> has been offered
            admission into <strong>{school.name}</strong>
            {enrollment ? (
              <>
                {" "}
                as a student of <strong>{enrollment.class.name}</strong> for the{" "}
                <strong>{enrollment.session.name}</strong> academic session.
              </>
            ) : (
              "."
            )}
          </p>

          <p>
            The admission number assigned is{" "}
            <strong>{student.admissionNumber}</strong>. This number should be quoted in all
            correspondence with the school.
          </p>

          <p>
            We look forward to a fruitful partnership in the pursuit of academic and moral
            excellence. Kindly ensure resumption on the date communicated by the school
            administration, along with all required documents and materials.
          </p>

          <p>Congratulations on this admission.</p>
        </div>

        <div className="mt-16 text-sm">
          <p className="border-t border-gray-400 w-48 pt-1">School Administrator</p>
          <p className="text-muted-foreground">{school.name}</p>
        </div>
      </div>
    </div>
  );
}
