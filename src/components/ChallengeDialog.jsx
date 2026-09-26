import { useState } from 'react';
import { Alert, Box, Button, CircularProgress, Dialog, TextField, Typography } from '@mui/material';
import API, { FRIENDS_EVENT } from '../services/api';
import { errorMessage } from '../services/errors';
import { useAppTheme } from '../context/ThemeContext';
import { FONT, fieldStyle } from '../theme/styles';
import { ALERT_KINDS } from '../utils/alerts';

/** Sends a friend a challenge or an invitation to train together. They see it highlighted in their messages. */
function ChallengeDialog({ person, kind, onClose, onSent }) {
    const { theme } = useAppTheme();
    const config = ALERT_KINDS[kind];
    const [body, setBody] = useState(config.template);
    const [sending, setSending] = useState(false);
    const [error, setError] = useState('');

    const send = async () => {
        setSending(true);
        setError('');
        try {
            const res = await API.post(`/friends/${person.id}/messages`, { kind, body });
            window.dispatchEvent(new Event(FRIENDS_EVENT));
            onSent?.(res.data);
            onClose();
        } catch (err) {
            setError(errorMessage(err, 'Could not send it. Please try again.'));
            setSending(false);
        }
    };

    return (
        <Dialog open onClose={onClose} maxWidth="xs" fullWidth
                slotProps={{ paper: { sx: { borderRadius: 4, background: theme.menuBg, color: theme.mix(1), border: `1px solid ${theme.mix(0.12)}` } } }}>
            <Box sx={{ p: 3, fontFamily: FONT, textAlign: 'left' }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 2 }}>
                    <Box sx={{ width: 40, height: 40, borderRadius: 2.5, display: 'flex', alignItems: 'center', justifyContent: 'center', background: `${config.color}22`, color: config.color }}>
                        <config.Icon />
                    </Box>
                    <Box>
                        <Typography sx={{ fontWeight: 800, fontFamily: FONT }}>{config.title}</Typography>
                        <Typography sx={{ color: theme.mix(0.55), fontSize: '0.85rem', fontFamily: FONT }}>to {person.name}</Typography>
                    </Box>
                </Box>
                {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
                <TextField value={body} onChange={(e) => setBody(e.target.value)} multiline minRows={3} fullWidth
                           inputProps={{ maxLength: 1000 }} sx={{ ...fieldStyle(theme), mb: 2 }} />
                <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 1 }}>
                    <Button onClick={onClose} sx={{ color: theme.mix(0.6), textTransform: 'none', fontFamily: FONT }}>Cancel</Button>
                    <Button variant="contained" onClick={send} disabled={sending || !body.trim()}
                            sx={{ borderRadius: 999, px: 3, textTransform: 'none', fontWeight: 700, fontFamily: FONT, background: '#e94560', boxShadow: 'none', '&:hover': { background: '#d63d56', boxShadow: 'none' } }}>
                        {sending ? <CircularProgress size={20} color="inherit" /> : 'Send'}
                    </Button>
                </Box>
            </Box>
        </Dialog>
    );
}

export default ChallengeDialog;
