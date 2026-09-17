import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Box, Button, Dialog, Typography } from '@mui/material';
import WorkspacePremiumIcon from '@mui/icons-material/WorkspacePremium';
import { UPGRADE_EVENT } from '../services/api';
import { useAppTheme } from '../context/ThemeContext';

/** Shown whenever the server answers 402: the user tried an Ultimate feature on the free plan. */
function UpgradeDialog() {
    const { theme } = useAppTheme();
    const navigate = useNavigate();
    const [message, setMessage] = useState(null);

    useEffect(() => {
        const show = (event) => setMessage(event.detail || 'This feature is part of FitTracker Ultimate.');
        window.addEventListener(UPGRADE_EVENT, show);
        return () => window.removeEventListener(UPGRADE_EVENT, show);
    }, []);

    return (
        <Dialog open={!!message} onClose={() => setMessage(null)} maxWidth="xs" fullWidth
                slotProps={{ paper: { sx: { background: theme.menuBg, color: theme.mix(1), borderRadius: 4, textAlign: 'center' } } }}>
            <Box sx={{ p: 4, fontFamily: "'Poppins', sans-serif" }}>
                <WorkspacePremiumIcon sx={{ fontSize: 64, color: '#ffd166' }} />
                <Typography variant="h6" sx={{ fontWeight: 800, mt: 1 }}>Unlock with Ultimate</Typography>
                <Typography sx={{ color: theme.mix(0.65), mt: 1 }}>{message}</Typography>
                <Typography sx={{ color: theme.mix(0.45), fontSize: '0.85rem', mt: 1 }}>
                    Pay monthly or yearly with M-Pesa, Mixx by Yas, Airtel Money or HaloPesa.
                </Typography>
                <Box sx={{ display: 'flex', gap: 1, justifyContent: 'center', mt: 3 }}>
                    <Button onClick={() => setMessage(null)} sx={{ color: theme.mix(0.6), textTransform: 'none' }}>Not now</Button>
                    <Button variant="contained" onClick={() => { setMessage(null); navigate('/upgrade'); }}
                            sx={{ borderRadius: 999, px: 3, textTransform: 'none', fontWeight: 800, background: 'linear-gradient(90deg, #ffd166, #e94560)', color: '#1a1a2e' }}>
                        See Ultimate
                    </Button>
                </Box>
            </Box>
        </Dialog>
    );
}

export default UpgradeDialog;
