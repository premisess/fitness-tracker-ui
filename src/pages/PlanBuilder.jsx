import { useEffect, useState } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import {
    Alert, AppBar, Box, Button, Card, CardContent, CircularProgress, IconButton, MenuItem, TextField,
    ToggleButton, ToggleButtonGroup, Toolbar, Typography,
} from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import EditNoteIcon from '@mui/icons-material/EditNote';
import DeleteIcon from '@mui/icons-material/Delete';
import ArrowUpwardIcon from '@mui/icons-material/ArrowUpward';
import ArrowDownwardIcon from '@mui/icons-material/ArrowDownward';
import FitnessCenterIcon from '@mui/icons-material/FitnessCenter';
import DirectionsRunIcon from '@mui/icons-material/DirectionsRun';
import API from '../services/api';
import { errorMessage } from '../services/errors';
import { useAppTheme } from '../context/ThemeContext';
import ExercisePicker from '../components/ExercisePicker';
import { GOAL_LABELS } from '../utils/plans';
import Blobs from '../components/Glass';
import { FONT, glassCard, fieldStyle, sectionTitle } from '../theme/styles';

const LEVELS = ['beginner', 'intermediate', 'expert'];

// Stable React keys for rows that can be added, removed and reordered.
let keyCounter = 0;
const nextKey = () => `row-${keyCounter++}`;

const blankSession = (index) => ({
    key: nextKey(),
    title: `Day ${index + 1}`,
    focus: '',
    activity: 'STRENGTH',
    workoutType: 'Weightlifting',
    targetMinutes: 45,
    distanceKm: '',
    instructions: '',
    exercises: [],
});

/** Turns a saved plan into builder state. A copy of a week-by-week plan starts from its first week. */
const fromPlan = (detail, copy) => {
    const plan = detail.plan;
    const sessions = detail.sessions
        .filter((s) => s.weekNumber == null || s.weekNumber === 1)
        .sort((a, b) => a.dayNumber - b.dayNumber)
        .slice(0, plan.daysPerWeek);
    return {
        form: {
            name: (copy ? `${plan.name} (my version)` : plan.name).slice(0, 100),
            summary: plan.summary || '',
            description: detail.description || '',
            goal: plan.goal,
            level: LEVELS.includes(plan.level) ? plan.level : 'beginner',
            equipment: plan.equipment || '',
            durationWeeks: plan.durationWeeks,
            daysPerWeek: Math.max(1, sessions.length),
        },
        sessions: sessions.map((s) => ({
            key: nextKey(),
            title: s.title,
            focus: s.focus || '',
            activity: s.activity,
            workoutType: s.workoutType,
            targetMinutes: s.targetMinutes,
            distanceKm: s.targetDistanceM ? s.targetDistanceM / 1000 : '',
            instructions: s.instructions || '',
            exercises: s.exercises.map((e) => ({
                key: nextKey(),
                exerciseId: e.exerciseId,
                name: e.name,
                thumbnailUrl: e.thumbnailUrl,
                sets: e.sets,
                reps: e.reps,
                restSec: e.restSec,
            })),
        })),
    };
};

/** Build a new workout plan (/plans/new, optionally ?from=slug to start from a copy) or edit one (/plans/:slug/edit). */
function PlanBuilder() {
    const { theme } = useAppTheme();
    const navigate = useNavigate();
    const { slug } = useParams();
    const [searchParams] = useSearchParams();
    const copyFrom = searchParams.get('from');
    const editing = !!slug;
    const source = slug || copyFrom;

    const [form, setForm] = useState({
        name: '', summary: '', description: '', goal: 'BUILD_STRENGTH', level: 'beginner',
        equipment: '', durationWeeks: 6, daysPerWeek: 3,
    });
    const [sessions, setSessions] = useState(() => [0, 1, 2].map(blankSession));
    const [workoutTypes, setWorkoutTypes] = useState(['Weightlifting', 'Running', 'HIIT']);
    const [loading, setLoading] = useState(!!source);
    const [error, setError] = useState('');
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        let ignore = false;
        API.get('/workouts/types')
            .then((res) => { if (!ignore) setWorkoutTypes(res.data.map((t) => t.label)); })
            .catch(() => {});
        return () => { ignore = true; };
    }, []);

    useEffect(() => {
        if (!source) return undefined;
        let ignore = false;
        API.get(`/plans/${source}`)
            .then((res) => {
                if (ignore) return;
                if (editing && !res.data.plan.editable) {
                    setError("This plan can't be edited: it's built in, or you've already started it. Make a copy instead.");
                }
                const state = fromPlan(res.data, !editing);
                setForm(state.form);
                setSessions(state.sessions);
            })
            .catch((err) => { if (!ignore) setError(errorMessage(err, 'Could not load that plan')); })
            .finally(() => { if (!ignore) setLoading(false); });
        return () => { ignore = true; };
    }, [source, editing]);

    const changeDaysPerWeek = (value) => {
        const days = Math.max(1, Math.min(7, Number(value) || 1));
        setForm((f) => ({ ...f, daysPerWeek: days }));
        setSessions((current) => (current.length >= days
            ? current.slice(0, days)
            : [...current, ...Array.from({ length: days - current.length }, (_, i) => blankSession(current.length + i))]));
    };

    const updateSession = (key, patch) => {
        setSessions((current) => current.map((s) => (s.key === key ? { ...s, ...patch } : s)));
    };

    const setActivity = (session, activity) => {
        if (!activity) return;
        let { workoutType } = session;
        if (activity === 'RUN' && workoutType === 'Weightlifting') workoutType = 'Running';
        if (activity === 'STRENGTH' && workoutType === 'Running') workoutType = 'Weightlifting';
        updateSession(session.key, { activity, workoutType });
    };

    const addExercise = (sessionKey, exercise) => {
        setSessions((current) => current.map((s) => (s.key !== sessionKey ? s : {
            ...s,
            exercises: [...s.exercises, {
                key: nextKey(),
                exerciseId: exercise.id,
                name: exercise.name,
                thumbnailUrl: exercise.imageUrls?.[0],
                sets: 3,
                reps: exercise.trackingType === 'DURATION' ? '30 s' : '8-12',
                restSec: 60,
            }],
        })));
    };

    const updateExercise = (sessionKey, exerciseKey, patch) => {
        setSessions((current) => current.map((s) => (s.key !== sessionKey ? s : {
            ...s,
            exercises: s.exercises.map((e) => (e.key === exerciseKey ? { ...e, ...patch } : e)),
        })));
    };

    const removeExercise = (sessionKey, exerciseKey) => {
        setSessions((current) => current.map((s) => (s.key !== sessionKey ? s : {
            ...s,
            exercises: s.exercises.filter((e) => e.key !== exerciseKey),
        })));
    };

    const moveExercise = (sessionKey, index, delta) => {
        setSessions((current) => current.map((s) => {
            if (s.key !== sessionKey) return s;
            const target = index + delta;
            if (target < 0 || target >= s.exercises.length) return s;
            const exercises = [...s.exercises];
            [exercises[index], exercises[target]] = [exercises[target], exercises[index]];
            return { ...s, exercises };
        }));
    };

    const save = async () => {
        setError('');
        setSaving(true);
        const body = {
            ...form,
            durationWeeks: Number(form.durationWeeks),
            daysPerWeek: Number(form.daysPerWeek),
            sessions: sessions.map((s) => ({
                title: s.title,
                focus: s.focus,
                activity: s.activity,
                workoutType: s.workoutType,
                targetMinutes: Number(s.targetMinutes),
                targetDistanceM: s.activity === 'RUN' && s.distanceKm !== '' ? Math.round(Number(s.distanceKm) * 1000) : null,
                instructions: s.instructions,
                exercises: s.activity === 'STRENGTH'
                    ? s.exercises.map((e) => ({ exerciseId: e.exerciseId, sets: Number(e.sets), reps: e.reps, restSec: Number(e.restSec) }))
                    : [],
            })),
        };
        try {
            const res = editing
                ? await API.put(`/plans/custom/${slug}`, body)
                : await API.post('/plans/custom', body);
            navigate(`/plans/${res.data.plan.slug}`);
        } catch (err) {
            setError(errorMessage(err, 'Could not save your plan'));
            setSaving(false);
        }
    };

    const inputStyle = fieldStyle(theme);
    const smallField = { ...inputStyle, '& .MuiInputBase-input': { color: theme.mix(1), py: 0.9 } };
    const menuProps = { MenuProps: { PaperProps: { sx: { background: theme.menuBg, color: theme.mix(1) } } } };

    return (
        <Box sx={{ minHeight: '100vh', background: theme.bgGradient, fontFamily: FONT, position: 'relative' }}>
            <Blobs />
            <AppBar position="static" sx={{ background: theme.mix(0.05), backdropFilter: 'blur(10px)', boxShadow: 'none', borderBottom: `1px solid ${theme.mix(0.1)}` }}>
                <Toolbar>
                    <IconButton onClick={() => navigate(-1)} sx={{ color: theme.mix(1), mr: 1 }} aria-label="Back">
                        <ArrowBackIcon />
                    </IconButton>
                    <EditNoteIcon sx={{ color: '#66bb6a', mr: 1 }} />
                    <Typography variant="h6" sx={{ color: theme.mix(1), fontWeight: 700 }}>
                        {editing ? 'Edit your plan' : 'Build your own plan'}
                    </Typography>
                </Toolbar>
            </AppBar>

            <Box sx={{ maxWidth: 860, mx: 'auto', py: 4, px: 2, position: 'relative', zIndex: 1 }}>
                {error && <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError('')}>{error}</Alert>}

                {loading ? (
                    <Box sx={{ textAlign: 'center', py: 8 }}><CircularProgress sx={{ color: '#e94560' }} /></Box>
                ) : (
                    <>
                        <Card sx={{ ...glassCard(theme), mb: 3 }}>
                            <CardContent sx={{ p: 3 }}>
                                <Typography sx={{ ...sectionTitle(theme), mb: 2 }}>Plan details</Typography>
                                <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' }, gap: 2 }}>
                                    <TextField label="Plan name" value={form.name} required sx={{ ...inputStyle, gridColumn: { sm: '1 / -1' } }}
                                               onChange={(e) => setForm({ ...form, name: e.target.value })} />
                                    <TextField label="Short summary" value={form.summary} sx={{ ...inputStyle, gridColumn: { sm: '1 / -1' } }}
                                               placeholder="e.g. Upper/lower split to get stronger in 8 weeks"
                                               onChange={(e) => setForm({ ...form, summary: e.target.value })} />
                                    <TextField select label="Goal" value={form.goal} sx={inputStyle} SelectProps={menuProps}
                                               onChange={(e) => setForm({ ...form, goal: e.target.value })}>
                                        {Object.entries(GOAL_LABELS).map(([value, label]) => <MenuItem key={value} value={value}>{label}</MenuItem>)}
                                    </TextField>
                                    <TextField select label="Level" value={form.level} sx={inputStyle} SelectProps={menuProps}
                                               onChange={(e) => setForm({ ...form, level: e.target.value })}>
                                        {LEVELS.map((level) => <MenuItem key={level} value={level} sx={{ textTransform: 'capitalize' }}>{level}</MenuItem>)}
                                    </TextField>
                                    <TextField label="Weeks" type="number" value={form.durationWeeks} sx={inputStyle}
                                               slotProps={{ htmlInput: { min: 1, max: 52 } }}
                                               onChange={(e) => setForm({ ...form, durationWeeks: e.target.value })} />
                                    <TextField select label="Training days per week" value={form.daysPerWeek} sx={inputStyle} SelectProps={menuProps}
                                               onChange={(e) => changeDaysPerWeek(e.target.value)}>
                                        {[1, 2, 3, 4, 5, 6, 7].map((n) => <MenuItem key={n} value={n}>{n}</MenuItem>)}
                                    </TextField>
                                    <TextField label="Equipment" value={form.equipment} sx={{ ...inputStyle, gridColumn: { sm: '1 / -1' } }}
                                               placeholder="e.g. Dumbbells and a bench"
                                               onChange={(e) => setForm({ ...form, equipment: e.target.value })} />
                                    <TextField label="Notes for yourself (optional)" value={form.description} multiline minRows={2}
                                               sx={{ ...inputStyle, gridColumn: { sm: '1 / -1' } }}
                                               onChange={(e) => setForm({ ...form, description: e.target.value })} />
                                </Box>
                            </CardContent>
                        </Card>

                        <Typography sx={{ ...sectionTitle(theme), mb: 0.5, letterSpacing: 1 }}>Your week</Typography>
                        <Typography sx={{ color: theme.mix(0.45), fontSize: '0.8rem', mb: 2 }}>
                            These {sessions.length} session{sessions.length === 1 ? '' : 's'} repeat every week for {form.durationWeeks || '?'} weeks.
                        </Typography>

                        {sessions.map((session, index) => (
                            <Card key={session.key} sx={{ ...glassCard(theme), mb: 2 }}>
                                <CardContent sx={{ p: 2.5 }}>
                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, flexWrap: 'wrap', mb: 2 }}>
                                        <Typography sx={{ color: '#66bb6a', fontWeight: 800, minWidth: 50 }}>Day {index + 1}</Typography>
                                        <TextField label="Session title" value={session.title} size="small" sx={{ ...inputStyle, flex: 1, minWidth: 180 }}
                                                   onChange={(e) => updateSession(session.key, { title: e.target.value })} />
                                        <ToggleButtonGroup exclusive size="small" value={session.activity}
                                                           onChange={(e, value) => setActivity(session, value)}
                                                           sx={{ '& .MuiToggleButton-root': { color: theme.mix(0.6), borderColor: theme.mix(0.2), textTransform: 'none' }, '& .Mui-selected': { color: '#fff !important', background: '#66bb6a !important' } }}>
                                            <ToggleButton value="STRENGTH"><FitnessCenterIcon fontSize="small" sx={{ mr: 0.5 }} />Strength</ToggleButton>
                                            <ToggleButton value="RUN"><DirectionsRunIcon fontSize="small" sx={{ mr: 0.5 }} />Run</ToggleButton>
                                        </ToggleButtonGroup>
                                    </Box>

                                    <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr 1fr' }, gap: 1.5, mb: 2 }}>
                                        <TextField select size="small" label="Workout type" value={session.workoutType} sx={inputStyle} SelectProps={menuProps}
                                                   onChange={(e) => updateSession(session.key, { workoutType: e.target.value })}>
                                            {workoutTypes.map((type) => <MenuItem key={type} value={type}>{type}</MenuItem>)}
                                        </TextField>
                                        <TextField size="small" label="Minutes" type="number" value={session.targetMinutes} sx={inputStyle}
                                                   onChange={(e) => updateSession(session.key, { targetMinutes: e.target.value })} />
                                        {session.activity === 'RUN' ? (
                                            <TextField size="small" label="Distance (km, optional)" type="number" value={session.distanceKm} sx={inputStyle}
                                                       onChange={(e) => updateSession(session.key, { distanceKm: e.target.value })} />
                                        ) : (
                                            <TextField size="small" label="Focus (optional)" value={session.focus} sx={inputStyle}
                                                       placeholder="e.g. Chest and triceps"
                                                       onChange={(e) => updateSession(session.key, { focus: e.target.value })} />
                                        )}
                                    </Box>

                                    {session.activity === 'RUN' ? (
                                        <TextField fullWidth multiline minRows={2} size="small" label="How to run it (optional)" value={session.instructions} sx={inputStyle}
                                                   placeholder="e.g. 5 min walk, 20 min easy run, 5 min walk"
                                                   onChange={(e) => updateSession(session.key, { instructions: e.target.value })} />
                                    ) : (
                                        <>
                                            {session.exercises.map((exercise, i) => (
                                                <Box key={exercise.key} sx={{
                                                    display: 'grid', alignItems: 'center', gap: 1, py: 1,
                                                    gridTemplateColumns: { xs: '40px 1fr auto', sm: '40px 1fr 70px 100px 80px auto' },
                                                    borderTop: `1px solid ${theme.mix(0.07)}`,
                                                }}>
                                                    {exercise.thumbnailUrl
                                                        ? <Box component="img" src={exercise.thumbnailUrl} alt="" sx={{ width: 40, height: 40, borderRadius: 1, objectFit: 'cover', background: '#fff' }} />
                                                        : <Box sx={{ width: 40, height: 40, borderRadius: 1, background: theme.mix(0.1) }} />}
                                                    <Typography sx={{ color: theme.mix(0.9), fontSize: '0.88rem' }}>{exercise.name}</Typography>
                                                    <TextField size="small" label="Sets" type="number" value={exercise.sets} sx={{ ...smallField, gridColumn: { xs: '2', sm: 'auto' } }}
                                                               onChange={(e) => updateExercise(session.key, exercise.key, { sets: e.target.value })} />
                                                    <TextField size="small" label="Reps" value={exercise.reps} sx={smallField}
                                                               onChange={(e) => updateExercise(session.key, exercise.key, { reps: e.target.value })} />
                                                    <TextField size="small" label="Rest (s)" type="number" value={exercise.restSec} sx={smallField}
                                                               onChange={(e) => updateExercise(session.key, exercise.key, { restSec: e.target.value })} />
                                                    <Box sx={{ display: 'flex', gridRow: { xs: '1', sm: 'auto' }, gridColumn: { xs: '3', sm: 'auto' } }}>
                                                        <IconButton size="small" onClick={() => moveExercise(session.key, i, -1)} disabled={i === 0} sx={{ color: theme.mix(0.5) }} aria-label="Move up">
                                                            <ArrowUpwardIcon fontSize="small" />
                                                        </IconButton>
                                                        <IconButton size="small" onClick={() => moveExercise(session.key, i, 1)} disabled={i === session.exercises.length - 1} sx={{ color: theme.mix(0.5) }} aria-label="Move down">
                                                            <ArrowDownwardIcon fontSize="small" />
                                                        </IconButton>
                                                        <IconButton size="small" onClick={() => removeExercise(session.key, exercise.key)} sx={{ color: '#e94560' }} aria-label={`Remove ${exercise.name}`}>
                                                            <DeleteIcon fontSize="small" />
                                                        </IconButton>
                                                    </Box>
                                                </Box>
                                            ))}
                                            <Box sx={{ mt: 1.5 }}>
                                                <ExercisePicker theme={theme} onSelect={(exercise) => addExercise(session.key, exercise)}
                                                                excludeIds={session.exercises.map((e) => e.exerciseId)} />
                                            </Box>
                                        </>
                                    )}
                                </CardContent>
                            </Card>
                        ))}

                        <Box sx={{ display: 'flex', gap: 1.5, justifyContent: 'flex-end', mt: 3 }}>
                            <Button onClick={() => navigate(-1)} sx={{ color: theme.mix(0.6), textTransform: 'none' }}>Cancel</Button>
                            <Button onClick={save} disabled={saving || !form.name.trim()} variant="contained"
                                    sx={{ borderRadius: 999, px: 4, textTransform: 'none', fontWeight: 700, background: 'linear-gradient(90deg, #66bb6a, #4ecdc4)' }}>
                                {saving ? <CircularProgress size={22} color="inherit" /> : (editing ? 'Save changes' : 'Save plan')}
                            </Button>
                        </Box>
                    </>
                )}
            </Box>
        </Box>
    );
}

export default PlanBuilder;
