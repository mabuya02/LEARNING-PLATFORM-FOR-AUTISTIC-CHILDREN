import { supabase, Progress } from '../lib/supabase';

export const progressService = {
  // Save progress
  async saveProgress(progressData: {
    child_id: string;
    module_id: string;
    module_name: string;
    score: number;
    time_spent: number;
    correct_answers: number;
    total_questions: number;
  }): Promise<Progress> {
    const { data, error } = await supabase
      .from('progress')
      .insert(progressData)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  // Get progress for a child
  async getProgressByChild(childId: string): Promise<Progress[]> {
    const { data, error } = await supabase
      .from('progress')
      .select('*')
      .eq('child_id', childId)
      .order('completed_at', { ascending: false });

    if (error) throw error;
    return data || [];
  },

  // Get progress for a specific module and child
  async getProgressByModuleAndChild(moduleId: string, childId: string): Promise<Progress[]> {
    const { data, error } = await supabase
      .from('progress')
      .select('*')
      .eq('child_id', childId)
      .eq('module_id', moduleId)
      .order('completed_at', { ascending: false });

    if (error) throw error;
    return data || [];
  },

  // Get analytics for a child
  async getChildAnalytics(childId: string) {
    const { data, error } = await supabase
      .from('progress')
      .select('*')
      .eq('child_id', childId);

    if (error) throw error;

    const progress = data || [];
    
    // Calculate statistics
    const totalModulesCompleted = progress.length;
    const averageScore = progress.length > 0
      ? progress.reduce((sum, p) => sum + p.score, 0) / progress.length
      : 0;
    const totalTimeSpent = progress.reduce((sum, p) => sum + p.time_spent, 0);
    const accuracyRate = progress.length > 0
      ? progress.reduce((sum, p) => {
          const rate = p.total_questions > 0 ? (p.correct_answers / p.total_questions) * 100 : 0;
          return sum + rate;
        }, 0) / progress.length
      : 0;

    return {
      totalModulesCompleted,
      averageScore: Math.round(averageScore),
      totalTimeSpent,
      accuracyRate: Math.round(accuracyRate),
      recentProgress: progress.slice(0, 10),
    };
  },
};
