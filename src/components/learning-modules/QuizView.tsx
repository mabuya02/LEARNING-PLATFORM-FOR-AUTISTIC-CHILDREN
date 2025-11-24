import React, { useState } from 'react';
import { Button } from '../ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Question } from '../../App';
import { CheckCircle, XCircle } from 'lucide-react';

interface QuizViewProps {
    questions: Question[];
    onComplete: (score: number, correctAnswers: number) => void;
}

export function QuizView({ questions, onComplete }: QuizViewProps) {
    const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
    const [selectedOption, setSelectedOption] = useState<number | null>(null);
    const [isAnswered, setIsAnswered] = useState(false);
    const [correctAnswers, setCorrectAnswers] = useState(0);
    const [showFeedback, setShowFeedback] = useState(false);

    const currentQuestion = questions[currentQuestionIndex];

    const handleOptionSelect = (index: number) => {
        if (isAnswered) return;
        setSelectedOption(index);
    };

    const handleSubmitAnswer = () => {
        if (selectedOption === null) return;

        const isCorrect = selectedOption === currentQuestion.correctAnswer;
        if (isCorrect) {
            setCorrectAnswers(prev => prev + 1);
        }

        setIsAnswered(true);
        setShowFeedback(true);
    };

    const handleNextQuestion = () => {
        if (currentQuestionIndex < questions.length - 1) {
            setCurrentQuestionIndex(prev => prev + 1);
            setSelectedOption(null);
            setIsAnswered(false);
            setShowFeedback(false);
        } else {
            // Quiz completed
            const finalScore = Math.round((correctAnswers / questions.length) * 100);
            onComplete(finalScore, correctAnswers);
        }
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-purple-100 to-pink-100 p-4 flex items-center justify-center">
            <Card className="w-full max-w-2xl">
                <CardHeader>
                    <CardTitle className="flex justify-between items-center">
                        <span>Question {currentQuestionIndex + 1} of {questions.length}</span>
                        <span className="text-sm font-normal text-muted-foreground">
                            Score: {correctAnswers}/{currentQuestionIndex + (isAnswered ? 1 : 0)}
                        </span>
                    </CardTitle>
                    <div className="w-full bg-gray-200 h-2 rounded-full mt-2">
                        <div
                            className="bg-blue-500 h-2 rounded-full transition-all duration-300"
                            style={{ width: `${((currentQuestionIndex + 1) / questions.length) * 100}%` }}
                        />
                    </div>
                </CardHeader>
                <CardContent className="p-6 space-y-6">
                    <h3 className="text-xl font-medium text-center mb-6">{currentQuestion.text}</h3>

                    <div className="grid grid-cols-1 gap-4">
                        {currentQuestion.options.map((option, index) => {
                            let buttonStyle = "p-4 text-left border-2 hover:bg-gray-50 transition-colors";

                            if (isAnswered) {
                                if (index === currentQuestion.correctAnswer) {
                                    buttonStyle = "p-4 text-left border-2 border-green-500 bg-green-50 text-green-700";
                                } else if (index === selectedOption) {
                                    buttonStyle = "p-4 text-left border-2 border-red-500 bg-red-50 text-red-700";
                                } else {
                                    buttonStyle = "p-4 text-left border-2 border-gray-100 text-gray-400";
                                }
                            } else if (selectedOption === index) {
                                buttonStyle = "p-4 text-left border-2 border-blue-500 bg-blue-50 text-blue-700";
                            }

                            return (
                                <button
                                    key={index}
                                    className={`rounded-lg ${buttonStyle}`}
                                    onClick={() => handleOptionSelect(index)}
                                    disabled={isAnswered}
                                >
                                    <div className="flex items-center justify-between">
                                        <span>{option}</span>
                                        {isAnswered && index === currentQuestion.correctAnswer && (
                                            <CheckCircle className="w-5 h-5 text-green-600" />
                                        )}
                                        {isAnswered && index === selectedOption && index !== currentQuestion.correctAnswer && (
                                            <XCircle className="w-5 h-5 text-red-600" />
                                        )}
                                    </div>
                                </button>
                            );
                        })}
                    </div>

                    <div className="flex justify-end mt-6">
                        {!isAnswered ? (
                            <Button
                                onClick={handleSubmitAnswer}
                                disabled={selectedOption === null}
                                size="lg"
                            >
                                Submit Answer
                            </Button>
                        ) : (
                            <Button onClick={handleNextQuestion} size="lg">
                                {currentQuestionIndex < questions.length - 1 ? 'Next Question' : 'Finish Quiz'}
                            </Button>
                        )}
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
