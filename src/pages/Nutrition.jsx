import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    Chart as ChartJS, BarController, BarElement, CategoryScale, Legend, LinearScale, LineController, LineElement,
    PointElement, Tooltip,
} from 'chart.js';
import { Chart } from 'react-chartjs-2';
import {
    Alert, AppBar, Box, Button, Card, CardContent, Chip, CircularProgress, IconButton, LinearProgress, Tab, Tabs,
    Toolbar, Typography,
} from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import RestaurantIcon from '@mui/icons-material/Restaurant';
import BreakfastDiningIcon from '@mui/icons-material/BreakfastDining';
import LunchDiningIcon from '@mui/icons-material/LunchDining';
import DinnerDiningIcon from '@mui/icons-material/DinnerDining';
import LocalCafeIcon from '@mui/icons-material/LocalCafe';
import ChevronLeftIcon from '@mui/icons-material/ChevronLeft';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import AddIcon from '@mui/icons-material/Add';
import DeleteIcon from '@mui/icons-material/Delete';
import LocalFireDepartmentIcon from '@mui/icons-material/LocalFireDepartment';
import WaterDropIcon from '@mui/icons-material/WaterDrop';
import API from '../services/api';
import { errorMessage } from '../services/errors';
import { useAppTheme } from '../context/ThemeContext';
import AddFoodDialog from '../components/AddFoodDialog';
import Blobs from '../components/Glass';
import { FONT, glassCard, sectionTitle, stickyHeader } from '../theme/styles';

ChartJS.register(BarController, BarElement, CategoryScale, LineController, LineElement, LinearScale, PointElement, Tooltip, Legend);

const MEALS = [
    { key: 'BREAKFAST', label: 'Breakfast', icon: BreakfastDiningIcon, color: '#ff6b35' },
    { key: 'LUNCH', label: 'Lunch', icon: LunchDiningIcon, color: '#4ecdc4' },
    { key: 'DINNER', label: 'Dinner', icon: DinnerDiningIcon, color: '#a29bfe' },
    { key: 'SNACK', label: 'Snacks', icon: LocalCafeIcon, color: '#45b7d1' },
];

const MACROS = [
    { key: 'proteinG', label: 'Protein', color: '#4ecdc4' },
    { key: 'carbsG', label: 'Carbs', color: '#ffa726' },
    { key: 'fatG', label: 'Fat', color: '#a29bfe' },
];

const GOAL_COLORS = {
    LOSE_WEIGHT: '#e94560',
    GAIN_WEIGHT: '#ff6b35',
    BUILD_STRENGTH: '#4ecdc4',
    RUN_MORE: '#45b7d1',
    STAY_ACTIVE: '#a29bfe',
};

const GOAL_LABELS = {
    LOSE_WEIGHT: 'Lose Weight',
    GAIN_WEIGHT: 'Gain Weight',
    BUILD_STRENGTH: 'Build Strength',
    RUN_MORE: 'Run More',
    STAY_ACTIVE: 'Stay Active',
};

// Dates are handled in the user's own timezone, not UTC, so "today" matches their day.
const isoDate = (date) => new Date(date.getTime() - date.getTimezoneOffset() * 60000).toISOString().slice(0, 10);
const today = () => isoDate(new Date());
const shiftDate = (iso, days) => {
    const date = new Date(`${iso}T12:00:00`);
    date.setDate(date.getDate() + days);
    return isoDate(date);
};
const dateLabel = (iso) => {
    if (iso === today()) return 'Today';
    if (iso === shiftDate(today(), -1)) return 'Yesterday';
    return new Date(`${iso}T12:00:00`).toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' });
};
const round = (value) => Math.round(value * 10) / 10;
const kcal = (value) => Math.round(value).toLocaleString();
const servingsLabel = (servings) => (Number.isInteger(servings) ? servings : Number(servings.toFixed(2)));

function CalorieRing({ eaten, target, theme }) {
    const size = 170;
    const stroke = 14;
    const radius = (size - stroke) / 2;
    const circumference = 2 * Math.PI * radius;
    const ratio = target > 0 ? eaten / target : 0;
    const over = ratio > 1;
    const color = over ? '#e94560' : '#4ecdc4';

    return (
        <Box sx={{ position: 'relative', width: size, height: size, flexShrink: 0 }}>
            <svg width={size} height={size} style={{ transform: 'rotate(-90deg)' }}>
                <circle cx={size / 2} cy={size / 2} r={radius} fill="none" stroke={theme.mix(0.1)} strokeWidth={stroke} />
                <circle cx={size / 2} cy={size / 2} r={radius} fill="none" stroke={color} strokeWidth={stroke}
                        strokeLinecap="round" strokeDasharray={circumference}
                        strokeDashoffset={circumference * (1 - Math.min(ratio, 1))}
                        style={{ transition: 'stroke-dashoffset 0.8s ease, stroke 0.3s ease' }} />
            </svg>
            <Box sx={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
                <Typography sx={{ color: theme.mix(1), fontWeight: 800, fontSize: '1.9rem', lineHeight: 1 }}>
                    {kcal(Math.abs(target - eaten))}
                </Typography>
                <Typography sx={{ color: over ? '#e94560' : theme.mix(0.5), fontSize: '0.75rem' }}>
                    {over ? 'kcal over' : 'kcal left'}
                </Typography>
                <Typography sx={{ color: theme.mix(0.4), fontSize: '0.72rem', mt: 0.5 }}>
                    {kcal(eaten)} / {kcal(target)}
                </Typography>
            </Box>
        </Box>
    );
}

function FoodDiary({ theme, navigate }) {
    const [date, setDate] = useState(today);
    const [diary, setDiary] = useState(null);
    const [history, setHistory] = useState(null);
    const [dialogMeal, setDialogMeal] = useState(null);
    const [error, setError] = useState('');
    const [reloadKey, setReloadKey] = useState(0);
    const [historyDays, setHistoryDays] = useState(7);

    useEffect(() => {
        let ignore = false;
        API.get('/nutrition/diary', { params: { date } })
            .then((res) => { if (!ignore) { setDiary(res.data); setError(''); } })
            .catch((err) => { if (!ignore) setError(errorMessage(err, 'Could not load your food diary')); });
        return () => { ignore = true; };
    }, [date, reloadKey]);

    useEffect(() => {
        let ignore = false;
        API.get('/nutrition/history', { params: { days: historyDays } })
            .then((res) => { if (!ignore) setHistory(res.data); })
            .catch(() => {});
        return () => { ignore = true; };
    }, [reloadKey, historyDays]);

    const removeEntry = async (id) => {
        try {
            await API.delete(`/nutrition/diary/${id}`);
            setReloadKey((key) => key + 1);
        } catch (err) {
            setError(errorMessage(err, 'Could not remove this entry'));
        }
    };

    const chart = useMemo(() => {
        if (!history) return null;
        const target = history.targets.calories;
        return {
            data: {
                labels: history.days.map((d) => new Date(`${d.date}T12:00:00`).toLocaleDateString(undefined,
                    history.days.length > 7 ? { day: 'numeric', month: 'short' } : { weekday: 'short' })),
                datasets: [
                    {
                        type: 'bar',
                        label: 'Eaten',
                        data: history.days.map((d) => Math.round(d.calories)),
                        backgroundColor: history.days.map((d) => (d.calories > target ? 'rgba(233,69,96,0.75)' : 'rgba(78,205,196,0.75)')),
                        borderRadius: 6,
                        maxBarThickness: 38,
                    },
                    {
                        type: 'line',
                        label: 'Target',
                        data: history.days.map(() => target),
                        borderColor: '#ffa726',
                        borderDash: [6, 6],
                        borderWidth: 2,
                        pointRadius: 0,
                    },
                ],
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: { legend: { labels: { color: theme.mix(0.6) } } },
                scales: {
                    x: { ticks: { color: theme.mix(0.5) }, grid: { display: false } },
                    y: { ticks: { color: theme.mix(0.5) }, grid: { color: theme.mix(0.08) }, beginAtZero: true },
                },
            },
        };
    }, [history, theme]);

    if (!diary) {
        return error
            ? <Alert severity="error">{error}</Alert>
            : <Box sx={{ textAlign: 'center', py: 8 }}><CircularProgress sx={{ color: '#e94560' }} /></Box>;
    }

    const { targets, totals } = diary;

    return (
        <>
            {error && <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError('')}>{error}</Alert>}

            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 1, mb: 2 }}>
                <IconButton onClick={() => setDate((d) => shiftDate(d, -1))} sx={{ color: theme.mix(0.7) }} aria-label="Previous day">
                    <ChevronLeftIcon />
                </IconButton>
                <Typography sx={{ color: theme.mix(1), fontWeight: 700, minWidth: 150, textAlign: 'center' }}>
                    {dateLabel(date)}
                </Typography>
                <IconButton onClick={() => setDate((d) => shiftDate(d, 1))} disabled={date >= today()}
                            sx={{ color: theme.mix(0.7) }} aria-label="Next day">
                    <ChevronRightIcon />
                </IconButton>
                {date !== today() && (
                    <Button size="small" onClick={() => setDate(today())} sx={{ color: '#e94560', textTransform: 'none' }}>
                        Today
                    </Button>
                )}
            </Box>

            <Card sx={{ ...glassCard(theme), mb: 3 }}>
                <CardContent sx={{ p: 3, display: 'flex', flexWrap: 'wrap', gap: 3, alignItems: 'center', justifyContent: 'center' }}>
                    <CalorieRing eaten={totals.calories} target={targets.calories} theme={theme} />
                    <Box sx={{ flex: 1, minWidth: 240 }}>
                        {MACROS.map((macro) => {
                            const value = totals[macro.key];
                            const target = targets[macro.key];
                            return (
                                <Box key={macro.key} sx={{ mb: 1.5 }}>
                                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.3 }}>
                                        <Typography sx={{ color: theme.mix(0.7), fontSize: '0.85rem' }}>{macro.label}</Typography>
                                        <Typography sx={{ color: theme.mix(0.5), fontSize: '0.8rem' }}>
                                            {Math.round(value)} / {target} g
                                        </Typography>
                                    </Box>
                                    <LinearProgress variant="determinate" value={Math.min(100, target > 0 ? (value / target) * 100 : 0)}
                                                    sx={{ height: 7, borderRadius: 4, background: theme.mix(0.1), '& .MuiLinearProgress-bar': { background: macro.color } }} />
                                </Box>
                            );
                        })}
                        <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', mt: 2 }}>
                            <Chip size="small" icon={<LocalFireDepartmentIcon sx={{ color: '#ff6b35 !important' }} />}
                                  label={`${diary.caloriesBurned} kcal burned`}
                                  sx={{ background: theme.mix(0.08), color: theme.mix(0.75) }} />
                            <Chip size="small" icon={<WaterDropIcon sx={{ color: '#45b7d1 !important' }} />}
                                  label={`${diary.waterMl} ml water`}
                                  sx={{ background: theme.mix(0.08), color: theme.mix(0.75) }} />
                        </Box>
                        <Typography sx={{ color: theme.mix(0.4), fontSize: '0.75rem', mt: 1.5 }}>{targets.basis}</Typography>
                        {!targets.personalized && (
                            <Button size="small" onClick={() => navigate('/profile')} sx={{ color: '#e94560', textTransform: 'none', px: 0 }}>
                                Complete your profile
                            </Button>
                        )}
                    </Box>
                </CardContent>
            </Card>

            {MEALS.map((meal) => {
                const entries = diary.meals[meal.key] || [];
                const mealCalories = entries.reduce((sum, entry) => sum + entry.calories, 0);
                const Icon = meal.icon;
                return (
                    <Card key={meal.key} sx={{ ...glassCard(theme), mb: 2, border: `1px solid ${meal.color}44` }}>
                        <CardContent sx={{ p: 2.5 }}>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                                <Icon sx={{ color: meal.color }} />
                                <Typography sx={{ color: theme.mix(1), fontWeight: 700 }}>{meal.label}</Typography>
                                <Typography sx={{ color: theme.mix(0.5), fontSize: '0.85rem' }}>{kcal(mealCalories)} kcal</Typography>
                                <Button size="small" startIcon={<AddIcon />} onClick={() => setDialogMeal(meal.key)}
                                        sx={{ ml: 'auto', color: meal.color, textTransform: 'none', fontWeight: 600 }}>
                                    Add food
                                </Button>
                            </Box>

                            {entries.length === 0 ? (
                                <Typography sx={{ color: theme.mix(0.35), fontSize: '0.85rem' }}>Nothing logged yet.</Typography>
                            ) : entries.map((entry) => (
                                <Box key={entry.id} sx={{
                                    display: 'flex', alignItems: 'center', gap: 1, py: 1,
                                    borderTop: `1px solid ${theme.mix(0.07)}`,
                                }}>
                                    <Box sx={{ flex: 1, minWidth: 0 }}>
                                        <Typography sx={{ color: theme.mix(0.9), fontSize: '0.9rem' }}>{entry.name}</Typography>
                                        <Typography sx={{ color: theme.mix(0.45), fontSize: '0.75rem' }}>
                                            {servingsLabel(entry.servings)} × {entry.servingLabel} · P {round(entry.proteinG)} g · C {round(entry.carbsG)} g · F {round(entry.fatG)} g
                                        </Typography>
                                    </Box>
                                    <Typography sx={{ color: meal.color, fontWeight: 700, fontSize: '0.85rem' }}>{kcal(entry.calories)}</Typography>
                                    <IconButton size="small" onClick={() => removeEntry(entry.id)} sx={{ color: theme.mix(0.4) }}
                                                aria-label={`Remove ${entry.name}`}>
                                        <DeleteIcon fontSize="small" />
                                    </IconButton>
                                </Box>
                            ))}
                        </CardContent>
                    </Card>
                );
            })}

            {chart && (
                <Card sx={{ ...glassCard(theme), mt: 3 }}>
                    <CardContent sx={{ p: 3 }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2, flexWrap: 'wrap' }}>
                            <Typography sx={{ color: theme.mix(1), fontWeight: 700, mr: 'auto' }}>
                                Last {history.days.length} days
                            </Typography>
                            {[7, 30, 90].map((days) => (
                                <Chip key={days} size="small" onClick={() => setHistoryDays(days)}
                                      label={days === 7 ? '7 days' : `${days} days ★`}
                                      sx={{
                                          cursor: 'pointer', fontWeight: 600,
                                          background: historyDays === days ? '#ff6b35' : theme.mix(0.08),
                                          color: historyDays === days ? '#fff' : theme.mix(0.7),
                                      }} />
                            ))}
                        </Box>
                        <Box sx={{ height: 240 }}>
                            <Chart type="bar" data={chart.data} options={chart.options} />
                        </Box>
                    </CardContent>
                </Card>
            )}

            {dialogMeal && (
                <AddFoodDialog
                    open
                    date={date}
                    meal={dialogMeal}
                    onClose={() => setDialogMeal(null)}
                    onAdded={() => { setDialogMeal(null); setReloadKey((key) => key + 1); }}
                />
            )}
        </>
    );
}

function MealSection({ title, icon, items, color, theme }) {
    return (
        <Card sx={{ ...glassCard(theme), border: `1px solid ${color}44`, mb: 2 }}>
            <CardContent sx={{ p: 3 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                    {icon}
                    <Typography sx={{ color: theme.mix(1), fontWeight: 700 }}>{title}</Typography>
                </Box>
                {items && items.map((item, index) => (
                    <Box key={index} sx={{
                        display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1,
                        p: 1.5, borderRadius: 2, background: theme.mix(0.03), border: `1px solid ${theme.mix(0.05)}`,
                    }}>
                        <Typography sx={{ color: theme.mix(0.8), fontSize: '0.9rem' }}>{item.food}</Typography>
                        <Chip label={`${item.calories} kcal`} size="small"
                              sx={{ background: `${color}33`, color, fontWeight: 600, fontSize: '0.75rem' }} />
                    </Box>
                ))}
            </CardContent>
        </Card>
    );
}

/** The older feature: example meals for whichever goal the user picks. */
function MealIdeas({ theme }) {
    const [goals, setGoals] = useState([]);
    const [selectedGoalType, setSelectedGoalType] = useState(null);
    const [nutrition, setNutrition] = useState(null);

    useEffect(() => {
        let ignore = false;
        API.get('/goals')
            .then((res) => {
                if (ignore) return;
                const active = res.data.filter((g) => g.status === 'IN_PROGRESS');
                setGoals(active);
                if (active.length > 0) setSelectedGoalType(active[0].goalType);
            })
            .catch(() => {});
        return () => { ignore = true; };
    }, []);

    useEffect(() => {
        if (!selectedGoalType) return undefined;
        let ignore = false;
        API.get(`/nutrition/${selectedGoalType}`)
            .then((res) => { if (!ignore) setNutrition(res.data); })
            .catch(() => {});
        return () => { ignore = true; };
    }, [selectedGoalType]);

    if (goals.length === 0) {
        return <Alert severity="info">Add a goal first and we'll suggest meals that match it.</Alert>;
    }

    return (
        <>
            <Typography sx={{ color: theme.mix(0.7), mb: 1 }}>Meal ideas for your goal:</Typography>
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mb: 3 }}>
                {goals.map((goal) => (
                    <Chip key={goal.id} label={GOAL_LABELS[goal.goalType] || goal.goalType}
                          onClick={() => setSelectedGoalType(goal.goalType)}
                          sx={{
                              background: selectedGoalType === goal.goalType ? GOAL_COLORS[goal.goalType] : theme.mix(0.1),
                              color: theme.mix(1), fontWeight: 600, cursor: 'pointer',
                          }} />
                ))}
            </Box>

            {nutrition && (
                <>
                    <Card sx={{
                        ...glassCard(theme),
                        background: `${GOAL_COLORS[selectedGoalType]}22`,
                        border: `1px solid ${GOAL_COLORS[selectedGoalType]}44`, mb: 3,
                    }}>
                        <CardContent sx={{ p: 3 }}>
                            <Typography variant="h6" sx={{ ...sectionTitle(theme), mb: 2 }}>Guideline</Typography>
                            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2, mb: 2 }}>
                                {[
                                    { label: 'Daily calories', value: `${nutrition.dailyCalories} kcal`, color: '#e94560' },
                                    { label: 'Protein', value: nutrition.protein, color: '#4ecdc4' },
                                    { label: 'Carbs', value: nutrition.carbs, color: '#ff6b35' },
                                    { label: 'Fats', value: nutrition.fats, color: '#a29bfe' },
                                ].map((item) => (
                                    <Box key={item.label} sx={{
                                        p: 1.5, borderRadius: 2, background: theme.mix(0.05),
                                        border: `1px solid ${theme.mix(0.1)}`, minWidth: 120, textAlign: 'center',
                                    }}>
                                        <Typography sx={{ color: theme.mix(0.5), fontSize: '0.75rem' }}>{item.label}</Typography>
                                        <Typography sx={{ color: item.color, fontWeight: 700 }}>{item.value}</Typography>
                                    </Box>
                                ))}
                            </Box>
                            <Alert severity="info" sx={{ background: theme.mix(0.05), color: theme.mix(0.8) }}>💡 {nutrition.tip}</Alert>
                        </CardContent>
                    </Card>

                    <MealSection title="Breakfast" icon={<BreakfastDiningIcon sx={{ color: '#ff6b35' }} />} items={nutrition.breakfast} color="#ff6b35" theme={theme} />
                    <MealSection title="Lunch" icon={<LunchDiningIcon sx={{ color: '#4ecdc4' }} />} items={nutrition.lunch} color="#4ecdc4" theme={theme} />
                    <MealSection title="Dinner" icon={<DinnerDiningIcon sx={{ color: '#a29bfe' }} />} items={nutrition.dinner} color="#a29bfe" theme={theme} />
                    <MealSection title="Snacks" icon={<LocalCafeIcon sx={{ color: '#45b7d1' }} />} items={nutrition.snacks} color="#45b7d1" theme={theme} />
                </>
            )}
        </>
    );
}

function Nutrition() {
    const { theme } = useAppTheme();
    const navigate = useNavigate();
    const [tab, setTab] = useState(0);

    return (
        <Box sx={{ minHeight: '100vh', background: theme.bgGradient, fontFamily: FONT, position: 'relative' }}>
            <Blobs />
            <AppBar position="sticky" sx={stickyHeader(theme)}>
                <Toolbar>
                    <IconButton onClick={() => navigate('/dashboard')} sx={{ color: theme.mix(1), mr: 1 }} aria-label="Back to dashboard">
                        <ArrowBackIcon />
                    </IconButton>
                    <RestaurantIcon sx={{ color: '#ff6b35', mr: 1 }} />
                    <Typography variant="h6" sx={{ color: theme.mix(1), fontWeight: 700 }}>Nutrition</Typography>
                </Toolbar>
            </AppBar>

            <Box sx={{ maxWidth: 820, mx: 'auto', py: 4, px: 2, position: 'relative', zIndex: 1 }}>
                <Tabs value={tab} onChange={(e, value) => setTab(value)} sx={{
                    mb: 3,
                    '& .MuiTab-root': { color: theme.mix(0.5), textTransform: 'none', fontWeight: 600 },
                    '& .Mui-selected': { color: '#ff6b35 !important' },
                    '& .MuiTabs-indicator': { background: '#ff6b35' },
                }}>
                    <Tab label="Food diary" />
                    <Tab label="Meal ideas" />
                </Tabs>

                {tab === 0 ? <FoodDiary theme={theme} navigate={navigate} /> : <MealIdeas theme={theme} />}
            </Box>
        </Box>
    );
}

export default Nutrition;
