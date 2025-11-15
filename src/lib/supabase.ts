import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables');
}

// Regular client for normal operations (uses anon key)
export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Types
export interface Profile {
  id: string;
  email: string;
  name: string;
  role: 'admin' | 'parent' | 'educator' | 'child';
  child_id?: string;
  first_login: boolean;
  created_at: string;
  updated_at: string;
}

export interface Child {
  id: string;
  name: string;
  age: number;
  parent_id: string;
  educator_id?: string;
  profile_settings: Record<string, any>;
  created_at: string;
  updated_at: string;
}

export interface LearningModule {
  id: string;
  title: string;
  description: string;
  type: 'visual' | 'audio' | 'interactive' | 'game';
  difficulty: 'easy' | 'medium' | 'hard';
  duration: number; // in minutes
  content: any;
  createdBy: string;
  ageGroup: string;
  videoUrl?: string;
}

export interface Progress {
  id: string;
  child_id: string;
  module_id: string;
  module_name: string;
  score: number;
  completed_at: string;
  time_spent: number;
  correct_answers: number;
  total_questions: number;
  created_at: string;
}
