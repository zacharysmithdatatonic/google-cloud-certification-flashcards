import React, { useState, useEffect } from 'react';
import {
    Box,
    Stack,
    Typography,
    TextField,
    InputAdornment,
    FormControlLabel,
    Switch,
    Select,
    MenuItem,
    Card,
    CardContent,
    Divider,
    Chip,
    Button,
} from '@mui/material';
import { Question, QuestionPerformance } from '../types';
import {
    TrendingUp,
    TrendingDown,
    Eye,
    Search,
    Filter,
    HelpCircle,
    CheckCircle,
    XCircle,
    Calendar,
    BarChart3,
    ListChecks,
} from 'lucide-react';
import { formatText } from '../utils/textFormatting';

// Helper function to check if explanation has meaningful content
const hasExplanation = (explanation: string): boolean => {
    return explanation.trim().replace(/\n/g, '').length > 0;
};

interface MemoriseModeProps {
    questions: Question[];
    performance: Map<string, QuestionPerformance>;
}

export const MemoriseMode: React.FC<MemoriseModeProps> = ({
    questions,
    performance,
}) => {
    const [searchTerm, setSearchTerm] = useState('');
    const [showAnswers, setShowAnswers] = useState(true);
    const [revealedAnswers, setRevealedAnswers] = useState<Set<string>>(
        () => new Set()
    );
    const [sortBy, setSortBy] = useState<'index' | 'performance' | 'accuracy'>(
        'index'
    );

    const toggleShowAnswers = (nextValue: boolean) => {
        setShowAnswers(nextValue);
        if (!nextValue) {
            setRevealedAnswers(new Set());
        }
    };

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
                case 'h':
                case 'H':
                    event.preventDefault();
                    toggleShowAnswers(!showAnswers);
                    break;
                case '/':
                    event.preventDefault();
                    (
                        document.querySelector(
                            '.search-input'
                        ) as HTMLInputElement
                    )?.focus();
                    break;
                case 'Escape':
                    event.preventDefault();
                    setSearchTerm('');
                    (
                        document.querySelector(
                            '.search-input'
                        ) as HTMLInputElement
                    )?.blur();
                    break;
            }
        };

        window.addEventListener('keydown', handleKeyPress);
        return () => window.removeEventListener('keydown', handleKeyPress);
    }, [showAnswers]);

    const filteredQuestions = questions.filter(
        q =>
            formatText(q.question)
                .toLowerCase()
                .includes(searchTerm.toLowerCase()) ||
            formatText(q.answer.join(', '))
                .toLowerCase()
                .includes(searchTerm.toLowerCase()) ||
            formatText(q.explanation)
                .toLowerCase()
                .includes(searchTerm.toLowerCase())
    );

    const sortedQuestions = [...filteredQuestions].sort((a, b) => {
        const perfA = performance.get(a.id);
        const perfB = performance.get(b.id);

        switch (sortBy) {
            case 'performance':
                const totalA =
                    (perfA?.correctCount || 0) + (perfA?.incorrectCount || 0);
                const totalB =
                    (perfB?.correctCount || 0) + (perfB?.incorrectCount || 0);
                return totalB - totalA;
            case 'accuracy':
                const accuracyA = perfA
                    ? perfA.correctCount /
                          (perfA.correctCount + perfA.incorrectCount) || 0
                    : 0;
                const accuracyB = perfB
                    ? perfB.correctCount /
                          (perfB.correctCount + perfB.incorrectCount) || 0
                    : 0;
                return accuracyB - accuracyA;
            default:
                return 0;
        }
    });

    const getAccuracy = (perf: QuestionPerformance | undefined) => {
        if (!perf || perf.correctCount + perf.incorrectCount === 0) return 0;
        return (
            (perf.correctCount / (perf.correctCount + perf.incorrectCount)) *
            100
        );
    };

    const getPerformanceColor = (perf: QuestionPerformance | undefined) => {
        const accuracy = getAccuracy(perf);
        if (accuracy >= 80) return 'performance-excellent';
        if (accuracy >= 60) return 'performance-good';
        if (accuracy >= 40) return 'performance-fair';
        return 'performance-poor';
    };

    return (
        <Box sx={{ maxWidth: 900, mx: 'auto', px: 2, py: 3 }}>
            <Stack spacing={3}>
                <Stack
                    direction={{ xs: 'column', md: 'row' }}
                    spacing={2}
                    sx={{ alignItems: { xs: 'stretch', md: 'center' } }}
                >
                    <TextField
                        fullWidth
                        placeholder="Search questions, answers, or explanations... (Press / to focus)"
                        value={searchTerm}
                        onChange={e => setSearchTerm(e.target.value)}
                        slotProps={{
                            input: {
                                startAdornment: (
                                    <InputAdornment position="start">
                                        <Search size={18} />
                                    </InputAdornment>
                                ),
                            },
                        }}
                    />
                    <Stack
                        direction="row"
                        spacing={2}
                        sx={{
                            alignItems: 'center',
                        }}
                    >
                        <FormControlLabel
                            control={
                                <Switch
                                    checked={!showAnswers}
                                    onChange={event =>
                                        toggleShowAnswers(!event.target.checked)
                                    }
                                />
                            }
                            label="Hide Answers"
                        />
                        <Stack
                            direction="row"
                            spacing={1}
                            sx={{
                                alignItems: 'center',
                            }}
                        >
                            <Filter size={16} />
                            <Select
                                value={sortBy}
                                onChange={e =>
                                    setSortBy(
                                        e.target.value as
                                            | 'index'
                                            | 'performance'
                                            | 'accuracy'
                                    )
                                }
                                size="small"
                            >
                                <MenuItem value="index">
                                    Original Order
                                </MenuItem>
                                <MenuItem value="performance">
                                    Most Attempted
                                </MenuItem>
                                <MenuItem value="accuracy">
                                    Highest Accuracy
                                </MenuItem>
                            </Select>
                        </Stack>
                    </Stack>
                </Stack>

                <Typography variant="body2" color="text.secondary">
                    Showing {sortedQuestions.length} of {questions.length}{' '}
                    questions
                </Typography>

                <Stack spacing={2}>
                    {sortedQuestions.map(question => {
                        const perf = performance.get(question.id);
                        const accuracy = getAccuracy(perf);
                        const performanceClass = getPerformanceColor(perf);
                        const badgeColor:
                            | 'default'
                            | 'success'
                            | 'warning'
                            | 'error' =
                            performanceClass === 'performance-excellent'
                                ? 'success'
                                : performanceClass === 'performance-good'
                                  ? 'success'
                                  : performanceClass === 'performance-fair'
                                    ? 'warning'
                                    : performanceClass === 'performance-poor'
                                      ? 'error'
                                      : 'default';

                        return (
                            <Card key={question.id}>
                                <CardContent>
                                    <Stack spacing={2}>
                                        <Stack
                                            direction="row"
                                            sx={{
                                                justifyContent: 'space-between',
                                                alignItems: 'center',
                                                flexWrap: 'wrap',
                                                gap: 1,
                                            }}
                                        >
                                            <Stack
                                                direction="row"
                                                spacing={1}
                                                sx={{
                                                    alignItems: 'center',
                                                }}
                                            >
                                                <HelpCircle size={16} />
                                                <Typography variant="subtitle2">
                                                    Question{' '}
                                                    {questions.indexOf(
                                                        question
                                                    ) + 1}
                                                </Typography>
                                            </Stack>
                                            {perf ? (
                                                <Chip
                                                    icon={
                                                        <BarChart3 size={14} />
                                                    }
                                                    label={`${accuracy.toFixed(
                                                        0
                                                    )}% · ${
                                                        perf.correctCount +
                                                        perf.incorrectCount
                                                    } attempts`}
                                                    color={badgeColor}
                                                    variant="outlined"
                                                />
                                            ) : (
                                                <Chip
                                                    icon={<XCircle size={14} />}
                                                    label="Not attempted"
                                                    variant="outlined"
                                                />
                                            )}
                                        </Stack>
                                        <Stack spacing={1}>
                                            <Stack
                                                direction="row"
                                                spacing={1}
                                                sx={{
                                                    alignItems: 'center',
                                                }}
                                            >
                                                <HelpCircle size={18} />
                                                <Typography variant="subtitle1">
                                                    Question
                                                </Typography>
                                            </Stack>
                                            {question.questionImages?.length ? (
                                                <Stack
                                                    direction="row"
                                                    spacing={1}
                                                    sx={{ flexWrap: 'wrap' }}
                                                >
                                                    {question.questionImages.map(
                                                        (image, index) => (
                                                            <Box
                                                                key={`${question.id}-qimg-${index}`}
                                                                component="img"
                                                                src={image}
                                                                alt=""
                                                                sx={{
                                                                    maxWidth:
                                                                        '100%',
                                                                    borderRadius: 1,
                                                                    border: '1px solid',
                                                                    borderColor:
                                                                        'divider',
                                                                }}
                                                            />
                                                        )
                                                    )}
                                                </Stack>
                                            ) : null}
                                            <Typography variant="body1">
                                                {formatText(question.question)}
                                            </Typography>
                                        </Stack>
                                        <Stack spacing={1}>
                                            <Stack
                                                direction="row"
                                                spacing={1}
                                                sx={{
                                                    alignItems: 'center',
                                                }}
                                            >
                                                <ListChecks size={16} />
                                                <Typography variant="subtitle2">
                                                    Options
                                                </Typography>
                                            </Stack>
                                            <Stack spacing={1}>
                                                {question.options.map(
                                                    (option, optionIndex) => (
                                                        <Stack
                                                            key={optionIndex}
                                                            direction="row"
                                                            spacing={1}
                                                            sx={{
                                                                alignItems:
                                                                    'flex-start',
                                                            }}
                                                        >
                                                            <Chip
                                                                label={String.fromCharCode(
                                                                    65 +
                                                                        optionIndex
                                                                )}
                                                                size="small"
                                                                variant="outlined"
                                                            />
                                                            <Box>
                                                                <Typography variant="body2">
                                                                    {formatText(
                                                                        option
                                                                    )}
                                                                </Typography>
                                                                {question
                                                                    .optionImages?.[
                                                                    optionIndex
                                                                ] ? (
                                                                    <Box
                                                                        component="img"
                                                                        src={
                                                                            question
                                                                                .optionImages[
                                                                                optionIndex
                                                                            ] ||
                                                                            ''
                                                                        }
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
                                                        </Stack>
                                                    )
                                                )}
                                            </Stack>
                                        </Stack>
                                        {!showAnswers &&
                                            !revealedAnswers.has(
                                                question.id
                                            ) && (
                                                <Button
                                                    variant="outlined"
                                                    onClick={() =>
                                                        setRevealedAnswers(
                                                            prevAnswers =>
                                                                new Set(
                                                                    prevAnswers
                                                                ).add(
                                                                    question.id
                                                                )
                                                        )
                                                    }
                                                >
                                                    Show answer
                                                </Button>
                                            )}
                                        {(showAnswers ||
                                            revealedAnswers.has(
                                                question.id
                                            )) && (
                                            <Box>
                                                <Divider sx={{ mb: 2 }} />
                                                <Stack spacing={1}>
                                                    <Stack
                                                        direction="row"
                                                        spacing={1}
                                                        sx={{
                                                            alignItems:
                                                                'center',
                                                        }}
                                                    >
                                                        <CheckCircle
                                                            size={16}
                                                        />
                                                        <Typography variant="subtitle1">
                                                            Answer & Explanation
                                                        </Typography>
                                                    </Stack>
                                                    <Typography variant="body1">
                                                        <strong>
                                                            Correct Answer:{' '}
                                                            {formatText(
                                                                question.answer.join(
                                                                    ', '
                                                                )
                                                            )}
                                                        </strong>
                                                    </Typography>
                                                    {hasExplanation(
                                                        question.explanation
                                                    ) && (
                                                        <Box
                                                            sx={{
                                                                bgcolor:
                                                                    'primary.light',
                                                                p: 2,
                                                                borderRadius: 2,
                                                            }}
                                                        >
                                                            <Typography variant="body2">
                                                                {formatText(
                                                                    question.explanation
                                                                )}
                                                            </Typography>
                                                        </Box>
                                                    )}
                                                </Stack>
                                            </Box>
                                        )}
                                        {perf && (
                                            <Stack
                                                direction={{
                                                    xs: 'column',
                                                    md: 'row',
                                                }}
                                                spacing={2}
                                                sx={{
                                                    alignItems: 'center',
                                                }}
                                            >
                                                <Stack
                                                    direction="row"
                                                    spacing={1}
                                                    sx={{
                                                        alignItems: 'center',
                                                    }}
                                                >
                                                    <TrendingUp size={16} />
                                                    <Typography variant="body2">
                                                        Correct:{' '}
                                                        {perf.correctCount}
                                                    </Typography>
                                                </Stack>
                                                <Stack
                                                    direction="row"
                                                    spacing={1}
                                                    sx={{
                                                        alignItems: 'center',
                                                    }}
                                                >
                                                    <TrendingDown size={16} />
                                                    <Typography variant="body2">
                                                        Incorrect:{' '}
                                                        {perf.incorrectCount}
                                                    </Typography>
                                                </Stack>
                                                {perf.lastAnswered && (
                                                    <Stack
                                                        direction="row"
                                                        spacing={1}
                                                        sx={{
                                                            alignItems:
                                                                'center',
                                                        }}
                                                    >
                                                        <Calendar size={14} />
                                                        <Typography variant="body2">
                                                            Last answered:{' '}
                                                            {perf.lastAnswered.toLocaleDateString()}
                                                        </Typography>
                                                    </Stack>
                                                )}
                                            </Stack>
                                        )}
                                    </Stack>
                                </CardContent>
                            </Card>
                        );
                    })}
                </Stack>

                {sortedQuestions.length === 0 && (
                    <Card>
                        <CardContent>
                            <Stack
                                spacing={1}
                                sx={{
                                    alignItems: 'center',
                                    textAlign: 'center',
                                }}
                            >
                                <Search size={48} />
                                <Typography variant="body1">
                                    No questions found matching your search.
                                </Typography>
                            </Stack>
                        </CardContent>
                    </Card>
                )}

                <Stack
                    direction={{ xs: 'column', md: 'row' }}
                    spacing={2}
                    sx={{ justifyContent: 'center', alignItems: 'center' }}
                >
                    <Stack
                        direction="row"
                        spacing={1}
                        sx={{
                            alignItems: 'center',
                        }}
                    >
                        <BarChart3 size={16} />
                        <Typography variant="body2" color="text.secondary">
                            Total Questions: {questions.length}
                        </Typography>
                    </Stack>
                    <Stack
                        direction="row"
                        spacing={1}
                        sx={{
                            alignItems: 'center',
                        }}
                    >
                        <Eye size={16} />
                        <Typography variant="body2" color="text.secondary">
                            Showing: {sortedQuestions.length}
                        </Typography>
                    </Stack>
                </Stack>
            </Stack>
        </Box>
    );
};
