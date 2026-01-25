-- Create user_role enum
CREATE TYPE public.user_role AS ENUM ('user', 'admin');

-- Create user_stage enum for tracking progress
CREATE TYPE public.user_stage AS ENUM (
  'not_started',
  'onboarding',
  'exploring',
  'shortlisting',
  'committed',
  'applying'
);

-- Create university_category enum
CREATE TYPE public.university_category AS ENUM ('dream', 'target', 'safe');

-- Create profiles table
CREATE TABLE public.profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email text,
  role public.user_role NOT NULL DEFAULT 'user'::public.user_role,
  full_name text,
  current_stage public.user_stage NOT NULL DEFAULT 'not_started'::public.user_stage,
  onboarding_completed boolean NOT NULL DEFAULT false,
  
  -- Academic background
  current_education_level text,
  field_of_study text,
  gpa numeric(3, 2),
  test_scores jsonb DEFAULT '{}'::jsonb,
  
  -- Goals and preferences
  target_degree text,
  preferred_countries text[] DEFAULT ARRAY[]::text[],
  preferred_fields text[] DEFAULT ARRAY[]::text[],
  budget_min integer,
  budget_max integer,
  
  -- Exam preparation
  exams_taken text[] DEFAULT ARRAY[]::text[],
  exams_planned text[] DEFAULT ARRAY[]::text[],
  
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Create universities table
CREATE TABLE public.universities (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  country text NOT NULL,
  city text,
  ranking integer,
  acceptance_rate numeric(5, 2),
  tuition_fee_min integer,
  tuition_fee_max integer,
  currency text DEFAULT 'USD',
  programs text[] DEFAULT ARRAY[]::text[],
  requirements jsonb DEFAULT '{}'::jsonb,
  description text,
  website text,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Create user_shortlisted_universities table
CREATE TABLE public.user_shortlisted_universities (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  university_id uuid NOT NULL REFERENCES public.universities(id) ON DELETE CASCADE,
  category public.university_category NOT NULL,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(user_id, university_id)
);

-- Create user_locked_universities table
CREATE TABLE public.user_locked_universities (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  university_id uuid NOT NULL REFERENCES public.universities(id) ON DELETE CASCADE,
  locked_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(user_id, university_id)
);

-- Create tasks table
CREATE TABLE public.tasks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  university_id uuid REFERENCES public.universities(id) ON DELETE CASCADE,
  title text NOT NULL,
  description text,
  completed boolean NOT NULL DEFAULT false,
  due_date date,
  priority text DEFAULT 'medium',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Create chat_messages table
CREATE TABLE public.chat_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  role text NOT NULL CHECK (role IN ('user', 'assistant')),
  content text NOT NULL,
  metadata jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Create indexes
CREATE INDEX idx_profiles_stage ON public.profiles(current_stage);
CREATE INDEX idx_universities_country ON public.universities(country);
CREATE INDEX idx_universities_programs ON public.universities USING gin(programs);
CREATE INDEX idx_shortlisted_user ON public.user_shortlisted_universities(user_id);
CREATE INDEX idx_locked_user ON public.user_locked_universities(user_id);
CREATE INDEX idx_tasks_user ON public.tasks(user_id);
CREATE INDEX idx_tasks_completed ON public.tasks(completed);
CREATE INDEX idx_chat_messages_user ON public.chat_messages(user_id);

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Add triggers for updated_at
CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_tasks_updated_at BEFORE UPDATE ON public.tasks
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Create handle_new_user function
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  user_count int;
BEGIN
  SELECT COUNT(*) INTO user_count FROM profiles;
  INSERT INTO public.profiles (id, email, role)
  VALUES (
    NEW.id,
    NEW.email,
    CASE WHEN user_count = 0 THEN 'admin'::public.user_role ELSE 'user'::public.user_role END
  );
  RETURN NEW;
END;
$$;

-- Create trigger for new user
DROP TRIGGER IF EXISTS on_auth_user_confirmed ON auth.users;
CREATE TRIGGER on_auth_user_confirmed
  AFTER UPDATE ON auth.users
  FOR EACH ROW
  WHEN (OLD.confirmed_at IS NULL AND NEW.confirmed_at IS NOT NULL)
  EXECUTE FUNCTION handle_new_user();

-- Enable RLS
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.universities ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_shortlisted_universities ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_locked_universities ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chat_messages ENABLE ROW LEVEL SECURITY;

-- Create helper function for admin check
CREATE OR REPLACE FUNCTION is_admin(uid uuid)
RETURNS boolean LANGUAGE sql SECURITY DEFINER AS $$
  SELECT EXISTS (
    SELECT 1 FROM profiles p
    WHERE p.id = uid AND p.role = 'admin'::user_role
  );
$$;

-- RLS Policies for profiles
CREATE POLICY "Admins have full access to profiles" ON profiles
  FOR ALL TO authenticated USING (is_admin(auth.uid()));

CREATE POLICY "Users can view their own profile" ON profiles
  FOR SELECT TO authenticated USING (auth.uid() = id);

CREATE POLICY "Users can update their own profile" ON profiles
  FOR UPDATE TO authenticated USING (auth.uid() = id)
  WITH CHECK (role IS NOT DISTINCT FROM (SELECT role FROM profiles WHERE id = auth.uid()));

-- RLS Policies for universities (public read)
CREATE POLICY "Anyone can view universities" ON universities
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Admins can manage universities" ON universities
  FOR ALL TO authenticated USING (is_admin(auth.uid()));

-- RLS Policies for user_shortlisted_universities
CREATE POLICY "Users can view their own shortlist" ON user_shortlisted_universities
  FOR SELECT TO authenticated USING (auth.uid() = user_id);

CREATE POLICY "Users can manage their own shortlist" ON user_shortlisted_universities
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own shortlist" ON user_shortlisted_universities
  FOR UPDATE TO authenticated USING (auth.uid() = user_id);

CREATE POLICY "Users can delete from their own shortlist" ON user_shortlisted_universities
  FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- RLS Policies for user_locked_universities
CREATE POLICY "Users can view their locked universities" ON user_locked_universities
  FOR SELECT TO authenticated USING (auth.uid() = user_id);

CREATE POLICY "Users can lock universities" ON user_locked_universities
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can unlock universities" ON user_locked_universities
  FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- RLS Policies for tasks
CREATE POLICY "Users can view their own tasks" ON tasks
  FOR SELECT TO authenticated USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own tasks" ON tasks
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own tasks" ON tasks
  FOR UPDATE TO authenticated USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own tasks" ON tasks
  FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- RLS Policies for chat_messages
CREATE POLICY "Users can view their own messages" ON chat_messages
  FOR SELECT TO authenticated USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own messages" ON chat_messages
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);