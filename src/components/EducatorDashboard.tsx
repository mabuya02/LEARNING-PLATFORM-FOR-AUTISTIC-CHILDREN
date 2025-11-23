import React, { useState } from 'react';
import { Button } from './ui/button';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Textarea } from './ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Badge } from './ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from './ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from './ui/alert-dialog';
import { User, LearningModule } from '../App';
import { Plus, BookOpen, Clock, Users, LogOut, Edit, Trash2, Video, Upload, X, Eye } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '../lib/supabase';

interface EducatorDashboardProps {
  user: User;
  modules: LearningModule[];
  progressData?: any[];
  onAddModule: (module: Omit<LearningModule, 'id'>) => Promise<LearningModule> | void;
  onUpdateModule: (id: string, updates: Partial<LearningModule>) => Promise<LearningModule> | void;
  onDeleteModule: (id: string) => Promise<void> | void;
  onLogout: () => void;
}

export function EducatorDashboard({ user, modules, progressData = [], onAddModule, onUpdateModule, onDeleteModule, onLogout }: EducatorDashboardProps) {
  const [isCreating, setIsCreating] = useState(false);
  const [editingModule, setEditingModule] = useState<LearningModule | null>(null);
  const [viewingModule, setViewingModule] = useState<LearningModule | null>(null);
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [videoPreview, setVideoPreview] = useState<string>('');
  const [isUploadingVideo, setIsUploadingVideo] = useState(false);
  const [newModule, setNewModule] = useState({
    title: '',
    description: '',
    type: 'visual' as const,
    difficulty: 'easy' as const,
    duration: 10,
    ageGroup: '3-6',
    videoUrl: '',
    content: {}
  });

  // Debug logging
  console.log('🎓 EducatorDashboard - Progress Data:', progressData);
  console.log('🎓 EducatorDashboard - Modules:', modules);

  // Calculate analytics from progress data
  const calculateAnalytics = () => {
    console.log('📊 Calculating analytics from progress data:', progressData);
    if (!progressData || progressData.length === 0) {
      console.log('⚠️ No progress data available for analytics');

      return {
        mostPopularModule: { name: 'No data', completionRate: 0 },
        avgAttentionSpan: 0,
        totalSessions: 0,
        engagementByType: {}
      };
    }

    // Most popular module (most completed)
    const moduleCounts: { [key: string]: { count: number, totalScore: number, name: string } } = {};
    progressData.forEach((progress: any) => {
      const moduleId = progress.moduleId || progress.module_id;
      const moduleName = progress.moduleName || progress.module_name || 'Unknown';
      if (!moduleCounts[moduleId]) {
        moduleCounts[moduleId] = { count: 0, totalScore: 0, name: moduleName };
      }
      moduleCounts[moduleId].count++;
      moduleCounts[moduleId].totalScore += progress.score || 0;
    });

    const sortedModules = Object.entries(moduleCounts).sort((a, b) => b[1].count - a[1].count);
    const mostPopular = sortedModules[0];
    const mostPopularModule = mostPopular ? {
      name: mostPopular[1].name,
      completionRate: Math.round((mostPopular[1].totalScore / mostPopular[1].count) || 0)
    } : { name: 'No data', completionRate: 0 };

    // Average attention span (convert seconds to minutes)
    const totalAttention = progressData.reduce((sum: number, p: any) => 
      sum + (p.attentionSpan || p.attention_span || 0), 0
    );
    const avgAttentionSpan = progressData.length > 0 
      ? (totalAttention / progressData.length / 60).toFixed(1) 
      : '0';

    // Engagement by type
    const typeEngagement: { [key: string]: number[] } = {};
    progressData.forEach((progress: any) => {
      const module = modules.find(m => m.id === (progress.moduleId || progress.module_id));
      if (module) {
        if (!typeEngagement[module.type]) {
          typeEngagement[module.type] = [];
        }
        typeEngagement[module.type].push(progress.score || 0);
      }
    });

    return {
      mostPopularModule,
      avgAttentionSpan,
      totalSessions: progressData.length,
      engagementByType: typeEngagement
    };
  };

  const analytics = calculateAnalytics();

  // Calculate stats for cards
  const getStatsForCards = () => {
    if (!progressData || progressData.length === 0) {
      console.log('⚠️ No progress data for stats cards');
      return {
        activeLearners: 0,
        hoursLearned: 0
      };
    }

    // Get unique learners (children) from progress data
    const uniqueLearners = new Set();
    progressData.forEach((progress: any) => {
      const childId = progress.childId || progress.child_id;
      if (childId) {
        uniqueLearners.add(childId);
      }
    });

    // Calculate total hours from attentionSpan (in seconds)
    const totalSeconds = progressData.reduce((sum: number, p: any) => {
      const timeSpent = p.attentionSpan || p.time_spent || 0;
      return sum + timeSpent;
    }, 0);
    const hoursLearned = Math.round(totalSeconds / 3600); // Convert to hours

    console.log('📊 Stats - Active Learners:', uniqueLearners.size, 'Hours:', hoursLearned);

    return {
      activeLearners: uniqueLearners.size,
      hoursLearned
    };
  };

  const statsCards = getStatsForCards();

  // Calculate highest engagement type
  const getHighestEngagementType = () => {
    const { engagementByType } = analytics;
    let highestType = 'visual';
    let highestAvg = 0;

    Object.entries(engagementByType).forEach(([type, scores]: [string, any]) => {
      const avg = scores.reduce((a: number, b: number) => a + b, 0) / scores.length;
      if (avg > highestAvg) {
        highestAvg = avg;
        highestType = type;
      }
    });

    return { type: highestType, improvement: Math.round(highestAvg - 70) };
  };

  const handleVideoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Check file type
      if (!file.type.startsWith('video/')) {
        toast.error('Invalid file type', {
          description: 'Please upload a video file (mp4, webm, etc.)'
        });
        return;
      }

      // Check file size (limit to 100MB)
      const maxSize = 100 * 1024 * 1024; // 100MB
      if (file.size > maxSize) {
        toast.error('File too large', {
          description: 'Please upload a video smaller than 100MB'
        });
        return;
      }

      setIsUploadingVideo(true);
      
      try {
        // Generate unique filename
        const fileExt = file.name.split('.').pop();
        const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;
        const filePath = `${fileName}`;

        // Upload to Supabase Storage
        const { data, error } = await supabase.storage
          .from('module-videos')
          .upload(filePath, file, {
            cacheControl: '3600',
            upsert: false
          });

        if (error) {
          throw error;
        }

        // Get public URL
        const { data: { publicUrl } } = supabase.storage
          .from('module-videos')
          .getPublicUrl(filePath);

        setVideoFile(file);
        const localUrl = URL.createObjectURL(file);
        setVideoPreview(localUrl);
        setNewModule(prev => ({ ...prev, videoUrl: publicUrl }));
        
        toast.success('Video uploaded!', {
          description: `${file.name} has been uploaded successfully.`
        });
      } catch (error: any) {
        console.error('Error uploading video:', error);
        toast.error('Upload failed', {
          description: error.message || 'Failed to upload video. Please try again.'
        });
      } finally {
        setIsUploadingVideo(false);
      }
    }
  };

  const removeVideo = async () => {
    if (videoPreview) {
      URL.revokeObjectURL(videoPreview);
    }
    
    // Delete from Supabase Storage if it exists
    if (newModule.videoUrl && newModule.videoUrl.includes('module-videos')) {
      try {
        const filePath = newModule.videoUrl.split('/').pop();
        if (filePath) {
          await supabase.storage
            .from('module-videos')
            .remove([filePath]);
        }
      } catch (error) {
        console.error('Error deleting video:', error);
      }
    }
    
    setVideoFile(null);
    setVideoPreview('');
    setNewModule(prev => ({ ...prev, videoUrl: '' }));
  };

  const handleCreateModule = async () => {
    if (!newModule.title.trim() || !newModule.description.trim()) {
      toast.error('Missing required fields', {
        description: 'Please fill in title and description.'
      });
      return;
    }

    try {
      await onAddModule({
        ...newModule,
        createdBy: user.id
      });

      toast.success('Module created successfully!', {
        description: `"${newModule.title}" has been added to your modules.`
      });

      // Clear video preview
      if (videoPreview) {
        URL.revokeObjectURL(videoPreview);
      }
      setVideoFile(null);
      setVideoPreview('');

      setNewModule({
        title: '',
        description: '',
        type: 'visual',
        difficulty: 'easy',
        duration: 10,
        ageGroup: '3-6',
        videoUrl: '',
        content: {}
      });
      setIsCreating(false);
    } catch (error) {
      console.error('Error creating module:', error);
      // Error toast already shown in App.tsx
    }
  };

  const handleEditModule = async () => {
    if (!editingModule) return;
    if (!editingModule.title.trim() || !editingModule.description.trim()) {
      toast.error('Missing required fields', {
        description: 'Please fill in all required fields.'
      });
      return;
    }

    try {
      // Ensure all fields are properly formatted
      const updatedModule = {
        ...editingModule,
        title: editingModule.title.trim(),
        description: editingModule.description.trim(),
        duration: Number(editingModule.duration) || 10,
        ageGroup: editingModule.ageGroup?.trim() || '3-6',
        videoUrl: editingModule.videoUrl || '',
      };

      await onUpdateModule(editingModule.id, updatedModule);

      toast.success('Module updated successfully!', {
        description: `"${editingModule.title}" has been updated.`
      });

      setEditingModule(null);
    } catch (error) {
      console.error('Error updating module:', error);
      // Error toast already shown in App.tsx
    }
  };

  const handleDeleteModule = (module: LearningModule) => {
    onDeleteModule(module.id);

    toast.success('Module deleted successfully!', {
      description: `"${module.title}" has been removed from your modules.`
    });
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'visual': return 'bg-blue-100 text-blue-800';
      case 'audio': return 'bg-green-100 text-green-800';
      case 'interactive': return 'bg-purple-100 text-purple-800';
      case 'game': return 'bg-orange-100 text-orange-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'easy': return 'bg-green-100 text-green-800';
      case 'medium': return 'bg-yellow-100 text-yellow-800';
      case 'hard': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center">
                <BookOpen className="w-5 h-5 text-white" />
              </div>
              <div>
                <h1 className="text-xl">Educator Dashboard</h1>
                <p className="text-sm text-muted-foreground">Welcome back, {user.name}</p>
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
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center space-x-3">
                <BookOpen className="w-8 h-8 text-blue-500" />
                <div>
                  <p className="text-2xl">{modules.length}</p>
                  <p className="text-sm text-muted-foreground">Total Modules</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center space-x-3">
                <Users className="w-8 h-8 text-green-500" />
                <div>
                  <p className="text-2xl">{statsCards.activeLearners}</p>
                  <p className="text-sm text-muted-foreground">Active Learners</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center space-x-3">
                <Clock className="w-8 h-8 text-purple-500" />
                <div>
                  <p className="text-2xl">{statsCards.hoursLearned}</p>
                  <p className="text-sm text-muted-foreground">Hours Learned</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="modules" className="space-y-4">
          <TabsList>
            <TabsTrigger value="modules">Learning Modules</TabsTrigger>
            <TabsTrigger value="analytics">Analytics</TabsTrigger>
          </TabsList>

          <TabsContent value="modules" className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-xl">Learning Modules</h2>
              <Dialog open={isCreating} onOpenChange={setIsCreating}>
                <DialogTrigger asChild>
                  <Button>
                    <Plus className="w-4 h-4 mr-2" />
                    Create Module
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-2xl">
                  <DialogHeader>
                    <DialogTitle>Create New Learning Module</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="title">Module Title</Label>
                        <Input
                          id="title"
                          value={newModule.title}
                          onChange={(e) => setNewModule(prev => ({ ...prev, title: e.target.value }))}
                          placeholder="e.g., Color Recognition"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="ageGroup">Age Group</Label>
                        <Select value={newModule.ageGroup} onValueChange={(value) => setNewModule(prev => ({ ...prev, ageGroup: value }))}>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="3-6">3-6 years</SelectItem>
                            <SelectItem value="4-7">4-7 years</SelectItem>
                            <SelectItem value="5-8">5-8 years</SelectItem>
                            <SelectItem value="6-9">6-9 years</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="description">Description</Label>
                      <Textarea
                        id="description"
                        value={newModule.description}
                        onChange={(e) => setNewModule(prev => ({ ...prev, description: e.target.value }))}
                        placeholder="Describe what children will learn in this module"
                        rows={3}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="video">Video Upload (Optional)</Label>
                      {isUploadingVideo ? (
                        <div className="border-2 border-dashed border-blue-300 rounded-lg p-6 text-center bg-blue-50">
                          <Upload className="w-8 h-8 mx-auto mb-2 text-blue-500 animate-pulse" />
                          <p className="text-sm text-blue-600 font-medium">Uploading video...</p>
                          <p className="text-xs text-blue-500 mt-1">Please wait while we upload your video</p>
                        </div>
                      ) : !videoPreview ? (
                        <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-gray-400 transition-colors">
                          <input
                            id="video"
                            type="file"
                            accept="video/*"
                            onChange={handleVideoUpload}
                            className="hidden"
                            disabled={isUploadingVideo}
                          />
                          <label htmlFor="video" className="cursor-pointer">
                            <Upload className="w-8 h-8 mx-auto mb-2 text-gray-400" />
                            <p className="text-sm text-gray-600 mb-1">Click to upload a video</p>
                            <p className="text-xs text-gray-400">MP4, WebM, or other video formats (max 100MB)</p>
                          </label>
                        </div>
                      ) : (
                        <div className="relative border rounded-lg p-4 bg-gray-50">
                          <button
                            onClick={removeVideo}
                            className="absolute top-2 right-2 p-1 bg-red-500 text-white rounded-full hover:bg-red-600 transition-colors"
                            type="button"
                          >
                            <X className="w-4 h-4" />
                          </button>
                          <video
                            src={videoPreview}
                            controls
                            className="w-full max-h-48 rounded"
                          />
                          <p className="text-sm text-gray-600 mt-2">
                            <Video className="w-4 h-4 inline mr-1" />
                            {videoFile?.name}
                          </p>
                          <p className="text-xs text-green-600 mt-1">✓ Uploaded to cloud storage</p>
                        </div>
                      )}
                      <p className="text-xs text-muted-foreground">
                        Upload a video that children will watch as part of this module.
                      </p>
                    </div>

                    <div className="grid grid-cols-3 gap-4">
                      <div className="space-y-2">
                        <Label>Module Type</Label>
                        <Select value={newModule.type} onValueChange={(value: any) => setNewModule(prev => ({ ...prev, type: value }))}>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="visual">Visual</SelectItem>
                            <SelectItem value="audio">Audio</SelectItem>
                            <SelectItem value="interactive">Interactive</SelectItem>
                            <SelectItem value="game">Game</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label>Difficulty</Label>
                        <Select value={newModule.difficulty} onValueChange={(value: any) => setNewModule(prev => ({ ...prev, difficulty: value }))}>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="easy">Easy</SelectItem>
                            <SelectItem value="medium">Medium</SelectItem>
                            <SelectItem value="hard">Hard</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="duration">Duration (mins)</Label>
                        <Input
                          id="duration"
                          type="number"
                          value={newModule.duration}
                          onChange={(e) => setNewModule(prev => ({ ...prev, duration: parseInt(e.target.value) || 10 }))}
                          min="5"
                          max="60"
                        />
                      </div>
                    </div>

                    <div className="flex justify-end space-x-2 pt-4">
                      <Button variant="outline" onClick={() => setIsCreating(false)}>
                        Cancel
                      </Button>
                      <Button onClick={handleCreateModule}>
                        Create Module
                      </Button>
                    </div>
                  </div>
                </DialogContent>
              </Dialog>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {modules.map((module) => (
                <Card key={module.id} className="hover:shadow-md transition-shadow">
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between">
                      <div className="space-y-1">
                        <CardTitle className="text-lg">{module.title}</CardTitle>
                        <p className="text-sm text-muted-foreground">{module.description}</p>
                      </div>
                      <div className="flex space-x-1">
                        <Dialog open={viewingModule?.id === module.id} onOpenChange={(open) => !open && setViewingModule(null)}>
                          <DialogTrigger asChild>
                            <Button variant="ghost" size="sm" onClick={() => setViewingModule(module)}>
                              <Eye className="w-4 h-4" />
                            </Button>
                          </DialogTrigger>
                          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
                            <DialogHeader>
                              <DialogTitle className="text-2xl">Module Details</DialogTitle>
                            </DialogHeader>
                            {viewingModule && (
                              <div className="space-y-6">
                                {/* Video Section */}
                                {viewingModule.videoUrl && (
                                  <div className="space-y-2">
                                    <h3 className="text-lg font-semibold flex items-center">
                                      <Video className="w-5 h-5 mr-2 text-red-500" />
                                      Module Video
                                    </h3>
                                    <div className="bg-black rounded-lg overflow-hidden">
                                      <video
                                        src={viewingModule.videoUrl}
                                        controls
                                        className="w-full max-h-[400px]"
                                      />
                                    </div>
                                  </div>
                                )}

                                {/* Module Information */}
                                <div className="space-y-4">
                                  <div>
                                    <h3 className="text-lg font-semibold mb-2">Title</h3>
                                    <p className="text-gray-700 text-xl">{viewingModule.title}</p>
                                  </div>

                                  <div>
                                    <h3 className="text-lg font-semibold mb-2">Description</h3>
                                    <p className="text-gray-700">{viewingModule.description}</p>
                                  </div>

                                  {/* Details Grid */}
                                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                    <div className="p-4 bg-gray-50 rounded-lg">
                                      <p className="text-sm text-gray-500 mb-1">Type</p>
                                      <Badge className={getTypeColor(viewingModule.type)}>
                                        {viewingModule.type}
                                      </Badge>
                                    </div>

                                    <div className="p-4 bg-gray-50 rounded-lg">
                                      <p className="text-sm text-gray-500 mb-1">Difficulty</p>
                                      <Badge className={getDifficultyColor(viewingModule.difficulty)}>
                                        {viewingModule.difficulty}
                                      </Badge>
                                    </div>

                                    <div className="p-4 bg-gray-50 rounded-lg">
                                      <p className="text-sm text-gray-500 mb-1">Duration</p>
                                      <p className="text-lg font-semibold flex items-center">
                                        <Clock className="w-4 h-4 mr-1" />
                                        {viewingModule.duration} min
                                      </p>
                                    </div>

                                    <div className="p-4 bg-gray-50 rounded-lg">
                                      <p className="text-sm text-gray-500 mb-1">Age Group</p>
                                      <p className="text-lg font-semibold">{viewingModule.ageGroup} years</p>
                                    </div>
                                  </div>

                                  {/* Created By */}
                                  <div className="p-4 bg-blue-50 rounded-lg">
                                    <p className="text-sm text-blue-600 mb-1">Created By</p>
                                    <p className="text-blue-800 font-medium">{user.name} (You)</p>
                                  </div>
                                </div>

                                {/* Actions */}
                                <div className="flex justify-end space-x-2 pt-4 border-t">
                                  <Button variant="outline" onClick={() => setViewingModule(null)}>
                                    Close
                                  </Button>
                                  <Button 
                                    onClick={() => {
                                      setViewingModule(null);
                                      // Create a deep copy to avoid mutating original
                                      setEditingModule({
                                        ...module,
                                        videoUrl: module.videoUrl || '',
                                        ageGroup: module.ageGroup || '',
                                      });
                                    }}
                                  >
                                    <Edit className="w-4 h-4 mr-2" />
                                    Edit Module
                                  </Button>
                                </div>
                              </div>
                            )}
                          </DialogContent>
                        </Dialog>

                        <Dialog open={editingModule?.id === module.id} onOpenChange={(open) => !open && setEditingModule(null)}>
                          <DialogTrigger asChild>
                            <Button variant="ghost" size="sm" onClick={() => setEditingModule({
                              ...module,
                              videoUrl: module.videoUrl || '',
                              ageGroup: module.ageGroup || '',
                            })}>
                              <Edit className="w-4 h-4" />
                            </Button>
                          </DialogTrigger>
                          <DialogContent className="max-w-2xl">
                            <DialogHeader>
                              <DialogTitle>Edit Module</DialogTitle>
                            </DialogHeader>
                            {editingModule && (
                              <div className="space-y-4">
                                <div>
                                  <Label htmlFor="edit-title">Module Title</Label>
                                  <Input
                                    id="edit-title"
                                    value={editingModule.title}
                                    onChange={(e) => setEditingModule({ ...editingModule, title: e.target.value })}
                                    placeholder="e.g., Color Recognition"
                                  />
                                </div>
                                <div>
                                  <Label htmlFor="edit-description">Description</Label>
                                  <Textarea
                                    id="edit-description"
                                    value={editingModule.description}
                                    onChange={(e) => setEditingModule({ ...editingModule, description: e.target.value })}
                                    placeholder="Describe what this module teaches..."
                                  />
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                  <div>
                                    <Label htmlFor="edit-type">Module Type</Label>
                                    <Select value={editingModule.type} onValueChange={(value: any) => setEditingModule({ ...editingModule, type: value })}>
                                      <SelectTrigger id="edit-type">
                                        <SelectValue />
                                      </SelectTrigger>
                                      <SelectContent>
                                        <SelectItem value="visual">Visual</SelectItem>
                                        <SelectItem value="audio">Audio</SelectItem>
                                        <SelectItem value="interactive">Interactive</SelectItem>
                                        <SelectItem value="game">Game</SelectItem>
                                      </SelectContent>
                                    </Select>
                                  </div>
                                  <div>
                                    <Label htmlFor="edit-difficulty">Difficulty</Label>
                                    <Select value={editingModule.difficulty} onValueChange={(value: any) => setEditingModule({ ...editingModule, difficulty: value })}>
                                      <SelectTrigger id="edit-difficulty">
                                        <SelectValue />
                                      </SelectTrigger>
                                      <SelectContent>
                                        <SelectItem value="easy">Easy</SelectItem>
                                        <SelectItem value="medium">Medium</SelectItem>
                                        <SelectItem value="hard">Hard</SelectItem>
                                      </SelectContent>
                                    </Select>
                                  </div>
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                  <div>
                                    <Label htmlFor="edit-duration">Duration (minutes)</Label>
                                    <Input
                                      id="edit-duration"
                                      type="number"
                                      value={editingModule.duration}
                                      onChange={(e) => setEditingModule({ ...editingModule, duration: parseInt(e.target.value) })}
                                    />
                                  </div>
                                  <div>
                                    <Label htmlFor="edit-age-group">Age Group</Label>
                                    <Input
                                      id="edit-age-group"
                                      value={editingModule.ageGroup}
                                      onChange={(e) => setEditingModule({ ...editingModule, ageGroup: e.target.value })}
                                      placeholder="e.g., 3-6"
                                    />
                                  </div>
                                </div>
                                <div>
                                  <Label>Video File (Optional)</Label>
                                  {editingModule.videoUrl ? (
                                    <div className="space-y-3">
                                      {/* Current Video Display */}
                                      <div className="relative border rounded-lg p-4 bg-gray-50">
                                        <button
                                          onClick={async () => {
                                            // Delete from Supabase Storage if it exists
                                            if (editingModule.videoUrl.includes('module-videos')) {
                                              try {
                                                const filePath = editingModule.videoUrl.split('/').pop();
                                                if (filePath) {
                                                  await supabase.storage
                                                    .from('module-videos')
                                                    .remove([filePath]);
                                                }
                                              } catch (error) {
                                                console.error('Error deleting video:', error);
                                              }
                                            }
                                            setEditingModule({ ...editingModule, videoUrl: '' });
                                            toast.success('Video removed');
                                          }}
                                          className="absolute top-2 right-2 p-1 bg-red-500 text-white rounded-full hover:bg-red-600 transition-colors"
                                          type="button"
                                        >
                                          <X className="w-4 h-4" />
                                        </button>
                                        <div className="flex items-center space-x-2">
                                          <Video className="w-5 h-5 text-gray-600" />
                                          <p className="text-sm text-gray-700 truncate">{editingModule.videoUrl.split('/').pop()}</p>
                                        </div>
                                        <p className="text-xs text-green-600 mt-1">✓ Stored in cloud</p>
                                      </div>
                                      
                                      {/* Replace Video Option */}
                                      <div className="border-2 border-dashed border-blue-300 rounded-lg p-4 text-center hover:border-blue-400 transition-colors bg-blue-50">
                                        <input
                                          id="edit-video-replace"
                                          type="file"
                                          accept="video/*"
                                          onChange={async (e) => {
                                            const file = e.target.files?.[0];
                                            if (file) {
                                              if (!file.type.startsWith('video/')) {
                                                toast.error('Invalid file type', { description: 'Please upload a video file' });
                                                return;
                                              }
                                              if (file.size > 100 * 1024 * 1024) {
                                                toast.error('File too large', { description: 'Max 100MB' });
                                                return;
                                              }
                                              
                                              try {
                                                // Delete old video first
                                                if (editingModule.videoUrl.includes('module-videos')) {
                                                  const oldFilePath = editingModule.videoUrl.split('/').pop();
                                                  if (oldFilePath) {
                                                    await supabase.storage
                                                      .from('module-videos')
                                                      .remove([oldFilePath]);
                                                  }
                                                }
                                                
                                                // Upload new video
                                                const fileExt = file.name.split('.').pop();
                                                const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;
                                                
                                                const { error } = await supabase.storage
                                                  .from('module-videos')
                                                  .upload(fileName, file, {
                                                    cacheControl: '3600',
                                                    upsert: false
                                                  });

                                                if (error) throw error;

                                                // Get public URL
                                                const { data: { publicUrl } } = supabase.storage
                                                  .from('module-videos')
                                                  .getPublicUrl(fileName);

                                                setEditingModule({ ...editingModule, videoUrl: publicUrl });
                                                toast.success('Video replaced!');
                                              } catch (error: any) {
                                                console.error('Error replacing video:', error);
                                                toast.error('Upload failed', { description: error.message });
                                              }
                                            }
                                          }}
                                          className="hidden"
                                        />
                                        <label htmlFor="edit-video-replace" className="cursor-pointer">
                                          <Upload className="w-6 h-6 mx-auto mb-1 text-blue-500" />
                                          <p className="text-xs text-blue-600 font-medium">Click to replace with new video</p>
                                        </label>
                                      </div>
                                    </div>
                                  ) : (
                                    <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center hover:border-gray-400 transition-colors">
                                      <input
                                        id="edit-video"
                                        type="file"
                                        accept="video/*"
                                        onChange={async (e) => {
                                          const file = e.target.files?.[0];
                                          if (file) {
                                            if (!file.type.startsWith('video/')) {
                                              toast.error('Invalid file type', { description: 'Please upload a video file' });
                                              return;
                                            }
                                            if (file.size > 100 * 1024 * 1024) {
                                              toast.error('File too large', { description: 'Max 100MB' });
                                              return;
                                            }
                                            
                                            try {
                                              // Generate unique filename
                                              const fileExt = file.name.split('.').pop();
                                              const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;
                                              
                                              // Upload to Supabase Storage
                                              const { data, error } = await supabase.storage
                                                .from('module-videos')
                                                .upload(fileName, file, {
                                                  cacheControl: '3600',
                                                  upsert: false
                                                });

                                              if (error) throw error;

                                              // Get public URL
                                              const { data: { publicUrl } } = supabase.storage
                                                .from('module-videos')
                                                .getPublicUrl(fileName);

                                              setEditingModule({ ...editingModule, videoUrl: publicUrl });
                                              toast.success('Video uploaded!');
                                            } catch (error: any) {
                                              console.error('Error uploading video:', error);
                                              toast.error('Upload failed', { description: error.message });
                                            }
                                          }
                                        }}
                                        className="hidden"
                                      />
                                      <label htmlFor="edit-video" className="cursor-pointer">
                                        <Upload className="w-6 h-6 mx-auto mb-1 text-gray-400" />
                                        <p className="text-xs text-gray-600">Click to upload video</p>
                                      </label>
                                    </div>
                                  )}
                                  <p className="text-xs text-muted-foreground mt-1">
                                    Upload a video file that children will watch (max 100MB).
                                  </p>
                                </div>
                                <div className="flex justify-end space-x-2 pt-4">
                                  <Button variant="outline" onClick={() => setEditingModule(null)}>Cancel</Button>
                                  <Button onClick={handleEditModule}>Save Changes</Button>
                                </div>
                              </div>
                            )}
                          </DialogContent>
                        </Dialog>

                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button variant="ghost" size="sm" className="text-red-500 hover:text-red-700">
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Delete Module</AlertDialogTitle>
                              <AlertDialogDescription>
                                Are you sure you want to delete "{module.title}"? This action cannot be undone.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancel</AlertDialogCancel>
                              <AlertDialogAction onClick={() => handleDeleteModule(module)} className="bg-red-500 hover:bg-red-600">
                                Delete
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="pt-0">
                    <div className="flex flex-wrap gap-2 mb-3">
                      <Badge className={getTypeColor(module.type)}>
                        {module.type}
                      </Badge>
                      <Badge className={getDifficultyColor(module.difficulty)}>
                        {module.difficulty}
                      </Badge>
                      <Badge variant="outline">
                        {module.ageGroup} years
                      </Badge>
                      {module.videoUrl && (
                        <Badge className="bg-red-100 text-red-800">
                          <Video className="w-3 h-3 mr-1" />
                          Video
                        </Badge>
                      )}
                    </div>
                    <div className="flex items-center justify-between text-sm text-muted-foreground">
                      <span className="flex items-center">
                        <Clock className="w-4 h-4 mr-1" />
                        {module.duration} min
                      </span>
                      <span>Created by you</span>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="analytics">
            <Card>
              <CardHeader>
                <CardTitle>Learning Analytics</CardTitle>
              </CardHeader>
              <CardContent>
                {statsCards.activeLearners === 0 ? (
                  <div className="text-center py-12 px-4">
                    <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-100 rounded-full mb-4">
                      <Users className="w-8 h-8 text-blue-600" />
                    </div>
                    <h3 className="text-xl font-semibold mb-2">No Students Assigned</h3>
                    <p className="text-gray-600 mb-4 max-w-md mx-auto">
                      You don't have any children assigned to you yet. Analytics will appear once children are assigned and complete modules.
                    </p>
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 max-w-lg mx-auto text-left">
                      <p className="text-sm font-semibold text-blue-900 mb-2">💡 To get started:</p>
                      <ol className="text-sm text-blue-800 space-y-1 list-decimal list-inside">
                        <li>Contact your administrator to assign children to your account</li>
                        <li>Or run the SQL script: <code className="bg-blue-100 px-1 rounded">supabase/SQL/assign-children-to-educator.sql</code></li>
                        <li>Children need to be linked via the <code className="bg-blue-100 px-1 rounded">educator_id</code> field</li>
                      </ol>
                    </div>
                  </div>
                ) : analytics.totalSessions === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    <p className="text-lg mb-2">No activity data yet</p>
                    <p className="text-sm">You have {statsCards.activeLearners} student(s) assigned, but no completed modules yet</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="p-4 bg-blue-50 rounded-lg">
                        <h3 className="text-lg mb-2">Most Popular Module</h3>
                        <p className="font-semibold">{analytics.mostPopularModule.name}</p>
                        <p className="text-sm text-muted-foreground">{analytics.mostPopularModule.completionRate}% average score</p>
                      </div>
                      <div className="p-4 bg-green-50 rounded-lg">
                        <h3 className="text-lg mb-2">Average Attention Span</h3>
                        <p className="font-semibold">{analytics.avgAttentionSpan} minutes</p>
                        <p className="text-sm text-muted-foreground">Across {analytics.totalSessions} sessions</p>
                      </div>
                    </div>
                    <div className="p-4 bg-purple-50 rounded-lg">
                      <h3 className="text-lg mb-2">Engagement Insights</h3>
                      {(() => {
                        const engagement = getHighestEngagementType();
                        return (
                          <>
                            <p>{engagement.type.charAt(0).toUpperCase() + engagement.type.slice(1)} modules show the highest engagement</p>
                            <p className="text-sm text-muted-foreground">Consider creating more {engagement.type} content</p>
                          </>
                        );
                      })()}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}