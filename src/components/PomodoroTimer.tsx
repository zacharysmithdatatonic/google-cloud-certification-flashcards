import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
    Box,
    Stack,
    Typography,
    IconButton,
    Button,
    Paper,
    Popover,
    Divider,
    TextField,
} from '@mui/material';
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
    const [menuAnchorEl, setMenuAnchorEl] = useState<HTMLElement | null>(null);
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
    const notificationAudioRef = useRef<HTMLAudioElement | null>(null);
    const isMenuOpen = Boolean(menuAnchorEl);

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

    const handleOpenMenu = (event: React.MouseEvent<HTMLElement>) => {
        setMenuAnchorEl(event.currentTarget);
    };

    const handleCloseMenu = () => {
        setMenuAnchorEl(null);
        setIsSettingsOpen(false);
    };

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
                    <Paper
                        elevation={3}
                        sx={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: 1,
                            px: 2,
                            py: 1.5,
                            borderRadius: 2,
                            borderLeft: '3px solid',
                            borderColor: 'primary.main',
                            opacity: t.visible ? 1 : 0,
                            transform: t.visible
                                ? 'translateY(0)'
                                : 'translateY(-16px)',
                            transition: 'all 0.3s ease',
                        }}
                    >
                        <Icon size={24} />
                        <Typography variant="body2" sx={{ fontWeight: 500 }}>
                            {randomMessage.message}
                        </Typography>
                    </Paper>
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

    const activeSettings = pendingSettings ?? settings;
    const statusLabel = waitingToContinue
        ? 'Break Complete!'
        : isWorkMode
          ? 'Work Session'
          : 'Break Time';

    return (
        <Box>
            <Stack
                direction="row"
                spacing={1}
                sx={{ alignItems: 'center', flexWrap: 'wrap' }}
            >
                <Timer size={16} />
                <Typography variant="body2" sx={{ fontWeight: 500 }}>
                    {formatTime(timeLeft)}
                </Typography>
                {waitingToContinue ? (
                    <Button
                        size="small"
                        variant="contained"
                        onClick={startNextWorkSession}
                    >
                        Start Work Session
                    </Button>
                ) : (
                    <IconButton size="small" onClick={toggleTimer}>
                        {isRunning ? <Pause size={16} /> : <Play size={16} />}
                    </IconButton>
                )}
                {!sidebarMode && (
                    <IconButton size="small" onClick={handleOpenMenu}>
                        <ChevronDown size={16} />
                    </IconButton>
                )}
            </Stack>
            {sidebarMode ? (
                <Box sx={{ mt: 2 }}>
                    {!isSettingsOpen ? (
                        <Stack spacing={2}>
                            <Stack
                                direction="row"
                                sx={{
                                    justifyContent: 'space-between',
                                    alignItems: 'center',
                                }}
                            >
                                <Typography variant="subtitle1">
                                    {statusLabel}
                                </Typography>
                                <Stack direction="row" spacing={1}>
                                    {!waitingToContinue && (
                                        <>
                                            <IconButton
                                                size="small"
                                                onClick={skipSession}
                                                title={`Skip to end of ${isWorkMode ? 'work' : 'break'} session`}
                                            >
                                                <SkipForward size={16} />
                                            </IconButton>
                                            <IconButton
                                                size="small"
                                                onClick={() =>
                                                    setShowResetTimerModal(true)
                                                }
                                            >
                                                <RotateCcw size={16} />
                                            </IconButton>
                                        </>
                                    )}
                                    <IconButton
                                        size="small"
                                        onClick={() => setIsSettingsOpen(true)}
                                    >
                                        <Settings size={16} />
                                    </IconButton>
                                </Stack>
                            </Stack>
                            <Divider />
                            <Stack direction="row" spacing={2}>
                                <Box>
                                    <Typography
                                        variant="caption"
                                        color="text.secondary"
                                    >
                                        Completed
                                    </Typography>
                                    <Typography variant="body2">
                                        {stats.completedPomodoros}
                                    </Typography>
                                </Box>
                                <Box>
                                    <Typography
                                        variant="caption"
                                        color="text.secondary"
                                    >
                                        Study Time
                                    </Typography>
                                    <Typography variant="body2">
                                        {stats.totalStudyTime} min
                                    </Typography>
                                </Box>
                                <Box>
                                    <Typography
                                        variant="caption"
                                        color="text.secondary"
                                    >
                                        Streak
                                    </Typography>
                                    <Typography variant="body2">
                                        {stats.currentStreak}
                                    </Typography>
                                </Box>
                            </Stack>
                        </Stack>
                    ) : (
                        <Stack spacing={2}>
                            <Stack
                                direction="row"
                                spacing={1}
                                sx={{ alignItems: 'center' }}
                            >
                                <IconButton
                                    size="small"
                                    onClick={closeSettings}
                                >
                                    <ArrowLeft size={16} />
                                </IconButton>
                                <Typography variant="subtitle1">
                                    Timer Settings
                                </Typography>
                            </Stack>
                            <Stack spacing={2}>
                                <TextField
                                    label="Work Time (minutes)"
                                    type="number"
                                    slotProps={{ htmlInput: { min: 1 } }}
                                    value={Math.floor(
                                        activeSettings.workTime / 60
                                    )}
                                    onChange={e =>
                                        handleSettingChange(
                                            'workTime',
                                            e.target.value
                                        )
                                    }
                                />
                                <TextField
                                    label="Break Time (minutes)"
                                    type="number"
                                    slotProps={{ htmlInput: { min: 1 } }}
                                    value={Math.floor(
                                        activeSettings.breakTime / 60
                                    )}
                                    onChange={e =>
                                        handleSettingChange(
                                            'breakTime',
                                            e.target.value
                                        )
                                    }
                                />
                                <TextField
                                    label="Long Break Time (minutes)"
                                    type="number"
                                    slotProps={{ htmlInput: { min: 1 } }}
                                    value={Math.floor(
                                        activeSettings.longBreakTime / 60
                                    )}
                                    onChange={e =>
                                        handleSettingChange(
                                            'longBreakTime',
                                            e.target.value
                                        )
                                    }
                                />
                                <TextField
                                    label="Sessions Until Long Break"
                                    type="number"
                                    slotProps={{ htmlInput: { min: 1 } }}
                                    value={
                                        activeSettings.sessionsUntilLongBreak
                                    }
                                    onChange={e =>
                                        handleSettingChange(
                                            'sessionsUntilLongBreak',
                                            e.target.value
                                        )
                                    }
                                />
                                <Stack direction="row" spacing={1}>
                                    <Button
                                        variant="contained"
                                        onClick={applySettings}
                                    >
                                        Save
                                    </Button>
                                    <Button
                                        variant="outlined"
                                        onClick={closeSettings}
                                    >
                                        Cancel
                                    </Button>
                                </Stack>
                            </Stack>
                        </Stack>
                    )}
                </Box>
            ) : (
                <Popover
                    open={isMenuOpen}
                    anchorEl={menuAnchorEl}
                    onClose={handleCloseMenu}
                    anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
                    transformOrigin={{ vertical: 'top', horizontal: 'right' }}
                    slotProps={{
                        paper: { sx: { p: 2, borderRadius: 2, width: 280 } },
                    }}
                >
                    {!isSettingsOpen ? (
                        <Stack spacing={2}>
                            <Stack
                                direction="row"
                                sx={{
                                    justifyContent: 'space-between',
                                    alignItems: 'center',
                                }}
                            >
                                <Typography variant="subtitle1">
                                    {statusLabel}
                                </Typography>
                                <Stack direction="row" spacing={1}>
                                    {!waitingToContinue && (
                                        <>
                                            <IconButton
                                                size="small"
                                                onClick={skipSession}
                                                title={`Skip to end of ${isWorkMode ? 'work' : 'break'} session`}
                                            >
                                                <SkipForward size={16} />
                                            </IconButton>
                                            <IconButton
                                                size="small"
                                                onClick={() =>
                                                    setShowResetTimerModal(true)
                                                }
                                            >
                                                <RotateCcw size={16} />
                                            </IconButton>
                                        </>
                                    )}
                                    <IconButton
                                        size="small"
                                        onClick={() => setIsSettingsOpen(true)}
                                    >
                                        <Settings size={16} />
                                    </IconButton>
                                </Stack>
                            </Stack>
                            <Divider />
                            <Stack direction="row" spacing={2}>
                                <Box>
                                    <Typography
                                        variant="caption"
                                        color="text.secondary"
                                    >
                                        Completed
                                    </Typography>
                                    <Typography variant="body2">
                                        {stats.completedPomodoros}
                                    </Typography>
                                </Box>
                                <Box>
                                    <Typography
                                        variant="caption"
                                        color="text.secondary"
                                    >
                                        Study Time
                                    </Typography>
                                    <Typography variant="body2">
                                        {stats.totalStudyTime} min
                                    </Typography>
                                </Box>
                                <Box>
                                    <Typography
                                        variant="caption"
                                        color="text.secondary"
                                    >
                                        Streak
                                    </Typography>
                                    <Typography variant="body2">
                                        {stats.currentStreak}
                                    </Typography>
                                </Box>
                            </Stack>
                        </Stack>
                    ) : (
                        <Stack spacing={2}>
                            <Stack
                                direction="row"
                                sx={{
                                    justifyContent: 'space-between',
                                    alignItems: 'center',
                                }}
                            >
                                <Typography variant="subtitle1">
                                    Timer Settings
                                </Typography>
                                <IconButton
                                    size="small"
                                    onClick={closeSettings}
                                >
                                    <X size={16} />
                                </IconButton>
                            </Stack>
                            <TextField
                                label="Work Time (minutes)"
                                type="number"
                                slotProps={{ htmlInput: { min: 1 } }}
                                value={Math.floor(activeSettings.workTime / 60)}
                                onChange={e =>
                                    handleSettingChange(
                                        'workTime',
                                        e.target.value
                                    )
                                }
                            />
                            <TextField
                                label="Break Time (minutes)"
                                type="number"
                                slotProps={{ htmlInput: { min: 1 } }}
                                value={Math.floor(
                                    activeSettings.breakTime / 60
                                )}
                                onChange={e =>
                                    handleSettingChange(
                                        'breakTime',
                                        e.target.value
                                    )
                                }
                            />
                            <TextField
                                label="Long Break Time (minutes)"
                                type="number"
                                slotProps={{ htmlInput: { min: 1 } }}
                                value={Math.floor(
                                    activeSettings.longBreakTime / 60
                                )}
                                onChange={e =>
                                    handleSettingChange(
                                        'longBreakTime',
                                        e.target.value
                                    )
                                }
                            />
                            <TextField
                                label="Sessions Until Long Break"
                                type="number"
                                slotProps={{ htmlInput: { min: 1 } }}
                                value={activeSettings.sessionsUntilLongBreak}
                                onChange={e =>
                                    handleSettingChange(
                                        'sessionsUntilLongBreak',
                                        e.target.value
                                    )
                                }
                            />
                            <Stack direction="row" spacing={1}>
                                <Button
                                    variant="contained"
                                    onClick={applySettings}
                                >
                                    Save
                                </Button>
                                <Button
                                    variant="outlined"
                                    onClick={closeSettings}
                                >
                                    Cancel
                                </Button>
                            </Stack>
                        </Stack>
                    )}
                </Popover>
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
        </Box>
    );
};
