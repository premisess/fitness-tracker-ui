import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    Alert, AppBar, Box, Button, Card, CardContent, Chip, CircularProgress, Dialog, DialogActions, DialogContent,
    DialogContentText, DialogTitle, IconButton, LinearProgress, Toolbar, Typography,
} from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import EventNoteIcon from '@mui/icons-material/EventNote';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import DirectionsRunIcon from '@mui/icons-material/DirectionsRun';
import FitnessCenterIcon from '@mui/icons-material/FitnessCenter';
import API from '../services/api';
import { errorMessage } from '../services/errors';
import { useAppTheme } from '../context/ThemeContext';
import { GOAL_COLORS, GOAL_LABELS, sessionPath } from '../utils/plans';

function Plans() {
    const { theme } = useAppTheme();
    const navigate = useNavigate();
    const [plans, setPlans] = useState(null);
    const [active, setActive] = useState(null);
    const [error, setError] = useState('');
    const [message, setMessage] = useState('');
    const [confirm, setConfirm] = useState(null); // 'skip' | 'quit'
    const [busy, setBusy] = useState(false);
    const [reloadKey, setReloadKey] = useState(0);

    useEffect(() => {
        let ignore = false;
        Promise.all([API.get('/plans'), API.get('/plans/active')])
            .then(([plansRes, activeRes]) => {
                if (ignore) return;
                setPlans(plansRes.data);
                setActive(activeRes.status === 200 ? activeRes.data : null);
            })
            .catch((err) => { if (!ignore) setError(errorMessage(err, 'Could not load workout plans')); });
        return () => { ignore = true; };
    }, [reloadKey]);

    const skipSession = async () => {
        setBusy(true);
        setError('');
        try {
            const res = await API.post('/plans/active/sessions', { skip: true });
            setMessage(res.data.status === 'COMPLETED' ? 'That was the last session — plan complete!' : 'Session skipped.');
            setConfirm(null);
            setReloadKey((k) => k + 1);
        } catch (err) {
            setError(errorMessage(err, 'Could not skip this session'));
        } finally {
            setBusy(false);
        }
    };

    const quitPlan = async () => {
        setBusy(true);
        setError('');
        try {
            await API.delete('/plans/active');
            setMessage('You stopped following that plan.');
            setConfirm(null);
            setReloadKey((k) => k + 1);
        } catch (err) {
            setError(errorMessage(err, 'Could not stop this plan'));
        } finally {
            setBusy(false);
        }
    };

    const cardStyle = { background: theme.mix(0.05), border: `1px solid ${theme.mix(0.1)}`, borderRadius: 3 };
    const next = active?.nextSession;

    return (
        <Box sx={{ minHeight: '100vh', background: theme.bgGradient, fontFamily: "'Poppins', sans-serif" }}>
            <AppBar position="static" sx={{ background: theme.mix(0.05), backdropFilter: 'blur(10px)', boxShadow: 'none', borderBottom: `1px solid ${theme.mix(0.1)}` }}>
                <Toolbar>
                    <IconButton onClick={() => navigate('/dashboard')} sx={{ color: theme.mix(1), mr: 1 }} aria-label="Back to dashboard">
                        <ArrowBackIcon />
                    </IconButton>
                    <EventNoteIcon sx={{ color: '#66bb6a', mr: 1 }} />
                    <Typography variant="h6" sx={{ color: theme.mix(1), fontWeight: 700 }}>Workout Plans</Typography>
                </Toolbar>
            </AppBar>

            <Box sx={{ maxWidth: 900, mx: 'auto', py: 4, px: 2 }}>
                {error && <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError('')}>{error}</Alert>}
                {message && <Alert severity="success" sx={{ mb: 3 }} onClose={() => setMessage('')}>{message}</Alert>}
                {!plans && !error && <Box sx={{ textAlign: 'center', py: 8 }}><CircularProgress sx={{ color: '#e94560' }} /></Box>}

                {active && (
                    <Card sx={{ ...cardStyle, mb: 4, background: 'linear-gradient(135deg, rgba(102,187,106,0.18), rgba(78,205,196,0.12))' }}>
                        <CardContent sx={{ p: 3 }}>
                            <Typography sx={{ color: theme.mix(0.6), fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: 2, fontWeight: 700 }}>
                                You're following
                            </Typography>
                            <Typography variant="h5" sx={{ color: theme.mix(1), fontWeight: 800, mb: 0.5 }}>{active.plan.name}</Typography>
                            <Typography sx={{ color: theme.mix(0.6), fontSize: '0.9rem', mb: 1.5 }}>
                                {active.completedSessions} of {active.totalSessions} sessions done
                                {active.currentWeek ? ` · week ${active.currentWeek} of ${active.plan.durationWeeks}` : ''}
                            </Typography>
                            <LinearProgress variant="determinate" value={active.progressPercent}
                                            sx={{ height: 8, borderRadius: 4, mb: 2.5, background: theme.mix(0.12), '& .MuiLinearProgress-bar': { background: 'linear-gradient(90deg, #66bb6a, #4ecdc4)' } }} />

                            {next ? (
                                <Box sx={{ background: theme.mix(0.06), borderRadius: 2, p: 2 }}>
                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
                                        {next.activity === 'RUN'
                                            ? <DirectionsRunIcon sx={{ color: '#45b7d1' }} />
                                            : <FitnessCenterIcon sx={{ color: '#e94560' }} />}
                                        <Typography sx={{ color: theme.mix(1), fontWeight: 700 }}>
                                            Next: {next.title}
                                        </Typography>
                                    </Box>
                                    <Typography sx={{ color: theme.mix(0.55), fontSize: '0.85rem' }}>
                                        {next.focus ? `${next.focus} · ` : ''}about {next.targetMinutes} minutes
                                        {next.targetDistanceM ? ` · ${(next.targetDistanceM / 1000).toFixed(1)} km` : ''}
                                    </Typography>
                                    {next.instructions && (
                                        <Typography sx={{ color: theme.mix(0.6), fontSize: '0.85rem', mt: 1 }}>{next.instructions}</Typography>
                                    )}
                                    {next.exercises.length > 0 && (
                                        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.75, mt: 1.5 }}>
                                            {next.exercises.map((ex) => (
                                                <Chip key={ex.exerciseId} size="small" label={`${ex.name} · ${ex.sets}×${ex.reps}`}
                                                      sx={{ background: theme.mix(0.08), color: theme.mix(0.8), fontSize: '0.72rem' }} />
                                            ))}
                                        </Box>
                                    )}
                                    <Box sx={{ display: 'flex', gap: 1, mt: 2, flexWrap: 'wrap' }}>
                                        <Button variant="contained" startIcon={<PlayArrowIcon />} onClick={() => navigate(sessionPath(next))}
                                                sx={{ borderRadius: 999, textTransform: 'none', fontWeight: 700, background: 'linear-gradient(90deg, #66bb6a, #4ecdc4)' }}>
                                            Start this session
                                        </Button>
                                        <Button onClick={() => setConfirm('skip')} sx={{ color: theme.mix(0.6), textTransform: 'none' }}>Skip it</Button>
                                        <Button onClick={() => setConfirm('quit')} sx={{ color: '#e94560', textTransform: 'none', ml: 'auto' }}>Quit plan</Button>
                                    </Box>
                                </Box>
                            ) : (
                                <Alert severity="success">You finished this plan. Pick a new one below!</Alert>
                            )}
                        </CardContent>
                    </Card>
                )}

                {plans && (
                    <>
                        <Typography sx={{ color: theme.mix(0.8), fontWeight: 700, mb: 1.5, letterSpacing: 1 }}>
                            {active ? 'Other plans' : 'Choose a plan'}
                        </Typography>
                        <Typography sx={{ color: theme.mix(0.45), fontSize: '0.8rem', mt: -1, mb: 2 }}>
                            Browse any plan for free. Following one, session by session, is part of FitTracker Ultimate.
                        </Typography>
                        <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' }, gap: 2 }}>
                            {plans.map((plan) => (
                                <Card key={plan.slug} sx={{ ...cardStyle, borderTop: `4px solid ${GOAL_COLORS[plan.goal] || '#e94560'}` }}>
                                    <CardContent>
                                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', gap: 1 }}>
                                            <Typography sx={{ color: theme.mix(1), fontWeight: 700, fontSize: '1.05rem' }}>{plan.name}</Typography>
                                            {plan.active && <Chip size="small" label="Active" sx={{ background: '#66bb6a', color: '#fff', fontWeight: 700 }} />}
                                        </Box>
                                        <Typography sx={{ color: theme.mix(0.55), fontSize: '0.85rem', mt: 0.5, mb: 1.5 }}>{plan.summary}</Typography>
                                        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.75, mb: 2 }}>
                                            <Chip size="small" label={GOAL_LABELS[plan.goal] || plan.goal}
                                                  sx={{ background: `${GOAL_COLORS[plan.goal] || '#e94560'}33`, color: GOAL_COLORS[plan.goal] || '#e94560', fontWeight: 600 }} />
                                            <Chip size="small" label={plan.level} sx={{ background: theme.mix(0.08), color: theme.mix(0.7) }} />
                                            <Chip size="small" label={`${plan.durationWeeks} weeks · ${plan.daysPerWeek}×/week`} sx={{ background: theme.mix(0.08), color: theme.mix(0.7) }} />
                                            <Chip size="small" label={plan.equipment} sx={{ background: theme.mix(0.08), color: theme.mix(0.7) }} />
                                        </Box>
                                        <Button onClick={() => navigate(`/plans/${plan.slug}`)} variant="outlined"
                                                sx={{ borderRadius: 999, textTransform: 'none', fontWeight: 600, borderColor: theme.mix(0.25), color: theme.mix(0.85) }}>
                                            View plan
                                        </Button>
                                    </CardContent>
                                </Card>
                            ))}
                        </Box>
                    </>
                )}
            </Box>

            <Dialog open={!!confirm} onClose={() => setConfirm(null)}
                    slotProps={{ paper: { sx: { background: theme.menuBg, color: theme.mix(1), borderRadius: 3 } } }}>
                <DialogTitle sx={{ fontWeight: 700 }}>
                    {confirm === 'quit' ? 'Quit this plan?' : 'Skip this session?'}
                </DialogTitle>
                <DialogContent>
                    <DialogContentText sx={{ color: theme.mix(0.7) }}>
                        {confirm === 'quit'
                            ? 'Your logged workouts stay, but the plan stops here. You can start it again later from the beginning.'
                            : 'The session counts as done so the plan moves on, but no workout is recorded for it.'}
                    </DialogContentText>
                </DialogContent>
                <DialogActions sx={{ px: 3, pb: 2 }}>
                    <Button onClick={() => setConfirm(null)} sx={{ color: theme.mix(0.6), textTransform: 'none' }}>Cancel</Button>
                    <Button onClick={confirm === 'quit' ? quitPlan : skipSession} disabled={busy} variant="contained" color="error"
                            sx={{ borderRadius: 999, textTransform: 'none', fontWeight: 700 }}>
                        {confirm === 'quit' ? 'Quit plan' : 'Skip session'}
                    </Button>
                </DialogActions>
            </Dialog>
        </Box>
    );
}

export default Plans;
