import React, { useState } from 'react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Card, CardContent } from './ui/card';
import { Plus, Trash2, CheckCircle } from 'lucide-react';
import { Question } from '../App';

interface QuestionEditorProps {
    questions: Question[];
    onChange: (questions: Question[]) => void;
}

export function QuestionEditor({ questions, onChange }: QuestionEditorProps) {
    const addQuestion = () => {
        if (questions.length >= 5) return;

        const newQuestion: Question = {
            id: Math.random().toString(36).substring(7),
            text: '',
            options: ['', '', '', ''],
            correctAnswer: 0
        };

        onChange([...questions, newQuestion]);
    };

    const updateQuestion = (index: number, updates: Partial<Question>) => {
        const newQuestions = [...questions];
        newQuestions[index] = { ...newQuestions[index], ...updates };
        onChange(newQuestions);
    };

    const updateOption = (qIndex: number, oIndex: number, value: string) => {
        const newQuestions = [...questions];
        const newOptions = [...newQuestions[qIndex].options];
        newOptions[oIndex] = value;
        newQuestions[qIndex] = { ...newQuestions[qIndex], options: newOptions };
        onChange(newQuestions);
    };

    const removeQuestion = (index: number) => {
        const newQuestions = questions.filter((_, i) => i !== index);
        onChange(newQuestions);
    };

    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between">
                <Label>Quiz Questions ({questions.length}/5)</Label>
                <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={addQuestion}
                    disabled={questions.length >= 5}
                >
                    <Plus className="w-4 h-4 mr-2" />
                    Add Question
                </Button>
            </div>

            <div className="space-y-4">
                {questions.map((question, qIndex) => (
                    <Card key={question.id}>
                        <CardContent className="p-4 space-y-4">
                            <div className="flex items-start justify-between gap-4">
                                <div className="flex-1 space-y-2">
                                    <Label>Question {qIndex + 1}</Label>
                                    <Input
                                        value={question.text}
                                        onChange={(e) => updateQuestion(qIndex, { text: e.target.value })}
                                        placeholder="Enter question text..."
                                    />
                                </div>
                                <Button
                                    type="button"
                                    variant="ghost"
                                    size="sm"
                                    className="text-red-500 hover:text-red-600 hover:bg-red-50"
                                    onClick={() => removeQuestion(qIndex)}
                                >
                                    <Trash2 className="w-4 h-4" />
                                </Button>
                            </div>

                            <div className="space-y-2">
                                <Label>Options (Select the correct answer)</Label>
                                <div className="grid grid-cols-1 gap-2">
                                    {question.options.map((option, oIndex) => (
                                        <div key={oIndex} className="flex items-center gap-2">
                                            <Button
                                                type="button"
                                                variant={question.correctAnswer === oIndex ? "default" : "outline"}
                                                size="icon"
                                                className={`h-10 w-10 shrink-0 ${question.correctAnswer === oIndex ? "bg-green-500 hover:bg-green-600" : ""
                                                    }`}
                                                onClick={() => updateQuestion(qIndex, { correctAnswer: oIndex })}
                                            >
                                                <CheckCircle className="w-4 h-4" />
                                            </Button>
                                            <Input
                                                value={option}
                                                onChange={(e) => updateOption(qIndex, oIndex, e.target.value)}
                                                placeholder={`Option ${oIndex + 1}`}
                                                className={question.correctAnswer === oIndex ? "border-green-500 ring-1 ring-green-500" : ""}
                                            />
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                ))}
            </div>
        </div>
    );
}
