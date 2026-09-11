import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import API from '../services/api';
import { useAppTheme } from '../context/ThemeContext';
import {
    Box, Typography, Button, AppBar, Toolbar,
    IconButton, TextField, Card, CardContent, MenuItem, Chip
} from '@mui/material';
import FitnessCenterIcon from '@mui/icons-material/FitnessCenter';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import DeleteIcon from '@mui/icons-material/Delete';
import PictureAsPdfIcon from '@mui/icons-material/PictureAsPdf';
import exportWorkoutsPdf from '../services/exportWorkoutsPdf';

function Workouts() {
    const { theme } = useAppTheme();
    const [workouts, setWorkouts] = useState([]);
    const [workoutTypes, setWorkoutTypes] = useState([]);
    const [form, setForm] = useState({ type: '', duration: '', date: '', notes: '', tags: [] });
    const [tagInput, setTagInput] = useState('');
    const [userWeight, setUserWeight] = useState(null);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [searchType, setSearchType] = useState('');
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');
    const [searchTag, setSearchTag] = useState('');
    const [filtered, setFiltered] = useState(false);
    const navigate = useNavigate();

    const allTags = [...new Set(workouts.flatMap(w => w.tags || []))];

    const addTag = () => {
        const tag = tagInput.trim();
        if (tag && !form.tags.includes(tag)) {
            setForm({ ...form, tags: [...form.tags, tag] });
        }
        setTagInput('');
    };

    const removeTag = (tag) => {
        setForm({ ...form, tags: form.tags.filter(t => t !== tag) });
    };

    useEffect(() => {
        fetchWorkouts();
        fetchUserWeight();
        fetchWorkoutTypes();
    }, []);

    const fetchWorkouts = async () => {
        try {
            const res = await API.get('/workouts');
            setWorkouts(res.data);
        } catch (err) {
            console.error(err);
        }
    };

    const fetchWorkoutTypes = async () => {
        try {
            const res = await API.get('/workouts/types');
            setWorkoutTypes(res.data);
        } catch (err) {
            console.error(err);
        }
    };

    const fetchUserWeight = async () => {
        try {
            const res = await API.get('/profile');
            if (res.data.weight) setUserWeight(res.data.weight);
        } catch (err) {
            console.error(err);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError(''); setSuccess('');
        try {
            await API.post('/workouts', form);
            setSuccess('Workout logged successfully!');
            setForm({ type: '', duration: '', date: '', notes: '', tags: [] });
            setTagInput('');
            fetchWorkouts();
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to log workout');
        }
    };

    const handleDelete = async (id) => {
        try {
            await API.delete(`/workouts/${id}`);
            fetchWorkouts();
        } catch (err) {
            console.error(err);
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
            console.error(err);
        }
    };

    // The server renders the report (/api/export/workouts/pdf); it always covers
    // the full workout history, not the currently applied search filter.
    const handleExportPdf = async () => {
        try {
            await exportWorkoutsPdf();
        } catch (err) {
            console.error('Export failed', err);
        }
    };

    const handleClearSearch = () => {
        setSearchType('');
        setStartDate('');
        setEndDate('');
        setSearchTag('');
        setFiltered(false);
        fetchWorkouts();
    };

    const inputStyle = {
        '& .MuiOutlinedInput-root': { '& fieldset': { borderColor: theme.mix(0.2) } },
        '& .MuiInputLabel-root': { color: theme.mix(0.5) },
        '& .MuiInputBase-input': { color: theme.mix(1) },
        '& .MuiSelect-icon': { color: theme.mix(0.5) },
        mb: 2,
    };

    return (
        <Box sx={{ minHeight: '100vh', background: theme.bgGradient, fontFamily: "'Poppins', sans-serif" }}>
            <AppBar position="static" sx={{ background: theme.mix(0.05), backdropFilter: 'blur(10px)', boxShadow: 'none', borderBottom: `1px solid ${theme.mix(0.1)}` }}>
                <Toolbar>
                    <IconButton onClick={() => navigate('/dashboard')} sx={{ color: theme.mix(1), mr: 1 }}>
                        <ArrowBackIcon />
                    </IconButton>
                    <FitnessCenterIcon sx={{ color: '#e94560', mr: 1 }} />
                    <Typography variant="h6" sx={{ color: theme.mix(1), fontWeight: 700, fontFamily: "'Poppins', sans-serif" }}>
                        My Workouts
                    </Typography>
                </Toolbar>
            </AppBar>

            <Box sx={{ maxWidth: 800, mx: 'auto', py: 4, px: 2 }}>

                {/* Log Workout Form */}
                <Card sx={{ background: theme.mix(0.05), border: `1px solid ${theme.mix(0.1)}`, borderRadius: 3, mb: 4 }}>
                    <CardContent sx={{ p: 3 }}>
                        <Typography variant="h6" sx={{ color: theme.mix(1), fontWeight: 700, mb: 2, fontFamily: "'Poppins', sans-serif" }}>
                            Log New Workout
                        </Typography>
                        {error && <Typography sx={{ color: '#e94560', mb: 2 }}>{error}</Typography>}
                        {success && <Typography sx={{ color: '#4ecdc4', mb: 2 }}>{success}</Typography>}

                        {!userWeight && (
                            <Typography sx={{ color: '#ffa726', mb: 2, fontSize: '0.85rem', fontFamily: "'Poppins', sans-serif" }}>
                                ⚠️ Update your profile weight for accurate calorie calculation.
                            </Typography>
                        )}

                        <Box component="form" onSubmit={handleSubmit}>
                            <TextField select fullWidth label="Workout Type" value={form.type}
                                       onChange={(e) => setForm({ ...form, type: e.target.value })}
                                       required
                                       SelectProps={{ MenuProps: { PaperProps: { sx: { background: theme.menuBg, border: `1px solid ${theme.mix(0.1)}` } } } }}
                                       sx={{
                                           ...inputStyle,
                                           '& .MuiSelect-icon': { color: '#e94560' },
                                           '& .MuiSelect-select': { color: theme.mix(1) },
                                       }}>
                                {workoutTypes.map((type) => (
                                    <MenuItem key={type.label} value={type.label} sx={{
                                        color: theme.mix(1), backgroundColor: theme.menuBg,
                                        '&:hover': { backgroundColor: theme.mix(0.15) },
                                        '&.Mui-selected': { backgroundColor: '#0f3460' },
                                        '&.Mui-selected:hover': { backgroundColor: '#0f3460' }
                                    }}>
                                        {type.label}
                                    </MenuItem>
                                ))}
                            </TextField>

                            <TextField fullWidth label="Duration (minutes)" type="number" value={form.duration}
                                       onChange={(e) => setForm({ ...form, duration: e.target.value })}
                                       required sx={inputStyle}
                                       helperText={userWeight
                                           ? `Calories will be calculated automatically using your profile weight (${userWeight}kg).`
                                           : 'Update your profile weight for accurate calorie calculation.'}
                                       FormHelperTextProps={{ style: { color: theme.mix(0.4), fontFamily: "'Poppins', sans-serif" } }}
                            />

                            <TextField fullWidth label="Date" type="date" value={form.date}
                                       onChange={(e) => setForm({ ...form, date: e.target.value })}
                                       required
                                       InputLabelProps={{ shrink: true }}
                                       sx={{
                                           ...inputStyle,
                                           '& input[type="date"]::-webkit-datetime-edit': { color: form.date ? theme.mix(1) : 'transparent' },
                                           '& input[type="date"]::-webkit-calendar-picker-indicator': { filter: 'invert(1)' },
                                       }} />

                            <TextField fullWidth label="Notes (optional)" value={form.notes}
                                       onChange={(e) => setForm({ ...form, notes: e.target.value })}
                                       sx={inputStyle} multiline rows={2} />

                            <TextField fullWidth label="Tags (press Enter to add)" value={tagInput}
                                       onChange={(e) => setTagInput(e.target.value)}
                                       onKeyDown={(e) => {
                                           if (e.key === 'Enter') { e.preventDefault(); addTag(); }
                                       }}
                                       placeholder="e.g. morning, legs, cardio"
                                       sx={inputStyle} />

                            {form.tags.length > 0 && (
                                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mb: 2, mt: -1 }}>
                                    {form.tags.map((tag) => (
                                        <Chip key={tag} label={tag} onDelete={() => removeTag(tag)} size="small" sx={{
                                            background: 'rgba(78,205,196,0.15)', color: '#4ecdc4',
                                            fontFamily: "'Poppins', sans-serif",
                                            '& .MuiChip-deleteIcon': { color: '#4ecdc4' }
                                        }} />
                                    ))}
                                </Box>
                            )}

                            <Button fullWidth type="submit" variant="contained" sx={{
                                py: 1.5, borderRadius: 2, fontFamily: "'Poppins', sans-serif", fontWeight: 700,
                                background: 'linear-gradient(90deg, #e94560, #0f3460)',
                                '&:hover': { background: 'linear-gradient(90deg, #c73652, #0a2540)' }
                            }}>
                                Log Workout
                            </Button>
                        </Box>
                    </CardContent>
                </Card>

                {/* Search & Filter */}
                <Card sx={{ background: theme.mix(0.05), border: `1px solid ${theme.mix(0.1)}`, borderRadius: 3, mb: 3 }}>
                    <CardContent sx={{ p: 3 }}>
                        <Typography variant="h6" sx={{ color: theme.mix(1), fontWeight: 700, mb: 2, fontFamily: "'Poppins', sans-serif" }}>
                            Search & Filter
                        </Typography>
                        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2 }}>
                            <TextField select label="Workout Type" value={searchType}
                                       onChange={(e) => setSearchType(e.target.value)}
                                       sx={{ ...inputStyle, minWidth: 160 }}
                                       SelectProps={{ MenuProps: { PaperProps: { sx: { background: theme.menuBg, color: theme.mix(1) } } } }}>
                                <MenuItem value="" sx={{ color: theme.mix(1), backgroundColor: theme.menuBg }}>All Types</MenuItem>
                                {workoutTypes.map((type) => (
                                    <MenuItem key={type.label} value={type.label} sx={{
                                        color: theme.mix(1), backgroundColor: theme.menuBg,
                                        '&:hover': { backgroundColor: theme.mix(0.15) }
                                    }}>
                                        {type.label}
                                    </MenuItem>
                                ))}
                            </TextField>

                            <TextField label="Start Date" type="date" value={startDate}
                                       onChange={(e) => setStartDate(e.target.value)}
                                       InputLabelProps={{ shrink: true }}
                                       sx={{
                                           ...inputStyle,
                                           minWidth: 160,
                                           '& input[type="date"]::-webkit-datetime-edit': { color: startDate ? theme.mix(1) : 'transparent' },
                                           '& input[type="date"]::-webkit-calendar-picker-indicator': { filter: 'invert(1)' },
                                       }} />

                            <TextField label="End Date" type="date" value={endDate}
                                       onChange={(e) => setEndDate(e.target.value)}
                                       InputLabelProps={{ shrink: true }}
                                       sx={{
                                           ...inputStyle,
                                           minWidth: 160,
                                           '& input[type="date"]::-webkit-datetime-edit': { color: endDate ? theme.mix(1) : 'transparent' },
                                           '& input[type="date"]::-webkit-calendar-picker-indicator': { filter: 'invert(1)' },
                                       }} />

                            <TextField select label="Tag" value={searchTag}
                                       onChange={(e) => setSearchTag(e.target.value)}
                                       sx={{ ...inputStyle, minWidth: 160 }}
                                       SelectProps={{ MenuProps: { PaperProps: { sx: { background: theme.menuBg, color: theme.mix(1) } } } }}>
                                <MenuItem value="" sx={{ color: theme.mix(1), backgroundColor: theme.menuBg }}>All Tags</MenuItem>
                                {allTags.map((tag) => (
                                    <MenuItem key={tag} value={tag} sx={{
                                        color: theme.mix(1), backgroundColor: theme.menuBg,
                                        '&:hover': { backgroundColor: theme.mix(0.15) }
                                    }}>
                                        {tag}
                                    </MenuItem>
                                ))}
                            </TextField>

                            <Box sx={{ display: 'flex', gap: 1, alignItems: 'flex-start', mt: 0.5 }}>
                                <Button variant="contained" onClick={handleSearch}
                                        sx={{
                                            py: 1.5, px: 3, borderRadius: 2, fontFamily: "'Poppins', sans-serif", fontWeight: 700,
                                            background: 'linear-gradient(90deg, #e94560, #0f3460)',
                                            '&:hover': { background: 'linear-gradient(90deg, #c73652, #0a2540)' }
                                        }}>
                                    Search
                                </Button>
                                {filtered && (
                                    <Button variant="outlined" onClick={handleClearSearch}
                                            sx={{
                                                py: 1.5, px: 3, borderRadius: 2, fontFamily: "'Poppins', sans-serif",
                                                borderColor: theme.mix(0.3), color: theme.mix(0.7),
                                                '&:hover': { borderColor: theme.mix(1), color: theme.mix(1) }
                                            }}>
                                        Clear
                                    </Button>
                                )}
                            </Box>
                        </Box>
                    </CardContent>
                </Card>

                {/* Workout History */}
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                    <Typography variant="h6" sx={{ color: theme.mix(1), fontWeight: 700, fontFamily: "'Poppins', sans-serif" }}>
                        {filtered ? `Search Results (${workouts.length})` : 'Workout History'}
                    </Typography>
                    {workouts.length > 0 && (
                        <Button size="small" startIcon={<PictureAsPdfIcon />} onClick={handleExportPdf} sx={{
                            color: theme.mix(0.7), fontFamily: "'Poppins', sans-serif",
                            border: `1px solid ${theme.mix(0.15)}`, borderRadius: 2,
                            '&:hover': { border: `1px solid ${theme.mix(0.3)}`, color: theme.mix(1) }
                        }} title="Downloads your full workout history as a PDF">
                            Export PDF
                        </Button>
                    )}
                </Box>
                {workouts.length === 0 ? (
                    <Typography sx={{ color: theme.mix(0.5), textAlign: 'center', mt: 2 }}>
                        {filtered ? 'No workouts found for selected filters.' : 'No workouts logged yet. Start by logging one above!'}
                    </Typography>
                ) : (
                    workouts.map((workout) => (
                        <Card key={workout.id} sx={{
                            background: theme.mix(0.05), border: `1px solid ${theme.mix(0.1)}`,
                            borderRadius: 3, mb: 2,
                            '&:hover': { border: '1px solid rgba(233,69,96,0.5)' }
                        }}>
                            <CardContent sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <Box>
                                    <Typography sx={{ color: theme.mix(1), fontWeight: 700, fontFamily: "'Poppins', sans-serif" }}>
                                        {workout.type}
                                    </Typography>
                                    <Typography sx={{ color: theme.mix(0.5), fontSize: '0.85rem', fontFamily: "'Poppins', sans-serif" }}>
                                        {workout.duration} mins • {workout.caloriesBurned} kcal • {workout.date}
                                    </Typography>
                                    {workout.notes && (
                                        <Typography sx={{ color: theme.mix(0.3), fontSize: '0.8rem', mt: 0.5 }}>
                                            {workout.notes}
                                        </Typography>
                                    )}
                                    {workout.tags && workout.tags.length > 0 && (
                                        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5, mt: 1 }}>
                                            {workout.tags.map((tag) => (
                                                <Chip key={tag} label={tag} size="small" sx={{
                                                    background: 'rgba(78,205,196,0.15)', color: '#4ecdc4',
                                                    fontSize: '0.7rem', height: 20, fontFamily: "'Poppins', sans-serif"
                                                }} />
                                            ))}
                                        </Box>
                                    )}
                                </Box>
                                <IconButton onClick={() => handleDelete(workout.id)} sx={{ color: '#e94560' }}>
                                    <DeleteIcon />
                                </IconButton>
                            </CardContent>
                        </Card>
                    ))
                )}
            </Box>
        </Box>
    );
}

export default Workouts;