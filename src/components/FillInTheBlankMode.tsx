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
    Edit3,
} from 'lucide-react';
import { formatText } from '../utils/textFormatting';

// Technical keywords to target for blanks
const TECHNICAL_KEYWORDS = [
    // ML/AI terms
    'machine learning',
    'ML',
    'artificial intelligence',
    'AI',
    'deep learning',
    'neural network',
    'supervised learning',
    'unsupervised learning',
    'reinforcement learning',
    'classification',
    'regression',
    'clustering',
    'feature engineering',
    'hyperparameter',
    'overfitting',
    'underfitting',
    'cross-validation',
    'precision',
    'recall',
    'F1 score',
    'accuracy',
    'AUC',
    'ROC',
    'confusion matrix',
    'gradient descent',
    'backpropagation',
    'activation function',

    // Google Cloud specific terms
    'Vertex AI',
    'BigQuery',
    'Cloud Storage',
    'Dataflow',
    'AutoML',
    'TensorFlow',
    'TPU',
    'GPU',
    'Cloud Functions',
    'Pub/Sub',
    'Cloud Spanner',
    'Memorystore',
    'Feature Store',
    'Model Registry',
    'Experiments',
    'Pipelines',
    'Workbench',
    'Custom Training',
    'Batch Prediction',
    'Online Prediction',
    'Endpoints',
    'Hyperparameter Tuning',
    'Vizier',
    'TensorBoard',
    'Metadata',

    // Data processing terms
    'ETL',
    'data pipeline',
    'data preprocessing',
    'feature scaling',
    'normalization',
    'standardization',
    'one-hot encoding',
    'label encoding',
    'dimensionality reduction',
    'PCA',
    'feature selection',
    'data validation',
    'data quality',
    'data lineage',

    // Model evaluation terms
    'training set',
    'validation set',
    'test set',
    'holdout set',
    'stratified sampling',
    'random sampling',
    'time series',
    'forecasting',
    'anomaly detection',
    'recommendation',
    'sentiment analysis',
    'object detection',
    'image classification',
    'text classification',
    'entity extraction',
    'translation',
    'speech-to-text',
    'text-to-speech',

    // Infrastructure terms
    'distributed training',
    'scalability',
    'latency',
    'throughput',
    'batch processing',
    'streaming',
    'real-time',
    'batch prediction',
    'online prediction',
    'model serving',
    'containerization',
    'Docker',
    'Kubernetes',
    'microservices',
    'API',
    'REST',

    // Statistical terms
    'mean',
    'median',
    'mode',
    'standard deviation',
    'variance',
    'correlation',
    'causation',
    'bias',
    'variance',
    'bias-variance tradeoff',
    'regularization',
    'dropout',
    'early stopping',
    'learning rate',
    'momentum',
    'optimizer',
];

interface FillInTheBlankModeProps {
    questions: Question[];
    currentIndex: number;
    onAnswer: (isCorrect: boolean) => void;
    onNext: () => void;
    onPrevious: () => void;
    performance: Map<string, QuestionPerformance>;
}

interface Blank {
    id: string;
    originalWord: string;
    position: number;
    options: string[];
    correctAnswer: string;
    userAnswer: string | null;
}

export const FillInTheBlankMode: React.FC<FillInTheBlankModeProps> = ({
    questions,
    currentIndex,
    onAnswer,
    onNext,
    onPrevious,
    performance,
}) => {
    const [blanks, setBlanks] = useState<Blank[]>([]);
    const [showAnswer, setShowAnswer] = useState(false);
    const [hasAnswered, setHasAnswered] = useState(false);

    const currentQuestion = questions[currentIndex];
    const currentPerformance = performance.get(currentQuestion?.id);

    const handleBlankChange = useCallback((blankId: string, value: string) => {
        setBlanks(prev =>
            prev.map(blank =>
                blank.id === blankId ? { ...blank, userAnswer: value } : blank
            )
        );
    }, []);

    const handleRevealAnswer = useCallback(() => {
        setShowAnswer(true);

        // Check if all blanks are filled correctly
        const allCorrect = blanks.every(
            blank => blank.userAnswer === blank.correctAnswer
        );
        const allFilled = blanks.every(blank => blank.userAnswer !== null);

        if (allFilled) {
            setHasAnswered(true);
            onAnswer(allCorrect);
        }
    }, [blanks, onAnswer]);

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
                event.target instanceof HTMLTextAreaElement ||
                event.target instanceof HTMLSelectElement
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
    ]);

    // Generate blanks for the current question
    useEffect(() => {
        if (!currentQuestion) return;

        const generateBlanks = (): Blank[] => {
            // Parse the correct answer from the options
            const correctAnswerLetter = currentQuestion.answer[0]?.trim() || '';
            const optionsText = currentQuestion.options.join('\n');

            // Find the correct answer text based on the letter
            let correctAnswerText = '';
            const optionLines = optionsText.split('\n');

            // Debug logging
            console.log('Parsing answer:', {
                correctAnswerLetter,
                optionLines,
                options: currentQuestion.options,
            });

            // Find the correct answer text in the options array directly
            if (correctAnswerLetter) {
                correctAnswerText =
                    currentQuestion.options[
                        correctAnswerLetter.charCodeAt(0) - 'A'.charCodeAt(0)
                    ];
            }

            // Remove any trailing comma
            if (correctAnswerText) {
                correctAnswerText = correctAnswerText.replace(/,\s*$/, '');
            }

            // Debug logging
            console.log('Parsed answer text:', correctAnswerText);

            // If we couldn't parse the correct answer, use the original answer
            if (!correctAnswerText) {
                console.warn(
                    'Could not parse answer text, falling back to original answer'
                );
                correctAnswerText = currentQuestion.answer.join(', ');
            }

            const text = correctAnswerText;
            const blanks: Blank[] = [];
            const usedPositions = new Set<number>();

            // Find technical keywords in the answer
            TECHNICAL_KEYWORDS.forEach(keyword => {
                const keywordLower = keyword.toLowerCase();
                const regex = new RegExp(
                    `\\b${keywordLower.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`,
                    'gi'
                );
                let match;

                while ((match = regex.exec(text)) !== null) {
                    const position = match.index;
                    if (!usedPositions.has(position) && blanks.length < 3) {
                        // Reduced max blanks to 3
                        usedPositions.add(position);

                        // Generate distractors (wrong options)
                        const distractors = TECHNICAL_KEYWORDS.filter(
                            k => k.toLowerCase() !== keywordLower
                        )
                            .sort(() => Math.random() - 0.5)
                            .slice(0, 3);

                        const options = [keyword, ...distractors].sort(
                            () => Math.random() - 0.5
                        );

                        blanks.push({
                            id: `blank-${blanks.length}`,
                            originalWord: keyword,
                            position,
                            options,
                            correctAnswer: keyword,
                            userAnswer: null,
                        });
                    }
                }
            });

            // If no blanks were created, find the longest word and make it a blank
            if (blanks.length === 0) {
                const words = text.split(/\s+/);
                if (words.length > 1) {
                    // Find the longest word that's not at the start or end
                    let longestWord = '';
                    let longestWordIndex = -1;
                    for (let i = 1; i < words.length - 1; i++) {
                        if (words[i].length > longestWord.length) {
                            longestWord = words[i];
                            longestWordIndex = i;
                        }
                    }

                    if (longestWordIndex !== -1) {
                        // Calculate position in original text
                        const position = text.indexOf(longestWord);
                        if (position !== -1) {
                            // Generate options (use some common words as distractors)
                            const distractors = [
                                'option',
                                'value',
                                'data',
                            ].sort(() => Math.random() - 0.5);
                            const options = [longestWord, ...distractors];

                            blanks.push({
                                id: 'blank-0',
                                originalWord: longestWord,
                                position,
                                options,
                                correctAnswer: longestWord,
                                userAnswer: null,
                            });
                        }
                    }
                }
            }

            return blanks;
        };

        const generatedBlanks = generateBlanks();
        setBlanks(generatedBlanks);
        setShowAnswer(false);
        setHasAnswered(false);

        // Debug logging
        console.log('Generated blanks:', generatedBlanks);
        console.log('Current question answer:', currentQuestion.answer);
        console.log('Current question options:', currentQuestion.options);
    }, [currentQuestion]);

    const renderAnswerWithBlanks = () => {
        // Parse the correct answer from the options
        const correctAnswerLetter = currentQuestion?.answer[0]?.trim() || '';
        const correctAnswerText =
            correctAnswerLetter && currentQuestion
                ? currentQuestion.options[
                      correctAnswerLetter.charCodeAt(0) - 'A'.charCodeAt(0)
                  ]?.replace(/,\s*$/, '') || ''
                : '';

        if (!currentQuestion || blanks.length === 0) {
            return (
                <p className="answer-text">{formatText(correctAnswerText)}</p>
            );
        }

        // If showing answer and there are incorrect answers, show the full text with highlighting
        if (showAnswer && blanks.some(b => b.userAnswer !== b.correctAnswer)) {
            // Sort blanks by position (ascending) to process from start to end
            const sortedBlanks = [...blanks].sort(
                (a, b) => a.position - b.position
            );

            const segments: JSX.Element[] = [];
            let currentPosition = 0;

            sortedBlanks.forEach((blank, index) => {
                // Add text before the blank
                if (blank.position > currentPosition) {
                    segments.push(
                        <span key={`text-${index}`}>
                            {formatText(
                                correctAnswerText.slice(
                                    currentPosition,
                                    blank.position
                                )
                            )}
                        </span>
                    );
                }

                // Add the term with appropriate styling
                const isCorrect = blank.userAnswer === blank.correctAnswer;
                if (isCorrect) {
                    segments.push(
                        <span
                            key={`term-${index}`}
                            className="answer-term correct"
                        >
                            {blank.correctAnswer}
                        </span>
                    );
                } else {
                    segments.push(
                        <>
                            <span
                                key={`term-wrong-${index}`}
                                className="answer-term incorrect"
                            >
                                {blank.userAnswer || '(no answer)'}
                            </span>
                            <span
                                key={`term-correct-${index}`}
                                className="answer-term correction"
                            >
                                {blank.correctAnswer}
                            </span>
                        </>
                    );
                }

                currentPosition = blank.position + blank.originalWord.length;
            });

            // Add any remaining text
            if (currentPosition < correctAnswerText.length) {
                segments.push(
                    <span key="text-final">
                        {formatText(correctAnswerText.slice(currentPosition))}
                    </span>
                );
            }

            return <p className="answer-text">{segments}</p>;
        }

        // Otherwise show the dropdowns
        const sortedBlanks = [...blanks].sort(
            (a, b) => a.position - b.position
        );

        const segments: JSX.Element[] = [];
        let currentPosition = 0;

        sortedBlanks.forEach((blank, index) => {
            // Add text before the blank
            if (blank.position > currentPosition) {
                segments.push(
                    <span key={`text-${index}`}>
                        {formatText(
                            correctAnswerText.slice(
                                currentPosition,
                                blank.position
                            )
                        )}
                    </span>
                );
            }

            // Add the dropdown
            segments.push(
                <select
                    key={`blank-${blank.id}`}
                    className="fill-in-blank-dropdown"
                    value={blank.userAnswer || ''}
                    onChange={e => handleBlankChange(blank.id, e.target.value)}
                    disabled={showAnswer}
                >
                    <option value="">Select...</option>
                    {blank.options.map((option, optIndex) => (
                        <option key={optIndex} value={option}>
                            {option}
                        </option>
                    ))}
                </select>
            );

            currentPosition = blank.position + blank.originalWord.length;
        });

        // Add any remaining text
        if (currentPosition < correctAnswerText.length) {
            segments.push(
                <span key="text-final">
                    {formatText(correctAnswerText.slice(currentPosition))}
                </span>
            );
        }

        return <p className="answer-text">{segments}</p>;
    };

    if (!currentQuestion) {
        return (
            <div className="fill-in-blank-container">
                <div className="completion-message">
                    <CheckCircle
                        size={48}
                        style={{ color: 'var(--success-color)' }}
                    />
                    <h2>
                        Great job! You've completed all fill-in-the-blank
                        questions!
                    </h2>
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
        <div className="fill-in-blank-container">
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

            <div className="fill-in-blank-card">
                <div className="question-section">
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

                <div className="answer-section">
                    <h4>
                        <Edit3 size={18} />
                        Fill in the Blanks
                    </h4>
                    <p className="instruction-text">
                        Complete the answer by selecting the correct words from
                        the dropdowns:
                    </p>
                    {renderAnswerWithBlanks()}
                </div>

                <div className="mode-action-bar fill-in-blank-controls">
                    {!showAnswer && (
                        <button
                            onClick={handleRevealAnswer}
                            className="btn btn-primary"
                        >
                            <Eye size={16} />
                            Check Answers
                        </button>
                    )}
                    {showAnswer && (
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
