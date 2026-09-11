import { createContext, useContext, useState, useEffect, useMemo } from 'react';

const ThemeContext = createContext(null);

const DARK_RGB = '255,255,255';
const LIGHT_RGB = '15,23,42';

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
            menuBg: mode === 'dark' ? '#16213e' : '#ffffff',
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

    return (
        <ThemeContext.Provider value={{ mode, theme, toggleTheme }}>
            {children}
        </ThemeContext.Provider>
    );
}

export function useAppTheme() {
    return useContext(ThemeContext);
}
