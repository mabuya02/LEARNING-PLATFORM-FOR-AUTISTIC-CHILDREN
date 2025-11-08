import { useState, useEffect } from 'react';
import { AuthScreen } from './components/AuthScreen';
import { EducatorDashboard } from './components/EducatorDashboard';
import { ParentDashboard } from './components/ParentDashboard';
import { ChildInterface } from './components/ChildInterface';
import { AdminDashboard } from './components/AdminDashboard';
import { supabase } from './lib/supabase';
import { authService } from './services/authService';
import { moduleService } from './services/moduleService';
import { progressService } from './services/progressService';
import { childService } from './services/childService';

export type UserRole = 'educator' | 'parent' | 'child' | 'admin';

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  childId?: string; // For parents, links to their child
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
}

export interface ProgressData {
  moduleId: string;
  childId: string;
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

  // Check for existing session on mount
  useEffect(() => {
    checkSession();
    
    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user) {
        loadUserData(session.user.id);
      } else {
        setUser(null);
        setUserProfile(null);
        setLoading(false);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  // Check for existing session
  const checkSession = async () => {
    try {
      const session = await authService.getSession();
      if (session?.user) {
        await loadUserData(session.user.id);
      }
    } catch (error) {
      console.error('Error checking session:', error);
    } finally {
      setLoading(false);
    }
  };

  // Load user data from Supabase
  const loadUserData = async (userId: string) => {
    try {
      const profile = await authService.getCurrentProfile();
      if (profile) {
        setUserProfile(profile);
        setUser({
          id: profile.id,
          name: profile.name,
          email: profile.email,
          role: profile.role,
          childId: profile.child_id
        });

        // Load modules
        const modules = await moduleService.getModules();
        const mappedModules = modules.map(m => ({
          id: m.id,
          title: m.title,
          description: m.description || '',
          type: m.type as any,
          difficulty: m.difficulty,
          duration: 10,
          content: {},
          createdBy: userId,
          ageGroup: '3-10'
        }));
        setLearningModules(mappedModules);

        // Load children if parent or educator
        if (profile.role === 'parent' || profile.role === 'educator') {
          const childrenData = profile.role === 'parent'
            ? await childService.getChildrenByParent(profile.id)
            : await childService.getChildrenByEducator(profile.id);
          setChildren(childrenData);

          // Load progress for first child
          if (childrenData.length > 0) {
            const progress = await progressService.getProgressByChild(childrenData[0].id);
            const mappedProgress = progress.map(p => ({
              moduleId: p.module_id,
              childId: p.child_id,
              startTime: new Date(p.created_at),
              endTime: new Date(p.completed_at),
              attentionSpan: p.time_spent,
              completionRate: (p.correct_answers / p.total_questions) * 100 || 0,
              correctAnswers: p.correct_answers,
              totalQuestions: p.total_questions,
              engagementLevel: p.score > 80 ? 'high' : p.score > 50 ? 'medium' : 'low'
            } as ProgressData));
            setProgressData(mappedProgress);
          }
        }
      }
    } catch (error) {
      console.error('Error loading user data:', error);
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

  // Mock data initialization
  useEffect(() => {
    const mockModules: LearningModule[] = [
      // Easy Level Modules (4 modules)
      {
        id: '1',
        title: 'Color Recognition',
        description: 'Learn about different colors with fun activities',
        type: 'visual',
        difficulty: 'easy',
        duration: 10,
        content: { colors: ['red', 'blue', 'green', 'yellow'] },
        createdBy: 'educator1',
        ageGroup: '3-6'
      },
      {
        id: '2',
        title: 'Number Counting',
        description: 'Count numbers from 1 to 10',
        type: 'interactive',
        difficulty: 'easy',
        duration: 15,
        content: { range: [1, 10], exercises: ['counting', 'matching'] },
        createdBy: 'educator1',
        ageGroup: '4-7'
      },
      {
        id: '3',
        title: 'Animal Sounds',
        description: 'Match animals with their sounds',
        type: 'audio',
        difficulty: 'easy',
        duration: 8,
        content: { animals: ['cow', 'dog', 'cat', 'bird'] },
        createdBy: 'educator2',
        ageGroup: '3-5'
      },
      {
        id: '4',
        title: 'Big and Small',
        description: 'Learn about size differences',
        type: 'visual',
        difficulty: 'easy',
        duration: 12,
        content: { concepts: ['big', 'small', 'bigger', 'smaller'] },
        createdBy: 'educator1',
        ageGroup: '3-6'
      },
      
      // Medium Level Modules (4 modules)
      {
        id: '5',
        title: 'Shape Sorting',
        description: 'Sort different shapes into categories',
        type: 'game',
        difficulty: 'medium',
        duration: 12,
        content: { shapes: ['circle', 'square', 'triangle', 'rectangle'] },
        createdBy: 'educator1',
        ageGroup: '5-8'
      },
      {
        id: '6',
        title: 'Pattern Recognition',
        description: 'Complete visual patterns and sequences',
        type: 'visual',
        difficulty: 'medium',
        duration: 18,
        content: { patterns: ['ABAB', 'AABB', 'ABC'] },
        createdBy: 'educator2',
        ageGroup: '5-8'
      },
      {
        id: '7',
        title: 'Simple Addition',
        description: 'Add numbers from 1 to 5',
        type: 'interactive',
        difficulty: 'medium',
        duration: 20,
        content: { operations: ['addition'], range: [1, 5] },
        createdBy: 'educator1',
        ageGroup: '6-8'
      },
      {
        id: '8',
        title: 'Memory Games',
        description: 'Remember and match pairs of objects',
        type: 'game',
        difficulty: 'medium',
        duration: 15,
        content: { pairs: 6, themes: ['animals', 'colors', 'shapes'] },
        createdBy: 'educator2',
        ageGroup: '5-8'
      },
      
      // Hard Level Modules (4 modules)
      {
        id: '9',
        title: 'Advanced Math',
        description: 'Solve addition and subtraction problems',
        type: 'interactive',
        difficulty: 'hard',
        duration: 25,
        content: { operations: ['addition', 'subtraction'], range: [1, 20] },
        createdBy: 'educator1',
        ageGroup: '7-10'
      },
      {
        id: '10',
        title: 'Reading Comprehension',
        description: 'Read simple stories and answer questions',
        type: 'visual',
        difficulty: 'hard',
        duration: 30,
        content: { stories: ['short', 'medium'], questions: 5 },
        createdBy: 'educator2',
        ageGroup: '6-9'
      },
      {
        id: '11',
        title: 'Complex Patterns',
        description: 'Solve advanced pattern sequences',
        type: 'visual',
        difficulty: 'hard',
        duration: 22,
        content: { patterns: ['ABCABC', 'AABBAABB', 'ABCDABCD'] },
        createdBy: 'educator1',
        ageGroup: '7-10'
      },
      {
        id: '12',
        title: 'Problem Solving',
        description: 'Use logic to solve puzzles and challenges',
        type: 'game',
        difficulty: 'hard',
        duration: 28,
        content: { puzzles: ['logic', 'spatial', 'sequence'] },
        createdBy: 'educator2',
        ageGroup: '8-11'
      }
    ];

    const mockProgress: ProgressData[] = [
      // Child 1 Progress
      {
        moduleId: '1',
        childId: 'child1',
        startTime: new Date(Date.now() - 86400000),
        endTime: new Date(Date.now() - 86400000 + 600000),
        attentionSpan: 480,
        completionRate: 85,
        correctAnswers: 8,
        totalQuestions: 10,
        engagementLevel: 'high'
      },
      {
        moduleId: '2',
        childId: 'child1',
        startTime: new Date(Date.now() - 43200000),
        endTime: new Date(Date.now() - 43200000 + 900000),
        attentionSpan: 720,
        completionRate: 92,
        correctAnswers: 9,
        totalQuestions: 10,
        engagementLevel: 'high'
      },
      {
        moduleId: '3',
        childId: 'child1',
        startTime: new Date(Date.now() - 21600000),
        endTime: new Date(Date.now() - 21600000 + 480000),
        attentionSpan: 390,
        completionRate: 78,
        correctAnswers: 7,
        totalQuestions: 9,
        engagementLevel: 'medium'
      },
      {
        moduleId: '5',
        childId: 'child1',
        startTime: new Date(Date.now() - 10800000),
        endTime: new Date(Date.now() - 10800000 + 720000),
        attentionSpan: 600,
        completionRate: 88,
        correctAnswers: 8,
        totalQuestions: 9,
        engagementLevel: 'high'
      },
      
      // Child 2 Progress
      {
        moduleId: '1',
        childId: 'child2',
        startTime: new Date(Date.now() - 172800000),
        endTime: new Date(Date.now() - 172800000 + 540000),
        attentionSpan: 420,
        completionRate: 70,
        correctAnswers: 6,
        totalQuestions: 10,
        engagementLevel: 'medium'
      },
      {
        moduleId: '2',
        childId: 'child2',
        startTime: new Date(Date.now() - 129600000),
        endTime: new Date(Date.now() - 129600000 + 660000),
        attentionSpan: 480,
        completionRate: 82,
        correctAnswers: 8,
        totalQuestions: 10,
        engagementLevel: 'high'
      }
    ];

    setLearningModules(mockModules);
    setProgressData(mockProgress);
  }, []);

  const handleLogin = (credentials: UserCredentials): User | null => {
    // Validate credentials
    const validCredential = mockCredentials.find(
      cred => cred.email === credentials.email && 
             cred.password === credentials.password &&
             cred.role === credentials.role
    );

    if (validCredential) {
      const userData = mockUsers.find(user => user.email === credentials.email);
      if (userData) {
        setUser(userData);
        return userData;
      }
    }
    return null;
  };

  const updateUser = (updatedUser: User) => {
    setMockUsers(prev => prev.map(user => user.id === updatedUser.id ? updatedUser : user));
    if (user && user.id === updatedUser.id) {
      setUser(updatedUser);
    }
  };

  const deleteUser = (userId: string) => {
    setMockUsers(prev => prev.filter(user => user.id !== userId));
  };

  const addUser = (newUser: Omit<User, 'id'>) => {
    const user: User = {
      ...newUser,
      id: Date.now().toString()
    };
    setMockUsers(prev => [...prev, user]);
    return user;
  };

  const handleLogout = () => {
    setUser(null);
  };

  const addLearningModule = (module: Omit<LearningModule, 'id'>) => {
    const newModule: LearningModule = {
      ...module,
      id: Date.now().toString()
    };
    setLearningModules(prev => [...prev, newModule]);
  };

  const addProgressData = (progress: Omit<ProgressData, 'endTime'>) => {
    const newProgress: ProgressData = {
      ...progress,
      endTime: new Date()
    };
    setProgressData(prev => [...prev, newProgress]);
  };

  if (!user) {
    return <AuthScreen onLogin={handleLogin} mockCredentials={mockCredentials} />;
  }

  switch (user.role) {
    case 'admin':
      return (
        <AdminDashboard
          user={user}
          allUsers={mockUsers}
          allModules={learningModules}
          allProgress={progressData}
          onUpdateUser={updateUser}
          onDeleteUser={deleteUser}
          onAddUser={addUser}
          onLogout={handleLogout}
        />
      );
    case 'educator':
      return (
        <EducatorDashboard
          user={user}
          modules={learningModules}
          onAddModule={addLearningModule}
          onLogout={handleLogout}
        />
      );
    case 'parent':
      return (
        <ParentDashboard
          user={user}
          progressData={progressData.filter(p => p.childId === user.childId)}
          modules={learningModules}
          onLogout={handleLogout}
        />
      );
    case 'child':
      return (
        <ChildInterface
          user={user}
          modules={learningModules}
          onProgress={addProgressData}
          onLogout={handleLogout}
        />
      );
    default:
      return <AuthScreen onLogin={handleLogin} mockCredentials={mockCredentials} />;
  }
}