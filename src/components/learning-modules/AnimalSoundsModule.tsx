import React, { useState, useEffect } from 'react';
import { Button } from '../ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Progress } from '../ui/progress';
import { Badge } from '../ui/badge';
import { LearningModule } from '../../App';
import { Volume2, VolumeX, ArrowLeft, Star, RotateCcw } from 'lucide-react';
import { AnimatedIntro } from './AnimatedIntro';

interface AnimalSoundsModuleProps {
  module: LearningModule;
  onComplete: (completionRate: number, correctAnswers?: number, totalQuestions?: number) => void;
  onExit: () => void;
}

interface AnimalData {
  name: string;
  emoji: string;
  sound: string;
  soundDescription: string;
}

const animals: AnimalData[] = [
  { name: 'cow', emoji: '🐄', sound: 'moo', soundDescription: 'Moo' },
  { name: 'dog', emoji: '🐕', sound: 'woof', soundDescription: 'Woof' },
  { name: 'cat', emoji: '🐱', sound: 'meow', soundDescription: 'Meow' },
  { name: 'bird', emoji: '🐦', sound: 'tweet', soundDescription: 'Tweet' }
];

export function AnimalSoundsModule({ module, onComplete, onExit }: AnimalSoundsModuleProps) {
  const [showVideo, setShowVideo] = useState(true);
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [score, setScore] = useState(0);
  const [gamePhase, setGamePhase] = useState<'instruction' | 'playing' | 'complete'>('instruction');
  const [selectedAnimal, setSelectedAnimal] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<'correct' | 'incorrect' | null>(null);
  const [isSoundEnabled, setIsSoundEnabled] = useState(true);
  const [shuffledQuestions, setShuffledQuestions] = useState<AnimalData[]>([]);
  const [shuffledOptions, setShuffledOptions] = useState<AnimalData[]>([]);

  // Initialize shuffled questions when component mounts
  useEffect(() => {
    const shuffled = [...animals].sort(() => Math.random() - 0.5);
    setShuffledQuestions(shuffled);
  }, []);

  // Shuffle options for current question
  useEffect(() => {
    if (shuffledQuestions.length > 0 && gamePhase === 'playing') {
      const currentAnimal = shuffledQuestions[currentQuestion];
      const otherAnimals = animals.filter(a => a.name !== currentAnimal.name);
      const randomOthers = otherAnimals.sort(() => Math.random() - 0.5).slice(0, 2);
      const options = [currentAnimal, ...randomOthers].sort(() => Math.random() - 0.5);
      setShuffledOptions(options);
    }
  }, [currentQuestion, shuffledQuestions, gamePhase]);

  const startGame = () => {
    setGamePhase('playing');
    setCurrentQuestion(0);
    setScore(0);
    setSelectedAnimal(null);
    setFeedback(null);
  };

  const playSound = (sound: string) => {
    if (!isSoundEnabled) return;
    
    // Create a simple audio feedback using Web Audio API
    try {
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();
      
      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);
      
      // Different frequencies for different animal sounds
      const frequencies: { [key: string]: number } = {
        'moo': 220,
        'woof': 440,
        'meow': 660,
        'tweet': 880
      };
      
      oscillator.frequency.setValueAtTime(frequencies[sound] || 440, audioContext.currentTime);
      gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.5);
      
      oscillator.start(audioContext.currentTime);
      oscillator.stop(audioContext.currentTime + 0.5);
    } catch (error) {
      console.log('Audio not supported');
    }
  };

  const handleAnimalSelect = (animalName: string) => {
    if (selectedAnimal || shuffledQuestions.length === 0) return;
    
    setSelectedAnimal(animalName);
    const currentAnimal = shuffledQuestions[currentQuestion];
    const isCorrect = animalName === currentAnimal.name;
    
    setFeedback(isCorrect ? 'correct' : 'incorrect');
    
    if (isCorrect) {
      setScore(prev => prev + 1);
      playSound('correct');
    }
    
    // Move to next question after delay
    setTimeout(() => {
      if (currentQuestion < shuffledQuestions.length - 1) {
        setCurrentQuestion(prev => prev + 1);
        setSelectedAnimal(null);
        setFeedback(null);
      } else {
        // Game complete
        setGamePhase('complete');
        const completionRate = (score + (isCorrect ? 1 : 0)) / shuffledQuestions.length * 100;
        setTimeout(() => {
          onComplete(completionRate, score + (isCorrect ? 1 : 0), shuffledQuestions.length);
        }, 2000);
      }
    }, 1500);
  };

  const restartGame = () => {
    const shuffled = [...animals].sort(() => Math.random() - 0.5);
    setShuffledQuestions(shuffled);
    setGamePhase('instruction');
    setCurrentQuestion(0);
    setScore(0);
    setSelectedAnimal(null);
    setFeedback(null);
  };

  if (showVideo) {
    return (
      <AnimatedIntro
        title="Learn About Animal Sounds! 🐾"
        description="Watch this fun animation to learn about different animal sounds before we start the activity!"
        animationType="animals"
        onComplete={() => setShowVideo(false)}
        onExit={onExit}
      />
    );
  }

  if (gamePhase === 'instruction') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-100 to-blue-100 flex items-center justify-center p-4">
        <Card className="w-full max-w-2xl bg-white/90 backdrop-blur-sm">
          <CardHeader className="text-center">
            <div className="flex items-center justify-between mb-4">
              <Button variant="outline" size="sm" onClick={onExit}>
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsSoundEnabled(!isSoundEnabled)}
              >
                {isSoundEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
              </Button>
            </div>
            <CardTitle className="text-2xl mb-4">{module.title} 🐾</CardTitle>
            <div className="text-6xl mb-4">🐄🐕🐱🐦</div>
          </CardHeader>
          <CardContent className="text-center space-y-6">
            <div className="space-y-4">
              <h3 className="text-lg">How to Play:</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-left">
                <div className="flex items-center space-x-3 p-3 bg-blue-50 rounded-lg">
                  <div className="text-2xl">👂</div>
                  <div>
                    <p className="font-medium">Listen</p>
                    <p className="text-sm text-muted-foreground">Tap the sound button to hear animal sounds</p>
                  </div>
                </div>
                <div className="flex items-center space-x-3 p-3 bg-green-50 rounded-lg">
                  <div className="text-2xl">👆</div>
                  <div>
                    <p className="font-medium">Choose</p>
                    <p className="text-sm text-muted-foreground">Tap the animal that makes the sound</p>
                  </div>
                </div>
                <div className="flex items-center space-x-3 p-3 bg-purple-50 rounded-lg">
                  <div className="text-2xl">⭐</div>
                  <div>
                    <p className="font-medium">Learn</p>
                    <p className="text-sm text-muted-foreground">Match animals with their sounds</p>
                  </div>
                </div>
                <div className="flex items-center space-x-3 p-3 bg-yellow-50 rounded-lg">
                  <div className="text-2xl">🎉</div>
                  <div>
                    <p className="font-medium">Have Fun</p>
                    <p className="text-sm text-muted-foreground">Enjoy learning about animals!</p>
                  </div>
                </div>
              </div>
            </div>
            <Button onClick={startGame} size="lg" className="w-full md:w-auto">
              Start Learning! 🚀
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (gamePhase === 'complete') {
    const completionRate = (score / shuffledQuestions.length) * 100;
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-100 to-blue-100 flex items-center justify-center p-4">
        <Card className="w-full max-w-md bg-white/90 backdrop-blur-sm">
          <CardHeader className="text-center">
            <CardTitle className="text-2xl mb-4">Great Job! 🎉</CardTitle>
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
                    ? "Amazing! You know your animal sounds very well! 🏆"
                    : completionRate >= 60
                    ? "Good work! You're learning about animal sounds! 👍"
                    : "Keep practicing! Every try helps you learn more! 💪"
                  }
                </p>
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
  if (shuffledQuestions.length === 0 || shuffledOptions.length === 0) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-100 to-blue-100 flex items-center justify-center">
        <div className="text-center">
          <div className="text-4xl mb-4">🔄</div>
          <p>Loading...</p>
        </div>
      </div>
    );
  }

  const currentAnimal = shuffledQuestions[currentQuestion];

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-100 to-blue-100 p-4">
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
          <Button
            variant="outline"
            size="sm"
            onClick={() => setIsSoundEnabled(!isSoundEnabled)}
          >
            {isSoundEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
          </Button>
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
            <CardTitle className="text-xl mb-4">
              What animal makes this sound?
            </CardTitle>
            <div className="space-y-4">
              <div className="text-8xl">{currentAnimal.emoji}</div>
              <Button
                size="lg"
                onClick={() => playSound(currentAnimal.sound)}
                className="w-full md:w-auto"
                disabled={!!selectedAnimal}
              >
                <Volume2 className="w-5 h-5 mr-2" />
                Play Sound: "{currentAnimal.soundDescription}"
              </Button>
            </div>
          </CardHeader>
        </Card>

        {/* Answer Options */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {shuffledOptions.map((animal) => {
            const isSelected = selectedAnimal === animal.name;
            const isCorrect = animal.name === currentAnimal.name;
            const showResult = selectedAnimal !== null;
            
            return (
              <Card
                key={animal.name}
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
                onClick={() => handleAnimalSelect(animal.name)}
              >
                <CardContent className="p-6 text-center">
                  <div className="text-6xl mb-3">{animal.emoji}</div>
                  {showResult && isSelected && (
                    <div className="mt-3">
                      {isCorrect ? (
                        <div className="flex items-center justify-center space-x-2 text-green-600">
                          <Star className="w-5 h-5 fill-current" />
                          <span>Correct!</span>
                        </div>
                      ) : (
                        <div className="text-red-600">Try again!</div>
                      )}
                    </div>
                  )}
                  {showResult && !isSelected && isCorrect && (
                    <div className="mt-3">
                      <div className="flex items-center justify-center space-x-2 text-green-600">
                        <Star className="w-5 h-5 fill-current" />
                        <span>Correct Answer</span>
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
                  ? "Great job! That's the right animal!"
                  : "Not quite! Let's learn together."
                }
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}