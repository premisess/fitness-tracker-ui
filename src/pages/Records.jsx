import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import API from '../services/api';
import { errorMessage } from '../services/errors';
import { useAppTheme } from '../context/ThemeContext';
import { Alert, Box, Button, Card, CardContent, Typography } from '@mui/material';
import EmojiEventsIcon from '@mui/icons-material/EmojiEvents';
import Blobs from '../components/Glass';
import { FONT, glassCard, sectionTitle } from '../theme/styles';
import PageHeader from '../components/PageHeader';
import { formatDuration } from '../utils/geo';

/** The headline best for an exercise, chosen by how the exercise is tracked. */
const headline = (r) => {
    if (r.trackingType === 'DURATION' && r.longestSec) {
        return { label: 'Longest set', value: formatDuration(r.longestSec) };
    }
    if (r.bestE1rmKg) {
        return { label: 'Estimated 1RM', value: `${r.bestE1rmKg} kg` };
    }
    if (r.heaviestKg) {
        return { label: 'Heaviest', value: `${r.heaviestKg} kg` };
    }
    if (r.maxReps) {
        return { label: 'Most reps', value: `${r.maxReps}` };
    }
    return { label: 'Sets logged', value: `${r.totalSets}` };
};

function Records() {
    const { theme } = useAppTheme();
    const navigate = useNavigate();
    const [records, setRecords] = useState(null);
    const [error, setError] = useState('');

    useEffect(() => {
        let ignore = false;
        API.get('/records')
            .then((res) => { if (!ignore) setRecords(res.data); })
            .catch((err) => { if (!ignore) setError(errorMessage(err, 'Could not load your records')); });
        return () => { ignore = true; };
    }, []);

    return (
        <Box sx={{ minHeight: '100vh', background: theme.bgGradient, fontFamily: FONT, position: 'relative' }}>
            <Blobs />

            <Box sx={{ maxWidth: 960, mx: 'auto', py: 3, px: 2, position: 'relative', zIndex: 1 }}>
                <PageHeader>
                    <EmojiEventsIcon sx={{ color: '#ffa726', mr: 1 }} />
                    <Typography variant="h6" sx={{ color: theme.mix(1), fontWeight: 700 }}>Personal Records</Typography>
                </PageHeader>
                {error && <Alert severity="error" sx={{ mb: 3 }}>{error}</Alert>}

                {records && records.length === 0 && (
                    <Card sx={{ ...glassCard(theme), textAlign: 'center' }}>
                        <CardContent sx={{ p: 5 }}>
                            <EmojiEventsIcon sx={{ fontSize: 38, color: '#ffa726', mb: 1 }} />
                            <Typography sx={{ ...sectionTitle(theme), mb: 1 }}>No records yet</Typography>
                            <Typography sx={{ color: theme.mix(0.6), mb: 3 }}>
                                Log a workout with sets, reps and weight and your bests will show up here.
                            </Typography>
                            <Box sx={{ display: 'flex', gap: 1, justifyContent: 'center', flexWrap: 'wrap' }}>
                                <Button variant="contained" onClick={() => navigate('/workouts')}
                                        sx={{ borderRadius: 2, fontWeight: 700, background: 'linear-gradient(90deg, #e94560, #0f3460)' }}>
                                    Log a workout
                                </Button>
                                <Button variant="outlined" onClick={() => navigate('/exercises')}
                                        sx={{ borderRadius: 2, borderColor: theme.mix(0.3), color: theme.mix(0.8) }}>
                                    Browse exercises
                                </Button>
                            </Box>
                        </CardContent>
                    </Card>
                )}

                <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr', md: 'repeat(3, 1fr)' }, gap: 2 }}>
                    {(records || []).map((r) => {
                        const main = headline(r);
                        return (
                            <Card key={r.exerciseId} onClick={() => navigate(`/records/${r.exerciseId}`)}
                                  sx={{
                                      ...glassCard(theme), cursor: 'pointer',
                                      transition: 'transform 0.2s, border-color 0.2s',
                                      '&:hover': { transform: 'translateY(-3px)', borderColor: '#ffa726' },
                                  }}>
                                <CardContent sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
                                    {r.thumbnailUrl
                                        ? <Box component="img" src={r.thumbnailUrl} alt="" loading="lazy"
                                               sx={{ width: 64, height: 64, objectFit: 'cover', borderRadius: 2, background: '#fff', flexShrink: 0 }} />
                                        : <Box sx={{ width: 64, height: 64, borderRadius: 2, background: theme.mix(0.1), flexShrink: 0 }} />}
                                    <Box sx={{ minWidth: 0 }}>
                                        <Typography sx={{ color: theme.mix(1), fontWeight: 700, fontSize: '0.92rem', lineHeight: 1.3 }}>
                                            {r.exerciseName}
                                        </Typography>
                                        <Typography sx={{ color: '#ffa726', fontWeight: 700, fontSize: '1.15rem' }}>{main.value}</Typography>
                                        <Typography sx={{ color: theme.mix(0.5), fontSize: '0.72rem' }}>
                                            {main.label} · {r.sessions} session{r.sessions === 1 ? '' : 's'} · last {r.lastPerformed}
                                        </Typography>
                                    </Box>
                                </CardContent>
                            </Card>
                        );
                    })}
                </Box>
            </Box>
        </Box>
    );
}

export default Records;
