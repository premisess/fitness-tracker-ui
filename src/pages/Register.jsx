import { useState } from 'react';
import API from '../services/api';
import { useAppTheme } from '../context/ThemeContext';
import { useNavigate, Link } from 'react-router-dom';
import {
    Box, Button, TextField, Typography, Paper, Alert, CircularProgress, IconButton, InputAdornment
} from '@mui/material';
import FitnessCenterIcon from '@mui/icons-material/FitnessCenter';
import Visibility from '@mui/icons-material/Visibility';
import VisibilityOff from '@mui/icons-material/VisibilityOff';

function Register() {
    const { theme } = useAppTheme();
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [passwordStrength, setPasswordStrength] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();

    const checkPasswordStrength = (pwd) => {
        if (pwd.length === 0) return '';
        if (pwd.length < 6) return 'Weak';
        if (pwd.length >= 10 && /[A-Z]/.test(pwd) && /[0-9]/.test(pwd) && /[^A-Za-z0-9]/.test(pwd)) return 'Strong';
        if (pwd.length >= 8 && /[A-Z]/.test(pwd) && /[0-9]/.test(pwd)) return 'Medium';
        if (pwd.length < 10 && /[A-Z]/.test(pwd) && /[0-9]/.test(pwd)) return 'Medium';
        return 'Weak';
    };

    const strengthColor = {
        Weak: '#e94560',
        Medium: '#ffa726',
        Strong: '#4ecdc4',
    };

    const strengthWidth = {
        Weak: '33%',
        Medium: '66%',
        Strong: '100%',
    };

    const handleRegister = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);
        try {
            const response = await API.post('/auth/register', { name, email, password });
            const { role, name: userName, email: userEmail } = response.data;
            localStorage.setItem('role', role);
            localStorage.setItem('name', userName);
            localStorage.setItem('email', userEmail);
            localStorage.setItem('hasLoggedInBefore', 'false');
            if (role === 'ADMIN') {
                navigate('/admin/dashboard');
            } else {
                navigate('/dashboard');
            }
        } catch (err) {
            if (err.response) {
                setError(err.response.data?.message || 'Registration failed. Email may already be in use.');
            } else {
                setError('Cannot reach the server. Make sure the backend is running, then try again.');
            }
        } finally {
            setLoading(false);
        }
    };

    const fieldStyle = {
        '& .MuiOutlinedInput-root': { '& fieldset': { borderColor: theme.mix(0.2) } },
        '& .MuiInputLabel-root': { color: theme.mix(0.5) },
        '& .MuiInputBase-input': { color: theme.mix(1) },
        '& .MuiIconButton-root': { color: theme.mix(0.5) },
    };

    return (
        <Box sx={{
            minHeight: '100vh',
            background: theme.bgGradient,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
            <Paper elevation={10} sx={{
                p: 5, width: '100%', maxWidth: 420, borderRadius: 4,
                background: theme.mix(0.05),
                backdropFilter: 'blur(10px)',
                border: `1px solid ${theme.mix(0.1)}`,
            }}>
                <Box sx={{ textAlign: 'center', mb: 3 }}>
                    <FitnessCenterIcon sx={{ fontSize: 50, color: '#e94560' }} />
                    <Typography variant="h4" sx={{ color: theme.mix(1), fontWeight: 700, mt: 1, fontFamily: "'Poppins', sans-serif" }}>
                        FitTracker
                    </Typography>
                    <Typography variant="body2" sx={{ color: theme.mix(0.5), mt: 0.5, fontFamily: "'Poppins', sans-serif" }}>
                        Create your account
                    </Typography>
                </Box>

                {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

                <Box component="form" onSubmit={handleRegister}>
                    <TextField fullWidth label="Full Name" type="text" value={name}
                               onChange={(e) => setName(e.target.value)}
                               required margin="normal" sx={fieldStyle} />

                    <TextField fullWidth label="Email" type="email" value={email}
                               onChange={(e) => setEmail(e.target.value)}
                               required margin="normal" sx={fieldStyle} />

                    <TextField fullWidth label="Password" value={password}
                               onChange={(e) => {
                                   setPassword(e.target.value);
                                   setPasswordStrength(checkPasswordStrength(e.target.value));
                               }}
                               required margin="normal" sx={fieldStyle}
                               type={showPassword ? 'text' : 'password'}
                               slotProps={{
                                   input: {
                                       endAdornment: (
                                           <InputAdornment position="end">
                                               <IconButton onClick={() => setShowPassword(!showPassword)} edge="end">
                                                   {showPassword ? <VisibilityOff /> : <Visibility />}
                                               </IconButton>
                                           </InputAdornment>
                                       )
                                   }
                               }} />

                    {/* Password Strength Indicator */}
                    {passwordStrength && (
                        <Box sx={{ mb: 2, mt: 0.5 }}>
                            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                                <Typography sx={{ color: theme.mix(0.5), fontSize: '0.75rem', fontFamily: "'Poppins', sans-serif" }}>
                                    Password Strength
                                </Typography>
                                <Typography sx={{ color: strengthColor[passwordStrength], fontSize: '0.75rem', fontWeight: 700, fontFamily: "'Poppins', sans-serif" }}>
                                    {passwordStrength}
                                </Typography>
                            </Box>
                            <Box sx={{ width: '100%', height: 4, background: theme.mix(0.1), borderRadius: 2 }}>
                                <Box sx={{
                                    width: strengthWidth[passwordStrength],
                                    height: '100%',
                                    background: strengthColor[passwordStrength],
                                    borderRadius: 2,
                                    transition: 'width 0.3s, background 0.3s'
                                }} />
                            </Box>
                            <Typography sx={{ color: theme.mix(0.3), fontSize: '0.7rem', mt: 0.5, fontFamily: "'Poppins', sans-serif" }}>
                                {passwordStrength === 'Weak' && 'Use at least 6 characters with uppercase and numbers'}
                                {passwordStrength === 'Medium' && 'Add special symbols (!@#$) to make it stronger'}
                                {passwordStrength === 'Strong' && 'Great password! You are well protected.'}
                            </Typography>
                        </Box>
                    )}

                    <Button fullWidth type="submit" variant="contained" disabled={loading}
                            sx={{
                                mt: 2, py: 1.5, borderRadius: 2,
                                background: 'linear-gradient(90deg, #e94560, #0f3460)',
                                fontWeight: 700, fontSize: '1rem', fontFamily: "'Poppins', sans-serif",
                                '&:hover': { background: 'linear-gradient(90deg, #c73652, #0a2540)' }
                            }}>
                        {loading ? <CircularProgress size={24} color="inherit" /> : 'Register'}
                    </Button>
                </Box>

                <Typography sx={{ textAlign: 'center', mt: 3, color: theme.mix(0.5), fontFamily: "'Poppins', sans-serif" }}>
                    Already have an account?{' '}
                    <Link to="/login" style={{ color: '#e94560', textDecoration: 'none', fontWeight: 600 }}>
                        Login
                    </Link>
                </Typography>
            </Paper>
        </Box>
    );
}

export default Register;