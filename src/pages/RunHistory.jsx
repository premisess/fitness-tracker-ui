import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import API from '../services/api';
import { errorMessage } from '../services/errors';
import { useAppTheme } from '../context/ThemeContext';
import { Alert, AppBar, Box, Button, Card, CardContent, CircularProgress, IconButton, Toolbar, Typography } from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import MapIcon from '@mui/icons-material/Map';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import RouteMap from '../components/RouteMap';
import Blobs from '../components/Glass';
import { FONT, glassCard, sectionTitle } from '../theme/styles';
import { decodePolyline, formatDistance, formatDuration, paceOrSpeed } from '../utils/geo';

function RunCard({ run, theme, onOpen }) {
    const positions = useMemo(() => decodePolyline(run.polyline), [run.polyline]);
    return (
        <Card sx={{
            ...glassCard(theme), overflow: 'hidden',
            transition: 'transform 0.2s, border-color 0.2s',
            '&:hover': { transform: 'translateY(-3px)', borderColor: '#4ecdc4' },
        }}>
            <Box onClick={onOpen} sx={{ cursor: 'pointer' }}>
                {positions.length > 1
                    ? <RouteMap positions={positions} height={150} interactive={false} radius={0} />
                    : <Box sx={{ height: 150, display: 'flex', alignItems: 'center', justifyContent: 'center', background: theme.mix(0.08), color: theme.mix(0.5) }}>
                        Route data deleted
                    </Box>}
                <CardContent>
                    <Typography sx={{ color: theme.mix(1), fontWeight: 700 }}>
                        {run.type} · {formatDistance(run.distanceMeters)}
                    </Typography>
                    <Typography sx={{ color: theme.mix(0.6), fontSize: '0.85rem' }}>
                        {formatDuration(run.movingTimeSec)} · {paceOrSpeed(run.type, run.distanceMeters, run.movingTimeSec)} · {run.caloriesBurned} kcal
                    </Typography>
                    <Typography sx={{ color: theme.mix(0.4), fontSize: '0.78rem' }}>
                        {run.date}{run.elevationGainM ? ` · ↑ ${run.elevationGainM} m` : ''}
                    </Typography>
                </CardContent>
            </Box>
        </Card>
    );
}

function RunHistory() {
    const { theme } = useAppTheme();
    const navigate = useNavigate();
    const [runs, setRuns] = useState(null);
    const [error, setError] = useState('');

    useEffect(() => {
        let ignore = false;
        API.get('/runs')
            .then((res) => { if (!ignore) setRuns(res.data); })
            .catch((err) => { if (!ignore) setError(errorMessage(err, 'Could not load your activities')); });
        return () => { ignore = true; };
    }, []);

    const totals = useMemo(() => (runs || []).reduce((acc, r) => ({
        distance: acc.distance + (r.distanceMeters || 0),
        time: acc.time + (r.movingTimeSec || 0),
    }), { distance: 0, time: 0 }), [runs]);

    return (
        <Box sx={{ minHeight: '100vh', background: theme.bgGradient, fontFamily: FONT, position: 'relative' }}>
            <Blobs />
            <AppBar position="static" sx={{ background: theme.mix(0.05), backdropFilter: 'blur(10px)', boxShadow: 'none', borderBottom: `1px solid ${theme.mix(0.1)}` }}>
                <Toolbar>
                    <IconButton onClick={() => navigate('/dashboard')} sx={{ color: theme.mix(1), mr: 1 }}>
                        <ArrowBackIcon />
                    </IconButton>
                    <MapIcon sx={{ color: '#45b7d1', mr: 1 }} />
                    <Typography variant="h6" sx={{ color: theme.mix(1), fontWeight: 700, flexGrow: 1 }}>Activities</Typography>
                    <Button variant="contained" startIcon={<PlayArrowIcon />} onClick={() => navigate('/run')}
                            sx={{ borderRadius: 2, fontWeight: 700, background: 'linear-gradient(90deg, #4ecdc4, #0f3460)' }}>
                        Start
                    </Button>
                </Toolbar>
            </AppBar>

            <Box sx={{ maxWidth: 1000, mx: 'auto', py: 4, px: 2, position: 'relative', zIndex: 1 }}>
                {error && <Alert severity="error" sx={{ mb: 3 }}>{error}</Alert>}
                {!runs && !error && <Box sx={{ textAlign: 'center', mt: 8 }}><CircularProgress /></Box>}

                {runs && runs.length > 0 && (
                    <Typography sx={{ color: theme.mix(0.6), mb: 2 }}>
                        {runs.length} activit{runs.length === 1 ? 'y' : 'ies'} · {formatDistance(totals.distance)} · {formatDuration(totals.time)}
                    </Typography>
                )}

                {runs && runs.length === 0 && (
                    <Card sx={{ ...glassCard(theme), textAlign: 'center' }}>
                        <CardContent sx={{ p: 5 }}>
                            <MapIcon sx={{ fontSize: 38, color: '#45b7d1', mb: 1 }} />
                            <Typography sx={{ ...sectionTitle(theme), mb: 1 }}>No GPS activities yet</Typography>
                            <Typography sx={{ color: theme.mix(0.6), mb: 3 }}>
                                Track a run, walk, hike or ride and it shows up here with its route on a map.
                            </Typography>
                            <Button variant="contained" startIcon={<PlayArrowIcon />} onClick={() => navigate('/run')}
                                    sx={{ borderRadius: 2, fontWeight: 700, background: 'linear-gradient(90deg, #4ecdc4, #0f3460)' }}>
                                Track your first activity
                            </Button>
                        </CardContent>
                    </Card>
                )}

                <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr', md: 'repeat(3, 1fr)' }, gap: 2 }}>
                    {(runs || []).map((run) => (
                        <RunCard key={run.workoutId} run={run} theme={theme} onOpen={() => navigate(`/runs/${run.workoutId}`)} />
                    ))}
                </Box>
            </Box>
        </Box>
    );
}

export default RunHistory;
