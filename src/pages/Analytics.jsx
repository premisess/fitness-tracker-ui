import { useState, useEffect } from 'react';
import API from '../services/api';
import { useAppTheme } from '../context/ThemeContext';
import {
    Box, Typography, Card, CardContent, Button
} from '@mui/material';
import BarChartIcon from '@mui/icons-material/BarChart';
import FitnessCenterIcon from '@mui/icons-material/FitnessCenter';
import WaterDropIcon from '@mui/icons-material/WaterDrop';
import MonitorWeightIcon from '@mui/icons-material/MonitorWeight';
import { Link } from 'react-router-dom';
import PictureAsPdfIcon from '@mui/icons-material/PictureAsPdf';
import Blobs from '../components/Glass';
import { FONT, glassCard } from '../theme/styles';
import PageHeader from '../components/PageHeader';
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

    // Charts that have nothing to show yet, each with a shortcut to start tracking it.
    const missing = [
        !hasWorkouts && { label: 'Log a workout', to: '/workouts', Icon: FitnessCenterIcon, color: '#e94560' },
        waterHistory.length === 0 && { label: 'Log water', to: '/water-intake', Icon: WaterDropIcon, color: '#45b7d1' },
        bmiHistory.length === 0 && { label: 'Check your BMI', to: '/bmi', Icon: MonitorWeightIcon, color: '#ff6b35' },
    ].filter(Boolean);
    const hasAnyChart = missing.length < 3;

    return (
        <Box sx={{ minHeight: '100vh', background: theme.bgGradient, fontFamily: FONT, position: 'relative' }}>
            <Blobs />

            <Box sx={{ maxWidth: 900, mx: 'auto', py: 3, px: 2, position: 'relative', zIndex: 1 }}>
                <PageHeader>
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
                </PageHeader>

                {/* Totals from /analytics/summary */}
                <Box sx={{ display: 'grid', gridTemplateColumns: { xs: 'repeat(2, 1fr)', sm: 'repeat(3, 1fr)' }, gap: 1.5, mb: 2.5 }}>
                    {summaryTiles.map((tile) => (
                        <Card key={tile.label} sx={glassCard(theme)}>
                            <CardContent sx={{ py: 1.75, px: 2, '&:last-child': { pb: 1.75 } }}>
                                <Typography sx={{ color: theme.mix(0.5), fontSize: '0.75rem', fontWeight: 600, fontFamily: FONT }}>
                                    {tile.label}
                                </Typography>
                                <Typography sx={{ color: tile.color, fontWeight: 800, fontSize: '1.5rem', fontFamily: FONT, lineHeight: 1.3 }}>
                                    {tile.value}
                                </Typography>
                            </CardContent>
                        </Card>
                    ))}
                </Box>

                {/* Charts with data, two per row on wide screens */}
                <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' }, gap: 2.5, mb: 2.5 }}>
                    {hasWorkouts && (
                        <Card sx={{ ...glassCard(theme), gridColumn: { md: '1 / -1' } }}>
                            <CardContent sx={{ p: 2.5 }}>
                                <Line data={caloriesData} options={chartOptions('Calories Burned Over Time')} />
                            </CardContent>
                        </Card>
                    )}
                    {hasWorkouts && (
                        <Card sx={glassCard(theme)}>
                            <CardContent sx={{ p: 2.5 }}>
                                <Box sx={{ maxWidth: 340, mx: 'auto' }}>
                                    <Pie data={workoutTypeData} options={pieOptions} />
                                </Box>
                            </CardContent>
                        </Card>
                    )}
                    {waterHistory.length > 0 && (
                        <Card sx={glassCard(theme)}>
                            <CardContent sx={{ p: 2.5 }}>
                                <Bar data={waterData} options={chartOptions('Water Intake (Last 7 Days)')} />
                            </CardContent>
                        </Card>
                    )}
                    {bmiHistory.length > 0 && (
                        <Card sx={glassCard(theme)}>
                            <CardContent sx={{ p: 2.5 }}>
                                <Line data={bmiData} options={chartOptions('BMI History')} />
                            </CardContent>
                        </Card>
                    )}
                </Box>

                {/* One invitation for whatever isn't tracked yet */}
                {missing.length > 0 && (
                    <Card sx={glassCard(theme)}>
                        <CardContent sx={{ p: 2.5, '&:last-child': { pb: 2.5 } }}>
                            <Typography sx={{ color: theme.mix(1), fontWeight: 700, fontFamily: FONT }}>More charts appear as you track</Typography>
                            <Typography sx={{ color: theme.mix(0.55), fontSize: '0.88rem', mt: 0.5, mb: 2, fontFamily: FONT }}>
                                {hasAnyChart ? 'Add these to see the rest of your progress.' : 'Log a workout, a BMI check or some water and your charts show up here.'}
                            </Typography>
                            <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                                {missing.map((m) => (
                                    <Button key={m.to} component={Link} to={m.to} startIcon={<m.Icon />} variant="outlined"
                                            sx={{ borderRadius: 999, textTransform: 'none', fontWeight: 700, fontFamily: FONT, borderColor: `${m.color}88`, color: m.color, '&:hover': { borderColor: m.color, background: `${m.color}14` } }}>
                                        {m.label}
                                    </Button>
                                ))}
                            </Box>
                        </CardContent>
                    </Card>
                )}
            </Box>
        </Box>
    );
}

export default Analytics;