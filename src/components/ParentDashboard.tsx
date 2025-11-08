import React from 'react';
import { Button } from './ui/button';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { Progress } from './ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { User, ProgressData, LearningModule } from '../App';
import { Heart, Clock, Target, TrendingUp, LogOut, Calendar, Award, Eye } from 'lucide-react';

interface ParentDashboardProps {
  user: User;
  progressData: ProgressData[];
  modules: LearningModule[];
  onLogout: () => void;
}

export function ParentDashboard({ user, progressData, modules, onLogout }: ParentDashboardProps) {
  const getModuleById = (id: string) => modules.find(m => m.id === id);
  
  const totalSessions = progressData.length;
  const avgAttentionSpan = progressData.length > 0 
    ? Math.round(progressData.reduce((sum, p) => sum + p.attentionSpan, 0) / progressData.length / 60)
    : 0;
  const avgCompletionRate = progressData.length > 0
    ? Math.round(progressData.reduce((sum, p) => sum + p.completionRate, 0) / progressData.length)
    : 0;
  const totalLearningTime = Math.round(progressData.reduce((sum, p) => {
    if (p.endTime) {
      return sum + (p.endTime.getTime() - p.startTime.getTime()) / (1000 * 60);
    }
    return sum;
  }, 0));

  const getEngagementColor = (level: string) => {
    switch (level) {
      case 'high': return 'bg-green-100 text-green-800';
      case 'medium': return 'bg-yellow-100 text-yellow-800';
      case 'low': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getRecommendations = () => {
    const recommendations = [];
    
    if (avgAttentionSpan < 5) {
      recommendations.push({
        type: 'attention',
        message: 'Consider shorter learning sessions to match attention span',
        icon: <Eye className="w-4 h-4" />
      });
    }
    
    if (avgCompletionRate < 70) {
      recommendations.push({
        type: 'difficulty',
        message: 'Try easier modules to build confidence',
        icon: <Target className="w-4 h-4" />
      });
    }
    
    if (totalSessions > 0) {
      const recentSessions = progressData.slice(-3);
      const improvingEngagement = recentSessions.filter(s => s.engagementLevel === 'high').length > 1;
      
      if (improvingEngagement) {
        recommendations.push({
          type: 'positive',
          message: 'Great progress! Engagement is improving',
          icon: <Award className="w-4 h-4" />
        });
      }
    }
    
    return recommendations;
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-green-500 rounded-full flex items-center justify-center">
                <Heart className="w-5 h-5 text-white" />
              </div>
              <div>
                <h1 className="text-xl">Parent Dashboard</h1>
                <p className="text-sm text-muted-foreground">Tracking your child's learning journey</p>
              </div>
            </div>
            <Button variant="outline" size="sm" onClick={onLogout}>
              <LogOut className="w-4 h-4 mr-2" />
              Logout
            </Button>
          </div>
        </div>
      </header>

      <div className="p-4 space-y-6">
        {/* Stats Overview */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center space-x-3">
                <Calendar className="w-8 h-8 text-blue-500" />
                <div>
                  <p className="text-2xl">{totalSessions}</p>
                  <p className="text-sm text-muted-foreground">Sessions</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center space-x-3">
                <Clock className="w-8 h-8 text-green-500" />
                <div>
                  <p className="text-2xl">{avgAttentionSpan}m</p>
                  <p className="text-sm text-muted-foreground">Avg Attention</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center space-x-3">
                <Target className="w-8 h-8 text-purple-500" />
                <div>
                  <p className="text-2xl">{avgCompletionRate}%</p>
                  <p className="text-sm text-muted-foreground">Completion</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center space-x-3">
                <TrendingUp className="w-8 h-8 text-orange-500" />
                <div>
                  <p className="text-2xl">{totalLearningTime}m</p>
                  <p className="text-sm text-muted-foreground">Total Time</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Recommendations */}
        {getRecommendations().length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Award className="w-5 h-5" />
                <span>Recommendations</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {getRecommendations().map((rec, index) => (
                  <div key={index} className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
                    <div className="text-blue-500">{rec.icon}</div>
                    <p className="text-sm">{rec.message}</p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        <Tabs defaultValue="progress" className="space-y-4">
          <TabsList>
            <TabsTrigger value="progress">Recent Progress</TabsTrigger>
            <TabsTrigger value="detailed">Detailed Reports</TabsTrigger>
          </TabsList>

          <TabsContent value="progress" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Recent Learning Sessions</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {progressData.slice(-5).reverse().map((progress) => {
                    const module = getModuleById(progress.moduleId);
                    return (
                      <div key={`${progress.moduleId}-${progress.startTime.getTime()}`} className="border rounded-lg p-4">
                        <div className="flex items-start justify-between mb-3">
                          <div>
                            <h3 className="font-medium">{module?.title || 'Unknown Module'}</h3>
                            <p className="text-sm text-muted-foreground">
                              {formatDate(progress.startTime)}
                            </p>
                          </div>
                          <Badge className={getEngagementColor(progress.engagementLevel)}>
                            {progress.engagementLevel} engagement
                          </Badge>
                        </div>
                        
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-3">
                          <div>
                            <p className="text-sm text-muted-foreground">Attention Span</p>
                            <p className="font-medium">{Math.round(progress.attentionSpan / 60)}m {progress.attentionSpan % 60}s</p>
                          </div>
                          <div>
                            <p className="text-sm text-muted-foreground">Completion</p>
                            <p className="font-medium">{progress.completionRate}%</p>
                          </div>
                          {progress.correctAnswers !== undefined && (
                            <div>
                              <p className="text-sm text-muted-foreground">Accuracy</p>
                              <p className="font-medium">
                                {progress.correctAnswers}/{progress.totalQuestions}
                              </p>
                            </div>
                          )}
                          <div>
                            <p className="text-sm text-muted-foreground">Duration</p>
                            <p className="font-medium">
                              {progress.endTime 
                                ? Math.round((progress.endTime.getTime() - progress.startTime.getTime()) / (1000 * 60))
                                : 0}m
                            </p>
                          </div>
                        </div>
                        
                        <div className="space-y-2">
                          <div className="flex items-center justify-between text-sm">
                            <span>Progress</span>
                            <span>{progress.completionRate}%</span>
                          </div>
                          <Progress value={progress.completionRate} className="h-2" />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="detailed">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Attention Span Trends</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="p-4 bg-blue-50 rounded-lg">
                      <h4>Average Attention Span</h4>
                      <p className="text-2xl">{avgAttentionSpan} minutes</p>
                      <p className="text-sm text-muted-foreground">
                        {avgAttentionSpan > 8 ? 'Above average' : avgAttentionSpan > 5 ? 'Average' : 'Below average'}
                      </p>
                    </div>
                    <div className="space-y-2">
                      <h4>Recent Sessions</h4>
                      {progressData.slice(-3).reverse().map((p, index) => (
                        <div key={index} className="flex items-center justify-between py-2 border-b">
                          <span className="text-sm">{getModuleById(p.moduleId)?.title}</span>
                          <span className="text-sm font-medium">
                            {Math.round(p.attentionSpan / 60)}m
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Learning Preferences</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="p-4 bg-green-50 rounded-lg">
                      <h4>Preferred Module Type</h4>
                      <p className="text-lg">Interactive</p>
                      <p className="text-sm text-muted-foreground">Based on engagement levels</p>
                    </div>
                    <div className="p-4 bg-purple-50 rounded-lg">
                      <h4>Best Learning Time</h4>
                      <p className="text-lg">Morning</p>
                      <p className="text-sm text-muted-foreground">Higher completion rates</p>
                    </div>
                    <div className="p-4 bg-orange-50 rounded-lg">
                      <h4>Optimal Session Length</h4>
                      <p className="text-lg">{avgAttentionSpan} minutes</p>
                      <p className="text-sm text-muted-foreground">Based on attention span</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}