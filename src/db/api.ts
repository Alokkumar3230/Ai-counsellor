import { supabase } from './supabase';
import type {
  Profile,
  University,
  ShortlistedUniversity,
  LockedUniversity,
  Task,
  ChatMessage,
  OnboardingData,
  UniversityCategory,
  UserStage,
} from '@/types';

// Profile APIs
export const getProfile = async (userId: string): Promise<Profile | null> => {
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .maybeSingle();

  if (error) throw error;
  return data;
};

export const updateProfile = async (
  userId: string,
  updates: Partial<Profile>
): Promise<Profile | null> => {
  const { data, error } = await supabase
    .from('profiles')
    .update(updates)
    .eq('id', userId)
    .select()
    .maybeSingle();

  if (error) throw error;
  return data;
};

export const completeOnboarding = async (
  userId: string,
  onboardingData: OnboardingData
): Promise<Profile | null> => {
  const { data, error } = await supabase
    .from('profiles')
    .update({
      ...onboardingData,
      onboarding_completed: true,
      current_stage: 'exploring',
    })
    .eq('id', userId)
    .select()
    .maybeSingle();

  if (error) throw error;
  return data;
};

export const updateUserStage = async (
  userId: string,
  stage: UserStage
): Promise<void> => {
  const { error } = await supabase
    .from('profiles')
    .update({ current_stage: stage })
    .eq('id', userId);

  if (error) throw error;
};

// University APIs
export const getUniversities = async (filters?: {
  countries?: string[];
  programs?: string[];
  budgetMax?: number;
}): Promise<University[]> => {
  let query = supabase.from('universities').select('*').order('ranking');

  if (filters?.countries && filters.countries.length > 0) {
    query = query.in('country', filters.countries);
  }

  if (filters?.programs && filters.programs.length > 0) {
    query = query.overlaps('programs', filters.programs);
  }

  if (filters?.budgetMax) {
    query = query.lte('tuition_fee_min', filters.budgetMax);
  }

  const { data, error } = await query;

  if (error) throw error;
  return Array.isArray(data) ? data : [];
};

export const getUniversity = async (id: string): Promise<University | null> => {
  const { data, error } = await supabase
    .from('universities')
    .select('*')
    .eq('id', id)
    .maybeSingle();

  if (error) throw error;
  return data;
};

export const searchUniversities = async (
  searchTerm: string
): Promise<University[]> => {
  const { data, error } = await supabase
    .from('universities')
    .select('*')
    .or(`name.ilike.%${searchTerm}%,country.ilike.%${searchTerm}%,city.ilike.%${searchTerm}%`)
    .order('ranking')
    .limit(20);

  if (error) throw error;
  return Array.isArray(data) ? data : [];
};

// Shortlist APIs
export const getShortlistedUniversities = async (
  userId: string
): Promise<ShortlistedUniversity[]> => {
  const { data, error } = await supabase
    .from('user_shortlisted_universities')
    .select('*, university:universities!user_shortlisted_universities_university_id_fkey(*)')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });

  if (error) throw error;
  return Array.isArray(data) ? data : [];
};

export const addToShortlist = async (
  userId: string,
  universityId: string,
  category: UniversityCategory,
  notes?: string
): Promise<void> => {
  const { error } = await supabase
    .from('user_shortlisted_universities')
    .insert({
      user_id: userId,
      university_id: universityId,
      category,
      notes: notes || null,
    });

  if (error) throw error;
};

export const removeFromShortlist = async (
  userId: string,
  universityId: string
): Promise<void> => {
  const { error } = await supabase
    .from('user_shortlisted_universities')
    .delete()
    .eq('user_id', userId)
    .eq('university_id', universityId);

  if (error) throw error;
};

export const updateShortlistCategory = async (
  userId: string,
  universityId: string,
  category: UniversityCategory
): Promise<void> => {
  const { error } = await supabase
    .from('user_shortlisted_universities')
    .update({ category })
    .eq('user_id', userId)
    .eq('university_id', universityId);

  if (error) throw error;
};

// Locked Universities APIs
export const getLockedUniversities = async (
  userId: string
): Promise<LockedUniversity[]> => {
  const { data, error } = await supabase
    .from('user_locked_universities')
    .select('*, university:universities!user_locked_universities_university_id_fkey(*)')
    .eq('user_id', userId)
    .order('locked_at', { ascending: false });

  if (error) throw error;
  return Array.isArray(data) ? data : [];
};

export const lockUniversity = async (
  userId: string,
  universityId: string
): Promise<void> => {
  const { error } = await supabase
    .from('user_locked_universities')
    .insert({
      user_id: userId,
      university_id: universityId,
    });

  if (error) throw error;

  // Update user stage to committed if not already
  const profile = await getProfile(userId);
  if (profile && profile.current_stage !== 'committed' && profile.current_stage !== 'applying') {
    await updateUserStage(userId, 'committed');
  }
};

export const unlockUniversity = async (
  userId: string,
  universityId: string
): Promise<void> => {
  const { error } = await supabase
    .from('user_locked_universities')
    .delete()
    .eq('user_id', userId)
    .eq('university_id', universityId);

  if (error) throw error;
};

// Tasks APIs
export const getTasks = async (userId: string): Promise<Task[]> => {
  const { data, error } = await supabase
    .from('tasks')
    .select('*, university:universities!tasks_university_id_fkey(*)')
    .eq('user_id', userId)
    .order('due_date', { ascending: true, nullsFirst: false })
    .order('created_at', { ascending: false });

  if (error) throw error;
  return Array.isArray(data) ? data : [];
};

export const createTask = async (
  userId: string,
  task: {
    title: string;
    description?: string;
    university_id?: string;
    due_date?: string;
    priority?: string;
  }
): Promise<Task | null> => {
  const { data, error } = await supabase
    .from('tasks')
    .insert({
      user_id: userId,
      title: task.title,
      description: task.description || null,
      university_id: task.university_id || null,
      due_date: task.due_date || null,
      priority: task.priority || 'medium',
    })
    .select()
    .maybeSingle();

  if (error) throw error;
  return data;
};

export const updateTask = async (
  taskId: string,
  updates: Partial<Task>
): Promise<void> => {
  const { error } = await supabase
    .from('tasks')
    .update(updates)
    .eq('id', taskId);

  if (error) throw error;
};

export const toggleTaskCompletion = async (
  taskId: string,
  completed: boolean
): Promise<void> => {
  const { error } = await supabase
    .from('tasks')
    .update({ completed })
    .eq('id', taskId);

  if (error) throw error;
};

export const deleteTask = async (taskId: string): Promise<void> => {
  const { error } = await supabase.from('tasks').delete().eq('id', taskId);

  if (error) throw error;
};

// Chat Messages APIs
export const getChatMessages = async (
  userId: string,
  limit = 50
): Promise<ChatMessage[]> => {
  const { data, error } = await supabase
    .from('chat_messages')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: true })
    .limit(limit);

  if (error) throw error;
  return Array.isArray(data) ? data : [];
};

export const createChatMessage = async (
  userId: string,
  role: 'user' | 'assistant',
  content: string,
  metadata?: Record<string, any>
): Promise<ChatMessage | null> => {
  const { data, error } = await supabase
    .from('chat_messages')
    .insert({
      user_id: userId,
      role,
      content,
      metadata: metadata || {},
    })
    .select()
    .maybeSingle();

  if (error) throw error;
  return data;
};
