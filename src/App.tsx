import React, { useState, useEffect, useCallback } from 'react';
import {
    AppBar,
    Toolbar,
    Box,
    Typography,
    IconButton,
    Button,
    Stack,
    Drawer,
    LinearProgress,
    Menu as MuiMenu,
    Container,
    Card,
    CardContent,
    CardActionArea,
    Chip,
    useMediaQuery,
} from '@mui/material';
import { useTheme } from '@mui/material/styles';
import {
    Question,
    QuestionPerformance,
    StudyMode,
    QuestionBank,
    QUESTION_BANKS,
    CertificationTier,
} from './types';
import { loadQuestionsFromJSON } from './utils/questionParser';
import {
    createInitialPerformance,
    updatePerformance,
    getPerformanceStats,
    getQuestionsForReview,
    weightedShuffle,
    savePerformanceToStorage,
    loadPerformanceFromStorage,
} from './utils/performance';
import { FlashcardMode } from './components/FlashcardMode';
import { QuizMode } from './components/QuizMode';
import { ReviewMode } from './components/ReviewMode';
import { MemoriseMode } from './components/MemoriseMode';
import { FillInTheBlankMode } from './components/FillInTheBlankMode';
import { PomodoroTimer } from './components/PomodoroTimer';
import {
    KeyboardShortcuts,
    ShortcutItem,
} from './components/KeyboardShortcuts';
import {
    BookOpen,
    Brain,
    Cloud,
    Code,
    Database,
    RotateCcw,
    List,
    BarChart3,
    ArrowLeft,
    Target,
    CheckCircle,
    AlertCircle,
    FileText,
    TrendingUp,
    Heart,
    Edit3,
    Clock,
    Menu,
    Network,
    Settings,
    Shield,
    Users,
    X,
    Sparkles,
} from 'lucide-react';
import { ConfirmModal } from './components/ConfirmModal';
import { CertificationSelector } from './components/CertificationSelector';

interface StudyTimeStats {
    totalStudyTime: number; // in minutes
}

const getCertificationIcon = (key: string, size: number = 24) => {
    const iconProps = { size, strokeWidth: 1.5 };
    switch (key) {
        case 'cdl':
            return <Cloud {...iconProps} />;
        case 'genai':
            return <Sparkles {...iconProps} />;
        case 'ace':
            return <Cloud {...iconProps} />;
        case 'adp':
            return <Database {...iconProps} />;
        case 'agwa':
            return <Users {...iconProps} />;
        case 'pca':
            return <Cloud {...iconProps} />;
        case 'pcde':
            return <Database {...iconProps} />;
        case 'pcd':
            return <Code {...iconProps} />;
        case 'pde':
            return <Database {...iconProps} />;
        case 'pcdo':
            return <Settings {...iconProps} />;
        case 'pcse':
            return <Shield {...iconProps} />;
        case 'pcne':
            return <Network {...iconProps} />;
        case 'pmle':
            return <Brain {...iconProps} />;
        case 'psoe':
            return <Shield {...iconProps} />;
        default:
            return <BookOpen {...iconProps} />;
    }
};

// Accuracy Display Component
const AccuracyDisplay: React.FC<{
    performance: Map<string, QuestionPerformance>;
    questions: Question[]; // Pass questions to filter stats
}> = ({ performance, questions }) => {
    let totalCorrect = 0;
    let totalIncorrect = 0;
    const currentQuestionIds = new Set(questions.map(q => q.id));

    performance.forEach((perf, id) => {
        if (currentQuestionIds.has(id)) {
            totalCorrect += perf.correctCount;
            totalIncorrect += perf.incorrectCount;
        }
    });

    const totalAttempts = totalCorrect + totalIncorrect;
    const accuracy =
        totalAttempts === 0
            ? 0
            : Math.round((totalCorrect / totalAttempts) * 100);

    return (
        <Stack
            direction="row"
            spacing={1}
            sx={{ alignItems: 'center', flexWrap: 'wrap' }}
        >
            <BarChart3 size={16} />
            <Typography variant="body2" color="text.secondary">
                Average Accuracy:
            </Typography>
            <Typography variant="subtitle2">{accuracy}%</Typography>
            <Typography
                variant="caption"
                color="text.secondary"
                sx={{
                    display: { xs: 'none', md: 'inline-flex' },
                    alignItems: 'center',
                    gap: 0.5,
                }}
            >
                ({totalCorrect}
                <CheckCircle size={16} /> / {totalAttempts} total)
            </Typography>
        </Stack>
    );
};

// Progress Bar Component
const ProgressBar: React.FC<{
    current: number;
    total: number;
    className?: string;
}> = ({ current, total, className = '' }) => {
    const percentage = total > 0 ? (current / total) * 100 : 0;

    return (
        <Box
            className={className}
            sx={{
                minWidth: { xs: 100, md: 150 },
                maxWidth: 260,
                width: '100%',
            }}
        >
            <LinearProgress
                variant="determinate"
                value={percentage}
                sx={{
                    height: 6,
                    borderRadius: 999,
                    bgcolor: 'divider',
                    '& .MuiLinearProgress-bar': {
                        borderRadius: 999,
                        bgcolor: 'primary.main',
                    },
                }}
            />
            <Stack
                direction="row"
                spacing={0.5}
                sx={{
                    mt: 1,
                    color: 'text.secondary',
                    display: { xs: 'none', md: 'flex' },
                    alignItems: 'center',
                }}
            >
                <TrendingUp size={14} />
                <Typography variant="caption">
                    {current} of {total} questions answered
                </Typography>
            </Stack>
        </Box>
    );
};

// URL parameter utilities
const getModeFromURL = (): StudyMode | null => {
    const urlParams = new URLSearchParams(window.location.search);
    const mode = urlParams.get('mode') as StudyMode;
    return mode &&
        ['flashcard', 'quiz', 'review', 'memorise', 'fill-in-blank'].includes(
            mode
        )
        ? mode
        : null;
};

const toSlug = (value: string) =>
    value
        .trim()
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '');

const getBasePath = () => {
    const publicUrl = process.env.PUBLIC_URL || '';
    if (publicUrl && publicUrl !== '.') {
        const basePath = new URL(publicUrl, window.location.origin).pathname;
        const normalized = basePath.endsWith('/')
            ? basePath.slice(0, -1)
            : basePath;
        if (normalized && normalized !== '/') {
            return normalized;
        }
    }

    const parts = window.location.pathname.split('/').filter(Boolean);
    const tierIndex = parts.findIndex(part =>
        ['foundational', 'associate', 'professional'].includes(part)
    );
    if (tierIndex > 0) {
        return `/${parts.slice(0, tierIndex).join('/')}`;
    }
    if (tierIndex === 0) {
        return '';
    }
    if (parts.length === 1) {
        return `/${parts[0]}`;
    }
    return '';
};

const getBankPath = (bank: QuestionBank) => {
    const basePath = getBasePath();
    const prefix = basePath ? `${basePath}/` : '/';
    return `${prefix}${bank.tier}/${toSlug(bank.name)}`;
};

const getBankFromPath = (): QuestionBank | null => {
    const basePath = getBasePath();
    let path = window.location.pathname;
    if (basePath && path.startsWith(basePath)) {
        path = path.slice(basePath.length) || '/';
    }
    const parts = path.split('/').filter(Boolean);
    if (parts.length < 2) return null;
    const [tier, slug] = parts;
    if (!['foundational', 'associate', 'professional'].includes(tier)) {
        return null;
    }
    return (
        QUESTION_BANKS.find(
            bank =>
                bank.tier === (tier as CertificationTier) &&
                toSlug(bank.name) === slug &&
                bank.available
        ) || null
    );
};

const setBankInURL = (bank: QuestionBank | null) => {
    const basePath = getBasePath();
    const url = new URL(window.location.href);
    if (bank) {
        url.pathname = getBankPath(bank);
    } else {
        url.pathname = basePath || '/';
    }
    if (url.pathname === window.location.pathname) return;
    window.history.pushState({}, '', url.toString());
};

const getIndexFromURL = (): number | null => {
    const urlParams = new URLSearchParams(window.location.search);
    const indexParam = urlParams.get('index');
    if (!indexParam) return null;
    const parsed = Number.parseInt(indexParam, 10);
    return Number.isFinite(parsed) && parsed >= 0 ? parsed : null;
};

const getQuestionIdFromURL = (): string | null => {
    const urlParams = new URLSearchParams(window.location.search);
    const questionId = urlParams.get('questionId');
    return questionId && questionId.trim().length > 0 ? questionId : null;
};

const setSessionInURL = (
    mode: StudyMode | null,
    index: number | null,
    questionId: string | null
) => {
    const url = new URL(window.location.href);
    if (mode) {
        url.searchParams.set('mode', mode);
    } else {
        url.searchParams.delete('mode');
    }
    if (mode && index !== null) {
        url.searchParams.set('index', String(index));
    } else {
        url.searchParams.delete('index');
    }
    if (mode && questionId) {
        url.searchParams.set('questionId', questionId);
    } else {
        url.searchParams.delete('questionId');
    }
    window.history.replaceState({}, '', url.toString());
};

function App() {
    // Get initial bank from localStorage or null (show selector)
    const getInitialBank = (): QuestionBank | null => {
        const bankFromPath = getBankFromPath();
        if (bankFromPath) return bankFromPath;
        const savedKey = localStorage.getItem('last-used-bank');
        if (savedKey) {
            const bank = QUESTION_BANKS.find(
                b => b.key === savedKey && b.available
            );
            return bank || null;
        }
        return null;
    };
    const [questions, setQuestions] = useState<Question[]>([]);
    const [performance, setPerformance] = useState<
        Map<string, QuestionPerformance>
    >(new Map());
    const [currentMode, setCurrentMode] = useState<StudyMode | null>(null);
    const [currentQuestions, setCurrentQuestions] = useState<Question[]>([]);
    const [currentIndex, setCurrentIndex] = useState(0);
    const [isLoading, setIsLoading] = useState(true);
    const [isSwitchingBank, setIsSwitchingBank] = useState(false);
    const [hasInitializedMode, setHasInitializedMode] = useState(false);
    const [studyTimeStats, setStudyTimeStats] = useState<StudyTimeStats>(() => {
        // Load study time for the initial bank (will be updated when bank changes)
        const lastBankKey = localStorage.getItem('last-used-bank') || 'pmle';
        const saved = localStorage.getItem(
            `flashcard-study-time-${lastBankKey}`
        );
        return saved ? JSON.parse(saved) : { totalStudyTime: 0 };
    });
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);
    const [metricsAnchorEl, setMetricsAnchorEl] = useState<null | HTMLElement>(
        null
    );
    const [selectedBank, setSelectedBank] = useState<QuestionBank | null>(
        getInitialBank
    );
    const [showResetStatsModal, setShowResetStatsModal] = useState(false);
    const theme = useTheme();
    const isDesktop = useMediaQuery(theme.breakpoints.up('md'));

    // Save selected bank to local storage
    useEffect(() => {
        if (selectedBank) {
            localStorage.setItem('last-used-bank', selectedBank.key);
        }
    }, [selectedBank]);

    useEffect(() => {
        setBankInURL(selectedBank);
    }, [selectedBank]);

    const handleOpenMetrics = (event: React.MouseEvent<HTMLElement>) => {
        setMetricsAnchorEl(event.currentTarget);
    };

    const handleCloseMetrics = () => {
        setMetricsAnchorEl(null);
    };

    // Update study time stats when bank changes
    useEffect(() => {
        if (selectedBank) {
            const saved = localStorage.getItem(
                `flashcard-study-time-${selectedBank.key}`
            );
            setStudyTimeStats(
                saved ? JSON.parse(saved) : { totalStudyTime: 0 }
            );
        }
    }, [selectedBank]);

    const handleStudyTimeUpdate = useCallback(
        (totalMinutes: number) => {
            if (!selectedBank) return;
            setStudyTimeStats(prev => {
                const updated = {
                    totalStudyTime: prev.totalStudyTime + totalMinutes,
                };
                localStorage.setItem(
                    `flashcard-study-time-${selectedBank.key}`,
                    JSON.stringify(updated)
                );
                return updated;
            });
        },
        [selectedBank]
    );

    // Load questions and performance on app start or when selectedBank changes
    useEffect(() => {
        if (!selectedBank || !selectedBank.dataset) {
            setIsLoading(false);
            return;
        }

        const loadData = async () => {
            setIsSwitchingBank(true);
            try {
                // Load JSON data from public folder based on selectedBank
                // Pass bank key to ensure unique question IDs per bank
                const parsedQuestions = await loadQuestionsFromJSON(
                    selectedBank.dataset!,
                    selectedBank.key
                );
                setQuestions(parsedQuestions);

                // Load performance from localStorage (per bank)
                const savedPerformance = loadPerformanceFromStorage(
                    selectedBank.key
                );

                // Initialize performance for new questions
                const updatedPerformance = new Map(savedPerformance);
                parsedQuestions.forEach((q: Question) => {
                    if (!updatedPerformance.has(q.id)) {
                        updatedPerformance.set(
                            q.id,
                            createInitialPerformance(q.id)
                        );
                    }
                });

                setPerformance(updatedPerformance);
            } catch (error) {
                console.error('Error loading data:', error);
            } finally {
                setIsLoading(false);
                setIsSwitchingBank(false);
            }
        };

        loadData();
    }, [selectedBank]);

    const startMode = useCallback(
        (
            mode: StudyMode,
            startIndex?: number | null,
            startQuestionId?: string | null
        ) => {
            let questionsToUse: Question[] = [];

            switch (mode) {
                case 'review':
                    questionsToUse = getQuestionsForReview(
                        questions,
                        performance
                    );
                    if (questionsToUse.length === 0) {
                        alert(
                            'No questions need review! All questions have been answered correctly.'
                        );
                        return;
                    }
                    break;
                case 'memorise':
                    questionsToUse = questions;
                    break;
                default:
                    questionsToUse = weightedShuffle(questions, performance);
            }

            const matchedIndex = startQuestionId
                ? questionsToUse.findIndex(
                      question => question.id === startQuestionId
                  )
                : -1;
            const resolvedIndex =
                matchedIndex >= 0
                    ? matchedIndex
                    : typeof startIndex === 'number'
                      ? startIndex
                      : 0;
            const clampedIndex = Math.min(
                Math.max(resolvedIndex, 0),
                Math.max(questionsToUse.length - 1, 0)
            );

            setCurrentMode(mode);
            setCurrentQuestions(questionsToUse);
            setCurrentIndex(clampedIndex);
        },
        [questions, performance]
    );

    // On initial load, set mode from URL if present (after questions are loaded)
    useEffect(() => {
        if (!isLoading && questions.length > 0 && !hasInitializedMode) {
            const modeFromURL = getModeFromURL();
            if (modeFromURL) {
                startMode(
                    modeFromURL,
                    getIndexFromURL(),
                    getQuestionIdFromURL()
                );
            }
            setHasInitializedMode(true);
        }
    }, [isLoading, questions.length, hasInitializedMode, startMode]);

    // Handle URL parameter changes (popstate) after questions are loaded
    useEffect(() => {
        if (isLoading || questions.length === 0) return;
        const handleURLChange = () => {
            const modeFromURL = getModeFromURL();
            const indexFromURL = getIndexFromURL();
            const questionIdFromURL = getQuestionIdFromURL();
            const bankFromPath = getBankFromPath();
            if (bankFromPath && bankFromPath.key !== selectedBank?.key) {
                setSelectedBank(bankFromPath);
            } else if (!bankFromPath && selectedBank) {
                setSelectedBank(null);
            }
            if (modeFromURL && modeFromURL !== currentMode) {
                startMode(modeFromURL, indexFromURL, questionIdFromURL);
            } else if (modeFromURL && modeFromURL === currentMode) {
                const matchedIndex = questionIdFromURL
                    ? currentQuestions.findIndex(
                          question => question.id === questionIdFromURL
                      )
                    : -1;
                const resolvedIndex =
                    matchedIndex >= 0
                        ? matchedIndex
                        : typeof indexFromURL === 'number'
                          ? indexFromURL
                          : null;
                if (resolvedIndex !== null) {
                    const clampedIndex = Math.min(
                        Math.max(resolvedIndex, 0),
                        Math.max(currentQuestions.length - 1, 0)
                    );
                    setCurrentIndex(clampedIndex);
                }
            } else if (!modeFromURL && currentMode) {
                setCurrentMode(null);
                setCurrentQuestions([]);
                setCurrentIndex(0);
            }
        };

        window.addEventListener('popstate', handleURLChange);
        return () => {
            window.removeEventListener('popstate', handleURLChange);
        };
    }, [
        isLoading,
        questions.length,
        currentMode,
        currentQuestions,
        selectedBank,
        startMode,
    ]);

    // Save performance to localStorage whenever it changes (per bank)
    useEffect(() => {
        // Do not save while switching banks to prevent race conditions
        if (isSwitchingBank || !selectedBank) return;

        if (performance.size > 0) {
            savePerformanceToStorage(performance, selectedBank.key);
        }
    }, [performance, selectedBank, isSwitchingBank]);

    // Sync URL when currentMode changes (but not during initial load)
    useEffect(() => {
        if (!hasInitializedMode) return;
        const currentQuestionId = currentQuestions[currentIndex]?.id ?? null;
        const indexValue = currentMode ? currentIndex : null;
        setSessionInURL(currentMode, indexValue, currentQuestionId);
    }, [currentMode, currentIndex, currentQuestions, hasInitializedMode]);

    const handleAnswer = (isCorrect: boolean) => {
        const currentQuestion = currentQuestions[currentIndex];
        if (!currentQuestion) return;

        const currentPerf =
            performance.get(currentQuestion.id) ||
            createInitialPerformance(currentQuestion.id);
        const updatedPerf = updatePerformance(
            currentPerf,
            isCorrect,
            currentIndex
        );

        setPerformance(
            prev => new Map(prev.set(currentQuestion.id, updatedPerf))
        );

        // If answer was incorrect, schedule it to reappear
        if (!isCorrect && updatedPerf.scheduledNext !== null) {
            const newQuestions = [...currentQuestions];
            const insertIndex = Math.min(
                updatedPerf.scheduledNext,
                newQuestions.length
            );
            newQuestions.splice(insertIndex, 0, currentQuestion);
            setCurrentQuestions(newQuestions);
        }
    };

    const handleNext = () => {
        if (currentIndex < currentQuestions.length - 1) {
            setCurrentIndex(currentIndex + 1);
        } else {
            // Session complete
            setCurrentMode(null);
            setCurrentIndex(0);
        }
    };

    const handlePrevious = () => {
        if (currentIndex > 0) {
            setCurrentIndex(currentIndex - 1);
        }
    };

    const handleBackToMenu = () => {
        setCurrentMode(null);
        setCurrentIndex(0);
    };

    // Recalculate stats when performance or questions change (for homepage stats)
    // Only include stats for questions in the current bank
    const stats = getPerformanceStats(performance, questions);
    const reviewQuestions = getQuestionsForReview(questions, performance);

    // Update reset statistics to clear all banks
    const resetAllStatistics = () => {
        setPerformance(new Map());
        setStudyTimeStats({ totalStudyTime: 0 });

        // Clear performance for all banks
        QUESTION_BANKS.forEach(bank => {
            localStorage.removeItem(`flashcard-performance-${bank.key}`);
        });
        // Clear legacy performance data
        localStorage.removeItem('flashcard-performance');
        localStorage.removeItem('flashcard-performance-mle');

        // Clear study time for all banks
        QUESTION_BANKS.forEach(bank => {
            localStorage.removeItem(`flashcard-study-time-${bank.key}`);
        });
        // Clear legacy study time data
        localStorage.removeItem('flashcard-study-time');
        localStorage.removeItem('flashcard-study-time-mle');
    };

    // Define mode-specific keyboard shortcuts
    const getShortcuts = useCallback((): ShortcutItem[] => {
        if (!currentMode) {
            return [
                { key: '/', description: 'Focus search (in Memorise mode)' },
                { key: 'H', description: 'Toggle answers (in Memorise mode)' },
                { key: '?', description: 'Toggle keyboard help' },
            ];
        }

        switch (currentMode) {
            case 'flashcard':
                return [
                    { key: '←→', description: 'Navigate questions' },
                    { key: 'Space/Enter', description: 'Reveal answer' },
                    { key: '1', description: 'Mark incorrect' },
                    { key: '2', description: 'Mark correct' },
                    { key: '?', description: 'Toggle help' },
                ];
            case 'quiz':
            case 'review':
                return [
                    { key: '←→', description: 'Navigate questions' },
                    { key: '1234 / ABCD', description: 'Select answer' },
                    { key: 'Space/Enter', description: 'Reveal answer' },
                    { key: '?', description: 'Toggle help' },
                ];
            case 'fill-in-blank':
                return [
                    { key: '←→', description: 'Navigate questions' },
                    { key: 'Space/Enter', description: 'Check answers' },
                    { key: '?', description: 'Toggle help' },
                ];
            case 'memorise':
                return [
                    { key: 'H', description: 'Toggle answers' },
                    { key: '/', description: 'Focus search' },
                    { key: 'Esc', description: 'Clear search' },
                    { key: '?', description: 'Toggle help' },
                ];
            default:
                return [];
        }
    }, [currentMode]);

    // Sidebar content as a separate component
    const HeaderSidebar = () => (
        <Box sx={{ width: 320, maxWidth: '90vw', p: 2 }}>
            <Stack direction="row" sx={{ justifyContent: 'flex-end' }}>
                <IconButton
                    aria-label="Close sidebar"
                    onClick={() => setIsSidebarOpen(false)}
                >
                    <X size={20} />
                </IconButton>
            </Stack>
            <Stack
                direction="row"
                spacing={1}
                sx={{ alignItems: 'center', mb: 2 }}
            >
                {selectedBank
                    ? getCertificationIcon(selectedBank.key, 22)
                    : null}
                <Typography variant="subtitle1" sx={{ fontWeight: 500 }}>
                    {selectedBank?.name || 'Certification'} Flashcards
                </Typography>
            </Stack>
            <Stack spacing={2}>
                <Button
                    variant="text"
                    startIcon={<ArrowLeft size={18} />}
                    onClick={() => {
                        setSelectedBank(null);
                        setCurrentMode(null);
                        setIsSidebarOpen(false);
                        window.scrollTo(0, 0);
                    }}
                    sx={{
                        justifyContent: 'flex-start',
                        color: 'common.black',
                    }}
                >
                    Change Certification
                </Button>
                <Box>
                    <Typography
                        variant="overline"
                        color="text.secondary"
                        sx={{ display: 'block', mb: 1 }}
                    >
                        Accuracy
                    </Typography>
                    <AccuracyDisplay
                        performance={performance}
                        questions={questions}
                    />
                </Box>
                <Box>
                    <Typography
                        variant="overline"
                        color="text.secondary"
                        sx={{ display: 'block', mb: 1 }}
                    >
                        Progress
                    </Typography>
                    <ProgressBar
                        current={stats.totalAnswered}
                        total={questions.length}
                    />
                </Box>
                <Box>
                    <Typography
                        variant="overline"
                        color="text.secondary"
                        sx={{ display: 'block', mb: 1 }}
                    >
                        Pomodoro Timer
                    </Typography>
                    <PomodoroTimer
                        onStudyTimeUpdate={handleStudyTimeUpdate}
                        sidebarMode={true}
                    />
                </Box>
                <Box>
                    <Typography
                        variant="overline"
                        color="text.secondary"
                        sx={{ display: 'block', mb: 1 }}
                    >
                        Keyboard Shortcuts
                    </Typography>
                    <Stack spacing={1}>
                        {getShortcuts().map((shortcut, index) => (
                            <Stack
                                key={index}
                                direction="row"
                                spacing={1}
                                sx={{ alignItems: 'center' }}
                            >
                                <Chip
                                    label={shortcut.key}
                                    size="small"
                                    variant="outlined"
                                />
                                <Typography variant="body2">
                                    {shortcut.description}
                                </Typography>
                            </Stack>
                        ))}
                    </Stack>
                </Box>
            </Stack>
        </Box>
    );

    // Handler for going back to certification selector
    const handleBackToCertifications = () => {
        setSelectedBank(null);
        setCurrentMode(null);
        setCurrentQuestions([]);
        setCurrentIndex(0);
        window.scrollTo(0, 0);
    };

    const renderHeader = () => {
        // Determine app name and logo based on selected bank
        let appLogo = <Brain size={24} />;
        let appName = selectedBank?.name
            ? `${selectedBank.name} Flashcards`
            : 'Certification Flashcards';
        if (selectedBank) {
            appLogo = getCertificationIcon(selectedBank.key, 24);
        }
        return (
            <AppBar
                position="sticky"
                color="transparent"
                elevation={0}
                sx={{ borderBottom: 1, borderColor: 'divider' }}
            >
                <Toolbar
                    sx={{
                        gap: 2,
                        flexWrap: 'wrap',
                        minHeight: 56,
                        px: { xs: 2, md: 3 },
                        py: 1,
                    }}
                >
                    <Stack
                        direction="row"
                        spacing={1}
                        sx={{
                            alignItems: 'center',
                            flexWrap: 'wrap',
                            flex: 1,
                        }}
                    >
                        <IconButton
                            onClick={
                                currentMode
                                    ? handleBackToMenu
                                    : handleBackToCertifications
                            }
                            aria-label={
                                currentMode
                                    ? 'Back to menu'
                                    : 'Back to certifications'
                            }
                            sx={{ color: 'common.black' }}
                        >
                            <ArrowLeft size={20} />
                        </IconButton>
                        <Stack direction="row" spacing={1}>
                            {appLogo}
                            <Typography variant="h6">{appName}</Typography>
                        </Stack>
                        {currentMode ? (
                            <Chip
                                icon={
                                    currentMode === 'flashcard' ? (
                                        <BookOpen size={16} />
                                    ) : currentMode === 'quiz' ? (
                                        <Brain size={16} />
                                    ) : currentMode === 'review' ? (
                                        <RotateCcw size={16} />
                                    ) : currentMode === 'fill-in-blank' ? (
                                        <Edit3 size={16} />
                                    ) : (
                                        <List size={16} />
                                    )
                                }
                                label={
                                    currentMode === 'flashcard'
                                        ? 'Flashcard Mode'
                                        : currentMode === 'quiz'
                                          ? 'Quiz Mode'
                                          : currentMode === 'review'
                                            ? 'Review Mode'
                                            : currentMode === 'fill-in-blank'
                                              ? 'Fill-in-Blank Mode'
                                              : 'Memorise Mode'
                                }
                                color="primary"
                                variant="outlined"
                                sx={{ bgcolor: 'primary.light' }}
                            />
                        ) : null}
                    </Stack>
                    {isDesktop ? (
                        <Stack
                            direction="row"
                            spacing={2}
                            sx={{ alignItems: 'center' }}
                        >
                            <PomodoroTimer
                                onStudyTimeUpdate={handleStudyTimeUpdate}
                            />
                            <IconButton
                                aria-label="Show metrics"
                                onClick={handleOpenMetrics}
                            >
                                <BarChart3 size={22} />
                            </IconButton>
                            <MuiMenu
                                anchorEl={metricsAnchorEl}
                                open={Boolean(metricsAnchorEl)}
                                onClose={handleCloseMetrics}
                                transformOrigin={{
                                    vertical: 'top',
                                    horizontal: 'right',
                                }}
                                anchorOrigin={{
                                    vertical: 'bottom',
                                    horizontal: 'right',
                                }}
                                slotProps={{
                                    paper: {
                                        sx: {
                                            p: 2,
                                            borderRadius: 2,
                                            minWidth: 240,
                                        },
                                    },
                                }}
                            >
                                <Stack spacing={2}>
                                    <AccuracyDisplay
                                        performance={performance}
                                        questions={questions}
                                    />
                                    <ProgressBar
                                        current={stats.totalAnswered}
                                        total={questions.length}
                                    />
                                </Stack>
                            </MuiMenu>
                            <KeyboardShortcuts shortcuts={getShortcuts()} />
                        </Stack>
                    ) : (
                        <IconButton
                            aria-label={
                                isSidebarOpen ? 'Close menu' : 'Open menu'
                            }
                            aria-expanded={isSidebarOpen}
                            onClick={() => setIsSidebarOpen(!isSidebarOpen)}
                        >
                            {isSidebarOpen ? (
                                <X size={24} />
                            ) : (
                                <Menu size={24} />
                            )}
                        </IconButton>
                    )}
                </Toolbar>
            </AppBar>
        );
    };

    // Show certification selector if no bank is selected
    if (!selectedBank) {
        return (
            <Box
                sx={{
                    minHeight: '100vh',
                    display: 'flex',
                    flexDirection: 'column',
                }}
            >
                <CertificationSelector
                    onSelectBank={bank => {
                        setSelectedBank(bank);
                        window.scrollTo(0, 0);
                    }}
                />
            </Box>
        );
    }

    if (isLoading) {
        return (
            <Box
                sx={{
                    minHeight: '100vh',
                    display: 'flex',
                    flexDirection: 'column',
                }}
            >
                {renderHeader()}
                <Stack
                    spacing={2}
                    sx={{
                        alignItems: 'center',
                        justifyContent: 'center',
                        flex: 1,
                    }}
                >
                    <LinearProgress sx={{ width: 200 }} />
                    <Typography variant="body1">
                        Loading questions...
                    </Typography>
                </Stack>
            </Box>
        );
    }

    if (currentMode === 'memorise') {
        return (
            <Box
                sx={{
                    minHeight: '100vh',
                    display: 'flex',
                    flexDirection: 'column',
                }}
            >
                {renderHeader()}
                <Box sx={{ flex: 1 }}>
                    <MemoriseMode
                        questions={questions}
                        performance={performance}
                    />
                </Box>
            </Box>
        );
    }

    if (currentMode && currentQuestions.length > 0) {
        return (
            <Box
                sx={{
                    minHeight: '100vh',
                    display: 'flex',
                    flexDirection: 'column',
                }}
            >
                {renderHeader()}
                <Container
                    sx={{ flex: 1, py: 4, maxWidth: 1000 }}
                    maxWidth={false}
                >
                    {currentMode === 'flashcard' ? (
                        <FlashcardMode
                            questions={currentQuestions}
                            currentIndex={currentIndex}
                            onAnswer={handleAnswer}
                            onNext={handleNext}
                            onPrevious={handlePrevious}
                            performance={performance}
                        />
                    ) : currentMode === 'review' ? (
                        <ReviewMode
                            questions={currentQuestions}
                            currentIndex={currentIndex}
                            onAnswer={handleAnswer}
                            onNext={handleNext}
                            onPrevious={handlePrevious}
                            performance={performance}
                        />
                    ) : currentMode === 'fill-in-blank' ? (
                        <FillInTheBlankMode
                            questions={currentQuestions}
                            currentIndex={currentIndex}
                            onAnswer={handleAnswer}
                            onNext={handleNext}
                            onPrevious={handlePrevious}
                            performance={performance}
                        />
                    ) : (
                        <QuizMode
                            questions={currentQuestions}
                            currentIndex={currentIndex}
                            onAnswer={handleAnswer}
                            onNext={handleNext}
                            onPrevious={handlePrevious}
                            performance={performance}
                        />
                    )}
                </Container>
            </Box>
        );
    }

    return (
        <Box
            sx={{
                minHeight: '100vh',
                display: 'flex',
                flexDirection: 'column',
            }}
        >
            {renderHeader()}
            <Drawer
                anchor="right"
                open={isSidebarOpen}
                onClose={() => setIsSidebarOpen(false)}
                ModalProps={{ keepMounted: true }}
                sx={{ display: { md: 'none' } }}
            >
                <HeaderSidebar />
            </Drawer>
            <Container sx={{ flex: 1, py: 4, maxWidth: 1000 }} maxWidth={false}>
                <Stack spacing={4}>
                    <Box>
                        <Typography
                            variant="h5"
                            sx={{ textAlign: 'center', mb: 2 }}
                        >
                            Progress Overview
                        </Typography>
                        <Box
                            sx={{
                                display: 'grid',
                                gap: 2,
                                gridTemplateColumns: {
                                    xs: 'repeat(2, 1fr)',
                                    sm: 'repeat(3, 1fr)',
                                    md: 'repeat(5, 1fr)',
                                },
                            }}
                        >
                            {[
                                {
                                    label: 'Questions',
                                    value: questions.length,
                                    icon: <FileText size={20} />,
                                },
                                {
                                    label: 'Answered',
                                    value: stats.totalAnswered,
                                    icon: <CheckCircle size={20} />,
                                },
                                {
                                    label: 'Accuracy',
                                    value: `${stats.accuracy.toFixed(1)}%`,
                                    icon: <Target size={20} />,
                                },
                                {
                                    label: 'Need Review',
                                    value: reviewQuestions.length,
                                    icon: <AlertCircle size={20} />,
                                },
                                {
                                    label: 'Study Time',
                                    value: `${Math.floor(
                                        studyTimeStats.totalStudyTime / 60
                                    )}h ${studyTimeStats.totalStudyTime % 60}m`,
                                    icon: <Clock size={20} />,
                                },
                            ].map(stat => (
                                <Card key={stat.label}>
                                    <CardContent>
                                        <Stack
                                            spacing={1}
                                            sx={{
                                                alignItems: 'center',
                                                textAlign: 'center',
                                            }}
                                        >
                                            {stat.icon}
                                            <Typography
                                                variant="overline"
                                                color="text.secondary"
                                            >
                                                {stat.label}
                                            </Typography>
                                            <Typography variant="h6">
                                                {stat.value}
                                            </Typography>
                                        </Stack>
                                    </CardContent>
                                </Card>
                            ))}
                        </Box>
                    </Box>

                    <Box>
                        <Typography
                            variant="h5"
                            sx={{ textAlign: 'center', mb: 2 }}
                        >
                            Choose Study Mode
                        </Typography>
                        <Box
                            sx={{
                                display: 'grid',
                                gap: 2,
                                gridTemplateColumns: {
                                    xs: '1fr',
                                    sm: 'repeat(2, 1fr)',
                                },
                            }}
                        >
                            {[
                                {
                                    key: 'flashcard',
                                    label: 'Flashcard Mode',
                                    description:
                                        'Study questions one at a time. See the question, then reveal the answer.',
                                    icon: <BookOpen size={28} />,
                                    color: '#1a73e8',
                                    disabled: false,
                                },
                                {
                                    key: 'quiz',
                                    label: 'Quiz Mode',
                                    description:
                                        'Test your knowledge with multiple choice questions.',
                                    icon: <Brain size={28} />,
                                    color: '#1e8e3e',
                                    disabled: false,
                                },
                                {
                                    key: 'review',
                                    label: 'Review Mode',
                                    description:
                                        "Focus on questions you got wrong or haven't answered yet.",
                                    icon: <RotateCcw size={28} />,
                                    color: '#f9ab00',
                                    disabled: reviewQuestions.length === 0,
                                    badge:
                                        reviewQuestions.length === 0
                                            ? 'No questions need review'
                                            : undefined,
                                },
                                {
                                    key: 'memorise',
                                    label: 'Memorise Mode',
                                    description:
                                        'Browse all questions and answers with performance tracking.',
                                    icon: <List size={28} />,
                                    color: '#9334e6',
                                    disabled: false,
                                },
                                {
                                    key: 'fill-in-blank',
                                    label: 'Fill-in-the-Blank Mode',
                                    description:
                                        'Complete answers by filling in missing technical keywords.',
                                    icon: <Edit3 size={28} />,
                                    color: '#ea4335',
                                    disabled: false,
                                },
                            ].map(mode => (
                                <Card
                                    key={mode.key}
                                    sx={{
                                        borderLeft: `4px solid ${mode.color}`,
                                        opacity: mode.disabled ? 0.6 : 1,
                                        minHeight: 160,
                                    }}
                                >
                                    <CardActionArea
                                        onClick={() =>
                                            startMode(mode.key as StudyMode)
                                        }
                                        disabled={mode.disabled}
                                        sx={{ height: '100%' }}
                                    >
                                        <CardContent sx={{ height: '100%' }}>
                                            <Stack
                                                spacing={1}
                                                sx={{ height: '100%' }}
                                            >
                                                <Stack
                                                    direction="row"
                                                    spacing={1}
                                                    sx={{
                                                        alignItems: 'center',
                                                    }}
                                                >
                                                    {mode.icon}
                                                    <Typography variant="h6">
                                                        {mode.label}
                                                    </Typography>
                                                </Stack>
                                                <Typography
                                                    variant="body2"
                                                    color="text.secondary"
                                                >
                                                    {mode.description}
                                                </Typography>
                                                {mode.badge ? (
                                                    <Typography
                                                        variant="caption"
                                                        color="error"
                                                    >
                                                        {mode.badge}
                                                    </Typography>
                                                ) : null}
                                            </Stack>
                                        </CardContent>
                                    </CardActionArea>
                                </Card>
                            ))}
                        </Box>
                    </Box>
                </Stack>
            </Container>

            <Box
                component="footer"
                sx={{
                    borderTop: 1,
                    borderColor: 'divider',
                    py: 2,
                    px: 3,
                    display: 'flex',
                    alignItems: 'center',
                    gap: 1,
                    flexWrap: 'wrap',
                }}
            >
                <Heart size={16} />
                <Typography variant="body2" color="text.secondary">
                    Keep practicing to ace your Google Cloud certification!
                </Typography>
                <Button
                    variant="text"
                    color="secondary"
                    onClick={() => setShowResetStatsModal(true)}
                    sx={{ marginLeft: 'auto' }}
                >
                    Reset Statistics
                </Button>
            </Box>
            <ConfirmModal
                open={showResetStatsModal}
                title="Reset All Statistics?"
                message="Are you sure you want to reset all statistics? This cannot be undone."
                confirmText="Reset"
                cancelText="Cancel"
                onConfirm={() => {
                    resetAllStatistics();
                    setShowResetStatsModal(false);
                }}
                onCancel={() => setShowResetStatsModal(false)}
            />
        </Box>
    );
}

export default App;
