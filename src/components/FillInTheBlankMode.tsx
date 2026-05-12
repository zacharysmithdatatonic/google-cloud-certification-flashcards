import React, { useState, useEffect, useCallback } from 'react';
import {
    Box,
    Stack,
    Typography,
    IconButton,
    Button,
    LinearProgress,
    Card,
    CardContent,
    Divider,
    Chip,
    TextField,
    MenuItem,
} from '@mui/material';
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
                <Typography component="p" variant="body1">
                    {formatText(correctAnswerText)}
                </Typography>
            );
        }

        const renderText = (text: string, key: string) => (
            <Box component="span" key={key}>
                {formatText(text)}
            </Box>
        );

        const sortedBlanks = [...blanks].sort(
            (a, b) => a.position - b.position
        );
        const segments: JSX.Element[] = [];
        let currentPosition = 0;

        sortedBlanks.forEach((blank, index) => {
            if (blank.position > currentPosition) {
                segments.push(
                    renderText(
                        correctAnswerText.slice(
                            currentPosition,
                            blank.position
                        ),
                        `text-${index}`
                    )
                );
            }

            if (
                showAnswer &&
                blanks.some(b => b.userAnswer !== b.correctAnswer)
            ) {
                const isCorrect = blank.userAnswer === blank.correctAnswer;
                if (isCorrect) {
                    segments.push(
                        <Box
                            component="span"
                            key={`term-${index}`}
                            sx={{ mx: 0.5 }}
                        >
                            <Chip
                                size="small"
                                color="success"
                                label={blank.correctAnswer}
                            />
                        </Box>
                    );
                } else {
                    segments.push(
                        <Box
                            component="span"
                            key={`term-${index}`}
                            sx={{
                                mx: 0.5,
                                display: 'inline-flex',
                                gap: 0.5,
                            }}
                        >
                            <Chip
                                size="small"
                                color="error"
                                label={blank.userAnswer || '(no answer)'}
                            />
                            <Chip
                                size="small"
                                color="success"
                                variant="outlined"
                                label={blank.correctAnswer}
                            />
                        </Box>
                    );
                }
            } else {
                segments.push(
                    <Box
                        component="span"
                        key={`blank-${blank.id}`}
                        sx={{ mx: 0.5, display: 'inline-block', minWidth: 140 }}
                    >
                        <TextField
                            select
                            size="small"
                            value={blank.userAnswer || ''}
                            onChange={e =>
                                handleBlankChange(blank.id, e.target.value)
                            }
                            disabled={showAnswer}
                            fullWidth
                        >
                            <MenuItem value="">Select...</MenuItem>
                            {blank.options.map((option, optIndex) => (
                                <MenuItem key={optIndex} value={option}>
                                    {option}
                                </MenuItem>
                            ))}
                        </TextField>
                    </Box>
                );
            }

            currentPosition = blank.position + blank.originalWord.length;
        });

        if (currentPosition < correctAnswerText.length) {
            segments.push(
                renderText(
                    correctAnswerText.slice(currentPosition),
                    'text-final'
                )
            );
        }

        return (
            <Typography component="p" variant="body1">
                {segments}
            </Typography>
        );
    };

    if (!currentQuestion) {
        return (
            <Box sx={{ maxWidth: 720, mx: 'auto', px: 2 }}>
                <Card>
                    <CardContent>
                        <Stack spacing={2} sx={{ alignItems: 'center' }}>
                            <CheckCircle size={48} />
                            <Typography
                                variant="h5"
                                sx={{ textAlign: 'center' }}
                            >
                                Great job! You've completed all
                                fill-in-the-blank questions!
                            </Typography>
                            <Button
                                variant="contained"
                                onClick={() => window.location.reload()}
                                startIcon={<RotateCcw size={16} />}
                            >
                                Start Over
                            </Button>
                        </Stack>
                    </CardContent>
                </Card>
            </Box>
        );
    }

    return (
        <Box sx={{ maxWidth: 720, mx: 'auto', px: 2 }}>
            <Stack spacing={2}>
                <Stack
                    direction="row"
                    sx={{
                        alignItems: 'center',
                        justifyContent: 'space-between',
                    }}
                >
                    <IconButton
                        onClick={handlePrevious}
                        disabled={currentIndex === 0}
                        aria-label="Previous question"
                    >
                        <ChevronLeft size={24} />
                    </IconButton>
                    <Typography variant="body2" color="text.secondary">
                        Question {currentIndex + 1} of {questions.length}
                    </Typography>
                    <IconButton
                        onClick={handleNext}
                        disabled={currentIndex === questions.length - 1}
                        aria-label="Next question"
                    >
                        <ChevronRight size={24} />
                    </IconButton>
                </Stack>
                <LinearProgress
                    variant="determinate"
                    value={((currentIndex + 1) / questions.length) * 100}
                    sx={{ height: 6, borderRadius: 999 }}
                />
                <Card
                    sx={{ borderLeft: '4px solid', borderColor: 'error.main' }}
                >
                    <CardContent>
                        <Stack spacing={2}>
                            <Stack
                                direction="row"
                                sx={{
                                    justifyContent: 'space-between',
                                    alignItems: 'center',
                                }}
                            >
                                <Stack direction="row" spacing={1}>
                                    <HelpCircle size={18} />
                                    <Typography variant="subtitle1">
                                        Question
                                    </Typography>
                                </Stack>
                                {currentPerformance && (
                                    <Stack direction="row" spacing={1}>
                                        <Chip
                                            size="small"
                                            icon={<CheckCircle size={14} />}
                                            label={
                                                currentPerformance.correctCount
                                            }
                                            color="success"
                                            variant="outlined"
                                        />
                                        <Chip
                                            size="small"
                                            icon={<XCircle size={14} />}
                                            label={
                                                currentPerformance.incorrectCount
                                            }
                                            color="error"
                                            variant="outlined"
                                        />
                                    </Stack>
                                )}
                            </Stack>
                            {currentQuestion.questionImages?.length ? (
                                <Stack
                                    direction="row"
                                    spacing={1}
                                    sx={{ flexWrap: 'wrap' }}
                                >
                                    {currentQuestion.questionImages.map(
                                        (image, index) => (
                                            <Box
                                                key={`${currentQuestion.id}-qimg-${index}`}
                                                component="img"
                                                src={image}
                                                alt=""
                                                sx={{
                                                    maxWidth: '100%',
                                                    borderRadius: 1,
                                                    border: '1px solid',
                                                    borderColor: 'divider',
                                                }}
                                            />
                                        )
                                    )}
                                </Stack>
                            ) : null}
                            <Typography variant="body1">
                                {formatText(currentQuestion.question)}
                            </Typography>
                            <Divider />
                            <Stack spacing={1}>
                                <Stack direction="row" spacing={1}>
                                    <Edit3 size={18} />
                                    <Typography variant="subtitle1">
                                        Fill in the Blanks
                                    </Typography>
                                </Stack>
                                <Typography
                                    variant="body2"
                                    color="text.secondary"
                                >
                                    Complete the answer by selecting the correct
                                    words from the dropdowns:
                                </Typography>
                                {renderAnswerWithBlanks()}
                            </Stack>
                            <Box>
                                {!showAnswer ? (
                                    <Button
                                        variant="contained"
                                        onClick={handleRevealAnswer}
                                        startIcon={<Eye size={16} />}
                                    >
                                        Check Answers
                                    </Button>
                                ) : (
                                    <Button
                                        variant="contained"
                                        onClick={handleNext}
                                        startIcon={<ArrowRight size={16} />}
                                    >
                                        Next Question
                                    </Button>
                                )}
                            </Box>
                        </Stack>
                    </CardContent>
                </Card>
            </Stack>
        </Box>
    );
};
