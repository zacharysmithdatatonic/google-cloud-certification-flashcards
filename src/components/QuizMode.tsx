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
    Trophy,
    RotateCcw,
    HelpCircle,
} from 'lucide-react';
import { formatText } from '../utils/textFormatting';
import { resolveAssetPath } from '../utils/url';

// Helper function to check if explanation has meaningful content
const hasExplanation = (explanation: string): boolean => {
    return explanation.trim().replace(/\n/g, '').length > 0;
};

interface QuizModeProps {
    questions: Question[];
    currentIndex: number;
    onAnswer: (isCorrect: boolean) => void;
    onNext: () => void;
    onPrevious: () => void;
    performance: Map<string, QuestionPerformance>;
}

export const QuizMode: React.FC<QuizModeProps> = ({
    questions,
    currentIndex,
    onAnswer,
    onNext,
    onPrevious,
    performance,
}) => {
    const [selectedOptions, setSelectedOptions] = useState<number[]>([]);
    const [showAnswer, setShowAnswer] = useState(false);

    const currentQuestion = questions[currentIndex];
    const currentPerformance = performance.get(currentQuestion?.id);

    const isMultiAnswer = currentQuestion.answer.length > 1;

    const getCorrectOptionIndexes = useCallback(() => {
        const letterToIndex: { [key: string]: number } = {
            A: 0,
            B: 1,
            C: 2,
            D: 3,
            E: 4,
            F: 5,
            G: 6,
        };

        return currentQuestion.answer
            .map(answerLetter => {
                const normalized = answerLetter.trim().toUpperCase();
                return letterToIndex[normalized];
            })
            .filter((index): index is number => index !== undefined);
    }, [currentQuestion]);

    const handleOptionSelect = useCallback(
        (optionIndex: number) => {
            if (showAnswer) {
                return;
            }

            if (isMultiAnswer) {
                setSelectedOptions(prev => {
                    if (prev.includes(optionIndex)) {
                        return prev.filter(option => option !== optionIndex);
                    }
                    return [...prev, optionIndex];
                });
            } else {
                setSelectedOptions([optionIndex]);
            }
        },
        [showAnswer, isMultiAnswer]
    );

    const handleRevealAnswer = useCallback(() => {
        setShowAnswer(true);

        // Automatically determine if the answer is correct
        const correctOptionIndexes = getCorrectOptionIndexes();
        const isCorrect =
            selectedOptions.length === correctOptionIndexes.length &&
            selectedOptions.every(option =>
                correctOptionIndexes.includes(option)
            );

        // Automatically call onAnswer with the result
        onAnswer(isCorrect);
    }, [getCorrectOptionIndexes, selectedOptions, onAnswer]);

    const handleNext = useCallback(() => {
        setShowAnswer(false);
        setSelectedOptions([]);
        onNext();
        window.scrollTo({ top: 0, behavior: 'smooth' });
    }, [onNext]);

    const handlePrevious = useCallback(() => {
        setShowAnswer(false);
        setSelectedOptions([]);
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
                case '1':
                case 'a':
                case 'A':
                    event.preventDefault();
                    if (!showAnswer) {
                        handleOptionSelect(0);
                    }
                    break;
                case '2':
                case 'b':
                case 'B':
                    event.preventDefault();
                    if (!showAnswer) {
                        handleOptionSelect(1);
                    }
                    break;
                case '3':
                case 'c':
                case 'C':
                    event.preventDefault();
                    if (!showAnswer) {
                        handleOptionSelect(2);
                    }
                    break;
                case '4':
                case 'd':
                case 'D':
                    event.preventDefault();
                    if (!showAnswer) {
                        handleOptionSelect(3);
                    }
                    break;
                case 'Enter':
                case ' ':
                    event.preventDefault();
                    if (!showAnswer && selectedOptions.length > 0) {
                        handleRevealAnswer();
                    } else if (showAnswer) {
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
        selectedOptions,
        handleNext,
        handlePrevious,
        handleOptionSelect,
        handleRevealAnswer,
    ]);

    if (!currentQuestion) {
        return (
            <Box sx={{ maxWidth: 720, mx: 'auto', px: 2 }}>
                <Card>
                    <CardContent>
                        <Stack spacing={2} sx={{ alignItems: 'center' }}>
                            <Trophy size={48} />
                            <Typography
                                variant="h5"
                                sx={{ textAlign: 'center' }}
                            >
                                Quiz Complete! Great job!
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

    const correctOptionIndexes = getCorrectOptionIndexes();
    const isCorrect =
        selectedOptions.length === correctOptionIndexes.length &&
        selectedOptions.every(option => correctOptionIndexes.includes(option));

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
                                                src={resolveAssetPath(image)}
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
                            <Stack spacing={1}>
                                <Typography variant="subtitle2">
                                    Choose the correct answer:
                                </Typography>
                                <Stack spacing={1}>
                                    {currentQuestion.options.map(
                                        (option, index) => {
                                            const isSelected =
                                                selectedOptions.includes(index);
                                            const isCorrectOption =
                                                correctOptionIndexes.includes(
                                                    index
                                                );
                                            const isIncorrectSelection =
                                                showAnswer &&
                                                isSelected &&
                                                !isCorrectOption;
                                            const isCorrectSelection =
                                                showAnswer && isCorrectOption;
                                            return (
                                                <Button
                                                    key={index}
                                                    onClick={() =>
                                                        handleOptionSelect(
                                                            index
                                                        )
                                                    }
                                                    variant="outlined"
                                                    disabled={showAnswer}
                                                    sx={{
                                                        justifyContent:
                                                            'flex-start',
                                                        textTransform: 'none',
                                                        gap: 2,
                                                        alignItems:
                                                            'flex-start',
                                                        borderColor:
                                                            isCorrectSelection
                                                                ? 'success.main'
                                                                : isIncorrectSelection
                                                                  ? 'error.main'
                                                                  : isSelected
                                                                    ? 'primary.main'
                                                                    : 'divider',
                                                        bgcolor:
                                                            isCorrectSelection
                                                                ? 'success.light'
                                                                : isIncorrectSelection
                                                                  ? 'error.light'
                                                                  : isSelected
                                                                    ? 'primary.light'
                                                                    : 'transparent',
                                                    }}
                                                    title={`Select option ${String.fromCharCode(
                                                        65 + index
                                                    )} (${index + 1})`}
                                                >
                                                    <Chip
                                                        label={String.fromCharCode(
                                                            65 + index
                                                        )}
                                                        size="small"
                                                        sx={{
                                                            bgcolor: isSelected
                                                                ? 'primary.main'
                                                                : 'divider',
                                                            color: isSelected
                                                                ? 'common.white'
                                                                : 'text.secondary',
                                                        }}
                                                    />
                                                    <Box>
                                                        <Typography
                                                            variant="body2"
                                                            color="text.primary"
                                                        >
                                                            {formatText(option)}
                                                        </Typography>
                                                        {currentQuestion
                                                            .optionImages?.[
                                                            index
                                                        ] ? (
                                                            <Box
                                                                component="img"
                                                                src={resolveAssetPath(
                                                                    currentQuestion
                                                                        .optionImages[
                                                                        index
                                                                    ]
                                                                )}
                                                                alt=""
                                                                sx={{
                                                                    maxWidth:
                                                                        '100%',
                                                                    mt: 1,
                                                                    borderRadius: 1,
                                                                    border: '1px solid',
                                                                    borderColor:
                                                                        'divider',
                                                                }}
                                                            />
                                                        ) : null}
                                                    </Box>
                                                </Button>
                                            );
                                        }
                                    )}
                                </Stack>
                            </Stack>
                            {showAnswer && (
                                <>
                                    <Divider />
                                    <Stack spacing={1}>
                                        <Stack direction="row" spacing={1}>
                                            <CheckCircle size={18} />
                                            <Typography variant="subtitle1">
                                                Explanation
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
                                        {selectedOptions.length > 0 && (
                                            <Box
                                                sx={{
                                                    bgcolor: isCorrect
                                                        ? 'success.light'
                                                        : 'error.light',
                                                    p: 2,
                                                    borderRadius: 2,
                                                }}
                                            >
                                                <Stack
                                                    direction="row"
                                                    spacing={1}
                                                    sx={{
                                                        alignItems: 'center',
                                                    }}
                                                >
                                                    {isCorrect ? (
                                                        <CheckCircle
                                                            size={20}
                                                        />
                                                    ) : (
                                                        <XCircle size={20} />
                                                    )}
                                                    <Typography variant="body2">
                                                        {isCorrect
                                                            ? 'Correct! Well done.'
                                                            : `Incorrect. The correct answer was ${formatText(
                                                                  currentQuestion.answer.join(
                                                                      ', '
                                                                  )
                                                              )}.`}
                                                    </Typography>
                                                </Stack>
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
                                        disabled={selectedOptions.length === 0}
                                        startIcon={<Eye size={16} />}
                                    >
                                        Reveal Answer
                                    </Button>
                                ) : (
                                    <Button
                                        variant="contained"
                                        onClick={handleNext}
                                        startIcon={<ArrowRight size={20} />}
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
