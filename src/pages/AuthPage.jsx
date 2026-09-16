import { useEffect, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { keyframes } from '@emotion/react';
import {
    Alert, Box, Button, CircularProgress, Divider, IconButton, InputAdornment, TextField, Typography, useMediaQuery,
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

// On wide screens the form takes this share of the width and the animated scene fills the rest.
const FORM_WIDTH = 42;
const EASE = 'cubic-bezier(0.77, 0, 0.175, 1)';
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
 * Sign in (/login) and sign up (/register) on one page. Switching between them slides the form to the
 * other side of the screen while the animated scene moves the opposite way.
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

    // Start off-screen and slide in on the next frame.
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

    const formLeft = entered
        ? (isRegister ? '0%' : `${100 - FORM_WIDTH}%`)
        : (isRegister ? `-${FORM_WIDTH}%` : '100%');

    const formPanelSx = wide
        ? {
            position: 'absolute', top: 0, bottom: 0, width: `${FORM_WIDTH}%`, left: formLeft, zIndex: 2,
            transition: `left 0.9s ${EASE}`,
            boxShadow: '0 0 60px rgba(0,0,0,0.35)',
        }
        : {
            position: 'relative', mt: -3, borderRadius: '24px 24px 0 0', minHeight: 'calc(100vh - 216px)',
            opacity: entered ? 1 : 0, transform: entered ? 'none' : 'translateY(40px)',
            transition: `opacity 0.6s ease, transform 0.6s ${EASE}`,
        };

    const scenePanelSx = wide
        ? {
            position: 'absolute', top: 0, bottom: 0, width: `${100 - FORM_WIDTH}%`,
            left: isRegister ? `${FORM_WIDTH}%` : '0%', transition: `left 0.9s ${EASE}`,
        }
        : { height: 240 };

    return (
        <Box sx={{
            position: 'relative', background: theme.bgGradient, fontFamily: FONT,
            ...(wide ? { height: '100vh', overflow: 'hidden' } : { minHeight: '100vh' }),
        }}>
            <Box sx={scenePanelSx}>
                <AuthScene mode={mode} compact={!wide} />
            </Box>

            <Box sx={{ ...formPanelSx, background: theme.bgGradient, display: 'flex', flexDirection: 'column', overflowY: 'auto' }}>
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', px: { xs: 2.5, sm: 4 }, pt: 2.5 }}>
                    <Box component={Link} to="/" sx={{ display: 'flex', alignItems: 'center', gap: 1, textDecoration: 'none' }}>
                        <FitnessCenterIcon sx={{ color: '#e94560' }} />
                        <Typography sx={{ color: theme.mix(1), fontWeight: 800, letterSpacing: 1, fontFamily: FONT }}>
                            FitTracker
                        </Typography>
                    </Box>
                    <IconButton onClick={toggleTheme} sx={{ color: theme.mix(0.6) }} aria-label="Toggle dark mode">
                        {themeMode === 'dark' ? <LightModeIcon /> : <DarkModeIcon />}
                    </IconButton>
                </Box>

                <Box sx={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', px: { xs: 2.5, sm: 5 }, py: 4 }}>
                    <Box key={mode} sx={{ width: '100%', maxWidth: 380 }}>
                        <Typography component="h1" sx={{ color: theme.mix(1), fontWeight: 800, fontSize: '2rem', fontFamily: FONT, ...appear(0) }}>
                            {isRegister ? 'Create your account' : 'Welcome back'}
                        </Typography>
                        <Typography sx={{ color: theme.mix(0.55), mt: 0.5, fontFamily: FONT, ...appear(1) }}>
                            {isRegister ? 'It takes less than a minute.' : 'Sign in to keep your streak going.'}
                        </Typography>

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
                    </Box>
                </Box>
            </Box>
        </Box>
    );
}

export default AuthPage;
