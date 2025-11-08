import { useState } from 'react';
import { Button } from '../ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Progress } from '../ui/progress';
import { LearningModule } from '../../App';
import { ArrowLeft, Check, X } from 'lucide-react';
import { AnimatedIntro } from './AnimatedIntro';

interface ColorLearningModuleProps {
  module: LearningModule;
  onComplete: (completionRate: number, correctAnswers: number, totalQuestions: number) => void;
  onExit: () => void;
}

interface ColorQuestion {
  color: string;
  options: string[];
  correctAnswer: string;
}

export function ColorLearningModule({ onComplete, onExit }: ColorLearningModuleProps) {
  const [showVideo, setShowVideo] = useState(true);
  const [currentStep, setCurrentStep] = useState(0);
  const [correctAnswers, setCorrectAnswers] = useState(0);
  const [showFeedback, setShowFeedback] = useState(false);
  const [lastAnswerCorrect, setLastAnswerCorrect] = useState(false);

  const colors = ['red', 'blue', 'green', 'yellow', 'purple', 'orange'];
  
  // Generate questions with fixed order to prevent shuffling on re-renders
  const [colorQuestions] = useState<ColorQuestion[]>(() => 
    colors.map(color => {
      const otherColors = colors.filter(c => c !== color).slice(0, 2);
      const allOptions = [color, ...otherColors];
      // Shuffle once when creating the questions, not on every render
      const shuffledOptions = allOptions.sort(() => Math.random() - 0.5);
      
      return {
        color,
        options: shuffledOptions,
        correctAnswer: color
      };
    })
  );

  const totalQuestions = colorQuestions.length;
  const currentQuestion = colorQuestions[currentStep];

  const getColorStyle = (colorName: string) => {
    const colorMap: { [key: string]: string } = {
      red: '#ef4444',
      blue: '#3b82f6',
      green: '#22c55e',
      yellow: '#eab308',
      purple: '#a855f7',
      orange: '#f97316'
    };
    return colorMap[colorName] || '#gray';
  };

  const getColorEmoji = (colorName: string) => {
    const emojiMap: { [key: string]: string } = {
      red: '🍎',
      blue: '🌊',
      green: '🌱',
      yellow: '🌞',
      purple: '🍇',
      orange: '🎃'
    };
    return emojiMap[colorName] || '⭐';
  };

  const handleAnswer = (selectedColor: string) => {
    const isCorrect = selectedColor === currentQuestion.correctAnswer;
    setLastAnswerCorrect(isCorrect);
    setShowFeedback(true);
    
    if (isCorrect) {
      setCorrectAnswers(prev => prev + 1);
    }

    setTimeout(() => {
      setShowFeedback(false);
      if (currentStep < totalQuestions - 1) {
        setCurrentStep(prev => prev + 1);
      } else {
        // Module completed
        const completionRate = Math.round((correctAnswers + (isCorrect ? 1 : 0)) / totalQuestions * 100);
        onComplete(completionRate, correctAnswers + (isCorrect ? 1 : 0), totalQuestions);
      }
    }, 2000);
  };

  const progressPercentage = ((currentStep + 1) / totalQuestions) * 100;

  if (showFeedback) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-100 to-purple-100 flex items-center justify-center p-4">
        <Card className="w-full max-w-md text-center">
          <CardContent className="p-8">
            <div className="text-6xl mb-4">
              {lastAnswerCorrect ? '🎉' : '💙'}
            </div>
            <h2 className="text-2xl mb-2">
              {lastAnswerCorrect ? 'Excellent!' : 'Good Try!'}
            </h2>
            <p className="text-lg text-muted-foreground">
              {lastAnswerCorrect 
                ? `You found the ${currentQuestion.color} color!` 
                : `The correct answer was ${currentQuestion.color}`}
            </p>
            <div 
              className="w-16 h-16 rounded-full mx-auto mt-4 border-4 border-white shadow-lg"
              style={{ backgroundColor: getColorStyle(currentQuestion.color) }}
            />
          </CardContent>
        </Card>
      </div>
    );
  }

  if (showVideo) {
    return (
      <AnimatedIntro
        title="Learn About Colors! 🎨"
        description="Watch this fun animation to learn about different colors before we start the activity!"
        animationType="colors"
        onComplete={() => setShowVideo(false)}
        onExit={onExit}
      />
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-100 to-purple-100 p-4">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <Button variant="outline" onClick={onExit} className="flex items-center space-x-2">
          <ArrowLeft className="w-4 h-4" />
          <span>Back</span>
        </Button>
        <div className="text-sm text-muted-foreground">
          Question {currentStep + 1} of {totalQuestions}
        </div>
      </div>

      {/* Progress */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm">Progress</span>
          <span className="text-sm">{Math.round(progressPercentage)}%</span>
        </div>
        <Progress value={progressPercentage} className="h-3" />
      </div>

      {/* Main Content */}
      <div className="flex flex-col items-center space-y-8">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle className="text-center text-2xl">
              Find the matching color! {getColorEmoji(currentQuestion.color)}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-center mb-6">
              <div 
                className="w-32 h-32 rounded-2xl mx-auto border-4 border-white shadow-xl"
                style={{ backgroundColor: getColorStyle(currentQuestion.color) }}
              />
            </div>

            <div className="space-y-3">
              <p className="text-center text-lg mb-4">Which button matches this color?</p>
              <div className="grid grid-cols-1 gap-3">
                {currentQuestion.options.map((option, index) => (
                  <Button
                    key={index}
                    onClick={() => handleAnswer(option)}
                    className="p-6 text-lg capitalize transition-opacity hover:opacity-90"
                    style={{ 
                      backgroundColor: getColorStyle(option),
                      color: 'white',
                      border: '3px solid white',
                      boxShadow: '0 4px 12px rgba(0,0,0,0.15)'
                    }}
                  >
                    {getColorEmoji(option)}
                  </Button>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Score Display */}
        <Card className="w-full max-w-md bg-white/80 backdrop-blur-sm">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <span className="flex items-center space-x-2">
                <Check className="w-5 h-5 text-green-500" />
                <span>Correct: {correctAnswers}</span>
              </span>
              <span className="flex items-center space-x-2">
                <X className="w-5 h-5 text-red-500" />
                <span>Incorrect: {currentStep - correctAnswers}</span>
              </span>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}