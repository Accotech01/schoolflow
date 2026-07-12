# EduManage NG — School Management System

A full-featured, multi-tenant school management platform built for Nigerian private schools. Supports WAEC grading, the Primary/JSS/SS class structure, and role-based portals for Superadmin, School Admin, Teacher, Student, and Parent.

## Tech Stack

- **Next.js 15** (App Router, Server Components, Server Actions)
- **TypeScript**
- **Drizzle ORM** + **Neon PostgreSQL** (serverless)
- **NextAuth v5** (Credentials provider, JWT sessions)
- **Tailwind CSS v3** + **shadcn/ui-style components**
- **Sonner** (toast notifications)
- **bcryptjs** (password hashing)
- **Zod** (server-side validation)
- **jsPDF** + **html2canvas** (client-side PDF export of results)

---

## Quick Start

### 1. Clone and install dependencies
```bash
npm install
```

### 2. Set up environment variables
Copy `.env.local` and fill in your values:
```bash
cp .env.local .env.local   # already provided — just edit the values
```

Required values:
| Variable | Description |
|---|---|
| `DATABASE_URL` | Neon PostgreSQL connection string |
| `AUTH_SECRET` | Random 32+ char secret (`openssl rand -base64 32`) |
| `SUPERADMIN_EMAIL` | Initial superadmin email |
| `SUPERADMIN_PASSWORD` | Initial superadmin password |
| `SUPERADMIN_NAME` | Initial superadmin display name |

### 3. Push database schema
```bash
npm run db:push
```

### 4. Seed the superadmin account
```bash
npm run db:seed
```

### 5. Run the development server
```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## User Roles & Access

| Role | Login URL | Default Credentials (demo) |
|---|---|---|
| Superadmin | `/login` → select Superadmin | `superadmin@schoolmgmt.ng` / `SuperAdmin@2025` |
| School Admin | `/login` → select School Admin + enter school slug | Created by Superadmin |
| Teacher | `/login` → select Teacher + enter school slug | Created by School Admin |
| Student | `/login` → select Student + enter school slug | Created by School Admin |
| Parent | `/login` → select Parent + enter school slug | Created (or linked) by School Admin during student registration |

An inactive account (school admin, teacher, student, or parent) is blocked at login with a clear message rather than a generic error.

---

## Key Features

### Superadmin Portal (`/superadmin/`)
- Dashboard with platform-wide stats
- Create and manage schools (with admin account creation)
- Set a per-student billing rate for each school; each school's amount due is calculated from its active student count
- Deactivate/reactivate a school admin's login and track their payment dates
- View all school administrators across the platform
- Send a direct message to a specific school admin, or broadcast an announcement to all of them
- Platform settings

### School Admin Portal (`/[schoolSlug]/admin/`)
- Full CRUD: Students, Teachers, Classes, Subjects
- Optionally create (or link) a parent portal login at the moment a student is registered — siblings automatically share one parent account
- Assign teachers to class-subject combinations
- Assign a dedicated class teacher to each class
- Enroll students in classes and subjects per session
- Manage academic sessions (auto-creates 3 terms) and advance the active term, with configurable term start/end dates
- End-of-session promotion engine: auto-calculates averages, flags borderline cases for review, and executes promotions into the new session's classes
- Master Sheet: per-class summary of every student's subject totals, grand total, average, WAEC grade, and class rank — with the school's best-performing class auto-highlighted
- Declare public holidays and midterm breaks; those dates are excluded from every student's attendance automatically
- Generate printable admission letters and WAEC-graded report cards (with overall grade and class position)
- Send announcements to students, teachers, or both — school-wide or per class
- Respond to parent complaints/suggestions
- See the school's amount due and next payment date
- Live notification inbox for announcements and platform messages

### Teacher Portal (`/[schoolSlug]/teacher/`)
- View teaching assignments
- Grade students (Test 1, Test 2, Assignment, Attendance, Exam) with automatic WAEC grading
- Configure max scores per component (must total 100)
- Class teacher tools (for a class's assigned homeroom teacher): mark daily attendance (Present/Late/Absent), automatically blocked on declared holidays/breaks, and finalize a term's attendance into a real score posted directly onto every student's report card
- Send announcements to an assigned class
- Upload lesson notes (by week)
- Add learning resource links (video, document, article, etc.)

### Student Portal (`/[schoolSlug]/student/`)
- Dashboard with grade overview, attendance score, and current-term banner
- Detailed results per term with WAEC grade reference and class position
- One-click PDF download of results — unlocked only once every subject has been graded
- Announcements feed (school-wide and class-specific)
- View lesson notes and learning resources by subject
- Personal profile

### Parent Portal (`/[schoolSlug]/parent/`)
- Login created (or linked, for siblings) by the school admin during student registration — no separate sign-up
- Dashboard listing every linked child
- Per-child view: current class, term-by-term results, overall grade, class position, and attendance score
- Submit a complaint or suggestion to the school, optionally about a specific child, and see the school's response

---

## Grading System (WAEC)

| Grade | Score Range | Remark |
|---|---|---|
| A1 | 75 – 100 | Excellent |
| B2 | 70 – 74 | Very Good |
| B3 | 65 – 69 | Good |
| C4 | 60 – 64 | Credit |
| C5 | 55 – 59 | Credit |
| C6 | 50 – 54 | Credit |
| D7 | 45 – 49 | Pass |
| E8 | 40 – 44 | Pass |
| F9 | 0 – 39 | Fail |

**Promotion threshold:** C6 and above (50%+) → auto-promoted. Below C6 → admin discretion.

---

## Database Schema

Main tables:
- `superadmins` — platform superadmins
- `schools` — multi-tenant school records (includes per-student billing rate)
- `school_admins` — per-school admin accounts (includes payment status/dates)
- `teachers` — teacher accounts
- `students` — student accounts
- `parents` — parent/guardian accounts
- `parent_students` — parent ↔ student links (supports multiple children per parent)
- `classes` — classes (Primary 1–6, JSS 1–3, SS 1–3), each with an optional class teacher and attendance scoring scale
- `subjects` — subjects per school
- `teacher_assignments` — teacher ↔ class ↔ subject mappings
- `student_enrollments` — student ↔ class per session
- `student_subject_assignments` — student ↔ subject per session
- `academic_sessions` — school year sessions
- `terms` — First/Second/Third term per session, with start/end dates
- `grades` — student grades per subject per term
- `grade_settings` — teacher-configured max scores
- `lesson_notes` — teacher lesson notes
- `learning_resources` — teacher-added resource links
- `promotions` — end-of-session promotion records
- `attendance_records` — daily attendance per student per term
- `school_holidays` — public holidays/midterm breaks excluded from attendance
- `announcements` / `announcement_reads` — school-wide and class announcements, with read tracking
- `platform_messages` / `platform_message_reads` — superadmin → school admin messages/announcements, with read tracking
- `complaints` — parent complaints/suggestions and admin responses

---

## Deployment (Vercel)

1. Push to GitHub
2. Import repo on [vercel.com](https://vercel.com)
3. Add all environment variables from `.env.local`
4. Deploy — Vercel auto-sets `NEXTAUTH_URL` from `VERCEL_URL`

After first deploy, run the seed:
```bash
npx tsx lib/db/seed.ts
```
Or set up via Vercel's "Run Command" in project settings.

---

## Available Scripts

| Script | Description |
|---|---|
| `npm run dev` | Start development server |
| `npm run build` | Build for production |
| `npm run db:generate` | Generate Drizzle migration files |
| `npm run db:push` | Push schema directly to database |
| `npm run db:migrate` | Run migrations |
| `npm run db:studio` | Open Drizzle Studio (DB browser) |
| `npm run db:seed` | Seed initial superadmin |
