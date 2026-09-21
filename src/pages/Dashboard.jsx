import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import API, { ACTIVITY_EVENT } from '../services/api';
import { errorMessage } from '../services/errors';
import { useAppTheme } from '../context/ThemeContext';
import {
    Alert, Box, Typography, Card, CardContent,
    Button, AppBar, Toolbar, IconButton, Avatar, LinearProgress, useMediaQuery
} from '@mui/material';
import FitnessCenterIcon from '@mui/icons-material/FitnessCenter';
import LocalFireDepartmentIcon from '@mui/icons-material/LocalFireDepartment';
import TrackChangesIcon from '@mui/icons-material/TrackChanges';
import WaterDropIcon from '@mui/icons-material/WaterDrop';
import LogoutIcon from '@mui/icons-material/Logout';
import DarkModeIcon from '@mui/icons-material/DarkMode';
import LightModeIcon from '@mui/icons-material/LightMode';
import RestaurantIcon from '@mui/icons-material/Restaurant';
import EmojiEventsIcon from '@mui/icons-material/EmojiEvents';
import EventNoteIcon from '@mui/icons-material/EventNote';
import WorkspacePremiumIcon from '@mui/icons-material/WorkspacePremium';
import SelfImprovementIcon from '@mui/icons-material/SelfImprovement';
import DirectionsRunIcon from '@mui/icons-material/DirectionsRun';
import BarChartIcon from '@mui/icons-material/BarChart';
import HistoryIcon from '@mui/icons-material/History';
import PersonIcon from '@mui/icons-material/Person';
import SettingsIcon from '@mui/icons-material/Settings';
import HomeIcon from '@mui/icons-material/Home';

const FONT = "'Poppins', sans-serif";

function Dashboard() {
    const { theme, mode, toggleTheme } = useAppTheme();
    const navigate = useNavigate();
    const location = useLocation();
    const wide = useMediaQuery('(min-width:900px)');
    // The backend aggregates everything this screen shows into one call.
    const [summary, setSummary] = useState(null);

    const [verifyNotice, setVerifyNotice] = useState('');
    const [resending, setResending] = useState(false);

    const name = summary?.name || localStorage.getItem('name');

    async function fetchSummary() {
        try {
            const res = await API.get('/dashboard/summary');
            setSummary(res.data);
        } catch (err) {
            console.error('Error fetching dashboard summary', err);
        }
    }

    async function handleLogout() {
        try {
            await API.post('/auth/logout');
        } catch {
            // Session may already be gone server-side — clear local state anyway.
        }
        localStorage.clear();
        navigate('/login');
    }

    async function resendVerification() {
        setResending(true);
        try {
            const res = await API.post('/auth/resend-verification');
            setVerifyNotice(res.data?.message || 'Verification link sent.');
        } catch (err) {
            setVerifyNotice(errorMessage(err, 'Could not send the link. Please try again in a minute.'));
        } finally {
            setResending(false);
        }
    }

    useEffect(() => {
        const init = async () => {
            await fetchSummary();
            // Celebrates any badge earned since the last visit.
            window.dispatchEvent(new Event(ACTIVITY_EVENT));
        };
        init();
    }, []);;

    // Sections people reach from the dashboard, grouped into main and account.
    const navMain = [
        { label: 'Dashboard', path: '/dashboard', icon: <HomeIcon /> },
        { label: 'Workout', path: '/workouts', icon: <FitnessCenterIcon /> },
        { label: 'Exercises', path: '/exercises', icon: <SelfImprovementIcon /> },
        { label: 'Goals', path: '/goals', icon: <TrackChangesIcon /> },
        { label: 'Runs', path: '/runs', icon: <DirectionsRunIcon /> },
        { label: 'Nutrition', path: '/nutrition', icon: <RestaurantIcon /> },
        { label: 'Analytics', path: '/analytics', icon: <BarChartIcon /> },
        { label: 'Records', path: '/records', icon: <HistoryIcon /> },
    ];
    const navAccount = [
        { label: 'My Profile', path: '/profile', icon: <PersonIcon /> },
        { label: 'Settings', path: '/account-settings', icon: <SettingsIcon /> },
    ];
    const allNav = [...navMain, ...navAccount];

    const isActive = (path) => location.pathname === path || location.pathname.startsWith(path + '/');

    const navButtonStyle = (item, desktop) => ({
        justifyContent: 'flex-start', textTransform: 'none', fontFamily: FONT, fontWeight: 600,
        fontSize: desktop ? '0.9rem' : '0.8rem', borderRadius: 2,
        ...(desktop ? { py: 1.1, px: 2, mb: 0.5 } : { px: 1.6, py: 0.9, borderRadius: 999, whiteSpace: 'nowrap' }),
        color: isActive(item.path) ? '#e94560' : theme.mix(0.7),
        background: isActive(item.path) ? 'rgba(233,69,96,0.12)' : 'transparent',
        ...(desktop
            ? { '&:hover': { background: theme.mix(0.08), color: theme.mix(1) } }
            : { border: `1px solid ${isActive(item.path) ? 'rgba(233,69,96,0.4)' : theme.mix(0.12)}`,
                '&:hover': { background: theme.mix(0.06), color: theme.mix(1) } }),
    });

    const statCards = [
        { title: 'Total Workouts', value: summary?.workoutCount ?? 0, icon: <FitnessCenterIcon sx={{ fontSize: 40, color: '#e94560' }} />, unit: 'sessions' },
        { title: 'Calories Burned', value: summary?.totalCaloriesBurned ?? 0, icon: <LocalFireDepartmentIcon sx={{ fontSize: 40, color: '#ff6b35' }} />, unit: 'kcal' },
        { title: 'Active Goals', value: summary?.activeGoalCount ?? 0, icon: <TrackChangesIcon sx={{ fontSize: 40, color: '#4ecdc4' }} />, unit: 'goals' },
        { title: 'Water Today', value: summary?.waterTodayMl ?? 0, icon: <WaterDropIcon sx={{ fontSize: 40, color: '#45b7d1' }} />, unit: 'ml' },
        { title: 'Current Streak', value: summary?.currentStreak ?? 0, icon: <LocalFireDepartmentIcon sx={{ fontSize: 40, color: '#ffa726' }} />, unit: 'days' },
        { title: 'Longest Streak', value: summary?.longestStreak ?? 0, icon: <LocalFireDepartmentIcon sx={{ fontSize: 40, color: '#a29bfe' }} />, unit: 'days' },
        { title: 'Eaten Today', value: summary?.caloriesEatenToday ?? 0, icon: <RestaurantIcon sx={{ fontSize: 40, color: '#ff6b35' }} />, unit: `of ${summary?.calorieTarget ?? 2000} kcal` },
        { title: 'Badges', value: summary?.badgesEarned ?? 0, icon: <EmojiEventsIcon sx={{ fontSize: 40, color: '#ffd166' }} />, unit: 'earned' },
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
            fontFamily: FONT,
        }}>
            <AppBar position="static" sx={{
                background: theme.mix(0.05),
                backdropFilter: 'blur(10px)',
                boxShadow: 'none',
                borderBottom: `1px solid ${theme.mix(0.1)}`
            }}>
                <Toolbar>
                    <FitnessCenterIcon sx={{ color: '#e94560', mr: 1 }} />
                    <Typography variant="h6" sx={{
                        color: theme.mix(1),
                        fontWeight: 700,
                        flexGrow: 1,
                        fontFamily: FONT,
                        letterSpacing: 1
                    }}>
                        FitTracker
                    </Typography>
                    <Button size="small" startIcon={<WorkspacePremiumIcon />} onClick={() => navigate('/upgrade')}
                            sx={{
                                mr: 2, borderRadius: 999, px: 1.5, textTransform: 'none', fontWeight: 700,
                                color: '#1a1a2e', background: summary?.ultimate ? '#ffd166' : 'linear-gradient(90deg, #ffd166, #e94560)',
                                '&:hover': { background: '#ffd166' },
                            }}>
                        {summary?.ultimate ? 'Ultimate' : 'Go Ultimate'}
                    </Button>
                    <Avatar sx={{ bgcolor: '#e94560', mr: 2, width: 35, height: 35, fontSize: '0.9rem' }}>
                        {name?.charAt(0).toUpperCase()}
                    </Avatar>
                    <IconButton onClick={toggleTheme} sx={{ color: theme.mix(0.7), mr: 0.5 }}>
                        {mode === 'dark' ? <LightModeIcon /> : <DarkModeIcon />}
                    </IconButton>
                    <IconButton onClick={handleLogout} sx={{ color: theme.mix(0.7) }}>
                        <LogoutIcon />
                    </IconButton>
                </Toolbar>
            </AppBar>

            <Box sx={{ display: 'flex', flexDirection: { xs: 'column', md: 'row' }, alignItems: 'stretch', minHeight: 'calc(100vh - 64px)' }}>
                {/* Desktop glass sidebar */}
                {wide && (
                    <Box sx={{
                        width: 240, flexShrink: 0, display: 'flex', flexDirection: 'column',
                        px: 2, py: 3, gap: 0.5,
                        background: 'rgba(255,255,255,0.04)', backdropFilter: 'blur(12px)',
                        borderRight: `1px solid ${theme.mix(0.08)}`,
                    }}>
                        <Typography sx={{ color: theme.mix(0.4), fontSize: '0.65rem', fontWeight: 700, letterSpacing: 2, textTransform: 'uppercase', px: 2, mb: 0.5, fontFamily: FONT }}>
                            Menu
                        </Typography>
                        {navMain.map((item) => (
                            <Button key={item.path} onClick={() => navigate(item.path)} startIcon={item.icon} sx={navButtonStyle(item, true)}>
                                {item.label}
                            </Button>
                        ))}
                        <Box sx={{ flex: 1 }} />
                        <Typography sx={{ color: theme.mix(0.4), fontSize: '0.65rem', fontWeight: 700, letterSpacing: 2, textTransform: 'uppercase', px: 2, mb: 0.5, fontFamily: FONT }}>
                            Account
                        </Typography>
                        {navAccount.map((item) => (
                            <Button key={item.path} onClick={() => navigate(item.path)} startIcon={item.icon} sx={navButtonStyle(item, true)}>
                                {item.label}
                            </Button>
                        ))}
                    </Box>
                )}

                {/* Mobile glass nav row */}
                {!wide && (
                    <Box sx={{
                        display: 'flex', overflowX: 'auto', px: 2, py: 1.5, gap: 1,
                        background: 'rgba(255,255,255,0.04)', backdropFilter: 'blur(12px)',
                        borderBottom: `1px solid ${theme.mix(0.08)}`,
                        '&::-webkit-scrollbar': { display: 'none' },
                    }}>
                        {allNav.map((item) => (
                            <Button key={item.path} onClick={() => navigate(item.path)} startIcon={item.icon} sx={navButtonStyle(item, false)}>
                                {item.label}
                            </Button>
                        ))}
                    </Box>
                )}

                {/* Main content */}
                <Box sx={{
                    flex: 1, minWidth: 0,
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    py: { xs: 4, md: 6 },
                    px: 2,
                }}>
                    {/* Welcome */}
                    <Typography variant="h4" sx={{
                        color: theme.mix(1),
                        fontWeight: 700,
                        mb: 1,
                        fontFamily: FONT,
                        letterSpacing: 1,
                        textAlign: 'center'
                    }}>
                        {`Welcome, ${name}`}
                    </Typography>
                    <Typography variant="body1" sx={{
                        color: theme.mix(0.5),
                        mb: 5,
                        fontFamily: FONT,
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
                            Please confirm your email address — we sent a link to {localStorage.getItem('email')}.
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
                                    <Typography sx={{ color: theme.mix(1), fontWeight: 700, fontFamily: FONT }}>
                                        {summary.activePlanName}
                                    </Typography>
                                    <Typography sx={{ color: theme.mix(0.6), fontSize: '0.85rem', fontFamily: FONT }}>
                                        {summary.nextPlanSession ? `Next up: ${summary.nextPlanSession}` : 'Plan complete — pick a new one'}
                                    </Typography>
                                    <LinearProgress variant="determinate" value={summary.planProgressPercent ?? 0}
                                                    sx={{ mt: 1, height: 6, borderRadius: 3, background: theme.mix(0.12), '& .MuiLinearProgress-bar': { background: 'linear-gradient(90deg, #66bb6a, #4ecdc4)' } }} />
                                </Box>
                                <Typography sx={{ color: '#66bb6a', fontWeight: 700, fontFamily: FONT }}>
                                    {summary.planProgressPercent ?? 0}%
                                </Typography>
                            </CardContent>
                        </Card>
                    )}

                    {/* Stat Cards */}
                    <Box sx={{
                        display: 'flex',
                        flexWrap: 'wrap',
                        gap: 3,
                        justifyContent: 'center',
                        mb: 5,
                        width: '100%',
                        maxWidth: 900,
                    }}>
                        {statCards.map((card, index) => (
                            <Box key={index} sx={{ width: 210 }}>
                                <Card sx={{
                                    background: theme.mix(0.05),
                                    backdropFilter: 'blur(10px)',
                                    border: `1px solid ${theme.mix(0.1)}`,
                                    borderRadius: 3,
                                    transition: 'transform 0.2s',
                                    '&:hover': { transform: 'translateY(-5px)' }
                                }}>
                                    <CardContent sx={{ textAlign: 'center' }}>
                                        {card.icon}
                                        <Typography variant="h4" sx={{
                                            color: theme.mix(1),
                                            fontWeight: 700,
                                            mt: 1,
                                            fontFamily: FONT
                                        }}>
                                            {card.value}
                                        </Typography>
                                        <Typography variant="body2" sx={{
                                            color: theme.mix(0.5),
                                            fontFamily: FONT
                                        }}>
                                            {card.title}
                                        </Typography>
                                        <Typography variant="caption" sx={{
                                            color: theme.mix(0.3),
                                            fontFamily: FONT
                                        }}>
                                            {card.unit}
                                        </Typography>
                                    </CardContent>
                                </Card>
                            </Box>
                        ))}
                    </Box>

                    {/* Journey Guide */}
                    <Box sx={{ width: '100%', maxWidth: 700 }}>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                            <Typography variant="h6" sx={{
                                color: theme.mix(1), fontWeight: 700,
                                fontFamily: FONT, letterSpacing: 1
                            }}>
                                Your Fitness Journey
                            </Typography>
                            <Typography sx={{ color: '#4ecdc4', fontWeight: 700, fontFamily: FONT, fontSize: '0.85rem' }}>
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
                                     onClick={() => !item.done && navigate(item.path)}
                                     sx={{
                                         display: 'flex', alignItems: 'center', gap: 2,
                                         p: 2, borderRadius: 2,
                                         cursor: item.done ? 'default' : 'pointer',
                                         background: item.done ? 'rgba(78,205,196,0.1)' : theme.mix(0.03),
                                         border: `1px solid ${item.done ? '#4ecdc4' : theme.mix(0.1)}`,
                                         transition: 'all 0.2s',
                                         '&:hover': {
                                             background: item.done ? 'rgba(78,205,196,0.1)' : theme.mix(0.07)
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
                                            fontWeight: 600, fontFamily: FONT,
                                            fontSize: '0.9rem',
                                            textDecoration: item.done ? 'line-through' : 'none'
                                        }}>
                                            {item.label}
                                        </Typography>
                                        <Typography sx={{ color: theme.mix(0.4), fontSize: '0.75rem', fontFamily: FONT }}>
                                            {item.description}
                                        </Typography>
                                    </Box>
                                    {!item.done && (
                                        <Typography sx={{ color: item.color, fontSize: '0.75rem', fontFamily: FONT, fontWeight: 600 }}>
                                            Go →
                                        </Typography>
                                    )}
                                </Box>
                            ))}
                        </Box>
                    </Box>
                </Box>
            </Box>
        </Box>
    );
}

export default Dashboard;