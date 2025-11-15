import { supabase } from '../lib/supabase';
import { LearningModule } from '../App';

export const moduleService = {
  // Get all active modules
  async getModules(): Promise<LearningModule[]> {
    const { data, error } = await supabase
      .from('learning_modules')
      .select('*')
      .eq('is_active', true)
      .order('created_at', { ascending: true });

    if (error) throw error;
    
    // Map database columns to camelCase
    return (data || []).map(module => ({
      id: module.id,
      title: module.title,
      description: module.description || '',
      type: module.type,
      difficulty: module.difficulty,
      duration: module.duration || 10,
      ageGroup: module.age_group || '3-10',
      content: module.content || {},
      createdBy: module.created_by,
      videoUrl: module.video_url || ''
    }));
  },

  // Get module by ID
  async getModuleById(id: string): Promise<LearningModule | null> {
    const { data, error } = await supabase
      .from('learning_modules')
      .select('*')
      .eq('id', id)
      .single();

    if (error) throw error;
    if (!data) return null;
    
    // Map database columns to camelCase
    return {
      id: data.id,
      title: data.title,
      description: data.description || '',
      type: data.type,
      difficulty: data.difficulty,
      duration: data.duration || 10,
      ageGroup: data.age_group || '3-10',
      content: data.content || {},
      createdBy: data.created_by,
      videoUrl: data.video_url || ''
    };
  },

  // Get modules by type
  async getModulesByType(type: string): Promise<LearningModule[]> {
    const { data, error } = await supabase
      .from('learning_modules')
      .select('*')
      .eq('type', type)
      .eq('is_active', true);

    if (error) throw error;
    
    // Map database columns to camelCase
    return (data || []).map(module => ({
      id: module.id,
      title: module.title,
      description: module.description || '',
      type: module.type,
      difficulty: module.difficulty,
      duration: module.duration || 10,
      ageGroup: module.age_group || '3-10',
      content: module.content || {},
      createdBy: module.created_by,
      videoUrl: module.video_url || ''
    }));
  },

  // Create a new module
  async createModule(module: Omit<LearningModule, 'id'>): Promise<LearningModule> {
    const { data, error } = await supabase
      .from('learning_modules')
      .insert([{
        title: module.title,
        description: module.description,
        type: module.type,
        difficulty: module.difficulty,
        duration: module.duration,
        age_group: module.ageGroup,
        content: module.content,
        created_by: module.createdBy,
        video_url: module.videoUrl || null,
        is_active: true
      }])
      .select()
      .single();

    if (error) throw error;
    
    // Map database columns to camelCase
    return {
      id: data.id,
      title: data.title,
      description: data.description,
      type: data.type,
      difficulty: data.difficulty,
      duration: data.duration,
      ageGroup: data.age_group,
      content: data.content,
      createdBy: data.created_by,
      videoUrl: data.video_url
    };
  },

  // Update a module
  async updateModule(id: string, updates: Partial<LearningModule>): Promise<LearningModule> {
    const updateData: any = {};
    
    if (updates.title !== undefined) updateData.title = updates.title;
    if (updates.description !== undefined) updateData.description = updates.description;
    if (updates.type !== undefined) updateData.type = updates.type;
    if (updates.difficulty !== undefined) updateData.difficulty = updates.difficulty;
    if (updates.duration !== undefined) updateData.duration = updates.duration;
    if (updates.ageGroup !== undefined) updateData.age_group = updates.ageGroup;
    if (updates.content !== undefined) updateData.content = updates.content;
    if (updates.videoUrl !== undefined) updateData.video_url = updates.videoUrl;

    const { data, error } = await supabase
      .from('learning_modules')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    
    // Map database columns to camelCase
    return {
      id: data.id,
      title: data.title,
      description: data.description,
      type: data.type,
      difficulty: data.difficulty,
      duration: data.duration,
      ageGroup: data.age_group,
      content: data.content,
      createdBy: data.created_by,
      videoUrl: data.video_url
    };
  },

  // Delete a module (soft delete by setting is_active to false)
  async deleteModule(id: string): Promise<void> {
    const { error } = await supabase
      .from('learning_modules')
      .update({ is_active: false })
      .eq('id', id);

    if (error) throw error;
  },
};
