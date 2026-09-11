import { useState } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import API from '../services/api';
import { useAppTheme } from '../context/ThemeContext';
import {
    Box, Button, TextField, Typography, Paper, Alert, CircularProgress, IconButton, InputAdornment
} from '@mui/material';
import FitnessCenterIcon from '@mui/icons-material/FitnessCenter';
import Visibility from '@mui/icons-material/Visibility';
import VisibilityOff from '@mui/icons-material/VisibilityOff';

function ResetPassword() {
    const { theme } = useAppTheme();
    const [newPassword, setNewPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [loading, setLoading] = useState(false);
    const [success, setSuccess] = useState('');
    const [error, setError] = useState('');
    const [searchParams] = useSearchParams();
    const token = searchParams.get('token');
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');
        setSuccess('');
        try {
            await API.post('/auth/reset-password', { token, newPassword });
            setSuccess('Password reset successfully! Redirecting to login...');
            setTimeout(() => navigate('/login'), 3000);
        } catch (err) {
            setError('Invalid or expired reset link. Please request a new one.');
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
                    <Typography variant="h5" sx={{ color: theme.mix(1), fontWeight: 700, mt: 1, fontFamily: "'Poppins', sans-serif" }}>
                        Reset Password
                    </Typography>
                    <Typography variant="body2" sx={{ color: theme.mix(0.5), mt: 0.5, fontFamily: "'Poppins', sans-serif" }}>
                        Enter your new password
                    </Typography>
                </Box>

                {success && <Alert severity="success" sx={{ mb: 2 }}>{success}</Alert>}
                {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

                {!success && (
                    <Box component="form" onSubmit={handleSubmit}>
                        <TextField fullWidth label="New Password" value={newPassword}
                                   onChange={(e) => setNewPassword(e.target.value)}
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
                        <Button fullWidth type="submit" variant="contained" disabled={loading}
                                sx={{
                                    mt: 2, py: 1.5, borderRadius: 2,
                                    background: 'linear-gradient(90deg, #e94560, #0f3460)',
                                    fontWeight: 700, fontFamily: "'Poppins', sans-serif",
                                    '&:hover': { background: 'linear-gradient(90deg, #c73652, #0a2540)' }
                                }}>
                            {loading ? <CircularProgress size={24} color="inherit" /> : 'Reset Password'}
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

export default ResetPassword;