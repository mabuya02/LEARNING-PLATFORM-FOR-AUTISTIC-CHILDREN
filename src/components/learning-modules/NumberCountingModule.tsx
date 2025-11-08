import { useState } from 'react';
import { Button } from '../ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Progress } from '../ui/progress';
import { LearningModule } from '../../App';
import { ArrowLeft, Check, X } from 'lucide-react';
import { AnimatedIntro } from './AnimatedIntro';

interface NumberCountingModuleProps {
  module: LearningModule;
  onComplete: (completionRate: number, correctAnswers: number, totalQuestions: number) => void;
  onExit: () => void;
}

interface CountingQuestion {
  number: number;
  items: string[];
  options: number[];
}

export function NumberCountingModule({ onComplete, onExit }: NumberCountingModuleProps) {
  const [showVideo, setShowVideo] = useState(true);
  const [currentStep, setCurrentStep] = useState(0);
  const [correctAnswers, setCorrectAnswers] = useState(0);
  const [showFeedback, setShowFeedback] = useState(false);
  const [lastAnswerCorrect, setLastAnswerCorrect] = useState(false);

  const emojis = ['🍎', '⭐', '🎈', '🌸', '🦋', '🍓', '🎯', '🌈'];

  // Generate questions with fixed order to prevent shuffling on re-renders
  const [questions] = useState<CountingQuestion[]>(() => {
    const generateQuestion = (targetNumber: number): CountingQuestion => {
      const emoji = emojis[Math.floor(Math.random() * emojis.length)];
      const items = Array(targetNumber).fill(emoji);
      
      // Generate wrong options
      const wrongOptions: number[] = [];
      while (wrongOptions.length < 2) {
        const wrong = Math.floor(Math.random() * 10) + 1;
        if (wrong !== targetNumber && !wrongOptions.includes(wrong)) {
          wrongOptions.push(wrong);
        }
      }
      
      // Shuffle once when creating the questions, not on every render
      const allOptions = [targetNumber, ...wrongOptions];
      const shuffledOptions = allOptions.sort(() => Math.random() - 0.5);
      
      return {
        number: targetNumber,
        items,
        options: shuffledOptions
      };
    };

    return [1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(generateQuestion);
  });
  const totalQuestions = questions.length;
  const currentQuestion = questions[currentStep];

  const handleAnswer = (selectedNumber: number) => {
    const isCorrect = selectedNumber === currentQuestion.number;
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
      <div className="min-h-screen bg-gradient-to-br from-green-100 to-blue-100 flex items-center justify-center p-4">
        <Card className="w-full max-w-md text-center">
          <CardContent className="p-8">
            <div className="text-6xl mb-4">
              {lastAnswerCorrect ? '🎉' : '💙'}
            </div>
            <h2 className="text-2xl mb-2">
              {lastAnswerCorrect ? 'Great Counting!' : 'Good Try!'}
            </h2>
            <p className="text-lg text-muted-foreground">
              {lastAnswerCorrect 
                ? `Yes! There are ${currentQuestion.number} items!` 
                : `The correct answer was ${currentQuestion.number}`}
            </p>
            <div className="flex justify-center flex-wrap gap-2 mt-4">
              {currentQuestion.items.slice(0, Math.min(currentQuestion.number, 6)).map((item, index) => (
                <span key={index} className="text-3xl">{item}</span>
              ))}
              {currentQuestion.number > 6 && (
                <span className="text-2xl text-muted-foreground">...</span>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (showVideo) {
    return (
      <AnimatedIntro
        title="Learn to Count! 🔢"
        description="Watch this fun animation to learn counting from 1 to 10 before we start the activity!"
        animationType="numbers"
        onComplete={() => setShowVideo(false)}
        onExit={onExit}
      />
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-100 to-blue-100 p-4">
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
              Count the items! 🔢
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-center mb-6">
              <div className="bg-white rounded-xl p-6 shadow-lg">
                <div className="flex justify-center flex-wrap gap-3 mb-4">
                  {currentQuestion.items.map((item, index) => (
                    <span key={index} className="text-4xl">
                      {item}
                    </span>
                  ))}
                </div>
              </div>
            </div>

            <div className="space-y-3">
              <p className="text-center text-lg mb-4">How many items do you see?</p>
              <div className="grid grid-cols-3 gap-3">
                {currentQuestion.options.map((option, index) => (
                  <Button
                    key={index}
                    onClick={() => handleAnswer(option)}
                    className="p-6 text-2xl transition-colors bg-white text-gray-800 border-2 border-blue-200 hover:border-blue-400 hover:bg-blue-50"
                  >
                    {option}
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

        {/* Encouragement */}
        <Card className="w-full max-w-md bg-gradient-to-r from-yellow-100 to-orange-100 border-yellow-200">
          <CardContent className="p-4 text-center">
            <div className="text-2xl mb-2">🌟</div>
            <p className="text-sm">
              {currentStep < 3 ? "You're just getting started!" :
               currentStep < 7 ? "You're doing great!" :
               "Almost there! Keep counting!"}
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}