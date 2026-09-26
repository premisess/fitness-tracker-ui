import { createContext, useContext, useState, useEffect, useMemo } from 'react';
import { createTheme, ThemeProvider as MuiThemeProvider } from '@mui/material/styles';

const ThemeContext = createContext(null);

const DARK_RGB = '255,255,255';
const LIGHT_RGB = '15,23,42';

// Banner colours per severity, from the app's own palette.
const SEVERITY_COLORS = { success: '#4ecdc4', info: '#45b7d1', warning: '#ffa726', error: '#e94560' };
const POPUP_BLUR = 'blur(20px) saturate(140%)';

export function ThemeProvider({ children }) {
    const [mode, setMode] = useState(() => localStorage.getItem('themeMode') || 'dark');

    useEffect(() => {
        localStorage.setItem('themeMode', mode);
    }, [mode]);

    const toggleTheme = () => setMode((m) => (m === 'dark' ? 'light' : 'dark'));

    const theme = useMemo(() => {
        const base = mode === 'dark' ? DARK_RGB : LIGHT_RGB;
        return {
            mode,
            // Tints the surface color (white in dark mode, dark navy in light mode)
            // at a given alpha. Low alphas (0.03-0.2) build card/border surfaces,
            // higher alphas (0.3-1) build text colors.
            mix: (alpha) => `rgba(${base},${alpha})`,
            // Flat colors, not a gradient: a gradient's color stops are positioned
            // by percentage of the painting element's own height, so the same
            // gradient painted on a page's box and again on <body> (a different
            // height) lands its colors at different pixel offsets and shows a
            // visible seam. A flat color is identical everywhere it's painted.
            bgGradient: mode === 'dark' ? '#152238' : '#ffffff',
            // Popups, menus and dialogs: see-through, with a stronger blur (set below) than cards
            // so their text stays readable over whatever is behind them.
            menuBg: mode === 'dark' ? 'rgba(22,33,62,0.78)' : 'rgba(255,255,255,0.8)',
        };
    }, [mode]);

    // Pages set this background on their own root Box too, but that box only ever
    // grows to fit its content — on a page taller than one screen the color could
    // stop partway and the browser's own (unstyled) background showed through
    // below it. Painting the same background on <body> guarantees full-page,
    // full-scroll coverage no matter how tall any given page is.
    useEffect(() => {
        document.body.style.background = theme.bgGradient;
        document.body.style.minHeight = '100vh';
    }, [mode, theme.bgGradient]);

    // Glass for MUI's floating surfaces and banners everywhere, without changing its colour palette.
    const muiTheme = useMemo(() => {
        const popupPaper = {
            backgroundColor: theme.menuBg,
            backgroundImage: 'none',
            backdropFilter: POPUP_BLUR,
            WebkitBackdropFilter: POPUP_BLUR,
            border: `1px solid ${theme.mix(0.12)}`,
            boxShadow: '0 16px 40px rgba(0,0,0,0.3)',
        };
        return createTheme({
            components: {
                MuiPopover: { styleOverrides: { paper: popupPaper } },
                MuiMenu: { styleOverrides: { paper: popupPaper } },
                MuiDialog: { styleOverrides: { paper: popupPaper } },
                MuiDrawer: { styleOverrides: { paper: popupPaper } },
                MuiAutocomplete: { styleOverrides: { paper: popupPaper } },
                MuiAlert: {
                    styleOverrides: {
                        root: ({ ownerState }) => {
                            const color = SEVERITY_COLORS[ownerState.severity] || SEVERITY_COLORS.info;
                            return {
                                backgroundColor: `${color}1f`,
                                backgroundImage: 'none',
                                color: theme.mix(0.9),
                                border: `1px solid ${color}59`,
                                borderRadius: 12,
                                backdropFilter: 'blur(14px)',
                                WebkitBackdropFilter: 'blur(14px)',
                                '& .MuiAlert-icon': { color },
                                '& .MuiAlert-action .MuiButton-root': { color },
                            };
                        },
                    },
                },
            },
        });
    }, [theme]);

    return (
        <ThemeContext.Provider value={{ mode, theme, toggleTheme }}>
            <MuiThemeProvider theme={muiTheme}>
                {children}
            </MuiThemeProvider>
        </ThemeContext.Provider>
    );
}

export function useAppTheme() {
    return useContext(ThemeContext);
}
