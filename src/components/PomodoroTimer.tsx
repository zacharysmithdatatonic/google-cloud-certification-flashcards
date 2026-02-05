import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
    Timer,
    Settings,
    Pause,
    Play,
    RotateCcw,
    ChevronDown,
    X,
    SkipForward,
    Coffee,
    Brain,
    Rocket,
    Zap,
    Target,
    ArrowLeft,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { ConfirmModal } from './ConfirmModal';

// Audio URLs
const NOTIFICATION_SOUND = `${process.env.PUBLIC_URL}/sounds/notification.mp3`;

// Motivational messages for different states
const BREAK_START_MESSAGES = [
    { message: 'Time for a well-deserved break!', icon: Coffee },
    { message: 'Rest and recharge!', icon: Zap },
    { message: 'Take a moment to relax.', icon: Brain },
];

const BREAK_END_MESSAGES = [
    { message: "Break's over - let's get back to it!", icon: Rocket },
    { message: 'Ready to continue learning!', icon: Target },
    { message: 'Time to focus again!', icon: Brain },
];

interface PomodoroStats {
    completedPomodoros: number;
    totalStudyTime: number; // in minutes
    currentStreak: number;
}

interface TimerSettings {
    workTime: number;
    breakTime: number;
    longBreakTime: number;
    sessionsUntilLongBreak: number;
}

const DEFAULT_SETTINGS: TimerSettings = {
    workTime: 25 * 60,
    breakTime: 5 * 60,
    longBreakTime: 15 * 60,
    sessionsUntilLongBreak: 4,
};

interface PomodoroTimerProps {
    onStudyTimeUpdate: (totalMinutes: number) => void;
    sidebarMode?: boolean;
}

export const PomodoroTimer: React.FC<PomodoroTimerProps> = ({
    onStudyTimeUpdate,
    sidebarMode = false,
}) => {
    const [timeLeft, setTimeLeft] = useState(DEFAULT_SETTINGS.workTime);
    const [isRunning, setIsRunning] = useState(false);
    const [isWorkMode, setIsWorkMode] = useState(true);
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const [isSettingsOpen, setIsSettingsOpen] = useState(false);
    const [settings, setSettings] = useState<TimerSettings>(DEFAULT_SETTINGS);
    const [stats, setStats] = useState<PomodoroStats>({
        completedPomodoros: 0,
        totalStudyTime: 0,
        currentStreak: 0,
    });
    const [audioEnabled, setAudioEnabled] = useState(true);
    const [pendingStudyTime, setPendingStudyTime] = useState<number | null>(
        null
    );
    const [waitingToContinue, setWaitingToContinue] = useState(false);
    const [showResetTimerModal, setShowResetTimerModal] = useState(false);
    // Track if settings have changed
    const [pendingSettings, setPendingSettings] =
        useState<TimerSettings | null>(null);

    // Track actual elapsed time in work mode
    const startTimeRef = useRef<number | null>(null);
    const elapsedTimeRef = useRef<number>(0);

    const timerRef = useRef<NodeJS.Timeout>();
    const containerRef = useRef<HTMLDivElement>(null);
    const notificationAudioRef = useRef<HTMLAudioElement | null>(null);
    const dropdownBtnRef = useRef<HTMLButtonElement | null>(null);
    const dropdownRef = useRef<HTMLDivElement | null>(null);

    // Initialize audio elements
    useEffect(() => {
        const audio = new Audio();

        const loadAudio = async () => {
            try {
                // First check if the file exists
                const response = await fetch(NOTIFICATION_SOUND);
                if (!response.ok) {
                    throw new Error(
                        `Failed to load audio file: ${response.statusText}`
                    );
                }

                // Set up event listeners before setting source
                audio.addEventListener(
                    'canplaythrough',
                    () => {
                        console.log('Audio loaded successfully');
                        notificationAudioRef.current = audio;
                    },
                    { once: true }
                ); // Only trigger once

                audio.addEventListener(
                    'error',
                    e => {
                        console.error('Audio loading failed:', e);
                        setAudioEnabled(false);
                    },
                    { once: true }
                ); // Only trigger once

                // Set audio properties and load
                audio.volume = 0.5;
                audio.preload = 'auto';
                audio.src = NOTIFICATION_SOUND;

                await audio.load(); // Explicitly load the audio
            } catch (error) {
                console.error('Audio initialization failed:', error);
                setAudioEnabled(false);
            }
        };

        loadAudio();

        return () => {
            if (audio) {
                audio.removeEventListener('canplaythrough', () => {});
                audio.removeEventListener('error', () => {});
                audio.src = '';
                notificationAudioRef.current = null;
            }
        };
    }, []);

    // Handle study time updates in an effect to avoid setState during render
    useEffect(() => {
        if (pendingStudyTime !== null) {
            onStudyTimeUpdate(pendingStudyTime);
            setPendingStudyTime(null);
        }
    }, [pendingStudyTime, onStudyTimeUpdate]);

    // Reset elapsed time when starting a new work session
    useEffect(() => {
        if (isWorkMode && timeLeft === settings.workTime) {
            elapsedTimeRef.current = 0;
        }
    }, [isWorkMode, timeLeft, settings.workTime]);

    // Track elapsed time when timer is running in work mode
    useEffect(() => {
        if (isRunning && isWorkMode) {
            startTimeRef.current = Date.now();

            return () => {
                if (startTimeRef.current) {
                    // Add the elapsed time since last start to total elapsed time
                    elapsedTimeRef.current += Math.floor(
                        (Date.now() - startTimeRef.current) / 1000
                    );
                    startTimeRef.current = null;
                }
            };
        }
    }, [isRunning, isWorkMode]);

    // Only run click-outside logic if not in sidebarMode
    useEffect(() => {
        if (sidebarMode) return;
        const handleClickOutside = (event: MouseEvent) => {
            if (
                dropdownRef.current &&
                !dropdownRef.current.contains(event.target as Node) &&
                dropdownBtnRef.current &&
                !dropdownBtnRef.current.contains(event.target as Node) &&
                isMenuOpen
            ) {
                setIsMenuOpen(false);
                setIsSettingsOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [isMenuOpen, sidebarMode]);

    const playSound = useCallback(() => {
        if (!audioEnabled) return;

        const audio = notificationAudioRef.current;
        if (audio) {
            audio.currentTime = 0; // Reset to start
            audio.play().catch(err => {
                console.error('Audio playback failed:', err);
                setAudioEnabled(false);
            });
        }
    }, [audioEnabled]);

    const showNotification = useCallback(
        (messages: typeof BREAK_START_MESSAGES) => {
            const randomMessage =
                messages[Math.floor(Math.random() * messages.length)];
            const Icon = randomMessage.icon;

            playSound();

            toast.custom(
                t => (
                    <div className={`custom-toast ${t.visible ? 'show' : ''}`}>
                        <Icon size={24} />
                        <span>{randomMessage.message}</span>
                    </div>
                ),
                {
                    duration: 4000,
                    position: 'top-center',
                }
            );
        },
        [playSound]
    );

    const handleTimerComplete = useCallback(() => {
        if (isWorkMode) {
            // Work session ending, break starting
            // Calculate final elapsed time including the current interval
            if (startTimeRef.current) {
                elapsedTimeRef.current += Math.floor(
                    (Date.now() - startTimeRef.current) / 1000
                );
                startTimeRef.current = null;
            }

            // Only update stats with actual elapsed time
            const actualMinutesStudied = Math.floor(
                elapsedTimeRef.current / 60
            );
            setStats(prev => ({
                completedPomodoros: prev.completedPomodoros + 1,
                totalStudyTime: prev.totalStudyTime + actualMinutesStudied,
                currentStreak: prev.currentStreak + 1,
            }));

            // Queue the study time update instead of calling it directly
            setPendingStudyTime(actualMinutesStudied);
            showNotification(BREAK_START_MESSAGES);
            setIsWorkMode(false);
            setTimeLeft(settings.breakTime);
        } else {
            // Break ending, work starting - wait for manual continuation
            showNotification(BREAK_END_MESSAGES);
            setWaitingToContinue(true);
            setIsRunning(false);
        }
    }, [isWorkMode, showNotification, settings.breakTime]);

    const startNextWorkSession = useCallback(() => {
        setWaitingToContinue(false);
        setIsWorkMode(true);
        setTimeLeft(settings.workTime);
        setIsRunning(true);
    }, [settings.workTime]);

    useEffect(() => {
        if (isRunning) {
            timerRef.current = setInterval(() => {
                setTimeLeft(prevTime => {
                    if (prevTime <= 1) {
                        clearInterval(timerRef.current);
                        handleTimerComplete();
                        return isWorkMode
                            ? settings.breakTime
                            : settings.workTime;
                    }
                    return prevTime - 1;
                });
            }, 1000);
        }

        return () => {
            if (timerRef.current) {
                clearInterval(timerRef.current);
            }
        };
    }, [isRunning, isWorkMode, settings, handleTimerComplete]);

    const skipSession = useCallback(() => {
        if (isWorkMode && startTimeRef.current) {
            // Add elapsed time before skipping
            elapsedTimeRef.current += Math.floor(
                (Date.now() - startTimeRef.current) / 1000
            );
            startTimeRef.current = null;
        }
        // Just switch modes without showing notifications
        setIsWorkMode(prev => !prev);
        setTimeLeft(isWorkMode ? settings.breakTime : settings.workTime);
    }, [isWorkMode, settings.breakTime, settings.workTime]);

    const toggleTimer = () => {
        setIsRunning(!isRunning);
    };

    const formatTime = (seconds: number): string => {
        const minutes = Math.floor(seconds / 60);
        const remainingSeconds = seconds % 60;
        return `${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
    };

    const handleSettingChange = (key: keyof TimerSettings, value: string) => {
        const numValue = parseInt(value, 10);
        if (!isNaN(numValue) && numValue > 0) {
            setPendingSettings(prev => ({
                ...(prev || settings),
                [key]:
                    key === 'sessionsUntilLongBreak' ? numValue : numValue * 60,
            }));
        }
    };

    const applySettings = () => {
        if (pendingSettings) {
            setSettings(pendingSettings);
        }
        setIsSettingsOpen(false);
        setPendingSettings(null);
    };

    const closeSettings = () => {
        setIsSettingsOpen(false);
        setPendingSettings(null);
    };

    return (
        <div
            className={`pomodoro-container${sidebarMode ? ' sidebar' : ''}`}
            ref={containerRef}
        >
            {sidebarMode ? (
                <div className="pomodoro-timer sidebar">
                    <div className="timer-display">
                        <Timer size={16} />
                        <span className="time">{formatTime(timeLeft)}</span>
                        {waitingToContinue ? (
                            <button
                                className="start-work-btn"
                                onClick={startNextWorkSession}
                            >
                                Start Work Session
                            </button>
                        ) : (
                            <button
                                className="play-pause-btn"
                                onClick={toggleTimer}
                            >
                                {isRunning ? (
                                    <Pause size={16} />
                                ) : (
                                    <Play size={16} />
                                )}
                            </button>
                        )}
                        {/* No chevron/expand in sidebar mode */}
                    </div>
                    <div className="pomodoro-menu sidebar">
                        {!isSettingsOpen ? (
                            <>
                                <div className="menu-header">
                                    <h3 style={{ fontSize: '1rem', margin: 0 }}>
                                        {waitingToContinue
                                            ? 'Break Complete!'
                                            : isWorkMode
                                              ? 'Work Session'
                                              : 'Break Time'}
                                    </h3>
                                    <div className="timer-controls">
                                        {!waitingToContinue && (
                                            <>
                                                <button
                                                    onClick={skipSession}
                                                    title={`Skip to end of ${isWorkMode ? 'work' : 'break'} session`}
                                                >
                                                    <SkipForward size={16} />
                                                </button>
                                                <button
                                                    onClick={() =>
                                                        setShowResetTimerModal(
                                                            true
                                                        )
                                                    }
                                                >
                                                    <RotateCcw size={16} />
                                                </button>
                                            </>
                                        )}
                                        <button
                                            onClick={() =>
                                                setIsSettingsOpen(true)
                                            }
                                        >
                                            <Settings size={16} />
                                        </button>
                                    </div>
                                </div>
                                <div className="stats-container">
                                    <div className="stat-item">
                                        <span className="stat-label">
                                            Completed
                                        </span>
                                        <span className="stat-value">
                                            {stats.completedPomodoros}
                                        </span>
                                    </div>
                                    <div className="stat-item">
                                        <span className="stat-label">
                                            Study Time
                                        </span>
                                        <span className="stat-value">
                                            {stats.totalStudyTime} min
                                        </span>
                                    </div>
                                    <div className="stat-item">
                                        <span className="stat-label">
                                            Streak
                                        </span>
                                        <span className="stat-value">
                                            {stats.currentStreak}
                                        </span>
                                    </div>
                                </div>
                            </>
                        ) : (
                            <div className="settings-menu sidebar">
                                <div className="settings-header sidebar">
                                    <button
                                        className="back-settings-btn"
                                        onClick={closeSettings}
                                        style={{
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: 4,
                                        }}
                                    >
                                        <ArrowLeft size={16} />
                                        <span>Back</span>
                                    </button>
                                    <h3 style={{ margin: 0, fontSize: '1rem' }}>
                                        Timer Settings
                                    </h3>
                                </div>
                                <div className="settings-content sidebar">
                                    <div className="setting-item">
                                        <label htmlFor="workTime">
                                            Work Time (minutes)
                                        </label>
                                        <input
                                            id="workTime"
                                            type="number"
                                            min="1"
                                            value={Math.floor(
                                                settings.workTime / 60
                                            )}
                                            onChange={e =>
                                                handleSettingChange(
                                                    'workTime',
                                                    e.target.value
                                                )
                                            }
                                        />
                                    </div>
                                    <div className="setting-item">
                                        <label htmlFor="breakTime">
                                            Break Time (minutes)
                                        </label>
                                        <input
                                            id="breakTime"
                                            type="number"
                                            min="1"
                                            value={Math.floor(
                                                settings.breakTime / 60
                                            )}
                                            onChange={e =>
                                                handleSettingChange(
                                                    'breakTime',
                                                    e.target.value
                                                )
                                            }
                                        />
                                    </div>
                                    <div className="setting-item">
                                        <label htmlFor="longBreakTime">
                                            Long Break Time (minutes)
                                        </label>
                                        <input
                                            id="longBreakTime"
                                            type="number"
                                            min="1"
                                            value={Math.floor(
                                                settings.longBreakTime / 60
                                            )}
                                            onChange={e =>
                                                handleSettingChange(
                                                    'longBreakTime',
                                                    e.target.value
                                                )
                                            }
                                        />
                                    </div>
                                    <div className="setting-item">
                                        <label htmlFor="sessionsUntilLongBreak">
                                            Sessions Until Long Break
                                        </label>
                                        <input
                                            id="sessionsUntilLongBreak"
                                            type="number"
                                            min="1"
                                            value={
                                                settings.sessionsUntilLongBreak
                                            }
                                            onChange={e =>
                                                handleSettingChange(
                                                    'sessionsUntilLongBreak',
                                                    e.target.value
                                                )
                                            }
                                        />
                                    </div>
                                    <div className="setting-item">
                                        <button onClick={applySettings}>
                                            Save
                                        </button>
                                        <button onClick={closeSettings}>
                                            Cancel
                                        </button>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            ) : (
                <>
                    <div className="pomodoro-timer">
                        <Timer size={16} />
                        <span className="time">{formatTime(timeLeft)}</span>
                        {waitingToContinue ? (
                            <button
                                className="start-work-btn"
                                onClick={e => {
                                    e.stopPropagation();
                                    startNextWorkSession();
                                }}
                            >
                                Start Work Session
                            </button>
                        ) : (
                            <button
                                className="play-pause-btn"
                                onClick={e => {
                                    e.stopPropagation();
                                    toggleTimer();
                                }}
                            >
                                {isRunning ? (
                                    <Pause size={16} />
                                ) : (
                                    <Play size={16} />
                                )}
                            </button>
                        )}
                        <button
                            className="header-metrics-btn"
                            ref={dropdownBtnRef}
                            aria-label="Show Pomodoro details"
                            aria-haspopup="true"
                            aria-expanded={isMenuOpen}
                            onClick={e => {
                                e.stopPropagation();
                                setIsMenuOpen(v => !v);
                            }}
                        >
                            <ChevronDown size={16} />
                        </button>
                    </div>
                    {isMenuOpen && (
                        <div
                            className="header-metrics-dropdown"
                            ref={dropdownRef}
                            tabIndex={-1}
                            role="menu"
                        >
                            {!isSettingsOpen ? (
                                <>
                                    <div className="menu-header">
                                        <h3
                                            style={{
                                                fontSize: '1rem',
                                                margin: 0,
                                            }}
                                        >
                                            {waitingToContinue
                                                ? 'Break Complete!'
                                                : isWorkMode
                                                  ? 'Work Session'
                                                  : 'Break Time'}
                                        </h3>
                                        <div className="timer-controls">
                                            {!waitingToContinue && (
                                                <>
                                                    <button
                                                        onClick={skipSession}
                                                        title={`Skip to end of ${isWorkMode ? 'work' : 'break'} session`}
                                                    >
                                                        <SkipForward
                                                            size={16}
                                                        />
                                                    </button>
                                                    <button
                                                        onClick={() =>
                                                            setShowResetTimerModal(
                                                                true
                                                            )
                                                        }
                                                    >
                                                        <RotateCcw size={16} />
                                                    </button>
                                                </>
                                            )}
                                            <button
                                                onClick={() =>
                                                    setIsSettingsOpen(true)
                                                }
                                            >
                                                <Settings size={16} />
                                            </button>
                                        </div>
                                    </div>
                                    <div className="stats-container">
                                        <div className="stat-item">
                                            <span className="stat-label">
                                                Completed
                                            </span>
                                            <span className="stat-value">
                                                {stats.completedPomodoros}
                                            </span>
                                        </div>
                                        <div className="stat-item">
                                            <span className="stat-label">
                                                Study Time
                                            </span>
                                            <span className="stat-value">
                                                {stats.totalStudyTime} min
                                            </span>
                                        </div>
                                        <div className="stat-item">
                                            <span className="stat-label">
                                                Streak
                                            </span>
                                            <span className="stat-value">
                                                {stats.currentStreak}
                                            </span>
                                        </div>
                                    </div>
                                </>
                            ) : (
                                <div className="settings-menu">
                                    <div className="settings-header">
                                        <h3>Timer Settings</h3>
                                        <button
                                            className="close-settings"
                                            onClick={closeSettings}
                                        >
                                            <X size={16} />
                                        </button>
                                    </div>
                                    <div className="settings-content">
                                        <div className="setting-item">
                                            <label htmlFor="workTime">
                                                Work Time (minutes)
                                            </label>
                                            <input
                                                id="workTime"
                                                type="number"
                                                min="1"
                                                value={Math.floor(
                                                    settings.workTime / 60
                                                )}
                                                onChange={e =>
                                                    handleSettingChange(
                                                        'workTime',
                                                        e.target.value
                                                    )
                                                }
                                            />
                                        </div>
                                        <div className="setting-item">
                                            <label htmlFor="breakTime">
                                                Break Time (minutes)
                                            </label>
                                            <input
                                                id="breakTime"
                                                type="number"
                                                min="1"
                                                value={Math.floor(
                                                    settings.breakTime / 60
                                                )}
                                                onChange={e =>
                                                    handleSettingChange(
                                                        'breakTime',
                                                        e.target.value
                                                    )
                                                }
                                            />
                                        </div>
                                        <div className="setting-item">
                                            <label htmlFor="longBreakTime">
                                                Long Break Time (minutes)
                                            </label>
                                            <input
                                                id="longBreakTime"
                                                type="number"
                                                min="1"
                                                value={Math.floor(
                                                    settings.longBreakTime / 60
                                                )}
                                                onChange={e =>
                                                    handleSettingChange(
                                                        'longBreakTime',
                                                        e.target.value
                                                    )
                                                }
                                            />
                                        </div>
                                        <div className="setting-item">
                                            <label htmlFor="sessionsUntilLongBreak">
                                                Sessions Until Long Break
                                            </label>
                                            <input
                                                id="sessionsUntilLongBreak"
                                                type="number"
                                                min="1"
                                                value={
                                                    settings.sessionsUntilLongBreak
                                                }
                                                onChange={e =>
                                                    handleSettingChange(
                                                        'sessionsUntilLongBreak',
                                                        e.target.value
                                                    )
                                                }
                                            />
                                        </div>
                                        <div className="setting-actions">
                                            <button
                                                className="setting-save-btn"
                                                onClick={applySettings}
                                            >
                                                Save
                                            </button>
                                            <button
                                                className="setting-cancel-btn"
                                                onClick={closeSettings}
                                            >
                                                Cancel
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                    )}
                </>
            )}
            <ConfirmModal
                open={showResetTimerModal}
                title="Reset Timer?"
                message="Are you sure you want to reset the Pomodoro timer?"
                confirmText="Reset"
                cancelText="Cancel"
                onConfirm={() => {
                    setIsRunning(false);
                    setTimeLeft(
                        isWorkMode ? settings.workTime : settings.breakTime
                    );
                    setShowResetTimerModal(false);
                }}
                onCancel={() => setShowResetTimerModal(false)}
            />
        </div>
    );
};
