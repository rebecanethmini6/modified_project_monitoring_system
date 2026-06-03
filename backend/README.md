# Backend

This project uses Next.js route handlers under `app/api` for the actual HTTP backend, and keeps shared server-only helpers in `backend/`.

Implemented endpoints:

- `GET /api/health` - backend and Supabase config status
- `POST /api/register/student` - create a student auth account
- `POST /api/register/lecturer` - create a lecturer auth account
- `POST /api/auth/confirm-email` - admin-side email confirmation fallback for existing accounts
- `GET /api/projects` - list projects from Supabase
- `POST /api/projects` - create a new project submission
- `GET /api/projects/:id` - read one project
- `PATCH /api/projects/:id` - update a project
- `DELETE /api/projects/:id` - delete a project

Required environment variables:

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY` for the project endpoints and any privileged database writes

The project routes expect a `projects` table in Supabase. The registration routes use the Supabase Auth admin API and create confirmed auth users with the submitted fields in user metadata.

