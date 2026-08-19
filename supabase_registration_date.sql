-- Run once in Supabase SQL Editor. Batch and study year are calculated by the app.
ALTER TABLE public.students
  ADD COLUMN IF NOT EXISTS registration_date date;

-- Move data written by the earlier implementation into the correct column.
-- A year-only legacy value is treated as the university's August registration date.
UPDATE public.students
SET registration_date = make_date(academic_year::integer, 8, 1)
WHERE registration_date IS NULL
  AND academic_year ~ '^\d{4}$';
