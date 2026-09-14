import { useState } from 'react';
import API from '../services/api';
import { errorMessage } from '../services/errors';
import { useAppTheme } from '../context/ThemeContext';
import { useNavigate, Link } from 'react-router-dom';
import {
    Box, Button, TextField, Typography, Paper, Alert, CircularProgress, IconButton, InputAdornment
} from '@mui/material';
import FitnessCenterIcon from '@mui/icons-material/FitnessCenter';
import Visibility from '@mui/icons-material/Visibility';
import VisibilityOff from '@mui/icons-material/VisibilityOff';

function Login() {
    const { theme } = useAppTheme();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();

    const handleLogin = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);
        try {
            const response = await API.post('/auth/login', { email, password });
            const { role, name, email: userEmail } = response.data;
            localStorage.setItem('role', role);
            localStorage.setItem('name', name);
            localStorage.setItem('email', userEmail);
            // Don't reset hasLoggedInBefore on login — keep it as is
            if (role === 'ADMIN') {
                navigate('/admin/dashboard');
            } else {
                navigate('/dashboard');
            }
        } catch (err) {
            if (err.response) {
                setError(err.response.status === 401 ? 'Invalid email or password. Please try again.' : errorMessage(err, 'Sign in failed. Please try again.'));
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
                        Sign in to your account
                    </Typography>
                </Box>

                {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

                <Box component="form" onSubmit={handleLogin}>
                    <TextField fullWidth label="Email" type="email" value={email}
                               onChange={(e) => setEmail(e.target.value)}
                               required margin="normal" sx={fieldStyle} />

                    <TextField fullWidth label="Password" value={password}
                               onChange={(e) => setPassword(e.target.value)}
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

                    <Box sx={{ textAlign: 'right', mt: 0.5, mb: 1 }}>
                        <Link to="/forgot-password" style={{ color: '#e94560', textDecoration: 'none', fontSize: '0.85rem', fontFamily: "'Poppins', sans-serif" }}>
                            Forgot Password?
                        </Link>
                    </Box>

                    <Button fullWidth type="submit" variant="contained" disabled={loading}
                            sx={{
                                mt: 2, py: 1.5, borderRadius: 2,
                                background: 'linear-gradient(90deg, #e94560, #0f3460)',
                                fontWeight: 700, fontSize: '1rem', fontFamily: "'Poppins', sans-serif",
                                '&:hover': { background: 'linear-gradient(90deg, #c73652, #0a2540)' }
                            }}>
                        {loading ? <CircularProgress size={24} color="inherit" /> : 'Login'}
                    </Button>
                </Box>

                <Typography sx={{ textAlign: 'center', mt: 3, color: theme.mix(0.5), fontFamily: "'Poppins', sans-serif" }}>
                    Don't have an account?{' '}
                    <Link to="/register" style={{ color: '#e94560', textDecoration: 'none', fontWeight: 600 }}>
                        Register
                    </Link>
                </Typography>
            </Paper>
        </Box>
    );
}

export default Login;