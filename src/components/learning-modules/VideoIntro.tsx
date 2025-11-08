import React, { useState } from 'react';
import { Button } from '../ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Play, SkipForward, ArrowLeft } from 'lucide-react';

interface VideoIntroProps {
  title: string;
  description: string;
  videoUrl: string;
  onComplete: () => void;
  onExit: () => void;
}

export function VideoIntro({ title, description, videoUrl, onComplete, onExit }: VideoIntroProps) {
  const [videoStarted, setVideoStarted] = useState(false);
  const [videoEnded, setVideoEnded] = useState(false);

  const handleVideoEnd = () => {
    setVideoEnded(true);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-100 to-purple-100 p-4">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <Button variant="outline" onClick={onExit} className="flex items-center space-x-2">
          <ArrowLeft className="w-4 h-4" />
          <span>Back</span>
        </Button>
      </div>

      <div className="flex flex-col items-center space-y-6 max-w-4xl mx-auto">
        <Card className="w-full">
          <CardHeader>
            <CardTitle className="text-center text-2xl flex items-center justify-center gap-2">
              <Play className="w-6 h-6" />
              {title}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-center text-lg mb-6 text-muted-foreground">{description}</p>
            
            {!videoStarted ? (
              <div className="flex flex-col items-center space-y-4">
                <div className="w-full aspect-video bg-gradient-to-br from-purple-200 to-blue-200 rounded-lg flex items-center justify-center">
                  <Button 
                    onClick={() => setVideoStarted(true)}
                    size="lg"
                    className="text-xl p-8"
                  >
                    <Play className="w-8 h-8 mr-2" />
                    Watch Introduction Video
                  </Button>
                </div>
                <p className="text-sm text-muted-foreground text-center">
                  This short video will help you understand the activity better!
                </p>
              </div>
            ) : (
              <div className="w-full aspect-video rounded-lg overflow-hidden shadow-lg bg-black">
                <video
                  width="100%"
                  height="100%"
                  controls
                  autoPlay
                  onEnded={handleVideoEnd}
                  className="w-full h-full"
                >
                  <source src={videoUrl} type="video/mp4" />
                  Your browser does not support the video tag.
                </video>
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row gap-4 mt-6 justify-center">
              <Button 
                onClick={onComplete}
                size="lg"
                className="flex items-center gap-2"
              >
                <SkipForward className="w-5 h-5" />
                {videoStarted ? "Continue to Activity" : "Skip Video & Start Activity"}
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Fun Facts or Tips */}
        <Card className="w-full bg-yellow-50 border-yellow-200">
          <CardContent className="p-4">
            <p className="text-center">
              <span className="text-2xl mr-2">💡</span>
              <span className="text-sm">Take your time and enjoy learning! You can watch the video again anytime.</span>
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
