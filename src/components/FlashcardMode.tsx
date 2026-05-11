import React, { useState, useEffect, useCallback } from 'react';
import { Question, QuestionPerformance } from '../types';
import {
    CheckCircle,
    XCircle,
    ArrowRight,
    ChevronLeft,
    ChevronRight,
    Eye,
    RotateCcw,
    HelpCircle,
} from 'lucide-react';
import { formatText } from '../utils/textFormatting';

// Helper function to check if explanation has meaningful content
const hasExplanation = (explanation: string): boolean => {
    return explanation.trim().replace(/\n/g, '').length > 0;
};

interface FlashcardModeProps {
    questions: Question[];
    currentIndex: number;
    onAnswer: (isCorrect: boolean) => void;
    onNext: () => void;
    onPrevious: () => void;
    performance: Map<string, QuestionPerformance>;
}

export const FlashcardMode: React.FC<FlashcardModeProps> = ({
    questions,
    currentIndex,
    onAnswer,
    onNext,
    onPrevious,
    performance,
}) => {
    const [showAnswer, setShowAnswer] = useState(false);
    const [hasAnswered, setHasAnswered] = useState(false);

    const currentQuestion = questions[currentIndex];
    const currentPerformance = performance.get(currentQuestion?.id);

    const handleRevealAnswer = useCallback(() => {
        setShowAnswer(true);
    }, []);

    const handleAnswerResponse = useCallback(
        (isCorrect: boolean) => {
            setHasAnswered(true);
            onAnswer(isCorrect);
        },
        [onAnswer]
    );

    const handleNext = useCallback(() => {
        setShowAnswer(false);
        setHasAnswered(false);
        onNext();
        window.scrollTo({ top: 0, behavior: 'smooth' });
    }, [onNext]);

    const handlePrevious = useCallback(() => {
        setShowAnswer(false);
        setHasAnswered(false);
        onPrevious();
        window.scrollTo({ top: 0, behavior: 'smooth' });
    }, [onPrevious]);

    // Add keyboard event listeners
    useEffect(() => {
        const handleKeyPress = (event: KeyboardEvent) => {
            // Prevent keyboard shortcuts when user is typing in an input
            if (
                event.target instanceof HTMLInputElement ||
                event.target instanceof HTMLTextAreaElement
            ) {
                return;
            }

            switch (event.key) {
                case 'ArrowLeft':
                    event.preventDefault();
                    if (currentIndex > 0) {
                        handlePrevious();
                    }
                    break;
                case 'ArrowRight':
                    event.preventDefault();
                    if (currentIndex < questions.length - 1) {
                        handleNext();
                    }
                    break;
                case 'Enter':
                case ' ':
                    event.preventDefault();
                    if (!showAnswer) {
                        handleRevealAnswer();
                    } else if (hasAnswered) {
                        handleNext();
                    }
                    break;
                case '1':
                    event.preventDefault();
                    if (showAnswer && !hasAnswered) {
                        handleAnswerResponse(false);
                    }
                    break;
                case '2':
                    event.preventDefault();
                    if (showAnswer && !hasAnswered) {
                        handleAnswerResponse(true);
                    }
                    break;
            }
        };

        window.addEventListener('keydown', handleKeyPress);
        return () => window.removeEventListener('keydown', handleKeyPress);
    }, [
        currentIndex,
        questions.length,
        showAnswer,
        hasAnswered,
        handleNext,
        handlePrevious,
        handleRevealAnswer,
        handleAnswerResponse,
    ]);

    if (!currentQuestion) {
        return (
            <div className="flashcard-container">
                <div className="completion-message">
                    <CheckCircle
                        size={48}
                        style={{ color: 'var(--success-color)' }}
                    />
                    <h2>Great job! You've completed all flashcards!</h2>
                    <button
                        onClick={() => window.location.reload()}
                        className="btn btn-primary"
                    >
                        <RotateCcw size={16} />
                        Start Over
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="flashcard-container">
            <div className="mode-nav-bar navigation-controls">
                <button
                    onClick={handlePrevious}
                    disabled={currentIndex === 0}
                    className="nav-arrow"
                    aria-label="Previous question"
                >
                    <ChevronLeft size={24} />
                </button>
                <span className="question-counter">
                    Question {currentIndex + 1} of {questions.length}
                </span>
                <button
                    onClick={handleNext}
                    disabled={currentIndex === questions.length - 1}
                    className="nav-arrow"
                    aria-label="Next question"
                >
                    <ChevronRight size={24} />
                </button>
            </div>
            <div className="progress-bar">
                <div
                    className="progress-fill"
                    style={{
                        width: `${((currentIndex + 1) / questions.length) * 100}%`,
                    }}
                />
            </div>

            <div className="flashcard">
                <div className="flashcard-front">
                    <div className="question-header-card">
                        <h3>
                            <HelpCircle size={18} />
                            Question
                        </h3>
                        {currentPerformance && (
                            <div className="question-performance">
                                <span className="correct-count">
                                    <CheckCircle size={14} />
                                    {currentPerformance.correctCount}
                                </span>
                                <span className="incorrect-count">
                                    <XCircle size={14} />
                                    {currentPerformance.incorrectCount}
                                </span>
                            </div>
                        )}
                    </div>
                    {currentQuestion.questionImages?.length ? (
                        <div className="question-images">
                            {currentQuestion.questionImages.map(
                                (image, index) => (
                                    <img
                                        key={`${currentQuestion.id}-qimg-${index}`}
                                        src={image}
                                        alt=""
                                        className="question-image"
                                    />
                                )
                            )}
                        </div>
                    ) : null}
                    <p className="question-text">
                        {formatText(currentQuestion.question)}
                    </p>
                </div>

                {showAnswer && (
                    <div className="flashcard-back">
                        <h3>
                            <CheckCircle size={18} />
                            Answer
                        </h3>
                        <p className="answer-text">
                            <strong>
                                Correct Answer:{' '}
                                {formatText(currentQuestion.answer.join(', '))}
                            </strong>
                        </p>
                        {hasExplanation(currentQuestion.explanation) && (
                            <div className="explanation">
                                <p>{formatText(currentQuestion.explanation)}</p>
                            </div>
                        )}
                    </div>
                )}

                <div className="mode-action-bar flashcard-controls">
                    {!showAnswer ? (
                        <button
                            onClick={handleRevealAnswer}
                            className="btn btn-primary"
                        >
                            <Eye size={16} />
                            Show Answer
                        </button>
                    ) : !hasAnswered ? (
                        <div className="answer-buttons">
                            <button
                                onClick={() => handleAnswerResponse(false)}
                                className="btn btn-danger"
                            >
                                <XCircle size={16} />
                                Incorrect
                            </button>
                            <button
                                onClick={() => handleAnswerResponse(true)}
                                className="btn btn-success"
                            >
                                <CheckCircle size={16} />
                                Correct
                            </button>
                        </div>
                    ) : (
                        <button
                            onClick={handleNext}
                            className="btn btn-primary"
                        >
                            <ArrowRight size={16} />
                            Next Question
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
};
