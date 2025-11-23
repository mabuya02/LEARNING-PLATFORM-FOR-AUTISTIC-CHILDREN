import { useState } from 'react';
import { Button } from '../ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Progress } from '../ui/progress';
import { LearningModule } from '../../App';
import { ArrowLeft, Play, CheckCircle, Star } from 'lucide-react';

interface DynamicLearningModuleProps {
  module: LearningModule;
  onComplete: (completionRate: number, correctAnswers?: number, totalQuestions?: number) => void;
  onExit: () => void;
}

export function DynamicLearningModule({ module, onComplete, onExit }: DynamicLearningModuleProps) {
  // Check if module has a valid video URL
  const hasVideo = module.videoUrl && module.videoUrl.trim() !== '';
  // If module has video, show it immediately, otherwise show module content
  const [showVideo, setShowVideo] = useState(hasVideo);
  const [isCompleted, setIsCompleted] = useState(false);

  // Debug logging to check if video URL is present
  console.log('🎬 DynamicLearningModule - Module data:', {
    title: module.title,
    videoUrl: module.videoUrl,
    hasVideo,
    showVideo
  });

  // Show the actual learning video when requested
  if (showVideo && hasVideo) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-100 to-purple-100 p-4">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <Button variant="outline" onClick={onExit} className="flex items-center space-x-2">
            <ArrowLeft className="w-4 h-4" />
            <span>Back to Home</span>
          </Button>
        </div>

        <div className="flex flex-col items-center space-y-6 max-w-4xl mx-auto">
          <Card className="w-full">
            <CardHeader>
              <CardTitle className="text-center text-2xl flex items-center justify-center gap-2">
                <Play className="w-6 h-6" />
                {module.title}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-center text-lg mb-6 text-muted-foreground">{module.description}</p>
              
              <div className="w-full aspect-video rounded-lg overflow-hidden shadow-lg bg-black">
                <video
                  width="100%"
                  height="100%"
                  controls
                  autoPlay
                  onEnded={() => {
                    setIsCompleted(true);
                    onComplete(100, 1, 1); // Mark as completed when video ends
                  }}
                  className="w-full h-full"
                >
                  <source src={module.videoUrl} type="video/mp4" />
                  Your browser does not support the video tag.
                </video>
              </div>

              <div className="flex justify-center mt-6 space-x-4">
                <Button onClick={onExit} variant="outline">
                  Back to Home
                </Button>
                <Button 
                  onClick={() => {
                    setIsCompleted(true);
                    onComplete(100, 1, 1);
                  }}
                  className="bg-green-500 hover:bg-green-600"
                >
                  Mark as Complete
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  // If module is completed, show completion screen
  if (isCompleted) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-100 to-blue-100 flex items-center justify-center p-4">
        <Card className="w-full max-w-md text-center">
          <CardContent className="p-8">
            <div className="text-6xl mb-4">🎉</div>
            <h2 className="text-2xl mb-2">Congratulations!</h2>
            <p className="text-lg text-muted-foreground mb-4">
              You completed {module.title}!
            </p>
            <div className="flex items-center justify-center mb-4">
              <Star className="w-6 h-6 text-yellow-500 fill-current" />
              <Star className="w-6 h-6 text-yellow-500 fill-current" />
              <Star className="w-6 h-6 text-yellow-500 fill-current" />
            </div>
            <Button 
              onClick={() => onComplete(100)} 
              className="w-full"
              size="lg"
            >
              Continue Learning
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Main module content - generic interactive learning experience
  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-100 to-pink-100 p-4">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <Button variant="outline" onClick={onExit} className="flex items-center space-x-2">
          <ArrowLeft className="w-4 h-4" />
          <span>Back</span>
        </Button>
        <div className="text-sm text-muted-foreground">
          {module.difficulty} • {module.ageGroup}
        </div>
      </div>

      <div className="max-w-4xl mx-auto">
        {/* Module Header */}
        <Card className="mb-6 bg-white/90 backdrop-blur-sm">
          <CardHeader className="text-center">
            <CardTitle className="text-3xl mb-4 flex items-center justify-center gap-2">
              <Play className="w-8 h-8 text-blue-500" />
              {module.title}
            </CardTitle>
            <p className="text-lg text-muted-foreground">{module.description}</p>
            
            {/* Video Available Indicator */}
            {hasVideo && (
              <div className="flex items-center justify-center gap-2 mt-3 text-blue-600">
                <Play className="w-5 h-5" />
                <span className="text-sm font-medium">Video Available</span>
              </div>
            )}
            
            {/* Module Type Badge */}
            <div className="flex justify-center mt-4">
              <span className={`px-4 py-2 rounded-full text-sm font-medium ${
                module.type === 'visual' ? 'bg-purple-100 text-purple-800' :
                module.type === 'audio' ? 'bg-green-100 text-green-800' :
                module.type === 'interactive' ? 'bg-blue-100 text-blue-800' :
                'bg-yellow-100 text-yellow-800'
              }`}>
                {module.type} learning
              </span>
            </div>
          </CardHeader>
        </Card>

        {/* Interactive Content Area */}
        <Card className="bg-white/90 backdrop-blur-sm">
          <CardContent className="p-8">
            <div className="text-center space-y-6">
              {/* Content based on module type */}
              {module.type === 'visual' && (
                <div className="space-y-4">
                  <div className="text-6xl mb-4">👁️</div>
                  <h3 className="text-2xl">Visual Learning Experience</h3>
                  <p className="text-muted-foreground">
                    Explore visual concepts and practice observation skills
                  </p>
                </div>
              )}

              {module.type === 'audio' && (
                <div className="space-y-4">
                  <div className="text-6xl mb-4">🔊</div>
                  <h3 className="text-2xl">Audio Learning Experience</h3>
                  <p className="text-muted-foreground">
                    Listen and learn through sounds and audio cues
                  </p>
                </div>
              )}

              {module.type === 'interactive' && (
                <div className="space-y-4">
                  <div className="text-6xl mb-4">🎮</div>
                  <h3 className="text-2xl">Interactive Learning Experience</h3>
                  <p className="text-muted-foreground">
                    Engage with interactive activities and practice exercises
                  </p>
                </div>
              )}

              {module.type === 'game' && (
                <div className="space-y-4">
                  <div className="text-6xl mb-4">🎯</div>
                  <h3 className="text-2xl">Game-Based Learning</h3>
                  <p className="text-muted-foreground">
                    Learn through fun games and challenges
                  </p>
                </div>
              )}

              {/* Module Content Display */}
              {module.content && Object.keys(module.content).length > 0 && (
                <div className="mt-6 p-4 bg-gray-50 rounded-lg">
                  <h4 className="text-lg font-medium mb-2">Learning Topics:</h4>
                  <div className="flex flex-wrap gap-2 justify-center">
                    {Object.entries(module.content).map(([key, value]) => (
                      <span 
                        key={key}
                        className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm"
                      >
                        {Array.isArray(value) ? value.join(', ') : String(value)}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Duration Info */}
              <div className="flex items-center justify-center gap-2 text-muted-foreground">
                <span>⏱️</span>
                <span>Estimated time: {module.duration} minutes</span>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-4 justify-center mt-8">
                {hasVideo ? (
                  <div className="space-y-4">
                    <Button 
                      onClick={() => setShowVideo(true)}
                      size="lg"
                      className="px-8 py-6 text-lg bg-blue-600 hover:bg-blue-700"
                    >
                      <Play className="w-6 h-6 mr-3" />
                      Watch Learning Video
                    </Button>
                    <p className="text-sm text-muted-foreground">
                      Start by watching the video to learn about {module.title}
                    </p>
                  </div>
                ) : (
                  <Button 
                    onClick={() => setIsCompleted(true)}
                    size="lg"
                    className="px-8 py-6 text-lg"
                  >
                    <CheckCircle className="w-6 h-6 mr-3" />
                    Start Learning Activity
                  </Button>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Progress Indicator */}
        <Card className="mt-6 bg-white/80">
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm">Progress</span>
              <span className="text-sm font-medium">Ready to learn!</span>
            </div>
            <Progress value={0} className="h-2" />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}