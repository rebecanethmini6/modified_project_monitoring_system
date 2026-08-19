-- =====================================================================
-- Storage bucket for proposal / project documents
-- Run AFTER your main schema, in Supabase Dashboard > SQL Editor.
-- The `documents.storage_path` column points at objects in this bucket.
-- Safe to run multiple times.
-- =====================================================================

INSERT INTO storage.buckets (id, name, public)
VALUES ('proposals', 'proposals', true)
ON CONFLICT (id) DO UPDATE SET public = true;

-- Uploads go through /api/upload using the service-role key, which bypasses
-- storage RLS, so no write policies are needed. The bucket is public so the
-- stored documents can be linked/downloaded later.

-- =====================================================================
-- Per-student ratings for supervised projects
-- Run this once so lecturers can rate every listed student from 1 to 10.
-- =====================================================================

CREATE TABLE IF NOT EXISTS public.project_student_ratings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id uuid NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  student_key text NOT NULL,
  student_name text,
  index_number text,
  email text,
  role text NOT NULL CHECK (role IN ('owner', 'member')),
  rating text NOT NULL,
  notes text,
  rated_by uuid,
  rated_at timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (project_id, student_key)
);

CREATE INDEX IF NOT EXISTS project_student_ratings_project_id_idx
  ON public.project_student_ratings (project_id);
