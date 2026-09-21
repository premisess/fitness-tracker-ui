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
        icon: <LocalFireDepartmentIcon sx={{ fontSize: 26 }} />,
        color: '#e94560',
        title: 'Auto Calorie Tracking',
        text: 'Calories burn are calculated automatically from your profile with the science-backed MET formula.',
    },
    {
        icon: <TrackChangesIcon sx={{ fontSize: 26 }} />,
        color: '#4ecdc4',
        title: 'Goals & Streaks',
        text: 'Set a goal, watch it update as you train, and keep your daily streak alive.',
    },
    {
        icon: <BarChartIcon sx={{ fontSize: 26 }} />,
        color: '#a29bfe',
        title: 'Analytics & Charts',
        text: 'Calories, BMI and workout mix over time in clean, exportable charts.',
    },
    {
        icon: <CalendarViewWeekIcon sx={{ fontSize: 26 }} />,
        color: '#ffa726',
        title: 'Guided Exercise Library',
        text: 'Exercises with animated previews and goal-matched rep and duration suggestions.',
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

            {/* Transparent glass hero: features on the left, animation on the right */}
            <Box sx={{
                maxWidth: 1200, mx: 'auto', px: { xs: 3, md: 6 }, py: { xs: 3, md: 5 },
            }}>
                <Box sx={{
                    p: { xs: 3, sm: 5 }, borderRadius: 5,
                    background: 'rgba(255,255,255,0.04)',
                    backdropFilter: 'blur(14px)',
                    WebkitBackdropFilter: 'blur(14px)',
                    border: `1px solid ${theme.mix(0.1)}`,
                    boxShadow: '0 20px 60px rgba(0,0,0,0.25)',
                }}>
                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: { xs: 4, md: 6 }, alignItems: 'center' }}>
                        {/* Left: headline + features */}
                        <Box sx={{ flex: '1 1 420px', minWidth: 0 }}>
                            <Typography sx={{
                                color: '#4ecdc4', fontWeight: 700, letterSpacing: 2, fontSize: '0.8rem',
                                mb: 2, fontFamily: "'Poppins', sans-serif", textTransform: 'uppercase'
                            }}>
                                Your fitness, quantified
                            </Typography>
                            <Typography variant="h2" sx={{
                                color: theme.mix(1), fontWeight: 800, lineHeight: 1.15, mb: 3,
                                fontFamily: "'Poppins', sans-serif", fontSize: { xs: '2.2rem', md: '2.9rem' }
                            }}>
                                Train smarter.<br />
                                Track <Box component="span" sx={{
                                    background: 'linear-gradient(90deg, #e94560, #a29bfe)',
                                    WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent'
                                }}>everything.</Box>
                            </Typography>
                            <Typography sx={{
                                color: theme.mix(0.6), fontSize: '1rem', mb: 4, lineHeight: 1.7,
                                fontFamily: "'Poppins', sans-serif"
                            }}>
                                Workouts, calories, goals, streaks and BMI in one place — calories calculated
                                automatically so you never have to guess.
                            </Typography>

                            {/* Features listed on the left */}
                            <Stack spacing={2.5} sx={{ mb: 4 }}>
                                {features.map((f) => (
                                    <Stack key={f.title} direction="row" spacing={1.5} sx={{ alignItems: 'flex-start' }}>
                                        <Box sx={{
                                            width: 46, height: 46, borderRadius: 2, flexShrink: 0,
                                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                                            background: `${f.color}22`, border: `1px solid ${f.color}55`,
                                            color: f.color,
                                        }}>
                                            {f.icon}
                                        </Box>
                                        <Box>
                                            <Typography sx={{ color: theme.mix(1), fontWeight: 700, fontFamily: "'Poppins', sans-serif", fontSize: '0.95rem' }}>
                                                {f.title}
                                            </Typography>
                                            <Typography sx={{ color: theme.mix(0.55), fontSize: '0.85rem', lineHeight: 1.5, fontFamily: "'Poppins', sans-serif" }}>
                                                {f.text}
                                            </Typography>
                                        </Box>
                                    </Stack>
                                ))}
                            </Stack>

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

                        {/* Right: animated preview */}
                        <Box sx={{ flex: '1 1 340px', maxWidth: 440, mx: 'auto' }}>
                            <Box sx={{ position: 'relative', display: 'flex', justifyContent: 'center' }}>
                                <Box sx={{
                                    position: 'absolute', width: 280, height: 280, borderRadius: '50%',
                                    background: 'radial-gradient(circle, rgba(233,69,96,0.25), transparent 70%)',
                                    animation: 'ft-pulse 4s ease-in-out infinite',
                                }} />
                                <Box sx={{
                                    position: 'relative', width: '100%', p: 3, borderRadius: 4,
                                    background: 'rgba(255,255,255,0.05)',
                                    backdropFilter: 'blur(10px)', WebkitBackdropFilter: 'blur(10px)',
                                    border: `1px solid ${theme.mix(0.12)}`,
                                    boxShadow: '0 20px 60px rgba(0,0,0,0.3)',
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
                    </Box>
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