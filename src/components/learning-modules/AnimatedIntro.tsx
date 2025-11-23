import React from 'react';

interface AnimatedIntroProps {
  title: string;
  onAnimationComplete?: () => void;
}

export default function AnimatedIntro({ title, onAnimationComplete }: AnimatedIntroProps) {
  React.useEffect(() => {
    // Auto-complete animation after 2 seconds
    const timer = setTimeout(() => {
      onAnimationComplete?.();
    }, 2000);

    return () => clearTimeout(timer);
  }, [onAnimationComplete]);

  return (
    <div className="flex items-center justify-center min-h-[400px] bg-gradient-to-br from-blue-400 via-purple-500 to-pink-400">
      <div className="text-center">
        <div className="animate-bounce mb-4">
          <div className="text-6xl mb-4">🎓</div>
        </div>
        <h1 className="text-4xl md:text-6xl font-bold text-white mb-4 animate-pulse">
          {title}
        </h1>
        <div className="flex justify-center space-x-1">
          <div className="w-2 h-2 bg-white rounded-full animate-bounce" style={{animationDelay: '0ms'}}></div>
          <div className="w-2 h-2 bg-white rounded-full animate-bounce" style={{animationDelay: '150ms'}}></div>
          <div className="w-2 h-2 bg-white rounded-full animate-bounce" style={{animationDelay: '300ms'}}></div>
        </div>
      </div>
    </div>
  );
}