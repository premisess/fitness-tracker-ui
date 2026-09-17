import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { keyframes } from '@emotion/react';
import {
    Alert, AppBar, Box, Card, CardContent, CircularProgress, IconButton, LinearProgress, Toolbar, Typography,
} from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import EmojiEventsIcon from '@mui/icons-material/EmojiEvents';
import LocalFireDepartmentIcon from '@mui/icons-material/LocalFireDepartment';
import API from '../services/api';
import { errorMessage } from '../services/errors';
import { useAppTheme } from '../context/ThemeContext';
import BadgeIcon from '../components/BadgeIcon';
import StreakFreezeCard from '../components/StreakFreezeCard';

const flicker = keyframes`
  0%, 100% { transform: scale(1) rotate(-2deg); }
  50% { transform: scale(1.12) rotate(2deg); }
`;

const CATEGORY_ORDER = ['Workouts', 'Streaks', 'Running', 'Strength', 'Goals', 'Nutrition', 'Plans', 'Account'];

const isDistance = (badge) => badge.code.startsWith('RUN_') || badge.code.startsWith('DISTANCE_');

const progressText = (badge) => (isDistance(badge)
    ? `${(badge.progress / 1000).toFixed(1)} / ${badge.target / 1000} km`
    : `${badge.progress} / ${badge.target}`);

function Achievements() {
    const { theme } = useAppTheme();
    const navigate = useNavigate();
    const [board, setBoard] = useState(null);
    const [error, setError] = useState('');

    useEffect(() => {
        let ignore = false;
        API.get('/badges')
            .then((res) => { if (!ignore) setBoard(res.data); })
            .catch((err) => { if (!ignore) setError(errorMessage(err, 'Could not load your badges')); });
        return () => { ignore = true; };
    }, []);

    const cardStyle = { background: theme.mix(0.05), border: `1px solid ${theme.mix(0.1)}`, borderRadius: 3 };
    const categories = board
        ? CATEGORY_ORDER.filter((c) => board.badges.some((b) => b.category === c))
        : [];

    return (
        <Box sx={{ minHeight: '100vh', background: theme.bgGradient, fontFamily: "'Poppins', sans-serif" }}>
            <AppBar position="static" sx={{ background: theme.mix(0.05), backdropFilter: 'blur(10px)', boxShadow: 'none', borderBottom: `1px solid ${theme.mix(0.1)}` }}>
                <Toolbar>
                    <IconButton onClick={() => navigate('/dashboard')} sx={{ color: theme.mix(1), mr: 1 }} aria-label="Back to dashboard">
                        <ArrowBackIcon />
                    </IconButton>
                    <EmojiEventsIcon sx={{ color: '#ffa726', mr: 1 }} />
                    <Typography variant="h6" sx={{ color: theme.mix(1), fontWeight: 700 }}>Achievements</Typography>
                </Toolbar>
            </AppBar>

            <Box sx={{ maxWidth: 960, mx: 'auto', py: 4, px: 2 }}>
                {error && <Alert severity="error" sx={{ mb: 3 }}>{error}</Alert>}
                {!board && !error && <Box sx={{ textAlign: 'center', py: 8 }}><CircularProgress sx={{ color: '#e94560' }} /></Box>}

                {board && (
                    <>
                        <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr 1fr' }, gap: 2, mb: 4 }}>
                            <Card sx={{ ...cardStyle, background: 'linear-gradient(135deg, rgba(255,167,38,0.25), rgba(233,69,96,0.2))' }}>
                                <CardContent sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                                    <LocalFireDepartmentIcon sx={{
                                        fontSize: 54, color: board.currentStreak > 0 ? '#ffa726' : theme.mix(0.3),
                                        animation: board.currentStreak > 0 ? `${flicker} 1.6s ease-in-out infinite` : 'none',
                                        '@media (prefers-reduced-motion: reduce)': { animation: 'none' },
                                    }} />
                                    <Box>
                                        <Typography sx={{ color: theme.mix(1), fontSize: '2rem', fontWeight: 800, lineHeight: 1 }}>{board.currentStreak}</Typography>
                                        <Typography sx={{ color: theme.mix(0.6), fontSize: '0.85rem' }}>day streak</Typography>
                                    </Box>
                                </CardContent>
                            </Card>
                            <Card sx={cardStyle}>
                                <CardContent>
                                    <Typography sx={{ color: theme.mix(1), fontSize: '2rem', fontWeight: 800, lineHeight: 1 }}>{board.longestStreak}</Typography>
                                    <Typography sx={{ color: theme.mix(0.6), fontSize: '0.85rem' }}>longest streak (days)</Typography>
                                </CardContent>
                            </Card>
                            <Card sx={cardStyle}>
                                <CardContent>
                                    <Typography sx={{ color: theme.mix(1), fontSize: '2rem', fontWeight: 800, lineHeight: 1 }}>
                                        {board.earnedCount}<Typography component="span" sx={{ color: theme.mix(0.4), fontSize: '1rem' }}> / {board.totalCount}</Typography>
                                    </Typography>
                                    <Typography sx={{ color: theme.mix(0.6), fontSize: '0.85rem', mb: 1 }}>badges earned</Typography>
                                    <LinearProgress variant="determinate" value={(board.earnedCount / board.totalCount) * 100}
                                                    sx={{ height: 6, borderRadius: 3, background: theme.mix(0.1), '& .MuiLinearProgress-bar': { background: 'linear-gradient(90deg, #ffa726, #e94560)' } }} />
                                </CardContent>
                            </Card>
                        </Box>

                        <StreakFreezeCard theme={theme} onChange={(streak) => setBoard((b) => ({ ...b, currentStreak: streak.currentStreak, longestStreak: streak.longestStreak }))} />

                        {categories.map((category) => (
                            <Box key={category} sx={{ mb: 4 }}>
                                <Typography sx={{ color: theme.mix(0.8), fontWeight: 700, mb: 1.5, letterSpacing: 1 }}>{category}</Typography>
                                <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr', md: '1fr 1fr 1fr' }, gap: 2 }}>
                                    {board.badges.filter((b) => b.category === category).map((badge) => (
                                        <Card key={badge.code} sx={{ ...cardStyle, opacity: badge.earned ? 1 : 0.85 }}>
                                            <CardContent sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
                                                <BadgeIcon icon={badge.icon} category={badge.category} earned={badge.earned} size={56} />
                                                <Box sx={{ flex: 1, minWidth: 0 }}>
                                                    <Typography sx={{ color: theme.mix(badge.earned ? 1 : 0.7), fontWeight: 700 }}>{badge.title}</Typography>
                                                    <Typography sx={{ color: theme.mix(0.5), fontSize: '0.8rem' }}>{badge.description}</Typography>
                                                    {badge.earned ? (
                                                        <Typography sx={{ color: '#4ecdc4', fontSize: '0.75rem', mt: 0.5, fontWeight: 600 }}>
                                                            Earned {new Date(badge.earnedAt).toLocaleDateString()}
                                                        </Typography>
                                                    ) : (
                                                        <Box sx={{ mt: 0.75 }}>
                                                            <LinearProgress variant="determinate" value={(badge.progress / badge.target) * 100}
                                                                            sx={{ height: 5, borderRadius: 3, background: theme.mix(0.1), '& .MuiLinearProgress-bar': { background: theme.mix(0.45) } }} />
                                                            <Typography sx={{ color: theme.mix(0.45), fontSize: '0.7rem', mt: 0.3 }}>{progressText(badge)}</Typography>
                                                        </Box>
                                                    )}
                                                </Box>
                                            </CardContent>
                                        </Card>
                                    ))}
                                </Box>
                            </Box>
                        ))}
                    </>
                )}
            </Box>
        </Box>
    );
}

export default Achievements;
