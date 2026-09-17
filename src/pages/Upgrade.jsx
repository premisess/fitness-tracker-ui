import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { keyframes } from '@emotion/react';
import {
    Alert, AppBar, Box, Button, Card, CardContent, Chip, CircularProgress, IconButton, TextField, Toolbar, Typography,
} from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import WorkspacePremiumIcon from '@mui/icons-material/WorkspacePremium';
import CheckIcon from '@mui/icons-material/Check';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import PhoneAndroidIcon from '@mui/icons-material/PhoneAndroid';
import API from '../services/api';
import { errorMessage } from '../services/errors';
import { useAppTheme } from '../context/ThemeContext';

// Only for showing a rough dollar figure; customers always pay the shilling price.
const TZS_PER_USD = 2650;
const POLL_EVERY_MS = 4000;
const GIVE_UP_AFTER_MS = 3 * 60 * 1000;

const NETWORKS = [
    { name: 'M-Pesa', color: '#e60000' },
    { name: 'Mixx by Yas', color: '#0b3d91' },
    { name: 'Airtel Money', color: '#ed1c24' },
    { name: 'HaloPesa', color: '#f58220' },
];

const FREE_FEATURES = [
    'Log workouts with sets, reps and weights',
    'GPS runs with maps',
    '870+ exercise library with demos',
    "Today's food diary and calorie targets",
    'Water, BMI, goals, streaks and badges',
];

const ULTIMATE_FEATURES = [
    'Structured workout plans, session by session',
    '30 to 90-day nutrition history and charts',
    'Save your own foods for quick logging',
    'Advanced analytics',
    'PDF workout reports',
    'Every new Ultimate feature as it launches',
];

const glow = keyframes`
  0%, 100% { filter: drop-shadow(0 0 6px rgba(255,209,102,0.6)); transform: scale(1); }
  50% { filter: drop-shadow(0 0 18px rgba(255,209,102,0.95)); transform: scale(1.06); }
`;
const ring = keyframes`
  from { transform: scale(0.8); opacity: 0.7; }
  to { transform: scale(2); opacity: 0; }
`;
const pop = keyframes`
  0% { transform: scale(0); }
  70% { transform: scale(1.15); }
  100% { transform: scale(1); }
`;
const noMotion = { '@media (prefers-reduced-motion: reduce)': { animation: 'none' } };

const tsh = (amount) => `TSh ${amount.toLocaleString('en-US')}`;
const usd = (amount) => `about $${Math.round(amount / TZS_PER_USD)}`;
const formatDate = (value) => new Date(value).toLocaleDateString(undefined, { day: 'numeric', month: 'long', year: 'numeric' });

function Upgrade() {
    const { theme } = useAppTheme();
    const navigate = useNavigate();
    const [status, setStatus] = useState(null);
    const [plan, setPlan] = useState('YEARLY');
    const [phone, setPhone] = useState('');
    const [payment, setPayment] = useState(null);
    const [startedAt, setStartedAt] = useState(0);
    const [timedOut, setTimedOut] = useState(false);
    const [error, setError] = useState('');
    const [submitting, setSubmitting] = useState(false);

    useEffect(() => {
        let ignore = false;
        API.get('/billing/status')
            .then((res) => { if (!ignore) setStatus(res.data); })
            .catch((err) => { if (!ignore) setError(errorMessage(err, 'Could not load Ultimate plans')); });
        return () => { ignore = true; };
    }, []);

    // While the customer approves on their phone, ask the server for the result every few seconds.
    const pendingReference = payment?.status === 'PENDING' && !timedOut ? payment.orderReference : null;
    useEffect(() => {
        if (!pendingReference) return undefined;
        const timer = setInterval(async () => {
            if (Date.now() - startedAt > GIVE_UP_AFTER_MS) {
                setTimedOut(true);
                return;
            }
            try {
                const res = await API.get(`/billing/payments/${pendingReference}`);
                setPayment(res.data);
            } catch {
                // Try again on the next tick.
            }
        }, POLL_EVERY_MS);
        return () => clearInterval(timer);
    }, [pendingReference, startedAt]);

    const pay = async () => {
        setError('');
        setSubmitting(true);
        try {
            const res = await API.post('/billing/checkout', { plan, phoneNumber: phone });
            setTimedOut(false);
            setStartedAt(Date.now());
            setPayment(res.data);
        } catch (err) {
            setError(errorMessage(err, 'Could not start the payment'));
        } finally {
            setSubmitting(false);
        }
    };

    const checkAgain = async () => {
        try {
            const res = await API.get(`/billing/payments/${payment.orderReference}`);
            setPayment(res.data);
            if (res.data.status === 'PENDING') {
                setStartedAt(Date.now());
                setTimedOut(false);
            }
        } catch (err) {
            setError(errorMessage(err, 'Could not check the payment'));
        }
    };

    const cardStyle = { background: theme.mix(0.05), border: `1px solid ${theme.mix(0.1)}`, borderRadius: 3 };
    const prices = Object.fromEntries((status?.prices || []).map((p) => [p.plan, p.amountTzs]));
    const monthly = prices.MONTHLY ?? 0;
    const yearly = prices.YEARLY ?? 0;
    const yearlySaving = monthly > 0 ? Math.round((1 - yearly / (monthly * 12)) * 100) : 0;
    const amount = plan === 'YEARLY' ? yearly : monthly;

    const fieldStyle = {
        '& .MuiOutlinedInput-root': { '& fieldset': { borderColor: theme.mix(0.2) } },
        '& .MuiInputLabel-root': { color: theme.mix(0.5) },
        '& .MuiInputBase-input': { color: theme.mix(1) },
        '& .MuiFormHelperText-root': { color: theme.mix(0.45) },
    };

    return (
        <Box sx={{ minHeight: '100vh', background: theme.bgGradient, fontFamily: "'Poppins', sans-serif" }}>
            <AppBar position="static" sx={{ background: theme.mix(0.05), backdropFilter: 'blur(10px)', boxShadow: 'none', borderBottom: `1px solid ${theme.mix(0.1)}` }}>
                <Toolbar>
                    <IconButton onClick={() => navigate(-1)} sx={{ color: theme.mix(1), mr: 1 }} aria-label="Back">
                        <ArrowBackIcon />
                    </IconButton>
                    <WorkspacePremiumIcon sx={{ color: '#ffd166', mr: 1 }} />
                    <Typography variant="h6" sx={{ color: theme.mix(1), fontWeight: 700 }}>FitTracker Ultimate</Typography>
                </Toolbar>
            </AppBar>

            <Box sx={{ maxWidth: 900, mx: 'auto', py: 4, px: 2 }}>
                <Card sx={{
                    mb: 3, borderRadius: 4, color: '#fff', overflow: 'hidden',
                    background: 'linear-gradient(135deg, #1a1a2e 0%, #0f3460 55%, #e94560 130%)',
                }}>
                    <CardContent sx={{ p: { xs: 3, sm: 5 }, textAlign: 'center' }}>
                        <WorkspacePremiumIcon sx={{ fontSize: 72, color: '#ffd166', animation: `${glow} 2.4s ease-in-out infinite`, ...noMotion }} />
                        <Typography variant="h4" sx={{ fontWeight: 800, mt: 1, color: 'inherit' }}>Train smarter with Ultimate</Typography>
                        <Typography sx={{ opacity: 0.8, mt: 1, maxWidth: 520, mx: 'auto', color: 'inherit' }}>
                            Guided plans, deeper nutrition insights and reports. Pay with the mobile money you already use.
                        </Typography>
                        {status?.ultimate && (
                            <Chip icon={<CheckCircleIcon sx={{ color: '#1a1a2e !important' }} />}
                                  label={status.ultimateUntil ? `You're Ultimate until ${formatDate(status.ultimateUntil)}` : "You're Ultimate"}
                                  sx={{ mt: 2.5, background: '#ffd166', color: '#1a1a2e', fontWeight: 700 }} />
                        )}
                    </CardContent>
                </Card>

                {error && <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError('')}>{error}</Alert>}
                {!status && !error && <Box sx={{ textAlign: 'center', py: 6 }}><CircularProgress sx={{ color: '#e94560' }} /></Box>}

                {status && (
                    <>
                        <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' }, gap: 2, mb: 3 }}>
                            <Card sx={cardStyle}>
                                <CardContent>
                                    <Typography sx={{ color: theme.mix(0.8), fontWeight: 700, mb: 1.5 }}>Free</Typography>
                                    {FREE_FEATURES.map((f) => (
                                        <Box key={f} sx={{ display: 'flex', gap: 1, mb: 1 }}>
                                            <CheckIcon sx={{ color: theme.mix(0.4), fontSize: 20 }} />
                                            <Typography sx={{ color: theme.mix(0.65), fontSize: '0.9rem' }}>{f}</Typography>
                                        </Box>
                                    ))}
                                </CardContent>
                            </Card>
                            <Card sx={{ ...cardStyle, border: '1px solid rgba(255,209,102,0.5)', background: 'linear-gradient(135deg, rgba(255,209,102,0.12), rgba(233,69,96,0.08))' }}>
                                <CardContent>
                                    <Typography sx={{ color: '#ffd166', fontWeight: 700, mb: 1.5 }}>Everything in Free, plus</Typography>
                                    {ULTIMATE_FEATURES.map((f) => (
                                        <Box key={f} sx={{ display: 'flex', gap: 1, mb: 1 }}>
                                            <CheckIcon sx={{ color: '#ffd166', fontSize: 20 }} />
                                            <Typography sx={{ color: theme.mix(0.9), fontSize: '0.9rem' }}>{f}</Typography>
                                        </Box>
                                    ))}
                                </CardContent>
                            </Card>
                        </Box>

                        <Card sx={cardStyle}>
                            <CardContent sx={{ p: { xs: 2.5, sm: 4 } }}>
                                {payment?.status === 'SUCCESS' ? (
                                    <Box sx={{ textAlign: 'center', py: 3 }}>
                                        <CheckCircleIcon sx={{ fontSize: 80, color: '#4ecdc4', animation: `${pop} 0.5s ease`, ...noMotion }} />
                                        <Typography variant="h5" sx={{ color: theme.mix(1), fontWeight: 800, mt: 1 }}>Welcome to Ultimate!</Typography>
                                        <Typography sx={{ color: theme.mix(0.6), mt: 1 }}>
                                            Payment received. Your access runs until {formatDate(payment.ultimateUntil)}.
                                        </Typography>
                                        <Button onClick={() => navigate('/plans')} variant="contained"
                                                sx={{ mt: 3, borderRadius: 999, px: 4, textTransform: 'none', fontWeight: 700, background: 'linear-gradient(90deg, #ffd166, #e94560)', color: '#1a1a2e' }}>
                                            Explore workout plans
                                        </Button>
                                    </Box>
                                ) : payment?.status === 'PENDING' ? (
                                    <Box sx={{ textAlign: 'center', py: 3 }}>
                                        <Box sx={{ position: 'relative', width: 96, height: 96, mx: 'auto', mb: 2 }}>
                                            {!timedOut && [0, 1].map((i) => (
                                                <Box key={i} sx={{
                                                    position: 'absolute', inset: 0, borderRadius: '50%', border: '2px solid #4ecdc4',
                                                    animation: `${ring} 2s ease-out ${i}s infinite`, ...noMotion,
                                                }} />
                                            ))}
                                            <Box sx={{ position: 'absolute', inset: 16, borderRadius: '50%', background: 'rgba(78,205,196,0.18)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                                <PhoneAndroidIcon sx={{ fontSize: 36, color: '#4ecdc4' }} />
                                            </Box>
                                        </Box>
                                        <Typography variant="h6" sx={{ color: theme.mix(1), fontWeight: 700 }}>
                                            {timedOut ? 'Still waiting for your approval' : 'Check your phone'}
                                        </Typography>
                                        <Typography sx={{ color: theme.mix(0.6), mt: 1, maxWidth: 420, mx: 'auto' }}>
                                            {timedOut
                                                ? "We haven't received confirmation yet. If you already entered your PIN, it can take a moment."
                                                : `Enter your mobile money PIN to approve ${tsh(payment.amountTzs)}. This page updates by itself.`}
                                        </Typography>
                                        {!timedOut && <CircularProgress size={22} sx={{ color: '#4ecdc4', mt: 2 }} />}
                                        {timedOut && (
                                            <Box sx={{ display: 'flex', gap: 1, justifyContent: 'center', mt: 2 }}>
                                                <Button onClick={checkAgain} variant="contained" sx={{ borderRadius: 999, textTransform: 'none', fontWeight: 700 }}>Check again</Button>
                                                <Button onClick={() => setPayment(null)} sx={{ color: theme.mix(0.6), textTransform: 'none' }}>Start over</Button>
                                            </Box>
                                        )}
                                    </Box>
                                ) : (
                                    <>
                                        {payment?.status === 'FAILED' && (
                                            <Alert severity="error" sx={{ mb: 2 }}>
                                                {payment.message || 'The payment was not completed.'} You have not been charged for Ultimate. Try again below.
                                            </Alert>
                                        )}

                                        <Typography sx={{ color: theme.mix(1), fontWeight: 700, mb: 2 }}>
                                            {status.ultimate ? 'Add more time' : 'Choose your plan'}
                                        </Typography>
                                        <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' }, gap: 2, mb: 3 }}>
                                            {[
                                                { key: 'MONTHLY', title: 'Monthly', amount: monthly, per: 'month' },
                                                { key: 'YEARLY', title: 'Yearly', amount: yearly, per: 'year', note: yearlySaving > 0 ? `Save ${yearlySaving}%` : null },
                                            ].map((option) => (
                                                <Box key={option.key} onClick={() => setPlan(option.key)} role="button" tabIndex={0}
                                                     onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') setPlan(option.key); }}
                                                     sx={{
                                                         position: 'relative', p: 2.5, borderRadius: 3, cursor: 'pointer', transition: 'all 0.2s',
                                                         border: `2px solid ${plan === option.key ? '#ffd166' : theme.mix(0.12)}`,
                                                         background: plan === option.key ? 'rgba(255,209,102,0.1)' : 'transparent',
                                                     }}>
                                                    {option.note && (
                                                        <Chip size="small" label={option.note} sx={{ position: 'absolute', top: 12, right: 12, background: '#4ecdc4', color: '#1a1a2e', fontWeight: 700 }} />
                                                    )}
                                                    <Typography sx={{ color: theme.mix(0.7), fontWeight: 600 }}>{option.title}</Typography>
                                                    <Typography sx={{ color: theme.mix(1), fontWeight: 800, fontSize: '1.6rem' }}>
                                                        {tsh(option.amount)}
                                                        <Typography component="span" sx={{ color: theme.mix(0.5), fontSize: '0.9rem' }}> / {option.per}</Typography>
                                                    </Typography>
                                                    <Typography sx={{ color: theme.mix(0.45), fontSize: '0.8rem' }}>{usd(option.amount)}</Typography>
                                                </Box>
                                            ))}
                                        </Box>

                                        <Typography sx={{ color: theme.mix(0.7), fontSize: '0.85rem', mb: 1 }}>Pay with</Typography>
                                        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mb: 2.5 }}>
                                            {NETWORKS.map((n) => (
                                                <Chip key={n.name} label={n.name} sx={{ background: n.color, color: '#fff', fontWeight: 700 }} />
                                            ))}
                                        </Box>

                                        {!status.paymentsEnabled && (
                                            <Alert severity="info" sx={{ mb: 2 }}>
                                                Mobile money payments aren't switched on for this site yet.
                                            </Alert>
                                        )}

                                        <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap', alignItems: 'flex-start' }}>
                                            <TextField label="Mobile money number" placeholder="0712 345 678" value={phone} type="tel"
                                                       onChange={(e) => setPhone(e.target.value)} autoComplete="tel"
                                                       helperText="You'll get a PIN prompt on this phone"
                                                       sx={{ ...fieldStyle, flex: 1, minWidth: 220 }} />
                                            <Button onClick={pay} disabled={submitting || !phone.trim() || !status.paymentsEnabled} variant="contained"
                                                    sx={{
                                                        py: 1.7, px: 4, borderRadius: 999, textTransform: 'none', fontWeight: 800, fontSize: '1rem',
                                                        background: 'linear-gradient(90deg, #ffd166, #e94560)', color: '#1a1a2e',
                                                    }}>
                                                {submitting ? <CircularProgress size={22} color="inherit" /> : `Pay ${tsh(amount)}`}
                                            </Button>
                                        </Box>
                                        <Typography sx={{ color: theme.mix(0.4), fontSize: '0.75rem', mt: 2 }}>
                                            Ultimate doesn't renew automatically. We'll add {plan === 'YEARLY' ? 'a year' : 'a month'} on top of any time you have left.
                                        </Typography>
                                    </>
                                )}
                            </CardContent>
                        </Card>
                    </>
                )}
            </Box>
        </Box>
    );
}

export default Upgrade;
