import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
    Alert, Box, Button, Card, CardContent, Chip, CircularProgress, Dialog, DialogActions, DialogContent,
    DialogContentText, DialogTitle, IconButton, Typography,
} from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import EventNoteIcon from '@mui/icons-material/EventNote';
import DirectionsRunIcon from '@mui/icons-material/DirectionsRun';
import FitnessCenterIcon from '@mui/icons-material/FitnessCenter';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import API from '../services/api';
import { errorMessage } from '../services/errors';
import { useAppTheme } from '../context/ThemeContext';
import { GOAL_COLORS, GOAL_LABELS } from '../utils/plans';
import Blobs from '../components/Glass';
import { FONT, glassCard, sectionTitle } from '../theme/styles';
import PageHeader from '../components/PageHeader';

function PlanDetail() {
    const { theme } = useAppTheme();
    const navigate = useNavigate();
    const { slug } = useParams();
    const [plan, setPlan] = useState(null);
    const [error, setError] = useState('');
    const [switching, setSwitching] = useState(false);
    const [starting, setStarting] = useState(false);
    const [confirmDelete, setConfirmDelete] = useState(false);

    useEffect(() => {
        let ignore = false;
        API.get(`/plans/${slug}`)
            .then((res) => { if (!ignore) setPlan(res.data); })
            .catch((err) => { if (!ignore) setError(errorMessage(err, 'Could not load this plan')); });
        return () => { ignore = true; };
    }, [slug]);

    const start = async (replace) => {
        setError('');
        setStarting(true);
        try {
            await API.post(`/plans/${slug}/start`, null, { params: { replace } });
            navigate('/plans');
        } catch (err) {
            if (err.response?.status === 409 && !replace) {
                setSwitching(true);
            } else {
                setError(errorMessage(err, 'Could not start this plan'));
            }
            setStarting(false);
        }
    };

    const deletePlan = async () => {
        setError('');
        try {
            await API.delete(`/plans/custom/${slug}`);
            navigate('/plans');
        } catch (err) {
            setConfirmDelete(false);
            setError(errorMessage(err, 'Could not delete this plan'));
        }
    };

    const summary = plan?.plan;
    // Running plans define one session per week; strength plans repeat the same days every week.
    const weekly = plan?.sessions.some((s) => s.weekNumber != null);
    const sessions = weekly
        ? plan.sessions.filter((s) => s.dayNumber === 1)
        : plan?.sessions ?? [];

    return (
        <Box sx={{ minHeight: '100vh', background: theme.bgGradient, fontFamily: FONT, position: 'relative' }}>
            <Blobs />

            <Box sx={{ maxWidth: 820, mx: 'auto', py: 3, px: 2, position: 'relative', zIndex: 1 }}>
                <PageHeader>
                    <IconButton onClick={() => navigate('/plans')} sx={{ color: theme.mix(1), mr: 1 }} aria-label="Back to plans">
                        <ArrowBackIcon />
                    </IconButton>
                    <EventNoteIcon sx={{ color: '#66bb6a', mr: 1 }} />
                    <Typography variant="h6" sx={{ color: theme.mix(1), fontWeight: 700 }}>{summary?.name || 'Workout plan'}</Typography>
                </PageHeader>
                {error && <Alert severity="error" sx={{ mb: 3 }}>{error}</Alert>}
                {!plan && !error && <Box sx={{ textAlign: 'center', py: 8 }}><CircularProgress sx={{ color: '#e94560' }} /></Box>}

                {plan && (
                    <>
                        <Card sx={{ ...glassCard(theme), mb: 3, borderTop: `4px solid ${GOAL_COLORS[summary.goal] || '#e94560'}` }}>
                            <CardContent sx={{ p: 3 }}>
                                <Typography variant="h5" sx={{ color: theme.mix(1), fontWeight: 800 }}>{summary.name}</Typography>
                                <Typography sx={{ color: theme.mix(0.6), mt: 0.5 }}>{summary.summary}</Typography>
                                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.75, my: 2 }}>
                                    <Chip size="small" label={GOAL_LABELS[summary.goal] || summary.goal}
                                          sx={{ background: `${GOAL_COLORS[summary.goal] || '#e94560'}33`, color: GOAL_COLORS[summary.goal] || '#e94560', fontWeight: 600 }} />
                                    <Chip size="small" label={summary.level} sx={{ background: theme.mix(0.08), color: theme.mix(0.7) }} />
                                    <Chip size="small" label={`${summary.durationWeeks} weeks`} sx={{ background: theme.mix(0.08), color: theme.mix(0.7) }} />
                                    <Chip size="small" label={`${summary.daysPerWeek} sessions a week`} sx={{ background: theme.mix(0.08), color: theme.mix(0.7) }} />
                                    <Chip size="small" label={summary.equipment} sx={{ background: theme.mix(0.08), color: theme.mix(0.7) }} />
                                </Box>
                                {plan.description && (
                                    <Typography sx={{ color: theme.mix(0.7), fontSize: '0.92rem', lineHeight: 1.7 }}>{plan.description}</Typography>
                                )}
                                {summary.active ? (
                                    <Button onClick={() => navigate('/plans')} variant="contained" sx={{ mt: 2.5, borderRadius: 999, textTransform: 'none', fontWeight: 700, background: 'linear-gradient(90deg, #66bb6a, #4ecdc4)' }}>
                                        You're following this, open it
                                    </Button>
                                ) : (
                                    <Button onClick={() => start(false)} disabled={starting} variant="contained"
                                            sx={{ mt: 2.5, borderRadius: 999, px: 3, textTransform: 'none', fontWeight: 700, background: 'linear-gradient(90deg, #e94560, #0f3460)' }}>
                                        {starting ? <CircularProgress size={22} color="inherit" /> : 'Start this plan'}
                                    </Button>
                                )}
                                <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', mt: 1.5 }}>
                                    {summary.custom && summary.editable && (
                                        <Button size="small" startIcon={<EditIcon />} onClick={() => navigate(`/plans/${slug}/edit`)}
                                                sx={{ color: theme.mix(0.75), textTransform: 'none' }}>
                                            Edit
                                        </Button>
                                    )}
                                    <Button size="small" startIcon={<ContentCopyIcon />} onClick={() => navigate(`/plans/new?from=${slug}`)}
                                            sx={{ color: theme.mix(0.75), textTransform: 'none' }}>
                                        {summary.custom ? 'Make a copy' : 'Customize a copy ★'}
                                    </Button>
                                    {summary.custom && (
                                        <Button size="small" startIcon={<DeleteIcon />} onClick={() => setConfirmDelete(true)}
                                                sx={{ color: '#e94560', textTransform: 'none' }}>
                                            Delete
                                        </Button>
                                    )}
                                </Box>
                            </CardContent>
                        </Card>

                        <Typography sx={{ ...sectionTitle(theme), mb: 1.5, letterSpacing: 1 }}>
                            {weekly ? 'Week by week' : 'Your week'}
                        </Typography>

                        {sessions.map((session) => (
                            <Card key={session.id} sx={{ ...glassCard(theme), mb: 2 }}>
                                <CardContent>
                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
                                        {session.activity === 'RUN'
                                            ? <DirectionsRunIcon sx={{ color: '#45b7d1' }} />
                                            : <FitnessCenterIcon sx={{ color: '#e94560' }} />}
                                        <Typography sx={{ color: theme.mix(1), fontWeight: 700 }}>
                                            {weekly ? `Week ${session.weekNumber} · ${session.title}` : `Day ${session.dayNumber} · ${session.title}`}
                                        </Typography>
                                        <Chip size="small" label={`${session.targetMinutes} min`} sx={{ ml: 'auto', background: theme.mix(0.08), color: theme.mix(0.7) }} />
                                    </Box>
                                    {session.focus && !weekly && (
                                        <Typography sx={{ color: theme.mix(0.5), fontSize: '0.85rem', mb: 1 }}>{session.focus}</Typography>
                                    )}
                                    {session.instructions && (
                                        <Typography sx={{ color: theme.mix(0.65), fontSize: '0.88rem', mb: 1 }}>{session.instructions}</Typography>
                                    )}
                                    {session.exercises.map((ex) => (
                                        <Box key={ex.exerciseId} sx={{
                                            display: 'flex', alignItems: 'center', gap: 1.5, py: 0.75,
                                            borderTop: `1px solid ${theme.mix(0.07)}`,
                                        }}>
                                            {ex.thumbnailUrl && (
                                                <Box component="img" src={ex.thumbnailUrl} alt="" loading="lazy"
                                                     sx={{ width: 42, height: 42, borderRadius: 1, objectFit: 'cover', background: '#fff' }} />
                                            )}
                                            <Typography sx={{ color: theme.mix(0.9), fontSize: '0.9rem', flex: 1 }}>{ex.name}</Typography>
                                            <Typography sx={{ color: theme.mix(0.6), fontSize: '0.85rem', whiteSpace: 'nowrap' }}>
                                                {ex.sets} × {ex.reps}
                                            </Typography>
                                            {ex.restSec > 0 && (
                                                <Typography sx={{ color: theme.mix(0.4), fontSize: '0.75rem', whiteSpace: 'nowrap', display: { xs: 'none', sm: 'block' } }}>
                                                    rest {ex.restSec}s
                                                </Typography>
                                            )}
                                        </Box>
                                    ))}
                                </CardContent>
                            </Card>
                        ))}
                    </>
                )}
            </Box>

            <Dialog open={confirmDelete} onClose={() => setConfirmDelete(false)}
                    slotProps={{ paper: { sx: { background: theme.menuBg, color: theme.mix(1), borderRadius: 3 } } }}>
                <DialogTitle sx={{ fontWeight: 700 }}>Delete this plan?</DialogTitle>
                <DialogContent>
                    <DialogContentText sx={{ color: theme.mix(0.7) }}>
                        The plan and your progress on it are removed. Workouts you logged for it stay in your history.
                    </DialogContentText>
                </DialogContent>
                <DialogActions sx={{ px: 3, pb: 2 }}>
                    <Button onClick={() => setConfirmDelete(false)} sx={{ color: theme.mix(0.6), textTransform: 'none' }}>Keep it</Button>
                    <Button onClick={deletePlan} variant="contained" color="error" sx={{ borderRadius: 999, textTransform: 'none', fontWeight: 700 }}>
                        Delete plan
                    </Button>
                </DialogActions>
            </Dialog>

            <Dialog open={switching} onClose={() => setSwitching(false)}
                    slotProps={{ paper: { sx: { background: theme.menuBg, color: theme.mix(1), borderRadius: 3 } } }}>
                <DialogTitle sx={{ fontWeight: 700 }}>Switch plans?</DialogTitle>
                <DialogContent>
                    <DialogContentText sx={{ color: theme.mix(0.7) }}>
                        You're already following another plan. Starting this one stops that plan and begins this one from week 1.
                    </DialogContentText>
                </DialogContent>
                <DialogActions sx={{ px: 3, pb: 2 }}>
                    <Button onClick={() => setSwitching(false)} sx={{ color: theme.mix(0.6), textTransform: 'none' }}>Keep my plan</Button>
                    <Button onClick={() => { setSwitching(false); start(true); }} variant="contained"
                            sx={{ borderRadius: 999, textTransform: 'none', fontWeight: 700, background: 'linear-gradient(90deg, #e94560, #0f3460)' }}>
                        Switch to this plan
                    </Button>
                </DialogActions>
            </Dialog>
        </Box>
    );
}

export default PlanDetail;
