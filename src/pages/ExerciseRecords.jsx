import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import API from '../services/api';
import { errorMessage } from '../services/errors';
import { useAppTheme } from '../context/ThemeContext';
import { Alert, AppBar, Box, Button, Card, CardContent, IconButton, Toolbar, Typography } from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import AddIcon from '@mui/icons-material/Add';
import {
    Chart as ChartJS, CategoryScale, LinearScale, LineElement, PointElement, Tooltip, Legend, Filler,
} from 'chart.js';
import { Line } from 'react-chartjs-2';
import ExerciseDemo from '../components/ExerciseDemo';
import { formatDuration } from '../utils/geo';

ChartJS.register(CategoryScale, LinearScale, LineElement, PointElement, Tooltip, Legend, Filler);

/** What the progress chart plots, depending on how the exercise is tracked. */
const progressSeries = (trackingType, sessions) => {
    if (trackingType === 'DURATION') {
        return { label: 'Longest set (seconds)', values: sessions.map((s) => s.longestSec) };
    }
    if (sessions.some((s) => s.bestE1rmKg)) {
        return { label: 'Estimated 1RM (kg)', values: sessions.map((s) => s.bestE1rmKg) };
    }
    return { label: 'Most reps in a set', values: sessions.map((s) => s.maxReps) };
};

function ExerciseRecords() {
    const { exerciseId } = useParams();
    const { theme } = useAppTheme();
    const navigate = useNavigate();
    const [data, setData] = useState(null);
    const [error, setError] = useState('');

    useEffect(() => {
        let ignore = false;
        API.get(`/records/${exerciseId}`)
            .then((res) => { if (!ignore) setData(res.data); })
            .catch((err) => { if (!ignore) setError(errorMessage(err, 'Could not load this exercise')); });
        return () => { ignore = true; };
    }, [exerciseId]);

    const cardStyle = { background: theme.mix(0.05), border: `1px solid ${theme.mix(0.1)}`, borderRadius: 3 };
    const records = data?.records;
    const sessions = data?.sessions || [];
    const series = data ? progressSeries(data.exercise.trackingType, sessions) : null;

    const tiles = records ? [
        records.bestE1rmKg && { label: 'Estimated 1RM', value: `${records.bestE1rmKg} kg`, sub: `${records.bestE1rmWeightKg} kg × ${records.bestE1rmReps} · ${records.bestE1rmDate}` },
        records.heaviestKg && { label: 'Heaviest set', value: `${records.heaviestKg} kg`, sub: `× ${records.heaviestReps} · ${records.heaviestDate}` },
        records.maxReps && { label: 'Most reps', value: `${records.maxReps}`, sub: records.maxRepsDate },
        records.longestSec && { label: 'Longest set', value: formatDuration(records.longestSec), sub: records.longestDate },
        { label: 'Total volume', value: `${Math.round(records.totalVolumeKg).toLocaleString()} kg`, sub: `${records.totalSets} working sets` },
        { label: 'Sessions', value: `${records.sessions}`, sub: `last ${records.lastPerformed}` },
    ].filter(Boolean) : [];

    return (
        <Box sx={{ minHeight: '100vh', background: theme.bgGradient }}>
            <AppBar position="static" sx={{ background: theme.mix(0.05), backdropFilter: 'blur(10px)', boxShadow: 'none', borderBottom: `1px solid ${theme.mix(0.1)}` }}>
                <Toolbar>
                    <IconButton onClick={() => navigate('/records')} sx={{ color: theme.mix(1), mr: 1 }} aria-label="Back to records">
                        <ArrowBackIcon />
                    </IconButton>
                    <Typography variant="h6" sx={{ color: theme.mix(1), fontWeight: 700 }} noWrap>
                        {data?.exercise.name || 'Exercise'}
                    </Typography>
                </Toolbar>
            </AppBar>

            <Box sx={{ maxWidth: 900, mx: 'auto', py: 4, px: 2 }}>
                {error && <Alert severity="error" sx={{ mb: 3 }}>{error}</Alert>}

                {data && (
                    <>
                        <Card sx={{ ...cardStyle, mb: 3 }}>
                            <CardContent sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '240px 1fr' }, gap: 3, alignItems: 'center' }}>
                                <ExerciseDemo exercise={data.exercise} height={200} animate="always" />
                                <Box>
                                    <Typography variant="h5" sx={{ color: theme.mix(1), fontWeight: 700, mb: 0.5 }}>{data.exercise.name}</Typography>
                                    <Typography sx={{ color: theme.mix(0.5), mb: 2, textTransform: 'capitalize' }}>
                                        {[data.exercise.category, data.exercise.primaryMuscles.join(', '), data.exercise.equipment].filter(Boolean).join(' · ')}
                                    </Typography>
                                    <Button variant="contained" startIcon={<AddIcon />}
                                            onClick={() => navigate(`/workouts?exerciseId=${data.exercise.id}`)}
                                            sx={{ borderRadius: 2, fontWeight: 700, background: 'linear-gradient(90deg, #e94560, #0f3460)' }}>
                                        Log this exercise
                                    </Button>
                                </Box>
                            </CardContent>
                        </Card>

                        {!records && (
                            <Typography sx={{ color: theme.mix(0.6), textAlign: 'center', mt: 4 }}>
                                You haven&apos;t logged this exercise yet. Your records and progress chart appear after your first session.
                            </Typography>
                        )}

                        {records && (
                            <>
                                <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr 1fr', md: 'repeat(3, 1fr)' }, gap: 2, mb: 3 }}>
                                    {tiles.map((t) => (
                                        <Card key={t.label} sx={cardStyle}>
                                            <CardContent>
                                                <Typography sx={{ color: theme.mix(0.5), fontSize: '0.75rem' }}>{t.label}</Typography>
                                                <Typography sx={{ color: '#ffa726', fontWeight: 700, fontSize: '1.4rem' }}>{t.value}</Typography>
                                                <Typography sx={{ color: theme.mix(0.45), fontSize: '0.72rem' }}>{t.sub}</Typography>
                                            </CardContent>
                                        </Card>
                                    ))}
                                </Box>

                                {sessions.length > 1 && (
                                    <Card sx={{ ...cardStyle, mb: 3 }}>
                                        <CardContent>
                                            <Line
                                                data={{
                                                    labels: sessions.map((s) => s.date),
                                                    datasets: [{
                                                        label: series.label,
                                                        data: series.values,
                                                        borderColor: '#ffa726',
                                                        backgroundColor: 'rgba(255,167,38,0.15)',
                                                        fill: true,
                                                        tension: 0.3,
                                                        spanGaps: true,
                                                    }],
                                                }}
                                                options={{
                                                    responsive: true,
                                                    plugins: { legend: { labels: { color: theme.mix(0.8) } } },
                                                    scales: {
                                                        x: { ticks: { color: theme.mix(0.5) }, grid: { color: theme.mix(0.05) } },
                                                        y: { ticks: { color: theme.mix(0.5) }, grid: { color: theme.mix(0.05) } },
                                                    },
                                                }}
                                            />
                                        </CardContent>
                                    </Card>
                                )}

                                <Typography variant="h6" sx={{ color: theme.mix(1), fontWeight: 700, mb: 1.5 }}>History</Typography>
                                {[...sessions].reverse().map((s) => (
                                    <Card key={s.workoutId} sx={{ ...cardStyle, mb: 1.5 }}>
                                        <CardContent sx={{ py: 1.5, '&:last-child': { pb: 1.5 } }}>
                                            <Typography sx={{ color: theme.mix(1), fontWeight: 600 }}>{s.date}</Typography>
                                            <Typography sx={{ color: theme.mix(0.65), fontSize: '0.85rem' }}>
                                                {s.sets.map((set) => (data.exercise.trackingType === 'DURATION'
                                                    ? formatDuration(set.durationSec)
                                                    : `${set.weightKg ? `${set.weightKg}×` : ''}${set.reps}`) + (set.warmup ? ' (w)' : '')).join('  ·  ')}
                                            </Typography>
                                        </CardContent>
                                    </Card>
                                ))}
                            </>
                        )}
                    </>
                )}
            </Box>
        </Box>
    );
}

export default ExerciseRecords;
