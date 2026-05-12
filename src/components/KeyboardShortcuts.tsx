import React, { useState, useEffect, useRef } from 'react';
import {
    Box,
    IconButton,
    Popover,
    Stack,
    Chip,
    Typography,
} from '@mui/material';
import { Keyboard } from 'lucide-react';

export interface ShortcutItem {
    key: string;
    description: string;
}

interface KeyboardShortcutsProps {
    shortcuts: ShortcutItem[];
    className?: string;
}

export const KeyboardShortcuts: React.FC<KeyboardShortcutsProps> = ({
    shortcuts,
    className = '',
}) => {
    const btnRef = useRef<HTMLButtonElement>(null);
    const [anchorEl, setAnchorEl] = useState<HTMLElement | null>(null);
    const isOpen = Boolean(anchorEl);

    const handleToggle = (
        event: React.MouseEvent<HTMLButtonElement> | null
    ) => {
        if (isOpen) {
            setAnchorEl(null);
            return;
        }
        setAnchorEl(event?.currentTarget || btnRef.current);
    };

    // Handle ? key press
    useEffect(() => {
        const handleKeyPress = (event: KeyboardEvent) => {
            if (
                event.key === '?' &&
                !(
                    event.target instanceof HTMLInputElement ||
                    event.target instanceof HTMLTextAreaElement
                )
            ) {
                event.preventDefault();
                if (isOpen) {
                    setAnchorEl(null);
                } else if (btnRef.current) {
                    setAnchorEl(btnRef.current);
                }
            }
        };

        window.addEventListener('keydown', handleKeyPress);
        return () => window.removeEventListener('keydown', handleKeyPress);
    }, [isOpen]);

    return (
        <Box className={className}>
            <IconButton
                onClick={handleToggle}
                ref={btnRef}
                title="Toggle keyboard shortcuts"
                aria-haspopup="true"
                aria-expanded={isOpen}
            >
                <Keyboard size={20} />
            </IconButton>
            <Popover
                open={isOpen}
                anchorEl={anchorEl}
                onClose={() => setAnchorEl(null)}
                anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
                transformOrigin={{ vertical: 'top', horizontal: 'right' }}
                slotProps={{ paper: { sx: { p: 2, borderRadius: 2 } } }}
            >
                <Stack spacing={1}>
                    {shortcuts.map((shortcut, index) => (
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
            </Popover>
        </Box>
    );
};
