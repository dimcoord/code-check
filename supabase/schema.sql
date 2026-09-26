-- ==============================================================================
-- KODERIUM DATABASE SCHEMA (FULL SETUP SCRIPT)
-- Supabase PostgreSQL Setup for Next.js, CodeMirror, and Judge0
-- ==============================================================================

-- 1. CLEANUP (Drop existing tables in reverse dependency order if starting over)
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS public.handle_new_user();

DROP TABLE IF EXISTS public.submissions CASCADE;
DROP TABLE IF EXISTS public.assignments CASCADE;
DROP TABLE IF EXISTS public.class_enrollments CASCADE;
DROP TABLE IF EXISTS public.classes CASCADE;
DROP TABLE IF EXISTS public.profiles CASCADE;

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ==============================================================================
-- 2. CREATE TABLES
-- ==============================================================================

-- Table: PROFILES
-- Directly references auth.users to store extended user data and role
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  full_name TEXT NOT NULL DEFAULT '',
  role TEXT NOT NULL CHECK (role IN ('lecturer', 'ta', 'student')) DEFAULT 'student',
  nim TEXT,
  university_email TEXT,
  kelas TEXT,
  bio TEXT,
  avatar_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Table: CLASSES
-- Managed by lecturers or teaching assistants (owners)
CREATE TABLE public.classes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  class_code TEXT UNIQUE NOT NULL,
  owner_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Table: CLASS ENROLLMENTS
-- Maps students and assistants to their enrolled classes
CREATE TABLE public.class_enrollments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  class_id UUID NOT NULL REFERENCES public.classes(id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK (role IN ('owner', 'assistant', 'student')) DEFAULT 'student',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT unique_user_class UNIQUE (user_id, class_id)
);

-- Table: ASSIGNMENTS
-- Created by lecturers/TAs with test cases and allowed languages
CREATE TABLE public.assignments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  class_id UUID NOT NULL REFERENCES public.classes(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT NOT NULL DEFAULT '',
  language TEXT NOT NULL CHECK (language IN ('cpp', 'java', 'all')) DEFAULT 'all',
  starter_code TEXT DEFAULT '',
  sample_input TEXT DEFAULT '',
  expected_output TEXT DEFAULT '',
  max_score INTEGER NOT NULL DEFAULT 100,
  due_date TIMESTAMPTZ,
  created_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Table: SUBMISSIONS
-- Stores student code submissions, Judge0 evaluation output, and instructor grades
CREATE TABLE public.submissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  assignment_id UUID REFERENCES public.assignments(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  problem TEXT NOT NULL,
  language TEXT NOT NULL, -- e.g. '76' / '54' (C++), '62' (Java)
  code TEXT NOT NULL,
  file_name TEXT, -- Optional filename if submitted via file upload
  status TEXT NOT NULL DEFAULT 'Pending',
  runtime TEXT,
  memory TEXT,
  stdout TEXT,
  stderr TEXT,
  compile_output TEXT,
  token TEXT,
  score NUMERIC(5, 2),
  feedback TEXT,
  grading_status TEXT DEFAULT 'Unreviewed' CHECK (grading_status IN ('Unreviewed', 'Accepted', 'Needs Revision', 'Rejected')),
  graded_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  graded_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ==============================================================================
-- 3. INDEXES FOR HIGH QUERY PERFORMANCE
-- ==============================================================================
CREATE INDEX idx_profiles_role ON public.profiles(role);
CREATE INDEX idx_profiles_email ON public.profiles(email);
CREATE INDEX idx_classes_owner ON public.classes(owner_id);
CREATE INDEX idx_classes_code ON public.classes(class_code);
CREATE INDEX idx_enrollments_user ON public.class_enrollments(user_id);
CREATE INDEX idx_enrollments_class ON public.class_enrollments(class_id);
CREATE INDEX idx_assignments_class ON public.assignments(class_id);
CREATE INDEX idx_submissions_user ON public.submissions(user_id);
CREATE INDEX idx_submissions_assignment ON public.submissions(assignment_id);
CREATE INDEX idx_submissions_status ON public.submissions(status);

-- ==============================================================================
-- 4. ROW LEVEL SECURITY (RLS) POLICIES
-- ==============================================================================
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.classes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.class_enrollments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.submissions ENABLE ROW LEVEL SECURITY;

-- 4.1 PROFILES POLICIES
CREATE POLICY "Profiles readable by authenticated users"
  ON public.profiles FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Users can update own profile"
  ON public.profiles FOR UPDATE
  TO authenticated
  USING (auth.uid() = id);

CREATE POLICY "Staff can manage all profiles"
  ON public.profiles FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role IN ('lecturer', 'ta')
    )
    OR auth.uid() = id
  );

-- 4.2 CLASSES POLICIES
CREATE POLICY "Classes are viewable by authenticated users"
  ON public.classes FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Staff can insert classes"
  ON public.classes FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role IN ('lecturer', 'ta')
    )
    OR owner_id = auth.uid()
  );

CREATE POLICY "Staff and owners can update classes"
  ON public.classes FOR UPDATE
  TO authenticated
  USING (
    owner_id = auth.uid()
    OR EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role IN ('lecturer', 'ta')
    )
  );

CREATE POLICY "Staff and owners can delete classes"
  ON public.classes FOR DELETE
  TO authenticated
  USING (
    owner_id = auth.uid()
    OR EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role IN ('lecturer', 'ta')
    )
  );

-- 4.3 CLASS ENROLLMENTS POLICIES
CREATE POLICY "Enrollments readable by users and staff"
  ON public.class_enrollments FOR SELECT
  TO authenticated
  USING (
    user_id = auth.uid()
    OR EXISTS (
      SELECT 1 FROM public.classes
      WHERE classes.id = class_enrollments.class_id AND classes.owner_id = auth.uid()
    )
    OR EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role IN ('lecturer', 'ta')
    )
  );

CREATE POLICY "Users can enroll themselves or staff can manage"
  ON public.class_enrollments FOR INSERT
  TO authenticated
  WITH CHECK (
    user_id = auth.uid()
    OR EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role IN ('lecturer', 'ta')
    )
  );

CREATE POLICY "Staff or owners can delete enrollments"
  ON public.class_enrollments FOR DELETE
  TO authenticated
  USING (
    user_id = auth.uid()
    OR EXISTS (
      SELECT 1 FROM public.classes
      WHERE classes.id = class_enrollments.class_id AND classes.owner_id = auth.uid()
    )
    OR EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role IN ('lecturer', 'ta')
    )
  );

-- 4.4 ASSIGNMENTS POLICIES
CREATE POLICY "Assignments are viewable by authenticated users"
  ON public.assignments FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Staff can manage assignments"
  ON public.assignments FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role IN ('lecturer', 'ta')
    )
    OR EXISTS (
      SELECT 1 FROM public.classes
      WHERE classes.id = assignments.class_id AND classes.owner_id = auth.uid()
    )
  );

-- 4.5 SUBMISSIONS POLICIES
CREATE POLICY "Students see own submissions, staff sees all"
  ON public.submissions FOR SELECT
  TO authenticated
  USING (
    user_id = auth.uid()
    OR EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role IN ('lecturer', 'ta')
    )
  );

CREATE POLICY "Students can submit code"
  ON public.submissions FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Staff can grade and update submissions"
  ON public.submissions FOR UPDATE
  TO authenticated
  USING (
    user_id = auth.uid()
    OR EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role IN ('lecturer', 'ta')
    )
  );

-- ==============================================================================
-- 5. AUTOMATIC PROFILE TRIGGER ON AUTH SIGNUP
-- ==============================================================================
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (
    id,
    email,
    full_name,
    role,
    nim,
    university_email,
    kelas
  )
  VALUES (
    new.id,
    new.email,
    COALESCE(new.raw_user_meta_data->>'full_name', split_part(new.email, '@', 1)),
    COALESCE(new.raw_user_meta_data->>'role', 'student'),
    new.raw_user_meta_data->>'nim',
    COALESCE(new.raw_user_meta_data->>'university_email', new.email),
    new.raw_user_meta_data->>'kelas'
  )
  ON CONFLICT (id) DO UPDATE SET
    email = EXCLUDED.email,
    full_name = CASE WHEN EXCLUDED.full_name <> '' THEN EXCLUDED.full_name ELSE profiles.full_name END,
    nim = COALESCE(EXCLUDED.nim, profiles.nim),
    university_email = COALESCE(EXCLUDED.university_email, profiles.university_email),
    kelas = COALESCE(EXCLUDED.kelas, profiles.kelas),
    updated_at = now();
  RETURN new;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();
