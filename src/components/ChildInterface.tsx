import React, { useState, useEffect } from 'react';
import { Button } from './ui/button';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Progress } from './ui/progress';
import { Badge } from './ui/badge';
import { User, LearningModule, ProgressData } from '../App';
import { DynamicLearningModule } from './learning-modules/DynamicLearningModule';
import { Star, Home, Trophy, Clock, LogOut, Play, Pause } from 'lucide-react';

interface ChildInterfaceProps {
  user: User;
  modules: LearningModule[];
  onProgress: (progress: Omit<ProgressData, 'endTime'>) => void;
  onLogout: () => void;
}

export function ChildInterface({ user, modules, onProgress, onLogout }: ChildInterfaceProps) {
  const [currentView, setCurrentView] = useState<'home' | 'learning'>('home');
  const [activeModule, setActiveModule] = useState<LearningModule | null>(null);
  const [sessionStartTime, setSessionStartTime] = useState<Date | null>(null);
  const [attentionStartTime, setAttentionStartTime] = useState<Date | null>(null);
  const [totalAttentionTime, setTotalAttentionTime] = useState(0);
  const [isActive, setIsActive] = useState(true);
  const [completedModules, setCompletedModules] = useState<string[]>([]);
  const [unlockedDifficulties, setUnlockedDifficulties] = useState<string[]>(['easy']);

  // Attention tracking
  useEffect(() => {
    let interval: NodeJS.Timeout;
    
    if (isActive && attentionStartTime && currentView === 'learning') {
      interval = setInterval(() => {
        setTotalAttentionTime(prev => prev + 1);
      }, 1000);
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isActive, attentionStartTime, currentView]);

  // Simulate attention tracking based on user interaction
  useEffect(() => {
    const handleActivity = () => {
      if (!isActive && currentView === 'learning') {
        setIsActive(true);
        setAttentionStartTime(new Date());
      }
    };

    const handleInactivity = () => {
      setIsActive(false);
    };

    if (currentView === 'learning') {
      document.addEventListener('click', handleActivity);
      document.addEventListener('keypress', handleActivity);
      document.addEventListener('touchstart', handleActivity);

      // Simulate losing attention after 30 seconds of no interaction
      const inactivityTimer = setTimeout(handleInactivity, 30000);

      return () => {
        document.removeEventListener('click', handleActivity);
        document.removeEventListener('keypress', handleActivity);
        document.removeEventListener('touchstart', handleActivity);
        clearTimeout(inactivityTimer);
      };
    }
  }, [currentView, isActive]);

  const startModule = (module: LearningModule) => {
    setActiveModule(module);
    setCurrentView('learning');
    setSessionStartTime(new Date());
    setAttentionStartTime(new Date());
    setTotalAttentionTime(0);
    setIsActive(true);
  };

  const completeModule = (completionRate: number, correctAnswers?: number, totalQuestions?: number) => {
    if (!activeModule || !sessionStartTime) return;

    const engagementLevel: 'low' | 'medium' | 'high' = 
      totalAttentionTime > 300 ? 'high' : 
      totalAttentionTime > 120 ? 'medium' : 'low';

    onProgress({
      moduleId: activeModule.id,
      childId: user.id,
      startTime: sessionStartTime,
      attentionSpan: totalAttentionTime,
      completionRate,
      correctAnswers,
      totalQuestions,
      engagementLevel
    });

    if (completionRate >= 80) {
      setCompletedModules(prev => {
        const newCompleted = [...prev, activeModule.id];
        checkProgressionUnlock(newCompleted);
        return newCompleted;
      });
    }

    setActiveModule(null);
    setCurrentView('home');
    setSessionStartTime(null);
    setAttentionStartTime(null);
  };

  // Check if child can progress to next difficulty level
  const checkProgressionUnlock = (completed: string[]) => {
    const easyModules = modules.filter(m => m.difficulty === 'easy');
    const mediumModules = modules.filter(m => m.difficulty === 'medium');
    
    const completedEasy = completed.filter(id => 
      easyModules.some(m => m.id === id)
    ).length;
    
    const completedMedium = completed.filter(id => 
      mediumModules.some(m => m.id === id)
    ).length;

    // Unlock medium if 3/4 easy modules completed
    if (completedEasy >= 3 && !unlockedDifficulties.includes('medium')) {
      setUnlockedDifficulties(prev => [...prev, 'medium']);
    }

    // Unlock hard if 3/4 medium modules completed
    if (completedMedium >= 3 && !unlockedDifficulties.includes('hard')) {
      setUnlockedDifficulties(prev => [...prev, 'hard']);
    }
  };

  // Check if a module is available to play
  const isModuleAvailable = (module: LearningModule) => {
    return unlockedDifficulties.includes(module.difficulty);
  };

  // Get progression status
  const getProgressionStatus = () => {
    const easyModules = modules.filter(m => m.difficulty === 'easy');
    const mediumModules = modules.filter(m => m.difficulty === 'medium');
    const hardModules = modules.filter(m => m.difficulty === 'hard');
    
    const completedEasy = completedModules.filter(id => 
      easyModules.some(m => m.id === id)
    ).length;
    
    const completedMedium = completedModules.filter(id => 
      mediumModules.some(m => m.id === id)
    ).length;

    const completedHard = completedModules.filter(id => 
      hardModules.some(m => m.id === id)
    ).length;

    return { completedEasy, completedMedium, completedHard, easyModules, mediumModules, hardModules };
  };

  const renderLearningModule = () => {
    if (!activeModule) return null;

    const moduleProps = {
      module: activeModule,
      childId: parseInt(user.id), // Pass user ID as childId for attention tracking
      onComplete: completeModule,
      onExit: () => {
        setActiveModule(null);
        setCurrentView('home');
      }
    };

    // Use the dynamic learning module for all modules from the database
    return <DynamicLearningModule {...moduleProps} />;
  };

  // Check if modules are loaded
  if (!modules) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-yellow-100 via-pink-100 to-purple-100 flex items-center justify-center">
        <Card className="w-full max-w-md text-center">
          <CardContent className="p-8">
            <div className="text-6xl mb-4">⏳</div>
            <h2 className="text-xl mb-2">Loading Learning Modules...</h2>
            <p className="text-muted-foreground">
              Please wait while we load your learning adventures!
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (modules.length === 0) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-yellow-100 via-pink-100 to-purple-100 flex items-center justify-center">
        <Card className="w-full max-w-md text-center">
          <CardContent className="p-8">
            <div className="text-6xl mb-4">📚</div>
            <h2 className="text-xl mb-2">No Learning Modules Available</h2>
            <p className="text-muted-foreground mb-4">
              Please ask your educator to create some learning modules for you!
            </p>
            <Button onClick={onLogout} variant="outline">
              <LogOut className="w-4 h-4 mr-2" />
              Back to Login
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (currentView === 'learning' && activeModule) {
    return (
      <div className="relative">
        {/* Attention indicator */}
        <div className="fixed top-4 right-4 z-50">
          <div className={`flex items-center space-x-2 px-3 py-2 rounded-full ${
            isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
          }`}>
            {isActive ? <Play className="w-4 h-4" /> : <Pause className="w-4 h-4" />}
            <span className="text-sm">
              {Math.floor(totalAttentionTime / 60)}:{(totalAttentionTime % 60).toString().padStart(2, '0')}
            </span>
          </div>
        </div>
        {renderLearningModule()}
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-yellow-100 via-pink-100 to-purple-100">
      {/* Header */}
      <header className="bg-white/80 backdrop-blur-sm shadow-sm border-b">
        <div className="px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-gradient-to-r from-yellow-400 to-orange-500 rounded-full flex items-center justify-center">
                <Star className="w-5 h-5 text-white" />
              </div>
              <div>
                <h1 className="text-xl">Hi {user.name}! 🌟</h1>
                <p className="text-sm text-muted-foreground">Ready to learn something new?</p>
              </div>
            </div>
            <Button variant="outline" size="sm" onClick={onLogout}>
              <LogOut className="w-4 h-4 mr-2" />
              Exit
            </Button>
          </div>
        </div>
      </header>

      <div className="p-4 space-y-6">
        {/* Progress Overview */}
        <Card className="bg-white/80 backdrop-blur-sm">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Trophy className="w-5 h-5 text-yellow-500" />
              <span>Your Progress</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between mb-2">
              <span>Modules Completed</span>
              <span className="font-medium">{completedModules.length}/{modules.length}</span>
            </div>
            <Progress value={(completedModules.length / modules.length) * 100} className="h-3" />
            {completedModules.length > 0 && (
              <p className="text-sm text-green-600 mt-2">
                Great job! You've completed {completedModules.length} module{completedModules.length > 1 ? 's' : ''}! 🎉
              </p>
            )}
          </CardContent>
        </Card>

        {/* Progression Status */}
        {(() => {
          const progression = getProgressionStatus();
          return (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Card className="bg-green-50 border-green-200">
                <CardContent className="p-4 text-center">
                  <div className="text-2xl mb-2">🟢</div>
                  <h3 className="text-lg mb-1">Easy Level</h3>
                  <p className="text-sm text-muted-foreground">
                    {progression.completedEasy}/{progression.easyModules.length} completed
                  </p>
                  <Progress value={(progression.completedEasy / progression.easyModules.length) * 100} className="h-2 mt-2" />
                </CardContent>
              </Card>
              
              <Card className={`${unlockedDifficulties.includes('medium') ? 'bg-yellow-50 border-yellow-200' : 'bg-gray-50 border-gray-200'}`}>
                <CardContent className="p-4 text-center">
                  <div className="text-2xl mb-2">{unlockedDifficulties.includes('medium') ? '🟡' : '🔒'}</div>
                  <h3 className="text-lg mb-1">Medium Level</h3>
                  <p className="text-sm text-muted-foreground">
                    {unlockedDifficulties.includes('medium') 
                      ? `${progression.completedMedium}/${progression.mediumModules.length} completed`
                      : 'Complete 3 easy modules to unlock'
                    }
                  </p>
                  {unlockedDifficulties.includes('medium') && (
                    <Progress value={(progression.completedMedium / progression.mediumModules.length) * 100} className="h-2 mt-2" />
                  )}
                </CardContent>
              </Card>
              
              <Card className={`${unlockedDifficulties.includes('hard') ? 'bg-red-50 border-red-200' : 'bg-gray-50 border-gray-200'}`}>
                <CardContent className="p-4 text-center">
                  <div className="text-2xl mb-2">{unlockedDifficulties.includes('hard') ? '🔴' : '🔒'}</div>
                  <h3 className="text-lg mb-1">Hard Level</h3>
                  <p className="text-sm text-muted-foreground">
                    {unlockedDifficulties.includes('hard') 
                      ? `${progression.completedHard}/${progression.hardModules.length} completed`
                      : 'Complete 3 medium modules to unlock'
                    }
                  </p>
                  {unlockedDifficulties.includes('hard') && (
                    <Progress value={(progression.completedHard / progression.hardModules.length) * 100} className="h-2 mt-2" />
                  )}
                </CardContent>
              </Card>
            </div>
          );
        })()}

        {/* Learning Modules by Difficulty */}
        <div>
          <h2 className="text-xl mb-4 flex items-center space-x-2">
            <Home className="w-5 h-5" />
            <span>Choose Your Adventure</span>
          </h2>
          
          {['easy', 'medium', 'hard'].map((difficulty) => {
            const difficultyModules = modules.filter(m => m.difficulty === difficulty);
            const isUnlocked = unlockedDifficulties.includes(difficulty);
            
            return (
              <div key={difficulty} className="mb-6">
                <h3 className={`text-lg mb-3 flex items-center space-x-2 ${!isUnlocked ? 'text-gray-400' : ''}`}>
                  <span className="capitalize">{difficulty} Level</span>
                  {!isUnlocked && <span className="text-xl">🔒</span>}
                </h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {difficultyModules.map((module) => {
                    const isCompleted = completedModules.includes(module.id);
                    const isAvailable = isModuleAvailable(module);
                    
                    return (
                      <Card 
                        key={module.id} 
                        className={`transition-all ${
                          !isAvailable 
                            ? 'opacity-50 cursor-not-allowed bg-gray-100' 
                            : isCompleted 
                              ? 'bg-green-50 border-green-200 cursor-pointer hover:shadow-lg' 
                              : 'bg-white/80 backdrop-blur-sm cursor-pointer hover:shadow-lg'
                        }`}
                        onClick={() => isAvailable && startModule(module)}
                      >
                        <CardHeader className="pb-3">
                          <div className="flex items-start justify-between">
                            <div className="space-y-1">
                              <CardTitle className="text-lg flex items-center space-x-2">
                                <span>{module.title}</span>
                                {isCompleted && <Star className="w-5 h-5 text-yellow-500 fill-current" />}
                                {!isAvailable && <span className="text-lg">🔒</span>}
                              </CardTitle>
                              <p className="text-sm text-muted-foreground">{module.description}</p>
                            </div>
                          </div>
                        </CardHeader>
                        <CardContent className="pt-0">
                          <div className="flex flex-wrap gap-2 mb-3">
                            <Badge className={`${
                              difficulty === 'easy' ? 'bg-green-100 text-green-800' :
                              difficulty === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                              'bg-red-100 text-red-800'
                            }`}>
                              {difficulty}
                            </Badge>
                            <Badge className="bg-blue-100 text-blue-800">
                              {module.type}
                            </Badge>
                            <Badge className="bg-purple-100 text-purple-800">
                              {module.ageGroup} years
                            </Badge>
                            {isCompleted && (
                              <Badge className="bg-green-100 text-green-800">
                                ✓ Completed
                              </Badge>
                            )}
                          </div>
                          <div className="flex items-center justify-between text-sm text-muted-foreground">
                            <span className="flex items-center">
                              <Clock className="w-4 h-4 mr-1" />
                              {module.duration} min
                            </span>
                            <span className="capitalize">{module.difficulty}</span>
                          </div>
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>

        {/* Encouragement Section */}
        <Card className="bg-gradient-to-r from-purple-100 to-pink-100 border-purple-200">
          <CardContent className="p-6 text-center">
            <div className="text-4xl mb-2">🌟</div>
            <h3 className="text-lg mb-2">You're doing amazing!</h3>
            <p className="text-sm text-muted-foreground">
              Every module you complete helps you learn something new. Keep going!
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}