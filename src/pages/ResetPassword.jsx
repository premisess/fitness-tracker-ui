import { useState } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import API from '../services/api';
import { errorMessage } from '../services/errors';
import { useAppTheme } from '../context/ThemeContext';
import {
    Box, Button, TextField, Typography, Paper, Alert, CircularProgress, IconButton, InputAdornment
} from '@mui/material';
import FitnessCenterIcon from '@mui/icons-material/FitnessCenter';
import Visibility from '@mui/icons-material/Visibility';
import VisibilityOff from '@mui/icons-material/VisibilityOff';
import Blobs from '../components/Glass';
import { FONT, glassCard, fieldStyle } from '../theme/styles';

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
            setError(errorMessage(err, 'Invalid or expired reset link. Please request a new one.'));
        } finally {
            setLoading(false);
        }
    };

    const inputStyle = fieldStyle(theme);

    return (
        <Box sx={{
            minHeight: '100vh',
            background: theme.bgGradient,
            fontFamily: FONT,
            position: 'relative',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
            <Blobs />
            <Paper elevation={10} sx={{
                ...glassCard(theme),
                p: 5, width: '100%', maxWidth: 420,
                position: 'relative', zIndex: 1,
            }}>
                <Box sx={{ textAlign: 'center', mb: 3 }}>
                    <FitnessCenterIcon sx={{ fontSize: 40, color: '#e94560' }} />
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
                                   required margin="normal" sx={inputStyle}
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