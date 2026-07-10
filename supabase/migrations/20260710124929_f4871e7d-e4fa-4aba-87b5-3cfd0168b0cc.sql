
-- ============================================================
-- 1. Extend existing courses table
-- ============================================================
ALTER TABLE public.courses
  ADD COLUMN IF NOT EXISTS objectives jsonb NOT NULL DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS cover_image_url text,
  ADD COLUMN IF NOT EXISTS archived boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS completion_criteria text,
  ADD COLUMN IF NOT EXISTS updated_at timestamptz NOT NULL DEFAULT now();

DROP TRIGGER IF EXISTS trg_courses_updated ON public.courses;
CREATE TRIGGER trg_courses_updated BEFORE UPDATE ON public.courses
  FOR EACH ROW EXECUTE FUNCTION public.tg_set_updated_at();

-- ============================================================
-- 2. Modules
-- ============================================================
CREATE TABLE IF NOT EXISTS public.modules (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  course_id uuid NOT NULL REFERENCES public.courses(id) ON DELETE CASCADE,
  slug text NOT NULL,
  title text NOT NULL,
  summary text,
  order_index int NOT NULL DEFAULT 0,
  estimated_minutes int NOT NULL DEFAULT 30,
  published boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(course_id, slug)
);
GRANT SELECT ON public.modules TO anon, authenticated;
GRANT ALL ON public.modules TO service_role;
GRANT INSERT, UPDATE, DELETE ON public.modules TO authenticated;
ALTER TABLE public.modules ENABLE ROW LEVEL SECURITY;

DROP TRIGGER IF EXISTS trg_modules_updated ON public.modules;
CREATE TRIGGER trg_modules_updated BEFORE UPDATE ON public.modules
  FOR EACH ROW EXECUTE FUNCTION public.tg_set_updated_at();

CREATE POLICY "read published modules" ON public.modules FOR SELECT
  USING (published = true OR public.has_role(auth.uid(), 'admin'));
CREATE POLICY "admins manage modules ins" ON public.modules FOR INSERT
  WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "admins manage modules upd" ON public.modules FOR UPDATE
  USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "admins manage modules del" ON public.modules FOR DELETE
  USING (public.has_role(auth.uid(), 'admin'));

-- ============================================================
-- 3. Lessons
-- ============================================================
CREATE TABLE IF NOT EXISTS public.lessons (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  module_id uuid NOT NULL REFERENCES public.modules(id) ON DELETE CASCADE,
  slug text NOT NULL,
  title text NOT NULL,
  summary text,
  body_markdown text NOT NULL DEFAULT '',
  exercises jsonb NOT NULL DEFAULT '[]'::jsonb,
  checklist jsonb NOT NULL DEFAULT '[]'::jsonb,
  resources jsonb NOT NULL DEFAULT '[]'::jsonb,
  order_index int NOT NULL DEFAULT 0,
  estimated_minutes int NOT NULL DEFAULT 15,
  is_preview boolean NOT NULL DEFAULT false,
  published boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(module_id, slug)
);
GRANT SELECT ON public.lessons TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON public.lessons TO authenticated;
GRANT ALL ON public.lessons TO service_role;
ALTER TABLE public.lessons ENABLE ROW LEVEL SECURITY;

DROP TRIGGER IF EXISTS trg_lessons_updated ON public.lessons;
CREATE TRIGGER trg_lessons_updated BEFORE UPDATE ON public.lessons
  FOR EACH ROW EXECUTE FUNCTION public.tg_set_updated_at();

-- Public can only see published lesson metadata. Body gating is done at app layer
-- (previews expose body; other bodies require enrollment). This policy still limits DB rows.
CREATE POLICY "read published lessons" ON public.lessons FOR SELECT
  USING (published = true OR public.has_role(auth.uid(), 'admin'));
CREATE POLICY "admins manage lessons ins" ON public.lessons FOR INSERT
  WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "admins manage lessons upd" ON public.lessons FOR UPDATE
  USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "admins manage lessons del" ON public.lessons FOR DELETE
  USING (public.has_role(auth.uid(), 'admin'));

-- ============================================================
-- 4. Quizzes and questions
-- ============================================================
CREATE TABLE IF NOT EXISTS public.quizzes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  lesson_id uuid REFERENCES public.lessons(id) ON DELETE CASCADE,
  module_id uuid REFERENCES public.modules(id) ON DELETE CASCADE,
  title text NOT NULL,
  pass_percent int NOT NULL DEFAULT 70,
  is_final boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.quizzes TO authenticated;
GRANT INSERT, UPDATE, DELETE ON public.quizzes TO authenticated;
GRANT ALL ON public.quizzes TO service_role;
ALTER TABLE public.quizzes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "enrolled read quizzes" ON public.quizzes FOR SELECT
  USING (
    public.has_role(auth.uid(), 'admin') OR
    EXISTS (SELECT 1 FROM public.enrollments e WHERE e.user_id = auth.uid() AND e.active = true)
  );
CREATE POLICY "admins ins quizzes" ON public.quizzes FOR INSERT
  WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "admins upd quizzes" ON public.quizzes FOR UPDATE
  USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "admins del quizzes" ON public.quizzes FOR DELETE
  USING (public.has_role(auth.uid(), 'admin'));

CREATE TABLE IF NOT EXISTS public.quiz_questions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  quiz_id uuid NOT NULL REFERENCES public.quizzes(id) ON DELETE CASCADE,
  question text NOT NULL,
  choices jsonb NOT NULL,        -- array of strings
  correct_index int NOT NULL,
  explanation text,
  order_index int NOT NULL DEFAULT 0
);
GRANT SELECT ON public.quiz_questions TO authenticated;
GRANT INSERT, UPDATE, DELETE ON public.quiz_questions TO authenticated;
GRANT ALL ON public.quiz_questions TO service_role;
ALTER TABLE public.quiz_questions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "enrolled read questions" ON public.quiz_questions FOR SELECT
  USING (
    public.has_role(auth.uid(), 'admin') OR
    EXISTS (SELECT 1 FROM public.enrollments e WHERE e.user_id = auth.uid() AND e.active = true)
  );
CREATE POLICY "admins ins questions" ON public.quiz_questions FOR INSERT
  WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "admins upd questions" ON public.quiz_questions FOR UPDATE
  USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "admins del questions" ON public.quiz_questions FOR DELETE
  USING (public.has_role(auth.uid(), 'admin'));

-- ============================================================
-- 5. Lesson progress
-- ============================================================
CREATE TABLE IF NOT EXISTS public.lesson_progress (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  lesson_id uuid NOT NULL REFERENCES public.lessons(id) ON DELETE CASCADE,
  course_id uuid NOT NULL REFERENCES public.courses(id) ON DELETE CASCADE,
  seconds_spent int NOT NULL DEFAULT 0,
  completed_at timestamptz,
  last_seen_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(user_id, lesson_id)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.lesson_progress TO authenticated;
GRANT ALL ON public.lesson_progress TO service_role;
ALTER TABLE public.lesson_progress ENABLE ROW LEVEL SECURITY;

CREATE POLICY "own progress read" ON public.lesson_progress FOR SELECT
  USING (auth.uid() = user_id OR public.has_role(auth.uid(), 'admin'));
CREATE POLICY "own progress write" ON public.lesson_progress FOR INSERT
  WITH CHECK (auth.uid() = user_id);
CREATE POLICY "own progress update" ON public.lesson_progress FOR UPDATE
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- ============================================================
-- 6. Quiz attempts
-- ============================================================
CREATE TABLE IF NOT EXISTS public.quiz_attempts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  quiz_id uuid NOT NULL REFERENCES public.quizzes(id) ON DELETE CASCADE,
  course_id uuid NOT NULL REFERENCES public.courses(id) ON DELETE CASCADE,
  score_percent int NOT NULL,
  passed boolean NOT NULL,
  answers jsonb NOT NULL DEFAULT '[]'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT ON public.quiz_attempts TO authenticated;
GRANT ALL ON public.quiz_attempts TO service_role;
ALTER TABLE public.quiz_attempts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "own attempts read" ON public.quiz_attempts FOR SELECT
  USING (auth.uid() = user_id OR public.has_role(auth.uid(), 'admin'));
CREATE POLICY "own attempts insert" ON public.quiz_attempts FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- ============================================================
-- 7. Certificates
-- ============================================================
CREATE TABLE IF NOT EXISTS public.certificates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  course_id uuid NOT NULL REFERENCES public.courses(id) ON DELETE CASCADE,
  certificate_code text NOT NULL UNIQUE,
  recipient_name text NOT NULL,
  course_title text NOT NULL,
  issued_at timestamptz NOT NULL DEFAULT now(),
  revoked_at timestamptz,
  UNIQUE(user_id, course_id)
);
GRANT SELECT ON public.certificates TO anon, authenticated;
GRANT INSERT, UPDATE ON public.certificates TO authenticated;
GRANT ALL ON public.certificates TO service_role;
ALTER TABLE public.certificates ENABLE ROW LEVEL SECURITY;

-- Anyone with the certificate_code can verify (public verification page).
-- Owners can list their own. Admins can see all.
CREATE POLICY "cert public verify" ON public.certificates FOR SELECT
  USING (true);
CREATE POLICY "cert self insert" ON public.certificates FOR INSERT
  WITH CHECK (auth.uid() = user_id);
CREATE POLICY "cert admin update" ON public.certificates FOR UPDATE
  USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- ============================================================
-- 8. Helper: does user have active enrollment matching a course's required_tier?
-- ============================================================
CREATE OR REPLACE FUNCTION public.has_course_access(_user uuid, _course uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.courses c
    JOIN public.enrollments e ON e.user_id = _user AND e.active = true
    WHERE c.id = _course
      AND (
        (c.required_tier = 'basic' AND e.tier IN ('basic','elite','vip')) OR
        (c.required_tier = 'elite' AND e.tier IN ('elite','vip')) OR
        (c.required_tier = 'vip' AND e.tier = 'vip')
      )
  ) OR public.has_role(_user, 'admin');
$$;
GRANT EXECUTE ON FUNCTION public.has_course_access(uuid, uuid) TO authenticated, anon;

-- ============================================================
-- 9. Issue certificate (server verifies completion)
-- ============================================================
CREATE OR REPLACE FUNCTION public.issue_certificate(_course uuid)
RETURNS public.certificates LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_user uuid := auth.uid();
  v_course public.courses;
  v_name text;
  v_total int;
  v_done int;
  v_code text;
  v_row public.certificates;
BEGIN
  IF v_user IS NULL THEN RAISE EXCEPTION 'not authenticated'; END IF;
  SELECT * INTO v_course FROM public.courses WHERE id = _course;
  IF NOT FOUND THEN RAISE EXCEPTION 'course not found'; END IF;
  IF NOT public.has_course_access(v_user, _course) THEN
    RAISE EXCEPTION 'no access to this course';
  END IF;

  SELECT count(*) INTO v_total FROM public.lessons l
    JOIN public.modules m ON m.id = l.module_id
    WHERE m.course_id = _course AND l.published = true AND m.published = true;
  SELECT count(*) INTO v_done FROM public.lesson_progress lp
    JOIN public.lessons l ON l.id = lp.lesson_id
    JOIN public.modules m ON m.id = l.module_id
    WHERE lp.user_id = v_user AND m.course_id = _course AND lp.completed_at IS NOT NULL;

  IF v_total = 0 OR v_done < v_total THEN
    RAISE EXCEPTION 'course not yet complete (% of %)', v_done, v_total;
  END IF;

  SELECT COALESCE(full_name, 'Martial X Cadet') INTO v_name FROM public.profiles WHERE id = v_user;
  v_code := 'MX-' || upper(substr(replace(gen_random_uuid()::text,'-',''), 1, 10));

  INSERT INTO public.certificates(user_id, course_id, certificate_code, recipient_name, course_title)
  VALUES (v_user, _course, v_code, v_name, v_course.title)
  ON CONFLICT (user_id, course_id) DO UPDATE SET revoked_at = NULL
  RETURNING * INTO v_row;
  RETURN v_row;
END;
$$;
GRANT EXECUTE ON FUNCTION public.issue_certificate(uuid) TO authenticated;

-- ============================================================
-- 10. Consolidate duplicate admin policies (security warnings)
-- ============================================================
DROP POLICY IF EXISTS "admins read all applications" ON public.applications;
DROP POLICY IF EXISTS "admins read applications" ON public.applications;
CREATE POLICY "admins read applications" ON public.applications FOR SELECT
  USING (public.has_role(auth.uid(), 'admin'));

DROP POLICY IF EXISTS "admins read all orders" ON public.orders;
DROP POLICY IF EXISTS "admins read orders" ON public.orders;
CREATE POLICY "admins read orders" ON public.orders FOR SELECT
  USING (public.has_role(auth.uid(), 'admin') OR auth.uid() = user_id);

DROP POLICY IF EXISTS "admins read all referrals" ON public.referrals;
DROP POLICY IF EXISTS "admins read referrals" ON public.referrals;
CREATE POLICY "admins read referrals" ON public.referrals FOR SELECT
  USING (public.has_role(auth.uid(), 'admin') OR auth.uid() = affiliate_id);

DROP POLICY IF EXISTS "admins read all enrollments" ON public.enrollments;
DROP POLICY IF EXISTS "admins read enrollments" ON public.enrollments;
CREATE POLICY "admins read enrollments" ON public.enrollments FOR SELECT
  USING (public.has_role(auth.uid(), 'admin') OR auth.uid() = user_id);

-- Ensure enrollments unique(user_id, tier) for payment-webhook upserts
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'enrollments_user_tier_key'
  ) THEN
    ALTER TABLE public.enrollments ADD CONSTRAINT enrollments_user_tier_key UNIQUE (user_id, tier);
  END IF;
END $$;

-- Indexes
CREATE INDEX IF NOT EXISTS idx_modules_course ON public.modules(course_id, order_index);
CREATE INDEX IF NOT EXISTS idx_lessons_module ON public.lessons(module_id, order_index);
CREATE INDEX IF NOT EXISTS idx_progress_user_course ON public.lesson_progress(user_id, course_id);
CREATE INDEX IF NOT EXISTS idx_certs_user ON public.certificates(user_id);
