import { useEffect, useState } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import API from '../services/api';
import { errorMessage } from '../services/errors';
import { useAppTheme } from '../context/ThemeContext';
import { Alert, Box, Button, CircularProgress, Paper, TextField, Typography } from '@mui/material';
import MarkEmailReadIcon from '@mui/icons-material/MarkEmailRead';
import Blobs from '../components/Glass';
import { FONT, glassCard, fieldStyle } from '../theme/styles';

const RESEND_WAIT_SECONDS = 60;

/** After sign-up: enter the 6-digit code emailed to you before using the app. */
function ConfirmEmail() {
    const { theme } = useAppTheme();
    const navigate = useNavigate();
    const [me, setMe] = useState(null);
    const [status, setStatus] = useState('checking'); // checking | ready | signedOut | done
    const [code, setCode] = useState('');
    const [verifying, setVerifying] = useState(false);
    const [error, setError] = useState('');
    const [notice, setNotice] = useState('');
    const [wait, setWait] = useState(RESEND_WAIT_SECONDS);

    useEffect(() => {
        let ignore = false;
        API.get('/auth/me')
            .then((res) => {
                if (ignore) return;
                setMe(res.data);
                setStatus(res.data.verificationRequired ? 'ready' : 'done');
            })
            .catch(() => { if (!ignore) setStatus('signedOut'); });
        return () => { ignore = true; };
    }, []);

    // Counts down until another code can be requested.
    useEffect(() => {
        if (wait <= 0) return undefined;
        const id = setTimeout(() => setWait((w) => w - 1), 1000);
        return () => clearTimeout(id);
    }, [wait]);

    const verify = async (e) => {
        e.preventDefault();
        setVerifying(true);
        setError('');
        setNotice('');
        try {
            await API.post('/auth/verify-code', { code });
            navigate(me?.role === 'ADMIN' ? '/admin/dashboard' : '/dashboard', { replace: true });
        } catch (err) {
            setError(errorMessage(err, 'Could not confirm the code. Please try again.'));
            setVerifying(false);
        }
    };

    const resend = async () => {
        setError('');
        setNotice('');
        try {
            const res = await API.post('/auth/resend-verification');
            setNotice(res.data?.message || 'We sent you a new code.');
            setCode('');
            setWait(RESEND_WAIT_SECONDS);
        } catch (err) {
            setError(errorMessage(err, 'Could not send a new code. Please try again in a minute.'));
        }
    };

    const logOut = async () => {
        try {
            await API.post('/auth/logout');
        } catch {
            // Already signed out on the server.
        }
        localStorage.clear();
        navigate('/login', { replace: true });
    };

    if (status === 'signedOut') return <Navigate to="/login" replace />;
    if (status === 'done') return <Navigate to={me?.role === 'ADMIN' ? '/admin/dashboard' : '/dashboard'} replace />;

    return (
        <Box sx={{
            minHeight: '100vh', background: theme.bgGradient, fontFamily: FONT, position: 'relative',
            display: 'flex', alignItems: 'center', justifyContent: 'center', px: 2,
        }}>
            <Blobs />
            <Paper elevation={10} sx={{ ...glassCard(theme), p: { xs: 3, sm: 5 }, width: '100%', maxWidth: 420, position: 'relative', zIndex: 1 }}>
                {status === 'checking' ? (
                    <Box sx={{ textAlign: 'center', py: 4 }}><CircularProgress sx={{ color: '#e94560' }} /></Box>
                ) : (
                    <>
                        <Box sx={{ textAlign: 'center', mb: 3 }}>
                            <MarkEmailReadIcon sx={{ fontSize: 44, color: '#4ecdc4' }} />
                            <Typography variant="h5" sx={{ color: theme.mix(1), fontWeight: 700, mt: 1, fontFamily: FONT }}>
                                Confirm your email
                            </Typography>
                            <Typography sx={{ color: theme.mix(0.6), mt: 1, fontSize: '0.9rem', fontFamily: FONT }}>
                                We sent a 6-digit code to <Box component="strong" sx={{ color: theme.mix(0.9) }}>{me?.email}</Box>.
                                Enter it below to finish signing up.
                            </Typography>
                        </Box>

                        {notice && <Alert severity="success" sx={{ mb: 2 }}>{notice}</Alert>}
                        {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

                        <Box component="form" onSubmit={verify}>
                            <TextField fullWidth autoFocus required value={code} placeholder="123456"
                                       onChange={(e) => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                                       slotProps={{
                                           htmlInput: {
                                               inputMode: 'numeric', autoComplete: 'one-time-code', maxLength: 6,
                                               'aria-label': 'Confirmation code',
                                               style: { textAlign: 'center', fontSize: '1.6rem', letterSpacing: '0.5em', fontWeight: 700 },
                                           },
                                       }}
                                       sx={{ ...fieldStyle(theme), mb: 2 }} />
                            <Button fullWidth type="submit" variant="contained" disabled={verifying || code.length !== 6}
                                    sx={{
                                        py: 1.2, borderRadius: 999, textTransform: 'none', fontWeight: 700, fontFamily: FONT,
                                        background: '#e94560', boxShadow: 'none', '&:hover': { background: '#d63d56', boxShadow: 'none' },
                                    }}>
                                {verifying ? <CircularProgress size={22} color="inherit" /> : 'Confirm'}
                            </Button>
                        </Box>

                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mt: 2.5, gap: 1, flexWrap: 'wrap' }}>
                            <Button onClick={resend} disabled={wait > 0}
                                    sx={{ textTransform: 'none', fontWeight: 600, fontFamily: FONT, color: '#4ecdc4', px: 0 }}>
                                {wait > 0 ? `Send a new code in ${wait}s` : 'Send a new code'}
                            </Button>
                            <Button onClick={logOut} sx={{ textTransform: 'none', fontFamily: FONT, color: theme.mix(0.55), px: 0 }}>
                                Use another email
                            </Button>
                        </Box>
                        <Typography sx={{ color: theme.mix(0.4), fontSize: '0.78rem', mt: 1.5, textAlign: 'center', fontFamily: FONT }}>
                            Can't find it? Check your spam folder.
                        </Typography>
                    </>
                )}
            </Paper>
        </Box>
    );
}

export default ConfirmEmail;
