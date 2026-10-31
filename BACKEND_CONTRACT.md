# Tutorium: API the client expects

The Next.js client talks to FastAPI through `/api/proxy/*` (adds the Bearer token, refreshes it on 401).
Everything is JSON unless noted. Roles are enforced **server-side**; the client only hides what a role can't use.
`account_requests.py` in this folder implements the `/account-requests` rows. The rest is what the new screens call.
Mark off what you already have; anything missing is what to build next.

## Scoping rules (important)
- Teacher: sees only lessons/classes/class-subjects where they are the teacher. Students: published lessons for classes they're enrolled in.
- Admin: everything. Never trust role/ID sent by the client.

## Endpoints
| Method | Path | Who | Notes |
|---|---|---|---|
| GET | `/stats` | admin | `{teachers, students, classes, subjects, lessons, published_lessons, pending_requests}` |
| POST | `/account-requests` | public | rate-limited; 409 on duplicate email |
| GET | `/account-requests?status=` | admin | pending / approved / rejected |
| POST | `/account-requests/{id}/approve` | admin | creates teacher, emails login ID + temp password |
| POST | `/account-requests/{id}/reject` | admin | body `{note?}` |
| GET, POST | `/teachers` | admin | Teacher fields in `lib/types.ts`; POST emails credentials |
| PATCH | `/teachers/{id}` | admin | e.g. `{is_active}` |
| POST | `/teachers/{id}/reset-password` | admin | new temp password emailed |
| GET, POST | `/students` | admin, teacher | teacher sees students in their classes + ones they created. POST body has `class_id?`; credentials emailed to `guardian_email`. Include `class_names: string[]` |
| PATCH | `/students/{id}` | admin, teacher | `is_active` admin only |
| POST | `/students/{id}/reset-password` | admin, teacher | emailed to guardian |
| GET | `/classes` | all | scoped: teacher's classes, student's classes. Includes `student_count` |
| POST, PATCH, DELETE | `/classes[/{id}]` | admin | `{name, academic_year}` |
| GET | `/classes/{id}` | admin, teacher | `ClassDetail`: class + `subjects: ClassSubject[]` + `students: Student[]` |
| POST | `/classes/{id}/students` | admin, teacher | `{student_id}` (student UUID) |
| DELETE | `/classes/{id}/students/{student_id}` | admin, teacher | Student UUID |
| GET | `/subjects` | all | |
| POST, PATCH, DELETE | `/subjects[/{id}]` | admin | `{name, code?}` |
| GET | `/class-subjects` | all (scoped) | `{id, class_id, class_name, subject_id, subject_name, teacher_id, teacher_name}` |
| POST, DELETE | `/class-subjects[/{id}]` | admin | POST `{class_id, subject_id, teacher_id}`; `teacher_id` is the teacher user UUID |
| GET | `/lessons` | all (scoped) | query: `date_from, date_to, status, class_subject_id, q, limit`. `q` matches title/subject/class. Include `teacher_name` |
| POST | `/lessons` | teacher | `LessonInput`; must own the `class_subject_id` |
| PATCH, DELETE | `/lessons/{id}` | teacher (own) | |
| POST | `/lessons/{id}/publish` · `/unpublish` | teacher (own) | |
| PATCH | `/users/me` | all | `{first_name, last_name}` |
| POST | `/users/me/avatar` | all | multipart field `file` (png/jpg/webp ≤ 2 MB) → Cloudinary |
| DELETE | `/users/me/avatar` | all | |

Already used by the existing client: `/auth/login`, `/auth/refresh`, `/auth/logout`, `/auth/me` (needs `avatar_url`), `/auth/change-password`.
