import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import API from '../services/api';
import { errorMessage } from '../services/errors';
import { useAppTheme } from '../context/ThemeContext';
import {
    Box, Typography, Button, AppBar, Toolbar,
    IconButton, TextField, Card, CardContent, Avatar, MenuItem
} from '@mui/material';
import PersonIcon from '@mui/icons-material/Person';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import SettingsIcon from '@mui/icons-material/Settings';
import Blobs from '../components/Glass';
import { FONT, glassCard, fieldStyle, sectionTitle } from '../theme/styles';

function Profile() {
    const { theme } = useAppTheme();
    const [profile, setProfile] = useState(null);
    const [form, setForm] = useState({ age: '', gender: '', weight: '', height: '', profilePic: '' });
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const name = localStorage.getItem('name');
    const email = localStorage.getItem('email');
    const navigate = useNavigate();

    useEffect(() => { fetchProfile(); }, []);

    const fetchProfile = async () => {
        try {
            const res = await API.get('/profile');
            setProfile(res.data);
            setForm({
                age: res.data.age || '',
                gender: res.data.gender || '',
                weight: res.data.weight || '',
                height: res.data.height || '',
                profilePic: res.data.profilePic || '',
            });
        } catch (err) {
            console.error(err);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError(''); setSuccess('');
        try {
            await API.put('/profile', form);
            setSuccess('Profile updated successfully!');
            fetchProfile();
        } catch (err) {
            setError(errorMessage(err, 'Failed to update profile'));
        }
    };

    const handlePictureUpload = async (e) => {
        const file = e.target.files[0];
        if (!file) return;
        const formData = new FormData();
        formData.append('file', file);
        try {
            await API.post('/profile/upload-picture', formData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });
            setSuccess('Profile picture updated!');
            fetchProfile();
        } catch (err) {
            setError(errorMessage(err, 'Failed to upload picture'));
        }
    };

    const inputStyle = fieldStyle(theme);

    const getBMI = () => {
        if (!form.weight || !form.height) return null;
        const h = parseFloat(form.height) / 100;
        const bmi = (parseFloat(form.weight) / (h * h)).toFixed(1);
        return bmi;
    };

    const getBMICategory = (bmi) => {
        if (!bmi) return '';
        if (bmi < 18.5) return 'Underweight';
        if (bmi < 25) return 'Normal';
        if (bmi < 30) return 'Overweight';
        return 'Obese';
    };

    const getBMIColor = (bmi) => {
        if (!bmi) return theme.mix(1);
        if (bmi < 18.5) return '#45b7d1';
        if (bmi < 25) return '#4ecdc4';
        if (bmi < 30) return '#ffa726';
        return '#e94560';
    };

    const bmi = getBMI();

    return (
        <Box sx={{ minHeight: '100vh', background: theme.bgGradient, fontFamily: FONT, position: 'relative' }}>
            <Blobs />
            <AppBar position="static" sx={{ background: theme.mix(0.05), backdropFilter: 'blur(10px)', boxShadow: 'none', borderBottom: `1px solid ${theme.mix(0.1)}` }}>
                <Toolbar>
                    <IconButton onClick={() => navigate('/dashboard')} sx={{ color: theme.mix(1), mr: 1 }}>
                        <ArrowBackIcon />
                    </IconButton>
                    <PersonIcon sx={{ color: '#a29bfe', mr: 1 }} />
                    <Typography variant="h6" sx={{ color: theme.mix(1), fontWeight: 700, fontFamily: "'Poppins', sans-serif" }}>
                        My Profile
                    </Typography>
                </Toolbar>
            </AppBar>

            <Box sx={{ maxWidth: 700, mx: 'auto', py: 4, px: 2, position: 'relative', zIndex: 1 }}>

                {/* Profile Header */}
                <Card sx={{ ...glassCard(theme), mb: 4, textAlign: 'center', p: 3 }}>

                    {/* Avatar with upload */}
                    <Box sx={{ position: 'relative', width: 80, mx: 'auto', mb: 2 }}>
                        <Avatar
                            src={profile?.profilePic ? `http://localhost:8080/api/profile/picture/${profile.profilePic}` : ''}
                            sx={{ width: 80, height: 80, bgcolor: '#e94560', fontSize: '2rem', mx: 'auto' }}>
                            {name?.charAt(0).toUpperCase()}
                        </Avatar>
                        <Box
                            component="label"
                            sx={{
                                position: 'absolute', bottom: 0, right: 0,
                                width: 26, height: 26, borderRadius: '50%',
                                background: '#e94560', cursor: 'pointer',
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                border: '2px solid #1a1a2e'
                            }}>
                            <Typography sx={{ color: theme.mix(1), fontSize: '0.7rem', lineHeight: 1 }}>+</Typography>
                            <input type="file" accept="image/*" hidden onChange={handlePictureUpload} />
                        </Box>
                    </Box>

                    <Typography variant="h5" sx={{ color: theme.mix(1), fontWeight: 700, fontFamily: "'Poppins', sans-serif" }}>
                        {name}
                    </Typography>
                    <Typography sx={{ color: theme.mix(0.5), fontFamily: "'Poppins', sans-serif", mb: 1 }}>
                        {email}
                    </Typography>
                    <Typography sx={{ color: theme.mix(0.3), fontSize: '0.75rem', fontFamily: "'Poppins', sans-serif", mb: 2 }}>
                        Click the + to change profile picture
                    </Typography>

                    {bmi && (
                        <Box sx={{ display: 'flex', justifyContent: 'center', gap: 3, mt: 1 }}>
                            <Box>
                                <Typography sx={{ color: theme.mix(0.5), fontSize: '0.8rem' }}>BMI</Typography>
                                <Typography sx={{ color: getBMIColor(bmi), fontWeight: 700, fontFamily: FONT, fontSize: '1.6rem' }}>
                                    {bmi}
                                </Typography>
                                <Typography sx={{ color: getBMIColor(bmi), fontSize: '0.75rem' }}>
                                    {getBMICategory(bmi)}
                                </Typography>
                            </Box>
                            <Box>
                                <Typography sx={{ color: theme.mix(0.5), fontSize: '0.8rem' }}>Weight</Typography>
                                <Typography sx={{ color: theme.mix(1), fontWeight: 700, fontSize: '1.6rem' }}>{form.weight || '-'} kg</Typography>
                            </Box>
                            <Box>
                                <Typography sx={{ color: theme.mix(0.5), fontSize: '0.8rem' }}>Height</Typography>
                                <Typography sx={{ color: theme.mix(1), fontWeight: 700, fontSize: '1.6rem' }}>{form.height || '-'} cm</Typography>
                            </Box>
                        </Box>
                    )}
                </Card>

                {/* Edit Profile Form */}
                <Card sx={glassCard(theme)}>
                    <CardContent sx={{ p: 3 }}>
                        <Typography sx={{ ...sectionTitle(theme), mb: 2 }}>
                            Edit Profile
                        </Typography>
                        {error && <Typography sx={{ color: '#e94560', mb: 2 }}>{error}</Typography>}
                        {success && <Typography sx={{ color: '#4ecdc4', mb: 2 }}>{success}</Typography>}
                        <Box component="form" onSubmit={handleSubmit}>
                            <TextField fullWidth label="Age" type="number" value={form.age}
                                       onChange={(e) => setForm({ ...form, age: e.target.value })}
                                       sx={inputStyle} />
                            <TextField select fullWidth label="Gender" value={form.gender}
                                       onChange={(e) => setForm({ ...form, gender: e.target.value })}
                                       sx={inputStyle}
                                       SelectProps={{ MenuProps: { PaperProps: { sx: { background: theme.menuBg, color: theme.mix(1) } } } }}>
                                {['Male', 'Female', 'Other'].map((g) => (
                                    <MenuItem key={g} value={g} sx={{
                                        color: theme.mix(1), backgroundColor: theme.menuBg,
                                        '&:hover': { backgroundColor: theme.mix(0.15) },
                                        '&.Mui-selected': { backgroundColor: '#0f3460' },
                                        '&.Mui-selected:hover': { backgroundColor: '#0f3460' }
                                    }}>
                                        {g}
                                    </MenuItem>
                                ))}
                            </TextField>
                            <TextField fullWidth label="Weight (kg)" type="number" value={form.weight}
                                       onChange={(e) => setForm({ ...form, weight: e.target.value })}
                                       sx={inputStyle} />
                            <TextField fullWidth label="Height (cm)" type="number" value={form.height}
                                       onChange={(e) => setForm({ ...form, height: e.target.value })}
                                       sx={inputStyle} />
                            <Button fullWidth type="submit" variant="contained" sx={{
                                py: 1.5, borderRadius: 2, fontFamily: "'Poppins', sans-serif", fontWeight: 700,
                                background: 'linear-gradient(90deg, #a29bfe, #0f3460)',
                                '&:hover': { background: 'linear-gradient(90deg, #8176d4, #0a2540)' }
                            }}>
                                Save Profile
                            </Button>
                        </Box>
                    </CardContent>
                </Card>

                <Button fullWidth startIcon={<SettingsIcon />} onClick={() => navigate('/account-settings')} sx={{
                    mt: 3, py: 1.5, borderRadius: 2, fontFamily: "'Poppins', sans-serif", fontWeight: 600,
                    color: theme.mix(0.7), border: `1px solid ${theme.mix(0.15)}`,
                    '&:hover': { border: `1px solid ${theme.mix(0.3)}`, color: theme.mix(1) }
                }}>
                    Account Settings
                </Button>
            </Box>
        </Box>
    );
}

export default Profile;