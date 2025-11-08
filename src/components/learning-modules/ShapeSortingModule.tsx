import React, { useState } from 'react';
import { Button } from '../ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Progress } from '../ui/progress';
import { LearningModule } from '../../App';
import { ArrowLeft, Check, X } from 'lucide-react';
import { AnimatedIntro } from './AnimatedIntro';

interface ShapeSortingModuleProps {
  module: LearningModule;
  onComplete: (completionRate: number, correctAnswers: number, totalQuestions: number) => void;
  onExit: () => void;
}

interface ShapeQuestion {
  targetShape: string;
  shapes: { shape: string; id: number }[];
  correctIds: number[];
}

export function ShapeSortingModule({ module, onComplete, onExit }: ShapeSortingModuleProps) {
  const [showVideo, setShowVideo] = useState(true);
  const [currentStep, setCurrentStep] = useState(0);
  const [correctAnswers, setCorrectAnswers] = useState(0);
  const [selectedShapes, setSelectedShapes] = useState<number[]>([]);
  const [showFeedback, setShowFeedback] = useState(false);
  const [lastAnswerCorrect, setLastAnswerCorrect] = useState(false);

  const shapes = ['circle', 'square', 'triangle', 'rectangle'];
  
  // Generate questions with fixed order to prevent shuffling on re-renders
  const [questions] = useState<ShapeQuestion[]>(() => {
    const generateQuestion = (targetShape: string): ShapeQuestion => {
      const allShapes: { shape: string; id: number }[] = [];
      let id = 0;
      
      // Add 2-3 target shapes
      const targetCount = Math.floor(Math.random() * 2) + 2;
      const correctIds: number[] = [];
      
      for (let i = 0; i < targetCount; i++) {
        allShapes.push({ shape: targetShape, id });
        correctIds.push(id);
        id++;
      }
      
      // Add 3-4 other shapes
      const otherShapes = shapes.filter(s => s !== targetShape);
      const otherCount = Math.floor(Math.random() * 2) + 3;
      
      for (let i = 0; i < otherCount; i++) {
        const randomShape = otherShapes[Math.floor(Math.random() * otherShapes.length)];
        allShapes.push({ shape: randomShape, id });
        id++;
      }
      
      // Shuffle once when creating the questions, not on every render
      allShapes.sort(() => Math.random() - 0.5);
      
      return {
        targetShape,
        shapes: allShapes,
        correctIds
      };
    };

    return shapes.map(generateQuestion);
  });
  const totalQuestions = questions.length;
  const currentQuestion = questions[currentStep];

  const getShapeElement = (shape: string, size: number = 60) => {
    const colors = {
      circle: '#ef4444',
      square: '#3b82f6',
      triangle: '#22c55e',
      rectangle: '#a855f7'
    };

    const color = colors[shape as keyof typeof colors] || '#6b7280';

    switch (shape) {
      case 'circle':
        return (
          <div
            className="rounded-full border-2 border-white shadow-lg"
            style={{ 
              width: size, 
              height: size, 
              backgroundColor: color 
            }}
          />
        );
      case 'square':
        return (
          <div
            className="border-2 border-white shadow-lg"
            style={{ 
              width: size, 
              height: size, 
              backgroundColor: color 
            }}
          />
        );
      case 'triangle':
        return (
          <div
            className="relative border-2 border-white shadow-lg"
            style={{ 
              width: 0, 
              height: 0,
              borderLeft: `${size/2}px solid transparent`,
              borderRight: `${size/2}px solid transparent`,
              borderBottom: `${size}px solid ${color}`,
              borderTop: 'none'
            }}
          />
        );
      case 'rectangle':
        return (
          <div
            className="border-2 border-white shadow-lg"
            style={{ 
              width: size * 1.5, 
              height: size, 
              backgroundColor: color 
            }}
          />
        );
      default:
        return null;
    }
  };

  const handleShapeClick = (shapeId: number) => {
    setSelectedShapes(prev => {
      if (prev.includes(shapeId)) {
        return prev.filter(id => id !== shapeId);
      } else {
        return [...prev, shapeId];
      }
    });
  };

  const handleSubmit = () => {
    const correctSelected = selectedShapes.filter(id => currentQuestion.correctIds.includes(id)).length;
    const incorrectSelected = selectedShapes.filter(id => !currentQuestion.correctIds.includes(id)).length;
    const missedCorrect = currentQuestion.correctIds.filter(id => !selectedShapes.includes(id)).length;
    
    const isCorrect = correctSelected === currentQuestion.correctIds.length && incorrectSelected === 0;
    
    setLastAnswerCorrect(isCorrect);
    setShowFeedback(true);
    
    if (isCorrect) {
      setCorrectAnswers(prev => prev + 1);
    }

    setTimeout(() => {
      setShowFeedback(false);
      setSelectedShapes([]);
      
      if (currentStep < totalQuestions - 1) {
        setCurrentStep(prev => prev + 1);
      } else {
        // Module completed
        const completionRate = Math.round((correctAnswers + (isCorrect ? 1 : 0)) / totalQuestions * 100);
        onComplete(completionRate, correctAnswers + (isCorrect ? 1 : 0), totalQuestions);
      }
    }, 2500);
  };

  const progressPercentage = ((currentStep + 1) / totalQuestions) * 100;

  if (showFeedback) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-100 to-pink-100 flex items-center justify-center p-4">
        <Card className="w-full max-w-md text-center">
          <CardContent className="p-8">
            <div className="text-6xl mb-4">
              {lastAnswerCorrect ? '🎉' : '💙'}
            </div>
            <h2 className="text-2xl mb-2">
              {lastAnswerCorrect ? 'Perfect Sorting!' : 'Good Try!'}
            </h2>
            <p className="text-lg text-muted-foreground mb-4">
              {lastAnswerCorrect 
                ? `You found all the ${currentQuestion.targetShape}s!` 
                : `Look for the ${currentQuestion.targetShape}s next time`}
            </p>
            <div className="flex justify-center items-center">
              {getShapeElement(currentQuestion.targetShape, 80)}
            </div>
            <p className="text-sm text-muted-foreground mt-2 capitalize">
              {currentQuestion.targetShape}
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (showVideo) {
    return (
      <AnimatedIntro
        title="Learn About Shapes! ⭐"
        description="Watch this fun animation to learn about different shapes before we start the activity!"
        animationType="shapes"
        onComplete={() => setShowVideo(false)}
        onExit={onExit}
      />
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-100 to-pink-100 p-4">
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
            <CardTitle className="text-center text-xl">
              Find all the matching shapes! 🔍
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-center mb-6">
              <div className="bg-white rounded-xl p-4 shadow-lg mb-4">
                <p className="text-sm text-muted-foreground mb-3">Look for this shape:</p>
                <div className="flex justify-center items-center">
                  {getShapeElement(currentQuestion.targetShape, 60)}
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <p className="text-center text-sm">Tap all the shapes that match the one above:</p>
              <div className="grid grid-cols-3 gap-4 bg-white rounded-xl p-4 shadow-inner">
                {currentQuestion.shapes.map((shapeData) => (
                  <button
                    key={shapeData.id}
                    onClick={() => handleShapeClick(shapeData.id)}
                    className={`flex items-center justify-center p-4 rounded-lg transition-colors ${
                      selectedShapes.includes(shapeData.id)
                        ? 'bg-blue-100 ring-2 ring-blue-400'
                        : 'bg-gray-50 hover:bg-gray-100'
                    }`}
                  >
                    {getShapeElement(shapeData.shape, 40)}
                  </button>
                ))}
              </div>
              
              <div className="text-center">
                <p className="text-sm text-muted-foreground mb-3">
                  Selected: {selectedShapes.length} shape{selectedShapes.length !== 1 ? 's' : ''}
                </p>
                <Button 
                  onClick={handleSubmit}
                  disabled={selectedShapes.length === 0}
                  className="px-8 py-2"
                >
                  Check My Answer
                </Button>
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

        {/* Hint */}
        <Card className="w-full max-w-md bg-gradient-to-r from-blue-100 to-purple-100 border-blue-200">
          <CardContent className="p-4 text-center">
            <div className="text-2xl mb-2">💡</div>
            <p className="text-sm">
              Look carefully at each shape. Some might look similar but are different!
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}