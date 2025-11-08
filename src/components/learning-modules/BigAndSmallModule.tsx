import React, { useState, useEffect } from 'react';
import { Button } from '../ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Progress } from '../ui/progress';
import { Badge } from '../ui/badge';
import { LearningModule } from '../../App';
import { ArrowLeft, Star, RotateCcw, Eye } from 'lucide-react';
import { AnimatedIntro } from './AnimatedIntro';

interface BigAndSmallModuleProps {
  module: LearningModule;
  onComplete: (completionRate: number, correctAnswers?: number, totalQuestions?: number) => void;
  onExit: () => void;
}

interface SizeComparisonData {
  question: string;
  options: {
    emoji: string;
    size: 'big' | 'small';
    label: string;
  }[];
  correctAnswer: 'big' | 'small';
  explanation: string;
}

const sizeComparisons: SizeComparisonData[] = [
  {
    question: "Which elephant is BIG?",
    options: [
      { emoji: '🐘', size: 'big', label: 'Big Elephant' },
      { emoji: '🐘', size: 'small', label: 'Small Elephant' }
    ],
    correctAnswer: 'big',
    explanation: "Great! The bigger elephant is BIG!"
  },
  {
    question: "Which ball is SMALL?",
    options: [
      { emoji: '⚽', size: 'big', label: 'Big Ball' },
      { emoji: '⚽', size: 'small', label: 'Small Ball' }
    ],
    correctAnswer: 'small',
    explanation: "Perfect! The smaller ball is SMALL!"
  },
  {
    question: "Which tree is BIG?",
    options: [
      { emoji: '🌳', size: 'small', label: 'Small Tree' },
      { emoji: '🌳', size: 'big', label: 'Big Tree' }
    ],
    correctAnswer: 'big',
    explanation: "Wonderful! The bigger tree is BIG!"
  },
  {
    question: "Which car is SMALL?",
    options: [
      { emoji: '🚗', size: 'small', label: 'Small Car' },
      { emoji: '🚗', size: 'big', label: 'Big Car' }
    ],
    correctAnswer: 'small',
    explanation: "Excellent! The smaller car is SMALL!"
  },
  {
    question: "Which house is BIG?",
    options: [
      { emoji: '🏠', size: 'big', label: 'Big House' },
      { emoji: '🏠', size: 'small', label: 'Small House' }
    ],
    correctAnswer: 'big',
    explanation: "Amazing! The bigger house is BIG!"
  }
];

export function BigAndSmallModule({ module, onComplete, onExit }: BigAndSmallModuleProps) {
  const [showVideo, setShowVideo] = useState(true);
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [score, setScore] = useState(0);
  const [gamePhase, setGamePhase] = useState<'instruction' | 'playing' | 'complete'>('instruction');
  const [selectedAnswer, setSelectedAnswer] = useState<'big' | 'small' | null>(null);
  const [feedback, setFeedback] = useState<'correct' | 'incorrect' | null>(null);
  const [shuffledQuestions, setShuffledQuestions] = useState<SizeComparisonData[]>([]);

  // Initialize shuffled questions when component mounts
  useEffect(() => {
    const shuffled = [...sizeComparisons].sort(() => Math.random() - 0.5);
    setShuffledQuestions(shuffled);
  }, []);

  const startGame = () => {
    setGamePhase('playing');
    setCurrentQuestion(0);
    setScore(0);
    setSelectedAnswer(null);
    setFeedback(null);
  };

  const handleAnswerSelect = (selectedSize: 'big' | 'small') => {
    if (selectedAnswer || shuffledQuestions.length === 0) return;
    
    setSelectedAnswer(selectedSize);
    const currentData = shuffledQuestions[currentQuestion];
    const isCorrect = selectedSize === currentData.correctAnswer;
    
    setFeedback(isCorrect ? 'correct' : 'incorrect');
    
    if (isCorrect) {
      setScore(prev => prev + 1);
    }
    
    // Move to next question after delay
    setTimeout(() => {
      if (currentQuestion < shuffledQuestions.length - 1) {
        setCurrentQuestion(prev => prev + 1);
        setSelectedAnswer(null);
        setFeedback(null);
      } else {
        // Game complete
        setGamePhase('complete');
        const completionRate = (score + (isCorrect ? 1 : 0)) / shuffledQuestions.length * 100;
        setTimeout(() => {
          onComplete(completionRate, score + (isCorrect ? 1 : 0), shuffledQuestions.length);
        }, 2000);
      }
    }, 2000);
  };

  const restartGame = () => {
    const shuffled = [...sizeComparisons].sort(() => Math.random() - 0.5);
    setShuffledQuestions(shuffled);
    setGamePhase('instruction');
    setCurrentQuestion(0);
    setScore(0);
    setSelectedAnswer(null);
    setFeedback(null);
  };

  const getSizeStyle = (size: 'big' | 'small') => {
    return size === 'big' 
      ? 'text-8xl transform scale-125' 
      : 'text-4xl transform scale-75';
  };

  if (showVideo) {
    return (
      <AnimatedIntro
        title="Learn About Big and Small! 📏"
        description="Watch this fun animation to learn about comparing sizes before we start the activity!"
        animationType="sizes"
        onComplete={() => setShowVideo(false)}
        onExit={onExit}
      />
    );
  }

  if (gamePhase === 'instruction') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-orange-100 to-yellow-100 flex items-center justify-center p-4">
        <Card className="w-full max-w-2xl bg-white/90 backdrop-blur-sm">
          <CardHeader className="text-center">
            <div className="flex items-center justify-between mb-4">
              <Button variant="outline" size="sm" onClick={onExit}>
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back
              </Button>
              <div></div>
            </div>
            <CardTitle className="text-2xl mb-4">{module.title} 📏</CardTitle>
            <div className="flex items-center justify-center space-x-8 mb-4">
              <div className="text-center">
                <div className="text-8xl mb-2">🐘</div>
                <Badge className="bg-blue-100 text-blue-800">BIG</Badge>
              </div>
              <div className="text-4xl">↔️</div>
              <div className="text-center">
                <div className="text-4xl mb-2">🐘</div>
                <Badge className="bg-green-100 text-green-800">SMALL</Badge>
              </div>
            </div>
          </CardHeader>
          <CardContent className="text-center space-y-6">
            <div className="space-y-4">
              <h3 className="text-lg">How to Play:</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-left">
                <div className="flex items-center space-x-3 p-3 bg-blue-50 rounded-lg">
                  <div className="text-2xl">👀</div>
                  <div>
                    <p className="font-medium">Look</p>
                    <p className="text-sm text-muted-foreground">Compare the sizes of objects</p>
                  </div>
                </div>
                <div className="flex items-center space-x-3 p-3 bg-green-50 rounded-lg">
                  <div className="text-2xl">👆</div>
                  <div>
                    <p className="font-medium">Choose</p>
                    <p className="text-sm text-muted-foreground">Pick the BIG or SMALL object</p>
                  </div>
                </div>
                <div className="flex items-center space-x-3 p-3 bg-purple-50 rounded-lg">
                  <div className="text-2xl">📏</div>
                  <div>
                    <p className="font-medium">Compare</p>
                    <p className="text-sm text-muted-foreground">Learn about different sizes</p>
                  </div>
                </div>
                <div className="flex items-center space-x-3 p-3 bg-yellow-50 rounded-lg">
                  <div className="text-2xl">🎉</div>
                  <div>
                    <p className="font-medium">Celebrate</p>
                    <p className="text-sm text-muted-foreground">Have fun learning!</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="p-4 bg-orange-50 rounded-lg">
              <h4 className="font-medium mb-2">Remember:</h4>
              <div className="flex items-center justify-center space-x-6">
                <div className="text-center">
                  <div className="text-4xl mb-1">📏</div>
                  <p className="text-sm">BIG = Larger</p>
                </div>
                <div className="text-center">
                  <div className="text-2xl mb-1">📏</div>
                  <p className="text-sm">SMALL = Smaller</p>
                </div>
              </div>
            </div>

            <Button onClick={startGame} size="lg" className="w-full md:w-auto">
              Start Learning Sizes! 🚀
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (gamePhase === 'complete') {
    const completionRate = (score / shuffledQuestions.length) * 100;
    return (
      <div className="min-h-screen bg-gradient-to-br from-orange-100 to-yellow-100 flex items-center justify-center p-4">
        <Card className="w-full max-w-md bg-white/90 backdrop-blur-sm">
          <CardHeader className="text-center">
            <CardTitle className="text-2xl mb-4">Fantastic Work! 🎉</CardTitle>
            <div className="text-6xl mb-4">
              {completionRate >= 80 ? '🌟' : completionRate >= 60 ? '👏' : '💪'}
            </div>
          </CardHeader>
          <CardContent className="text-center space-y-6">
            <div className="space-y-4">
              <div>
                <h3 className="text-lg mb-2">Your Score</h3>
                <p className="text-3xl font-bold text-green-600">{score}/{shuffledQuestions.length}</p>
                <Progress value={completionRate} className="h-3 mt-2" />
              </div>
              
              <div className="p-4 bg-blue-50 rounded-lg">
                <p className="text-sm">
                  {completionRate >= 80 
                    ? "Outstanding! You really understand BIG and SMALL! 🏆"
                    : completionRate >= 60
                    ? "Great job! You're learning about sizes! 👍"
                    : "Keep practicing! Every try helps you learn! 💪"
                  }
                </p>
              </div>

              <div className="flex items-center justify-center space-x-6">
                <div className="text-center">
                  <div className="text-3xl mb-1">🐘</div>
                  <Badge className="bg-blue-100 text-blue-800">BIG</Badge>
                </div>
                <div className="text-center">
                  <div className="text-2xl mb-1">🐘</div>
                  <Badge className="bg-green-100 text-green-800">SMALL</Badge>
                </div>
              </div>
            </div>
            
            <div className="flex space-x-3">
              <Button variant="outline" onClick={restartGame} className="flex-1">
                <RotateCcw className="w-4 h-4 mr-2" />
                Play Again
              </Button>
              <Button onClick={onExit} className="flex-1">
                Continue Learning
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Playing phase
  if (shuffledQuestions.length === 0) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-orange-100 to-yellow-100 flex items-center justify-center">
        <div className="text-center">
          <div className="text-4xl mb-4">🔄</div>
          <p>Loading...</p>
        </div>
      </div>
    );
  }

  const currentData = shuffledQuestions[currentQuestion];

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-100 to-yellow-100 p-4">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <Button variant="outline" size="sm" onClick={onExit}>
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back
        </Button>
        <div className="flex items-center space-x-4">
          <Badge variant="outline">
            {currentQuestion + 1}/{shuffledQuestions.length}
          </Badge>
          <Badge variant="outline">
            Score: {score}
          </Badge>
        </div>
      </div>

      {/* Progress */}
      <div className="mb-6">
        <Progress value={((currentQuestion + 1) / shuffledQuestions.length) * 100} className="h-3" />
      </div>

      {/* Game Content */}
      <div className="max-w-4xl mx-auto">
        <Card className="mb-6 bg-white/90 backdrop-blur-sm">
          <CardHeader className="text-center">
            <CardTitle className="text-xl mb-6">
              {currentData.question}
            </CardTitle>
            <div className="flex items-center justify-center space-x-2 mb-4">
              <Eye className="w-5 h-5 text-blue-500" />
              <span className="text-sm text-muted-foreground">Look carefully and compare!</span>
            </div>
          </CardHeader>
        </Card>

        {/* Answer Options */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-2xl mx-auto">
          {currentData.options.map((option, index) => {
            const isSelected = selectedAnswer === option.size;
            const isCorrect = option.size === currentData.correctAnswer;
            const showResult = selectedAnswer !== null;
            
            return (
              <Card
                key={index}
                className={`cursor-pointer transition-all transform hover:scale-105 bg-white/90 backdrop-blur-sm ${
                  isSelected
                    ? showResult && isCorrect
                      ? 'bg-green-100 border-green-500 shadow-lg'
                      : showResult && !isCorrect
                      ? 'bg-red-100 border-red-500 shadow-lg'
                      : 'bg-blue-100 border-blue-500 shadow-lg'
                    : showResult && isCorrect
                    ? 'bg-green-100 border-green-500 shadow-lg'
                    : ''
                }`}
                onClick={() => handleAnswerSelect(option.size)}
              >
                <CardContent className="p-8 text-center">
                  <div className={`mb-4 ${getSizeStyle(option.size)}`}>
                    {option.emoji}
                  </div>

                  
                  {showResult && isSelected && (
                    <div className="mt-4">
                      {isCorrect ? (
                        <div className="flex items-center justify-center space-x-2 text-green-600">
                          <Star className="w-5 h-5 fill-current" />
                          <span>Perfect!</span>
                        </div>
                      ) : (
                        <div className="text-red-600">Try again next time!</div>
                      )}
                    </div>
                  )}
                  {showResult && !isSelected && isCorrect && (
                    <div className="mt-4">
                      <div className="flex items-center justify-center space-x-2 text-green-600">
                        <Star className="w-5 h-5 fill-current" />
                        <span>This was correct</span>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Feedback */}
        {feedback && (
          <Card className={`mt-6 text-center ${
            feedback === 'correct' ? 'bg-green-50 border-green-200' : 'bg-orange-50 border-orange-200'
          }`}>
            <CardContent className="p-4">
              <div className="text-4xl mb-2">
                {feedback === 'correct' ? '🎉' : '🤔'}
              </div>
              <p className="text-lg">
                {feedback === 'correct' 
                  ? currentData.explanation
                  : "That's okay! Keep learning about sizes!"
                }
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}