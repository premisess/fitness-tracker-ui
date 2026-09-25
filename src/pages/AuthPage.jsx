import { useEffect, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { keyframes } from '@emotion/react';
import {
    Alert, Box, Button, Card, CircularProgress, Divider, IconButton, InputAdornment, TextField, Typography, useMediaQuery,
} from '@mui/material';
import FitnessCenterIcon from '@mui/icons-material/FitnessCenter';
import Visibility from '@mui/icons-material/Visibility';
import VisibilityOff from '@mui/icons-material/VisibilityOff';
import DarkModeIcon from '@mui/icons-material/DarkMode';
import LightModeIcon from '@mui/icons-material/LightMode';
import API from '../services/api';
import { errorMessage } from '../services/errors';
import { useAppTheme } from '../context/ThemeContext';
import AuthScene from '../components/AuthScene';
import GoogleSignInButton from '../components/GoogleSignInButton';

const FONT = "'Poppins', sans-serif";

const rise = keyframes`
  from { opacity: 0; transform: translateY(14px); }
  to { opacity: 1; transform: none; }
`;

// Staggers the form's rows in, one after another.
const appear = (index) => ({
    animation: `${rise} 0.5s ease ${0.2 + index * 0.06}s both`,
    '@media (prefers-reduced-motion: reduce)': { animation: 'none' },
});

function passwordStrength(password) {
    if (!password) return null;
    let score = 0;
    if (password.length >= 8) score++;
    if (password.length >= 12) score++;
    if (/[A-Z]/.test(password) && /[a-z]/.test(password)) score++;
    if (/\d/.test(password)) score++;
    if (/[^A-Za-z0-9]/.test(password)) score++;
    if (password.length < 8 || score <= 2) return { label: 'Weak', color: '#e94560', width: '33%' };
    if (score <= 3) return { label: 'Medium', color: '#ffa726', width: '66%' };
    return { label: 'Strong', color: '#4ecdc4', width: '100%' };
}

/**
 * Sign in (/login) and sign up (/register): two cards joined together, the animated one wider on the
 * left and the form on the right. Both halves always share the same height, so switching modes keeps
 * every card aligned; the animated card swaps its content between the two modes.
 */
function AuthPage() {
    const location = useLocation();
    const navigate = useNavigate();
    const { theme, mode: themeMode, toggleTheme } = useAppTheme();
    const wide = useMediaQuery('(min-width:900px)');

    const mode = location.pathname === '/register' ? 'register' : 'login';
    const isRegister = mode === 'register';

    const [entered, setEntered] = useState(false);
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const [googleLoading, setGoogleLoading] = useState(false);

    // Fade the cards in on the next frame.
    useEffect(() => {
        const frame = requestAnimationFrame(() => setEntered(true));
        return () => cancelAnimationFrame(frame);
    }, []);

    const strength = isRegister ? passwordStrength(password) : null;

    const switchMode = (path) => {
        setError('');
        setShowPassword(false);
        navigate(path);
    };

    const finishSignIn = (data, isNewAccount) => {
        localStorage.setItem('role', data.role);
        localStorage.setItem('name', data.name);
        localStorage.setItem('email', data.email);
        if (isNewAccount) localStorage.setItem('hasLoggedInBefore', 'false');
        navigate(data.role === 'ADMIN' ? '/admin/dashboard' : '/dashboard');
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);
        try {
            const res = isRegister
                ? await API.post('/auth/register', { name, email, password })
                : await API.post('/auth/login', { email, password });
            finishSignIn(res.data, isRegister);
        } catch (err) {
            if (!isRegister && err.response?.status === 401) {
                setError('Invalid email or password. Please try again.');
            } else {
                setError(errorMessage(err, isRegister ? 'Registration failed. Please try again.' : 'Sign in failed. Please try again.'));
            }
            setLoading(false);
        }
    };

    const handleGoogle = async (credential) => {
        setError('');
        setGoogleLoading(true);
        try {
            const res = await API.post('/auth/google', { credential });
            finishSignIn(res.data, false);
        } catch (err) {
            setError(errorMessage(err, 'Google sign-in failed. Please try again.'));
            setGoogleLoading(false);
        }
    };

    const fieldStyle = {
        '& .MuiOutlinedInput-root': {
            borderRadius: 2.5,
            background: theme.mix(0.03),
            '& fieldset': { borderColor: theme.mix(0.18) },
            '&:hover fieldset': { borderColor: theme.mix(0.35) },
            '&.Mui-focused fieldset': { borderColor: '#e94560' },
        },
        '& .MuiInputLabel-root': { color: theme.mix(0.5) },
        '& .MuiInputLabel-root.Mui-focused': { color: '#e94560' },
        '& .MuiInputBase-input': { color: theme.mix(1) },
        '& .MuiIconButton-root': { color: theme.mix(0.5) },
    };

    return (
        <Box sx={{
            height: '100vh', background: theme.bgGradient, fontFamily: FONT,
            display: 'flex', flexDirection: 'column', overflow: 'hidden',
        }}>
            {/* Full-width top bar like the landing page */}
            <Box sx={{
                position: 'relative', zIndex: 1,
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                px: { xs: 2, md: 5 }, py: 2.5, flexShrink: 0,
            }}>
                <Box component={Link} to="/" sx={{ display: 'flex', alignItems: 'center', gap: 1, textDecoration: 'none' }}>
                    <FitnessCenterIcon sx={{ color: '#e94560', fontSize: 30 }} />
                    <Typography variant="h6" sx={{ color: theme.mix(1), fontWeight: 800, letterSpacing: 1, fontFamily: FONT }}>
                        FitTracker
                    </Typography>
                </Box>
                <IconButton onClick={toggleTheme} sx={{ color: theme.mix(0.7) }} aria-label="Toggle dark mode">
                    {themeMode === 'dark' ? <LightModeIcon /> : <DarkModeIcon />}
                </IconButton>
            </Box>

            {/* Animated card (twisted, dropped down a touch) with the welcome words below it; form card beside */}
            <Box sx={{ flex: 1, minHeight: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', px: { xs: 2, sm: 4 }, py: { xs: 2, sm: 3 }, overflow: 'hidden' }}>
                <Box key={mode} sx={{
                    display: 'flex', flexDirection: { xs: 'column', md: 'row' }, alignItems: 'center',
                    width: '100%', maxWidth: 1150, gap: { xs: 4, md: 0 },
                    opacity: entered ? 1 : 0, transform: entered ? 'none' : 'translateY(16px)',
                    transition: 'opacity 0.6s ease, transform 0.6s cubic-bezier(0.22, 1, 0.36, 1)',
                }}>
                    {/* Left: smaller twisted animation card, nudged down, with the words just below it */}
                    <Box sx={{
                        flex: { md: '7 1 0' }, minWidth: 0, width: '100%',
                        display: 'flex', flexDirection: 'column',
                        mt: { xs: 0, md: 1 }, pr: { md: 6 },
                    }}>
                        <Box sx={{
                            position: 'relative',
                            height: { xs: 240, md: 360 },
                            borderRadius: 4, overflow: 'hidden',
                            border: `1px solid ${theme.mix(0.12)}`,
                            boxShadow: '0 20px 60px rgba(0,0,0,0.35), 0 0 40px rgba(233,69,96,0.12)',
                            transform: { md: 'rotate(-1.6deg) translateY(4px)' },
                        }}>
                            <AuthScene mode={mode} compact={!wide} showCopy={false} />
                        </Box>
                        <Box sx={{ mt: { md: 4, xs: 4 }, textAlign: { md: 'left', xs: 'center' } }}>
                            <Typography sx={{
                                textTransform: 'uppercase', letterSpacing: 3, fontSize: '0.75rem',
                                fontWeight: 700, color: mode === 'login' ? '#ff8fa3' : '#7ee8e0', fontFamily: FONT,
                            }}>
                                {mode === 'login' ? 'Welcome back' : 'Join FitTracker'}
                            </Typography>
                            <Typography component="h2" sx={{
                                color: theme.mix(1), fontWeight: 800, lineHeight: 1.15, mt: 0.5, fontFamily: FONT,
                                fontSize: { xs: '1.5rem', md: '2.2rem', lg: '2.5rem' },
                            }}>
                                {mode === 'login' ? 'Your streak is waiting.' : 'Start strong. Track everything.'}
                            </Typography>
                            <Typography sx={{ color: theme.mix(0.6), mt: 1.2, maxWidth: 460, fontSize: '1rem', fontFamily: FONT }}>
                                {mode === 'login'
                                    ? "Pick up where you left off: today's plan session, your runs and your records."
                                    : 'Workouts, GPS runs, meals and training plans in one place, with badges for every milestone.'}
                            </Typography>
                        </Box>
                    </Box>

                    {/* Right half: the form card */}
                    <Card key={mode} sx={{
                        flex: { md: '5 1 0' }, minWidth: 0, width: '100%',
                        p: { xs: 3, sm: 4 },
                        display: 'flex', flexDirection: 'column', justifyContent: 'center',
                        borderRadius: 4,
                        background: theme.mix(0.02),
                        border: `1px solid ${theme.mix(0.12)}`,
                        boxShadow: '0 20px 60px rgba(0,0,0,0.35), 0 0 40px rgba(78,205,196,0.12)',
                        backdropFilter: 'blur(14px)', WebkitBackdropFilter: 'blur(14px)',
                    }}>
                        {error && <Alert severity="error" sx={{ mt: 2.5 }}>{error}</Alert>}

                        <Box sx={{ mt: 3, ...appear(2) }}>
                            <GoogleSignInButton
                                text={isRegister ? 'signup_with' : 'signin_with'}
                                onCredential={handleGoogle}
                                busy={googleLoading}
                            />
                        </Box>

                        <Divider sx={{
                            my: 2.5, color: theme.mix(0.4), fontSize: '0.8rem', fontFamily: FONT,
                            '&::before, &::after': { borderColor: theme.mix(0.15) },
                            ...appear(3),
                        }}>
                            or with email
                        </Divider>

                        <Box component="form" onSubmit={handleSubmit}>
                            {isRegister && (
                                <TextField fullWidth label="Full name" value={name} autoComplete="name"
                                           onChange={(e) => setName(e.target.value)} required
                                           sx={{ ...fieldStyle, mb: 2, ...appear(4) }} />
                            )}
                            <TextField fullWidth label="Email" type="email" value={email} autoComplete="email"
                                       onChange={(e) => setEmail(e.target.value)} required
                                       sx={{ ...fieldStyle, mb: 2, ...appear(isRegister ? 5 : 4) }} />
                            <TextField fullWidth label="Password" value={password}
                                       type={showPassword ? 'text' : 'password'}
                                       autoComplete={isRegister ? 'new-password' : 'current-password'}
                                       onChange={(e) => setPassword(e.target.value)} required
                                       sx={{ ...fieldStyle, ...appear(isRegister ? 6 : 5) }}
                                       slotProps={{
                                           input: {
                                               endAdornment: (
                                                   <InputAdornment position="end">
                                                       <IconButton onClick={() => setShowPassword((s) => !s)} edge="end"
                                                                   aria-label={showPassword ? 'Hide password' : 'Show password'}>
                                                           {showPassword ? <VisibilityOff /> : <Visibility />}
                                                       </IconButton>
                                                   </InputAdornment>
                                               ),
                                           },
                                       }} />

                            {isRegister && (
                                <Box sx={{ mt: 1, minHeight: 22 }}>
                                    {strength ? (
                                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                            <Box sx={{ flex: 1, height: 4, background: theme.mix(0.1), borderRadius: 2 }}>
                                                <Box sx={{ width: strength.width, height: '100%', background: strength.color, borderRadius: 2, transition: 'width 0.3s, background 0.3s' }} />
                                            </Box>
                                            <Typography sx={{ color: strength.color, fontSize: '0.72rem', fontWeight: 700, fontFamily: FONT, minWidth: 48 }}>
                                                {strength.label}
                                            </Typography>
                                        </Box>
                                    ) : (
                                        <Typography sx={{ color: theme.mix(0.4), fontSize: '0.72rem', fontFamily: FONT }}>
                                            At least 8 characters. Mix in capitals, numbers and symbols.
                                        </Typography>
                                    )}
                                </Box>
                            )}

                            {!isRegister && (
                                <Box sx={{ textAlign: 'right', mt: 1 }}>
                                    <Link to="/forgot-password" style={{ color: '#e94560', textDecoration: 'none', fontSize: '0.85rem', fontFamily: FONT }}>
                                        Forgot password?
                                    </Link>
                                </Box>
                            )}

                            <Button fullWidth type="submit" variant="contained" disabled={loading || googleLoading}
                                    sx={{
                                        mt: 2.5, py: 1.4, borderRadius: 999, fontWeight: 700, fontSize: '1rem', fontFamily: FONT,
                                        textTransform: 'none', boxShadow: '0 10px 25px rgba(233,69,96,0.35)',
                                        background: 'linear-gradient(90deg, #e94560, #0f3460)',
                                        '&:hover': { background: 'linear-gradient(90deg, #c73652, #0a2540)' },
                                        ...appear(isRegister ? 7 : 6),
                                    }}>
                                {loading ? <CircularProgress size={24} color="inherit" /> : (isRegister ? 'Create account' : 'Sign in')}
                            </Button>
                        </Box>

                        <Typography sx={{ textAlign: 'center', mt: 3, color: theme.mix(0.55), fontFamily: FONT, ...appear(isRegister ? 8 : 7) }}>
                            {isRegister ? 'Already have an account? ' : 'New to FitTracker? '}
                            <Box component="button" type="button" onClick={() => switchMode(isRegister ? '/login' : '/register')}
                                 sx={{
                                     background: 'none', border: 'none', p: 0, cursor: 'pointer', color: '#e94560',
                                     fontWeight: 700, fontSize: 'inherit', fontFamily: FONT,
                                     '&:hover': { textDecoration: 'underline' },
                                 }}>
                                {isRegister ? 'Sign in' : 'Create an account'}
                            </Box>
                        </Typography>
                        {isRegister && (
                            <Typography sx={{ textAlign: 'center', mt: 1.5, color: theme.mix(0.4), fontSize: '0.78rem', fontFamily: FONT }}>
                                By creating an account you agree to how we handle your data in our{' '}
                                <Box component={Link} to="/privacy" sx={{ color: '#e94560', fontWeight: 600 }}>Privacy Policy</Box>.
                            </Typography>
                        )}
                    </Card>
                </Box>
            </Box>
        </Box>
    );
}

export default AuthPage;