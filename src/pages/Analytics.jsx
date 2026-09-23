import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import API from '../services/api';
import { useAppTheme } from '../context/ThemeContext';
import {
    Box, Typography, AppBar, Toolbar, IconButton, Card, CardContent, Button
} from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import BarChartIcon from '@mui/icons-material/BarChart';
import PictureAsPdfIcon from '@mui/icons-material/PictureAsPdf';
import Blobs from '../components/Glass';
import { FONT, glassCard } from '../theme/styles';
import exportWorkoutsPdf from '../services/exportWorkoutsPdf';
import {
    Chart as ChartJS,
    CategoryScale, LinearScale, BarElement, LineElement,
    PointElement, ArcElement, Title, Tooltip, Legend
} from 'chart.js';
import { Bar, Line, Pie } from 'react-chartjs-2';

ChartJS.register(
    CategoryScale, LinearScale, BarElement, LineElement,
    PointElement, ArcElement, Title, Tooltip, Legend
);

function Analytics() {
    const { theme } = useAppTheme();
    // Workout totals, per-type breakdown and the calorie series all come from
    // /analytics/summary — the backend already aggregates them.
    const [summary, setSummary] = useState(null);
    const [bmiHistory, setBmiHistory] = useState([]);
    const [waterHistory, setWaterHistory] = useState([]);
    const navigate = useNavigate();

    useEffect(() => {
        let cancelled = false;
        (async () => {
            try {
                const [summaryRes, bmiRes, waterRes] = await Promise.all([
                    API.get('/analytics/summary'),
                    API.get('/bmi'),
                    API.get('/water-intake'),
                ]);
                if (cancelled) return;
                setSummary(summaryRes.data);
                setBmiHistory(bmiRes.data);
                setWaterHistory(waterRes.data);
            } catch (err) {
                if (!cancelled) console.error(err);
            }
        })();
        return () => { cancelled = true; };
    }, []);

    const byType = summary?.byType || [];
    const caloriesOverTime = summary?.caloriesOverTime || [];
    const hasWorkouts = (summary?.totalWorkouts || 0) > 0;

    const workoutTypeData = {
        labels: byType.map(t => t.type),
        datasets: [{
            label: 'Workouts by Type',
            data: byType.map(t => t.count),
            backgroundColor: ['#e94560', '#ff6b35', '#4ecdc4', '#45b7d1', '#a29bfe', '#ffa726', '#4ecdc4', '#e94560'],
        }]
    };

    // Calories per day (last 10 days that have a workout)
    const recentCalories = caloriesOverTime.slice(-10);
    const caloriesData = {
        labels: recentCalories.map(p => p.date),
        datasets: [{
            label: 'Calories Burned',
            data: recentCalories.map(p => p.value),
            borderColor: '#e94560',
            backgroundColor: 'rgba(233,69,96,0.2)',
            tension: 0.4,
            fill: true,
        }]
    };

    const summaryTiles = [
        { label: 'Total Workouts', value: summary?.totalWorkouts ?? 0, color: '#e94560' },
        { label: 'Calories Burned', value: summary?.totalCaloriesBurned ?? 0, color: '#ff6b35' },
        { label: 'Minutes Trained', value: summary?.totalDurationMinutes ?? 0, color: '#45b7d1' },
        { label: 'Avg Cal / Workout', value: summary?.averageCaloriesPerWorkout ?? 0, color: '#ffa726' },
        { label: 'Current Streak', value: summary?.currentStreak ?? 0, color: '#4ecdc4' },
        { label: 'Longest Streak', value: summary?.longestStreak ?? 0, color: '#a29bfe' },
    ];

    // BMI history
    const bmiData = {
        labels: [...bmiHistory].reverse().map(b => b.date),
        datasets: [{
            label: 'BMI',
            data: [...bmiHistory].reverse().map(b => b.bmiValue),
            borderColor: '#4ecdc4',
            backgroundColor: 'rgba(78,205,196,0.2)',
            tension: 0.4,
            fill: true,
        }]
    };

    // Water intake last 7 days
    const last7Water = [...waterHistory].slice(0, 7).reverse();
    const waterData = {
        labels: last7Water.map(w => w.date),
        datasets: [{
            label: 'Water Intake (ml)',
            data: last7Water.map(w => w.amountMl),
            backgroundColor: '#45b7d1',
            borderRadius: 6,
        }]
    };

    const chartOptions = (title) => ({
        responsive: true,
        plugins: {
            legend: { labels: { color: theme.mix(1), font: { family: 'Poppins' } } },
            title: { display: true, text: title, color: theme.mix(1), font: { family: 'Poppins', size: 14 } },
        },
        scales: {
            x: { ticks: { color: theme.mix(0.5) }, grid: { color: theme.mix(0.05) } },
            y: { ticks: { color: theme.mix(0.5) }, grid: { color: theme.mix(0.05) } },
        }
    });

    const pieOptions = {
        responsive: true,
        plugins: {
            legend: { labels: { color: theme.mix(1), font: { family: 'Poppins' } } },
            title: { display: true, text: 'Workout Distribution', color: theme.mix(1), font: { family: 'Poppins', size: 14 } },
        }
    };

    const handleExportPdf = async () => {
        try {
            await exportWorkoutsPdf();
        } catch (err) {
            console.error('Export failed', err);
        }
    };

    const cardStyle = { ...glassCard(theme), mb: 3 };

    return (
        <Box sx={{ minHeight: '100vh', background: theme.bgGradient, fontFamily: FONT, position: 'relative' }}>
            <Blobs />
            <AppBar position="static" sx={{ background: theme.mix(0.05), backdropFilter: 'blur(10px)', boxShadow: 'none', borderBottom: `1px solid ${theme.mix(0.1)}` }}>
                <Toolbar>
                    <IconButton onClick={() => navigate('/dashboard')} sx={{ color: theme.mix(1), mr: 1 }}>
                        <ArrowBackIcon />
                    </IconButton>
                    <BarChartIcon sx={{ color: '#4ecdc4', mr: 1 }} />
                    <Typography variant="h6" sx={{ color: theme.mix(1), fontWeight: 700, flexGrow: 1, fontFamily: "'Poppins', sans-serif" }}>
                        Analytics & Charts
                    </Typography>
                    <Button size="small" startIcon={<PictureAsPdfIcon />} onClick={handleExportPdf} sx={{
                        color: theme.mix(0.7), fontFamily: "'Poppins', sans-serif",
                        border: `1px solid ${theme.mix(0.15)}`, borderRadius: 2,
                        '&:hover': { border: `1px solid ${theme.mix(0.3)}`, color: theme.mix(1) }
                    }}>
                        Export PDF
                    </Button>
                </Toolbar>
            </AppBar>

            <Box sx={{ maxWidth: 900, mx: 'auto', py: 4, px: 2, position: 'relative', zIndex: 1 }}>

                {/* Totals from /analytics/summary */}
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2, mb: 3 }}>
                    {summaryTiles.map((tile) => (
                        <Card key={tile.label} sx={{ ...cardStyle, mb: 0, flex: '1 1 130px' }}>
                            <CardContent sx={{ textAlign: 'center', py: 2 }}>
                                <Typography sx={{ color: tile.color, fontWeight: 700, fontSize: '1.6rem', fontFamily: FONT }}>
                                    {tile.value}
                                </Typography>
                                <Typography sx={{ color: theme.mix(0.5), fontSize: '0.72rem', fontFamily: "'Poppins', sans-serif" }}>
                                    {tile.label}
                                </Typography>
                            </CardContent>
                        </Card>
                    ))}
                </Box>

                {/* Calories Chart */}
                <Card sx={cardStyle}>
                    <CardContent sx={{ p: 3 }}>
                        {hasWorkouts ? (
                            <Line data={caloriesData} options={chartOptions('Calories Burned Over Time')} />
                        ) : (
                            <Typography sx={{ color: theme.mix(0.5), textAlign: 'center' }}>
                                No workout data yet. Log some workouts to see your calorie chart!
                            </Typography>
                        )}
                    </CardContent>
                </Card>

                {/* Workout Distribution */}
                <Card sx={cardStyle}>
                    <CardContent sx={{ p: 3 }}>
                        {hasWorkouts ? (
                            <Box sx={{ maxWidth: 400, mx: 'auto' }}>
                                <Pie data={workoutTypeData} options={pieOptions} />
                            </Box>
                        ) : (
                            <Typography sx={{ color: theme.mix(0.5), textAlign: 'center' }}>
                                No workout data yet.
                            </Typography>
                        )}
                    </CardContent>
                </Card>

                {/* BMI Chart */}
                <Card sx={cardStyle}>
                    <CardContent sx={{ p: 3 }}>
                        {bmiHistory.length > 0 ? (
                            <Line data={bmiData} options={chartOptions('BMI History')} />
                        ) : (
                            <Typography sx={{ color: theme.mix(0.5), textAlign: 'center' }}>
                                No BMI records yet. Calculate your BMI to see the trend!
                            </Typography>
                        )}
                    </CardContent>
                </Card>

                {/* Water Intake Chart */}
                <Card sx={cardStyle}>
                    <CardContent sx={{ p: 3 }}>
                        {waterHistory.length > 0 ? (
                            <Bar data={waterData} options={chartOptions('Water Intake (Last 7 Days)')} />
                        ) : (
                            <Typography sx={{ color: theme.mix(0.5), textAlign: 'center' }}>
                                No water intake data yet.
                            </Typography>
                        )}
                    </CardContent>
                </Card>

            </Box>
        </Box>
    );
}

export default Analytics;