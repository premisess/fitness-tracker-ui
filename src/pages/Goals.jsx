import { useState, useEffect } from 'react';
import API from '../services/api';
import { errorMessage } from '../services/errors';
import { useAppTheme } from '../context/ThemeContext';
import {
    Box, Typography, Button, IconButton, TextField, Card, CardContent, LinearProgress, Chip, Collapse, Switch, FormControlLabel
} from '@mui/material';
import TrackChangesIcon from '@mui/icons-material/TrackChanges';
import MonitorWeightIcon from '@mui/icons-material/MonitorWeight';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import FitnessCenterIcon from '@mui/icons-material/FitnessCenter';
import DirectionsRunIcon from '@mui/icons-material/DirectionsRun';
import BoltIcon from '@mui/icons-material/Bolt';
import AddIcon from '@mui/icons-material/Add';
import DeleteIcon from '@mui/icons-material/Delete';
import EditIcon from '@mui/icons-material/Edit';
import AutorenewIcon from '@mui/icons-material/Autorenew';
import Blobs from '../components/Glass';
import { FONT, glassCard, fieldStyle, sectionTitle } from '../theme/styles';
import PageHeader from '../components/PageHeader';

const goalTypes = [
    { value: 'LOSE_WEIGHT', label: 'Lose weight', Icon: MonitorWeightIcon, color: '#e94560', description: 'Tracks calories burned from workouts' },
    { value: 'GAIN_WEIGHT', label: 'Gain weight', Icon: TrendingUpIcon, color: '#ff6b35', description: 'Update it after weighing yourself' },
    { value: 'BUILD_STRENGTH', label: 'Build strength', Icon: FitnessCenterIcon, color: '#4ecdc4', description: 'Tracks gym, football and basketball' },
    { value: 'RUN_MORE', label: 'Run more', Icon: DirectionsRunIcon, color: '#45b7d1', description: 'Tracks running distance in km' },
    { value: 'STAY_ACTIVE', label: 'Stay active', Icon: BoltIcon, color: '#a29bfe', description: 'Tracks every workout you log' },
];

const goalUnits = {
    LOSE_WEIGHT: 'kg',
    GAIN_WEIGHT: 'kg',
    BUILD_STRENGTH: 'sessions',
    RUN_MORE: 'km',
    STAY_ACTIVE: 'workouts',
};

const STATUS_LABELS = { IN_PROGRESS: 'In progress', COMPLETED: 'Completed', FAILED: 'Missed' };
// Whole numbers stay whole; otherwise one decimal place.
const amount = (n) => (Number.isInteger(Number(n)) ? Number(n) : Number(n).toFixed(1));

function Goals() {
    const { theme } = useAppTheme();
    const [goals, setGoals] = useState([]);
    const [form, setForm] = useState({
        title: '', goalType: '', targetValue: '', currentProgress: '0', unit: '', deadline: '', autoTrack: true
    });
    const [progressInputs, setProgressInputs] = useState({});
    // When set, the form above edits this goal (PUT /goals/:id) instead of creating one.
    const [editingId, setEditingId] = useState(null);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [formOpen, setFormOpen] = useState(false);

    const fetchGoals = async () => {
        try {
            const res = await API.get('/goals');
            setGoals(res.data);
        } catch (err) {
            console.error(err);
        }
    };

    useEffect(() => {
        let cancelled = false;
        (async () => {
            try {
                const res = await API.get('/goals');
                if (cancelled) return;
                setGoals(res.data);
            } catch (err) {
                if (!cancelled) console.error(err);
            }
        })();
        return () => { cancelled = true; };
    }, []);

    const handleGoalTypeChange = (goalType) => {
        const unit = goalUnits[goalType] || '';
        const autoTrack = goalType !== 'GAIN_WEIGHT';
        setForm({ ...form, goalType, unit, autoTrack });
    };

    const emptyForm = { title: '', goalType: '', targetValue: '', currentProgress: '0', unit: '', deadline: '', autoTrack: true };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError(''); setSuccess('');
        try {
            if (editingId) {
                await API.put(`/goals/${editingId}`, form);
                setSuccess('Goal updated');
            } else {
                await API.post('/goals', form);
                setSuccess('Goal added');
            }
            setEditingId(null);
            setForm(emptyForm);
            setFormOpen(false);
            fetchGoals();
        } catch (err) {
            console.error(err);
            setError(errorMessage(err, editingId ? 'Failed to update goal' : 'Failed to add goal'));
        }
    };

    const handleEdit = (goal) => {
        setEditingId(goal.id);
        setFormOpen(true);
        setError(''); setSuccess('');
        setForm({
            title: goal.title || '',
            goalType: goal.goalType || '',
            targetValue: goal.targetValue ?? '',
            currentProgress: goal.currentProgress ?? 0,
            unit: goal.unit || '',
            deadline: goal.deadline || '',
            autoTrack: goal.autoTrack ?? true,
        });
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const handleCancelEdit = () => {
        setEditingId(null);
        setFormOpen(false);
        setError(''); setSuccess('');
        setForm(emptyForm);
    };

    const handleDelete = async (id) => {
        try {
            await API.delete(`/goals/${id}`);
            if (editingId === id) handleCancelEdit();
            fetchGoals();
        } catch (err) {
            console.error(err);
        }
    };

    const handleProgressUpdate = async (id) => {
        const newProgress = progressInputs[id];
        if (newProgress === undefined || newProgress === '') return;
        try {
            await API.patch(`/goals/${id}/progress`, { progress: parseFloat(newProgress) });
            setProgressInputs({ ...progressInputs, [id]: '' });
            fetchGoals();
        } catch (err) {
            console.error(err);
        }
    };

    const getGoalTypeInfo = (goalType) => {
        return goalTypes.find(g => g.value === goalType) || { label: goalType, Icon: TrackChangesIcon, color: theme.mix(1) };
    };

    const inputStyle = fieldStyle(theme);

    const getStatusColor = (status) => {
        if (status === 'COMPLETED') return '#4ecdc4';
        if (status === 'FAILED') return '#e94560';
        return '#ffa726';
    };

    return (
        <Box sx={{ minHeight: '100vh', background: theme.bgGradient, fontFamily: FONT, position: 'relative' }}>
            <Blobs />

            <Box sx={{ maxWidth: 800, mx: 'auto', py: 3, px: 2, position: 'relative', zIndex: 1 }}>
                <PageHeader>
                    <TrackChangesIcon sx={{ color: '#4ecdc4', mr: 1 }} />
                    <Typography variant="h6" sx={{ flexGrow: 1 }}>
                        My Goals
                    </Typography>
                    {!formOpen && goals.length > 0 && (
                        <Button startIcon={<AddIcon />} onClick={() => { setFormOpen(true); setSuccess(''); }} variant="contained"
                                sx={{ borderRadius: 999, px: 2, textTransform: 'none', fontWeight: 700, fontFamily: FONT, background: '#4ecdc4', color: '#1a1a2e', boxShadow: 'none', '&:hover': { background: '#3dbdb4', boxShadow: 'none' } }}>
                            New goal
                        </Button>
                    )}
                </PageHeader>
                {success && !formOpen && <Typography sx={{ color: '#4ecdc4', mb: 2, fontFamily: FONT }}>{success}</Typography>}
                <Collapse in={formOpen || goals.length === 0} unmountOnExit>
                <Card sx={{ ...glassCard(theme), mb: 3 }}>
                    <CardContent sx={{ p: 2.5 }}>
                        <Typography sx={{ ...sectionTitle(theme), mb: 2 }}>
                            {editingId ? 'Edit goal' : 'New goal'}
                        </Typography>
                        {error && <Typography sx={{ color: '#e94560', mb: 2 }}>{error}</Typography>}
                        {success && <Typography sx={{ color: '#4ecdc4', mb: 2 }}>{success}</Typography>}

                        <Typography sx={{ color: theme.mix(0.7), mb: 1, fontFamily: "'Poppins', sans-serif", fontSize: '0.9rem' }}>
                            Goal type
                        </Typography>
                        <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr 1fr', sm: 'repeat(3, 1fr)', md: 'repeat(5, 1fr)' }, gap: 1, mb: 2 }}>
                            {goalTypes.map((type) => (
                                <Box key={type.value} onClick={() => handleGoalTypeChange(type.value)}
                                     sx={{
                                         p: 1.25, borderRadius: 2, cursor: 'pointer', border: '1px solid',
                                         borderColor: form.goalType === type.value ? type.color : theme.mix(0.2),
                                         background: form.goalType === type.value ? `${type.color}22` : 'transparent',
                                         transition: 'all 0.2s',
                                         '&:hover': { borderColor: type.color }
                                     }}>
                                    <type.Icon sx={{ color: type.color, fontSize: 22 }} />
                                    <Typography sx={{ color: theme.mix(1), fontSize: '0.85rem', fontFamily: "'Poppins', sans-serif", fontWeight: 600 }}>
                                        {type.label}
                                    </Typography>
                                    <Typography sx={{ color: theme.mix(0.4), fontSize: '0.7rem', fontFamily: "'Poppins', sans-serif" }}>
                                        {type.description}
                                    </Typography>
                                </Box>
                            ))}
                        </Box>

                        <Box component="form" onSubmit={handleSubmit}>
                            <TextField fullWidth label="Goal Title" value={form.title}
                                       onChange={(e) => setForm({ ...form, title: e.target.value })}
                                       required sx={inputStyle} placeholder="e.g. Lose 5kg by August" />
                            <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr 1.3fr' }, columnGap: 1.5 }}>
                            <TextField fullWidth label="Target Value" type="number" value={form.targetValue}
                                       onChange={(e) => setForm({ ...form, targetValue: e.target.value })}
                                       required sx={inputStyle} />
                            <TextField fullWidth label="Unit" value={form.unit}
                                       onChange={(e) => setForm({ ...form, unit: e.target.value })}
                                       required sx={inputStyle} placeholder="kg, km, sessions, workouts" />
                            <TextField fullWidth label="Deadline" type="date" value={form.deadline}
                                       onChange={(e) => setForm({ ...form, deadline: e.target.value })}
                                       required slotProps={{ inputLabel: { shrink: true } }}
                                       sx={{
                                           ...inputStyle,
                                           '& input[type="date"]::-webkit-datetime-edit': { color: form.deadline ? theme.mix(1) : 'transparent' },
                                           '& input[type="date"]::-webkit-calendar-picker-indicator': { filter: 'invert(1)' },
                                       }} />
                            </Box>

                            <FormControlLabel
                                control={
                                    <Switch
                                        checked={form.autoTrack}
                                        onChange={(e) => setForm({ ...form, autoTrack: e.target.checked })}
                                        sx={{
                                            '& .MuiSwitch-thumb': { color: '#4ecdc4' },
                                            '& .Mui-checked + .MuiSwitch-track': { backgroundColor: '#4ecdc4' }
                                        }}
                                    />
                                }
                                label={
                                    <Typography sx={{ color: theme.mix(0.7), fontFamily: "'Poppins', sans-serif", fontSize: '0.85rem' }}>
                                        Auto-track progress from workouts
                                    </Typography>
                                }
                                sx={{ mb: 2 }}
                            />

                            <Box sx={{ display: 'flex', gap: 1 }}>
                                <Button fullWidth type="submit" variant="contained" sx={{
                                    py: 1.1, borderRadius: 999, textTransform: 'none', fontFamily: "'Poppins', sans-serif", fontWeight: 700,
                                    background: 'linear-gradient(90deg, #4ecdc4, #0f3460)',
                                    '&:hover': { background: 'linear-gradient(90deg, #3aa89f, #0a2540)' }
                                }}>
                                    {editingId ? 'Save Changes' : 'Add Goal'}
                                </Button>
                                {(editingId || goals.length > 0) && (
                                    <Button onClick={handleCancelEdit} variant="outlined" sx={{
                                        py: 1.1, px: 3, borderRadius: 999, textTransform: 'none', fontFamily: "'Poppins', sans-serif", fontWeight: 700,
                                        borderColor: theme.mix(0.3), color: theme.mix(0.7),
                                        '&:hover': { borderColor: theme.mix(0.5), color: theme.mix(1) }
                                    }}>
                                        Cancel
                                    </Button>
                                )}
                            </Box>
                        </Box>
                    </CardContent>
                </Card>
                </Collapse>

                {goals.length === 0 ? (
                    <Typography sx={{ color: theme.mix(0.5), textAlign: 'center', mt: 2 }}>
                        Pick a goal type above to set your first goal.
                    </Typography>
                ) : (
                    goals.map((goal) => {
                        const typeInfo = getGoalTypeInfo(goal.goalType);
                        return (
                            <Card key={goal.id} sx={{ ...glassCard(theme), mb: 1.5 }}>
                                <CardContent sx={{ p: 2.25, '&:last-child': { pb: 2 } }}>
                                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1 }}>
                                        <Box>
                                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
                                                <typeInfo.Icon sx={{ color: typeInfo.color, fontSize: 22 }} />
                                                <Typography sx={{ color: theme.mix(1), fontWeight: 700, fontFamily: "'Poppins', sans-serif" }}>
                                                    {goal.title}
                                                </Typography>
                                                {goal.autoTrack && (
                                                    <AutorenewIcon sx={{ color: '#4ecdc4', fontSize: 16 }} />
                                                )}
                                            </Box>
                                            <Typography sx={{ color: theme.mix(0.5), fontSize: '0.85rem' }}>
                                                {amount(goal.currentProgress)} of {amount(goal.targetValue)} {goal.unit} · due {new Date(`${goal.deadline}T12:00:00`).toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' })}
                                            </Typography>
                                            <Typography sx={{ color: typeInfo.color, fontSize: '0.75rem', mt: 0.3 }}>
                                                {typeInfo.label}
                                            </Typography>
                                        </Box>
                                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                            <Chip label={STATUS_LABELS[goal.status] || goal.status} size="small" sx={{
                                                background: `${getStatusColor(goal.status)}26`, color: getStatusColor(goal.status), fontWeight: 700, fontSize: '0.7rem'
                                            }} />
                                            <IconButton onClick={() => handleEdit(goal)} sx={{ color: '#4ecdc4' }} title="Edit goal">
                                                <EditIcon fontSize="small" />
                                            </IconButton>
                                            <IconButton onClick={() => handleDelete(goal.id)} sx={{ color: '#e94560' }} title="Delete goal">
                                                <DeleteIcon fontSize="small" />
                                            </IconButton>
                                        </Box>
                                    </Box>

                                    <LinearProgress variant="determinate" value={goal.progressPercent} sx={{
                                        height: 6, borderRadius: 3, mb: 0.5,
                                        background: theme.mix(0.1),
                                        '& .MuiLinearProgress-bar': { background: typeInfo.color }
                                    }} />
                                    <Typography sx={{ color: theme.mix(0.4), fontSize: '0.75rem', textAlign: 'right', mb: 1 }}>
                                        {goal.progressPercent}%
                                    </Typography>

                                    {goal.status === 'IN_PROGRESS' && !goal.autoTrack && (
                                        <Box sx={{ display: 'flex', gap: 1 }}>
                                            <TextField size="small" type="number" placeholder="Update progress manually"
                                                       value={progressInputs[goal.id] || ''}
                                                       onChange={(e) => setProgressInputs({ ...progressInputs, [goal.id]: e.target.value })}
                                                       sx={{
                                                           ...fieldStyle(theme), mb: 0, flex: 1,
                                                       }} />
                                            <Button variant="outlined" onClick={() => handleProgressUpdate(goal.id)} sx={{
                                                borderColor: '#4ecdc4', color: '#4ecdc4', fontFamily: "'Poppins', sans-serif",
                                                '&:hover': { background: '#4ecdc4', color: theme.mix(1) }
                                            }}>
                                                Update
                                            </Button>
                                        </Box>
                                    )}

                                    {goal.status === 'IN_PROGRESS' && goal.autoTrack && (
                                        <Typography sx={{ color: '#4ecdc4', fontSize: '0.75rem', fontFamily: "'Poppins', sans-serif" }}>
                                            Progress updates automatically when you log a workout
                                        </Typography>
                                    )}
                                </CardContent>
                            </Card>
                        );
                    })
                )}
            </Box>
        </Box>
    );
}

export default Goals;