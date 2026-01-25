export type UserRole = 'user' | 'admin';

export type UserStage = 
  | 'not_started'
  | 'onboarding'
  | 'exploring'
  | 'shortlisting'
  | 'committed'
  | 'applying';

export type UniversityCategory = 'dream' | 'target' | 'safe';

export interface Profile {
  id: string;
  email: string | null;
  role: UserRole;
  full_name: string | null;
  current_stage: UserStage;
  onboarding_completed: boolean;
  current_education_level: string | null;
  field_of_study: string | null;
  gpa: number | null;
  test_scores: Record<string, number>;
  target_degree: string | null;
  preferred_countries: string[];
  preferred_fields: string[];
  budget_min: number | null;
  budget_max: number | null;
  exams_taken: string[];
  exams_planned: string[];
  created_at: string;
  updated_at: string;
}

export interface University {
  id: string;
  name: string;
  country: string;
  city: string | null;
  ranking: number | null;
  acceptance_rate: number | null;
  tuition_fee_min: number | null;
  tuition_fee_max: number | null;
  currency: string;
  programs: string[];
  requirements: Record<string, any>;
  description: string | null;
  website: string | null;
  created_at: string;
}

export interface ShortlistedUniversity {
  id: string;
  user_id: string;
  university_id: string;
  category: UniversityCategory;
  notes: string | null;
  created_at: string;
  university?: University;
}

export interface LockedUniversity {
  id: string;
  user_id: string;
  university_id: string;
  locked_at: string;
  university?: University;
}

export interface Task {
  id: string;
  user_id: string;
  university_id: string | null;
  title: string;
  description: string | null;
  completed: boolean;
  due_date: string | null;
  priority: string;
  created_at: string;
  updated_at: string;
  university?: University;
}

export interface ChatMessage {
  id: string;
  user_id: string;
  role: 'user' | 'assistant';
  content: string;
  metadata: Record<string, any>;
  created_at: string;
}

export interface OnboardingData {
  full_name: string;
  current_education_level: string;
  field_of_study: string;
  gpa: number;
  test_scores: Record<string, number>;
  target_degree: string;
  preferred_countries: string[];
  preferred_fields: string[];
  budget_min: number;
  budget_max: number;
  exams_taken: string[];
  exams_planned: string[];
}
