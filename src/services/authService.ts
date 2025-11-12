import { supabase } from '../lib/supabase';

export const authService = {
  // Sign up new user
  async signUp(email: string, password: string, name: string, role: 'parent' | 'educator' | 'admin') {
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email,
      password,
    });

    if (authError) throw authError;
    if (!authData.user) throw new Error('No user returned');

    // Create profile
    const { error: profileError } = await supabase
      .from('profiles')
      .insert({
        id: authData.user.id,
        email,
        name,
        role,
      });

    if (profileError) throw profileError;

    return authData;
  },

  // Sign in
  async signIn(email: string, password: string) {
    console.log('🔑 authService.signIn START');
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    console.log('🔑 signInWithPassword result:', { hasUser: !!data.user, error: error?.message });

    if (error) {
      console.error('🔑 Auth error:', error);
      throw error;
    }

    console.log('🔑 Fetching profile for user:', data.user.id);
    // Get profile
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', data.user.id)
      .single();

    console.log('🔑 Profile fetch result:', { hasProfile: !!profile, error: profileError?.message });

    if (profileError) {
      console.error('🔑 Profile error:', profileError);
      throw profileError;
    }

    console.log('🔑 authService.signIn END - success');
    return { user: data.user, profile };
  },

  // Sign out
  async signOut() {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
  },

  // Get current session
  async getSession() {
    const { data: { session } } = await supabase.auth.getSession();
    return session;
  },

  // Get current user profile
  async getCurrentProfile() {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return null;

    const { data: profile, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single();

    if (error) throw error;
    return profile;
  },
};
