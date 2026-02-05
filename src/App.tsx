import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
    Question,
    QuestionPerformance,
    StudyMode,
    QuestionBank,
    QUESTION_BANKS,
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
    X,
    Sparkles,
    Home,
} from 'lucide-react';
import './App.css';
import { ConfirmModal } from './components/ConfirmModal';
import { CertificationSelector } from './components/CertificationSelector';

interface StudyTimeStats {
    totalStudyTime: number; // in minutes
}

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
        <div className="header-accuracy">
            <BarChart3 size={16} />
            <span className="accuracy-title">Average Accuracy:</span>
            <span className="accuracy-percentage">{accuracy}%</span>
            <span className="accuracy-details">
                ({totalCorrect}{' '}
                <CheckCircle className="correct-icon" size={16} /> /{' '}
                {totalAttempts} total
            </span>
        </div>
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
        <div className={`header-progress-container ${className}`}>
            <div className="header-progress-bar">
                <div
                    className="header-progress-fill"
                    style={{ width: `${percentage}%` }}
                />
            </div>
            <p className="header-progress-text">
                <TrendingUp size={14} />
                {current} of {total} questions answered
            </p>
        </div>
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

const setModeInURL = (mode: StudyMode | null) => {
    const url = new URL(window.location.href);
    if (mode) {
        url.searchParams.set('mode', mode);
    } else {
        url.searchParams.delete('mode');
    }
    window.history.replaceState({}, '', url.toString());
};

function App() {
    // Get initial bank from localStorage or null (show selector)
    const getInitialBank = (): QuestionBank | null => {
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
    const sidebarRef = useRef<HTMLDivElement | null>(null);
    const [metricsDropdownOpen, setMetricsDropdownOpen] = useState(false);
    const metricsBtnRef = useRef<HTMLButtonElement | null>(null);
    const metricsDropdownRef = useRef<HTMLDivElement | null>(null);
    const [selectedBank, setSelectedBank] = useState<QuestionBank | null>(
        getInitialBank
    );
    const [showResetStatsModal, setShowResetStatsModal] = useState(false);

    // Save selected bank to local storage
    useEffect(() => {
        if (selectedBank) {
            localStorage.setItem('last-used-bank', selectedBank.key);
        }
    }, [selectedBank]);

    // Accessibility: Focus trap and ESC key for sidebar
    useEffect(() => {
        if (!isSidebarOpen) return;
        const focusableSelectors = [
            'button',
            'a',
            'input',
            'select',
            'textarea',
            '[tabindex]:not([tabindex="-1"])',
        ];
        const sidebar = sidebarRef.current;
        if (!sidebar) return;
        const focusableEls = sidebar.querySelectorAll<HTMLElement>(
            focusableSelectors.join(',')
        );
        const firstEl = focusableEls[0];
        const lastEl = focusableEls[focusableEls.length - 1];
        if (firstEl) firstEl.focus();

        function handleKeyDown(e: KeyboardEvent) {
            if (e.key === 'Escape') {
                setIsSidebarOpen(false);
            } else if (e.key === 'Tab') {
                if (focusableEls.length === 0) return;
                if (e.shiftKey) {
                    if (document.activeElement === firstEl) {
                        e.preventDefault();
                        lastEl.focus();
                    }
                } else {
                    if (document.activeElement === lastEl) {
                        e.preventDefault();
                        firstEl.focus();
                    }
                }
            }
        }
        document.addEventListener('keydown', handleKeyDown);
        return () => document.removeEventListener('keydown', handleKeyDown);
    }, [isSidebarOpen]);

    // Prevent background scroll when sidebar is open
    useEffect(() => {
        if (isSidebarOpen) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = '';
        }
        return () => {
            document.body.style.overflow = '';
        };
    }, [isSidebarOpen]);

    // Close dropdown on outside click
    useEffect(() => {
        if (!metricsDropdownOpen) return;
        function handleClick(e: MouseEvent) {
            if (
                metricsDropdownRef.current &&
                !metricsDropdownRef.current.contains(e.target as Node) &&
                metricsBtnRef.current &&
                !metricsBtnRef.current.contains(e.target as Node)
            ) {
                setMetricsDropdownOpen(false);
            }
        }
        document.addEventListener('mousedown', handleClick);
        return () => document.removeEventListener('mousedown', handleClick);
    }, [metricsDropdownOpen]);

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
        (mode: StudyMode) => {
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

            setCurrentMode(mode);
            setCurrentQuestions(questionsToUse);
            setCurrentIndex(0);
        },
        [questions, performance]
    );

    // On initial load, set mode from URL if present (after questions are loaded)
    useEffect(() => {
        if (!isLoading && questions.length > 0 && !hasInitializedMode) {
            const modeFromURL = getModeFromURL();
            if (modeFromURL) {
                startMode(modeFromURL);
            }
            setHasInitializedMode(true);
        }
    }, [isLoading, questions.length, hasInitializedMode, startMode]);

    // Handle URL parameter changes (popstate) after questions are loaded
    useEffect(() => {
        if (isLoading || questions.length === 0) return;
        const handleURLChange = () => {
            const modeFromURL = getModeFromURL();
            if (modeFromURL && modeFromURL !== currentMode) {
                startMode(modeFromURL);
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
    }, [isLoading, questions.length, currentMode, startMode]);

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
        if (hasInitializedMode) {
            setModeInURL(currentMode);
        }
    }, [currentMode, hasInitializedMode]);

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
        <aside
            className="header-sidebar"
            ref={sidebarRef}
            aria-modal="true"
            role="dialog"
            tabIndex={-1}
            aria-labelledby="sidebar-heading"
        >
            <button
                className="sidebar-close-btn"
                aria-label="Close sidebar"
                onClick={() => setIsSidebarOpen(false)}
                autoFocus
            >
                <X size={24} />
            </button>
            {/* App logo and title at the top of the sidebar */}
            <div className="sidebar-app-title">
                {selectedBank?.key === 'genai' ? (
                    <Sparkles size={24} />
                ) : (
                    <Brain size={24} />
                )}
                <span>{selectedBank?.name || 'Certification'} Flashcards</span>
            </div>
            <div className="sidebar-content">
                {/* Home button to go back to certification selector */}
                <button
                    className="sidebar-home-btn"
                    onClick={() => {
                        setSelectedBank(null);
                        setCurrentMode(null);
                        setIsSidebarOpen(false);
                        window.scrollTo(0, 0);
                    }}
                >
                    <Home size={18} />
                    <span>Change Certification</span>
                </button>
                <section className="sidebar-section">
                    <h3 className="sidebar-section-label">Accuracy</h3>
                    <AccuracyDisplay
                        performance={performance}
                        questions={questions}
                    />
                </section>
                <section className="sidebar-section">
                    <h3 className="sidebar-section-label">Progress</h3>
                    <ProgressBar
                        current={stats.totalAnswered}
                        total={questions.length}
                    />
                </section>
                <section className="sidebar-section">
                    <h3 className="sidebar-section-label">Pomodoro Timer</h3>
                    <PomodoroTimer
                        onStudyTimeUpdate={handleStudyTimeUpdate}
                        sidebarMode={true}
                    />
                </section>
                <section>
                    <div className="keyboard-help">
                        <h3 className="sidebar-section-label">
                            Keyboard Shortcuts
                        </h3>
                        {getShortcuts().map((shortcut, index) => (
                            <div key={index} className="shortcut-item">
                                <span className="key">{shortcut.key}</span>
                                <span>{shortcut.description}</span>
                            </div>
                        ))}
                    </div>
                </section>
            </div>
        </aside>
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
        if (selectedBank?.key === 'genai') {
            appLogo = <Sparkles size={24} />;
        }
        return (
            <header className="app-header">
                <div className="header-left">
                    {currentMode ? (
                        <>
                            <button
                                onClick={handleBackToMenu}
                                className="back-button"
                            >
                                <ArrowLeft size={16} />
                                <span className="back-text">Menu</span>
                            </button>
                            <div className="mode-indicator">
                                {currentMode === 'flashcard' && (
                                    <>
                                        <BookOpen size={16} />
                                        <span>Flashcard Mode</span>
                                    </>
                                )}
                                {currentMode === 'quiz' && (
                                    <>
                                        <Brain size={16} />
                                        <span>Quiz Mode</span>
                                    </>
                                )}
                                {currentMode === 'review' && (
                                    <>
                                        <RotateCcw size={16} />
                                        <span>Review Mode</span>
                                    </>
                                )}
                                {currentMode === 'fill-in-blank' && (
                                    <>
                                        <Edit3 size={16} />
                                        <span>Fill-in-Blank Mode</span>
                                    </>
                                )}
                            </div>
                        </>
                    ) : (
                        <>
                            <button
                                onClick={handleBackToCertifications}
                                className="home-button"
                                title="Change certification"
                            >
                                <Home size={20} />
                            </button>
                            <h1>
                                {appLogo}
                                <span>{appName}</span>
                            </h1>
                        </>
                    )}
                </div>
                {/* Hamburger menu only on small screens */}
                <button
                    className="header-toggle"
                    aria-label={isSidebarOpen ? 'Close menu' : 'Open menu'}
                    aria-controls="header-sidebar"
                    aria-expanded={isSidebarOpen}
                    onClick={() => setIsSidebarOpen(!isSidebarOpen)}
                >
                    {isSidebarOpen ? <X size={24} /> : <Menu size={24} />}
                </button>
                {/* Inline header content for large screens only */}
                <div className="header-right">
                    <PomodoroTimer onStudyTimeUpdate={handleStudyTimeUpdate} />
                    <div className="header-metrics-wrapper">
                        <button
                            className="header-metrics-btn"
                            ref={metricsBtnRef}
                            aria-label="Show metrics"
                            aria-haspopup="true"
                            aria-expanded={metricsDropdownOpen}
                            onClick={() => setMetricsDropdownOpen(v => !v)}
                        >
                            <BarChart3 size={22} />
                        </button>
                        {metricsDropdownOpen && (
                            <div
                                className="header-metrics-dropdown"
                                ref={metricsDropdownRef}
                                tabIndex={-1}
                                role="menu"
                            >
                                <AccuracyDisplay
                                    performance={performance}
                                    questions={questions}
                                />
                                <ProgressBar
                                    current={stats.totalAnswered}
                                    total={questions.length}
                                />
                            </div>
                        )}
                    </div>
                    <KeyboardShortcuts shortcuts={getShortcuts()} />
                </div>
            </header>
        );
    };

    // Show certification selector if no bank is selected
    if (!selectedBank) {
        return (
            <div className="app cert-selector-page">
                <CertificationSelector
                    onSelectBank={bank => {
                        setSelectedBank(bank);
                        window.scrollTo(0, 0);
                    }}
                />
            </div>
        );
    }

    if (isLoading) {
        return (
            <div className="app">
                <div className="loading">
                    <div className="loading-spinner"></div>
                    <p>Loading questions...</p>
                </div>
            </div>
        );
    }

    if (currentMode === 'memorise') {
        return (
            <div className="app">
                {renderHeader()}
                <MemoriseMode questions={questions} performance={performance} />
            </div>
        );
    }

    if (currentMode && currentQuestions.length > 0) {
        return (
            <div className="app">
                {renderHeader()}
                <main className="app-main">
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
                </main>
            </div>
        );
    }

    return (
        <div className="app">
            {renderHeader()}
            {/* Sidebar and overlay for small screens */}
            {isSidebarOpen && (
                <div
                    className="header-overlay"
                    aria-label="Sidebar overlay"
                    onClick={() => setIsSidebarOpen(false)}
                    tabIndex={-1}
                />
            )}
            {isSidebarOpen && <HeaderSidebar />}
            <main className="app-main">
                <div className="stats-overview">
                    <h2>Progress Overview</h2>

                    <div className="stats-grid">
                        <div className="stat-card">
                            <FileText size={20} />
                            <h3>Questions</h3>
                            <p className="stat-number">{questions.length}</p>
                        </div>
                        <div className="stat-card">
                            <CheckCircle size={20} />
                            <h3>Answered</h3>
                            <p className="stat-number">{stats.totalAnswered}</p>
                        </div>
                        <div className="stat-card">
                            <Target size={20} />
                            <h3>Accuracy</h3>
                            <p className="stat-number">
                                {stats.accuracy.toFixed(1)}%
                            </p>
                        </div>
                        <div className="stat-card">
                            <AlertCircle size={20} />
                            <h3>Need Review</h3>
                            <p className="stat-number">
                                {reviewQuestions.length}
                            </p>
                        </div>
                        <div className="stat-card">
                            <Clock size={20} />
                            <h3>Study Time</h3>
                            <p className="stat-number">
                                {Math.floor(studyTimeStats.totalStudyTime / 60)}
                                h {studyTimeStats.totalStudyTime % 60}m
                            </p>
                        </div>
                    </div>
                </div>

                <div className="mode-selection">
                    <h2>Choose Study Mode</h2>

                    <div className="mode-grid">
                        <button
                            onClick={() => startMode('flashcard')}
                            className="mode-button flashcard-mode"
                        >
                            <BookOpen size={32} />
                            <h3>Flashcard Mode</h3>
                            <p>
                                Study questions one at a time. See the question,
                                then reveal the answer.
                            </p>
                        </button>

                        <button
                            onClick={() => startMode('quiz')}
                            className="mode-button quiz-mode"
                        >
                            <Brain size={32} />
                            <h3>Quiz Mode</h3>
                            <p>
                                Test your knowledge with multiple choice
                                questions.
                            </p>
                        </button>

                        <button
                            onClick={() => startMode('review')}
                            className="mode-button review-mode"
                            disabled={reviewQuestions.length === 0}
                        >
                            <RotateCcw size={32} />
                            <h3>Review Mode</h3>
                            <p>
                                Focus on questions you got wrong or haven't
                                answered yet.
                            </p>
                            {reviewQuestions.length === 0 && (
                                <span className="mode-disabled">
                                    No questions need review
                                </span>
                            )}
                        </button>

                        <button
                            onClick={() => startMode('memorise')}
                            className="mode-button memorise-mode"
                        >
                            <List size={32} />
                            <h3>Memorise Mode</h3>
                            <p>
                                Browse all questions and answers with
                                performance tracking.
                            </p>
                        </button>

                        <button
                            onClick={() => startMode('fill-in-blank')}
                            className="mode-button fill-in-blank-mode"
                        >
                            <Edit3 size={32} />
                            <h3>Fill-in-the-Blank Mode</h3>
                            <p>
                                Complete answers by filling in missing technical
                                keywords.
                            </p>
                        </button>
                    </div>
                </div>
            </main>

            <footer className="app-footer">
                <Heart size={16} />
                <p>Keep practicing to ace your Google Cloud certification!</p>
                <button
                    className="reset-stats-btn"
                    title="Reset all statistics"
                    onClick={() => setShowResetStatsModal(true)}
                >
                    Reset Statistics
                </button>
            </footer>
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
        </div>
    );
}

export default App;
