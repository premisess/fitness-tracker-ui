import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import API from '../services/api';
import { errorMessage } from '../services/errors';
import { useAppTheme } from '../context/ThemeContext';
import {
    Box, Typography, Button, AppBar, Toolbar,
    IconButton, TextField, Card, CardContent, Chip
} from '@mui/material';
import MonitorWeightIcon from '@mui/icons-material/MonitorWeight';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import Blobs from '../components/Glass';
import { FONT, glassCard, fieldStyle, sectionTitle } from '../theme/styles';

function BMI() {
    const { theme } = useAppTheme();
    const [history, setHistory] = useState([]);
    const [form, setForm] = useState({ weight: '', height: '', date: new Date().toISOString().split('T')[0] });
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [latest, setLatest] = useState(null);
    const navigate = useNavigate();

    const fetchHistory = async () => {
        try {
            const res = await API.get('/bmi');
            setHistory(res.data);
            if (res.data.length > 0) setLatest(res.data[0]);
        } catch (err) {
            console.error(err);
        }
    };

    useEffect(() => {
        let cancelled = false;
        (async () => {
            try {
                const res = await API.get('/bmi');
                if (cancelled) return;
                setHistory(res.data);
                if (res.data.length > 0) setLatest(res.data[0]);
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
            const res = await API.post('/bmi', form);
            setSuccess('BMI calculated and saved!');
            setLatest(res.data);
            setForm({ weight: '', height: '', date: new Date().toISOString().split('T')[0] });
            fetchHistory();
        } catch (err) {
            setError(errorMessage(err, 'Failed to calculate BMI'));
        }
    };

    const getCategoryColor = (category) => {
        if (category === 'Underweight') return '#45b7d1';
        if (category === 'Normal') return '#4ecdc4';
        if (category === 'Overweight') return '#ffa726';
        return '#e94560';
    };

    const inputStyle = fieldStyle(theme);

    return (
        <Box sx={{ minHeight: '100vh', background: theme.bgGradient, fontFamily: FONT, position: 'relative' }}>
            <Blobs />
            <AppBar position="static" sx={{ background: theme.mix(0.05), backdropFilter: 'blur(10px)', boxShadow: 'none', borderBottom: `1px solid ${theme.mix(0.1)}` }}>
                <Toolbar>
                    <IconButton onClick={() => navigate('/dashboard')} sx={{ color: theme.mix(1), mr: 1 }}>
                        <ArrowBackIcon />
                    </IconButton>
                    <MonitorWeightIcon sx={{ color: '#ff6b35', mr: 1 }} />
                    <Typography variant="h6" sx={{ color: theme.mix(1), fontWeight: 700, fontFamily: "'Poppins', sans-serif" }}>
                        BMI Calculator
                    </Typography>
                </Toolbar>
            </AppBar>

            <Box sx={{ maxWidth: 700, mx: 'auto', py: 4, px: 2, position: 'relative', zIndex: 1 }}>

                {/* Latest BMI Result */}
                {latest && (
                    <Card sx={{ ...glassCard(theme), mb: 4, textAlign: 'center', p: 3 }}>
                        <Typography sx={{ color: theme.mix(0.5), mb: 1, fontFamily: "'Poppins', sans-serif" }}>
                            Your Latest BMI
                        </Typography>
                        <Typography sx={{ color: theme.mix(1), fontWeight: 700, fontFamily: "'Poppins', sans-serif", fontSize: '1.6rem' }}>
                            {latest.bmiValue}
                        </Typography>
                        <Chip label={latest.category} sx={{
                            mt: 1, background: getCategoryColor(latest.category),
                            color: theme.mix(1), fontWeight: 700, fontSize: '0.9rem'
                        }} />
                        <Box sx={{ display: 'flex', justifyContent: 'center', gap: 4, mt: 2 }}>
                            <Box>
                                <Typography sx={{ color: theme.mix(0.5), fontSize: '0.8rem' }}>Weight</Typography>
                                <Typography sx={{ color: theme.mix(1), fontWeight: 700 }}>{latest.weight} kg</Typography>
                            </Box>
                            <Box>
                                <Typography sx={{ color: theme.mix(0.5), fontSize: '0.8rem' }}>Height</Typography>
                                <Typography sx={{ color: theme.mix(1), fontWeight: 700 }}>{latest.height} cm</Typography>
                            </Box>
                        </Box>
                    </Card>
                )}

                {/* BMI Ranges Info */}
                <Card sx={{ ...glassCard(theme), mb: 4 }}>
                    <CardContent>
                        <Typography sx={{ ...sectionTitle(theme), mb: 2 }}>
                            BMI Ranges
                        </Typography>
                        <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                            {[
                                { label: 'Underweight < 18.5', color: '#45b7d1' },
                                { label: 'Normal 18.5 - 24.9', color: '#4ecdc4' },
                                { label: 'Overweight 25 - 29.9', color: '#ffa726' },
                                { label: 'Obese 30+', color: '#e94560' },
                            ].map((range) => (
                                <Chip key={range.label} label={range.label} size="small"
                                      sx={{ background: range.color, color: theme.mix(1), fontFamily: "'Poppins', sans-serif" }} />
                            ))}
                        </Box>
                    </CardContent>
                </Card>

                {/* Calculate Form */}
                <Card sx={{ ...glassCard(theme), mb: 4 }}>
                    <CardContent sx={{ p: 3 }}>
                        <Typography variant="h6" sx={{ ...sectionTitle(theme), mb: 2 }}>
                            Calculate BMI
                        </Typography>
                        {error && <Typography sx={{ color: '#e94560', mb: 2 }}>{error}</Typography>}
                        {success && <Typography sx={{ color: '#4ecdc4', mb: 2 }}>{success}</Typography>}
                        <Box component="form" onSubmit={handleSubmit}>
                            <TextField fullWidth label="Weight (kg)" type="number" value={form.weight}
                                       onChange={(e) => setForm({ ...form, weight: e.target.value })}
                                       required sx={inputStyle} />
                            <TextField fullWidth label="Height (cm)" type="number" value={form.height}
                                       onChange={(e) => setForm({ ...form, height: e.target.value })}
                                       required sx={inputStyle} />
                            <TextField fullWidth label="Date" type="date" value={form.date}
                                       onChange={(e) => setForm({ ...form, date: e.target.value })}
                                       required InputLabelProps={{ shrink: true }}
                                       sx={{
                                           ...inputStyle,
                                           '& input[type="date"]::-webkit-datetime-edit': { color: theme.mix(1) },
                                           '& input[type="date"]::-webkit-calendar-picker-indicator': { filter: 'invert(1)' },
                                       }} />
                            <Button fullWidth type="submit" variant="contained" sx={{
                                py: 1.5, borderRadius: 2, fontFamily: "'Poppins', sans-serif", fontWeight: 700,
                                background: 'linear-gradient(90deg, #ff6b35, #0f3460)',
                                '&:hover': { background: 'linear-gradient(90deg, #d4551f, #0a2540)' }
                            }}>
                                Calculate & Save
                            </Button>
                        </Box>
                    </CardContent>
                </Card>

                {/* History */}
                <Typography variant="h6" sx={{ ...sectionTitle(theme), mb: 2 }}>
                    BMI History
                </Typography>
                {history.length === 0 ? (
                    <Typography sx={{ color: theme.mix(0.5), textAlign: 'center', mt: 2 }}>
                        No BMI records yet.
                    </Typography>
                ) : (
                    history.map((record) => (
                        <Card key={record.id} sx={{
                            ...glassCard(theme), mb: 2,
                        }}>
                            <CardContent sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <Box>
                                    <Typography sx={{ color: theme.mix(1), fontWeight: 700, fontFamily: "'Poppins', sans-serif" }}>
                                        BMI: {record.bmiValue}
                                    </Typography>
                                    <Typography sx={{ color: theme.mix(0.5), fontSize: '0.85rem' }}>
                                        {record.weight}kg • {record.height}cm • {record.date}
                                    </Typography>
                                </Box>
                                <Chip label={record.category} size="small" sx={{
                                    background: getCategoryColor(record.category),
                                    color: theme.mix(1), fontWeight: 600
                                }} />
                            </CardContent>
                        </Card>
                    ))
                )}
            </Box>
        </Box>
    );
}

export default BMI;