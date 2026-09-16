import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import API from '../services/api';
import { errorMessage } from '../services/errors';
import { useAppTheme } from '../context/ThemeContext';
import {
    Box, Typography, Button, AppBar, Toolbar, Alert, Checkbox, Tooltip,
    IconButton, TextField, Card, CardContent, MenuItem, Chip, Collapse
} from '@mui/material';
import FitnessCenterIcon from '@mui/icons-material/FitnessCenter';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import DeleteIcon from '@mui/icons-material/Delete';
import CloseIcon from '@mui/icons-material/Close';
import AddIcon from '@mui/icons-material/Add';
import EmojiEventsIcon from '@mui/icons-material/EmojiEvents';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import PictureAsPdfIcon from '@mui/icons-material/PictureAsPdf';
import exportWorkoutsPdf from '../services/exportWorkoutsPdf';
import ExercisePicker from '../components/ExercisePicker';
import { formatDuration } from '../utils/geo';

const today = () => new Date().toISOString().split('T')[0];
const emptyForm = () => ({ type: '', duration: '', date: today(), notes: '', tags: [] });
const emptySet = () => ({ weightKg: '', reps: '', durationSec: '', warmup: false });
const toNumber = (value) => (value === '' || value == null ? null : Number(value));

// A sensible workout type when the log is started from a single exercise.
const defaultTypeFor = (exercise) => {
    if (exercise.category === 'stretching') return 'Yoga';
    if (exercise.category === 'cardio') return 'HIIT';
    return 'Weightlifting';
};

// Plan sessions prescribe things like "8-10" or "30-45 s"; start the log at the lower number.
const firstNumber = (text) => {
    const match = String(text).match(/\d+/);
    return match ? Number(match[0]) : '';
};

const blocksFromPlan = (session) => session.exercises.map((exercise, index) => {
    const timed = exercise.trackingType === 'DURATION';
    const value = firstNumber(exercise.reps);
    const set = {
        ...emptySet(),
        reps: timed ? '' : value,
        durationSec: timed ? value : '',
    };
    return {
        key: `plan-${exercise.exerciseId}-${index}`,
        exercise: {
            id: exercise.exerciseId,
            name: exercise.name,
            trackingType: exercise.trackingType,
            thumbnailUrl: exercise.thumbnailUrl,
        },
        sets: Array.from({ length: exercise.sets }, () => ({ ...set })),
    };
});

const summarizeExercise = (exercise) => {
    const working = exercise.sets.filter((s) => !s.warmup);
    const count = `${working.length} set${working.length === 1 ? '' : 's'}`;
    if (exercise.trackingType === 'DURATION') {
        return `${count} · best ${formatDuration(Math.max(0, ...working.map((s) => s.durationSec || 0)))}`;
    }
    const top = working.reduce((best, s) => ((s.weightKg || 0) > (best?.weightKg || 0) ? s : best), null);
    if (top?.weightKg) return `${count} · top ${top.weightKg} kg × ${top.reps}`;
    return `${count} · best ${Math.max(0, ...working.map((s) => s.reps || 0))} reps`;
};

function Workouts() {
    const { theme } = useAppTheme();
    const navigate = useNavigate();
    const [searchParams, setSearchParams] = useSearchParams();

    const [workouts, setWorkouts] = useState([]);
    const [workoutTypes, setWorkoutTypes] = useState([]);
    const [userWeight, setUserWeight] = useState(null);
    const [reloadKey, setReloadKey] = useState(0);

    const [form, setForm] = useState(emptyForm);
    const [tagInput, setTagInput] = useState('');
    const [blocks, setBlocks] = useState([]);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [newRecords, setNewRecords] = useState([]);
    const [saving, setSaving] = useState(false);

    const [searchType, setSearchType] = useState('');
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');
    const [searchTag, setSearchTag] = useState('');
    const [filtered, setFiltered] = useState(false);
    const [expandedId, setExpandedId] = useState(null);
    const [planSession, setPlanSession] = useState(null);

    const allTags = [...new Set(workouts.flatMap((w) => w.tags || []))];

    useEffect(() => {
        let ignore = false;
        Promise.all([API.get('/workouts/types'), API.get('/profile')])
            .then(([typesRes, profileRes]) => {
                if (ignore) return;
                setWorkoutTypes(typesRes.data);
                if (profileRes.data.weight) setUserWeight(profileRes.data.weight);
            })
            .catch(() => {});
        return () => { ignore = true; };
    }, []);

    useEffect(() => {
        let ignore = false;
        API.get('/workouts')
            .then((res) => { if (!ignore) setWorkouts(res.data); })
            .catch(() => {});
        return () => { ignore = true; };
    }, [reloadKey]);

    // Arriving from the exercise library with ?exerciseId= starts a log with that exercise.
    useEffect(() => {
        const exerciseId = searchParams.get('exerciseId');
        if (!exerciseId) return undefined;
        let ignore = false;
        API.get(`/exercises/${exerciseId}`)
            .then((res) => {
                if (ignore) return;
                setBlocks((current) => (current.some((b) => b.exercise.id === res.data.id)
                    ? current
                    : [...current, { key: `${res.data.id}-${Date.now()}`, exercise: res.data, sets: [emptySet()] }]));
                setForm((f) => ({ ...f, type: f.type || defaultTypeFor(res.data) }));
                setSearchParams({}, { replace: true });
            })
            .catch(() => {});
        return () => { ignore = true; };
    }, [searchParams, setSearchParams]);

    // Arriving from a workout plan with ?planSession=1 fills in the prescribed session.
    useEffect(() => {
        if (searchParams.get('planSession') !== '1') return undefined;
        let ignore = false;
        API.get('/plans/active')
            .then((res) => {
                if (ignore || res.status !== 200 || !res.data.nextSession) return;
                const session = res.data.nextSession;
                setPlanSession(res.data);
                setForm((f) => ({ ...f, type: session.workoutType, duration: session.targetMinutes }));
                setBlocks(blocksFromPlan(session));
                setSearchParams({}, { replace: true });
            })
            .catch(() => {});
        return () => { ignore = true; };
    }, [searchParams, setSearchParams]);

    const addTag = () => {
        const tag = tagInput.trim();
        if (tag && !form.tags.includes(tag)) setForm({ ...form, tags: [...form.tags, tag] });
        setTagInput('');
    };

    const addExercise = (exercise) => {
        setBlocks((current) => [...current, { key: `${exercise.id}-${Date.now()}`, exercise, sets: [emptySet()] }]);
        if (!form.type) setForm((f) => ({ ...f, type: defaultTypeFor(exercise) }));
    };

    const updateBlock = (key, updater) => {
        setBlocks((current) => current.map((b) => (b.key === key ? updater(b) : b)));
    };

    const addSet = (key) => updateBlock(key, (b) => {
        const last = b.sets[b.sets.length - 1];
        return { ...b, sets: [...b.sets, last ? { ...last, warmup: false } : emptySet()] };
    });

    const updateSet = (key, index, field, value) => updateBlock(key, (b) => ({
        ...b, sets: b.sets.map((s, i) => (i === index ? { ...s, [field]: value } : s)),
    }));

    const removeSet = (key, index) => updateBlock(key, (b) => ({ ...b, sets: b.sets.filter((_, i) => i !== index) }));

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError(''); setSuccess(''); setNewRecords([]);
        setSaving(true);
        try {
            const res = await API.post('/workouts', {
                ...form,
                exercises: blocks.map((b) => {
                    const timed = b.exercise.trackingType === 'DURATION';
                    return {
                        exerciseId: b.exercise.id,
                        sets: b.sets.map((s) => ({
                            reps: timed ? null : toNumber(s.reps),
                            weightKg: timed ? null : toNumber(s.weightKg),
                            durationSec: timed ? toNumber(s.durationSec) : null,
                            warmup: s.warmup,
                        })),
                    };
                }),
            });
            let message = 'Workout logged!';
            if (planSession) {
                try {
                    const planRes = await API.post('/plans/active/sessions', { workoutId: res.data.id });
                    message = planRes.data.status === 'COMPLETED'
                        ? `Workout logged — you finished ${planSession.plan.name}! 🎉`
                        : `Workout logged and counted toward ${planSession.plan.name}.`;
                } catch (planErr) {
                    setError(errorMessage(planErr, 'Workout saved, but it could not be counted toward your plan'));
                }
                setPlanSession(null);
            }
            setSuccess(message);
            setNewRecords(res.data.newRecords || []);
            setForm(emptyForm());
            setTagInput('');
            setBlocks([]);
            setFiltered(false);
            setReloadKey((k) => k + 1);
        } catch (err) {
            setError(errorMessage(err, 'Failed to log workout'));
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = async (id) => {
        try {
            await API.delete(`/workouts/${id}`);
            setReloadKey((k) => k + 1);
        } catch (err) {
            setError(errorMessage(err, 'Failed to delete workout'));
        }
    };

    const handleSearch = async () => {
        try {
            const params = new URLSearchParams();
            if (searchType) params.append('type', searchType);
            if (startDate) params.append('startDate', startDate);
            if (endDate) params.append('endDate', endDate);
            if (searchTag) params.append('tag', searchTag);
            const res = await API.get(`/workouts/search?${params.toString()}`);
            setWorkouts(res.data);
            setFiltered(true);
        } catch (err) {
            setError(errorMessage(err, 'Search failed'));
        }
    };

    // The server renders the report (/api/export/workouts/pdf); it always covers
    // the full workout history, not the currently applied search filter.
    const handleExportPdf = async () => {
        try {
            await exportWorkoutsPdf();
        } catch (err) {
            setError(errorMessage(err, 'Export failed'));
        }
    };

    const handleClearSearch = () => {
        setSearchType(''); setStartDate(''); setEndDate(''); setSearchTag('');
        setFiltered(false);
        setReloadKey((k) => k + 1);
    };

    const inputStyle = {
        '& .MuiOutlinedInput-root': { '& fieldset': { borderColor: theme.mix(0.2) } },
        '& .MuiInputLabel-root': { color: theme.mix(0.5) },
        '& .MuiInputBase-input': { color: theme.mix(1) },
        '& .MuiSelect-icon': { color: theme.mix(0.5) },
        mb: 2,
    };
    const dateStyle = (value) => ({
        ...inputStyle,
        '& input[type="date"]::-webkit-datetime-edit': { color: value ? theme.mix(1) : 'transparent' },
        '& input[type="date"]::-webkit-calendar-picker-indicator': { filter: theme.mode === 'dark' ? 'invert(1)' : 'none' },
    });
    const setInputStyle = {
        '& .MuiOutlinedInput-root': { '& fieldset': { borderColor: theme.mix(0.2) } },
        '& .MuiInputBase-input': { color: theme.mix(1), py: 0.8, textAlign: 'center' },
    };
    const cardStyle = { background: theme.mix(0.05), border: `1px solid ${theme.mix(0.1)}`, borderRadius: 3 };
    const menuProps = { MenuProps: { PaperProps: { sx: { background: theme.menuBg, color: theme.mix(1) } } } };

    return (
        <Box sx={{ minHeight: '100vh', background: theme.bgGradient, fontFamily: "'Poppins', sans-serif" }}>
            <AppBar position="static" sx={{ background: theme.mix(0.05), backdropFilter: 'blur(10px)', boxShadow: 'none', borderBottom: `1px solid ${theme.mix(0.1)}` }}>
                <Toolbar>
                    <IconButton onClick={() => navigate('/dashboard')} sx={{ color: theme.mix(1), mr: 1 }}>
                        <ArrowBackIcon />
                    </IconButton>
                    <FitnessCenterIcon sx={{ color: '#e94560', mr: 1 }} />
                    <Typography variant="h6" sx={{ color: theme.mix(1), fontWeight: 700, flexGrow: 1 }}>
                        My Workouts
                    </Typography>
                    <Button size="small" startIcon={<EmojiEventsIcon />} onClick={() => navigate('/records')}
                            sx={{ color: '#ffa726', fontWeight: 600 }}>
                        Records
                    </Button>
                </Toolbar>
            </AppBar>

            <Box sx={{ maxWidth: 820, mx: 'auto', py: 4, px: 2 }}>

                {newRecords.length > 0 && (
                    <Alert icon={<EmojiEventsIcon />} severity="success" sx={{ mb: 3 }}
                           action={<Button color="inherit" size="small" onClick={() => navigate('/records')}>See all</Button>}>
                        <Typography sx={{ fontWeight: 700, mb: 0.5 }}>
                            New personal record{newRecords.length > 1 ? 's' : ''}! 🏆
                        </Typography>
                        {newRecords.map((r, i) => (
                            <Typography key={i} sx={{ fontSize: '0.85rem' }}>{r.exerciseName}: {r.description}</Typography>
                        ))}
                    </Alert>
                )}

                <Card sx={{ ...cardStyle, mb: 4 }}>
                    <CardContent sx={{ p: 3 }}>
                        <Typography variant="h6" sx={{ color: theme.mix(1), fontWeight: 700, mb: 2 }}>
                            Log New Workout
                        </Typography>
                        {planSession?.nextSession && (
                            <Alert severity="info" sx={{ mb: 2 }}
                                   action={<Button color="inherit" size="small" onClick={() => setPlanSession(null)}>Not now</Button>}>
                                {planSession.plan.name} · week {planSession.currentWeek}: <strong>{planSession.nextSession.title}</strong>.
                                Save it here and it counts toward your plan.
                            </Alert>
                        )}
                        {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
                        {success && newRecords.length === 0 && <Alert severity="success" sx={{ mb: 2 }}>{success}</Alert>}

                        {!userWeight && (
                            <Typography sx={{ color: '#ffa726', mb: 2, fontSize: '0.85rem' }}>
                                ⚠️ Add your weight in your profile for accurate calorie calculation.
                            </Typography>
                        )}

                        <Box component="form" onSubmit={handleSubmit}>
                            <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr 1fr' }, gap: { sm: 2 } }}>
                                <TextField select fullWidth label="Workout type" value={form.type}
                                           onChange={(e) => setForm({ ...form, type: e.target.value })}
                                           required SelectProps={menuProps} sx={inputStyle}>
                                    {workoutTypes.map((type) => (
                                        <MenuItem key={type.label} value={type.label}>{type.label}</MenuItem>
                                    ))}
                                </TextField>
                                <TextField fullWidth label="Duration (minutes)" type="number" value={form.duration}
                                           onChange={(e) => setForm({ ...form, duration: e.target.value })}
                                           required sx={inputStyle} />
                                <TextField fullWidth label="Date" type="date" value={form.date}
                                           onChange={(e) => setForm({ ...form, date: e.target.value })}
                                           required InputLabelProps={{ shrink: true }} sx={dateStyle(form.date)} />
                            </Box>

                            {/* Exercises & sets */}
                            <Typography sx={{ color: theme.mix(0.8), fontWeight: 600, mb: 1 }}>
                                Exercises <Typography component="span" sx={{ color: theme.mix(0.4), fontSize: '0.8rem' }}>(optional: log sets, reps and weight)</Typography>
                            </Typography>

                            {blocks.map((block) => {
                                const timed = block.exercise.trackingType === 'DURATION';
                                const thumb = block.exercise.imageUrls?.[0] || block.exercise.thumbnailUrl;
                                return (
                                    <Box key={block.key} sx={{ border: `1px solid ${theme.mix(0.12)}`, borderRadius: 2, p: 1.5, mb: 1.5 }}>
                                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 1 }}>
                                            {thumb && <Box component="img" src={thumb} alt="" sx={{ width: 40, height: 40, objectFit: 'cover', borderRadius: 1, background: '#fff' }} />}
                                            <Typography sx={{ color: theme.mix(1), fontWeight: 600, flexGrow: 1 }}>{block.exercise.name}</Typography>
                                            <IconButton size="small" onClick={() => setBlocks((c) => c.filter((b) => b.key !== block.key))}
                                                        sx={{ color: theme.mix(0.5) }} aria-label={`Remove ${block.exercise.name}`}>
                                                <CloseIcon fontSize="small" />
                                            </IconButton>
                                        </Box>

                                        <Box sx={{ display: 'grid', gridTemplateColumns: timed ? '36px 1fr 48px 36px' : '36px 1fr 1fr 48px 36px', gap: 1, alignItems: 'center', mb: 0.5 }}>
                                            <Typography sx={{ color: theme.mix(0.4), fontSize: '0.72rem', textAlign: 'center' }}>SET</Typography>
                                            {timed
                                                ? <Typography sx={{ color: theme.mix(0.4), fontSize: '0.72rem', textAlign: 'center' }}>SECONDS</Typography>
                                                : <>
                                                    <Typography sx={{ color: theme.mix(0.4), fontSize: '0.72rem', textAlign: 'center' }}>
                                                        KG{block.exercise.trackingType === 'REPS' ? ' (optional)' : ''}
                                                    </Typography>
                                                    <Typography sx={{ color: theme.mix(0.4), fontSize: '0.72rem', textAlign: 'center' }}>REPS</Typography>
                                                </>}
                                            <Typography sx={{ color: theme.mix(0.4), fontSize: '0.72rem', textAlign: 'center' }}>WARM-UP</Typography>
                                            <span />
                                        </Box>

                                        {block.sets.map((set, index) => (
                                            <Box key={index} sx={{ display: 'grid', gridTemplateColumns: timed ? '36px 1fr 48px 36px' : '36px 1fr 1fr 48px 36px', gap: 1, alignItems: 'center', mb: 0.75 }}>
                                                <Typography sx={{ color: set.warmup ? '#ffa726' : theme.mix(0.7), textAlign: 'center', fontWeight: 700 }}>
                                                    {set.warmup ? 'W' : index + 1}
                                                </Typography>
                                                {timed ? (
                                                    <TextField size="small" type="number" value={set.durationSec} placeholder="60"
                                                               onChange={(e) => updateSet(block.key, index, 'durationSec', e.target.value)}
                                                               inputProps={{ min: 0, 'aria-label': `Set ${index + 1} seconds` }} sx={setInputStyle} />
                                                ) : (
                                                    <>
                                                        <TextField size="small" type="number" value={set.weightKg} placeholder="0"
                                                                   onChange={(e) => updateSet(block.key, index, 'weightKg', e.target.value)}
                                                                   inputProps={{ min: 0, step: 0.5, 'aria-label': `Set ${index + 1} weight in kg` }} sx={setInputStyle} />
                                                        <TextField size="small" type="number" value={set.reps} placeholder="10"
                                                                   onChange={(e) => updateSet(block.key, index, 'reps', e.target.value)}
                                                                   inputProps={{ min: 0, 'aria-label': `Set ${index + 1} reps` }} sx={setInputStyle} />
                                                    </>
                                                )}
                                                <Tooltip title="Warm-up sets don't count toward records">
                                                    <Checkbox size="small" checked={set.warmup}
                                                              onChange={(e) => updateSet(block.key, index, 'warmup', e.target.checked)}
                                                              sx={{ color: theme.mix(0.4), '&.Mui-checked': { color: '#ffa726' }, justifySelf: 'center' }} />
                                                </Tooltip>
                                                <IconButton size="small" onClick={() => removeSet(block.key, index)} disabled={block.sets.length === 1}
                                                            sx={{ color: theme.mix(0.4) }} aria-label={`Remove set ${index + 1}`}>
                                                    <DeleteIcon fontSize="small" />
                                                </IconButton>
                                            </Box>
                                        ))}

                                        <Button size="small" startIcon={<AddIcon />} onClick={() => addSet(block.key)} sx={{ color: '#4ecdc4', mt: 0.5 }}>
                                            Add set
                                        </Button>
                                    </Box>
                                );
                            })}

                            <Box sx={{ mb: 3 }}>
                                <ExercisePicker theme={theme} onSelect={addExercise}
                                                excludeIds={blocks.map((b) => b.exercise.id)} />
                            </Box>

                            <TextField fullWidth label="Notes (optional)" value={form.notes}
                                       onChange={(e) => setForm({ ...form, notes: e.target.value })}
                                       sx={inputStyle} multiline rows={2} />

                            <TextField fullWidth label="Tags (press Enter to add)" value={tagInput}
                                       onChange={(e) => setTagInput(e.target.value)}
                                       onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addTag(); } }}
                                       placeholder="e.g. morning, legs, cardio" sx={inputStyle} />

                            {form.tags.length > 0 && (
                                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mb: 2, mt: -1 }}>
                                    {form.tags.map((tag) => (
                                        <Chip key={tag} label={tag} size="small"
                                              onDelete={() => setForm({ ...form, tags: form.tags.filter((t) => t !== tag) })}
                                              sx={{ background: 'rgba(78,205,196,0.15)', color: '#4ecdc4', '& .MuiChip-deleteIcon': { color: '#4ecdc4' } }} />
                                    ))}
                                </Box>
                            )}

                            <Typography sx={{ color: theme.mix(0.4), fontSize: '0.78rem', mb: 1.5 }}>
                                {userWeight
                                    ? `Calories are calculated from your profile weight (${userWeight} kg).`
                                    : 'Calories are estimated with a default weight until you add yours.'}
                            </Typography>

                            <Button fullWidth type="submit" variant="contained" disabled={saving} sx={{
                                py: 1.5, borderRadius: 2, fontWeight: 700,
                                background: 'linear-gradient(90deg, #e94560, #0f3460)',
                                '&:hover': { background: 'linear-gradient(90deg, #c73652, #0a2540)' },
                            }}>
                                {saving ? 'Saving…' : 'Log Workout'}
                            </Button>
                        </Box>
                    </CardContent>
                </Card>

                {/* Search & Filter */}
                <Card sx={{ ...cardStyle, mb: 3 }}>
                    <CardContent sx={{ p: 3 }}>
                        <Typography variant="h6" sx={{ color: theme.mix(1), fontWeight: 700, mb: 2 }}>Search & Filter</Typography>
                        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2 }}>
                            <TextField select label="Workout type" value={searchType} onChange={(e) => setSearchType(e.target.value)}
                                       sx={{ ...inputStyle, minWidth: 160 }} SelectProps={menuProps}>
                                <MenuItem value="">All types</MenuItem>
                                {workoutTypes.map((type) => <MenuItem key={type.label} value={type.label}>{type.label}</MenuItem>)}
                            </TextField>
                            <TextField label="Start date" type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)}
                                       InputLabelProps={{ shrink: true }} sx={{ ...dateStyle(startDate), minWidth: 160 }} />
                            <TextField label="End date" type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)}
                                       InputLabelProps={{ shrink: true }} sx={{ ...dateStyle(endDate), minWidth: 160 }} />
                            <TextField select label="Tag" value={searchTag} onChange={(e) => setSearchTag(e.target.value)}
                                       sx={{ ...inputStyle, minWidth: 160 }} SelectProps={menuProps}>
                                <MenuItem value="">All tags</MenuItem>
                                {allTags.map((tag) => <MenuItem key={tag} value={tag}>{tag}</MenuItem>)}
                            </TextField>
                            <Box sx={{ display: 'flex', gap: 1, alignItems: 'flex-start', mt: 0.5 }}>
                                <Button variant="contained" onClick={handleSearch}
                                        sx={{ py: 1.5, px: 3, borderRadius: 2, fontWeight: 700, background: 'linear-gradient(90deg, #e94560, #0f3460)' }}>
                                    Search
                                </Button>
                                {filtered && (
                                    <Button variant="outlined" onClick={handleClearSearch}
                                            sx={{ py: 1.5, px: 3, borderRadius: 2, borderColor: theme.mix(0.3), color: theme.mix(0.7) }}>
                                        Clear
                                    </Button>
                                )}
                            </Box>
                        </Box>
                    </CardContent>
                </Card>

                {/* Workout History */}
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                    <Typography variant="h6" sx={{ color: theme.mix(1), fontWeight: 700 }}>
                        {filtered ? `Search Results (${workouts.length})` : 'Workout History'}
                    </Typography>
                    {workouts.length > 0 && (
                        <Button size="small" startIcon={<PictureAsPdfIcon />} onClick={handleExportPdf}
                                title="Downloads your full workout history as a PDF"
                                sx={{ color: theme.mix(0.7), border: `1px solid ${theme.mix(0.15)}`, borderRadius: 2 }}>
                            Export PDF
                        </Button>
                    )}
                </Box>

                {workouts.length === 0 ? (
                    <Typography sx={{ color: theme.mix(0.5), textAlign: 'center', mt: 2 }}>
                        {filtered ? 'No workouts found for selected filters.' : 'No workouts logged yet. Start by logging one above!'}
                    </Typography>
                ) : workouts.map((workout) => {
                    const hasExercises = workout.exercises?.length > 0;
                    const expanded = expandedId === workout.id;
                    return (
                        <Card key={workout.id} sx={{ ...cardStyle, mb: 2, '&:hover': { borderColor: 'rgba(233,69,96,0.5)' } }}>
                            <CardContent>
                                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 1 }}>
                                    <Box sx={{ minWidth: 0 }}>
                                        <Typography sx={{ color: theme.mix(1), fontWeight: 700 }}>{workout.type}</Typography>
                                        <Typography sx={{ color: theme.mix(0.5), fontSize: '0.85rem' }}>
                                            {workout.distanceMeters ? `${(workout.distanceMeters / 1000).toFixed(2)} km • ` : ''}
                                            {workout.duration} mins • {workout.caloriesBurned} kcal • {workout.date}
                                            {workout.totalVolumeKg ? ` • ${workout.totalVolumeKg.toLocaleString()} kg volume` : ''}
                                        </Typography>
                                        {workout.source === 'GPS' && (
                                            <Button size="small" onClick={() => navigate(`/runs/${workout.id}`)}
                                                    sx={{ color: '#45b7d1', px: 0, minWidth: 0, mt: 0.5, fontWeight: 600 }}>
                                                View route & splits →
                                            </Button>
                                        )}
                                        {hasExercises && workout.exercises.map((ex) => (
                                            <Typography key={ex.id} sx={{ color: theme.mix(0.75), fontSize: '0.82rem', mt: 0.5 }}>
                                                <strong>{ex.exerciseName}</strong> — {summarizeExercise(ex)}
                                            </Typography>
                                        ))}
                                        {workout.notes && <Typography sx={{ color: theme.mix(0.4), fontSize: '0.8rem', mt: 0.5 }}>{workout.notes}</Typography>}
                                        {workout.tags?.length > 0 && (
                                            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5, mt: 1 }}>
                                                {workout.tags.map((tag) => (
                                                    <Chip key={tag} label={tag} size="small" sx={{ background: 'rgba(78,205,196,0.15)', color: '#4ecdc4', fontSize: '0.7rem', height: 20 }} />
                                                ))}
                                            </Box>
                                        )}
                                    </Box>
                                    <Box sx={{ display: 'flex', flexShrink: 0 }}>
                                        {hasExercises && (
                                            <IconButton onClick={() => setExpandedId(expanded ? null : workout.id)} sx={{ color: theme.mix(0.6) }}
                                                        aria-label={expanded ? 'Hide sets' : 'Show sets'}>
                                                <ExpandMoreIcon sx={{ transform: expanded ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }} />
                                            </IconButton>
                                        )}
                                        <IconButton onClick={() => handleDelete(workout.id)} sx={{ color: '#e94560' }} aria-label="Delete workout">
                                            <DeleteIcon />
                                        </IconButton>
                                    </Box>
                                </Box>

                                {hasExercises && (
                                    <Collapse in={expanded}>
                                        <Box sx={{ mt: 2, display: 'grid', gap: 1.5 }}>
                                            {workout.exercises.map((ex) => (
                                                <Box key={ex.id} sx={{ background: theme.mix(0.03), borderRadius: 2, p: 1.5 }}>
                                                    <Typography onClick={() => navigate(`/records/${ex.exerciseId}`)}
                                                                sx={{ color: theme.mix(1), fontWeight: 600, mb: 0.5, cursor: 'pointer', '&:hover': { color: '#4ecdc4' } }}>
                                                        {ex.exerciseName}
                                                    </Typography>
                                                    {ex.sets.map((s) => (
                                                        <Typography key={s.setNumber} sx={{ color: s.warmup ? '#ffa726' : theme.mix(0.7), fontSize: '0.82rem' }}>
                                                            {s.warmup ? 'Warm-up' : `Set ${s.setNumber}`}: {ex.trackingType === 'DURATION'
                                                                ? formatDuration(s.durationSec)
                                                                : `${s.weightKg ? `${s.weightKg} kg × ` : ''}${s.reps} reps`}
                                                        </Typography>
                                                    ))}
                                                </Box>
                                            ))}
                                        </Box>
                                    </Collapse>
                                )}
                            </CardContent>
                        </Card>
                    );
                })}
            </Box>
        </Box>
    );
}

export default Workouts;
