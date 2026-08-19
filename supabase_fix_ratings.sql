-- =====================================================================
-- FIX: Create missing rating tables for the project monitoring system
-- Run this in Supabase Dashboard > SQL Editor
-- Safe to run multiple times (uses IF NOT EXISTS / ON CONFLICT).
-- =====================================================================

-- ---------------------------------------------------------------
-- 0. Migrate legacy enum-based ratings to text.
--
-- Earlier versions of the schema used the `rating_value` enum with
-- values such as Excellent, Good, and Bad. The current application
-- stores whole-number scores from 1 through 10, so PostgreSQL rejects
-- values such as "8" while a rating column still uses that enum.
--
-- This preserves existing ratings (for example, "Excellent") and only
-- changes the listed columns when they are currently enum types.
-- ---------------------------------------------------------------
DO $$
DECLARE
  rating_column record;
BEGIN
  FOR rating_column IN
    SELECT columns.table_schema, columns.table_name, columns.column_name
    FROM information_schema.columns AS columns
    JOIN pg_catalog.pg_type AS type_info
      ON type_info.typname = columns.udt_name
    JOIN pg_catalog.pg_namespace AS type_schema
      ON type_schema.oid = type_info.typnamespace
      AND type_schema.nspname = columns.udt_schema
    WHERE columns.table_schema = 'public'
      AND columns.table_name IN ('progress_entries', 'project_ratings', 'project_student_ratings')
      AND columns.column_name = 'rating'
      AND type_info.typtype = 'e'
  LOOP
    EXECUTE format(
      'ALTER TABLE %I.%I ALTER COLUMN %I TYPE text USING %I::text',
      rating_column.table_schema,
      rating_column.table_name,
      rating_column.column_name,
      rating_column.column_name
    );
  END LOOP;
END $$;

-- ---------------------------------------------------------------
-- 1. Overall project ratings (one rating per project)
--    Used by: POST /api/projects/[id]/rating
-- ---------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.project_ratings (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id  uuid NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  rated_by    uuid,
  rating      text NOT NULL,
  notes       text,
  rated_at    timestamptz NOT NULL DEFAULT now(),
  created_at  timestamptz NOT NULL DEFAULT now(),
  UNIQUE (project_id)
);

CREATE INDEX IF NOT EXISTS project_ratings_project_id_idx
  ON public.project_ratings (project_id);

-- ---------------------------------------------------------------
-- 2. Per-student ratings for group projects (one per student per project)
--    Used by: POST /api/projects/[id]/student-ratings
-- ---------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.project_student_ratings (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id    uuid NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  student_key   text NOT NULL,
  student_name  text,
  index_number  text,
  email         text,
  role          text NOT NULL CHECK (role IN ('owner', 'member')),
  rating        text NOT NULL,
  notes         text,
  rated_by      uuid,
  rated_at      timestamptz NOT NULL DEFAULT now(),
  created_at    timestamptz NOT NULL DEFAULT now(),
  UNIQUE (project_id, student_key)
);

CREATE INDEX IF NOT EXISTS project_student_ratings_project_id_idx
  ON public.project_student_ratings (project_id);

-- ---------------------------------------------------------------
-- 3. Disable RLS on these tables so the service-role key used
--    by the Next.js backend can read/write without policy checks.
-- ---------------------------------------------------------------
ALTER TABLE public.project_ratings         DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.project_student_ratings DISABLE ROW LEVEL SECURITY;
