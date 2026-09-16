import { useNavigate } from 'react-router-dom';
import { useAppTheme } from '../context/ThemeContext';
import ExerciseAnimation from '../components/ExerciseAnimation';
import { Box, Typography, Button, IconButton, Stack } from '@mui/material';
import FitnessCenterIcon from '@mui/icons-material/FitnessCenter';
import LocalFireDepartmentIcon from '@mui/icons-material/LocalFireDepartment';
import TrackChangesIcon from '@mui/icons-material/TrackChanges';
import BarChartIcon from '@mui/icons-material/BarChart';
import CalendarViewWeekIcon from '@mui/icons-material/CalendarViewWeek';
import DarkModeIcon from '@mui/icons-material/DarkMode';
import LightModeIcon from '@mui/icons-material/LightMode';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';

const FLOAT_KEYFRAMES = `
@keyframes ft-float { 0%,100% { transform: translateY(0); } 50% { transform: translateY(-10px); } }
@keyframes ft-float-slow { 0%,100% { transform: translateY(0); } 50% { transform: translateY(-16px); } }
@keyframes ft-pulse { 0%,100% { opacity: 0.55; transform: scale(1); } 50% { opacity: 0.9; transform: scale(1.06); } }
`;

const previewExercises = [
    { name: 'Push Ups', color: '#e94560' },
    { name: 'Squats', color: '#4ecdc4' },
    { name: 'Burpees', color: '#ffa726' },
];

const features = [
    {
        icon: <LocalFireDepartmentIcon sx={{ fontSize: 32 }} />,
        color: '#e94560',
        title: 'Auto Calorie Tracking',
        text: 'Log a workout and calories burn are calculated automatically from your profile and the science-backed MET formula.',
    },
    {
        icon: <TrackChangesIcon sx={{ fontSize: 32 }} />,
        color: '#4ecdc4',
        title: 'Goals & Streaks',
        text: 'Set a goal, watch it auto-update as you train, and keep your daily streak alive.',
    },
    {
        icon: <BarChartIcon sx={{ fontSize: 32 }} />,
        color: '#a29bfe',
        title: 'Analytics & Charts',
        text: 'See your progress over time — calories, BMI, workout mix — in clean, exportable charts.',
    },
    {
        icon: <CalendarViewWeekIcon sx={{ fontSize: 32 }} />,
        color: '#ffa726',
        title: 'Guided Exercise Library',
        text: 'Browse exercises with animated movement previews and goal-matched rep/duration recommendations.',
    },
];

function Landing() {
    const { theme, mode, toggleTheme } = useAppTheme();
    const navigate = useNavigate();

    return (
        <Box sx={{ minHeight: '100vh', background: theme.bgGradient, fontFamily: "'Poppins', sans-serif", overflowX: 'hidden' }}>
            <style>{FLOAT_KEYFRAMES}</style>

            {/* Nav */}
            <Box sx={{
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                px: { xs: 2, md: 5 }, py: 2.5,
            }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <FitnessCenterIcon sx={{ color: '#e94560', fontSize: 30 }} />
                    <Typography variant="h6" sx={{ color: theme.mix(1), fontWeight: 800, letterSpacing: 1, fontFamily: "'Poppins', sans-serif" }}>
                        FitTracker
                    </Typography>
                </Box>

                <Stack direction="row" spacing={1.5} sx={{ alignItems: 'center' }}>
                    <IconButton onClick={toggleTheme} sx={{ color: theme.mix(0.7) }}>
                        {mode === 'dark' ? <LightModeIcon /> : <DarkModeIcon />}
                    </IconButton>
                    <Button onClick={() => navigate('/login')} sx={{
                        color: theme.mix(0.85), fontWeight: 600, fontFamily: "'Poppins', sans-serif",
                        textTransform: 'none', px: 2,
                        '&:hover': { color: theme.mix(1) }
                    }}>
                        Login
                    </Button>
                    <Button onClick={() => navigate('/register')} variant="contained" sx={{
                        borderRadius: 2, px: 2.5, py: 1, fontWeight: 700, textTransform: 'none',
                        fontFamily: "'Poppins', sans-serif",
                        background: 'linear-gradient(90deg, #e94560, #0f3460)',
                        '&:hover': { background: 'linear-gradient(90deg, #c73652, #0a2540)' }
                    }}>
                        Sign Up
                    </Button>
                </Stack>
            </Box>

            {/* Hero */}
            <Box sx={{
                display: 'flex', flexWrap: 'wrap-reverse', alignItems: 'center', justifyContent: 'center',
                gap: 6, px: { xs: 3, md: 6 }, py: { xs: 4, md: 8 }, maxWidth: 1200, mx: 'auto',
            }}>
                <Box sx={{ flex: '1 1 420px', maxWidth: 560 }}>
                    <Typography sx={{
                        color: '#4ecdc4', fontWeight: 700, letterSpacing: 2, fontSize: '0.8rem',
                        mb: 2, fontFamily: "'Poppins', sans-serif", textTransform: 'uppercase'
                    }}>
                        Your fitness, quantified
                    </Typography>
                    <Typography variant="h2" sx={{
                        color: theme.mix(1), fontWeight: 800, lineHeight: 1.15, mb: 3,
                        fontFamily: "'Poppins', sans-serif", fontSize: { xs: '2.2rem', md: '3rem' }
                    }}>
                        Train smarter.<br />
                        Track <Box component="span" sx={{
                            background: 'linear-gradient(90deg, #e94560, #a29bfe)',
                            WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent'
                        }}>everything.</Box>
                    </Typography>
                    <Typography sx={{
                        color: theme.mix(0.6), fontSize: '1.05rem', mb: 4, lineHeight: 1.7,
                        fontFamily: "'Poppins', sans-serif"
                    }}>
                        Workouts, calories, goals, streaks, and BMI — all in one place, with
                        calories calculated automatically so you never have to guess.
                    </Typography>
                    <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
                        <Button onClick={() => navigate('/register')} variant="contained" size="large"
                                endIcon={<ArrowForwardIcon />}
                                sx={{
                                    borderRadius: 2, px: 4, py: 1.6, fontWeight: 700, textTransform: 'none',
                                    fontSize: '1rem', fontFamily: "'Poppins', sans-serif",
                                    background: 'linear-gradient(90deg, #e94560, #0f3460)',
                                    '&:hover': { background: 'linear-gradient(90deg, #c73652, #0a2540)' }
                                }}>
                            Get Started Free
                        </Button>
                        <Button onClick={() => navigate('/login')} variant="outlined" size="large" sx={{
                            borderRadius: 2, px: 4, py: 1.6, fontWeight: 600, textTransform: 'none',
                            fontSize: '1rem', fontFamily: "'Poppins', sans-serif",
                            borderColor: theme.mix(0.25), color: theme.mix(0.9),
                            '&:hover': { borderColor: theme.mix(0.5), background: theme.mix(0.05) }
                        }}>
                            I Have an Account
                        </Button>
                    </Stack>
                </Box>

                {/* Animated preview panel */}
                <Box sx={{ position: 'relative', flex: '1 1 380px', maxWidth: 460, display: 'flex', justifyContent: 'center' }}>
                    <Box sx={{
                        position: 'absolute', width: 320, height: 320, borderRadius: '50%',
                        background: 'radial-gradient(circle, rgba(233,69,96,0.25), transparent 70%)',
                        animation: 'ft-pulse 4s ease-in-out infinite',
                    }} />
                    <Box sx={{
                        position: 'relative', width: '100%', maxWidth: 420, p: 3, borderRadius: 4,
                        background: theme.mix(0.06), backdropFilter: 'blur(12px)',
                        border: `1px solid ${theme.mix(0.12)}`,
                        boxShadow: '0 20px 60px rgba(0,0,0,0.35)',
                    }}>
                        <Typography sx={{ color: theme.mix(0.5), fontSize: '0.75rem', fontWeight: 700, letterSpacing: 1.5, mb: 2, textTransform: 'uppercase' }}>
                            Live Movement Previews
                        </Typography>
                        <Box sx={{ display: 'flex', justifyContent: 'space-around', mb: 1 }}>
                            {previewExercises.map((ex, i) => (
                                <Box key={ex.name} sx={{
                                    textAlign: 'center',
                                    animation: `${i % 2 === 0 ? 'ft-float' : 'ft-float-slow'} ${3 + i * 0.4}s ease-in-out infinite`,
                                }}>
                                    <ExerciseAnimation exercise={{ name: ex.name }} color={ex.color} size={84} />
                                    <Typography sx={{ color: theme.mix(0.7), fontSize: '0.75rem', mt: 0.5, fontFamily: "'Poppins', sans-serif" }}>
                                        {ex.name}
                                    </Typography>
                                </Box>
                            ))}
                        </Box>

                        <Box sx={{ display: 'flex', gap: 2, mt: 3, pt: 3, borderTop: `1px solid ${theme.mix(0.1)}` }}>
                            {[
                                { label: 'Workouts', value: '30+', color: '#e94560' },
                                { label: 'Goal Types', value: '5', color: '#4ecdc4' },
                                { label: 'Auto Calc', value: '100%', color: '#a29bfe' },
                            ].map((s) => (
                                <Box key={s.label} sx={{ flex: 1, textAlign: 'center' }}>
                                    <Typography sx={{ color: s.color, fontWeight: 800, fontSize: '1.3rem', fontFamily: "'Poppins', sans-serif" }}>
                                        {s.value}
                                    </Typography>
                                    <Typography sx={{ color: theme.mix(0.45), fontSize: '0.7rem', fontFamily: "'Poppins', sans-serif" }}>
                                        {s.label}
                                    </Typography>
                                </Box>
                            ))}
                        </Box>
                    </Box>
                </Box>
            </Box>

            {/* Features */}
            <Box sx={{ maxWidth: 1200, mx: 'auto', px: { xs: 3, md: 6 }, py: { xs: 4, md: 8 } }}>
                <Typography variant="h4" sx={{
                    color: theme.mix(1), fontWeight: 800, textAlign: 'center', mb: 1,
                    fontFamily: "'Poppins', sans-serif", fontSize: { xs: '1.6rem', md: '2rem' }
                }}>
                    Everything you need, nothing you don't
                </Typography>
                <Typography sx={{ color: theme.mix(0.5), textAlign: 'center', mb: 6, fontFamily: "'Poppins', sans-serif" }}>
                    One backend, one account, every part of your fitness journey.
                </Typography>

                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 3, justifyContent: 'center' }}>
                    {features.map((f) => (
                        <Box key={f.title} sx={{
                            flex: '1 1 250px', maxWidth: 280, p: 3, borderRadius: 3,
                            background: theme.mix(0.05), border: `1px solid ${theme.mix(0.1)}`,
                            transition: 'transform 0.2s, border-color 0.2s',
                            '&:hover': { transform: 'translateY(-6px)', borderColor: f.color },
                        }}>
                            <Box sx={{
                                width: 56, height: 56, borderRadius: 2, mb: 2,
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                background: `${f.color}22`, color: f.color,
                            }}>
                                {f.icon}
                            </Box>
                            <Typography sx={{ color: theme.mix(1), fontWeight: 700, mb: 1, fontFamily: "'Poppins', sans-serif" }}>
                                {f.title}
                            </Typography>
                            <Typography sx={{ color: theme.mix(0.55), fontSize: '0.9rem', lineHeight: 1.6, fontFamily: "'Poppins', sans-serif" }}>
                                {f.text}
                            </Typography>
                        </Box>
                    ))}
                </Box>
            </Box>

            {/* Final CTA */}
            <Box sx={{
                textAlign: 'center', py: { xs: 6, md: 9 }, px: 3,
                background: theme.mix(0.04), borderTop: `1px solid ${theme.mix(0.08)}`,
            }}>
                <Typography variant="h4" sx={{
                    color: theme.mix(1), fontWeight: 800, mb: 2,
                    fontFamily: "'Poppins', sans-serif", fontSize: { xs: '1.5rem', md: '2rem' }
                }}>
                    Ready to start your journey?
                </Typography>
                <Typography sx={{ color: theme.mix(0.55), mb: 4, fontFamily: "'Poppins', sans-serif" }}>
                    Create your free account in under a minute.
                </Typography>
                <Button onClick={() => navigate('/register')} variant="contained" size="large"
                        endIcon={<ArrowForwardIcon />}
                        sx={{
                            borderRadius: 2, px: 5, py: 1.8, fontWeight: 700, textTransform: 'none',
                            fontSize: '1.05rem', fontFamily: "'Poppins', sans-serif",
                            background: 'linear-gradient(90deg, #e94560, #0f3460)',
                            '&:hover': { background: 'linear-gradient(90deg, #c73652, #0a2540)' }
                        }}>
                    Get Started Free
                </Button>

                <Typography sx={{ color: theme.mix(0.3), fontSize: '0.8rem', mt: 6, fontFamily: "'Poppins', sans-serif" }}>
                    © {new Date().getFullYear()} FitTracker. Built to keep you moving.
                </Typography>
            </Box>
        </Box>
    );
}

export default Landing;
