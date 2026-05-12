import React from 'react';
import {
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Button,
    Typography,
} from '@mui/material';

interface ConfirmModalProps {
    open: boolean;
    title: string;
    message: string;
    confirmText?: string;
    cancelText?: string;
    onConfirm: () => void;
    onCancel: () => void;
}

export const ConfirmModal: React.FC<ConfirmModalProps> = ({
    open,
    title,
    message,
    confirmText = 'Yes',
    cancelText = 'Cancel',
    onConfirm,
    onCancel,
}) => {
    return (
        <Dialog open={open} onClose={onCancel} maxWidth="xs" fullWidth>
            <DialogTitle>{title}</DialogTitle>
            <DialogContent>
                <Typography variant="body2" color="text.secondary">
                    {message}
                </Typography>
            </DialogContent>
            <DialogActions>
                <Button variant="contained" onClick={onConfirm}>
                    {confirmText}
                </Button>
                <Button variant="outlined" onClick={onCancel}>
                    {cancelText}
                </Button>
            </DialogActions>
        </Dialog>
    );
};
