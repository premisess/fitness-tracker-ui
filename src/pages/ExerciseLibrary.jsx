import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import API from '../services/api';
import { useAppTheme } from '../context/ThemeContext';
import {
    Box, Typography, AppBar, Toolbar, IconButton,
    Card, CardContent, TextField, Chip,
    InputAdornment, Button, Alert
} from '@mui/material';
import FitnessCenterIcon from '@mui/icons-material/FitnessCenter';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import SearchIcon from '@mui/icons-material/Search';
import AddIcon from '@mui/icons-material/Add';
import ExerciseAnimation from '../components/ExerciseAnimation';

const categoryColors = {
    'Abs': '#e94560',
    'Arms': '#ff6b35',
    'Back': '#4ecdc4',
    'Calves': '#45b7d1',
    'Chest': '#a29bfe',
    'Legs': '#ffa726',
    'Shoulders': '#4ecdc4',
};

const goalRecommendations = {
    LOSE_WEIGHT: { repsOrTime: '3 sets × 20 reps', duration: 15, intensity: 'High', tip: 'Minimal rest between sets (30 sec)' },
    BUILD_STRENGTH: { repsOrTime: '5 sets × 8 reps', duration: 20, intensity: 'Very High', tip: 'Rest 2-3 minutes between sets' },
    RUN_MORE: { repsOrTime: '2 sets × 15 reps', duration: 10, intensity: 'Moderate', tip: 'Use as warm-up before running' },
    GAIN_WEIGHT: { repsOrTime: '4 sets × 12 reps', duration: 18, intensity: 'High', tip: 'Rest 90 seconds between sets' },
    STAY_ACTIVE: { repsOrTime: '3 sets × 15 reps', duration: 12, intensity: 'Moderate', tip: 'Focus on form over speed' },
};

const cardioRecommendations = {
    LOSE_WEIGHT: { repsOrTime: '45 min cardio', duration: 45, intensity: 'High', tip: 'Keep heart rate at 70-80% max' },
    BUILD_STRENGTH: { repsOrTime: '10 min warmup', duration: 10, intensity: 'Low', tip: 'Use as warmup only' },
    RUN_MORE: { repsOrTime: '60 min run', duration: 60, intensity: 'High', tip: 'Maintain steady pace throughout' },
    GAIN_WEIGHT: { repsOrTime: '20 min light cardio', duration: 20, intensity: 'Low', tip: 'Keep cardio minimal to preserve calories' },
    STAY_ACTIVE: { repsOrTime: '30 min cardio', duration: 30, intensity: 'Moderate', tip: 'Any pace is fine, just keep moving' },
};

const exercises = [
    { id: 1, name: 'Push Ups', category: 'Chest', muscles: 'Chest, Triceps, Shoulders', equipment: 'None', type: 'strength', instructions: 'Start in plank position. Lower your body until chest nearly touches floor. Push back up. Keep core tight throughout.' },
    { id: 2, name: 'Pull Ups', category: 'Back', muscles: 'Back, Biceps', equipment: 'Pull-up Bar', type: 'strength', instructions: 'Hang from bar with palms facing away. Pull yourself up until chin is above bar. Lower slowly.' },
    { id: 3, name: 'Squats', category: 'Legs', muscles: 'Quadriceps, Hamstrings, Glutes', equipment: 'None', type: 'strength', instructions: 'Stand feet shoulder-width apart. Lower hips until thighs are parallel to floor. Keep chest up and return to standing.' },
    { id: 4, name: 'Deadlift', category: 'Back', muscles: 'Lower Back, Hamstrings, Glutes', equipment: 'Barbell', type: 'strength', instructions: 'Stand over barbell, grip it, keep back straight and lift by extending hips and knees simultaneously.' },
    { id: 5, name: 'Bench Press', category: 'Chest', muscles: 'Chest, Triceps, Shoulders', equipment: 'Barbell, Bench', type: 'strength', instructions: 'Lie on bench, lower bar to chest slowly, press back up explosively.' },
    { id: 6, name: 'Plank', category: 'Abs', muscles: 'Core, Abs', equipment: 'None', type: 'strength', instructions: 'Hold push-up position with forearms on ground. Keep body perfectly straight. Breathe steadily.' },
    { id: 7, name: 'Lunges', category: 'Legs', muscles: 'Quadriceps, Hamstrings, Glutes', equipment: 'None', type: 'strength', instructions: 'Step forward with one leg, lower hips until both knees are at 90 degrees. Return and switch legs.' },
    { id: 8, name: 'Bicep Curls', category: 'Arms', muscles: 'Biceps', equipment: 'Dumbbells', type: 'strength', instructions: 'Hold dumbbells at sides, curl up to shoulders keeping elbows close to body. Lower slowly.' },
    { id: 9, name: 'Tricep Dips', category: 'Arms', muscles: 'Triceps', equipment: 'Bench or Chair', type: 'strength', instructions: 'Place hands on bench behind you, lower body by bending elbows to 90 degrees, push back up.' },
    { id: 10, name: 'Shoulder Press', category: 'Shoulders', muscles: 'Shoulders, Triceps', equipment: 'Dumbbells', type: 'strength', instructions: 'Hold dumbbells at shoulder height, press overhead until arms are fully extended, lower slowly.' },
    { id: 11, name: 'Calf Raises', category: 'Calves', muscles: 'Calves', equipment: 'None', type: 'strength', instructions: 'Stand on edge of step, raise heels as high as possible, hold briefly, lower slowly below step level.' },
    { id: 12, name: 'Sit Ups', category: 'Abs', muscles: 'Abs, Hip Flexors', equipment: 'None', type: 'strength', instructions: 'Lie on back with knees bent, sit up bringing chest to knees, lower slowly with control.' },
    { id: 13, name: 'Mountain Climbers', category: 'Abs', muscles: 'Core, Shoulders, Legs', equipment: 'None', type: 'cardio', instructions: 'In plank position, alternate driving knees toward chest rapidly. Keep hips level.' },
    { id: 14, name: 'Burpees', category: 'Legs', muscles: 'Full Body', equipment: 'None', type: 'cardio', instructions: 'Drop to squat, kick feet back to plank, do push-up, jump feet forward, jump up with arms overhead.' },
    { id: 15, name: 'Dumbbell Rows', category: 'Back', muscles: 'Back, Biceps', equipment: 'Dumbbells', type: 'strength', instructions: 'Bend forward with one hand on bench, pull dumbbell to hip keeping elbow close to body.' },
    { id: 16, name: 'Leg Press', category: 'Legs', muscles: 'Quadriceps, Hamstrings, Glutes', equipment: 'Leg Press Machine', type: 'strength', instructions: 'Sit in machine, place feet on platform shoulder-width, push until legs are extended, lower slowly.' },
    { id: 17, name: 'Lateral Raises', category: 'Shoulders', muscles: 'Shoulders', equipment: 'Dumbbells', type: 'strength', instructions: 'Hold dumbbells at sides, raise arms to shoulder height keeping slight bend in elbows, lower slowly.' },
    { id: 18, name: 'Russian Twists', category: 'Abs', muscles: 'Obliques, Core', equipment: 'None', type: 'strength', instructions: 'Sit with knees bent, lean back slightly at 45 degrees, twist torso side to side touching floor.' },
    { id: 19, name: 'Jump Rope', category: 'Calves', muscles: 'Calves, Shoulders, Core', equipment: 'Jump Rope', type: 'cardio', instructions: 'Jump over rope as it swings under feet. Keep elbows close to body. Start slow and increase speed.' },
    { id: 20, name: 'Box Jumps', category: 'Legs', muscles: 'Quadriceps, Glutes, Calves', equipment: 'Box', type: 'cardio', instructions: 'Stand before box, bend knees, jump explosively onto box landing softly, step back down carefully.' },
    { id: 21, name: 'Hammer Curls', category: 'Arms', muscles: 'Biceps, Forearms', equipment: 'Dumbbells', type: 'strength', instructions: 'Hold dumbbells with neutral grip thumbs up, curl up keeping thumbs facing ceiling throughout.' },
    { id: 22, name: 'Cable Rows', category: 'Back', muscles: 'Back, Biceps', equipment: 'Cable Machine', type: 'strength', instructions: 'Sit at cable row machine, pull handle to abdomen keeping back straight and chest tall.' },
    { id: 23, name: 'Incline Push Ups', category: 'Chest', muscles: 'Upper Chest, Triceps', equipment: 'Bench', type: 'strength', instructions: 'Place hands on elevated surface, perform push up at an incline targeting upper chest.' },
    { id: 24, name: 'Glute Bridges', category: 'Legs', muscles: 'Glutes, Hamstrings', equipment: 'None', type: 'strength', instructions: 'Lie on back feet flat on floor hip-width, push hips up squeezing glutes hard at top, lower slowly.' },
    { id: 25, name: 'Face Pulls', category: 'Shoulders', muscles: 'Rear Deltoids, Traps', equipment: 'Cable Machine', type: 'strength', instructions: 'Pull cable attachment toward face at eye level, flaring elbows out to sides, squeeze at peak.' },
    { id: 26, name: 'Leg Raises', category: 'Abs', muscles: 'Lower Abs, Hip Flexors', equipment: 'None', type: 'strength', instructions: 'Lie flat, raise legs to 90 degrees keeping them straight and together, lower slowly without touching floor.' },
    { id: 27, name: 'Arnold Press', category: 'Shoulders', muscles: 'Shoulders, Triceps', equipment: 'Dumbbells', type: 'strength', instructions: 'Start with palms facing you at chin height, rotate outward and press overhead, reverse on the way down.' },
    { id: 28, name: 'Skull Crushers', category: 'Arms', muscles: 'Triceps', equipment: 'Barbell or Dumbbells', type: 'strength', instructions: 'Lie on bench, lower weight toward forehead by bending elbows only, extend arms back up.' },
    { id: 29, name: 'Step Ups', category: 'Legs', muscles: 'Quadriceps, Glutes', equipment: 'Box or Step', type: 'strength', instructions: 'Step onto box one foot at a time leading with same foot each rep, step back down and switch.' },
    { id: 30, name: 'Superman', category: 'Back', muscles: 'Lower Back, Glutes', equipment: 'None', type: 'strength', instructions: 'Lie face down arms extended, raise arms and legs simultaneously off ground, hold 2 seconds, lower.' },
];

const categories = ['All', 'Abs', 'Arms', 'Back', 'Calves', 'Chest', 'Legs', 'Shoulders'];

function ExerciseLibrary() {
    const { theme } = useAppTheme();
    const [selectedCategory, setSelectedCategory] = useState('All');
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedExercise, setSelectedExercise] = useState(null);
    const [activeGoalType, setActiveGoalType] = useState(null);
    const [logSuccess, setLogSuccess] = useState('');
    const navigate = useNavigate();

    const fetchActiveGoal = async () => {
        try {
            const res = await API.get('/goals');
            const activeGoal = res.data.find(g => g.status === 'IN_PROGRESS' && g.autoTrack);
            if (activeGoal) setActiveGoalType(activeGoal.goalType);
        } catch (err) {
            console.error(err);
        }
    };

    useEffect(() => {
        fetchActiveGoal();
    }, []);

    const getRecommendation = (exercise) => {
        if (!activeGoalType) return null;
        if (exercise.type === 'cardio') return cardioRecommendations[activeGoalType];
        return goalRecommendations[activeGoalType];
    };

    const handleLogWorkout = async (exercise) => {
        const rec = getRecommendation(exercise);
        const duration = rec?.duration || 20;
        const today = new Date().toISOString().split('T')[0];

        try {
            await API.post('/workouts', {
                type: exercise.type === 'cardio' ? 'Running' : 'Weightlifting',
                duration,
                date: today,
                notes: `${exercise.name} - ${rec?.repsOrTime || duration + ' min'}`
            });

            setLogSuccess(`${exercise.name} logged successfully! Goals updated.`);
            setTimeout(() => setLogSuccess(''), 3000);
        } catch (err) {
            console.error(err);
        }
    };

    const filteredExercises = exercises.filter(ex => {
        const matchesCategory = selectedCategory === 'All' || ex.category === selectedCategory;
        const matchesSearch = ex.name.toLowerCase().includes(searchTerm.toLowerCase());
        return matchesCategory && matchesSearch;
    });

    const inputStyle = {
        '& .MuiOutlinedInput-root': { '& fieldset': { borderColor: theme.mix(0.2) } },
        '& .MuiInputBase-input': { color: theme.mix(1) },
    };

    const intensityColor = (intensity) => {
        if (intensity === 'Very High') return '#e94560';
        if (intensity === 'High') return '#ff6b35';
        if (intensity === 'Moderate') return '#ffa726';
        return '#4ecdc4';
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
                        Exercise Library
                    </Typography>
                    {activeGoalType && (
                        <Chip label={`Goal: ${activeGoalType.replace('_', ' ')}`} size="small"
                              sx={{ ml: 2, background: '#e94560', color: theme.mix(1), fontFamily: "'Poppins', sans-serif" }} />
                    )}
                </Toolbar>
            </AppBar>

            <Box sx={{ background: theme.bgGradient, minHeight: '100vh', py: 4, px: 2 }}>
                <Box sx={{ maxWidth: 900, mx: 'auto' }}>

                    {logSuccess && (
                        <Alert severity="success" sx={{ mb: 2 }}>{logSuccess}</Alert>
                    )}

                    {!activeGoalType && (
                        <Alert severity="info" sx={{ mb: 3 }}>
                            Set a goal first to get personalized exercise recommendations!
                            <Button size="small" onClick={() => navigate('/goals')} sx={{ ml: 1, color: theme.mix(1) }}>
                                Set Goal
                            </Button>
                        </Alert>
                    )}

                    {/* Search */}
                    <TextField fullWidth placeholder="Search exercises..." value={searchTerm}
                               onChange={(e) => setSearchTerm(e.target.value)}
                               sx={{ ...inputStyle, mb: 3 }}
                               slotProps={{
                                   input: {
                                       startAdornment: (
                                           <InputAdornment position="start">
                                               <SearchIcon sx={{ color: theme.mix(0.5) }} />
                                           </InputAdornment>
                                       )
                                   }
                               }} />

                    {/* Categories */}
                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mb: 3 }}>
                        {categories.map((cat) => (
                            <Chip key={cat} label={cat}
                                  onClick={() => setSelectedCategory(cat)}
                                  sx={{
                                      background: selectedCategory === cat
                                          ? (categoryColors[cat] || '#e94560')
                                          : theme.mix(0.1),
                                      color: theme.mix(1), fontWeight: 600, cursor: 'pointer',
                                      fontFamily: "'Poppins', sans-serif",
                                      '&:hover': { background: categoryColors[cat] || '#e94560' }
                                  }} />
                        ))}
                    </Box>

                    {/* Exercise Detail */}
                    {selectedExercise && (
                        <Card sx={{
                            background: theme.mix(0.08),
                            border: `1px solid ${categoryColors[selectedExercise.category] || '#e94560'}`,
                            borderRadius: 3, mb: 3
                        }}>
                            <CardContent sx={{ p: 3 }}>
                                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                                    <Typography variant="h6" sx={{ color: theme.mix(1), fontWeight: 700, fontFamily: "'Poppins', sans-serif", mb: 1 }}>
                                        {selectedExercise.name}
                                    </Typography>
                                    <IconButton onClick={() => setSelectedExercise(null)} sx={{ color: '#e94560' }}>
                                        ✕
                                    </IconButton>
                                </Box>

                                <Box sx={{
                                    display: 'flex', justifyContent: 'center', alignItems: 'center',
                                    py: 2, mb: 2, borderRadius: 2,
                                    background: theme.mix(0.03), border: `1px solid ${theme.mix(0.08)}`
                                }}>
                                    <ExerciseAnimation exercise={selectedExercise}
                                                        color={categoryColors[selectedExercise.category] || '#e94560'}
                                                        size={130} />
                                </Box>

                                <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', mb: 2 }}>
                                    <Chip label={selectedExercise.category} size="small"
                                          sx={{ background: categoryColors[selectedExercise.category] || '#e94560', color: theme.mix(1) }} />
                                    <Chip label={selectedExercise.type} size="small"
                                          sx={{ background: theme.mix(0.1), color: theme.mix(1) }} />
                                </Box>

                                <Box sx={{ mb: 1 }}>
                                    <Typography sx={{ color: theme.mix(0.5), fontSize: '0.8rem', mb: 0.5 }}>Muscles:</Typography>
                                    <Typography sx={{ color: '#4ecdc4', fontFamily: "'Poppins', sans-serif", fontSize: '0.9rem' }}>
                                        {selectedExercise.muscles}
                                    </Typography>
                                </Box>

                                <Box sx={{ mb: 1 }}>
                                    <Typography sx={{ color: theme.mix(0.5), fontSize: '0.8rem', mb: 0.5 }}>Equipment:</Typography>
                                    <Typography sx={{ color: '#ff6b35', fontFamily: "'Poppins', sans-serif", fontSize: '0.9rem' }}>
                                        {selectedExercise.equipment}
                                    </Typography>
                                </Box>

                                <Box sx={{ mb: 2 }}>
                                    <Typography sx={{ color: theme.mix(0.5), fontSize: '0.8rem', mb: 0.5 }}>Instructions:</Typography>
                                    <Typography sx={{ color: theme.mix(0.8), fontSize: '0.85rem', fontFamily: "'Poppins', sans-serif", lineHeight: 1.6 }}>
                                        {selectedExercise.instructions}
                                    </Typography>
                                </Box>

                                {/* Goal Recommendation */}
                                {activeGoalType && getRecommendation(selectedExercise) && (
                                    <Box sx={{
                                        p: 2, borderRadius: 2, mb: 2,
                                        background: 'rgba(78,205,196,0.1)',
                                        border: '1px solid rgba(78,205,196,0.3)'
                                    }}>
                                        <Typography sx={{ color: '#4ecdc4', fontWeight: 700, mb: 1, fontFamily: "'Poppins', sans-serif", fontSize: '0.9rem' }}>
                                            Recommended for your goal:
                                        </Typography>
                                        <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
                                            <Box>
                                                <Typography sx={{ color: theme.mix(0.5), fontSize: '0.75rem' }}>Reps/Time</Typography>
                                                <Typography sx={{ color: theme.mix(1), fontWeight: 700, fontFamily: "'Poppins', sans-serif" }}>
                                                    {getRecommendation(selectedExercise).repsOrTime}
                                                </Typography>
                                            </Box>
                                            <Box>
                                                <Typography sx={{ color: theme.mix(0.5), fontSize: '0.75rem' }}>Duration</Typography>
                                                <Typography sx={{ color: theme.mix(1), fontWeight: 700, fontFamily: "'Poppins', sans-serif" }}>
                                                    {getRecommendation(selectedExercise).duration} min
                                                </Typography>
                                            </Box>
                                            <Box>
                                                <Typography sx={{ color: theme.mix(0.5), fontSize: '0.75rem' }}>Intensity</Typography>
                                                <Typography sx={{ color: intensityColor(getRecommendation(selectedExercise).intensity), fontWeight: 700 }}>
                                                    {getRecommendation(selectedExercise).intensity}
                                                </Typography>
                                            </Box>
                                        </Box>
                                        <Typography sx={{ color: theme.mix(0.6), fontSize: '0.8rem', mt: 1, fontStyle: 'italic' }}>
                                            💡 {getRecommendation(selectedExercise).tip}
                                        </Typography>
                                    </Box>
                                )}

                                {/* Log This Workout Button */}
                                <Button fullWidth variant="contained"
                                        startIcon={<AddIcon />}
                                        onClick={() => handleLogWorkout(selectedExercise)}
                                        sx={{
                                            py: 1.5, borderRadius: 2, fontFamily: "'Poppins', sans-serif", fontWeight: 700,
                                            background: 'linear-gradient(90deg, #e94560, #0f3460)',
                                            '&:hover': { background: 'linear-gradient(90deg, #c73652, #0a2540)' }
                                        }}>
                                    Log This Workout & Update Goals
                                </Button>
                            </CardContent>
                        </Card>
                    )}

                    {/* Count */}
                    <Typography sx={{ color: theme.mix(0.5), mb: 2, fontFamily: "'Poppins', sans-serif", fontSize: '0.85rem' }}>
                        {filteredExercises.length} exercises found
                    </Typography>

                    {/* Exercise List */}
                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2 }}>
                        {filteredExercises.map((exercise) => {
                            const rec = getRecommendation(exercise);
                            return (
                                <Box key={exercise.id} sx={{ width: { xs: '100%', sm: 'calc(50% - 8px)', md: 'calc(33% - 8px)' } }}>
                                    <Card onClick={() => setSelectedExercise(exercise)}
                                          sx={{
                                              background: theme.mix(0.05),
                                              border: selectedExercise?.id === exercise.id
                                                  ? `1px solid ${categoryColors[exercise.category] || '#e94560'}`
                                                  : `1px solid ${theme.mix(0.1)}`,
                                              borderRadius: 3, cursor: 'pointer',
                                              transition: 'all 0.2s',
                                              '&:hover': {
                                                  border: `1px solid ${categoryColors[exercise.category] || '#e94560'}`,
                                                  transform: 'translateY(-3px)'
                                              }
                                          }}>
                                        <CardContent sx={{ p: 2 }}>
                                            <ExerciseAnimation exercise={exercise}
                                                                color={categoryColors[exercise.category] || '#4ecdc4'}
                                                                size={64} />
                                            <Typography sx={{
                                                color: theme.mix(1), fontWeight: 600,
                                                fontFamily: "'Poppins', sans-serif",
                                                fontSize: '0.9rem', mb: 0.5, mt: 1, textAlign: 'center'
                                            }}>
                                                {exercise.name}
                                            </Typography>
                                            <Chip label={exercise.category} size="small" sx={{
                                                background: categoryColors[exercise.category] || '#4ecdc4',
                                                color: theme.mix(1), fontSize: '0.7rem', mb: 0.5
                                            }} />
                                            <Typography sx={{ color: theme.mix(0.4), fontSize: '0.75rem', fontFamily: "'Poppins', sans-serif" }}>
                                                {exercise.muscles}
                                            </Typography>
                                            {rec && (
                                                <Typography sx={{ color: '#4ecdc4', fontSize: '0.75rem', mt: 0.5, fontFamily: "'Poppins', sans-serif" }}>
                                                    {rec.repsOrTime}
                                                </Typography>
                                            )}
                                        </CardContent>
                                    </Card>
                                </Box>
                            );
                        })}
                    </Box>
                </Box>
            </Box>
        </Box>
    );
}

export default ExerciseLibrary;