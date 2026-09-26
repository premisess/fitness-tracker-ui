import { useState } from 'react';
import { Box, Button, Dialog, IconButton, Tooltip, Typography, useMediaQuery } from '@mui/material';
import WorkspacePremiumIcon from '@mui/icons-material/WorkspacePremium';
import { useAppTheme } from '../context/ThemeContext';
import { FONT } from '../theme/styles';

/** "Go Ultimate" in the top bar. There is no paid tier yet, so it explains that everything is free. */
function UltimateButton() {
    const { theme } = useAppTheme();
    const compact = useMediaQuery('(max-width:600px)');
    const [open, setOpen] = useState(false);

    const gold = { color: '#1a1a2e', background: 'linear-gradient(90deg, #ffd166, #e94560)' };

    return (
        <>
            {compact ? (
                <Tooltip title="Go Ultimate">
                    <IconButton onClick={() => setOpen(true)} aria-label="Go Ultimate" sx={{ ...gold, width: 36, height: 36 }}>
                        <WorkspacePremiumIcon fontSize="small" />
                    </IconButton>
                </Tooltip>
            ) : (
                <Button size="small" startIcon={<WorkspacePremiumIcon />} onClick={() => setOpen(true)}
                        sx={{
                            ...gold, borderRadius: 999, px: 1.75, textTransform: 'none', fontWeight: 700, fontFamily: FONT,
                            '&:hover': { background: '#ffd166' },
                        }}>
                    Go Ultimate
                </Button>
            )}

            <Dialog open={open} onClose={() => setOpen(false)} maxWidth="xs" fullWidth
                    slotProps={{
                        paper: {
                            sx: {
                                borderRadius: 4, textAlign: 'center', color: theme.mix(1),
                                background: theme.menuBg, border: `1px solid ${theme.mix(0.12)}`,
                            },
                        },
                    }}>
                <Box sx={{ p: 4, fontFamily: FONT }}>
                    <WorkspacePremiumIcon sx={{ fontSize: 56, color: '#ffd166' }} />
                    <Typography sx={{ fontWeight: 800, fontSize: '1.2rem', mt: 1, fontFamily: FONT }}>
                        No Ultimate features for now
                    </Typography>
                    <Typography sx={{ color: theme.mix(0.65), mt: 1, fontFamily: FONT }}>
                        Every feature in FitTracker is free for everyone. Enjoy it all.
                    </Typography>
                    <Button variant="contained" onClick={() => setOpen(false)}
                            sx={{ mt: 3, borderRadius: 999, px: 4, textTransform: 'none', fontWeight: 700, background: '#e94560', '&:hover': { background: '#d63d56' } }}>
                        Got it
                    </Button>
                </Box>
            </Dialog>
        </>
    );
}

export default UltimateButton;
