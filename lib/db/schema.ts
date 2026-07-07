import {
  pgTable,
  text,
  timestamp,
  uuid,
  boolean,
  integer,
  decimal,
  pgEnum,
  uniqueIndex,
  index,
} from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";

// ─── Enums ────────────────────────────────────────────────────────────────────
export const genderEnum = pgEnum("gender", ["male", "female", "other"]);
export const termEnum = pgEnum("term_name", ["First", "Second", "Third"]);
export const sessionStatusEnum = pgEnum("session_status", [
  "active",
  "completed",
]);
export const termStatusEnum = pgEnum("term_status", [
  "upcoming",
  "active",
  "completed",
]);
export const promotionStatusEnum = pgEnum("promotion_status", [
  "auto_promoted",
  "manual_promoted",
  "repeated",
  "pending",
]);
export const subscriptionStatusEnum = pgEnum("subscription_status", [
  "active",
  "inactive",
  "trial",
]);
export const userStatusEnum = pgEnum("user_status", ["active", "inactive"]);
export const announcementAudienceEnum = pgEnum("announcement_audience", [
  "students",
  "teachers",
  "both",
]);
export const attendanceStatusEnum = pgEnum("attendance_status", [
  "present",
  "absent",
  "late",
]);
export const complaintStatusEnum = pgEnum("complaint_status", [
  "open",
  "resolved",
]);

// ─── Superadmins ─────────────────────────────────────────────────────────────
export const superadmins = pgTable("superadmins", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
  passwordHash: text("password_hash").notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

// ─── Schools ─────────────────────────────────────────────────────────────────
export const schools = pgTable(
  "schools",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    name: text("name").notNull(),
    slug: text("slug").notNull().unique(),
    address: text("address").notNull(),
    city: text("city").notNull(),
    state: text("state").notNull(),
    phone: text("phone").notNull(),
    email: text("email").notNull(),
    logoUrl: text("logo_url"),
    motto: text("motto"),
    schoolType: text("school_type").notNull().default("private"), // private, public
    subscriptionStatus: subscriptionStatusEnum("subscription_status")
      .notNull()
      .default("trial"),
    maxStudents: integer("max_students").notNull().default(500),
    // Per-student billing rate the superadmin sets for this school; the
    // school's amount due is this multiplied by its active student count.
    amountPerStudent: decimal("amount_per_student", { precision: 10, scale: 2 })
      .notNull()
      .default("0"),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at").notNull().defaultNow(),
  },
  (table) => [uniqueIndex("schools_slug_idx").on(table.slug)]
);

// ─── School Admins ────────────────────────────────────────────────────────────
export const schoolAdmins = pgTable("school_admins", {
  id: uuid("id").primaryKey().defaultRandom(),
  schoolId: uuid("school_id")
    .notNull()
    .references(() => schools.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
  passwordHash: text("password_hash").notNull(),
  phone: text("phone"),
  status: userStatusEnum("status").notNull().default("active"),
  lastPaymentDate: timestamp("last_payment_date"),
  nextPaymentDueDate: timestamp("next_payment_due_date"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

// ─── Announcements ────────────────────────────────────────────────────────────
export const announcements = pgTable(
  "announcements",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    schoolId: uuid("school_id")
      .notNull()
      .references(() => schools.id, { onDelete: "cascade" }),
    // Set only for a teacher's class-specific announcement; null for
    // school-wide announcements sent by a school admin.
    classId: uuid("class_id").references(() => classes.id, { onDelete: "cascade" }),
    title: text("title").notNull(),
    message: text("message").notNull(),
    audience: announcementAudienceEnum("audience").notNull().default("both"),
    // "school_admin" or "teacher" — createdBy is a plain uuid (no FK) since it
    // may point into either the school_admins or teachers table.
    createdByRole: text("created_by_role").notNull().default("school_admin"),
    createdBy: uuid("created_by"),
    createdAt: timestamp("created_at").notNull().defaultNow(),
  },
  (table) => [index("announcements_school_idx").on(table.schoolId)]
);

// Per-reader read receipts. readerId is a plain uuid (no FK) since it may
// point into either the students or teachers table.
export const announcementReads = pgTable(
  "announcement_reads",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    announcementId: uuid("announcement_id")
      .notNull()
      .references(() => announcements.id, { onDelete: "cascade" }),
    readerId: uuid("reader_id").notNull(),
    readAt: timestamp("read_at").notNull().defaultNow(),
  },
  (table) => [
    uniqueIndex("announcement_reads_unique_idx").on(table.announcementId, table.readerId),
    index("announcement_reads_reader_idx").on(table.readerId),
  ]
);

// ─── Academic Sessions ────────────────────────────────────────────────────────
export const academicSessions = pgTable(
  "academic_sessions",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    schoolId: uuid("school_id")
      .notNull()
      .references(() => schools.id, { onDelete: "cascade" }),
    name: text("name").notNull(), // e.g. "2024/2025"
    status: sessionStatusEnum("status").notNull().default("active"),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at").notNull().defaultNow(),
  },
  (table) => [index("sessions_school_idx").on(table.schoolId)]
);

// ─── Terms ────────────────────────────────────────────────────────────────────
export const terms = pgTable(
  "terms",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    sessionId: uuid("session_id")
      .notNull()
      .references(() => academicSessions.id, { onDelete: "cascade" }),
    schoolId: uuid("school_id")
      .notNull()
      .references(() => schools.id, { onDelete: "cascade" }),
    name: termEnum("name").notNull(),
    status: termStatusEnum("status").notNull().default("active"),
    startDate: timestamp("start_date"),
    endDate: timestamp("end_date"),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at").notNull().defaultNow(),
  },
  (table) => [index("terms_session_idx").on(table.sessionId)]
);

// ─── Classes ──────────────────────────────────────────────────────────────────
export const classes = pgTable(
  "classes",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    schoolId: uuid("school_id")
      .notNull()
      .references(() => schools.id, { onDelete: "cascade" }),
    name: text("name").notNull(), // e.g. "JSS 1", "JSS 2", "SS 1"
    level: integer("level").notNull(), // 1-6 for JS 1-3 and SS 1-3
    description: text("description"),
    // Central/homeroom teacher for this class, assigned by the school admin.
    classTeacherId: uuid("class_teacher_id").references(() => teachers.id, {
      onDelete: "set null",
    }),
    // Max score the class teacher finalizes end-of-term attendance against
    // (e.g. 10 -> a student present 90% of marked days scores 9).
    attendanceMaxScore: decimal("attendance_max_score", { precision: 5, scale: 2 })
      .notNull()
      .default("10"),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at").notNull().defaultNow(),
  },
  (table) => [index("classes_school_idx").on(table.schoolId)]
);

// ─── Subjects ─────────────────────────────────────────────────────────────────
export const subjects = pgTable(
  "subjects",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    schoolId: uuid("school_id")
      .notNull()
      .references(() => schools.id, { onDelete: "cascade" }),
    name: text("name").notNull(),
    code: text("code").notNull(), // e.g. "MTH", "ENG"
    description: text("description"),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at").notNull().defaultNow(),
  },
  (table) => [index("subjects_school_idx").on(table.schoolId)]
);

// ─── Teachers ─────────────────────────────────────────────────────────────────
export const teachers = pgTable(
  "teachers",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    schoolId: uuid("school_id")
      .notNull()
      .references(() => schools.id, { onDelete: "cascade" }),
    name: text("name").notNull(),
    email: text("email").notNull().unique(),
    passwordHash: text("password_hash").notNull(),
    phone: text("phone"),
    qualification: text("qualification"),
    employeeId: text("employee_id"),
    gender: genderEnum("gender"),
    status: userStatusEnum("status").notNull().default("active"),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at").notNull().defaultNow(),
  },
  (table) => [index("teachers_school_idx").on(table.schoolId)]
);

// ─── Students ─────────────────────────────────────────────────────────────────
export const students = pgTable(
  "students",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    schoolId: uuid("school_id")
      .notNull()
      .references(() => schools.id, { onDelete: "cascade" }),
    name: text("name").notNull(),
    email: text("email").notNull().unique(),
    passwordHash: text("password_hash").notNull(),
    admissionNumber: text("admission_number").notNull(),
    dateOfBirth: timestamp("date_of_birth"),
    gender: genderEnum("gender"),
    address: text("address"),
    guardianName: text("guardian_name"),
    guardianPhone: text("guardian_phone"),
    guardianEmail: text("guardian_email"),
    guardianRelationship: text("guardian_relationship"),
    bloodGroup: text("blood_group"),
    stateOfOrigin: text("state_of_origin"),
    religion: text("religion"),
    status: userStatusEnum("status").notNull().default("active"),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at").notNull().defaultNow(),
  },
  (table) => [
    index("students_school_idx").on(table.schoolId),
    index("students_admission_idx").on(table.admissionNumber),
  ]
);

// ─── Parents ──────────────────────────────────────────────────────────────────
export const parents = pgTable(
  "parents",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    schoolId: uuid("school_id")
      .notNull()
      .references(() => schools.id, { onDelete: "cascade" }),
    name: text("name").notNull(),
    email: text("email").notNull().unique(),
    passwordHash: text("password_hash").notNull(),
    phone: text("phone"),
    status: userStatusEnum("status").notNull().default("active"),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at").notNull().defaultNow(),
  },
  (table) => [index("parents_school_idx").on(table.schoolId)]
);

// Links a parent account to each of their children — a parent with multiple
// kids at the same school reuses one login linked to every child.
export const parentStudents = pgTable(
  "parent_students",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    parentId: uuid("parent_id")
      .notNull()
      .references(() => parents.id, { onDelete: "cascade" }),
    studentId: uuid("student_id")
      .notNull()
      .references(() => students.id, { onDelete: "cascade" }),
    createdAt: timestamp("created_at").notNull().defaultNow(),
  },
  (table) => [
    uniqueIndex("parent_students_unique_idx").on(table.parentId, table.studentId),
    index("parent_students_parent_idx").on(table.parentId),
    index("parent_students_student_idx").on(table.studentId),
  ]
);

// ─── Teacher Class Subject Assignments ───────────────────────────────────────
export const teacherAssignments = pgTable(
  "teacher_assignments",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    teacherId: uuid("teacher_id")
      .notNull()
      .references(() => teachers.id, { onDelete: "cascade" }),
    classId: uuid("class_id")
      .notNull()
      .references(() => classes.id, { onDelete: "cascade" }),
    subjectId: uuid("subject_id")
      .notNull()
      .references(() => subjects.id, { onDelete: "cascade" }),
    sessionId: uuid("session_id")
      .notNull()
      .references(() => academicSessions.id, { onDelete: "cascade" }),
    schoolId: uuid("school_id")
      .notNull()
      .references(() => schools.id, { onDelete: "cascade" }),
    createdAt: timestamp("created_at").notNull().defaultNow(),
  },
  (table) => [
    index("ta_teacher_idx").on(table.teacherId),
    index("ta_class_idx").on(table.classId),
    index("ta_school_idx").on(table.schoolId),
    uniqueIndex("ta_unique_idx").on(
      table.teacherId,
      table.classId,
      table.subjectId,
      table.sessionId
    ),
  ]
);

// ─── Student Class Enrollments ────────────────────────────────────────────────
export const studentSubjectAssignments = pgTable(
  "student_subject_assignments",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    studentId: uuid("student_id")
      .notNull()
      .references(() => students.id, { onDelete: "cascade" }),
    classId: uuid("class_id")
      .notNull()
      .references(() => classes.id, { onDelete: "cascade" }),
    subjectId: uuid("subject_id")
      .notNull()
      .references(() => subjects.id, { onDelete: "cascade" }),
    sessionId: uuid("session_id")
      .notNull()
      .references(() => academicSessions.id, { onDelete: "cascade" }),
    schoolId: uuid("school_id")
      .notNull()
      .references(() => schools.id, { onDelete: "cascade" }),
    isActive: boolean("is_active").notNull().default(true),
    createdAt: timestamp("created_at").notNull().defaultNow(),
  },
  (table) => [
    index("ssa_student_idx").on(table.studentId),
    index("ssa_class_idx").on(table.classId),
    uniqueIndex("ssa_unique_idx").on(
      table.studentId,
      table.subjectId,
      table.sessionId
    ),
  ]
);

export const studentEnrollments = pgTable(
  "student_enrollments",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    studentId: uuid("student_id")
      .notNull()
      .references(() => students.id, { onDelete: "cascade" }),
    classId: uuid("class_id")
      .notNull()
      .references(() => classes.id, { onDelete: "cascade" }),
    sessionId: uuid("session_id")
      .notNull()
      .references(() => academicSessions.id, { onDelete: "cascade" }),
    schoolId: uuid("school_id")
      .notNull()
      .references(() => schools.id, { onDelete: "cascade" }),
    isActive: boolean("is_active").notNull().default(true),
    createdAt: timestamp("created_at").notNull().defaultNow(),
  },
  (table) => [
    index("se_student_idx").on(table.studentId),
    index("se_class_idx").on(table.classId),
    uniqueIndex("se_unique_idx").on(
      table.studentId,
      table.classId,
      table.sessionId
    ),
  ]
);

// ─── Grade Settings (per teacher, subject, class, term) ───────────────────────
export const gradeSettings = pgTable(
  "grade_settings",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    teacherId: uuid("teacher_id")
      .notNull()
      .references(() => teachers.id, { onDelete: "cascade" }),
    classId: uuid("class_id")
      .notNull()
      .references(() => classes.id, { onDelete: "cascade" }),
    subjectId: uuid("subject_id")
      .notNull()
      .references(() => subjects.id, { onDelete: "cascade" }),
    termId: uuid("term_id")
      .notNull()
      .references(() => terms.id, { onDelete: "cascade" }),
    schoolId: uuid("school_id")
      .notNull()
      .references(() => schools.id, { onDelete: "cascade" }),
    maxTest1: decimal("max_test1", { precision: 5, scale: 2 })
      .notNull()
      .default("20"),
    maxTest2: decimal("max_test2", { precision: 5, scale: 2 })
      .notNull()
      .default("20"),
    maxAssignment: decimal("max_assignment", { precision: 5, scale: 2 })
      .notNull()
      .default("10"),
    maxAttendance: decimal("max_attendance", { precision: 5, scale: 2 })
      .notNull()
      .default("10"),
    maxExam: decimal("max_exam", { precision: 5, scale: 2 })
      .notNull()
      .default("60"),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at").notNull().defaultNow(),
  },
  (table) => [
    uniqueIndex("gs_unique_idx").on(
      table.teacherId,
      table.classId,
      table.subjectId,
      table.termId
    ),
  ]
);

// ─── Grades ───────────────────────────────────────────────────────────────────
export const grades = pgTable(
  "grades",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    studentId: uuid("student_id")
      .notNull()
      .references(() => students.id, { onDelete: "cascade" }),
    teacherId: uuid("teacher_id")
      .notNull()
      .references(() => teachers.id, { onDelete: "cascade" }),
    subjectId: uuid("subject_id")
      .notNull()
      .references(() => subjects.id, { onDelete: "cascade" }),
    classId: uuid("class_id")
      .notNull()
      .references(() => classes.id, { onDelete: "cascade" }),
    termId: uuid("term_id")
      .notNull()
      .references(() => terms.id, { onDelete: "cascade" }),
    sessionId: uuid("session_id")
      .notNull()
      .references(() => academicSessions.id, { onDelete: "cascade" }),
    schoolId: uuid("school_id")
      .notNull()
      .references(() => schools.id, { onDelete: "cascade" }),
    test1: decimal("test1", { precision: 5, scale: 2 }).default("0"),
    test2: decimal("test2", { precision: 5, scale: 2 }).default("0"),
    assignment: decimal("assignment", { precision: 5, scale: 2 }).default("0"),
    attendance: decimal("attendance", { precision: 5, scale: 2 }).default("0"),
    exam: decimal("exam", { precision: 5, scale: 2 }).default("0"),
    total: decimal("total", { precision: 5, scale: 2 }).default("0"),
    grade: text("grade"), // A1, B2, B3, C4, C5, C6, D7, E8, F9
    remark: text("remark"), // Excellent, Very Good, etc.
    position: integer("position"),
    teacherRemark: text("teacher_remark"),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at").notNull().defaultNow(),
  },
  (table) => [
    index("grades_student_idx").on(table.studentId),
    index("grades_term_idx").on(table.termId),
    index("grades_school_idx").on(table.schoolId),
    uniqueIndex("grades_unique_idx").on(
      table.studentId,
      table.subjectId,
      table.termId
    ),
  ]
);

// ─── Lesson Notes ─────────────────────────────────────────────────────────────
export const lessonNotes = pgTable(
  "lesson_notes",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    teacherId: uuid("teacher_id")
      .notNull()
      .references(() => teachers.id, { onDelete: "cascade" }),
    classId: uuid("class_id")
      .notNull()
      .references(() => classes.id, { onDelete: "cascade" }),
    subjectId: uuid("subject_id")
      .notNull()
      .references(() => subjects.id, { onDelete: "cascade" }),
    termId: uuid("term_id")
      .notNull()
      .references(() => terms.id, { onDelete: "cascade" }),
    schoolId: uuid("school_id")
      .notNull()
      .references(() => schools.id, { onDelete: "cascade" }),
    title: text("title").notNull(),
    content: text("content").notNull(),
    week: integer("week"),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at").notNull().defaultNow(),
  },
  (table) => [index("ln_teacher_idx").on(table.teacherId)]
);

// ─── Learning Resources ───────────────────────────────────────────────────────
export const learningResources = pgTable(
  "learning_resources",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    teacherId: uuid("teacher_id")
      .notNull()
      .references(() => teachers.id, { onDelete: "cascade" }),
    classId: uuid("class_id")
      .notNull()
      .references(() => classes.id, { onDelete: "cascade" }),
    subjectId: uuid("subject_id")
      .notNull()
      .references(() => subjects.id, { onDelete: "cascade" }),
    termId: uuid("term_id")
      .notNull()
      .references(() => terms.id, { onDelete: "cascade" }),
    schoolId: uuid("school_id")
      .notNull()
      .references(() => schools.id, { onDelete: "cascade" }),
    title: text("title").notNull(),
    url: text("url").notNull(),
    description: text("description"),
    resourceType: text("resource_type").default("link"), // link, video, document, pdf
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at").notNull().defaultNow(),
  },
  (table) => [index("lr_teacher_idx").on(table.teacherId)]
);

// ─── Promotions ───────────────────────────────────────────────────────────────
export const promotions = pgTable(
  "promotions",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    studentId: uuid("student_id")
      .notNull()
      .references(() => students.id, { onDelete: "cascade" }),
    fromClassId: uuid("from_class_id")
      .notNull()
      .references(() => classes.id, { onDelete: "cascade" }),
    toClassId: uuid("to_class_id").references(() => classes.id, {
      onDelete: "set null",
    }),
    sessionId: uuid("session_id")
      .notNull()
      .references(() => academicSessions.id, { onDelete: "cascade" }),
    schoolId: uuid("school_id")
      .notNull()
      .references(() => schools.id, { onDelete: "cascade" }),
    status: promotionStatusEnum("status").notNull().default("pending"),
    averageScore: decimal("average_score", { precision: 5, scale: 2 }),
    averageGrade: text("average_grade"),
    adminNote: text("admin_note"),
    promotedBy: uuid("promoted_by"),
    promotedAt: timestamp("promoted_at"),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at").notNull().defaultNow(),
  },
  (table) => [
    index("promotions_student_idx").on(table.studentId),
    index("promotions_school_idx").on(table.schoolId),
    uniqueIndex("promotions_unique_idx").on(table.studentId, table.sessionId),
  ]
);

// ─── Attendance ───────────────────────────────────────────────────────────────
export const attendanceRecords = pgTable(
  "attendance_records",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    studentId: uuid("student_id")
      .notNull()
      .references(() => students.id, { onDelete: "cascade" }),
    classId: uuid("class_id")
      .notNull()
      .references(() => classes.id, { onDelete: "cascade" }),
    termId: uuid("term_id")
      .notNull()
      .references(() => terms.id, { onDelete: "cascade" }),
    schoolId: uuid("school_id")
      .notNull()
      .references(() => schools.id, { onDelete: "cascade" }),
    date: timestamp("date").notNull(),
    status: attendanceStatusEnum("status").notNull().default("present"),
    markedBy: uuid("marked_by"), // teachers.id, no FK (kept plain for consistency)
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at").notNull().defaultNow(),
  },
  (table) => [
    uniqueIndex("attendance_unique_idx").on(table.studentId, table.termId, table.date),
    index("attendance_class_idx").on(table.classId),
    index("attendance_term_idx").on(table.termId),
  ]
);

// ─── Platform Messages (superadmin → school admins) ───────────────────────────
export const platformMessages = pgTable(
  "platform_messages",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    // Null = broadcast announcement to every school admin; set = a direct
    // message to one specific school admin.
    toSchoolAdminId: uuid("to_school_admin_id").references(() => schoolAdmins.id, {
      onDelete: "cascade",
    }),
    title: text("title").notNull(),
    message: text("message").notNull(),
    createdAt: timestamp("created_at").notNull().defaultNow(),
  },
  (table) => [index("platform_messages_recipient_idx").on(table.toSchoolAdminId)]
);

export const platformMessageReads = pgTable(
  "platform_message_reads",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    messageId: uuid("message_id")
      .notNull()
      .references(() => platformMessages.id, { onDelete: "cascade" }),
    readerId: uuid("reader_id").notNull(),
    readAt: timestamp("read_at").notNull().defaultNow(),
  },
  (table) => [
    uniqueIndex("platform_message_reads_unique_idx").on(table.messageId, table.readerId),
    index("platform_message_reads_reader_idx").on(table.readerId),
  ]
);

// ─── Complaints & Suggestions (parent → school admin) ─────────────────────────
export const complaints = pgTable(
  "complaints",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    schoolId: uuid("school_id")
      .notNull()
      .references(() => schools.id, { onDelete: "cascade" }),
    parentId: uuid("parent_id")
      .notNull()
      .references(() => parents.id, { onDelete: "cascade" }),
    studentId: uuid("student_id").references(() => students.id, { onDelete: "set null" }),
    subject: text("subject").notNull(),
    message: text("message").notNull(),
    status: complaintStatusEnum("status").notNull().default("open"),
    response: text("response"),
    respondedAt: timestamp("responded_at"),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at").notNull().defaultNow(),
  },
  (table) => [
    index("complaints_school_idx").on(table.schoolId),
    index("complaints_parent_idx").on(table.parentId),
  ]
);

// ─── Relations ────────────────────────────────────────────────────────────────
export const schoolsRelations = relations(schools, ({ many }) => ({
  admins: many(schoolAdmins),
  sessions: many(academicSessions),
  classes: many(classes),
  subjects: many(subjects),
  teachers: many(teachers),
  students: many(students),
  parents: many(parents),
  promotions: many(promotions),
  announcements: many(announcements),
  complaints: many(complaints),
}));

export const schoolAdminsRelations = relations(schoolAdmins, ({ one, many }) => ({
  school: one(schools, {
    fields: [schoolAdmins.schoolId],
    references: [schools.id],
  }),
  receivedMessages: many(platformMessages),
}));

export const parentsRelations = relations(parents, ({ one, many }) => ({
  school: one(schools, {
    fields: [parents.schoolId],
    references: [schools.id],
  }),
  childLinks: many(parentStudents),
  complaints: many(complaints),
}));

export const parentStudentsRelations = relations(parentStudents, ({ one }) => ({
  parent: one(parents, {
    fields: [parentStudents.parentId],
    references: [parents.id],
  }),
  student: one(students, {
    fields: [parentStudents.studentId],
    references: [students.id],
  }),
}));

export const platformMessagesRelations = relations(platformMessages, ({ one, many }) => ({
  toSchoolAdmin: one(schoolAdmins, {
    fields: [platformMessages.toSchoolAdminId],
    references: [schoolAdmins.id],
  }),
  reads: many(platformMessageReads),
}));

export const platformMessageReadsRelations = relations(platformMessageReads, ({ one }) => ({
  message: one(platformMessages, {
    fields: [platformMessageReads.messageId],
    references: [platformMessages.id],
  }),
}));

export const complaintsRelations = relations(complaints, ({ one }) => ({
  school: one(schools, {
    fields: [complaints.schoolId],
    references: [schools.id],
  }),
  parent: one(parents, {
    fields: [complaints.parentId],
    references: [parents.id],
  }),
  student: one(students, {
    fields: [complaints.studentId],
    references: [students.id],
  }),
}));

export const announcementsRelations = relations(announcements, ({ one, many }) => ({
  school: one(schools, {
    fields: [announcements.schoolId],
    references: [schools.id],
  }),
  class: one(classes, {
    fields: [announcements.classId],
    references: [classes.id],
  }),
  reads: many(announcementReads),
}));

export const announcementReadsRelations = relations(announcementReads, ({ one }) => ({
  announcement: one(announcements, {
    fields: [announcementReads.announcementId],
    references: [announcements.id],
  }),
}));

export const academicSessionsRelations = relations(
  academicSessions,
  ({ one, many }) => ({
    school: one(schools, {
      fields: [academicSessions.schoolId],
      references: [schools.id],
    }),
    terms: many(terms),
    teacherAssignments: many(teacherAssignments),
    studentEnrollments: many(studentEnrollments),
    promotions: many(promotions),
  })
);

export const termsRelations = relations(terms, ({ one, many }) => ({
  session: one(academicSessions, {
    fields: [terms.sessionId],
    references: [academicSessions.id],
  }),
  school: one(schools, {
    fields: [terms.schoolId],
    references: [schools.id],
  }),
  grades: many(grades),
  gradeSettings: many(gradeSettings),
  lessonNotes: many(lessonNotes),
  learningResources: many(learningResources),
}));

export const classesRelations = relations(classes, ({ one, many }) => ({
  school: one(schools, {
    fields: [classes.schoolId],
    references: [schools.id],
  }),
  classTeacher: one(teachers, {
    fields: [classes.classTeacherId],
    references: [teachers.id],
  }),
  teacherAssignments: many(teacherAssignments),
  studentEnrollments: many(studentEnrollments),
  studentSubjectAssignments: many(studentSubjectAssignments),
  grades: many(grades),
  attendanceRecords: many(attendanceRecords),
}));

export const attendanceRecordsRelations = relations(attendanceRecords, ({ one }) => ({
  student: one(students, {
    fields: [attendanceRecords.studentId],
    references: [students.id],
  }),
  class: one(classes, {
    fields: [attendanceRecords.classId],
    references: [classes.id],
  }),
  term: one(terms, {
    fields: [attendanceRecords.termId],
    references: [terms.id],
  }),
}));

export const subjectsRelations = relations(subjects, ({ one, many }) => ({
  school: one(schools, {
    fields: [subjects.schoolId],
    references: [schools.id],
  }),
  teacherAssignments: many(teacherAssignments),
  studentSubjectAssignments: many(studentSubjectAssignments),
  grades: many(grades),
}));

export const teachersRelations = relations(teachers, ({ one, many }) => ({
  school: one(schools, {
    fields: [teachers.schoolId],
    references: [schools.id],
  }),
  assignments: many(teacherAssignments),
  grades: many(grades),
  lessonNotes: many(lessonNotes),
  learningResources: many(learningResources),
}));

export const studentsRelations = relations(students, ({ one, many }) => ({
  school: one(schools, {
    fields: [students.schoolId],
    references: [schools.id],
  }),
  enrollments: many(studentEnrollments),
  subjectAssignments: many(studentSubjectAssignments),
  grades: many(grades),
  promotions: many(promotions),
  parentLinks: many(parentStudents),
  complaints: many(complaints),
}));

export const teacherAssignmentsRelations = relations(
  teacherAssignments,
  ({ one }) => ({
    teacher: one(teachers, {
      fields: [teacherAssignments.teacherId],
      references: [teachers.id],
    }),
    class: one(classes, {
      fields: [teacherAssignments.classId],
      references: [classes.id],
    }),
    subject: one(subjects, {
      fields: [teacherAssignments.subjectId],
      references: [subjects.id],
    }),
    session: one(academicSessions, {
      fields: [teacherAssignments.sessionId],
      references: [academicSessions.id],
    }),
  })
);

export const studentEnrollmentsRelations = relations(
  studentEnrollments,
  ({ one }) => ({
    student: one(students, {
      fields: [studentEnrollments.studentId],
      references: [students.id],
    }),
    class: one(classes, {
      fields: [studentEnrollments.classId],
      references: [classes.id],
    }),
    session: one(academicSessions, {
      fields: [studentEnrollments.sessionId],
      references: [academicSessions.id],
    }),
  })
);

export const studentSubjectAssignmentsRelations = relations(
  studentSubjectAssignments,
  ({ one }) => ({
    student: one(students, {
      fields: [studentSubjectAssignments.studentId],
      references: [students.id],
    }),
    class: one(classes, {
      fields: [studentSubjectAssignments.classId],
      references: [classes.id],
    }),
    subject: one(subjects, {
      fields: [studentSubjectAssignments.subjectId],
      references: [subjects.id],
    }),
    session: one(academicSessions, {
      fields: [studentSubjectAssignments.sessionId],
      references: [academicSessions.id],
    }),
  })
);

export const gradesRelations = relations(grades, ({ one }) => ({
  student: one(students, {
    fields: [grades.studentId],
    references: [students.id],
  }),
  teacher: one(teachers, {
    fields: [grades.teacherId],
    references: [teachers.id],
  }),
  subject: one(subjects, {
    fields: [grades.subjectId],
    references: [subjects.id],
  }),
  class: one(classes, {
    fields: [grades.classId],
    references: [classes.id],
  }),
  term: one(terms, { fields: [grades.termId], references: [terms.id] }),
  session: one(academicSessions, {
    fields: [grades.sessionId],
    references: [academicSessions.id],
  }),
}));

export const gradeSettingsRelations = relations(gradeSettings, ({ one }) => ({
  teacher: one(teachers, {
    fields: [gradeSettings.teacherId],
    references: [teachers.id],
  }),
  class: one(classes, {
    fields: [gradeSettings.classId],
    references: [classes.id],
  }),
  subject: one(subjects, {
    fields: [gradeSettings.subjectId],
    references: [subjects.id],
  }),
  term: one(terms, {
    fields: [gradeSettings.termId],
    references: [terms.id],
  }),
}));

export const lessonNotesRelations = relations(lessonNotes, ({ one }) => ({
  teacher: one(teachers, {
    fields: [lessonNotes.teacherId],
    references: [teachers.id],
  }),
  class: one(classes, {
    fields: [lessonNotes.classId],
    references: [classes.id],
  }),
  subject: one(subjects, {
    fields: [lessonNotes.subjectId],
    references: [subjects.id],
  }),
  term: one(terms, {
    fields: [lessonNotes.termId],
    references: [terms.id],
  }),
}));

export const learningResourcesRelations = relations(
  learningResources,
  ({ one }) => ({
    teacher: one(teachers, {
      fields: [learningResources.teacherId],
      references: [teachers.id],
    }),
    class: one(classes, {
      fields: [learningResources.classId],
      references: [classes.id],
    }),
    subject: one(subjects, {
      fields: [learningResources.subjectId],
      references: [subjects.id],
    }),
    term: one(terms, {
      fields: [learningResources.termId],
      references: [terms.id],
    }),
  })
);

export const promotionsRelations = relations(promotions, ({ one }) => ({
  student: one(students, {
    fields: [promotions.studentId],
    references: [students.id],
  }),
  fromClass: one(classes, {
    fields: [promotions.fromClassId],
    references: [classes.id],
  }),
  toClass: one(classes, {
    fields: [promotions.toClassId],
    references: [classes.id],
  }),
  session: one(academicSessions, {
    fields: [promotions.sessionId],
    references: [academicSessions.id],
  }),
}));
