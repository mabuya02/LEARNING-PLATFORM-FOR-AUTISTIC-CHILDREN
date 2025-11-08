import { useState, useEffect } from 'react';
import { Button } from '../ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Play, SkipForward, ArrowLeft } from 'lucide-react';

interface AnimatedIntroProps {
  title: string;
  description: string;
  animationType: 'colors' | 'numbers' | 'shapes' | 'animals' | 'sizes';
  onComplete: () => void;
  onExit: () => void;
}

export function AnimatedIntro({ title, description, animationType, onComplete, onExit }: AnimatedIntroProps) {
  const [introStarted, setIntroStarted] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);

  const animations = {
    colors: {
      steps: [
        { text: 'Colors are all around us!', color: '#FF6B6B' },
        { text: 'Red like an apple 🍎', color: '#FF0000' },
        { text: 'Blue like the sky ☁️', color: '#4A90E2' },
        { text: 'Yellow like the sun ☀️', color: '#FFD93D' },
        { text: 'Green like grass 🌱', color: '#6BCF7F' },
        { text: "Let's learn colors together!", color: '#9B59B6' }
      ]
    },
    numbers: {
      steps: [
        { text: 'Numbers help us count!', number: '1️⃣2️⃣3️⃣' },
        { text: 'One fish 🐟', number: '1' },
        { text: 'Two birds 🐦🐦', number: '2' },
        { text: 'Three stars ⭐⭐⭐', number: '3' },
        { text: 'Four hearts 💙💙💙💙', number: '4' },
        { text: "Let's count together!", number: '5' }
      ]
    },
    shapes: {
      steps: [
        { text: 'Shapes are everywhere!', shape: '●■▲' },
        { text: 'Circle - Round like a ball', shape: '●' },
        { text: 'Square - Four equal sides', shape: '■' },
        { text: 'Triangle - Three corners', shape: '▲' },
        { text: 'Star - Five points', shape: '★' },
        { text: "Let's learn shapes!", shape: '●■▲★' }
      ]
    },
    animals: {
      steps: [
        { text: 'Animals make sounds!', emoji: '🐾' },
        { text: 'Dog says Woof! 🐕', emoji: '🐕' },
        { text: 'Cat says Meow! 🐱', emoji: '🐱' },
        { text: 'Cow says Moo! 🐮', emoji: '🐮' },
        { text: 'Duck says Quack! 🦆', emoji: '🦆' },
        { text: "Let's learn animal sounds!", emoji: '🎵' }
      ]
    },
    sizes: {
      steps: [
        { text: 'Things come in different sizes!', scale: 1 },
        { text: 'BIG like an elephant 🐘', scale: 1.5 },
        { text: 'Small like a mouse 🐭', scale: 0.7 },
        { text: 'BIGGER 📏', scale: 1.8 },
        { text: 'smaller 📐', scale: 0.5 },
        { text: "Let's compare sizes!", scale: 1 }
      ]
    }
  };

  const currentAnimation = animations[animationType];

  useEffect(() => {
    if (introStarted && currentStep < currentAnimation.steps.length) {
      const timer = setTimeout(() => {
        setCurrentStep(prev => prev + 1);
      }, 2500);
      return () => clearTimeout(timer);
    }
  }, [introStarted, currentStep, currentAnimation.steps.length]);

  const renderAnimation = () => {
    if (currentStep >= currentAnimation.steps.length) {
      return (
        <div className="flex flex-col items-center justify-center h-full space-y-6 animate-in fade-in duration-500">
          <div className="text-6xl animate-bounce">🎉</div>
          <p className="text-2xl text-center">Ready to start?</p>
        </div>
      );
    }

    const step = currentAnimation.steps[currentStep];

    switch (animationType) {
      case 'colors':
        return (
          <div 
            className="flex flex-col items-center justify-center h-full space-y-8 animate-in zoom-in duration-700"
            style={{ backgroundColor: 'color' in step ? step.color : undefined, transition: 'background-color 1s ease' }}
          >
            <div className="bg-white px-8 py-6 rounded-2xl shadow-2xl">
              <p className="text-3xl text-center" style={{ color: 'color' in step ? step.color : undefined }}>
                {step.text}
              </p>
            </div>
          </div>
        );

      case 'numbers':
        return (
          <div className="flex flex-col items-center justify-center h-full space-y-8 bg-gradient-to-br from-blue-100 to-purple-100">
            <div 
              className="text-9xl animate-in zoom-in duration-700"
              style={{ 
                fontSize: `${4 + parseInt(('number' in step ? step.number : '0') || '0') * 0.5}rem`,
                transition: 'font-size 0.5s ease'
              }}
            >
              {'number' in step ? step.number : ''}
            </div>
            <p className="text-2xl text-center px-4">{step.text}</p>
          </div>
        );

      case 'shapes':
        return (
          <div className="flex flex-col items-center justify-center h-full space-y-8 bg-gradient-to-br from-pink-100 to-yellow-100">
            <div className="text-9xl animate-in spin-in duration-700">
              {'shape' in step ? step.shape : ''}
            </div>
            <p className="text-2xl text-center px-4">{step.text}</p>
          </div>
        );

      case 'animals':
        return (
          <div className="flex flex-col items-center justify-center h-full space-y-8 bg-gradient-to-br from-green-100 to-blue-100">
            <div className="text-9xl animate-bounce">
              {'emoji' in step ? step.emoji : ''}
            </div>
            <p className="text-2xl text-center px-4">{step.text}</p>
          </div>
        );

      case 'sizes':
        return (
          <div className="flex flex-col items-center justify-center h-full space-y-8 bg-gradient-to-br from-orange-100 to-red-100">
            <div 
              className="text-6xl transition-transform duration-700"
              style={{ transform: `scale(${'scale' in step ? step.scale : 1})` }}
            >
              📦
            </div>
            <p className="text-2xl text-center px-4">{step.text}</p>
          </div>
        );

      default:
        return null;
    }
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
            
            {!introStarted ? (
              <div className="flex flex-col items-center space-y-4">
                <div className="w-full aspect-video bg-gradient-to-br from-purple-200 to-blue-200 rounded-lg flex items-center justify-center">
                  <Button 
                    onClick={() => setIntroStarted(true)}
                    size="lg"
                    className="text-xl p-8"
                  >
                    <Play className="w-8 h-8 mr-2" />
                    Watch Introduction
                  </Button>
                </div>
                <p className="text-sm text-muted-foreground text-center">
                  This short animation will help you understand the activity better!
                </p>
              </div>
            ) : (
              <div className="w-full aspect-video rounded-lg overflow-hidden shadow-lg">
                {renderAnimation()}
              </div>
            )}

            {/* Progress Indicator */}
            {introStarted && currentStep < currentAnimation.steps.length && (
              <div className="flex justify-center gap-2 mt-4">
                {currentAnimation.steps.map((_, index) => (
                  <div
                    key={index}
                    className={`h-2 w-2 rounded-full transition-all duration-300 ${
                      index === currentStep ? 'bg-blue-500 w-8' : 'bg-gray-300'
                    }`}
                  />
                ))}
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
                {introStarted && currentStep >= currentAnimation.steps.length 
                  ? "Start Activity!" 
                  : introStarted 
                  ? "Continue to Activity" 
                  : "Skip & Start Activity"}
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Fun Facts or Tips */}
        <Card className="w-full bg-yellow-50 border-yellow-200">
          <CardContent className="p-4">
            <p className="text-center">
              <span className="text-2xl mr-2">💡</span>
              <span className="text-sm">Take your time and enjoy learning! You can watch the animation again anytime.</span>
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
