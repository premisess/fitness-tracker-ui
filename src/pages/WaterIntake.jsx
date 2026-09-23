import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import API from '../services/api';
import { errorMessage } from '../services/errors';
import { useAppTheme } from '../context/ThemeContext';
import {
    Box, Typography, Button, AppBar, Toolbar,
    IconButton, TextField, Card, CardContent
} from '@mui/material';
import WaterDropIcon from '@mui/icons-material/WaterDrop';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import Blobs from '../components/Glass';
import { FONT, glassCard, fieldStyle, sectionTitle } from '../theme/styles';

function WaterIntake() {
    const { theme } = useAppTheme();
    const [intakeHistory, setIntakeHistory] = useState([]);
    const [amount, setAmount] = useState('');
    const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const navigate = useNavigate();

    const fetchIntake = async () => {
        try {
            const res = await API.get('/water-intake');
            setIntakeHistory(res.data);
        } catch (err) {
            console.error(err);
        }
    };

    useEffect(() => {
        let cancelled = false;
        (async () => {
            try {
                const res = await API.get('/water-intake');
                if (cancelled) return;
                setIntakeHistory(res.data);
            } catch (err) {
                if (!cancelled) console.error(err);
            }
        })();
        return () => { cancelled = true; };
    }, []);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError(''); setSuccess('');
        try {
            await API.post('/water-intake', { amountMl: parseInt(amount), date });
            setSuccess('Water intake logged!');
            setAmount('');
            fetchIntake();
        } catch (err) {
            setError(errorMessage(err, 'Failed to log water intake'));
        }
    };

    const today = new Date().toISOString().split('T')[0];
    const todayTotal = intakeHistory.find(i => i.date === today)?.amountMl || 0;
    const goalMl = 2500;
    const progressPercent = Math.min((todayTotal / goalMl) * 100, 100);

    const inputStyle = fieldStyle(theme);

    const quickAmounts = [250, 500, 750, 1000];

    return (
        <Box sx={{ minHeight: '100vh', background: theme.bgGradient, fontFamily: FONT, position: 'relative' }}>
            <Blobs />
            <AppBar position="static" sx={{ background: theme.mix(0.05), backdropFilter: 'blur(10px)', boxShadow: 'none', borderBottom: `1px solid ${theme.mix(0.1)}` }}>
                <Toolbar>
                    <IconButton onClick={() => navigate('/dashboard')} sx={{ color: theme.mix(1), mr: 1 }}>
                        <ArrowBackIcon />
                    </IconButton>
                    <WaterDropIcon sx={{ color: '#45b7d1', mr: 1 }} />
                    <Typography variant="h6" sx={{ color: theme.mix(1), fontWeight: 700, fontFamily: "'Poppins', sans-serif" }}>
                        Water Intake
                    </Typography>
                </Toolbar>
            </AppBar>

            <Box sx={{ maxWidth: 700, mx: 'auto', py: 4, px: 2, position: 'relative', zIndex: 1 }}>
                {/* Today's Progress */}
                <Card sx={{ ...glassCard(theme), mb: 4, textAlign: 'center', p: 3 }}>
                    <WaterDropIcon sx={{ fontSize: 36, color: '#45b7d1' }} />
                    <Typography sx={{ color: theme.mix(1), fontWeight: 700, fontFamily: "'Poppins', sans-serif", fontSize: '1.6rem' }}>
                        {todayTotal} ml
                    </Typography>
                    <Typography sx={{ color: theme.mix(0.5), mb: 2 }}>
                        of {goalMl} ml goal today
                    </Typography>
                    <Box sx={{ width: '100%', height: 10, background: theme.mix(0.1), borderRadius: 5, overflow: 'hidden' }}>
                        <Box sx={{ width: `${progressPercent}%`, height: '100%', background: 'linear-gradient(90deg, #45b7d1, #4ecdc4)', transition: 'width 0.3s' }} />
                    </Box>
                </Card>

                {/* Log Water Form */}
                <Card sx={{ ...glassCard(theme), mb: 4 }}>
                    <CardContent sx={{ p: 3 }}>
                        <Typography variant="h6" sx={{ ...sectionTitle(theme), mb: 2 }}>
                            Log Water Intake
                        </Typography>
                        {error && <Typography sx={{ color: '#e94560', mb: 2 }}>{error}</Typography>}
                        {success && <Typography sx={{ color: '#4ecdc4', mb: 2 }}>{success}</Typography>}

                        {/* Quick Add Buttons */}
                        <Box sx={{ display: 'flex', gap: 1, mb: 2, flexWrap: 'wrap' }}>
                            {quickAmounts.map((amt) => (
                                <Button key={amt} variant="outlined" onClick={() => setAmount(amt.toString())}
                                        sx={{
                                            borderColor: '#45b7d1', color: '#45b7d1', fontFamily: "'Poppins', sans-serif",
                                            '&:hover': { background: '#45b7d1', color: theme.mix(1) }
                                        }}>
                                    +{amt}ml
                                </Button>
                            ))}
                        </Box>

                        <Box component="form" onSubmit={handleSubmit}>
                            <TextField fullWidth label="Amount (ml)" type="number" value={amount}
                                       onChange={(e) => setAmount(e.target.value)}
                                       required sx={inputStyle} />
                            <TextField fullWidth label="Date" type="date" value={date}
                                       onChange={(e) => setDate(e.target.value)}
                                       required InputLabelProps={{ shrink: true }}
                                       sx={{
                                           ...inputStyle,
                                           '& input[type="date"]::-webkit-datetime-edit': { color: theme.mix(1) },
                                           '& input[type="date"]::-webkit-calendar-picker-indicator': { filter: 'invert(1)' },
                                       }} />
                            <Button fullWidth type="submit" variant="contained" sx={{
                                py: 1.5, borderRadius: 2, fontFamily: "'Poppins', sans-serif", fontWeight: 700,
                                background: 'linear-gradient(90deg, #45b7d1, #0f3460)',
                                '&:hover': { background: 'linear-gradient(90deg, #3593a8, #0a2540)' }
                            }}>
                                Log Water
                            </Button>
                        </Box>
                    </CardContent>
                </Card>

                {/* History */}
                <Typography variant="h6" sx={{ ...sectionTitle(theme), mb: 2 }}>
                    History
                </Typography>
                {intakeHistory.length === 0 ? (
                    <Typography sx={{ color: theme.mix(0.5), textAlign: 'center', mt: 2 }}>
                        No water intake logged yet.
                    </Typography>
                ) : (
                    intakeHistory.map((entry) => (
                        <Card key={entry.id} sx={{
                            ...glassCard(theme), mb: 2,
                        }}>
                            <CardContent sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <Typography sx={{ color: theme.mix(1), fontFamily: "'Poppins', sans-serif" }}>
                                    {entry.date}
                                </Typography>
                                <Typography sx={{ color: '#45b7d1', fontWeight: 700, fontFamily: "'Poppins', sans-serif" }}>
                                    {entry.amountMl} ml
                                </Typography>
                            </CardContent>
                        </Card>
                    ))
                )}
            </Box>
        </Box>
    );
}

export default WaterIntake;