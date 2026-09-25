export const FONT = "'Poppins', sans-serif";

// The standard translucent glass card: keep cards compact, never stretch them
// into big boxes. Use with <Card sx={glassCard(theme)}>.
export const glassCard = (theme) => ({
    background: theme.mix(0.04),
    backdropFilter: 'blur(14px)',
    WebkitBackdropFilter: 'blur(14px)',
    border: `1px solid ${theme.mix(0.1)}`,
    borderRadius: 3,
    boxShadow: '0 8px 24px rgba(0,0,0,0.15)',
});

// Page top bar: stays pinned while the page scrolls underneath the frosted glass, like the dashboard's.
// Use with <AppBar position="sticky" sx={stickyHeader(theme)}>.
export const stickyHeader = (theme) => ({
    top: 0,
    zIndex: 10,
    background: theme.mix(0.04),
    backdropFilter: 'blur(14px)',
    WebkitBackdropFilter: 'blur(14px)',
    boxShadow: 'none',
    borderBottom: `1px solid ${theme.mix(0.08)}`,
});

// Rounded, translucent form fields matching the auth screens.
export const fieldStyle = (theme) => ({
    '& .MuiOutlinedInput-root': {
        borderRadius: 2.5,
        background: theme.mix(0.03),
        '& fieldset': { borderColor: theme.mix(0.18) },
        '&:hover fieldset': { borderColor: theme.mix(0.35) },
        '&.Mui-focused fieldset': { borderColor: '#e94560' },
    },
    '& .MuiInputLabel-root': { color: theme.mix(0.5) },
    '& .MuiInputLabel-root.Mui-focused': { color: '#e94560' },
    '& .MuiInputBase-input': { color: theme.mix(1) },
    '& .MuiSelect-icon': { color: theme.mix(0.5) },
    '& .MuiIconButton-root': { color: theme.mix(0.5) },
    mb: 2,
});

// Medium, never oversized section headings.
export const sectionTitle = (theme) => ({
    color: theme.mix(1),
    fontWeight: 700,
    fontFamily: FONT,
    fontSize: '1.05rem',
});