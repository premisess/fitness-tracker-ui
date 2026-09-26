import { useNavigate } from 'react-router-dom';
import { AppBar, Box, Card, CardContent, IconButton, Toolbar, Typography } from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import ShieldOutlinedIcon from '@mui/icons-material/ShieldOutlined';
import { useAppTheme } from '../context/ThemeContext';
import Blobs from '../components/Glass';
import { FONT, glassCard, sectionTitle, stickyHeader } from '../theme/styles';
import { CONTACT_EMAIL } from '../config/contact';
import PhoneContact from '../components/PhoneContact';

const LAST_UPDATED = '26 September 2026';

const SECTIONS = [
    {
        title: 'What we collect',
        items: [
            ['Your account', 'Your name and email address. If you sign up with a password, we store only a one-way hash of it, never the password itself. If you use Google sign-in, we receive your name, email and Google account ID from Google.'],
            ['Your profile', 'Age, gender, weight and height, and a profile photo if you upload one. These are used to work out your BMI, calorie target and calories burned.'],
            ['Your activity', 'Workouts, exercises, sets and personal records, goals, workout plans, streaks and badges, your food diary, water intake, BMI history and the sleep you log.'],
            ['Your runs', 'When you record a run, your GPS location is collected while the run is being tracked, and only after you allow location access. Nothing is tracked in the background.'],
            ['Friends and messages', 'The people you add as friends, friend requests, and the messages, challenges and invitations you send them. If you invite someone by email, we use their address only to send that one invitation.'],
        ],
    },
    {
        title: 'How we use it',
        items: [
            [null, 'Only to run FitTracker for you: saving and showing your history, calculating stats, targets and records, awarding badges, and sending account emails (email confirmation, password reset, welcome and goal-achieved messages).'],
            [null, 'We do not sell your data, share it with advertisers, or show ads. FitTracker has no advertising or analytics trackers.'],
        ],
    },
    {
        title: 'Your location and routes',
        items: [
            [null, 'Your route privacy zone hides the start and end of each run (200 m by default) so your home is not given away. You can change the zone, withdraw location consent, or delete all saved routes at any time in Account Settings.'],
        ],
    },
    {
        title: 'Who else is involved',
        items: [
            ['Google', 'Account emails are sent through Gmail. If you use Google sign-in, Google handles that sign-in.'],
            ['Map tiles', 'Maps load their tiles from a map provider, which sees your IP address and the map area being viewed, but none of your account details.'],
            ['Other members', 'People can find you by your name, or by your exact email address, to send a friend request. They see only your name and profile photo, never your email. Only your friends can message you, and your workouts and health data are never shown to them.'],
            ['Administrators', 'FitTracker administrators can see the list of accounts (name, email and role) and totals across all users, in order to run and support the service.'],
        ],
    },
    {
        title: 'Cookies and storage',
        items: [
            [null, 'One essential cookie keeps you signed in. It cannot be read by scripts and expires after 30 minutes of inactivity. Your browser also remembers a few preferences, such as light or dark mode and whether the sidebar is open. There are no tracking cookies.'],
        ],
    },
    {
        title: 'Keeping your data safe',
        items: [
            [null, 'All traffic is encrypted with HTTPS, passwords are hashed, and your data is only shown to your own signed-in account. No system is perfectly secure, but we work to protect your information and fix problems quickly.'],
        ],
    },
    {
        title: 'Your choices',
        items: [
            ['See and download', 'Everything you record is visible in the app, and you can download a PDF report of your workouts.'],
            ['Correct', 'Edit your profile, name, email and password at any time.'],
            ['Delete', 'Deleting your account in Account Settings permanently removes your account and everything linked to it, including routes, food logs, sleep logs, friendships, messages and your profile photo.'],
        ],
    },
    {
        title: 'Keeping data and children',
        items: [
            [null, 'We keep your data for as long as you have an account. FitTracker is not meant for children under 13, and we do not knowingly collect their data.'],
        ],
    },
    {
        title: 'Changes to this policy',
        items: [
            [null, 'If we change how we handle your data, we will update this page and its date. For important changes, we will also let you know by email or in the app.'],
        ],
    },
];

/** Public privacy policy, linked from the landing page and the sign-up form. */
function Privacy() {
    const { theme } = useAppTheme();
    const navigate = useNavigate();

    const text = { color: theme.mix(0.7), fontFamily: FONT, fontSize: '0.92rem', lineHeight: 1.7 };

    return (
        <Box sx={{ minHeight: '100vh', background: theme.bgGradient, fontFamily: FONT, position: 'relative' }}>
            <Blobs />
            <AppBar position="sticky" sx={stickyHeader(theme)}>
                <Toolbar>
                    <IconButton onClick={() => (window.history.length > 1 ? navigate(-1) : navigate('/'))}
                                sx={{ color: theme.mix(1), mr: 1 }} aria-label="Go back">
                        <ArrowBackIcon />
                    </IconButton>
                    <ShieldOutlinedIcon sx={{ color: '#4ecdc4', mr: 1 }} />
                    <Typography variant="h6" sx={{ color: theme.mix(1), fontWeight: 700 }}>Privacy Policy</Typography>
                </Toolbar>
            </AppBar>

            <Box sx={{ maxWidth: 760, mx: 'auto', py: 4, px: 2, position: 'relative', zIndex: 1, textAlign: 'left' }}>
                <Typography sx={{ color: theme.mix(1), fontWeight: 700, fontSize: '1.5rem', fontFamily: FONT }}>
                    Your data stays yours
                </Typography>
                <Typography sx={{ ...text, mt: 1 }}>
                    This page explains what FitTracker collects, why, and how you stay in control of it.
                </Typography>
                <Typography sx={{ color: theme.mix(0.4), fontSize: '0.8rem', fontFamily: FONT, mt: 1, mb: 3 }}>
                    Last updated {LAST_UPDATED}
                </Typography>

                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                    {SECTIONS.map((section) => (
                        <Card key={section.title} component="section" sx={glassCard(theme)}>
                            <CardContent sx={{ p: { xs: 2.5, sm: 3 } }}>
                                <Typography component="h2" sx={{ ...sectionTitle(theme), mb: 1 }}>{section.title}</Typography>
                                {section.items.map(([label, body]) => (
                                    <Typography key={body} sx={{ ...text, mt: 1 }}>
                                        {label && <Box component="strong" sx={{ color: theme.mix(0.95) }}>{label}. </Box>}
                                        {body}
                                    </Typography>
                                ))}
                            </CardContent>
                        </Card>
                    ))}

                    <Card component="section" sx={glassCard(theme)}>
                        <CardContent sx={{ p: { xs: 2.5, sm: 3 } }}>
                            <Typography component="h2" sx={{ ...sectionTitle(theme), mb: 1 }}>Contact</Typography>
                            <Typography sx={text}>
                                Questions or requests about your data? Email{' '}
                                <Box component="a" href={`mailto:${CONTACT_EMAIL}`} sx={{ color: '#e94560', fontWeight: 600 }}>
                                    {CONTACT_EMAIL}
                                </Box>
                                {' '}or call{' '}
                                <PhoneContact sx={{ color: '#e94560', fontWeight: 600, whiteSpace: 'nowrap', textDecoration: 'underline' }} />. Signed-in users can also manage or delete their data in Account Settings.
                            </Typography>
                        </CardContent>
                    </Card>
                </Box>
            </Box>
        </Box>
    );
}

export default Privacy;
