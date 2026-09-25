import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import API from '../services/api';
import { errorMessage } from '../services/errors';
import { useAppTheme } from '../context/ThemeContext';
import {
    Box, Typography, Button, AppBar, Toolbar,
    IconButton, TextField, Card, CardContent, Divider, MenuItem, Switch, FormControlLabel,
    Dialog, DialogTitle, DialogContent, DialogContentText, DialogActions
} from '@mui/material';
import SettingsIcon from '@mui/icons-material/Settings';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import Blobs from '../components/Glass';
import { FONT, glassCard, fieldStyle, stickyHeader } from '../theme/styles';

const PRIVACY_OPTIONS = [
    { value: 0, label: 'Off' },
    { value: 200, label: '200 m' },
    { value: 500, label: '500 m' },
    { value: 1000, label: '1 km' },
];

function AccountSettings() {
    const { theme } = useAppTheme();
    const [nameForm, setNameForm] = useState(localStorage.getItem('name') || '');
    const [nameError, setNameError] = useState('');
    const [nameSuccess, setNameSuccess] = useState('');
    const [confirmDelete, setConfirmDelete] = useState(false);
    const [deleteError, setDeleteError] = useState('');
    const [emailForm, setEmailForm] = useState({ newEmail: '', currentPassword: '' });
    const [passwordForm, setPasswordForm] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' });
    const [emailError, setEmailError] = useState('');
    const [emailSuccess, setEmailSuccess] = useState('');
    const [passwordError, setPasswordError] = useState('');
    const [passwordSuccess, setPasswordSuccess] = useState('');
    const [location, setLocation] = useState(null);
    const [locationError, setLocationError] = useState('');
    const [locationSuccess, setLocationSuccess] = useState('');
    const [confirmDeleteRoutes, setConfirmDeleteRoutes] = useState(false);
    const navigate = useNavigate();

    useEffect(() => {
        let ignore = false;
        API.get('/account/location-settings')
            .then((res) => { if (!ignore) setLocation(res.data); })
            .catch((err) => { if (!ignore) setLocationError(errorMessage(err, 'Could not load location settings')); });
        return () => { ignore = true; };
    }, []);

    const inputStyle = fieldStyle(theme);
    const cardStyle = { ...glassCard(theme), mb: 4 };
    const titleStyle = { color: theme.mix(1), fontWeight: 700, mb: 2, fontFamily: FONT };

    const handleNameSubmit = async (e) => {
        e.preventDefault();
        setNameError(''); setNameSuccess('');
        try {
            await API.put('/account/name', { name: nameForm });
            localStorage.setItem('name', nameForm.trim());
            setNameSuccess('Display name updated successfully!');
        } catch (err) {
            setNameError(errorMessage(err, 'Failed to update name.'));
        }
    };

    const handleDeleteAccount = async () => {
        setDeleteError('');
        try {
            await API.delete('/account');
            localStorage.clear();
            navigate('/login');
        } catch (err) {
            setConfirmDelete(false);
            setDeleteError(errorMessage(err, 'Failed to delete account.'));
        }
    };

    const handleEmailSubmit = async (e) => {
        e.preventDefault();
        setEmailError(''); setEmailSuccess('');
        try {
            const res = await API.put('/account/email', emailForm);
            localStorage.setItem('email', res.data?.email || emailForm.newEmail);
            setEmailSuccess('Email updated successfully!');
            setEmailForm({ newEmail: '', currentPassword: '' });
        } catch (err) {
            setEmailError(errorMessage(err, 'Failed to update email. Check your password and try again.'));
        }
    };

    const handlePasswordSubmit = async (e) => {
        e.preventDefault();
        setPasswordError(''); setPasswordSuccess('');
        if (passwordForm.newPassword !== passwordForm.confirmPassword) {
            setPasswordError('New passwords do not match.');
            return;
        }
        try {
            await API.put('/account/password', {
                currentPassword: passwordForm.currentPassword,
                newPassword: passwordForm.newPassword,
            });
            setPasswordSuccess('Password updated successfully!');
            setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
        } catch (err) {
            setPasswordError(errorMessage(err, 'Failed to update password. Check your current password.'));
        }
    };

    const updateLocation = async (request, successText) => {
        setLocationError(''); setLocationSuccess('');
        try {
            const res = await request();
            setLocation(res.data);
            setLocationSuccess(successText);
        } catch (err) {
            setLocationError(errorMessage(err, 'Could not update location settings.'));
        }
    };

    const handleConsent = (checked) => updateLocation(
        () => API.put('/account/location-consent', { consent: checked }),
        checked
            ? 'Location tracking is on.'
            : "Location tracking is off. GPS activities can't be recorded until you turn it back on.",
    );

    const handlePrivacy = (meters) => updateLocation(
        () => API.put('/account/route-privacy', { routePrivacyMeters: meters }),
        meters ? `Shared routes now hide ${meters} m around the start and finish.` : 'Privacy zone turned off.',
    );

    const handleDeleteRoutes = async () => {
        setConfirmDeleteRoutes(false);
        setLocationError(''); setLocationSuccess('');
        try {
            const res = await API.delete('/account/routes');
            const n = res.data.deleted;
            setLocationSuccess(`Deleted ${n} route${n === 1 ? '' : 's'}. Distances, times and splits are kept.`);
        } catch (err) {
            setLocationError(errorMessage(err, 'Could not delete route data.'));
        }
    };

    return (
        <Box sx={{ minHeight: '100vh', background: theme.bgGradient, fontFamily: FONT, position: 'relative' }}>
            <Blobs />
            <AppBar position="sticky" sx={stickyHeader(theme)}>
                <Toolbar>
                    <IconButton onClick={() => navigate('/profile')} sx={{ color: theme.mix(1), mr: 1 }}>
                        <ArrowBackIcon />
                    </IconButton>
                    <SettingsIcon sx={{ color: '#a29bfe', mr: 1 }} />
                    <Typography variant="h6" sx={{ color: theme.mix(1), fontWeight: 700, fontFamily: "'Poppins', sans-serif" }}>
                        Account Settings
                    </Typography>
                </Toolbar>
            </AppBar>

            <Box sx={{ maxWidth: 600, mx: 'auto', py: 4, px: 2, position: 'relative', zIndex: 1 }}>

                {/* Display Name */}
                <Card sx={cardStyle}>
                    <CardContent sx={{ p: 3 }}>
                        <Typography variant="h6" sx={titleStyle}>Display Name</Typography>
                        {nameError && <Typography sx={{ color: '#e94560', mb: 2, fontSize: '0.85rem' }}>{nameError}</Typography>}
                        {nameSuccess && <Typography sx={{ color: '#4ecdc4', mb: 2, fontSize: '0.85rem' }}>{nameSuccess}</Typography>}
                        <Box component="form" onSubmit={handleNameSubmit}>
                            <TextField fullWidth label="Name" value={nameForm}
                                       onChange={(e) => setNameForm(e.target.value)}
                                       required sx={inputStyle} />
                            <Button fullWidth type="submit" variant="contained" sx={{
                                py: 1.5, borderRadius: 2, fontFamily: "'Poppins', sans-serif", fontWeight: 700,
                                background: 'linear-gradient(90deg, #4ecdc4, #0f3460)',
                                '&:hover': { background: 'linear-gradient(90deg, #3aa89f, #0a2540)' }
                            }}>
                                Update Name
                            </Button>
                        </Box>
                    </CardContent>
                </Card>

                {/* Location & Privacy */}
                <Card sx={cardStyle}>
                    <CardContent sx={{ p: 3 }}>
                        <Typography variant="h6" sx={{ ...titleStyle, mb: 1 }}>Location & Privacy</Typography>
                        <Typography sx={{ color: theme.mix(0.55), fontSize: '0.85rem', mb: 2 }}>
                            GPS is recorded only while you track an activity. Only you can see your full routes.
                        </Typography>
                        {locationError && <Typography sx={{ color: '#e94560', mb: 2, fontSize: '0.85rem' }}>{locationError}</Typography>}
                        {locationSuccess && <Typography sx={{ color: '#4ecdc4', mb: 2, fontSize: '0.85rem' }}>{locationSuccess}</Typography>}
                        {location && (
                            <>
                                <FormControlLabel
                                    sx={{ color: theme.mix(0.9), mb: 1 }}
                                    control={<Switch checked={location.locationConsent} onChange={(e) => handleConsent(e.target.checked)} />}
                                    label={location.locationConsent
                                        ? `Location tracking on${location.locationConsentAt ? ` (since ${new Date(location.locationConsentAt).toLocaleDateString()})` : ''}`
                                        : 'Location tracking off'}
                                />
                                <TextField select fullWidth label="Privacy zone around start & finish" value={location.routePrivacyMeters}
                                           onChange={(e) => handlePrivacy(Number(e.target.value))}
                                           helperText="This part of a route is hidden whenever the route is shared, so it doesn't reveal where you live."
                                           FormHelperTextProps={{ sx: { color: theme.mix(0.45) } }}
                                           SelectProps={{ MenuProps: { PaperProps: { sx: { background: theme.menuBg, color: theme.mix(1) } } } }}
                                           sx={{ ...inputStyle, mt: 1 }}>
                                    {PRIVACY_OPTIONS.map((o) => <MenuItem key={o.value} value={o.value}>{o.label}</MenuItem>)}
                                </TextField>
                                <Button fullWidth variant="outlined" onClick={() => setConfirmDeleteRoutes(true)} sx={{
                                    py: 1.2, borderRadius: 2, fontWeight: 700,
                                    borderColor: theme.mix(0.3), color: theme.mix(0.85),
                                    '&:hover': { borderColor: '#e94560', color: '#e94560' }
                                }}>
                                    Delete all my route data
                                </Button>
                            </>
                        )}
                    </CardContent>
                </Card>

                {/* Change Email */}
                <Card sx={cardStyle}>
                    <CardContent sx={{ p: 3 }}>
                        <Typography variant="h6" sx={titleStyle}>Change Email</Typography>
                        {emailError && <Typography sx={{ color: '#e94560', mb: 2, fontSize: '0.85rem' }}>{emailError}</Typography>}
                        {emailSuccess && <Typography sx={{ color: '#4ecdc4', mb: 2, fontSize: '0.85rem' }}>{emailSuccess}</Typography>}
                        <Box component="form" onSubmit={handleEmailSubmit}>
                            <TextField fullWidth label="New Email" type="email" value={emailForm.newEmail}
                                       onChange={(e) => setEmailForm({ ...emailForm, newEmail: e.target.value })}
                                       required sx={inputStyle} />
                            <TextField fullWidth label="Current Password" type="password" value={emailForm.currentPassword}
                                       onChange={(e) => setEmailForm({ ...emailForm, currentPassword: e.target.value })}
                                       required sx={inputStyle} />
                            <Button fullWidth type="submit" variant="contained" sx={{
                                py: 1.5, borderRadius: 2, fontFamily: "'Poppins', sans-serif", fontWeight: 700,
                                background: 'linear-gradient(90deg, #a29bfe, #0f3460)',
                                '&:hover': { background: 'linear-gradient(90deg, #8176d4, #0a2540)' }
                            }}>
                                Update Email
                            </Button>
                        </Box>
                    </CardContent>
                </Card>

                {/* Change Password */}
                <Card sx={{ ...cardStyle, mb: 0 }}>
                    <CardContent sx={{ p: 3 }}>
                        <Typography variant="h6" sx={titleStyle}>Change Password</Typography>
                        {passwordError && <Typography sx={{ color: '#e94560', mb: 2, fontSize: '0.85rem' }}>{passwordError}</Typography>}
                        {passwordSuccess && <Typography sx={{ color: '#4ecdc4', mb: 2, fontSize: '0.85rem' }}>{passwordSuccess}</Typography>}
                        <Box component="form" onSubmit={handlePasswordSubmit}>
                            <TextField fullWidth label="Current Password" type="password" value={passwordForm.currentPassword}
                                       onChange={(e) => setPasswordForm({ ...passwordForm, currentPassword: e.target.value })}
                                       required sx={inputStyle} />
                            <Divider sx={{ my: 2, borderColor: theme.mix(0.1) }} />
                            <TextField fullWidth label="New Password" type="password" value={passwordForm.newPassword}
                                       onChange={(e) => setPasswordForm({ ...passwordForm, newPassword: e.target.value })}
                                       required sx={inputStyle} />
                            <TextField fullWidth label="Confirm New Password" type="password" value={passwordForm.confirmPassword}
                                       onChange={(e) => setPasswordForm({ ...passwordForm, confirmPassword: e.target.value })}
                                       required sx={inputStyle} />
                            <Button fullWidth type="submit" variant="contained" sx={{
                                py: 1.5, borderRadius: 2, fontFamily: "'Poppins', sans-serif", fontWeight: 700,
                                background: 'linear-gradient(90deg, #e94560, #0f3460)',
                                '&:hover': { background: 'linear-gradient(90deg, #c73652, #0a2540)' }
                            }}>
                                Update Password
                            </Button>
                        </Box>
                    </CardContent>
                </Card>

                {/* Danger Zone */}
                <Card sx={{ ...glassCard(theme), border: '1px solid rgba(233,69,96,0.4)', mt: 4 }}>
                    <CardContent sx={{ p: 3 }}>
                        <Typography variant="h6" sx={{ color: '#e94560', fontWeight: 700, mb: 1, fontFamily: "'Poppins', sans-serif" }}>
                            Delete Account
                        </Typography>
                        <Typography sx={{ color: theme.mix(0.5), fontSize: '0.85rem', mb: 2, fontFamily: "'Poppins', sans-serif" }}>
                            This permanently removes your account along with every workout, GPS route, goal and BMI record. It cannot be undone.
                        </Typography>
                        {deleteError && <Typography sx={{ color: '#e94560', mb: 2, fontSize: '0.85rem' }}>{deleteError}</Typography>}
                        <Button fullWidth variant="outlined" onClick={() => setConfirmDelete(true)} sx={{
                            py: 1.5, borderRadius: 2, fontFamily: "'Poppins', sans-serif", fontWeight: 700,
                            borderColor: '#e94560', color: '#e94560',
                            '&:hover': { background: '#e94560', color: '#fff', borderColor: '#e94560' }
                        }}>
                            Delete My Account
                        </Button>
                    </CardContent>
                </Card>
            </Box>

            <Dialog open={confirmDeleteRoutes} onClose={() => setConfirmDeleteRoutes(false)}>
                <DialogTitle sx={{ fontWeight: 700 }}>Delete all route data?</DialogTitle>
                <DialogContent>
                    <DialogContentText>
                        The maps of all your GPS activities will be deleted permanently. The activities themselves, with their distance, time and splits, are kept.
                    </DialogContentText>
                </DialogContent>
                <DialogActions sx={{ px: 3, pb: 2 }}>
                    <Button onClick={() => setConfirmDeleteRoutes(false)}>Cancel</Button>
                    <Button onClick={handleDeleteRoutes} variant="contained" sx={{ background: '#e94560', fontWeight: 700, '&:hover': { background: '#c73652' } }}>
                        Delete routes
                    </Button>
                </DialogActions>
            </Dialog>

            <Dialog open={confirmDelete} onClose={() => setConfirmDelete(false)}>
                <DialogTitle sx={{ fontFamily: "'Poppins', sans-serif", fontWeight: 700 }}>
                    Delete your account?
                </DialogTitle>
                <DialogContent>
                    <DialogContentText sx={{ fontFamily: "'Poppins', sans-serif" }}>
                        Your workouts, GPS routes, goals, BMI records and profile will be deleted permanently. This cannot be undone.
                    </DialogContentText>
                </DialogContent>
                <DialogActions sx={{ px: 3, pb: 2 }}>
                    <Button onClick={() => setConfirmDelete(false)} sx={{ fontFamily: "'Poppins', sans-serif" }}>
                        Cancel
                    </Button>
                    <Button onClick={handleDeleteAccount} variant="contained" sx={{
                        background: '#e94560', fontFamily: "'Poppins', sans-serif", fontWeight: 700,
                        '&:hover': { background: '#c73652' }
                    }}>
                        Delete Permanently
                    </Button>
                </DialogActions>
            </Dialog>
        </Box>
    );
}

export default AccountSettings;
