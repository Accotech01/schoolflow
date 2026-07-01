# EduManage NG — School Management System

A full-featured, multi-tenant school management platform built for Nigerian private schools. Supports WAEC grading, JSS/SS class structure, and role-based portals for Superadmin, School Admin, Teacher, and Student.

## Tech Stack

- **Next.js 15** (App Router, Server Components, Server Actions)
- **TypeScript**
- **Drizzle ORM** + **Neon PostgreSQL** (serverless)
- **NextAuth v5** (Credentials provider, JWT sessions)
- **Tailwind CSS v3** + **shadcn/ui-style components**
- **Sonner** (toast notifications)
- **bcryptjs** (password hashing)
- **Zod** (server-side validation)

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

---

## Key Features

### Superadmin Portal (`/superadmin/`)
- Dashboard with platform-wide stats
- Create and manage schools (with admin account creation)
- View all school administrators
- Platform settings

### School Admin Portal (`/[schoolSlug]/admin/`)
- Full CRUD: Students, Teachers, Classes, Subjects
- Assign teachers to class-subject combinations
- Enroll students in classes per session
- Manage academic sessions (auto-creates 3 terms)
- Set active term
- Promotion system (end-of-session)
- Report cards with WAEC grading

### Teacher Portal (`/[schoolSlug]/teacher/`)
- View teaching assignments
- Grade students (Test 1, Test 2, Assignment, Attendance, Exam)
- Configure max scores per component (must total 100)
- Upload lesson notes (by week)
- Add learning resource links (video, document, article, etc.)

### Student Portal (`/[schoolSlug]/student/`)
- Dashboard with grade overview and performance bars
- AI-generated academic recommendations (WAEC-aligned)
- Detailed results per term with WAEC grade reference
- View lesson notes and learning resources by subject
- Personal profile with promotion history

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
- `schools` — multi-tenant school records
- `school_admins` — per-school admin accounts
- `teachers` — teacher accounts
- `students` — student accounts
- `classes` — classes (Primary 1–6, JSS 1–3, SS 1–3)
- `subjects` — subjects per school
- `teacher_assignments` — teacher ↔ class ↔ subject mappings
- `student_enrollments` — student ↔ class per session
- `academic_sessions` — school year sessions
- `terms` — First/Second/Third term per session
- `grades` — student grades per subject per term
- `grade_settings` — teacher-configured max scores
- `lesson_notes` — teacher lesson notes
- `learning_resources` — teacher-added resource links
- `promotions` — end-of-session promotion records

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
