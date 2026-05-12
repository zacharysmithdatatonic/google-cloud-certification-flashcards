import { createTheme, type Shadows } from '@mui/material/styles';

const shadowSm =
    '0 1px 2px 0 rgba(60, 64, 67, 0.3), 0 1px 3px 1px rgba(60, 64, 67, 0.15)';
const shadowMd =
    '0 1px 3px 0 rgba(60, 64, 67, 0.3), 0 4px 8px 3px rgba(60, 64, 67, 0.15)';
const shadowLg =
    '0 1px 3px 0 rgba(60, 64, 67, 0.3), 0 8px 16px 4px rgba(60, 64, 67, 0.15)';

const buildShadows = (): Shadows => {
    const shadows = Array(25).fill('none') as Shadows;
    shadows[1] = shadowSm;
    shadows[2] = shadowSm;
    shadows[3] = shadowMd;
    shadows[4] = shadowMd;
    shadows[5] = shadowLg;
    shadows[6] = shadowLg;
    return shadows;
};

export const theme = createTheme({
    palette: {
        mode: 'light',
        primary: {
            main: '#1a73e8',
            light: '#e8f0fe',
            dark: '#1967d2',
        },
        secondary: {
            main: '#5f6368',
        },
        success: {
            main: '#1e8e3e',
            light: '#e6f4ea',
        },
        error: {
            main: '#d93025',
            light: '#fce8e6',
        },
        warning: {
            main: '#f9ab00',
            light: '#fef7e0',
        },
        background: {
            default: '#ffffff',
            paper: '#ffffff',
        },
        text: {
            primary: '#202124',
            secondary: '#5f6368',
            disabled: '#9aa0a6',
        },
    },
    shape: {
        borderRadius: 8,
    },
    typography: {
        fontFamily:
            "'Google Sans','Product Sans','Inter','Roboto','Segoe UI',sans-serif",
        h1: { fontSize: '1.5rem', fontWeight: 500 },
        h2: { fontSize: '1.375rem', fontWeight: 400 },
        h3: { fontSize: '1.125rem', fontWeight: 400 },
        h4: { fontSize: '1rem', fontWeight: 500 },
        h5: { fontSize: '1.375rem', fontWeight: 400 },
        h6: { fontSize: '1.125rem', fontWeight: 400 },
        subtitle1: { fontSize: '0.95rem', fontWeight: 500 },
        subtitle2: { fontSize: '0.875rem', fontWeight: 500 },
        body1: { fontSize: '1rem', lineHeight: 1.7 },
        body2: { fontSize: '0.875rem', lineHeight: 1.6 },
        button: {
            textTransform: 'none',
            fontWeight: 500,
            fontSize: '0.875rem',
        },
    },
    shadows: buildShadows(),
    components: {
        MuiCssBaseline: {
            styleOverrides: {
                body: {
                    backgroundColor: '#ffffff',
                    color: '#202124',
                },
                '*': {
                    boxSizing: 'border-box',
                },
                '::-webkit-scrollbar': {
                    width: 8,
                },
                '::-webkit-scrollbar-track': {
                    backgroundColor: '#ffffff',
                },
                '::-webkit-scrollbar-thumb': {
                    backgroundColor: '#5f6368',
                    borderRadius: 4,
                },
            },
        },
        MuiButton: {
            styleOverrides: {
                root: {
                    borderRadius: 8,
                    padding: '0.625rem 1.5rem',
                },
            },
        },
        MuiIconButton: {
            styleOverrides: {
                root: {
                    borderRadius: 8,
                },
            },
        },
        MuiCard: {
            styleOverrides: {
                root: {
                    border: '1px solid #dadce0',
                    boxShadow: shadowSm,
                },
            },
        },
        MuiCardContent: {
            styleOverrides: {
                root: {
                    padding: '1.5rem',
                    '&:last-child': {
                        paddingBottom: '1.5rem',
                    },
                },
            },
        },
        MuiPaper: {
            styleOverrides: {
                root: {
                    border: '1px solid #dadce0',
                },
            },
        },
        MuiChip: {
            styleOverrides: {
                root: {
                    fontWeight: 500,
                },
            },
        },
        MuiOutlinedInput: {
            styleOverrides: {
                root: {
                    borderRadius: 8,
                },
            },
        },
        MuiSelect: {
            styleOverrides: {
                select: {
                    paddingTop: '0.625rem',
                    paddingBottom: '0.625rem',
                },
            },
        },
        MuiMenuItem: {
            styleOverrides: {
                root: {
                    fontSize: '0.875rem',
                },
            },
        },
        MuiSwitch: {
            styleOverrides: {
                root: {
                    padding: 8,
                },
            },
        },
    },
});
