import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import API, { ACTIVITY_EVENT } from '../services/api';
import { errorMessage } from '../services/errors';
import { useAppTheme } from '../context/ThemeContext';
import { glassCard } from '../theme/styles';
import {
    Alert, Box, Typography, Card, CardContent,
    Button, IconButton, Avatar, LinearProgress
} from '@mui/material';
import FitnessCenterIcon from '@mui/icons-material/FitnessCenter';
import LocalFireDepartmentIcon from '@mui/icons-material/LocalFireDepartment';
import TrackChangesIcon from '@mui/icons-material/TrackChanges';
import WaterDropIcon from '@mui/icons-material/WaterDrop';
import RestaurantIcon from '@mui/icons-material/Restaurant';
import EmojiEventsIcon from '@mui/icons-material/EmojiEvents';
import LogoutIcon from '@mui/icons-material/Logout';
import DarkModeIcon from '@mui/icons-material/DarkMode';
import LightModeIcon from '@mui/icons-material/LightMode';
import EventNoteIcon from '@mui/icons-material/EventNote';

function Dashboard() {
    const { theme, mode, toggleTheme } = useAppTheme();
    // The backend aggregates everything this screen shows into one call.
    const [summary, setSummary] = useState(null);

    const [verifyNotice, setVerifyNotice] = useState('');
    const [resending, setResending] = useState(false);

    const name = summary?.name || localStorage.getItem('name');
    const navigate = useNavigate();

    const fetchSummary = async () => {
        try {
            const res = await API.get('/dashboard/summary');
            setSummary(res.data);
        } catch (err) {
            console.error('Error fetching dashboard summary', err);
        }
    };

    useEffect(() => {
        const init = async () => {
            await fetchSummary();
            // Celebrates any badge earned since the last visit.
            window.dispatchEvent(new Event(ACTIVITY_EVENT));
        };
        init();
    }, []);

    const handleLogout = async () => {
        try {
            await API.post('/auth/logout');
        } catch {
            // Session may already be gone server-side — clear local state anyway.
        }
        localStorage.clear();
        navigate('/login');
    };

    const resendVerification = async () => {
        setResending(true);
        try {
            const res = await API.post('/auth/resend-verification');
            setVerifyNotice(res.data?.message || 'Verification link sent.');
        } catch (err) {
            setVerifyNotice(errorMessage(err, 'Could not send the link. Please try again in a minute.'));
        } finally {
            setResending(false);
        }
    };

    // Each card opens the page where that number comes from.
    const statCards = [
        { title: 'Total Workouts', value: summary?.workoutCount ?? 0, Icon: FitnessCenterIcon, color: '#e94560', unit: 'sessions', path: '/workouts' },
        { title: 'Calories Burned', value: summary?.totalCaloriesBurned ?? 0, Icon: LocalFireDepartmentIcon, color: '#ff6b35', unit: 'kcal', path: '/analytics' },
        { title: 'Active Goals', value: summary?.activeGoalCount ?? 0, Icon: TrackChangesIcon, color: '#4ecdc4', unit: 'goals', path: '/goals' },
        { title: 'Water Today', value: summary?.waterTodayMl ?? 0, Icon: WaterDropIcon, color: '#45b7d1', unit: 'ml', path: '/water-intake' },
        { title: 'Current Streak', value: summary?.currentStreak ?? 0, Icon: LocalFireDepartmentIcon, color: '#ffa726', unit: 'days', path: '/achievements' },
        { title: 'Longest Streak', value: summary?.longestStreak ?? 0, Icon: LocalFireDepartmentIcon, color: '#a29bfe', unit: 'days', path: '/achievements' },
        { title: 'Eaten Today', value: summary?.caloriesEatenToday ?? 0, Icon: RestaurantIcon, color: '#ff6b35', unit: `of ${summary?.calorieTarget ?? 2000} kcal`, path: '/nutrition' },
        { title: 'Badges', value: summary?.badgesEarned ?? 0, Icon: EmojiEventsIcon, color: '#ffd166', unit: 'earned', path: '/achievements' },
    ];

    const journeySteps = [
        {
            step: 1,
            label: 'Complete your profile',
            description: 'Add your weight, height, age and gender',
            done: !!summary?.profileComplete,
            path: '/profile',
            color: '#a29bfe'
        },
        {
            step: 2,
            label: 'Set a fitness goal',
            description: 'Choose what you want to achieve',
            done: (summary?.goalCount ?? 0) > 0,
            path: '/goals',
            color: '#4ecdc4'
        },
        {
            step: 3,
            label: 'Log your first workout',
            description: 'Track your physical activity',
            done: (summary?.workoutCount ?? 0) > 0,
            path: '/workouts',
            color: '#e94560'
        },
        {
            step: 4,
            label: 'Track your water intake',
            description: 'Stay hydrated every day',
            done: !!summary?.hasWaterLog,
            path: '/water-intake',
            color: '#45b7d1'
        },
    ];

    const completedSteps = journeySteps.filter(s => s.done).length;

    return (
        <Box sx={{
            minHeight: '100vh',
            background: theme.bgGradient,
            fontFamily: "'Poppins', sans-serif",
            position: 'relative',
        }}>
            {/* Colourful glow blobs behind the glass cards */}
            <Box sx={{ position: 'fixed', inset: 0, zIndex: 0, pointerEvents: 'none', overflow: 'hidden' }}>
                <Box sx={{ position: 'absolute', width: 460, height: 460, borderRadius: '50%', top: '-10%', left: '-8%',
                    background: 'radial-gradient(circle, rgba(233,69,96,0.28), transparent 70%)', filter: 'blur(55px)' }} />
                <Box sx={{ position: 'absolute', width: 480, height: 480, borderRadius: '50%', top: '24%', right: '-12%',
                    background: 'radial-gradient(circle, rgba(78,205,196,0.25), transparent 70%)', filter: 'blur(65px)' }} />
                <Box sx={{ position: 'absolute', width: 420, height: 420, borderRadius: '50%', bottom: '-14%', left: '30%',
                    background: 'radial-gradient(circle, rgba(255,209,102,0.2), transparent 70%)', filter: 'blur(55px)' }} />
            </Box>

            <Box sx={{
                position: 'sticky', top: 0, zIndex: 10,
                background: theme.mix(0.04),
                backdropFilter: 'blur(14px)', WebkitBackdropFilter: 'blur(14px)',
                borderBottom: `1px solid ${theme.mix(0.08)}`,
            }}>
                <Box sx={{
                    width: '100%',
                    display: 'flex', alignItems: 'center',
                    px: { xs: 2, md: 3 }, py: 2,
                }}>
                    <Box component={Link} to="/" sx={{ textDecoration: 'none' }}>
                        <Typography variant="h6" sx={{ color: theme.mix(1), fontWeight: 800, letterSpacing: 1, fontFamily: "'Poppins', sans-serif" }}>
                            FitTracker
                        </Typography>
                    </Box>
                    <Box sx={{ flexGrow: 1 }} />
                    <Avatar onClick={() => navigate('/profile')} sx={{
                        bgcolor: '#e94560', mr: 1, width: 35, height: 35, fontSize: '0.9rem',
                        cursor: 'pointer', boxShadow: '0 0 14px rgba(233,69,96,0.4)',
                    }}>
                        {name?.charAt(0).toUpperCase()}
                    </Avatar>
                    <IconButton onClick={toggleTheme} sx={{ color: theme.mix(0.7), mr: 0.5 }}>
                        {mode === 'dark' ? <LightModeIcon /> : <DarkModeIcon />}
                    </IconButton>
                    <IconButton onClick={handleLogout} sx={{ color: theme.mix(0.7) }}>
                        <LogoutIcon />
                    </IconButton>
                </Box>
            </Box>

            <Box sx={{
                position: 'relative', zIndex: 1,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                py: 6,
                px: 2,
            }}>
                {/* Welcome */}
                <Typography variant="h4" sx={{
                    color: theme.mix(1),
                    fontWeight: 700,
                    mb: 1,
                    fontFamily: "'Poppins', sans-serif",
                    letterSpacing: 1,
                    textAlign: 'center'
                }}>
                    {`Welcome, ${name}`}
                </Typography>
                <Typography variant="body1" sx={{
                    color: theme.mix(0.5),
                    mb: 5,
                    fontFamily: "'Poppins', sans-serif",
                    textAlign: 'center'
                }}>
                    {summary?.nextStep || 'Here is your fitness summary'}
                </Typography>

                {summary && !summary.emailVerified && (
                    <Alert severity="warning" sx={{ mb: 4, width: '100%', maxWidth: 700 }}
                           action={(
                               <Button color="inherit" size="small" disabled={resending} onClick={resendVerification}>
                                   Resend link
                               </Button>
                           )}>
                        Please confirm your email address. We sent a link to {localStorage.getItem('email')}.
                        {verifyNotice && <Typography sx={{ fontSize: '0.8rem', mt: 0.5 }}>{verifyNotice}</Typography>}
                    </Alert>
                )}

                {summary?.activePlanName && (
                    <Card onClick={() => navigate('/plans')} sx={{
                        width: '100%', maxWidth: 700, mb: 4, cursor: 'pointer',
                        background: 'linear-gradient(135deg, rgba(102,187,106,0.18), rgba(78,205,196,0.12))',
                        border: `1px solid ${theme.mix(0.1)}`, borderRadius: 3,
                        transition: 'transform 0.2s',
                        '&:hover': { transform: 'translateY(-3px)' },
                    }}>
                        <CardContent sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                            <EventNoteIcon sx={{ fontSize: 40, color: '#66bb6a' }} />
                            <Box sx={{ flex: 1, minWidth: 0 }}>
                                <Typography sx={{ color: theme.mix(1), fontWeight: 700, fontFamily: "'Poppins', sans-serif" }}>
                                    {summary.activePlanName}
                                </Typography>
                                <Typography sx={{ color: theme.mix(0.6), fontSize: '0.85rem', fontFamily: "'Poppins', sans-serif" }}>
                                    {summary.nextPlanSession ? `Next up: ${summary.nextPlanSession}` : 'Plan complete, pick a new one'}
                                </Typography>
                                <LinearProgress variant="determinate" value={summary.planProgressPercent ?? 0}
                                                sx={{ mt: 1, height: 6, borderRadius: 3, background: theme.mix(0.12), '& .MuiLinearProgress-bar': { background: 'linear-gradient(90deg, #66bb6a, #4ecdc4)' } }} />
                            </Box>
                            <Typography sx={{ color: '#66bb6a', fontWeight: 700, fontFamily: "'Poppins', sans-serif" }}>
                                {summary.planProgressPercent ?? 0}%
                            </Typography>
                        </CardContent>
                    </Card>
                )}

                {/* Stat Cards: click one to open its page */}
                <Box sx={{
                    display: 'grid',
                    gridTemplateColumns: { xs: 'repeat(2, 1fr)', md: 'repeat(4, 1fr)' },
                    gap: 2,
                    width: '100%',
                    maxWidth: 800,
                }}>
                    {statCards.map((card) => (
                        <Card key={card.title} component={Link} to={card.path} sx={{
                            ...glassCard(theme),
                            display: 'block', textDecoration: 'none',
                            transition: 'transform 0.2s, border-color 0.2s',
                            '&:hover': { transform: 'translateY(-4px)', borderColor: card.color },
                        }}>
                            <CardContent sx={{ textAlign: 'center', py: 2.5 }}>
                                <card.Icon sx={{ fontSize: 36, color: card.color }} />
                                <Typography variant="h4" sx={{ color: theme.mix(1), fontWeight: 700, mt: 1, fontFamily: "'Poppins', sans-serif" }}>
                                    {card.value}
                                </Typography>
                                <Typography sx={{ color: theme.mix(0.8), fontWeight: 600, fontSize: '0.85rem', fontFamily: "'Poppins', sans-serif" }}>
                                    {card.title}
                                </Typography>
                                <Typography variant="caption" sx={{ color: theme.mix(0.4), fontFamily: "'Poppins', sans-serif" }}>
                                    {card.unit}
                                </Typography>
                            </CardContent>
                        </Card>
                    ))}
                </Box>

                {/* Journey Guide */}
                <Box sx={{ mt: 5, width: '100%', maxWidth: 700 }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                        <Typography variant="h6" sx={{
                            color: theme.mix(1), fontWeight: 700,
                            fontFamily: "'Poppins', sans-serif", letterSpacing: 1
                        }}>
                            Your Fitness Journey
                        </Typography>
                        <Typography sx={{ color: '#4ecdc4', fontWeight: 700, fontFamily: "'Poppins', sans-serif", fontSize: '0.85rem' }}>
                            {completedSteps}/{journeySteps.length} completed
                        </Typography>
                    </Box>

                    {/* Progress Bar */}
                    <Box sx={{ width: '100%', height: 6, background: theme.mix(0.1), borderRadius: 3, mb: 3 }}>
                        <Box sx={{
                            width: `${(completedSteps / journeySteps.length) * 100}%`,
                            height: '100%',
                            background: 'linear-gradient(90deg, #4ecdc4, #45b7d1)',
                            borderRadius: 3,
                            transition: 'width 0.5s'
                        }} />
                    </Box>

                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
                        {journeySteps.map((item) => (
                            <Box key={item.step}
                                 onClick={() => navigate(item.path)}
                                 sx={{
                                     display: 'flex', alignItems: 'center', gap: 2,
                                     p: 2, borderRadius: 2,
                                     cursor: 'pointer',
                                     background: item.done ? 'rgba(78,205,196,0.12)' : theme.mix(0.04),
                                     backdropFilter: 'blur(10px)', WebkitBackdropFilter: 'blur(10px)',
                                     border: `1px solid ${item.done ? '#4ecdc4' : theme.mix(0.1)}`,
                                     transition: 'all 0.2s',
                                     '&:hover': {
                                         background: item.done ? 'rgba(78,205,196,0.18)' : theme.mix(0.07)
                                     }
                                 }}>
                                <Box sx={{
                                    width: 36, height: 36, borderRadius: '50%',
                                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                                    background: item.done ? '#4ecdc4' : item.color,
                                    flexShrink: 0
                                }}>
                                    <Typography sx={{ color: theme.mix(1), fontWeight: 700, fontSize: '0.85rem' }}>
                                        {item.done ? '✓' : item.step}
                                    </Typography>
                                </Box>
                                <Box sx={{ flex: 1 }}>
                                    <Typography sx={{
                                        color: item.done ? '#4ecdc4' : theme.mix(1),
                                        fontWeight: 600, fontFamily: "'Poppins', sans-serif",
                                        fontSize: '0.9rem',
                                        textDecoration: item.done ? 'line-through' : 'none'
                                    }}>
                                        {item.label}
                                    </Typography>
                                    <Typography sx={{ color: theme.mix(0.4), fontSize: '0.75rem', fontFamily: "'Poppins', sans-serif" }}>
                                        {item.description}
                                    </Typography>
                                </Box>
                                <Typography sx={{ color: item.done ? '#4ecdc4' : item.color, fontSize: '0.75rem', fontFamily: "'Poppins', sans-serif", fontWeight: 600 }}>
                                    {item.done ? 'Open →' : 'Go →'}
                                </Typography>
                            </Box>
                        ))}
                    </Box>
                </Box>
            </Box>
        </Box>
    );
}

export default Dashboard;