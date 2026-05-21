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
            <Box sx={{ maxWidth: 720, mx: 'auto', px: 2 }}>
                <Card>
                    <CardContent>
                        <Stack spacing={2} sx={{ alignItems: 'center' }}>
                            <CheckCircle size={48} />
                            <Typography
                                variant="h5"
                                sx={{ textAlign: 'center' }}
                            >
                                Great job! You've completed all flashcards!
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
                <Card>
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
                            {showAnswer && (
                                <>
                                    <Divider />
                                    <Stack spacing={1}>
                                        <Stack direction="row" spacing={1}>
                                            <CheckCircle size={18} />
                                            <Typography variant="subtitle1">
                                                Answer
                                            </Typography>
                                        </Stack>
                                        <Typography variant="body1">
                                            <strong>
                                                Correct Answer:{' '}
                                                {formatText(
                                                    currentQuestion.answer.join(
                                                        ', '
                                                    )
                                                )}
                                            </strong>
                                        </Typography>
                                        {hasExplanation(
                                            currentQuestion.explanation
                                        ) && (
                                            <Box
                                                sx={{
                                                    bgcolor: 'primary.light',
                                                    p: 2,
                                                    borderRadius: 2,
                                                }}
                                            >
                                                <Typography variant="body2">
                                                    {formatText(
                                                        currentQuestion.explanation
                                                    )}
                                                </Typography>
                                            </Box>
                                        )}
                                    </Stack>
                                </>
                            )}
                            <Box>
                                {!showAnswer ? (
                                    <Button
                                        variant="contained"
                                        onClick={handleRevealAnswer}
                                        startIcon={<Eye size={16} />}
                                    >
                                        Show Answer
                                    </Button>
                                ) : !hasAnswered ? (
                                    <Stack direction="row" spacing={2}>
                                        <Button
                                            variant="contained"
                                            color="error"
                                            onClick={() =>
                                                handleAnswerResponse(false)
                                            }
                                            startIcon={<XCircle size={16} />}
                                        >
                                            Incorrect
                                        </Button>
                                        <Button
                                            variant="contained"
                                            color="success"
                                            onClick={() =>
                                                handleAnswerResponse(true)
                                            }
                                            startIcon={
                                                <CheckCircle size={16} />
                                            }
                                        >
                                            Correct
                                        </Button>
                                    </Stack>
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
