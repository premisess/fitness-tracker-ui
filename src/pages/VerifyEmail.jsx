import { useEffect, useRef, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { keyframes } from '@emotion/react';
import { Box, Button, Card, CardContent, CircularProgress, Typography } from '@mui/material';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import ErrorOutlineIcon from '@mui/icons-material/ErrorOutlined';
import API from '../services/api';
import { errorMessage } from '../services/errors';
import { useAppTheme } from '../context/ThemeContext';

const pop = keyframes`
  0% { transform: scale(0); }
  70% { transform: scale(1.15); }
  100% { transform: scale(1); }
`;

/** Opened from the link in the verification email: /verify-email?token=... */
function VerifyEmail() {
    const { theme } = useAppTheme();
    const [searchParams] = useSearchParams();
    const token = searchParams.get('token');
    const [status, setStatus] = useState(token ? 'verifying' : 'error');
    const [message, setMessage] = useState(token ? '' : 'This verification link is incomplete. Open the link from your email again.');
    // A token only works once, so never send it twice (React runs effects twice in development).
    const sentRef = useRef(false);

    useEffect(() => {
        if (!token || sentRef.current) return;
        sentRef.current = true;
        API.post('/auth/verify-email', { token })
            .then((res) => {
                setStatus('success');
                setMessage(res.data?.message || 'Your email address is verified.');
            })
            .catch((err) => {
                setStatus('error');
                setMessage(errorMessage(err, 'This verification link is invalid or has expired.'));
            });
    }, [token]);

    const signedIn = !!localStorage.getItem('email');

    return (
        <Box sx={{ minHeight: '100vh', background: theme.bgGradient, display: 'flex', alignItems: 'center', justifyContent: 'center', px: 2 }}>
            <Card sx={{ maxWidth: 440, width: '100%', background: theme.mix(0.05), border: `1px solid ${theme.mix(0.1)}`, borderRadius: 4 }}>
                <CardContent sx={{ p: 5, textAlign: 'center', fontFamily: "'Poppins', sans-serif" }}>
                    {status === 'verifying' && <CircularProgress sx={{ color: '#e94560', mb: 2 }} />}
                    {status === 'success' && <CheckCircleIcon sx={{ fontSize: 72, color: '#4ecdc4', mb: 1, animation: `${pop} 0.5s ease` }} />}
                    {status === 'error' && <ErrorOutlineIcon sx={{ fontSize: 72, color: '#e94560', mb: 1 }} />}

                    <Typography variant="h5" sx={{ color: theme.mix(1), fontWeight: 700, mb: 1 }}>
                        {status === 'verifying' ? 'Confirming your email…' : status === 'success' ? 'Email confirmed!' : "We couldn't confirm your email"}
                    </Typography>
                    {message && <Typography sx={{ color: theme.mix(0.6), mb: 3 }}>{message}</Typography>}

                    {status !== 'verifying' && (
                        <Button component={Link} to={signedIn ? '/dashboard' : '/login'} variant="contained"
                                sx={{ borderRadius: 999, px: 4, textTransform: 'none', fontWeight: 700, background: 'linear-gradient(90deg, #e94560, #0f3460)' }}>
                            {signedIn ? 'Go to your dashboard' : 'Sign in'}
                        </Button>
                    )}
                </CardContent>
            </Card>
        </Box>
    );
}

export default VerifyEmail;
