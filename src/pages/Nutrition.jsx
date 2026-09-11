import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import API from '../services/api';
import { useAppTheme } from '../context/ThemeContext';
import {
    Box, Typography, AppBar, Toolbar, IconButton,
    Card, CardContent, Chip, Alert
} from '@mui/material';
import RestaurantIcon from '@mui/icons-material/Restaurant';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import BreakfastDiningIcon from '@mui/icons-material/BreakfastDining';
import LunchDiningIcon from '@mui/icons-material/LunchDining';
import DinnerDiningIcon from '@mui/icons-material/DinnerDining';
import LocalCafeIcon from '@mui/icons-material/LocalCafe';

const goalTypeColors = {
    LOSE_WEIGHT: '#e94560',
    GAIN_WEIGHT: '#ff6b35',
    BUILD_STRENGTH: '#4ecdc4',
    RUN_MORE: '#45b7d1',
    STAY_ACTIVE: '#a29bfe',
};

const goalTypeLabels = {
    LOSE_WEIGHT: 'Lose Weight',
    GAIN_WEIGHT: 'Gain Weight',
    BUILD_STRENGTH: 'Build Strength',
    RUN_MORE: 'Run More',
    STAY_ACTIVE: 'Stay Active',
};

function Nutrition() {
    const { theme } = useAppTheme();
    const [goals, setGoals] = useState([]);
    const [selectedGoalType, setSelectedGoalType] = useState(null);
    const [nutrition, setNutrition] = useState(null);
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();

    useEffect(() => {
        fetchGoals();
    }, []);

    const fetchGoals = async () => {
        try {
            const res = await API.get('/goals');
            const activeGoals = res.data.filter(g => g.status === 'IN_PROGRESS');
            setGoals(activeGoals);
            if (activeGoals.length > 0) {
                fetchNutrition(activeGoals[0].goalType);
                setSelectedGoalType(activeGoals[0].goalType);
            }
        } catch (err) {
            console.error(err);
        }
    };

    const fetchNutrition = async (goalType) => {
        setLoading(true);
        try {
            const res = await API.get(`/nutrition/${goalType}`);
            setNutrition(res.data);
            setSelectedGoalType(goalType);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const MealSection = ({ title, icon, items, color }) => (
        <Card sx={{
            background: theme.mix(0.05),
            border: `1px solid ${color}44`,
            borderRadius: 3, mb: 2
        }}>
            <CardContent sx={{ p: 3 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                    {icon}
                    <Typography sx={{ color: theme.mix(1), fontWeight: 700, fontFamily: "'Poppins', sans-serif" }}>
                        {title}
                    </Typography>
                </Box>
                {items && items.map((item, index) => (
                    <Box key={index} sx={{
                        display: 'flex', justifyContent: 'space-between',
                        alignItems: 'center', mb: 1,
                        p: 1.5, borderRadius: 2,
                        background: theme.mix(0.03),
                        border: `1px solid ${theme.mix(0.05)}`
                    }}>
                        <Typography sx={{ color: theme.mix(0.8), fontFamily: "'Poppins', sans-serif", fontSize: '0.9rem' }}>
                            {item.food}
                        </Typography>
                        <Chip label={`${item.calories} kcal`} size="small" sx={{
                            background: `${color}33`, color: color,
                            fontWeight: 600, fontSize: '0.75rem'
                        }} />
                    </Box>
                ))}
            </CardContent>
        </Card>
    );

    return (
        <Box sx={{ minHeight: '100vh', background: theme.bgGradient, fontFamily: "'Poppins', sans-serif" }}>
            <AppBar position="static" sx={{ background: theme.mix(0.05), backdropFilter: 'blur(10px)', boxShadow: 'none', borderBottom: `1px solid ${theme.mix(0.1)}` }}>
                <Toolbar>
                    <IconButton onClick={() => navigate('/dashboard')} sx={{ color: theme.mix(1), mr: 1 }}>
                        <ArrowBackIcon />
                    </IconButton>
                    <RestaurantIcon sx={{ color: '#ff6b35', mr: 1 }} />
                    <Typography variant="h6" sx={{ color: theme.mix(1), fontWeight: 700, fontFamily: "'Poppins', sans-serif" }}>
                        Nutrition Guide
                    </Typography>
                </Toolbar>
            </AppBar>

            <Box sx={{ maxWidth: 800, mx: 'auto', py: 4, px: 2 }}>

                {goals.length === 0 ? (
                    <Alert severity="info" sx={{ mb: 3 }}>
                        No active goals found. Add a goal first to get your personalized nutrition plan!
                    </Alert>
                ) : (
                    <>
                        {/* Goal Type Selector */}
                        <Typography sx={{ color: theme.mix(0.7), mb: 1, fontFamily: "'Poppins', sans-serif" }}>
                            Select your goal to see nutrition plan:
                        </Typography>
                        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mb: 3 }}>
                            {goals.map((goal) => (
                                <Chip
                                    key={goal.id}
                                    label={goalTypeLabels[goal.goalType] || goal.goalType}
                                    onClick={() => fetchNutrition(goal.goalType)}
                                    sx={{
                                        background: selectedGoalType === goal.goalType
                                            ? goalTypeColors[goal.goalType]
                                            : theme.mix(0.1),
                                        color: theme.mix(1),
                                        fontWeight: 600,
                                        cursor: 'pointer',
                                        fontFamily: "'Poppins', sans-serif",
                                        '&:hover': { background: goalTypeColors[goal.goalType] }
                                    }}
                                />
                            ))}
                        </Box>
                    </>
                )}

                {nutrition && !loading && (
                    <>
                        {/* Summary Card */}
                        <Card sx={{
                            background: `${goalTypeColors[selectedGoalType]}22`,
                            border: `1px solid ${goalTypeColors[selectedGoalType]}44`,
                            borderRadius: 3, mb: 3
                        }}>
                            <CardContent sx={{ p: 3 }}>
                                <Typography variant="h6" sx={{ color: theme.mix(1), fontWeight: 700, mb: 2, fontFamily: "'Poppins', sans-serif" }}>
                                    Daily Targets
                                </Typography>
                                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2, mb: 2 }}>
                                    {[
                                        { label: 'Daily Calories', value: `${nutrition.dailyCalories} kcal`, color: '#e94560' },
                                        { label: 'Protein', value: nutrition.protein, color: '#4ecdc4' },
                                        { label: 'Carbs', value: nutrition.carbs, color: '#ff6b35' },
                                        { label: 'Fats', value: nutrition.fats, color: '#a29bfe' },
                                    ].map((item, index) => (
                                        <Box key={index} sx={{
                                            p: 1.5, borderRadius: 2,
                                            background: theme.mix(0.05),
                                            border: `1px solid ${theme.mix(0.1)}`,
                                            minWidth: 120, textAlign: 'center'
                                        }}>
                                            <Typography sx={{ color: theme.mix(0.5), fontSize: '0.75rem', fontFamily: "'Poppins', sans-serif" }}>
                                                {item.label}
                                            </Typography>
                                            <Typography sx={{ color: item.color, fontWeight: 700, fontFamily: "'Poppins', sans-serif" }}>
                                                {item.value}
                                            </Typography>
                                        </Box>
                                    ))}
                                </Box>
                                <Alert severity="info" sx={{ background: theme.mix(0.05), color: theme.mix(0.8) }}>
                                    💡 {nutrition.tip}
                                </Alert>
                            </CardContent>
                        </Card>

                        {/* Meal Sections */}
                        <MealSection
                            title="Breakfast"
                            icon={<BreakfastDiningIcon sx={{ color: '#ff6b35' }} />}
                            items={nutrition.breakfast}
                            color="#ff6b35"
                        />
                        <MealSection
                            title="Lunch"
                            icon={<LunchDiningIcon sx={{ color: '#4ecdc4' }} />}
                            items={nutrition.lunch}
                            color="#4ecdc4"
                        />
                        <MealSection
                            title="Dinner"
                            icon={<DinnerDiningIcon sx={{ color: '#a29bfe' }} />}
                            items={nutrition.dinner}
                            color="#a29bfe"
                        />
                        <MealSection
                            title="Snacks"
                            icon={<LocalCafeIcon sx={{ color: '#45b7d1' }} />}
                            items={nutrition.snacks}
                            color="#45b7d1"
                        />
                    </>
                )}
            </Box>
        </Box>
    );
}

export default Nutrition;