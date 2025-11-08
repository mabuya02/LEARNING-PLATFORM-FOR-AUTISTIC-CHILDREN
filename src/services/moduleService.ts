import { supabase, LearningModule } from '../lib/supabase';

export const moduleService = {
  // Get all active modules
  async getModules(): Promise<LearningModule[]> {
    const { data, error } = await supabase
      .from('learning_modules')
      .select('*')
      .eq('is_active', true)
      .order('created_at', { ascending: true });

    if (error) throw error;
    return data || [];
  },

  // Get module by ID
  async getModuleById(id: string): Promise<LearningModule | null> {
    const { data, error } = await supabase
      .from('learning_modules')
      .select('*')
      .eq('id', id)
      .single();

    if (error) throw error;
    return data;
  },

  // Get modules by type
  async getModulesByType(type: string): Promise<LearningModule[]> {
    const { data, error } = await supabase
      .from('learning_modules')
      .select('*')
      .eq('type', type)
      .eq('is_active', true);

    if (error) throw error;
    return data || [];
  },
};
