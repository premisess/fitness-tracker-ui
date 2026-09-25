import { useEffect, useState } from 'react';
import { keyframes } from '@emotion/react';
import { Alert, Box, Card, CardContent, Chip, CircularProgress, Typography } from '@mui/material';
import AcUnitIcon from '@mui/icons-material/AcUnit';
import API from '../services/api';
import { errorMessage } from '../services/errors';

const sparkle = keyframes`
  0%, 100% { transform: rotate(0deg) scale(1); opacity: 0.85; }
  50% { transform: rotate(30deg) scale(1.1); opacity: 1; }
`;

const dayLabel = (iso) => new Date(`${iso}T12:00:00`).toLocaleDateString(undefined, { weekday: 'short', day: 'numeric', month: 'short' });

/** Lets users protect a missed day so their streak survives. */
function StreakFreezeCard({ theme, onChange }) {
    const [status, setStatus] = useState(null);
    const [busyDate, setBusyDate] = useState(null);
    const [notice, setNotice] = useState('');
    const [error, setError] = useState('');

    useEffect(() => {
        let ignore = false;
        API.get('/streak')
            .then((res) => { if (!ignore) setStatus(res.data); })
            .catch(() => {});
        return () => { ignore = true; };
    }, []);

    const freeze = async (date) => {
        setError('');
        setNotice('');
        setBusyDate(date);
        try {
            const res = await API.post('/streak/freeze', { date });
            setStatus(res.data);
            setNotice(`${dayLabel(date)} is frozen. Your streak is safe at ${res.data.currentStreak} day${res.data.currentStreak === 1 ? '' : 's'}.`);
            onChange?.(res.data);
        } catch (err) {
            setError(errorMessage(err, 'Could not freeze that day'));
        } finally {
            setBusyDate(null);
        }
    };

    if (!status) return null;
    const outOfFreezes = status.freezesLeft === 0;

    return (
        <Card sx={{
            mb: 4, borderRadius: 3, border: '1px solid rgba(79,195,247,0.35)',
            background: 'linear-gradient(135deg, rgba(79,195,247,0.14), rgba(162,155,254,0.08))',
        }}>
            <CardContent sx={{ p: 3 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, flexWrap: 'wrap' }}>
                    <AcUnitIcon sx={{
                        fontSize: 40, color: '#4fc3f7', animation: `${sparkle} 3s ease-in-out infinite`,
                        '@media (prefers-reduced-motion: reduce)': { animation: 'none' },
                    }} />
                    <Box sx={{ flex: 1, minWidth: 200 }}>
                        <Typography sx={{ color: theme.mix(1), fontWeight: 700 }}>Streak freezes</Typography>
                        <Typography sx={{ color: theme.mix(0.6), fontSize: '0.85rem' }}>
                            {`${status.freezesLeft} of ${status.freezesPerMonth} left this month. A frozen day keeps your streak going.`}
                        </Typography>
                    </Box>
                </Box>

                {notice && <Alert severity="success" sx={{ mt: 2 }} onClose={() => setNotice('')}>{notice}</Alert>}
                {error && <Alert severity="error" sx={{ mt: 2 }} onClose={() => setError('')}>{error}</Alert>}

                <Box sx={{ mt: 2 }}>
                    {status.freezableDates.length > 0 ? (
                        <>
                            <Typography sx={{ color: theme.mix(0.55), fontSize: '0.8rem', mb: 1 }}>
                                Missed days from the last week you can still protect:
                            </Typography>
                            <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                                {status.freezableDates.map((date) => (
                                    <Chip key={date} onClick={() => freeze(date)} disabled={outOfFreezes || !!busyDate}
                                          icon={busyDate === date ? <CircularProgress size={14} /> : <AcUnitIcon sx={{ color: '#4fc3f7 !important' }} />}
                                          label={`Freeze ${dayLabel(date)}`}
                                          sx={{ cursor: 'pointer', fontWeight: 600, background: theme.mix(0.08), color: theme.mix(0.85), '&:hover': { background: 'rgba(79,195,247,0.25)' } }} />
                                ))}
                            </Box>
                        </>
                    ) : (
                        <Typography sx={{ color: theme.mix(0.5), fontSize: '0.85rem' }}>
                            No missed days in the last week. Nice work!
                        </Typography>
                    )}

                    {status.recentFreezes.length > 0 && (
                        <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', alignItems: 'center', mt: 1.5 }}>
                            <Typography sx={{ color: theme.mix(0.45), fontSize: '0.75rem' }}>Frozen:</Typography>
                            {status.recentFreezes.map((date) => (
                                <Chip key={date} size="small" icon={<AcUnitIcon sx={{ color: '#1a1a2e !important' }} />} label={dayLabel(date)}
                                      sx={{ background: '#4fc3f7', color: '#1a1a2e', fontWeight: 600 }} />
                            ))}
                        </Box>
                    )}
                </Box>
            </CardContent>
        </Card>
    );
}

export default StreakFreezeCard;
