import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import API from '../services/api';
import { errorMessage } from '../services/errors';
import { useAppTheme } from '../context/ThemeContext';
import {
    Alert, AppBar, Box, Button, Card, CardContent, CircularProgress, Dialog, DialogActions, DialogContent,
    DialogContentText, DialogTitle, FormControlLabel, IconButton, Switch, Toolbar, Typography,
} from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import DeleteIcon from '@mui/icons-material/Delete';
import {
    Chart as ChartJS, CategoryScale, LinearScale, LineElement, PointElement, Tooltip, Filler,
} from 'chart.js';
import { Line } from 'react-chartjs-2';
import RouteMap from '../components/RouteMap';
import Blobs from '../components/Glass';
import { FONT, glassCard, sectionTitle } from '../theme/styles';
import { decodePolyline, formatDistance, formatDuration, formatPace, paceOrSpeed, usesSpeed } from '../utils/geo';

ChartJS.register(CategoryScale, LinearScale, LineElement, PointElement, Tooltip, Filler);

function RunDetail() {
    const { workoutId } = useParams();
    const { theme } = useAppTheme();
    const navigate = useNavigate();
    const [run, setRun] = useState(null);
    const [error, setError] = useState('');
    const [sharedView, setSharedView] = useState(false);
    const [confirmDelete, setConfirmDelete] = useState(false);

    useEffect(() => {
        let ignore = false;
        API.get(`/runs/${workoutId}`)
            .then((res) => { if (!ignore) setRun(res.data); })
            .catch((err) => { if (!ignore) setError(errorMessage(err, 'Could not load this activity')); });
        return () => { ignore = true; };
    }, [workoutId]);

    const full = useMemo(() => decodePolyline(run?.summary.polyline), [run]);
    const shared = useMemo(() => decodePolyline(run?.sharePolyline), [run]);

    const handleDelete = async () => {
        try {
            await API.delete(`/workouts/${workoutId}`);
            navigate('/runs', { replace: true });
        } catch (err) {
            setConfirmDelete(false);
            setError(errorMessage(err, 'Could not delete this activity'));
        }
    };

    const cardStyle = glassCard(theme);
    const s = run?.summary;
    const speedMode = s && usesSpeed(s.type);
    const fastest = run?.splits?.filter((x) => x.distanceM >= 1000).reduce((min, x) => Math.min(min, x.paceSecPerKm), Infinity);
    const slowest = run?.splits?.reduce((max, x) => Math.max(max, x.paceSecPerKm), 0);

    return (
        <Box sx={{ minHeight: '100vh', background: theme.bgGradient, fontFamily: FONT, position: 'relative' }}>
            <Blobs />
            <AppBar position="static" sx={{ background: theme.mix(0.05), backdropFilter: 'blur(10px)', boxShadow: 'none', borderBottom: `1px solid ${theme.mix(0.1)}` }}>
                <Toolbar>
                    <IconButton onClick={() => navigate('/runs')} sx={{ color: theme.mix(1), mr: 1 }} aria-label="Back to activities">
                        <ArrowBackIcon />
                    </IconButton>
                    <Typography variant="h6" sx={{ color: theme.mix(1), fontWeight: 700, flexGrow: 1 }} noWrap>
                        {s ? `${s.type} · ${s.date}` : 'Activity'}
                    </Typography>
                    {run && (
                        <IconButton onClick={() => setConfirmDelete(true)} sx={{ color: '#e94560' }} aria-label="Delete activity">
                            <DeleteIcon />
                        </IconButton>
                    )}
                </Toolbar>
            </AppBar>

            <Box sx={{ maxWidth: 900, mx: 'auto', py: 3, px: 2, position: 'relative', zIndex: 1 }}>
                {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
                {!run && !error && <Box sx={{ textAlign: 'center', mt: 8 }}><CircularProgress /></Box>}

                {run && (
                    <>
                        <Card sx={{ ...cardStyle, mb: 2 }}>
                            <CardContent>
                                {full.length > 1 ? (
                                    <>
                                        <RouteMap positions={sharedView ? shared : full} hiddenPositions={sharedView ? full : null} height={380} />
                                        <FormControlLabel
                                            sx={{ mt: 1, color: theme.mix(0.75) }}
                                            control={<Switch checked={sharedView} onChange={(e) => setSharedView(e.target.checked)} />}
                                            label={run.privacyMeters
                                                ? `Preview what others would see (hides ${run.privacyMeters} m around start and finish)`
                                                : 'Preview what others would see (privacy zone is off)'}
                                        />
                                    </>
                                ) : (
                                    <Typography sx={{ color: theme.mix(0.6), textAlign: 'center', py: 4 }}>
                                        The route for this activity was deleted. Its distance, time and splits are kept.
                                    </Typography>
                                )}
                            </CardContent>
                        </Card>

                        <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr 1fr', sm: 'repeat(3, 1fr)' }, gap: 2, mb: 2 }}>
                            {[
                                { label: 'Distance', value: formatDistance(s.distanceMeters) },
                                { label: 'Moving time', value: formatDuration(s.movingTimeSec) },
                                { label: speedMode ? 'Avg speed' : 'Avg pace', value: paceOrSpeed(s.type, s.distanceMeters, s.movingTimeSec) },
                                { label: 'Elevation gain', value: `${s.elevationGainM ?? 0} m` },
                                { label: 'Calories', value: `${s.caloriesBurned} kcal` },
                                { label: 'Started', value: s.startedAt ? new Date(`${s.startedAt}Z`).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '–' },
                            ].map((tile) => (
                                <Card key={tile.label} sx={cardStyle}>
                                    <CardContent>
                                        <Typography sx={{ color: theme.mix(0.5), fontSize: '0.75rem' }}>{tile.label}</Typography>
                                        <Typography sx={{ color: theme.mix(1), fontWeight: 700, fontSize: '1.3rem' }}>{tile.value}</Typography>
                                    </CardContent>
                                </Card>
                            ))}
                        </Box>

                        {run.notes && (
                            <Card sx={{ ...cardStyle, mb: 2 }}>
                                <CardContent><Typography sx={{ color: theme.mix(0.8) }}>{run.notes}</Typography></CardContent>
                            </Card>
                        )}

                        {run.splits.length > 0 && (
                            <Card sx={{ ...cardStyle, mb: 2 }}>
                                <CardContent>
                                    <Typography sx={{ ...sectionTitle(theme), mb: 1.5 }}>Splits</Typography>
                                    {run.splits.map((split) => {
                                        const isFastest = split.distanceM >= 1000 && split.paceSecPerKm === fastest;
                                        const width = slowest ? Math.max(12, (1 - (split.paceSecPerKm - fastest) / (slowest * 1.2)) * 100) : 100;
                                        return (
                                            <Box key={split.index} sx={{ display: 'grid', gridTemplateColumns: '64px 1fr 90px 60px', gap: 1.5, alignItems: 'center', mb: 1 }}>
                                                <Typography sx={{ color: theme.mix(0.7), fontSize: '0.85rem' }}>
                                                    {split.distanceM >= 1000 ? `km ${split.index}` : `${(split.distanceM / 1000).toFixed(2)} km`}
                                                </Typography>
                                                <Box sx={{ height: 10, background: theme.mix(0.08), borderRadius: 5 }}>
                                                    <Box sx={{ width: `${Math.min(100, width)}%`, height: '100%', borderRadius: 5, background: isFastest ? '#ffa726' : '#4ecdc4' }} />
                                                </Box>
                                                <Typography sx={{ color: isFastest ? '#ffa726' : theme.mix(1), fontWeight: 700, fontSize: '0.9rem', textAlign: 'right', fontVariantNumeric: 'tabular-nums' }}>
                                                    {speedMode
                                                        ? `${(3600 / split.paceSecPerKm).toFixed(1)} km/h`
                                                        : formatPace(split.paceSecPerKm).replace(' /km', '')}
                                                </Typography>
                                                <Typography sx={{ color: theme.mix(0.5), fontSize: '0.8rem', textAlign: 'right' }}>
                                                    ↑ {split.elevationGainM} m
                                                </Typography>
                                            </Box>
                                        );
                                    })}
                                </CardContent>
                            </Card>
                        )}

                        {run.elevationProfile.length > 2 && (
                            <Card sx={cardStyle}>
                                <CardContent>
                                    <Typography sx={{ ...sectionTitle(theme), mb: 1.5 }}>Elevation</Typography>
                                    <Line
                                        data={{
                                            labels: run.elevationProfile.map((p) => (p.distanceM / 1000).toFixed(2)),
                                            datasets: [{
                                                label: 'Altitude (m)',
                                                data: run.elevationProfile.map((p) => p.altitudeM),
                                                borderColor: '#45b7d1',
                                                backgroundColor: 'rgba(69,183,209,0.2)',
                                                fill: true,
                                                pointRadius: 0,
                                                tension: 0.3,
                                            }],
                                        }}
                                        options={{
                                            responsive: true,
                                            plugins: { legend: { display: false } },
                                            scales: {
                                                x: { title: { display: true, text: 'km', color: theme.mix(0.5) }, ticks: { color: theme.mix(0.5), maxTicksLimit: 8 }, grid: { color: theme.mix(0.05) } },
                                                y: { title: { display: true, text: 'm', color: theme.mix(0.5) }, ticks: { color: theme.mix(0.5) }, grid: { color: theme.mix(0.05) } },
                                            },
                                        }}
                                    />
                                </CardContent>
                            </Card>
                        )}
                    </>
                )}
            </Box>

            <Dialog open={confirmDelete} onClose={() => setConfirmDelete(false)}>
                <DialogTitle>Delete this activity?</DialogTitle>
                <DialogContent>
                    <DialogContentText>The activity, its route and its splits will be deleted permanently.</DialogContentText>
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setConfirmDelete(false)}>Cancel</Button>
                    <Button onClick={handleDelete} sx={{ color: '#e94560' }}>Delete</Button>
                </DialogActions>
            </Dialog>
        </Box>
    );
}

export default RunDetail;
