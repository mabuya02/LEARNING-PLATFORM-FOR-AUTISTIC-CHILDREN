import { supabase } from '../lib/supabase';

export interface AdminUserData {
  id: string;
  name: string;
  email: string;
  role: 'admin' | 'educator' | 'parent' | 'child';
  childId?: string;
}

/**
 * Get all users (profiles) from the database
 * Admin only - fetches all user profiles with parent-child relationships
 */
export async function getAllUsers(): Promise<AdminUserData[]> {
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching all users:', error);
    throw error;
  }

  // Fetch all children records to get parent-child relationships
  const { data: childrenData, error: childrenError } = await supabase
    .from('children')
    .select('id, parent_id, name');

  if (childrenError) {
    console.error('Error fetching children relationships:', childrenError);
  } else {
    console.log('📊 Loaded children records:', childrenData?.length || 0);
    if (childrenData && childrenData.length > 0) {
      console.log('🔗 Parent-child mappings:', childrenData.map(c => ({
        childName: c.name,
        childId: c.id,
        parentId: c.parent_id
      })));
    }
  }

  // Create a map of parent_id -> child_id for quick lookup
  const parentChildMap = new Map<string, string>();
  if (childrenData) {
    childrenData.forEach(child => {
      if (child.parent_id) {
        parentChildMap.set(child.parent_id, child.id);
      }
    });
  }

  console.log('👨‍👩‍👧 Parent-child map size:', parentChildMap.size);

  return data.map(profile => ({
    id: profile.id,
    name: profile.name,
    email: profile.email,
    role: profile.role as 'admin' | 'educator' | 'parent' | 'child',
    childId: parentChildMap.get(profile.id) // Get linked child if this user is a parent
  }));
}

/**
 * Create a new user with Supabase Auth and Profile
 * Admin only - creates user account and profile
 * Supports parent-child linking and educator assignments
 * Sends email with temporary password
 */
export async function createUser(userData: {
  email: string;
  password: string;
  name: string;
  role: 'admin' | 'educator' | 'parent' | 'child';
  childId?: string; // For parent role - existing child to link
  parentId?: string; // For child role - parent to link to
  educatorId?: string; // For child role - educator to assign
}): Promise<AdminUserData> {
  console.log('🔧 Creating user:', userData.email, 'Role:', userData.role);
  
  // First, create the auth user with email confirmation disabled for admin-created users
  const { data: authData, error: authError } = await supabase.auth.signUp({
    email: userData.email,
    password: userData.password,
    options: {
      emailRedirectTo: `${window.location.origin}/login`,
      data: {
        name: userData.name,
        role: userData.role,
        temp_password: true // Flag to force password reset on first login
      }
    }
  });

  if (authError || !authData.user) {
    console.error('Error creating auth user:', authError);
    throw authError || new Error('Failed to create user');
  }

  console.log('✅ Auth user created:', authData.user.id);
  console.log('🔐 User metadata set:', {
    temp_password: authData.user.user_metadata.temp_password,
    name: authData.user.user_metadata.name,
    role: authData.user.user_metadata.role
  });

  // Then create the profile
  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .insert({
      id: authData.user.id,
      email: userData.email,
      name: userData.name,
      role: userData.role,
    })
    .select()
    .single();

  if (profileError) {
    console.error('Error creating profile:', profileError);
    // Try to delete the auth user if profile creation fails
    await supabase.auth.admin.deleteUser(authData.user.id);
    throw profileError;
  }

  console.log('✅ Profile created');

  // Handle role-specific setup
  if (userData.role === 'child') {
    // Create child record
    const childData: any = {
      id: authData.user.id,
      name: userData.name,
      age: 5, // Default age, can be updated later
      parent_id: userData.parentId || null,
      educator_id: userData.educatorId || null,
      profile_settings: {},
      unlocked_difficulties: ['easy'],
      total_stars: 0
    };

    const { error: childError } = await supabase
      .from('children')
      .insert(childData);

    if (childError) {
      console.error('Error creating child record:', childError);
      // Don't throw, just log - profile is created
    } else {
      console.log('✅ Child record created');
    }

    // Create parent-educator assignment if educator specified
    if (userData.educatorId) {
      const { error: assignmentError } = await supabase
        .from('parent_educator_assignments')
        .insert({
          educator_id: userData.educatorId,
          child_id: authData.user.id,
          is_active: true
        });

      if (assignmentError) {
        console.warn('Warning creating educator assignment:', assignmentError);
      } else {
        console.log('✅ Educator assignment created');
      }
    }
  } else if (userData.role === 'parent' && userData.childId) {
    // Link parent to existing child
    const { error: updateError } = await supabase
      .from('children')
      .update({ parent_id: authData.user.id })
      .eq('id', userData.childId);

    if (updateError) {
      console.error('Error linking parent to child:', updateError);
    } else {
      console.log('✅ Parent linked to child');
    }
  }

  return {
    id: profile.id,
    name: profile.name,
    email: profile.email,
    role: profile.role as 'admin' | 'educator' | 'parent' | 'child',
    childId: userData.childId
  };
}

/**
 * Update an existing user's profile
 * Admin only - updates user profile information
 */
export async function updateUser(userId: string, updates: {
  name?: string;
  email?: string;
  role?: 'admin' | 'educator' | 'parent' | 'child';
  childId?: string; // For parent role - link to child
}): Promise<AdminUserData> {
  const updateData: any = {};
  
  if (updates.name) updateData.name = updates.name;
  if (updates.email) updateData.email = updates.email;
  if (updates.role) updateData.role = updates.role;

  const { data, error } = await supabase
    .from('profiles')
    .update(updateData)
    .eq('id', userId)
    .select()
    .single();

  if (error) {
    console.error('Error updating user:', error);
    throw error;
  }

  // Handle parent-child linking if childId is provided
  if (updates.childId !== undefined) {
    console.log('🔗 Updating parent-child relationship:', {
      parentId: userId,
      childId: updates.childId
    });

    if (updates.childId) {
      // Link the child to this parent
      console.log('📌 Linking child to parent...');
      const { data: linkData, error: childUpdateError } = await supabase
        .from('children')
        .update({ parent_id: userId })
        .eq('id', updates.childId)
        .select();

      if (childUpdateError) {
        console.error('❌ Error linking child to parent:', childUpdateError);
        throw new Error(`Failed to link child: ${childUpdateError.message}`);
      } else {
        console.log('✅ Child linked to parent successfully:', linkData);
      }
    } else {
      // Note: Cannot set parent_id to null because schema has NOT NULL constraint
      // This would require removing the child record or reassigning to another parent
      console.warn('⚠️ Cannot unlink child - parent_id is required in schema');
      // We'll just skip the unlinking for now
    }
  }

  return {
    id: data.id,
    name: data.name,
    email: data.email,
    role: data.role as 'admin' | 'educator' | 'parent' | 'child',
    childId: updates.childId,
  };
}

/**
 * Delete a user completely - removes all related records and auth account
 * Admin only - comprehensive user deletion
 * 
 * Deletion order (to respect foreign key constraints):
 * 1. Progress records
 * 2. Module completions
 * 3. Sessions
 * 4. Parent-educator assignments
 * 5. Children records (if user is a child or has children)
 * 6. Profile
 * 7. Auth user (using admin API)
 */
export async function deleteUser(userId: string): Promise<void> {
  try {
    console.log(`🗑️ Starting deletion process for user: ${userId}`);

    // Step 1: Delete progress records
    const { error: progressError } = await supabase
      .from('progress')
      .delete()
      .eq('child_id', userId);
    
    if (progressError) {
      console.warn('Warning deleting progress:', progressError);
      // Continue anyway as this might not exist
    }

    // Step 2: Delete module completions
    const { error: completionsError } = await supabase
      .from('module_completions')
      .delete()
      .eq('child_id', userId);
    
    if (completionsError) {
      console.warn('Warning deleting module completions:', completionsError);
    }

    // Step 3: Delete sessions
    const { error: sessionsError } = await supabase
      .from('sessions')
      .delete()
      .eq('child_id', userId);
    
    if (sessionsError) {
      console.warn('Warning deleting sessions:', sessionsError);
    }

    // Step 4: Delete parent-educator assignments where user is educator
    const { error: assignmentsError } = await supabase
      .from('parent_educator_assignments')
      .delete()
      .eq('educator_id', userId);
    
    if (assignmentsError) {
      console.warn('Warning deleting assignments:', assignmentsError);
    }

    // Step 5: Check if this user is a parent and delete their children's records
    const { data: childrenData } = await supabase
      .from('children')
      .select('id')
      .eq('parent_id', userId);

    if (childrenData && childrenData.length > 0) {
      for (const child of childrenData) {
        // Delete child's progress
        await supabase.from('progress').delete().eq('child_id', child.id);
        await supabase.from('module_completions').delete().eq('child_id', child.id);
        await supabase.from('sessions').delete().eq('child_id', child.id);
      }
    }

    // Step 6: Delete children records (if user is parent or is a child themselves)
    const { error: childrenError } = await supabase
      .from('children')
      .delete()
      .or(`parent_id.eq.${userId},id.eq.${userId}`);
    
    if (childrenError) {
      console.warn('Warning deleting children records:', childrenError);
    }

    // Step 7: Delete the profile
    const { error: profileError } = await supabase
      .from('profiles')
      .delete()
      .eq('id', userId);

    if (profileError) {
      console.error('Error deleting profile:', profileError);
      throw new Error(`Failed to delete user profile: ${profileError.message}`);
    }

    console.log(`✅ Profile and related records deleted for user: ${userId}`);

    // Step 8: Delete the auth user via Edge Function
    // This keeps the service role key secure on the server-side
    try {
      const { data, error: functionError } = await supabase.functions.invoke('delete-auth-user', {
        body: { userId }
      });

      if (functionError) {
        console.error('❌ Error calling delete-auth-user function:', functionError);
        throw new Error(`Failed to delete auth user: ${functionError.message}`);
      }

      if (!data?.success) {
        console.error('❌ Delete auth user function returned error:', data?.error);
        throw new Error(`Failed to delete auth user: ${data?.error || 'Unknown error'}`);
      }
      
      console.log(`✅ Auth user deleted successfully via Edge Function: ${userId}`);
    } catch (error) {
      console.error('❌ Exception calling delete-auth-user function:', error);
      throw new Error(`Failed to delete auth user: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }

  } catch (error) {
    console.error('❌ Error during user deletion:', error);
    throw error;
  }
}

/**
 * Get all progress records across all users and modules
 * Admin only - for analytics and monitoring
 */
export async function getAllProgress() {
  const { data, error } = await supabase
    .from('progress')
    .select(`
      *,
      child:children(name),
      module:learning_modules(title, type)
    `)
    .order('completed_at', { ascending: false });

  if (error) {
    console.error('Error fetching all progress:', error);
    throw error;
  }

  return data;
}

/**
 * Get summary statistics for admin dashboard
 * Total users, modules, completed sessions, etc.
 */
export async function getAdminStats() {
  // Get total users count
  const { count: usersCount, error: usersError } = await supabase
    .from('profiles')
    .select('*', { count: 'exact', head: true });

  // Get total modules count
  const { count: modulesCount, error: modulesError } = await supabase
    .from('learning_modules')
    .select('*', { count: 'exact', head: true });

  // Get total progress records
  const { count: progressCount, error: progressError } = await supabase
    .from('progress')
    .select('*', { count: 'exact', head: true });

  // Get total children count
  const { count: childrenCount, error: childrenError } = await supabase
    .from('children')
    .select('*', { count: 'exact', head: true });

  if (usersError || modulesError || progressError || childrenError) {
    console.error('Error fetching stats:', { usersError, modulesError, progressError, childrenError });
    throw usersError || modulesError || progressError || childrenError;
  }

  return {
    totalUsers: usersCount || 0,
    totalModules: modulesCount || 0,
    totalProgress: progressCount || 0,
    totalChildren: childrenCount || 0,
  };
}

/**
 * Get all children (for parent linking dropdown)
 * Returns children with or without parents
 */
export async function getAllChildren() {
  const { data, error } = await supabase
    .from('children')
    .select('id, name, parent_id, educator_id')
    .order('name', { ascending: true });

  if (error) {
    console.error('Error fetching children:', error);
    throw error;
  }

  return data;
}

/**
 * Get all educators (for educator assignment dropdown)
 */
export async function getAllEducators() {
  const { data, error } = await supabase
    .from('profiles')
    .select('id, name, email')
    .eq('role', 'educator')
    .order('name', { ascending: true });

  if (error) {
    console.error('Error fetching educators:', error);
    throw error;
  }

  return data;
}

export const adminService = {
  getAllUsers,
  createUser,
  updateUser,
  deleteUser,
  getAllProgress,
  getAdminStats,
  getAllChildren,
  getAllEducators,
};
