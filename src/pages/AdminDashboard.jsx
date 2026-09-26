import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import API from '../services/api';
import { errorMessage } from '../services/errors';
import { useAppTheme } from '../context/ThemeContext';
import {
    Box, Typography, Button, AppBar, Toolbar,
    IconButton, TextField, Card, CardContent, Avatar, Chip
} from '@mui/material';
import AdminPanelSettingsIcon from '@mui/icons-material/AdminPanelSettings';
import LogoutIcon from '@mui/icons-material/Logout';
import DeleteIcon from '@mui/icons-material/Delete';
import PeopleIcon from '@mui/icons-material/People';
import FitnessCenterIcon from '@mui/icons-material/FitnessCenter';
import TrackChangesIcon from '@mui/icons-material/TrackChanges';
import DarkModeIcon from '@mui/icons-material/DarkMode';
import LightModeIcon from '@mui/icons-material/LightMode';
import {
    Chart as ChartJS,
    CategoryScale, LinearScale, BarElement, LineElement,
    PointElement, ArcElement, Title, Tooltip, Legend
} from 'chart.js';
import { Bar, Line, Pie } from 'react-chartjs-2';
import Blobs from '../components/Glass';
import { FONT, glassCard, fieldStyle, sectionTitle, stickyHeader } from '../theme/styles';

ChartJS.register(
    CategoryScale, LinearScale, BarElement, LineElement,
    PointElement, ArcElement, Title, Tooltip, Legend
);

function AdminDashboard() {
    const { theme, mode, toggleTheme } = useAppTheme();
    const [stats, setStats] = useState({ totalUsers: 0, totalWorkouts: 0, totalGoals: 0 });
    const [users, setUsers] = useState([]);
    const [reports, setReports] = useState(null);
    const [newAdmin, setNewAdmin] = useState({ name: '', email: '', password: '' });
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const name = localStorage.getItem('name');
    const navigate = useNavigate();

    const fetchStats = async () => {
        try {
            const res = await API.get('/admin/stats');
            setStats(res.data);
        } catch (err) {
            console.error(err);
        }
    };

    const fetchUsers = async () => {
        try {
            const res = await API.get('/admin/users');
            setUsers(res.data);
        } catch (err) {
            console.error(err);
        }
    };

    // Role split, workout mix and signup growth are all computed by /admin/reports.
    const fetchReports = async () => {
        try {
            const res = await API.get('/admin/reports');
            setReports(res.data);
        } catch (err) {
            console.error(err);
        }
    };

    useEffect(() => {
        let cancelled = false;
        (async () => {
            try {
                const [statsRes, usersRes, reportsRes] = await Promise.all([
                    API.get('/admin/stats'),
                    API.get('/admin/users'),
                    API.get('/admin/reports'),
                ]);
                if (cancelled) return;
                setStats(statsRes.data);
                setUsers(usersRes.data);
                setReports(reportsRes.data);
            } catch (err) {
                if (!cancelled) console.error(err);
            }
        })();
        return () => { cancelled = true; };
    }, []);

    const handleDeleteUser = async (id) => {
        try {
            await API.delete(`/admin/users/${id}`);
            fetchUsers();
            fetchStats();
            fetchReports();
        } catch (err) {
            setError(errorMessage(err, 'Failed to delete user'));
        }
    };

    const handleCreateAdmin = async (e) => {
        e.preventDefault();
        setError(''); setSuccess('');
        try {
            await API.post('/admin/create-admin', newAdmin);
            setSuccess('New admin created successfully!');
            setNewAdmin({ name: '', email: '', password: '' });
            fetchUsers();
            fetchReports();
        } catch (err) {
            setError(errorMessage(err, 'Failed to create admin'));
        }
    };

    const handleLogout = async () => {
        try {
            await API.post('/auth/logout');
        } catch {
            // Session may already be gone server-side — clear local state anyway.
        }
        localStorage.clear();
        navigate('/login');
    };

    const inputStyle = fieldStyle(theme);

    const statCards = [
        { title: 'Total Users', value: stats.totalUsers, icon: <PeopleIcon sx={{ fontSize: 40, color: '#a29bfe' }} />, unit: 'users' },
        { title: 'Total Workouts', value: stats.totalWorkouts, icon: <FitnessCenterIcon sx={{ fontSize: 40, color: '#e94560' }} />, unit: 'sessions' },
        { title: 'Total Goals', value: stats.totalGoals, icon: <TrackChangesIcon sx={{ fontSize: 40, color: '#4ecdc4' }} />, unit: 'goals' },
    ];

    const usersByRole = reports?.usersByRole || {};
    const workoutsByType = reports?.workoutsByType || {};
    const userGrowthByMonth = reports?.userGrowthByMonth || {};
    const mostPopularWorkoutType = reports?.mostPopularWorkoutType;
    const hasReports = Object.keys(usersByRole).length > 0;

    const roleData = {
        labels: Object.keys(usersByRole),
        datasets: [{
            data: Object.values(usersByRole),
            backgroundColor: ['#e94560', '#a29bfe', '#4ecdc4'],
        }]
    };

    const workoutTypeData = {
        labels: Object.keys(workoutsByType),
        datasets: [{
            label: 'Workouts',
            data: Object.values(workoutsByType),
            backgroundColor: ['#e94560', '#ff6b35', '#4ecdc4', '#45b7d1', '#a29bfe', '#ffa726'],
            borderRadius: 6,
        }]
    };

    const userGrowthData = {
        labels: Object.keys(userGrowthByMonth),
        datasets: [{
            label: 'New Users',
            data: Object.values(userGrowthByMonth),
            borderColor: '#a29bfe',
            backgroundColor: 'rgba(162,155,254,0.2)',
            tension: 0.4,
            fill: true,
        }]
    };

    const overviewData = {
        labels: ['Users', 'Workouts', 'Goals'],
        datasets: [{
            label: 'Platform Totals',
            data: [stats.totalUsers, stats.totalWorkouts, stats.totalGoals],
            backgroundColor: ['#a29bfe', '#e94560', '#4ecdc4'],
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

    return (
        <Box sx={{ minHeight: '100vh', background: theme.bgGradient, fontFamily: FONT, position: 'relative' }}>
            <Blobs />
            <AppBar position="sticky" sx={stickyHeader(theme)}>
                <Toolbar>
                    <AdminPanelSettingsIcon sx={{ color: '#a29bfe', mr: 1 }} />
                    <Typography variant="h6" sx={{ color: theme.mix(1), fontWeight: 700, flexGrow: 1, fontFamily: "'Poppins', sans-serif" }}>
                        Admin Dashboard
                    </Typography>
                    <Avatar sx={{ bgcolor: '#a29bfe', mr: 2, width: 35, height: 35, fontSize: '0.9rem' }}>
                        {name?.charAt(0).toUpperCase()}
                    </Avatar>
                    <IconButton onClick={toggleTheme} sx={{ color: theme.mix(0.7), mr: 0.5 }}>
                        {mode === 'dark' ? <LightModeIcon /> : <DarkModeIcon />}
                    </IconButton>
                    <IconButton onClick={handleLogout} sx={{ color: theme.mix(0.7) }}>
                        <LogoutIcon />
                    </IconButton>
                </Toolbar>
            </AppBar>

            <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', py: 4, px: 2, minHeight: '100vh', position: 'relative', zIndex: 1 }}>

                {/* Welcome */}
                <Typography variant="h4" sx={{ ...sectionTitle(theme), fontSize: '1.15rem', mb: 1 }}>
                    Welcome, {name}
                </Typography>
                <Typography sx={{ color: theme.mix(0.5), mb: 4, fontFamily: "'Poppins', sans-serif" }}>
                    System Administration Panel
                </Typography>

                {/* Stat Cards */}
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 3, justifyContent: 'center', mb: 4, width: '100%', maxWidth: 900 }}>
                    {statCards.map((card, index) => (
                        <Box key={index} sx={{ width: 220 }}>
                            <Card sx={{
                                ...glassCard(theme),
                                transition: 'transform 0.2s',
                                '&:hover': { transform: 'translateY(-5px)' }
                            }}>
                                <CardContent sx={{ textAlign: 'center' }}>
                                    {card.icon}
                                    <Typography variant="h4" sx={{ ...sectionTitle(theme), fontSize: '1.15rem', mt: 1 }}>
                                        {card.value}
                                    </Typography>
                                    <Typography variant="body2" sx={{ color: theme.mix(0.5), fontFamily: "'Poppins', sans-serif" }}>
                                        {card.title}
                                    </Typography>
                                    <Typography variant="caption" sx={{ color: theme.mix(0.3), fontFamily: "'Poppins', sans-serif" }}>
                                        {card.unit}
                                    </Typography>
                                </CardContent>
                            </Card>
                        </Box>
                    ))}
                </Box>

                <Box sx={{ width: '100%', maxWidth: 900 }}>
                    {/* Reports */}
                    <Typography variant="h6" sx={{ color: theme.mix(1), fontWeight: 700, mb: 2, fontFamily: "'Poppins', sans-serif" }}>
                        Reports
                    </Typography>
                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 3, mb: 4 }}>
                        <Card sx={{ ...glassCard(theme), flex: '1 1 380px' }}>
                            <CardContent sx={{ p: 3 }}>
                                {users.length > 0 ? (
                                    <Bar data={overviewData} options={chartOptions('Platform Overview')} />
                                ) : (
                                    <Typography sx={{ color: theme.mix(0.5), textAlign: 'center' }}>No data yet.</Typography>
                                )}
                            </CardContent>
                        </Card>
                        <Card sx={{ ...glassCard(theme), flex: '1 1 380px' }}>
                            <CardContent sx={{ p: 3 }}>
                                {hasReports ? (
                                    <Box sx={{ maxWidth: 320, mx: 'auto' }}>
                                        <Pie data={roleData} options={{
                                            responsive: true,
                                            plugins: {
                                                legend: { labels: { color: theme.mix(1), font: { family: 'Poppins' } } },
                                                title: { display: true, text: 'User Roles', color: theme.mix(1), font: { family: 'Poppins', size: 14 } },
                                            }
                                        }} />
                                    </Box>
                                ) : (
                                    <Typography sx={{ color: theme.mix(0.5), textAlign: 'center' }}>No data yet.</Typography>
                                )}
                            </CardContent>
                        </Card>
                        <Card sx={{ ...glassCard(theme), flex: '1 1 380px' }}>
                            <CardContent sx={{ p: 3 }}>
                                {Object.keys(workoutsByType).length > 0 ? (
                                    <>
                                        <Bar data={workoutTypeData} options={chartOptions('Workouts by Type')} />
                                        {mostPopularWorkoutType?.type && (
                                            <Typography sx={{ color: theme.mix(0.5), fontSize: '0.8rem', mt: 2, textAlign: 'center', fontFamily: "'Poppins', sans-serif" }}>
                                                Most popular: <strong style={{ color: '#e94560' }}>{mostPopularWorkoutType.type}</strong> ({mostPopularWorkoutType.count} logged)
                                            </Typography>
                                        )}
                                    </>
                                ) : (
                                    <Typography sx={{ color: theme.mix(0.5), textAlign: 'center' }}>No workouts logged yet.</Typography>
                                )}
                            </CardContent>
                        </Card>
                        <Card sx={{ ...glassCard(theme), flex: '1 1 380px' }}>
                            <CardContent sx={{ p: 3 }}>
                                {Object.keys(userGrowthByMonth).length > 0 ? (
                                    <Line data={userGrowthData} options={chartOptions('User Growth by Month')} />
                                ) : (
                                    <Typography sx={{ color: theme.mix(0.5), textAlign: 'center' }}>No signup history yet.</Typography>
                                )}
                            </CardContent>
                        </Card>
                    </Box>

                    {/* Create Admin */}
                    <Card sx={{ ...glassCard(theme), mb: 4 }}>
                        <CardContent sx={{ p: 3 }}>
                            <Typography variant="h6" sx={{ color: theme.mix(1), fontWeight: 700, mb: 2, fontFamily: "'Poppins', sans-serif" }}>
                                Create New Admin
                            </Typography>
                            {error && <Typography sx={{ color: '#e94560', mb: 2 }}>{error}</Typography>}
                            {success && <Typography sx={{ color: '#4ecdc4', mb: 2 }}>{success}</Typography>}
                            <Box component="form" onSubmit={handleCreateAdmin}>
                                <TextField fullWidth label="Name" value={newAdmin.name}
                                           onChange={(e) => setNewAdmin({ ...newAdmin, name: e.target.value })}
                                           required sx={inputStyle} />
                                <TextField fullWidth label="Email" type="email" value={newAdmin.email}
                                           onChange={(e) => setNewAdmin({ ...newAdmin, email: e.target.value })}
                                           required sx={inputStyle} />
                                <TextField fullWidth label="Password" type="password" value={newAdmin.password}
                                           onChange={(e) => setNewAdmin({ ...newAdmin, password: e.target.value })}
                                           required sx={inputStyle} />
                                <Button type="submit" variant="contained" sx={{
                                    py: 1.1, px: 4, borderRadius: 999, textTransform: 'none', fontFamily: "'Poppins', sans-serif", fontWeight: 700,
                                    background: 'linear-gradient(90deg, #a29bfe, #0f3460)',
                                    '&:hover': { background: 'linear-gradient(90deg, #8176d4, #0a2540)' }
                                }}>
                                    Create Admin
                                </Button>
                            </Box>
                        </CardContent>
                    </Card>

                    {/* Users List */}
                    <Typography variant="h6" sx={{ color: theme.mix(1), fontWeight: 700, mb: 2, fontFamily: "'Poppins', sans-serif" }}>
                        All Users
                    </Typography>
                    {users.map((user) => (
                        <Card key={user.id} sx={{ ...glassCard(theme), mb: 2 }}>
                            <CardContent sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                                    <Avatar sx={{ bgcolor: user.role === 'ADMIN' ? '#a29bfe' : '#e94560', width: 40, height: 40 }}>
                                        {user.name?.charAt(0).toUpperCase()}
                                    </Avatar>
                                    <Box>
                                        <Typography sx={{ color: theme.mix(1), fontWeight: 700, fontFamily: "'Poppins', sans-serif" }}>
                                            {user.name}
                                        </Typography>
                                        <Typography sx={{ color: theme.mix(0.5), fontSize: '0.85rem' }}>
                                            {user.email}
                                        </Typography>
                                    </Box>
                                </Box>
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                    <Chip label={user.role} size="small" sx={{
                                        background: user.role === 'ADMIN' ? '#a29bfe' : '#e94560',
                                        color: theme.mix(1), fontWeight: 600
                                    }} />
                                    <IconButton onClick={() => handleDeleteUser(user.id)} sx={{ color: '#e94560' }}>
                                        <DeleteIcon fontSize="small" />
                                    </IconButton>
                                </Box>
                            </CardContent>
                        </Card>
                    ))}
                </Box>
            </Box>
        </Box>
    );
}

export default AdminDashboard;