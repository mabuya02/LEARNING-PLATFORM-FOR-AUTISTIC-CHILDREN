import { Eye, EyeOff, AlertCircle, CheckCircle, Camera, CameraOff } from 'lucide-react';
import { Card, CardContent } from '../ui/card';
import { Progress } from '../ui/progress';
import { Button } from '../ui/button';

interface AttentionData {
  attention_score: number;
  engagement_level: 'high' | 'medium' | 'low';
  eye_aspect_ratio: number;
  head_tilt: number;
  face_detected: boolean;
  timestamp: string;
}

interface AttentionIndicatorProps {
  isTracking: boolean;
  hasPermission: boolean | null;
  currentAttention: AttentionData | null;
  error: string | null;
  onRequestPermission: () => void;
  onStartTracking: () => void;
  onStopTracking: () => void;
}

export function AttentionIndicator({
  isTracking,
  hasPermission,
  currentAttention,
  error,
  onRequestPermission,
  onStartTracking,
  onStopTracking
}: AttentionIndicatorProps) {
  
  const getEngagementColor = (level: string) => {
    switch (level) {
      case 'high': return 'text-green-600';
      case 'medium': return 'text-yellow-600';
      case 'low': return 'text-red-600';
      default: return 'text-gray-600';
    }
  };

  const getEngagementIcon = (level: string) => {
    switch (level) {
      case 'high': return <CheckCircle className="w-4 h-4 text-green-600" />;
      case 'medium': return <Eye className="w-4 h-4 text-yellow-600" />;
      case 'low': return <AlertCircle className="w-4 h-4 text-red-600" />;
      default: return <EyeOff className="w-4 h-4 text-gray-600" />;
    }
  };

  // If no permission yet, show permission request
  if (hasPermission === null || hasPermission === false) {
    return (
      <Card className="w-full max-w-sm bg-blue-50 border-blue-200">
        <CardContent className="p-4">
          <div className="flex items-center space-x-3 mb-3">
            <Camera className="w-5 h-5 text-blue-600" />
            <h3 className="font-medium text-blue-800">Attention Tracking</h3>
          </div>
          
          <p className="text-sm text-blue-700 mb-3">
            Enable camera to track your attention while watching the video.
          </p>
          
          {error && (
            <p className="text-sm text-red-600 mb-3">{error}</p>
          )}
          
          <Button 
            onClick={onRequestPermission}
            className="w-full text-sm"
            size="sm"
          >
            <Camera className="w-4 h-4 mr-2" />
            Enable Camera
          </Button>
        </CardContent>
      </Card>
    );
  }

  // If permission granted but not tracking, show start button
  if (!isTracking) {
    return (
      <Card className="w-full max-w-sm bg-green-50 border-green-200">
        <CardContent className="p-4">
          <div className="flex items-center space-x-3 mb-3">
            <Camera className="w-5 h-5 text-green-600" />
            <h3 className="font-medium text-green-800">Ready to Track</h3>
          </div>
          
          <p className="text-sm text-green-700 mb-3">
            Camera access granted. Start tracking your attention!
          </p>
          
          <Button 
            onClick={onStartTracking}
            className="w-full text-sm bg-green-600 hover:bg-green-700"
            size="sm"
          >
            <Eye className="w-4 h-4 mr-2" />
            Start Tracking
          </Button>
        </CardContent>
      </Card>
    );
  }

  // Show real-time attention tracking data
  return (
    <Card className="w-full max-w-sm bg-gradient-to-br from-purple-50 to-blue-50 border-purple-200">
      <CardContent className="p-4 space-y-3">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
            <h3 className="font-medium text-purple-800">Tracking Active</h3>
          </div>
          <Button 
            onClick={onStopTracking}
            variant="outline"
            size="sm"
            className="text-xs"
          >
            <CameraOff className="w-3 h-3" />
          </Button>
        </div>

        {/* Attention Score */}
        {currentAttention && (
          <>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Attention Score</span>
                <span className="text-lg font-bold text-purple-700">
                  {Math.round(currentAttention.attention_score)}%
                </span>
              </div>
              <Progress 
                value={currentAttention.attention_score} 
                className="h-2"
              />
            </div>

            {/* Engagement Level */}
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Engagement</span>
              <div className="flex items-center space-x-1">
                {getEngagementIcon(currentAttention.engagement_level)}
                <span className={`text-sm font-medium capitalize ${getEngagementColor(currentAttention.engagement_level)}`}>
                  {currentAttention.engagement_level}
                </span>
              </div>
            </div>

            {/* Status Indicators */}
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div className="flex items-center space-x-1">
                {currentAttention.face_detected ? 
                  <CheckCircle className="w-3 h-3 text-green-600" /> : 
                  <AlertCircle className="w-3 h-3 text-red-600" />
                }
                <span className={currentAttention.face_detected ? 'text-green-600' : 'text-red-600'}>
                  Face {currentAttention.face_detected ? 'detected' : 'not found'}
                </span>
              </div>
              
              <div className="text-gray-600">
                <span>Head: {Math.round(currentAttention.head_tilt)}°</span>
              </div>
            </div>

            {/* Encouragement Messages */}
            {currentAttention.engagement_level === 'high' && (
              <div className="text-xs text-green-700 bg-green-100 p-2 rounded-md text-center">
                🌟 Great focus! Keep it up!
              </div>
            )}
            
            {currentAttention.engagement_level === 'low' && (
              <div className="text-xs text-orange-700 bg-orange-100 p-2 rounded-md text-center">
                👀 Look at the video to stay engaged!
              </div>
            )}
          </>
        )}

        {error && (
          <p className="text-xs text-red-600 bg-red-100 p-2 rounded-md">{error}</p>
        )}
      </CardContent>
    </Card>
  );
}