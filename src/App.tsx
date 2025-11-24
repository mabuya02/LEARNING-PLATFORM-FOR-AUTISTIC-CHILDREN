import { useState, useEffect } from 'react';
import { AuthScreen } from './components/AuthScreen';
import { EducatorDashboard } from './components/EducatorDashboard';
import { ParentDashboard } from './components/ParentDashboard';
import { ChildInterface } from './components/ChildInterface';
import { AdminDashboard } from './components/AdminDashboard';
import { PasswordResetModal } from './components/PasswordResetModal';
import { ResetPasswordPage } from './components/ResetPasswordPage';
import { Toaster } from './components/ui/sonner';
import { toast } from 'sonner';
import { supabase } from './lib/supabase';
import { authService } from './services/authService';
import { moduleService } from './services/moduleService';
import { progressService } from './services/progressService';
import { childService } from './services/childService';
import { adminService } from './services/adminService';

export type UserRole = 'educator' | 'parent' | 'child' | 'admin';

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  childId?: string; // For parents, links to their child
  educatorId?: string; // For children, links to their educator
}

export interface UserCredentials {
  email: string;
  password: string;
  role: UserRole;
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
  videoUrl?: string; // Optional video URL for the module
  questions?: Question[];
}

export interface Question {
  id: string;
  text: string;
  options: string[];
  correctAnswer: number; // index of the correct option
}

export interface ProgressData {
  moduleId: string;
  childId: string;
  moduleName?: string;
  startTime: Date;
  endTime?: Date;
  attentionSpan: number; // in seconds
  completionRate: number; // percentage
  correctAnswers?: number;
  totalQuestions?: number;
  engagementLevel: 'low' | 'medium' | 'high';
}

export default function App() {
  const [user, setUser] = useState<User | null>(null);
  const [userProfile, setUserProfile] = useState<any>(null);
  const [learningModules, setLearningModules] = useState<LearningModule[]>([]);
  const [progressData, setProgressData] = useState<ProgressData[]>([]);
  const [children, setChildren] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Admin-specific state
  const [allUsers, setAllUsers] = useState<User[]>([]);
  const [allProgress, setAllProgress] = useState<ProgressData[]>([]);

  // Password reset state
  const [showPasswordReset, setShowPasswordReset] = useState(false);
  const [tempPasswordEmail, setTempPasswordEmail] = useState<string>('');
  const [isLoggingIn, setIsLoggingIn] = useState(false); // Flag to prevent auth state change interference
  const [showResetPasswordPage, setShowResetPasswordPage] = useState(false);

  // Load modules on app initialization
  useEffect(() => {
    loadInitialModules();
  }, []);

  // Load modules for all users (including non-authenticated children)
  const loadInitialModules = async () => {
    try {
      console.log('📚 Loading initial modules...');
      const modules = await moduleService.getModules();
      setLearningModules(modules);
      console.log('✅ Loaded', modules.length, 'modules');
    } catch (error) {
      console.error('❌ Error loading initial modules:', error);
      // Fallback to empty array if module loading fails
      setLearningModules([]);
    }
  };

  // Refresh modules (can be called after user login or module changes)
  const refreshModules = async () => {
    try {
      console.log('🔄 Refreshing modules...');
      const modules = await moduleService.getModules();
      setLearningModules(modules);
      console.log('📚 Refreshed modules:', modules.length);
      if (modules.length > 0) {
        console.log('🎬 Sample module with video:', modules.find(m => m.videoUrl));
      }
    } catch (error) {
      console.error('❌ Error refreshing modules:', error);
    }
  };

  // Check for existing session on mount
  useEffect(() => {
    checkSession();
    
    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
      console.log('🔄 Auth state changed:', _event, 'Session exists:', !!session, 'isLoggingIn:', isLoggingIn);
      
      // Handle password recovery event (from email reset link)
      if (_event === 'PASSWORD_RECOVERY') {
        console.log('🔑 Password recovery detected - showing reset password page');
        setShowResetPasswordPage(true);
        setLoading(false);
        return;
      }

      // If we're showing reset password page, ignore other auth events
      if (showResetPasswordPage) {
        console.log('⏭️ Skipping auth state change - reset password page is active');
        return;
      }
      
      // Skip if we're in the middle of a login process
      if (isLoggingIn) {
        console.log('⏭️ Skipping auth state change - login in progress');
        return;
      }
      
      if (session?.user) {
        // Only handle first_login for INITIAL_SESSION (email confirmation redirect)
        // Not for SIGNED_IN during normal login
        if (_event === 'INITIAL_SESSION' || _event === 'USER_UPDATED') {
          const profile = await authService.getCurrentProfile();
          console.log('👤 Profile loaded in auth state change:', profile);
          
          if (profile?.first_login === true) {
            console.log('⚠️ First login detected in auth state change - showing password reset modal');
            setTempPasswordEmail(profile.email);
            setShowPasswordReset(true);
            // Set minimal user state to allow modal to render
            setUser({
              id: profile.id,
              name: profile.name,
              email: profile.email,
              role: profile.role,
              childId: profile.child_id
            });
            setLoading(false);
          } else if (_event === 'INITIAL_SESSION') {
            // Normal session restoration
            await loadUserData(session.user.id);
          }
        }
      } else {
        setUser(null);
        setUserProfile(null);
        setLoading(false);
      }
    });

    return () => subscription.unsubscribe();
  }, [isLoggingIn]);

  // Check for existing session
  const checkSession = async () => {
    if (isLoggingIn || showResetPasswordPage) {
      console.log('⏭️ Skipping checkSession - login in progress or reset password page active');
      return;
    }
    
    try {
      console.log('🔍 Checking existing session...');
      const session = await authService.getSession();
      
      if (session?.user) {
        console.log('✅ Session found for user:', session.user.id);
        
        // Get the user's profile to check first_login flag
        const profile = await authService.getCurrentProfile();
        console.log('👤 Profile loaded in checkSession:', profile);
        
        if (profile?.first_login === true) {
          console.log('⚠️ First login detected in checkSession - showing password reset modal');
          setTempPasswordEmail(profile.email);
          setShowPasswordReset(true);
          // Set minimal user state to allow modal to render
          setUser({
            id: profile.id,
            name: profile.name,
            email: profile.email,
            role: profile.role,
            childId: profile.child_id
          });
        } else {
          console.log('✅ Not first login, loading full user data');
          await loadUserData(session.user.id);
        }
      } else {
        console.log('ℹ️ No session found');
      }
    } catch (error) {
      console.error('❌ Error checking session:', error);
    } finally {
      setLoading(false);
    }
  };

  // Load user data from Supabase
  const loadUserData = async (userId: string) => {
    try {
      console.log('📊 Loading user data for userId:', userId);
      const profile = await authService.getCurrentProfile();
      console.log('👤 Retrieved profile:', profile);
      
      if (profile) {
        setUserProfile(profile);
        const userObj = {
          id: profile.id,
          name: profile.name,
          email: profile.email,
          role: profile.role,
          childId: profile.child_id
        };
        setUser(userObj);
        console.log('✅ User state set:', userObj);

        // Load modules (they should already be loaded from initialization, but refresh them)
        await refreshModules();

        // Load admin-specific data
        if (profile.role === 'admin') {
          console.log('👑 Loading admin-specific data...');
          
          // Load all users for admin
          const users = await adminService.getAllUsers();
          setAllUsers(users);
          console.log('✅ Loaded all users:', users.length);
          
          // Load all progress for admin
          const allProgressData = await adminService.getAllProgress();
          const mappedAllProgress = allProgressData.map((p: any) => ({
            moduleId: p.module_id,
            childId: p.child_id,
            moduleName: p.module_name,
            startTime: new Date(p.created_at),
            endTime: new Date(p.completed_at),
            attentionSpan: p.time_spent,
            completionRate: (p.correct_answers / p.total_questions) * 100 || 0,
            correctAnswers: p.correct_answers,
            totalQuestions: p.total_questions,
            engagementLevel: p.score > 80 ? 'high' : p.score > 50 ? 'medium' : 'low'
          } as ProgressData));
          setAllProgress(mappedAllProgress);
          console.log('✅ Loaded all progress:', mappedAllProgress.length);
        }
        // Load children if parent or educator
        else if (profile.role === 'parent' || profile.role === 'educator') {
          console.log('👨‍👩‍👧 Loading children for parent/educator...');
          const childrenData = profile.role === 'parent'
            ? await childService.getChildrenByParent(profile.id)
            : await childService.getChildrenByEducator(profile.id);
          setChildren(childrenData);
          console.log('✅ Loaded children:', childrenData.length);
          
          // For parents, update the user object with the first child's ID
          if (profile.role === 'parent' && childrenData.length > 0) {
            const updatedUserObj = {
              ...userObj,
              childId: childrenData[0].id
            };
            setUser(updatedUserObj);
            console.log('✅ Updated parent user with childId:', childrenData[0].id);
          }

          // Load progress for ALL children (not just the first one)
          if (childrenData.length > 0) {
            const allProgress: ProgressData[] = [];
            
            // Fetch progress for each child
            for (const child of childrenData) {
              try {
                const progress = await progressService.getProgressByChild(child.id);
                const mappedProgress = progress.map(p => ({
                  moduleId: p.module_id,
                  childId: p.child_id,
                  moduleName: p.module_name,
                  startTime: new Date(p.created_at),
                  endTime: new Date(p.completed_at),
                  attentionSpan: p.time_spent,
                  completionRate: (p.correct_answers / p.total_questions) * 100 || 0,
                  correctAnswers: p.correct_answers,
                  totalQuestions: p.total_questions,
                  engagementLevel: p.score > 80 ? 'high' : p.score > 50 ? 'medium' : 'low'
                } as ProgressData));
                allProgress.push(...mappedProgress);
              } catch (error) {
                console.error(`❌ Error loading progress for child ${child.id}:`, error);
              }
            }
            
            setProgressData(allProgress);
            console.log('✅ Loaded progress data for all children:', allProgress.length);
          }
        }
        // Child user - load their progress data
        else if (profile.role === 'child') {
          console.log('👶 Child user logged in - loading progress data...');
          try {
            // For child users, we need to find their child record to get progress
            // The user.id is the auth user ID, but progress is linked to child_id
            const childId = profile.child_id || profile.id; // Use child_id if available, otherwise use user ID as fallback
            
            const progress = await progressService.getProgressByChild(childId);
            const mappedProgress = progress.map(p => ({
              moduleId: p.module_id,
              childId: p.child_id,
              moduleName: p.module_name,
              startTime: new Date(p.created_at),
              endTime: new Date(p.completed_at),
              attentionSpan: p.time_spent,
              completionRate: (p.correct_answers / p.total_questions) * 100 || 0,
              correctAnswers: p.correct_answers,
              totalQuestions: p.total_questions,
              engagementLevel: p.score > 80 ? 'high' : p.score > 50 ? 'medium' : 'low'
            } as ProgressData));
            setProgressData(mappedProgress);
            console.log('✅ Loaded child progress data:', mappedProgress.length);
          } catch (error) {
            console.error('❌ Error loading child progress:', error);
            // Continue without progress data - not critical
          }
        }
        
        console.log('🎉 User data loading complete!');
      } else {
        console.warn('⚠️ No profile found for userId:', userId);
      }
    } catch (error) {
      console.error('❌ Error loading user data:', error);
      throw error; // Re-throw so handleLogin can catch it
    }
  };

  // Mock user database
  const [mockUsers, setMockUsers] = useState<User[]>([
    {
      id: 'admin1',
      name: 'Admin User',
      email: 'admin@system.com',
      role: 'admin'
    },
    {
      id: 'educator1',
      name: 'Sarah Johnson',
      email: 'sarah@school.edu',
      role: 'educator'
    },
    {
      id: 'educator2',
      name: 'Dr. Michael Brown',
      email: 'michael@school.edu',
      role: 'educator'
    },
    {
      id: 'parent1',
      name: 'Mike Wilson',
      email: 'mike@email.com',
      role: 'parent',
      childId: 'child1'
    },
    {
      id: 'parent2',
      name: 'Lisa Chen',
      email: 'lisa@email.com',
      role: 'parent',
      childId: 'child2'
    },
    {
      id: 'child1',
      name: 'Emma Wilson',
      email: 'emma@kids.com',
      role: 'child'
    },
    {
      id: 'child2',
      name: 'Alex Chen',
      email: 'alex@kids.com',
      role: 'child'
    }
  ]);

  const mockCredentials = [
    { email: 'admin@system.com', password: 'admin123', role: 'admin' as UserRole },
    { email: 'sarah@school.edu', password: 'educator123', role: 'educator' as UserRole },
    { email: 'michael@school.edu', password: 'educator123', role: 'educator' as UserRole },
    { email: 'mike@email.com', password: 'parent123', role: 'parent' as UserRole },
    { email: 'lisa@email.com', password: 'parent123', role: 'parent' as UserRole },
    { email: 'emma@kids.com', password: 'child123', role: 'child' as UserRole },
    { email: 'alex@kids.com', password: 'child123', role: 'child' as UserRole }
  ];

  // This useEffect will be handled by loadUserData when user logs in
  // Modules are now loaded dynamically from the database

  const handleLogin = async (credentials: UserCredentials): Promise<User | null> => {
    console.log('🚀 handleLogin START - setting isLoggingIn to true');
    setIsLoggingIn(true); // Prevent auth state change interference
    try {
      console.log('🔐 Attempting login with:', credentials.email);
      
      console.log('📞 Calling authService.signIn...');
      
      // Add timeout to detect if it's hanging
      const signInPromise = authService.signIn(credentials.email, credentials.password);
      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Login timeout - taking too long')), 10000)
      );
      
      const { user: authUser, profile } = await Promise.race([signInPromise, timeoutPromise]) as any;
      
      console.log('✅ authService.signIn completed', { authUser: authUser?.id, profile: profile?.id });

      console.log('✅ Auth successful, loading user data...', profile);
      
      // Check if this is user's first login
      console.log('🔍 Checking first_login flag:', {
        isFirstLogin: profile.first_login,
        userId: profile.id
      });
      const isFirstLogin = profile.first_login === true;

      // Create user object
      const userObj: User = {
        id: profile.id,
        name: profile.name,
        email: profile.email,
        role: profile.role,
        childId: profile.child_id
      };
      console.log('👤 Created user object:', userObj);

      if (isFirstLogin) {
        console.log('⚠️ First login detected, showing password reset modal');
        setTempPasswordEmail(credentials.email);
        setShowPasswordReset(true);
        setUser(userObj); // Set user so modal can render properly
        console.log('🏁 handleLogin END (first login) - setting isLoggingIn to false');
        setIsLoggingIn(false);
        return userObj;
      } else {
        console.log('✅ Not first login, proceeding with normal login');
      }
      
      console.log('📥 Calling loadUserData...');
      // Load user profile and data
      await loadUserData(authUser.id);
      
      console.log('🏁 handleLogin END (normal login) - setting isLoggingIn to false');
      // Return the user object from profile
      setIsLoggingIn(false);
      return userObj;
    } catch (error) {
      console.error('❌ Login error:', error);
      console.error('❌ Error details:', {
        message: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined,
        error: error
      });
      console.log('🏁 handleLogin END (error) - setting isLoggingIn to false');
      setIsLoggingIn(false);
      return null;
    }
  };

  const handleLogout = async () => {
    try {
      await authService.signOut();
      setUser(null);
      setUserProfile(null);
      setAllUsers([]);
      setAllProgress([]);
      setLearningModules([]);
      setProgressData([]);
      setChildren([]);
      console.log('✅ Logged out successfully');
    } catch (error) {
      console.error('❌ Logout error:', error);
    }
  };

  const updateUser = async (updatedUser: User) => {
    try {
      await adminService.updateUser(updatedUser.id, {
        name: updatedUser.name,
        email: updatedUser.email,
        role: updatedUser.role,
        childId: updatedUser.childId, // Include childId for parent-child linking
      });
      
      // Reload all users
      const users = await adminService.getAllUsers();
      setAllUsers(users);
      
      // Update current user if it's the same
      if (user && user.id === updatedUser.id) {
        setUser(updatedUser);
      }
      
      console.log('✅ User updated successfully');
      toast.success('User updated successfully!');
    } catch (error) {
      console.error('❌ Error updating user:', error);
      toast.error('Failed to update user. Please try again.');
    }
  };

  const deleteUser = async (userId: string) => {
    try {
      await adminService.deleteUser(userId);
      
      // Reload all users
      const users = await adminService.getAllUsers();
      setAllUsers(users);
      
      console.log('✅ User deleted successfully');
      toast.success('User deleted successfully!');
    } catch (error) {
      console.error('❌ Error deleting user:', error);
      toast.error('Failed to delete user. Please try again.');
    }
  };

  const addUser = async (newUser: Omit<User, 'id'> & { childId?: string; parentId?: string; educatorId?: string }) => {
    try {
      // Generate a default password
      const defaultPassword = 'ChangeMe123!';
      
      const createdUser = await adminService.createUser({
        email: newUser.email,
        password: defaultPassword,
        name: newUser.name,
        role: newUser.role,
        childId: newUser.childId,
        parentId: newUser.parentId,
        educatorId: newUser.educatorId,
      });
      
      // Reload all users
      const users = await adminService.getAllUsers();
      setAllUsers(users);
      
      console.log('✅ User created successfully');
      toast.success('User created successfully!', {
        duration: 4000,
        description: 'The user account has been created and an email with temporary password has been sent.'
      });
      
      return createdUser as User;
    } catch (error) {
      console.error('❌ Error creating user:', error);
      toast.error('Failed to create user. Please try again.');
      throw error;
    }
  };

  const addLearningModule = async (module: Omit<LearningModule, 'id'>) => {
    try {
      console.log('🎯 Creating module with video URL:', module.videoUrl);
      const newModule = await moduleService.createModule(module);
      console.log('✅ Module created:', newModule);
      setLearningModules(prev => [...prev, newModule]);
      return newModule;
    } catch (error) {
      console.error('❌ Error creating module:', error);
      toast.error('Failed to create module', {
        description: 'Please try again or contact support.'
      });
      throw error;
    }
  };

  const updateLearningModule = async (id: string, updates: Partial<LearningModule>) => {
    try {
      console.log('📝 Updating module', id, 'with:', updates);
      const updatedModule = await moduleService.updateModule(id, updates);
      console.log('✅ Module updated:', updatedModule);
      setLearningModules(prev => 
        prev.map(module => 
          module.id === id ? updatedModule : module
        )
      );
      return updatedModule;
    } catch (error) {
      console.error('❌ Error updating module:', error);
      toast.error('Failed to update module', {
        description: 'Please try again or contact support.'
      });
      throw error;
    }
  };

  const deleteLearningModule = async (id: string) => {
    try {
      console.log('🗑️ Deleting module:', id);
      await moduleService.deleteModule(id);
      console.log('✅ Module deleted');
      setLearningModules(prev => prev.filter(module => module.id !== id));
    } catch (error) {
      console.error('❌ Error deleting module:', error);
      toast.error('Failed to delete module', {
        description: 'Please try again or contact support.'
      });
      throw error;
    }
  };

  const addProgressData = (progress: Omit<ProgressData, 'endTime'>) => {
    const newProgress: ProgressData = {
      ...progress,
      endTime: new Date()
    };
    setProgressData(prev => [...prev, newProgress]);
  };

  const handlePasswordChanged = async () => {
    // After password is changed, complete the login process
    console.log('🔄 Password changed, completing login...');
    try {
      const { data: { user: currentUser }, error: userError } = await supabase.auth.getUser();
      
      if (userError) {
        console.error('❌ Error getting current user:', userError);
        throw userError;
      }
      
      console.log('👤 Current user after password change:', {
        id: currentUser?.id,
        email: currentUser?.email
      });
      
      if (currentUser) {
        console.log('📥 Loading user data...');
        await loadUserData(currentUser.id);
        setShowPasswordReset(false);
        setTempPasswordEmail('');
        console.log('✅ Login completed successfully after password reset');
        toast.success('Welcome!', {
          description: 'You can now access your dashboard.',
        });
      } else {
        console.error('❌ No current user found after password change');
        throw new Error('Session not found. Please log in again.');
      }
    } catch (error) {
      console.error('❌ Error completing login after password reset:', error);
      toast.error('Session expired', {
        description: 'Please log in again with your new password.',
      });
      await handleLogout();
    }
  };

  const handleResetPasswordComplete = async () => {
    // After password reset from email link, redirect to login
    console.log('🔄 Password reset complete, redirecting to login...');
    setShowResetPasswordPage(false);
    await handleLogout();
  };

  // Show reset password page if user came from email link
  if (showResetPasswordPage) {
    console.log('🔑 Rendering: Reset Password Page (from email link)');
    return (
      <>
        <ResetPasswordPage onPasswordReset={handleResetPasswordComplete} />
        <Toaster position="top-right" richColors />
      </>
    );
  }

  if (!user) {
    console.log('🎨 Rendering: No user - showing AuthScreen', { showPasswordReset, tempPasswordEmail });
    return (
      <>
        <AuthScreen onLogin={handleLogin} mockCredentials={mockCredentials} />
        <PasswordResetModal
          isOpen={showPasswordReset}
          userEmail={tempPasswordEmail}
          onPasswordChanged={handlePasswordChanged}
        />
        <Toaster position="top-right" richColors />
      </>
    );
  }

  // If user is logged in but needs to reset password, show modal and block dashboard
  if (showPasswordReset) {
    console.log('🔒 Rendering: Password reset modal (blocking dashboard)', { user: user.email, showPasswordReset });
    return (
      <>
        <PasswordResetModal
          isOpen={showPasswordReset}
          userEmail={tempPasswordEmail}
          onPasswordChanged={handlePasswordChanged}
        />
        <Toaster position="top-right" richColors />
      </>
    );
  }

  console.log('🏠 Rendering: Dashboard for user', user.role, user.email);

  switch (user.role) {
    case 'admin':
      return (
        <>
          <AdminDashboard
            user={user}
            allUsers={allUsers}
            allModules={learningModules}
            allProgress={allProgress}
            onUpdateUser={updateUser}
            onDeleteUser={deleteUser}
            onAddUser={addUser}
            onLogout={handleLogout}
          />
          <Toaster position="top-right" richColors />
        </>
      );
    case 'educator':
      return (
        <EducatorDashboard
          user={user}
          modules={learningModules}
          progressData={progressData}
          onAddModule={addLearningModule}
          onUpdateModule={updateLearningModule}
          onDeleteModule={deleteLearningModule}
          onLogout={handleLogout}
        />
      );
    case 'parent':
      return (
        <ParentDashboard
          user={user}
          progressData={progressData.filter(p => p.childId === user.childId)}
          modules={learningModules}
          children={children}
          allUsers={allUsers}
          onLogout={handleLogout}
        />
      );
    case 'child':
      return (
        <ChildInterface
          user={user}
          modules={learningModules}
          progressData={progressData}
          onProgress={addProgressData}
          onLogout={handleLogout}
        />
      );
    default:
      return <AuthScreen onLogin={handleLogin} mockCredentials={mockCredentials} />;
  }
}