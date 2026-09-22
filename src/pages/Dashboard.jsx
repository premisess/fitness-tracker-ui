import { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import API, { ACTIVITY_EVENT } from '../services/api';
import { errorMessage } from '../services/errors';
import { useAppTheme } from '../context/ThemeContext';
import {
    Alert, Avatar, Box, Button, Card, CardContent, IconButton,
    Tooltip, Typography, useMediaQuery,
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
import WorkspacePremiumIcon from '@mui/icons-material/WorkspacePremium';
import DashboardIcon from '@mui/icons-material/Dashboard';
import MenuBookIcon from '@mui/icons-material/MenuBook';
import CalendarMonthIcon from '@mui/icons-material/CalendarMonth';
import DirectionsRunIcon from '@mui/icons-material/DirectionsRun';
import BarChartIcon from '@mui/icons-material/BarChart';
import SettingsIcon from '@mui/icons-material/Settings';
import HistoryIcon from '@mui/icons-material/History';
import CheckIcon from '@mui/icons-material/Check';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import MenuIcon from '@mui/icons-material/Menu';
import MenuOpenIcon from '@mui/icons-material/MenuOpen';

const FONT = "'Poppins', sans-serif";

const SIDE_SECTIONS = [
    {
        heading: 'MAIN',
        items: [
            { label: 'Dashboard', icon: <DashboardIcon />, color: '#4ecdc4', to: '/dashboard' },
            { label: 'Log Workout', icon: <FitnessCenterIcon />, color: '#e94560', to: '/workouts' },
            { label: 'My Goals', icon: <TrackChangesIcon />, color: '#a29bfe', to: '/goals' },
            { label: 'Water Intake', icon: <WaterDropIcon />, color: '#45b7d1', to: '/water-intake' },
            { label: 'Food Diary', icon: <RestaurantIcon />, color: '#ff6b35', to: '/nutrition' },
            { label: 'Workout Plans', icon: <CalendarMonthIcon />, color: '#66bb6a', to: '/plans' },
            { label: 'Achievements', icon: <EmojiEventsIcon />, color: '#ffd166', to: '/achievements' },
        ],
    },
    {
        heading: 'ACTIVITY',
        items: [
            { label: 'Activities', icon: <DirectionsRunIcon />, color: '#45b7d1', to: '/runs' },
            { label: 'Exercises', icon: <MenuBookIcon />, color: '#ffa726', to: '/exercises' },
            { label: 'Records', icon: <HistoryIcon />, color: '#ffa726', to: '/records' },
            { label: 'Analytics', icon: <BarChartIcon />, color: '#4ecdc4', to: '/analytics' },
        ],
    },
];

function Dashboard() {
    const { theme, mode, toggleTheme } = useAppTheme();
    const location = useLocation();
    const navigate = useNavigate();
    const md = useMediaQuery('(min-width:900px)');

    const [summary, setSummary] = useState(null);
    const [verifyNotice, setVerifyNotice] = useState('');
    const [resending, setResending] = useState(false);
    const [collapsed, setCollapsed] = useState(false);
    const [drawerOpen, setDrawerOpen] = useState(false);

    const name = summary?.name || localStorage.getItem('name') || 'there';

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

    const go = (path) => {
        navigate(path);
        setDrawerOpen(false);
    };

    const isActive = (item) => {
        const p = location.pathname;
        if (item.to === '/dashboard') return p === '/dashboard';
        if (item.to === '/plans') return p.startsWith('/plans');
        if (item.to === '/runs') return p.startsWith('/runs') || p.startsWith('/run');
        if (item.to === '/exercises') return p.startsWith('/exercises');
        if (item.to === '/workouts') return p.startsWith('/workouts');
        if (item.to === '/records') return p.startsWith('/records');
        return p.startsWith(item.to);
    };

    const statCards = [
        { title: 'Total Workouts', value: summary?.workoutCount ?? 0, icon: <FitnessCenterIcon />, color: '#e94560', unit: 'sessions' },
        { title: 'Calories Burned', value: summary?.totalCaloriesBurned ?? 0, icon: <LocalFireDepartmentIcon />, color: '#ff6b35', unit: 'kcal' },
        { title: 'Active Goals', value: summary?.activeGoalCount ?? 0, icon: <TrackChangesIcon />, color: '#4ecdc4', unit: 'goals' },
        { title: 'Water Today', value: summary?.waterTodayMl ?? 0, icon: <WaterDropIcon />, color: '#45b7d1', unit: 'ml' },
        { title: 'Current Streak', value: summary?.currentStreak ?? 0, icon: <LocalFireDepartmentIcon />, color: '#ffa726', unit: 'days' },
        { title: 'Longest Streak', value: summary?.longestStreak ?? 0, icon: <LocalFireDepartmentIcon />, color: '#a29bfe', unit: 'days' },
        { title: 'Eaten Today', value: summary?.caloriesEatenToday ?? 0, icon: <RestaurantIcon />, color: '#ff6b35', unit: `of ${summary?.calorieTarget ?? 2000} kcal` },
        { title: 'Badges', value: summary?.badgesEarned ?? 0, icon: <EmojiEventsIcon />, color: '#ffd166', unit: 'earned' },
    ];

    const journeySteps = [
        {
            step: 1, label: 'Complete your profile', description: 'Add your weight, height, age and gender',
            done: !!summary?.profileComplete, path: '/profile', color: '#a29bfe',
        },
        {
            step: 2, label: 'Set a fitness goal', description: 'Choose what you want to achieve',
            done: (summary?.goalCount ?? 0) > 0, path: '/goals', color: '#4ecdc4',
        },
        {
            step: 3, label: 'Log your first workout', description: 'Track your physical activity',
            done: (summary?.workoutCount ?? 0) > 0, path: '/workouts', color: '#e94560',
        },
        {
            step: 4, label: 'Track your water intake', description: 'Stay hydrated every day',
            done: !!summary?.hasWaterLog, path: '/water-intake', color: '#45b7d1',
        },
    ];

    const completedSteps = journeySteps.filter((s) => s.done).length;

    const sidebarWidth = md ? (collapsed ? 76 : 248) : 248;

    const renderNavItem = (item, showLabels) => {
        const active = isActive(item);
        const button = (
            <Box onClick={() => go(item.to)} role="button" tabIndex={0}
                 onKeyDown={(e) => { if (e.key === 'Enter') go(item.to); }}
                 sx={{
                     display: 'flex', alignItems: 'center', gap: 2,
                     width: '100%', py: 1.25, mb: 0.35,
                     justifyContent: collapsed && !showLabels ? 'center' : 'flex-start',
                     px: collapsed && !showLabels ? 0 : 1.75,
                     borderRadius: 2, cursor: 'pointer',
                     background: active ? `${item.color}1A` : 'transparent',
                     boxShadow: active ? `0 0 16px ${item.color}30` : 'none',
                     color: active ? item.color : theme.mix(0.7),
                     transition: 'background 0.2s, color 0.2s, box-shadow 0.2s',
                     '&:hover': { background: theme.mix(0.06), color: theme.mix(1) },
                 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: 24, flexShrink: 0 }}>
                    {item.icon}
                </Box>
                {showLabels && (
                    <Typography sx={{ fontWeight: active ? 600 : 500, fontSize: '0.85rem', fontFamily: FONT, whiteSpace: 'nowrap' }}>
                        {item.label}
                    </Typography>
                )}
            </Box>
        );
        return collapsed && !showLabels
            ? <Tooltip key={item.label} title={item.label} placement="right">{button}</Tooltip>
            : <Box key={item.label}>{button}</Box>;
    };

    return (
        <Box sx={{ minHeight: '100vh', display: 'flex', background: theme.bgGradient, fontFamily: FONT, position: 'relative' }}>
            {/* Colourful glow blobs behind the glass UI */}
            <Box sx={{ position: 'fixed', inset: 0, zIndex: 0, pointerEvents: 'none', overflow: 'hidden' }}>
                <Box sx={{ position: 'absolute', width: 460, height: 460, borderRadius: '50%', top: '-10%', left: '-8%',
                    background: 'radial-gradient(circle, rgba(233,69,96,0.28), transparent 70%)', filter: 'blur(55px)' }} />
                <Box sx={{ position: 'absolute', width: 480, height: 480, borderRadius: '50%', top: '24%', right: '-12%',
                    background: 'radial-gradient(circle, rgba(78,205,196,0.25), transparent 70%)', filter: 'blur(65px)' }} />
                <Box sx={{ position: 'absolute', width: 420, height: 420, borderRadius: '50%', bottom: '-14%', left: '30%',
                    background: 'radial-gradient(circle, rgba(255,209,102,0.2), transparent 70%)', filter: 'blur(55px)' }} />
            </Box>

            {/* Backdrop for the off-canvas drawer on mobile */}
            {!md && drawerOpen && (
                <Box onClick={() => setDrawerOpen(false)} sx={{
                    position: 'fixed', inset: 0, zIndex: 1190,
                    background: 'rgba(0,0,0,0.4)', backdropFilter: 'blur(2px)',
                }} />
            )}

            {/* ---------------------------------------------------------- Sidebar */}
            <Box component="nav" sx={{
                position: 'fixed', top: 0, bottom: 0, left: 0, zIndex: 1200,
                width: sidebarWidth,
                transform: md ? 'none' : (drawerOpen ? 'none' : 'translateX(-100%)'),
                visibility: md ? 'visible' : (drawerOpen ? 'visible' : 'hidden'),
                transition: 'width 0.25s ease, transform 0.25s ease, visibility 0.25s',
                display: 'flex', flexDirection: 'column',
                background: theme.mix(0.02),
                backdropFilter: 'blur(16px)', WebkitBackdropFilter: 'blur(16px)',
                borderRight: `1px solid ${theme.mix(0.08)}`,
                boxShadow: '8px 0 30px rgba(0,0,0,0.25), 0 0 40px rgba(78,205,196,0.06)',
                overflow: 'hidden',
            }}>
                {/* Brand */}
                <Box sx={{
                    display: 'flex', alignItems: 'center', justifyContent: collapsed ? 'center' : 'flex-start',
                    gap: 1, height: 64, px: collapsed ? 0 : 2, flexShrink: 0,
                    borderBottom: `1px solid ${theme.mix(0.06)}`,
                }}>
                    <FitnessCenterIcon sx={{ color: '#e94560', fontSize: 26 }} />
                    {!collapsed && (
                        <Typography variant="subtitle1" sx={{ color: theme.mix(1), fontWeight: 800, letterSpacing: 1, fontFamily: FONT }}>
                            FitTracker
                        </Typography>
                    )}
                </Box>

                {/* Nav sections */}
                <Box sx={{ flex: 1, overflowY: 'auto', overflowX: 'hidden', px: 1.25, py: 1.25 }}>
                    {SIDE_SECTIONS.map((section) => (
                        <Box key={section.heading} sx={{ mb: 1.5 }}>
                            {!collapsed && (
                                <Typography sx={{
                                    px: 1, mb: 0.75, fontSize: '0.66rem', fontWeight: 700,
                                    color: theme.mix(0.4), letterSpacing: 1.5, textTransform: 'uppercase', fontFamily: FONT,
                                }}>
                                    {section.heading}
                                </Typography>
                            )}
                            {section.items.map((item) => renderNavItem(item, !collapsed))}
                        </Box>
                    ))}
                </Box>

                {/* Log out */}
                <Box sx={{ borderTop: `1px solid ${theme.mix(0.06)}`, px: 1.25, py: 1.25, flexShrink: 0 }}>
                    <Tooltip title="Log out" placement="right">
                        <Box onClick={handleLogout} role="button" tabIndex={0}
                             onKeyDown={(e) => { if (e.key === 'Enter') handleLogout(); }}
                             sx={{
                                 display: 'flex', alignItems: 'center', gap: 2,
                                 justifyContent: collapsed ? 'center' : 'flex-start',
                                 width: '100%', py: 1.25, px: collapsed ? 0 : 1.75, borderRadius: 2, cursor: 'pointer',
                                 color: theme.mix(0.55), transition: 'background 0.2s, color 0.2s',
                                 '&:hover': { background: theme.mix(0.06), color: '#e94560' },
                             }}>
                            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: 24, flexShrink: 0 }}>
                                <LogoutIcon />
                            </Box>
                            {!collapsed && (
                                <Typography sx={{ fontWeight: 500, fontSize: '0.85rem', fontFamily: FONT, whiteSpace: 'nowrap' }}>
                                    Log out
                                </Typography>
                            )}
                        </Box>
                    </Tooltip>
                </Box>
            </Box>

            {/* ---------------------------------------------------------- Main */}
            <Box sx={{
                flex: 1, minWidth: 0,
                marginLeft: md ? sidebarWidth : 0,
                transition: 'margin-left 0.25s ease',
                display: 'flex', flexDirection: 'column', position: 'relative', zIndex: 1,
            }}>
                {/* Top navbar */}
                <Box sx={{
                    position: 'sticky', top: 0, zIndex: 1100,
                    display: 'flex', alignItems: 'center', gap: { xs: 1, md: 2 },
                    px: { xs: 1.5, md: 3 }, minHeight: 64,
                    background: theme.mix(0.04), backdropFilter: 'blur(14px)', WebkitBackdropFilter: 'blur(14px)',
                    borderBottom: `1px solid ${theme.mix(0.08)}`,
                }}>
                    <IconButton onClick={() => (md ? setCollapsed((c) => !c) : setDrawerOpen(true))} sx={{ color: theme.mix(0.7) }} aria-label={md ? 'Toggle sidebar' : 'Open menu'}>
                        {md ? (collapsed ? <MenuIcon /> : <MenuOpenIcon />) : <MenuIcon />}
                    </IconButton>
                    <Typography sx={{ color: theme.mix(0.9), fontWeight: 800, fontSize: '1rem', letterSpacing: 1, fontFamily: FONT, flexGrow: 1 }}>
                        FitTracker
                    </Typography>

                    {/* Top-right: Go Ultimate, Profile, Settings/theme */}
                    <Button size="small" startIcon={<WorkspacePremiumIcon fontSize="small" />} onClick={() => go('/upgrade')}
                            sx={{
                                borderRadius: 999, px: 1.5, textTransform: 'none', fontWeight: 700, fontFamily: FONT,
                                color: '#1a1a2e', background: summary?.ultimate ? '#ffd166' : 'linear-gradient(90deg, #ffd166, #e94560)',
                                boxShadow: '0 0 14px rgba(255,209,102,0.4)',
                                '&:hover': { background: '#ffd166' },
                            }}>
                        {summary?.ultimate ? 'Ultimate' : 'Go Ultimate'}
                    </Button>

                    <Tooltip title="My profile">
                        <Avatar
                            onClick={() => go('/profile')}
                            sx={{
                                bgcolor: '#e94560', cursor: 'pointer', width: 36, height: 36, fontSize: '0.9rem',
                                boxShadow: '0 0 16px rgba(233,69,96,0.45)', flexShrink: 0,
                            }}>
                            {name?.charAt(0).toUpperCase()}
                        </Avatar>
                    </Tooltip>

                    <Tooltip title="Settings">
                        <IconButton onClick={() => go('/account-settings')} sx={{ color: theme.mix(0.7) }} aria-label="Settings">
                            <SettingsIcon />
                        </IconButton>
                    </Tooltip>

                    <Tooltip title={mode === 'dark' ? 'Light mode' : 'Dark mode'}>
                        <IconButton onClick={toggleTheme} sx={{ color: theme.mix(0.7) }} aria-label="Toggle dark mode">
                            {mode === 'dark' ? <LightModeIcon /> : <DarkModeIcon />}
                        </IconButton>
                    </Tooltip>
                </Box>

                {/* Centered dashboard content */}
                <Box component="main" sx={{ width: '100%', maxWidth: 840, mx: 'auto', px: { xs: 2, md: 3 }, py: { xs: 3, md: 4 } }}>
                    {/* Welcome */}
                    <Box sx={{ textAlign: 'center', mb: 3.5 }}>
                        <Typography sx={{
                            fontWeight: 800, fontSize: '1.45rem', fontFamily: FONT,
                            background: 'linear-gradient(90deg, #e94560, #a29bfe, #4ecdc4)',
                            WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
                        }}>
                            Welcome, {name}
                        </Typography>
                        <Typography sx={{ color: '#4ecdc4', fontSize: '0.82rem', fontWeight: 500, fontFamily: FONT }}>
                            {summary?.nextStep || 'Here is your fitness summary'}
                        </Typography>
                    </Box>

                    {summary && !summary.emailVerified && (
                        <Alert severity="warning" sx={{ mb: 3, borderRadius: 2 }}
                               action={(
                                   <Button color="inherit" size="small" disabled={resending} onClick={resendVerification}>
                                       Resend link
                                   </Button>
                               )}>
                            Please confirm your email address. We sent a link to {localStorage.getItem('email')}.
                            {verifyNotice && <Typography sx={{ fontSize: '0.8rem', mt: 0.5 }}>{verifyNotice}</Typography>}
                        </Alert>
                    )}

                    {/* Statistics: 4x2 on desktop, 2x4 on tablet, 2 cols on mobile */}
                    <Box sx={{ display: 'grid', gridTemplateColumns: { xs: 'repeat(2, 1fr)', md: 'repeat(4, 1fr)' }, gap: 2, mb: 4 }}>
                        {statCards.map((card, index) => (
                            <Card key={index} sx={{
                                borderRadius: 2.5,
                                background: theme.mix(0.04),
                                backdropFilter: 'blur(12px)', WebkitBackdropFilter: 'blur(12px)',
                                border: `1px solid ${theme.mix(0.1)}`,
                                boxShadow: '0 8px 24px rgba(0,0,0,0.15)',
                                transition: 'transform 0.2s, box-shadow 0.2s',
                                '&:hover': { transform: 'translateY(-4px)', boxShadow: `0 12px 30px ${card.color}22` },
                            }}>
                                <CardContent sx={{ textAlign: 'center', p: 2, '&:last-child': { pb: 2 } }}>
                                    <Box sx={{
                                        width: 36, height: 36, borderRadius: 1.75, mx: 'auto', mb: 1.25,
                                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                                        background: `${card.color}1F`, color: card.color,
                                        filter: `drop-shadow(0 0 8px ${card.color}55)`,
                                    }}>
                                        {card.icon}
                                    </Box>
                                    <Typography sx={{ color: theme.mix(1), fontWeight: 700, fontSize: '1.4rem', lineHeight: 1.15, fontFamily: FONT }}>
                                        {card.value}
                                    </Typography>
                                    <Typography sx={{ color: theme.mix(0.55), fontSize: '0.72rem', fontWeight: 600, fontFamily: FONT }}>
                                        {card.title}
                                    </Typography>
                                    <Typography sx={{ color: theme.mix(0.32), fontSize: '0.66rem', fontFamily: FONT }}>
                                        {card.unit}
                                    </Typography>
                                </CardContent>
                            </Card>
                        ))}
                    </Box>

                    {/* Fitness Journey */}
                    <Box>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1.5 }}>
                            <Typography sx={{ color: theme.mix(1), fontWeight: 700, fontSize: '1.05rem', fontFamily: FONT }}>
                                Your Fitness Journey
                            </Typography>
                            <Typography sx={{ color: '#4ecdc4', fontWeight: 700, fontSize: '0.82rem', fontFamily: FONT }}>
                                {completedSteps}/{journeySteps.length} completed
                            </Typography>
                        </Box>

                        <Box sx={{ width: '100%', height: 6, background: theme.mix(0.1), borderRadius: 3, mb: 2.5 }}>
                            <Box sx={{
                                width: `${(completedSteps / journeySteps.length) * 100}%`,
                                height: '100%',
                                background: 'linear-gradient(90deg, #4ecdc4, #45b7d1)',
                                borderRadius: 3,
                                boxShadow: '0 0 12px rgba(78,205,196,0.5)',
                                transition: 'width 0.6s ease',
                            }} />
                        </Box>

                        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
                            {journeySteps.map((item) => (
                                <Box key={item.step}
                                     onClick={() => !item.done && go(item.path)}
                                     sx={{
                                         display: 'flex', alignItems: 'center', gap: 2,
                                         p: 2, borderRadius: 2.5,
                                         cursor: item.done ? 'default' : 'pointer',
                                         background: item.done ? 'rgba(78,205,196,0.1)' : theme.mix(0.04),
                                         backdropFilter: 'blur(12px)', WebkitBackdropFilter: 'blur(12px)',
                                         border: `1px solid ${item.done ? 'rgba(78,205,196,0.45)' : theme.mix(0.1)}`,
                                         boxShadow: item.done ? '0 0 16px rgba(78,205,196,0.12)' : 'none',
                                         transition: 'background 0.2s, transform 0.2s',
                                         '&:hover': {
                                             transform: item.done ? 'none' : 'translateX(3px)',
                                             background: item.done ? 'rgba(78,205,196,0.1)' : theme.mix(0.07),
                                         },
                                     }}>
                                    <Box sx={{
                                        width: 34, height: 34, borderRadius: '50%', flexShrink: 0,
                                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                                        background: item.done ? 'linear-gradient(135deg, #4ecdc4, #45b7d1)' : `${item.color}26`,
                                        color: item.done ? '#0f1e28' : item.color,
                                        boxShadow: `0 0 12px ${item.color}40`,
                                    }}>
                                        {item.done ? <CheckIcon fontSize="small" /> : (
                                            <Typography sx={{ fontWeight: 700, fontSize: '0.8rem', fontFamily: FONT }}>{item.step}</Typography>
                                        )}
                                    </Box>
                                    <Box sx={{ flex: 1, minWidth: 0 }}>
                                        <Typography sx={{
                                            color: item.done ? theme.mix(0.6) : theme.mix(1),
                                            fontWeight: 600, fontSize: '0.88rem', fontFamily: FONT,
                                            textDecoration: item.done ? 'line-through' : 'none',
                                        }}>
                                            {item.label}
                                        </Typography>
                                        <Typography sx={{ color: theme.mix(0.4), fontSize: '0.74rem', fontFamily: FONT }}>
                                            {item.description}
                                        </Typography>
                                    </Box>
                                    {!item.done && (
                                        <ChevronRightIcon sx={{ color: item.color, fontSize: 20 }} />
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