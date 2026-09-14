import { useState } from 'react';
import { Link } from 'react-router-dom';
import API from '../services/api';
import { errorMessage } from '../services/errors';
import { useAppTheme } from '../context/ThemeContext';
import {
    Box, Button, TextField, Typography, Paper, Alert, CircularProgress
} from '@mui/material';
import FitnessCenterIcon from '@mui/icons-material/FitnessCenter';

function ForgotPassword() {
    const { theme } = useAppTheme();
    const [email, setEmail] = useState('');
    const [loading, setLoading] = useState(false);
    const [success, setSuccess] = useState('');
    const [error, setError] = useState('');

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');
        setSuccess('');
        try {
            await API.post('/auth/forgot-password', { email });
            setSuccess('If this email exists, a reset link has been sent. Check your inbox!');
        } catch (err) {
            setError(errorMessage(err, 'Something went wrong. Please try again.'));
        } finally {
            setLoading(false);
        }
    };

    const fieldStyle = {
        '& .MuiOutlinedInput-root': { '& fieldset': { borderColor: theme.mix(0.2) } },
        '& .MuiInputLabel-root': { color: theme.mix(0.5) },
        '& .MuiInputBase-input': { color: theme.mix(1) },
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
                    <Typography variant="h5" sx={{ color: theme.mix(1), fontWeight: 700, mt: 1, fontFamily: "'Poppins', sans-serif" }}>
                        Forgot Password
                    </Typography>
                    <Typography variant="body2" sx={{ color: theme.mix(0.5), mt: 0.5, fontFamily: "'Poppins', sans-serif" }}>
                        Enter your email to receive a reset link
                    </Typography>
                </Box>

                {success && <Alert severity="success" sx={{ mb: 2 }}>{success}</Alert>}
                {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

                {!success && (
                    <Box component="form" onSubmit={handleSubmit}>
                        <TextField fullWidth label="Email" type="email" value={email}
                                   onChange={(e) => setEmail(e.target.value)}
                                   required margin="normal" sx={fieldStyle} />
                        <Button fullWidth type="submit" variant="contained" disabled={loading}
                                sx={{
                                    mt: 2, py: 1.5, borderRadius: 2,
                                    background: 'linear-gradient(90deg, #e94560, #0f3460)',
                                    fontWeight: 700, fontFamily: "'Poppins', sans-serif",
                                    '&:hover': { background: 'linear-gradient(90deg, #c73652, #0a2540)' }
                                }}>
                            {loading ? <CircularProgress size={24} color="inherit" /> : 'Send Reset Link'}
                        </Button>
                    </Box>
                )}

                <Typography sx={{ textAlign: 'center', mt: 3, color: theme.mix(0.5), fontFamily: "'Poppins', sans-serif" }}>
                    <Link to="/login" style={{ color: '#e94560', textDecoration: 'none', fontWeight: 600 }}>
                        Back to Login
                    </Link>
                </Typography>
            </Paper>
        </Box>
    );
}

export default ForgotPassword;