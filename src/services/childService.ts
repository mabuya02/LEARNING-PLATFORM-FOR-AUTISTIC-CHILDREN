import { supabase, Child } from '../lib/supabase';

export const childService = {
  // Create a new child
  async createChild(childData: {
    name: string;
    age: number;
    parent_id: string;
    educator_id?: string;
    profile_settings?: Record<string, any>;
  }): Promise<Child> {
    const { data, error } = await supabase
      .from('children')
      .insert(childData)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  // Get children for a parent
  async getChildrenByParent(parentId: string): Promise<Child[]> {
    const { data, error } = await supabase
      .from('children')
      .select('*')
      .eq('parent_id', parentId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
  },

  // Get children for an educator
  async getChildrenByEducator(educatorId: string): Promise<Child[]> {
    const { data, error } = await supabase
      .from('children')
      .select('*')
      .eq('educator_id', educatorId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
  },

  // Get child by ID
  async getChildById(childId: string): Promise<Child | null> {
    const { data, error } = await supabase
      .from('children')
      .select('*')
      .eq('id', childId)
      .single();

    if (error) throw error;
    return data;
  },

  // Update child
  async updateChild(childId: string, updates: Partial<Child>): Promise<Child> {
    const { data, error } = await supabase
      .from('children')
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('id', childId)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  // Delete child
  async deleteChild(childId: string): Promise<void> {
    const { error } = await supabase
      .from('children')
      .delete()
      .eq('id', childId);

    if (error) throw error;
  },
};
