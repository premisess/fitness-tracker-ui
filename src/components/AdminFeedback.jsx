import { useEffect, useState } from 'react';
import { Alert, Box, Button, Card, CardContent, Chip, CircularProgress, MenuItem, Rating, TextField, Typography } from '@mui/material';
import StarIcon from '@mui/icons-material/Star';
import RateReviewIcon from '@mui/icons-material/RateReview';
import API from '../services/api';
import { errorMessage } from '../services/errors';
import { useAppTheme } from '../context/ThemeContext';
import { FONT, glassCard, fieldStyle } from '../theme/styles';
import { FEEDBACK_KINDS, FEEDBACK_STATUSES } from '../utils/feedback';

const when = (iso) => new Date(iso).toLocaleString(undefined, { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' });

function FeedbackItem({ item, onSaved }) {
    const { theme } = useAppTheme();
    const f = item.feedback;
    const k = FEEDBACK_KINDS[f.kind];
    const [status, setStatus] = useState(f.status === 'NEW' ? 'REVIEWED' : f.status);
    const [reply, setReply] = useState(f.reply || '');
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState('');

    const save = async () => {
        setSaving(true);
        setError('');
        try {
            await API.patch(`/admin/feedback/${f.id}`, { status, reply });
            onSaved();
        } catch (err) {
            setError(errorMessage(err, 'Could not save'));
        } finally {
            setSaving(false);
        }
    };

    const s = FEEDBACK_STATUSES[f.status];
    return (
        <Card sx={{ ...glassCard(theme), mb: 1.5, borderColor: f.status === 'NEW' ? `${k.color}88` : undefined }}>
            <CardContent sx={{ p: 2, '&:last-child': { pb: 2 }, textAlign: 'left' }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap', mb: 1 }}>
                    <k.Icon sx={{ color: k.color, fontSize: 20 }} />
                    <Typography sx={{ color: theme.mix(1), fontWeight: 700, fontSize: '0.9rem', fontFamily: FONT }}>{k.label}</Typography>
                    {f.rating && <Rating value={f.rating} readOnly size="small"
                                         icon={<StarIcon fontSize="inherit" sx={{ color: '#ffd166' }} />}
                                         emptyIcon={<StarIcon fontSize="inherit" sx={{ color: theme.mix(0.15) }} />} />}
                    <Typography sx={{ color: theme.mix(0.55), fontSize: '0.8rem', fontFamily: FONT }}>
                        from {item.userName} ({item.userEmail}) · {when(f.createdAt)}
                    </Typography>
                    <Box sx={{ flex: 1 }} />
                    <Chip label={f.status === 'NEW' ? 'New' : s.label} size="small" sx={{ background: `${s.color}26`, color: s.color, fontWeight: 700, fontSize: '0.7rem' }} />
                </Box>
                <Typography sx={{ color: theme.mix(0.85), fontSize: '0.9rem', whiteSpace: 'pre-wrap', mb: 1.5, fontFamily: FONT }}>{f.message}</Typography>
                {error && <Alert severity="error" sx={{ mb: 1.5 }}>{error}</Alert>}
                <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '160px 1fr auto' }, gap: 1, alignItems: 'start' }}>
                    <TextField select size="small" value={status} onChange={(e) => setStatus(e.target.value)} sx={{ ...fieldStyle(theme), mb: 0 }}>
                        {Object.entries(FEEDBACK_STATUSES).filter(([key]) => key !== 'NEW').map(([key, v]) => (
                            <MenuItem key={key} value={key}>{v.label}</MenuItem>
                        ))}
                    </TextField>
                    <TextField size="small" multiline maxRows={4} placeholder="Reply to them (optional)" value={reply}
                               onChange={(e) => setReply(e.target.value)} inputProps={{ maxLength: 1000 }} sx={{ ...fieldStyle(theme), mb: 0 }} />
                    <Button variant="contained" onClick={save} disabled={saving}
                            sx={{ borderRadius: 999, px: 3, py: 0.9, textTransform: 'none', fontWeight: 700, fontFamily: FONT, background: '#4ecdc4', color: '#1a1a2e', boxShadow: 'none', '&:hover': { background: '#3dbdb4', boxShadow: 'none' } }}>
                        {saving ? <CircularProgress size={18} color="inherit" /> : 'Save'}
                    </Button>
                </Box>
            </CardContent>
        </Card>
    );
}

/** Admin inbox for feedback, recommendations and problem reports. */
function AdminFeedback() {
    const { theme } = useAppTheme();
    const [data, setData] = useState(null);
    const [error, setError] = useState('');
    const [kindFilter, setKindFilter] = useState('ALL');
    const [statusFilter, setStatusFilter] = useState('OPEN');
    const [reloadKey, setReloadKey] = useState(0);

    useEffect(() => {
        let ignore = false;
        API.get('/admin/feedback')
            .then((res) => { if (!ignore) setData(res.data); })
            .catch((err) => { if (!ignore) setError(errorMessage(err, 'Could not load feedback')); });
        return () => { ignore = true; };
    }, [reloadKey]);

    const items = (data?.items || []).filter((i) => (kindFilter === 'ALL' || i.feedback.kind === kindFilter)
        && (statusFilter === 'ALL' || (statusFilter === 'OPEN' ? i.feedback.status !== 'DONE' : i.feedback.status === statusFilter)));

    const pill = (active) => ({
        cursor: 'pointer', fontWeight: 600, fontFamily: FONT,
        background: active ? '#e94560' : theme.mix(0.06), color: active ? '#fff' : theme.mix(0.75),
        border: `1px solid ${active ? '#e94560' : theme.mix(0.12)}`,
    });

    return (
        <Box sx={{ mb: 4, textAlign: 'left' }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1.5 }}>
                <RateReviewIcon sx={{ color: '#ffd166' }} />
                <Typography variant="h6" sx={{ color: theme.mix(1), fontWeight: 700, fontFamily: FONT }}>Feedback</Typography>
                {data?.newCount > 0 && (
                    <Chip label={`${data.newCount} new`} size="small" sx={{ background: '#e94560', color: '#fff', fontWeight: 700 }} />
                )}
            </Box>
            <Box sx={{ display: 'flex', gap: 0.75, flexWrap: 'wrap', mb: 1 }}>
                {[['ALL', 'All types'], ...Object.entries(FEEDBACK_KINDS).map(([key, k]) => [key, k.label])].map(([key, label]) => (
                    <Chip key={key} label={label} size="small" onClick={() => setKindFilter(key)} sx={pill(kindFilter === key)} />
                ))}
            </Box>
            <Box sx={{ display: 'flex', gap: 0.75, flexWrap: 'wrap', mb: 2 }}>
                {[['OPEN', 'Open'], ['NEW', 'New'], ['PLANNED', 'Planned'], ['DONE', 'Done'], ['ALL', 'Everything']].map(([key, label]) => (
                    <Chip key={key} label={label} size="small" onClick={() => setStatusFilter(key)} sx={pill(statusFilter === key)} />
                ))}
            </Box>
            {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
            {!data && !error && <Box sx={{ textAlign: 'center', py: 3 }}><CircularProgress size={24} sx={{ color: '#e94560' }} /></Box>}
            {data && items.length === 0 && (
                <Typography sx={{ color: theme.mix(0.5), fontSize: '0.9rem', fontFamily: FONT }}>Nothing here.</Typography>
            )}
            {items.map((item) => (
                <FeedbackItem key={`${item.feedback.id}-${item.feedback.updatedAt}`} item={item} onSaved={() => setReloadKey((k) => k + 1)} />
            ))}
        </Box>
    );
}

export default AdminFeedback;
