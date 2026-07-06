
-- =========================================================================
-- Roles enum + user_roles (separate from profiles for security)
-- =========================================================================
CREATE TYPE public.app_role AS ENUM ('admin', 'affiliate', 'student', 'customer');

CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role app_role NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, role)
);
GRANT SELECT ON public.user_roles TO authenticated;
GRANT ALL ON public.user_roles TO service_role;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE SQL STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = _role)
$$;

CREATE POLICY "users read own roles" ON public.user_roles
  FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "admins read all roles" ON public.user_roles
  FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'));

-- =========================================================================
-- Profiles
-- =========================================================================
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT,
  phone TEXT,
  location TEXT,
  avatar_url TEXT,
  referral_code TEXT UNIQUE,
  referred_by TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE ON public.profiles TO authenticated;
GRANT SELECT ON public.profiles TO anon;
GRANT ALL ON public.profiles TO service_role;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "public read profiles (for referral resolve)" ON public.profiles
  FOR SELECT USING (true);
CREATE POLICY "users update own profile" ON public.profiles
  FOR UPDATE TO authenticated USING (auth.uid() = id) WITH CHECK (auth.uid() = id);
CREATE POLICY "users insert own profile" ON public.profiles
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = id);

-- =========================================================================
-- Orders (Paystack)
-- =========================================================================
CREATE TABLE public.orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  email TEXT NOT NULL,
  tier TEXT NOT NULL,           -- basic | elite | vip
  amount_kobo INTEGER NOT NULL, -- NGN * 100
  currency TEXT NOT NULL DEFAULT 'NGN',
  reference TEXT NOT NULL UNIQUE,
  access_code TEXT,
  authorization_url TEXT,
  status TEXT NOT NULL DEFAULT 'pending', -- pending|success|failed|abandoned
  paystack_response JSONB,
  referral_code TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT ON public.orders TO authenticated;
GRANT ALL ON public.orders TO service_role;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;

CREATE POLICY "users read own orders" ON public.orders
  FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "users create own orders" ON public.orders
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id OR user_id IS NULL);
CREATE POLICY "admins read all orders" ON public.orders
  FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'));

-- =========================================================================
-- Recruitment applications
-- =========================================================================
CREATE TABLE public.applications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  full_name TEXT NOT NULL,
  age INTEGER NOT NULL CHECK (age BETWEEN 18 AND 60),
  phone TEXT NOT NULL,
  email TEXT,
  location TEXT NOT NULL,
  education TEXT NOT NULL,
  fitness_level TEXT NOT NULL,
  prior_experience TEXT,
  status TEXT NOT NULL DEFAULT 'submitted', -- submitted|screening|approved|deployed|rejected
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE ON public.applications TO authenticated;
GRANT INSERT ON public.applications TO anon; -- allow guest applications
GRANT ALL ON public.applications TO service_role;
ALTER TABLE public.applications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "users read own applications" ON public.applications
  FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "users create applications" ON public.applications
  FOR INSERT WITH CHECK (true);
CREATE POLICY "admins read all applications" ON public.applications
  FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "admins update applications" ON public.applications
  FOR UPDATE TO authenticated USING (public.has_role(auth.uid(), 'admin'));

-- =========================================================================
-- Referrals
-- =========================================================================
CREATE TABLE public.referrals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  affiliate_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  referred_email TEXT,
  referred_user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  order_id UUID REFERENCES public.orders(id) ON DELETE SET NULL,
  commission_kobo INTEGER NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'pending', -- pending|paid
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT ON public.referrals TO authenticated;
GRANT ALL ON public.referrals TO service_role;
ALTER TABLE public.referrals ENABLE ROW LEVEL SECURITY;

CREATE POLICY "affiliates read own referrals" ON public.referrals
  FOR SELECT TO authenticated USING (auth.uid() = affiliate_id);
CREATE POLICY "admins read all referrals" ON public.referrals
  FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'));

-- =========================================================================
-- Courses + enrollments (academy gating)
-- =========================================================================
CREATE TABLE public.courses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug TEXT NOT NULL UNIQUE,
  title TEXT NOT NULL,
  description TEXT,
  required_tier TEXT NOT NULL DEFAULT 'basic', -- basic|elite|vip
  duration_weeks INTEGER,
  order_index INTEGER NOT NULL DEFAULT 0,
  published BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT ON public.courses TO anon, authenticated;
GRANT ALL ON public.courses TO service_role;
ALTER TABLE public.courses ENABLE ROW LEVEL SECURITY;

CREATE POLICY "public read published courses" ON public.courses
  FOR SELECT USING (published = true);
CREATE POLICY "admins manage courses" ON public.courses
  FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE TABLE public.enrollments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  tier TEXT NOT NULL, -- what they paid for
  order_id UUID REFERENCES public.orders(id) ON DELETE SET NULL,
  active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT ON public.enrollments TO authenticated;
GRANT ALL ON public.enrollments TO service_role;
ALTER TABLE public.enrollments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "users read own enrollments" ON public.enrollments
  FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "admins read all enrollments" ON public.enrollments
  FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'));

-- =========================================================================
-- Deployments
-- =========================================================================
CREATE TABLE public.deployments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  application_id UUID REFERENCES public.applications(id) ON DELETE SET NULL,
  firm_name TEXT NOT NULL,
  role_title TEXT NOT NULL,
  monthly_salary_kobo INTEGER,
  start_date DATE,
  status TEXT NOT NULL DEFAULT 'assigned', -- assigned|active|ended
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT ON public.deployments TO authenticated;
GRANT ALL ON public.deployments TO service_role;
ALTER TABLE public.deployments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "users read own deployments" ON public.deployments
  FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "admins manage deployments" ON public.deployments
  FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- =========================================================================
-- updated_at trigger
-- =========================================================================
CREATE OR REPLACE FUNCTION public.tg_set_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql SET search_path = public AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END; $$;

CREATE TRIGGER profiles_updated_at BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.tg_set_updated_at();
CREATE TRIGGER orders_updated_at BEFORE UPDATE ON public.orders
  FOR EACH ROW EXECUTE FUNCTION public.tg_set_updated_at();
CREATE TRIGGER applications_updated_at BEFORE UPDATE ON public.applications
  FOR EACH ROW EXECUTE FUNCTION public.tg_set_updated_at();

-- =========================================================================
-- Auto-create profile + customer role + referral code on signup
-- =========================================================================
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  new_code TEXT;
BEGIN
  new_code := upper(substr(replace(gen_random_uuid()::text, '-', ''), 1, 8));

  INSERT INTO public.profiles (id, full_name, phone, referral_code, referred_by)
  VALUES (
    NEW.id,
    NEW.raw_user_meta_data ->> 'full_name',
    NEW.raw_user_meta_data ->> 'phone',
    new_code,
    NEW.raw_user_meta_data ->> 'referred_by'
  );

  INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id, 'customer');
  RETURN NEW;
END; $$;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- =========================================================================
-- Seed courses
-- =========================================================================
INSERT INTO public.courses (slug, title, description, required_tier, duration_weeks, order_index) VALUES
  ('foundation-conditioning','Foundation Conditioning','4-week core combat fitness and discipline.','basic',4,1),
  ('tactical-defense','Tactical Defense Modules','Situational awareness, defensive tactics, drills.','elite',6,2),
  ('close-protection','Close Protection & VIP Escort','Advanced close-protection curriculum.','vip',3,3),
  ('licensing-prep','Security Licensing & Vetting Prep','Documentation, vetting, deployment readiness.','elite',2,4);
