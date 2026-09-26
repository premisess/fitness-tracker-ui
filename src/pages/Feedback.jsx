import { useEffect, useState } from 'react';
import { Alert, Box, Button, Card, CardContent, Chip, CircularProgress, Rating, TextField, Typography } from '@mui/material';
import RateReviewIcon from '@mui/icons-material/RateReview';
import StarIcon from '@mui/icons-material/Star';
import ReplyIcon from '@mui/icons-material/Reply';
import API from '../services/api';
import { errorMessage } from '../services/errors';
import { useAppTheme } from '../context/ThemeContext';
import Blobs from '../components/Glass';
import PageHeader from '../components/PageHeader';
import { FONT, glassCard, fieldStyle, sectionTitle } from '../theme/styles';
import { FEEDBACK_KINDS, FEEDBACK_STATUSES } from '../utils/feedback';

const when = (iso) => new Date(iso).toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' });

function Feedback() {
    const { theme } = useAppTheme();
    const [kind, setKind] = useState('FEEDBACK');
    const [rating, setRating] = useState(null);
    const [message, setMessage] = useState('');
    const [sending, setSending] = useState(false);
    const [notice, setNotice] = useState(null); // { severity, text }
    const [history, setHistory] = useState(null);
    const [reloadKey, setReloadKey] = useState(0);

    useEffect(() => {
        let ignore = false;
        API.get('/feedback').then((res) => { if (!ignore) setHistory(res.data); }).catch(() => { if (!ignore) setHistory([]); });
        return () => { ignore = true; };
    }, [reloadKey]);

    const submit = async (e) => {
        e.preventDefault();
        setSending(true);
        setNotice(null);
        try {
            await API.post('/feedback', { kind, rating: kind === 'PROBLEM' ? null : rating, message });
            setNotice({ severity: 'success', text: 'Thanks. We read every message and will reply here.' });
            setMessage('');
            setRating(null);
            setReloadKey((k) => k + 1);
        } catch (err) {
            setNotice({ severity: 'error', text: errorMessage(err, 'Could not send it. Please try again.') });
        } finally {
            setSending(false);
        }
    };

    const current = FEEDBACK_KINDS[kind];

    return (
        <Box sx={{ minHeight: '100vh', background: theme.bgGradient, fontFamily: FONT, position: 'relative' }}>
            <Blobs />
            <Box sx={{ maxWidth: 760, mx: 'auto', py: 3, px: 2, position: 'relative', zIndex: 1 }}>
                <PageHeader>
                    <RateReviewIcon sx={{ color: '#ffd166', mr: 1 }} />
                    <Typography variant="h6">Feedback</Typography>
                </PageHeader>

                <Card sx={{ ...glassCard(theme), mb: 2.5 }}>
                    <CardContent component="form" onSubmit={submit} sx={{ p: 2.5, '&:last-child': { pb: 2.5 } }}>
                        <Typography sx={{ ...sectionTitle(theme), mb: 0.5 }}>Help us make FitTracker better</Typography>
                        <Typography sx={{ color: theme.mix(0.55), fontSize: '0.88rem', mb: 2, fontFamily: FONT }}>
                            Share what you think, recommend a feature, or report a problem.
                        </Typography>

                        <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 1, mb: 2 }}>
                            {Object.entries(FEEDBACK_KINDS).map(([key, k]) => {
                                const active = key === kind;
                                return (
                                    <Box key={key} component="button" type="button" onClick={() => setKind(key)} aria-pressed={active} sx={{
                                        display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 0.5, py: 1.25, px: 1,
                                        borderRadius: 2.5, cursor: 'pointer', font: 'inherit',
                                        border: `1px solid ${active ? k.color : theme.mix(0.12)}`,
                                        background: active ? `${k.color}1f` : theme.mix(0.03),
                                        color: active ? theme.mix(1) : theme.mix(0.7),
                                        transition: 'background 0.15s, border-color 0.15s',
                                        '&:hover': { borderColor: k.color },
                                    }}>
                                        <k.Icon sx={{ color: k.color }} />
                                        <Typography sx={{ fontSize: '0.82rem', fontWeight: active ? 700 : 600, fontFamily: FONT }}>{k.label}</Typography>
                                    </Box>
                                );
                            })}
                        </Box>

                        {kind !== 'PROBLEM' && (
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 1.5 }}>
                                <Typography sx={{ color: theme.mix(0.6), fontSize: '0.85rem', fontFamily: FONT }}>Your rating</Typography>
                                <Rating value={rating} onChange={(_, v) => setRating(v)}
                                        icon={<StarIcon fontSize="inherit" sx={{ color: '#ffd166' }} />}
                                        emptyIcon={<StarIcon fontSize="inherit" sx={{ color: theme.mix(0.2) }} />} />
                                <Typography sx={{ color: theme.mix(0.4), fontSize: '0.78rem', fontFamily: FONT }}>optional</Typography>
                            </Box>
                        )}

                        <TextField fullWidth multiline minRows={4} required value={message} placeholder={current.hint}
                                   onChange={(e) => setMessage(e.target.value)} inputProps={{ maxLength: 2000 }}
                                   sx={{ ...fieldStyle(theme), mb: 1.5 }} />
                        {notice && <Alert severity={notice.severity} sx={{ mb: 1.5 }} onClose={() => setNotice(null)}>{notice.text}</Alert>}
                        <Button type="submit" variant="contained" disabled={sending || !message.trim()}
                                sx={{ borderRadius: 999, px: 4, textTransform: 'none', fontWeight: 700, fontFamily: FONT, background: '#e94560', boxShadow: 'none', '&:hover': { background: '#d63d56', boxShadow: 'none' } }}>
                            {sending ? <CircularProgress size={20} color="inherit" /> : `Send ${current.label.toLowerCase()}`}
                        </Button>
                    </CardContent>
                </Card>

                <Typography sx={{ ...sectionTitle(theme), mb: 1.5 }}>What you've sent</Typography>
                {history === null && <Box sx={{ textAlign: 'center', py: 4 }}><CircularProgress size={24} sx={{ color: '#e94560' }} /></Box>}
                {history?.length === 0 && (
                    <Typography sx={{ color: theme.mix(0.5), fontSize: '0.9rem', fontFamily: FONT }}>
                        Nothing yet. Your messages and our replies will show here.
                    </Typography>
                )}
                {history?.map((f) => {
                    const k = FEEDBACK_KINDS[f.kind];
                    const s = FEEDBACK_STATUSES[f.status];
                    return (
                        <Card key={f.id} sx={{ ...glassCard(theme), mb: 1.5 }}>
                            <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                                    <k.Icon sx={{ color: k.color, fontSize: 20 }} />
                                    <Typography sx={{ color: theme.mix(0.95), fontWeight: 700, fontSize: '0.9rem', fontFamily: FONT }}>{k.label}</Typography>
                                    {f.rating && <Rating value={f.rating} readOnly size="small"
                                                         icon={<StarIcon fontSize="inherit" sx={{ color: '#ffd166' }} />}
                                                         emptyIcon={<StarIcon fontSize="inherit" sx={{ color: theme.mix(0.15) }} />} />}
                                    <Box sx={{ flex: 1 }} />
                                    <Typography sx={{ color: theme.mix(0.4), fontSize: '0.75rem', fontFamily: FONT }}>{when(f.createdAt)}</Typography>
                                    <Chip label={s.label} size="small" sx={{ background: `${s.color}26`, color: s.color, fontWeight: 700, fontSize: '0.7rem' }} />
                                </Box>
                                <Typography sx={{ color: theme.mix(0.8), fontSize: '0.9rem', whiteSpace: 'pre-wrap', fontFamily: FONT }}>{f.message}</Typography>
                                {f.reply && (
                                    <Box sx={{ mt: 1.5, p: 1.5, borderRadius: 2, background: 'rgba(78,205,196,0.1)', border: '1px solid rgba(78,205,196,0.3)' }}>
                                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75, mb: 0.5, color: '#4ecdc4' }}>
                                            <ReplyIcon sx={{ fontSize: 18 }} />
                                            <Typography sx={{ fontWeight: 700, fontSize: '0.8rem', fontFamily: FONT }}>FitTracker team</Typography>
                                        </Box>
                                        <Typography sx={{ color: theme.mix(0.85), fontSize: '0.88rem', whiteSpace: 'pre-wrap', fontFamily: FONT }}>{f.reply}</Typography>
                                    </Box>
                                )}
                            </CardContent>
                        </Card>
                    );
                })}
            </Box>
        </Box>
    );
}

export default Feedback;
