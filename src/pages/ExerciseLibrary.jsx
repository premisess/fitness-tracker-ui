import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import API from '../services/api';
import { errorMessage } from '../services/errors';
import { useAppTheme } from '../context/ThemeContext';
import {
    Box, Typography, AppBar, Toolbar, IconButton,
    Card, CardContent, TextField, Chip, MenuItem,
    InputAdornment, Button, Alert, CircularProgress
} from '@mui/material';
import FitnessCenterIcon from '@mui/icons-material/FitnessCenter';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import SearchIcon from '@mui/icons-material/Search';
import AddIcon from '@mui/icons-material/Add';
import EmojiEventsIcon from '@mui/icons-material/EmojiEvents';
import CloseIcon from '@mui/icons-material/Close';
import ExerciseDemo from '../components/ExerciseDemo';
import Blobs from '../components/Glass';
import { FONT, glassCard, fieldStyle, sectionTitle } from '../theme/styles';

const PAGE_SIZE = 24;

const categoryColors = {
    strength: '#e94560',
    powerlifting: '#a29bfe',
    'olympic weightlifting': '#ffa726',
    strongman: '#45b7d1',
    plyometrics: '#ff6b35',
    cardio: '#4ecdc4',
    stretching: '#4ecdc4',
};

const colorFor = (category) => categoryColors[category] || '#e94560';

const titleCase = (text) => (text || '').replace(/\b\w/g, (c) => c.toUpperCase());

const goalRecommendations = {
    LOSE_WEIGHT: { repsOrTime: '3 sets × 20 reps', duration: 15, intensity: 'High', tip: 'Minimal rest between sets (30 sec)' },
    BUILD_STRENGTH: { repsOrTime: '5 sets × 8 reps', duration: 20, intensity: 'Very High', tip: 'Rest 2-3 minutes between sets' },
    RUN_MORE: { repsOrTime: '2 sets × 15 reps', duration: 10, intensity: 'Moderate', tip: 'Use as warm-up before running' },
    GAIN_WEIGHT: { repsOrTime: '4 sets × 12 reps', duration: 18, intensity: 'High', tip: 'Rest 90 seconds between sets' },
    STAY_ACTIVE: { repsOrTime: '3 sets × 15 reps', duration: 12, intensity: 'Moderate', tip: 'Focus on form over speed' },
};

const timedRecommendations = {
    LOSE_WEIGHT: { repsOrTime: '45 min cardio', duration: 45, intensity: 'High', tip: 'Keep heart rate at 70-80% max' },
    BUILD_STRENGTH: { repsOrTime: '10 min warmup', duration: 10, intensity: 'Low', tip: 'Use as warmup only' },
    RUN_MORE: { repsOrTime: '60 min run', duration: 60, intensity: 'High', tip: 'Maintain steady pace throughout' },
    GAIN_WEIGHT: { repsOrTime: '20 min light cardio', duration: 20, intensity: 'Low', tip: 'Keep cardio minimal to preserve calories' },
    STAY_ACTIVE: { repsOrTime: '30 min cardio', duration: 30, intensity: 'Moderate', tip: 'Any pace is fine, just keep moving' },
};

const intensityColor = (intensity) => {
    if (intensity === 'Very High') return '#e94560';
    if (intensity === 'High') return '#ff6b35';
    if (intensity === 'Moderate') return '#ffa726';
    return '#4ecdc4';
};

function ExerciseLibrary() {
    const { theme } = useAppTheme();
    const navigate = useNavigate();

    const [search, setSearch] = useState('');
    const [debouncedSearch, setDebouncedSearch] = useState('');
    const [category, setCategory] = useState('');
    const [muscle, setMuscle] = useState('');
    const [filters, setFilters] = useState({ categories: [], muscles: [] });

    const [items, setItems] = useState([]);
    const [total, setTotal] = useState(0);
    const [page, setPage] = useState(0);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    const [selected, setSelected] = useState(null);
    const [activeGoalType, setActiveGoalType] = useState(null);

    // Wait until typing pauses before searching.
    useEffect(() => {
        const id = setTimeout(() => setDebouncedSearch(search.trim()), 300);
        return () => clearTimeout(id);
    }, [search]);

    useEffect(() => {
        let ignore = false;
        Promise.all([API.get('/exercises/filters'), API.get('/goals')])
            .then(([filtersRes, goalsRes]) => {
                if (ignore) return;
                setFilters(filtersRes.data);
                const goal = goalsRes.data.find((g) => g.status === 'IN_PROGRESS' && g.autoTrack);
                if (goal) setActiveGoalType(goal.goalType);
            })
            .catch(() => {});
        return () => { ignore = true; };
    }, []);

    // Any change to the search or filters starts again from the first page.
    useEffect(() => {
        let ignore = false;
        const params = new URLSearchParams({ page: '0', size: String(PAGE_SIZE) });
        if (debouncedSearch) params.set('q', debouncedSearch);
        if (category) params.set('category', category);
        if (muscle) params.set('muscle', muscle);
        API.get(`/exercises?${params}`)
            .then((res) => {
                if (ignore) return;
                setItems(res.data.items);
                setTotal(res.data.total);
                setPage(0);
                setError('');
            })
            .catch((err) => { if (!ignore) setError(errorMessage(err, 'Could not load exercises')); })
            .finally(() => { if (!ignore) setLoading(false); });
        return () => { ignore = true; };
    }, [debouncedSearch, category, muscle]);

    const loadMore = async () => {
        const next = page + 1;
        const params = new URLSearchParams({ page: String(next), size: String(PAGE_SIZE) });
        if (debouncedSearch) params.set('q', debouncedSearch);
        if (category) params.set('category', category);
        if (muscle) params.set('muscle', muscle);
        setLoading(true);
        try {
            const res = await API.get(`/exercises?${params}`);
            setItems((current) => [...current, ...res.data.items]);
            setPage(next);
        } catch (err) {
            setError(errorMessage(err, 'Could not load more exercises'));
        } finally {
            setLoading(false);
        }
    };

    const changeCategory = (value) => {
        setLoading(true);
        setCategory((current) => (current === value ? '' : value));
    };

    const recommendationFor = (exercise) => {
        if (!activeGoalType || !exercise) return null;
        return exercise.trackingType === 'DURATION'
            ? timedRecommendations[activeGoalType]
            : goalRecommendations[activeGoalType];
    };

    const inputStyle = fieldStyle(theme);

    const rec = recommendationFor(selected);

    return (
        <Box sx={{ minHeight: '100vh', background: theme.bgGradient, fontFamily: FONT, position: 'relative' }}>
            <Blobs />
            <AppBar position="static" sx={{ background: theme.mix(0.05), backdropFilter: 'blur(10px)', boxShadow: 'none', borderBottom: `1px solid ${theme.mix(0.1)}` }}>
                <Toolbar>
                    <IconButton onClick={() => navigate('/dashboard')} sx={{ color: theme.mix(1), mr: 1 }}>
                        <ArrowBackIcon />
                    </IconButton>
                    <FitnessCenterIcon sx={{ color: '#e94560', mr: 1 }} />
                    <Typography variant="h6" sx={{ color: theme.mix(1), fontWeight: 700, fontFamily: "'Poppins', sans-serif", flexGrow: 1 }}>
                        Exercise Library
                    </Typography>
                    {activeGoalType && (
                        <Chip label={`Goal: ${activeGoalType.replaceAll('_', ' ')}`} size="small"
                              sx={{ background: '#e94560', color: '#fff', fontFamily: "'Poppins', sans-serif" }} />
                    )}
                </Toolbar>
            </AppBar>

            <Box sx={{ maxWidth: 1000, mx: 'auto', py: 4, px: 2, position: 'relative', zIndex: 1 }}>
                {!activeGoalType && (
                    <Alert severity="info" sx={{ mb: 3 }}>
                        Set a goal to get personalised sets and reps for each exercise.
                        <Button size="small" onClick={() => navigate('/goals')} sx={{ ml: 1 }}>Set goal</Button>
                    </Alert>
                )}
                {error && <Alert severity="error" sx={{ mb: 3 }}>{error}</Alert>}

                <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap', mb: 2 }}>
                    <TextField placeholder="Search 800+ exercises, e.g. bench press" value={search}
                               onChange={(e) => { setLoading(true); setSearch(e.target.value); }}
                               sx={{ ...inputStyle, flex: '1 1 320px' }}
                               slotProps={{
                                   input: {
                                       startAdornment: (
                                           <InputAdornment position="start">
                                               <SearchIcon sx={{ color: theme.mix(0.5) }} />
                                           </InputAdornment>
                                       ),
                                   },
                               }} />
                    <TextField select label="Muscle" value={muscle}
                               onChange={(e) => { setLoading(true); setMuscle(e.target.value); }}
                               sx={{ ...inputStyle, minWidth: 190 }}
                               SelectProps={{ MenuProps: { PaperProps: { sx: { background: theme.menuBg, color: theme.mix(1) } } } }}>
                        <MenuItem value="">All muscles</MenuItem>
                        {filters.muscles.map((m) => (
                            <MenuItem key={m} value={m}>{titleCase(m)}</MenuItem>
                        ))}
                    </TextField>
                </Box>

                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mb: 3 }}>
                    <Chip label="All" onClick={() => changeCategory('')}
                          sx={{ background: category === '' ? '#e94560' : theme.mix(0.1), color: category === '' ? '#fff' : theme.mix(1), fontWeight: 600 }} />
                    {filters.categories.map((cat) => (
                        <Chip key={cat} label={titleCase(cat)} onClick={() => changeCategory(cat)}
                              sx={{
                                  background: category === cat ? colorFor(cat) : theme.mix(0.1),
                                  color: category === cat ? '#fff' : theme.mix(1),
                                  fontWeight: 600,
                                  '&:hover': { background: colorFor(cat), color: '#fff' },
                              }} />
                    ))}
                </Box>

                {selected && (
                    <Card sx={{ ...glassCard(theme), border: `1px solid ${colorFor(selected.category)}`, mb: 3 }}>
                        <CardContent sx={{ p: 3 }}>
                            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
                                <Box>
                                    <Typography sx={sectionTitle(theme)}>
                                        {selected.name}
                                    </Typography>
                                    <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', mt: 1 }}>
                                        <Chip size="small" label={titleCase(selected.category)} sx={{ background: colorFor(selected.category), color: '#fff' }} />
                                        {selected.level && <Chip size="small" label={titleCase(selected.level)} sx={{ background: theme.mix(0.1), color: theme.mix(1) }} />}
                                        {selected.equipment && <Chip size="small" label={titleCase(selected.equipment)} sx={{ background: theme.mix(0.1), color: theme.mix(1) }} />}
                                        {selected.mechanic && <Chip size="small" label={titleCase(selected.mechanic)} sx={{ background: theme.mix(0.1), color: theme.mix(1) }} />}
                                    </Box>
                                </Box>
                                <IconButton onClick={() => setSelected(null)} sx={{ color: theme.mix(0.7) }} aria-label="Close details">
                                    <CloseIcon />
                                </IconButton>
                            </Box>

                            <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' }, gap: 3 }}>
                                <ExerciseDemo exercise={selected} height={280} animate="always" color={colorFor(selected.category)} />

                                <Box>
                                    <Typography sx={{ color: theme.mix(0.5), fontSize: '0.8rem', mb: 0.5 }}>Primary muscles</Typography>
                                    <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap', mb: 1.5 }}>
                                        {selected.primaryMuscles.map((m) => (
                                            <Chip key={m} size="small" label={titleCase(m)} sx={{ background: 'rgba(78,205,196,0.15)', color: '#4ecdc4' }} />
                                        ))}
                                    </Box>
                                    {selected.secondaryMuscles.length > 0 && (
                                        <>
                                            <Typography sx={{ color: theme.mix(0.5), fontSize: '0.8rem', mb: 0.5 }}>Also works</Typography>
                                            <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap', mb: 1.5 }}>
                                                {selected.secondaryMuscles.map((m) => (
                                                    <Chip key={m} size="small" label={titleCase(m)} sx={{ background: theme.mix(0.08), color: theme.mix(0.8) }} />
                                                ))}
                                            </Box>
                                        </>
                                    )}

                                    {rec && (
                                        <Box sx={{ p: 2, borderRadius: 2, mb: 2, background: 'rgba(78,205,196,0.1)', border: '1px solid rgba(78,205,196,0.3)' }}>
                                            <Typography sx={{ color: '#4ecdc4', fontWeight: 700, mb: 1, fontSize: '0.9rem' }}>Recommended for your goal</Typography>
                                            <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
                                                <Box>
                                                    <Typography sx={{ color: theme.mix(0.5), fontSize: '0.75rem' }}>Sets / time</Typography>
                                                    <Typography sx={{ color: theme.mix(1), fontWeight: 700 }}>{rec.repsOrTime}</Typography>
                                                </Box>
                                                <Box>
                                                    <Typography sx={{ color: theme.mix(0.5), fontSize: '0.75rem' }}>Intensity</Typography>
                                                    <Typography sx={{ color: intensityColor(rec.intensity), fontWeight: 700 }}>{rec.intensity}</Typography>
                                                </Box>
                                            </Box>
                                            <Typography sx={{ color: theme.mix(0.6), fontSize: '0.8rem', mt: 1, fontStyle: 'italic' }}>💡 {rec.tip}</Typography>
                                        </Box>
                                    )}

                                    <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                                        <Button variant="contained" startIcon={<AddIcon />}
                                                onClick={() => navigate(`/workouts?exerciseId=${selected.id}`)}
                                                sx={{ borderRadius: 2, fontWeight: 700, background: 'linear-gradient(90deg, #e94560, #0f3460)' }}>
                                            Add to a workout
                                        </Button>
                                        <Button variant="outlined" startIcon={<EmojiEventsIcon />}
                                                onClick={() => navigate(`/records/${selected.id}`)}
                                                sx={{ borderRadius: 2, fontWeight: 700, borderColor: '#ffa726', color: '#ffa726' }}>
                                            History & records
                                        </Button>
                                    </Box>
                                </Box>
                            </Box>

                            {selected.instructions.length > 0 && (
                                <Box component="ol" sx={{ color: theme.mix(0.85), pl: 2.5, mt: 3, mb: 0, '& li': { mb: 1, lineHeight: 1.6, fontSize: '0.9rem' } }}>
                                    {selected.instructions.map((step, i) => <li key={i}>{step}</li>)}
                                </Box>
                            )}
                        </CardContent>
                    </Card>
                )}

                <Typography sx={{ color: theme.mix(0.5), mb: 2, fontSize: '0.85rem' }}>
                    {loading && items.length === 0 ? 'Loading…' : `${total} exercise${total === 1 ? '' : 's'}`}
                </Typography>

                <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr 1fr', sm: 'repeat(3, 1fr)', md: 'repeat(4, 1fr)' }, gap: 2 }}>
                    {items.map((exercise) => (
                        <Card key={exercise.id}
                              onClick={() => { setSelected(exercise); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
                              sx={{
                                  ...glassCard(theme),
                                  border: `1px solid ${selected?.id === exercise.id ? colorFor(exercise.category) : theme.mix(0.1)}`,
                                  cursor: 'pointer', overflow: 'hidden',
                                  transition: 'transform 0.2s, border-color 0.2s',
                                  '&:hover': { borderColor: colorFor(exercise.category), transform: 'translateY(-3px)' },
                              }}>
                            <ExerciseDemo exercise={exercise} height={130} animate="hover" radius={0} color={colorFor(exercise.category)} />
                            <CardContent sx={{ p: 1.5, '&:last-child': { pb: 1.5 } }}>
                                <Typography sx={{ color: theme.mix(1), fontWeight: 600, fontSize: '0.85rem', lineHeight: 1.3, mb: 0.5 }}>
                                    {exercise.name}
                                </Typography>
                                <Typography sx={{ color: colorFor(exercise.category), fontSize: '0.7rem', fontWeight: 600 }}>
                                    {titleCase(exercise.category)}
                                </Typography>
                                <Typography sx={{ color: theme.mix(0.45), fontSize: '0.7rem' }}>
                                    {titleCase(exercise.primaryMuscles.join(', '))}
                                </Typography>
                            </CardContent>
                        </Card>
                    ))}
                </Box>

                {!loading && items.length === 0 && !error && (
                    <Typography sx={{ color: theme.mix(0.5), textAlign: 'center', mt: 4 }}>
                        No exercises match. Try a different search or filter.
                    </Typography>
                )}

                {items.length < total && (
                    <Box sx={{ textAlign: 'center', mt: 3 }}>
                        <Button variant="outlined" onClick={loadMore} disabled={loading}
                                sx={{ borderRadius: 2, borderColor: theme.mix(0.3), color: theme.mix(0.8), minWidth: 160 }}>
                            {loading ? <CircularProgress size={20} /> : `Load more (${total - items.length} left)`}
                        </Button>
                    </Box>
                )}
            </Box>
        </Box>
    );
}

export default ExerciseLibrary;
