import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import API, { ACTIVITY_EVENT } from '../services/api';
import { errorMessage } from '../services/errors';
import { useAppTheme } from '../context/ThemeContext';
import { FONT, glassCard } from '../theme/styles';
import Blobs from '../components/Glass';
import {
    Alert, Box, Typography, Card, CardContent, Button, LinearProgress, Tooltip,
} from '@mui/material';
import LocalFireDepartmentIcon from '@mui/icons-material/LocalFireDepartment';
import FitnessCenterIcon from '@mui/icons-material/FitnessCenter';
import TrackChangesIcon from '@mui/icons-material/TrackChanges';
import EmojiEventsIcon from '@mui/icons-material/EmojiEvents';
import EventNoteIcon from '@mui/icons-material/EventNote';
import CheckIcon from '@mui/icons-material/Check';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';

// Same daily goal as the Water page.
const WATER_GOAL_ML = 2500;

const greetingFor = (hour) => (hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening');
const isoDay = (d) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;

/** Minutes trained on each of the last 7 days, oldest first, ending today. */
function lastSevenDays(workouts) {
    const minutes = new Map();
    for (const w of workouts) {
        minutes.set(w.date, (minutes.get(w.date) || 0) + (w.duration || 0));
    }
    const days = [];
    for (let i = 6; i >= 0; i--) {
        const d = new Date();
        d.setDate(d.getDate() - i);
        const key = isoDay(d);
        days.push({
            key,
            letter: d.toLocaleDateString(undefined, { weekday: 'narrow' }),
            label: d.toLocaleDateString(undefined, { weekday: 'long' }),
            minutes: minutes.get(key) || 0,
        });
    }
    return days;
}

/** A progress ring that opens the page it measures. */
function Ring({ value, max, color, title, caption, to, done }) {
    const { theme } = useAppTheme();
    const size = 96;
    const stroke = 9;
    const r = (size - stroke) / 2;
    const circumference = 2 * Math.PI * r;
    const pct = Math.max(0, Math.min(value / max, 1));

    return (
        <Box component={Link} to={to} sx={{
            display: 'flex', flexDirection: 'column', alignItems: 'center', textDecoration: 'none',
            p: 1, borderRadius: 3, transition: 'background 0.15s', '&:hover': { background: theme.mix(0.05) },
        }}>
            <Box sx={{ position: 'relative', width: size, height: size }}>
                <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} aria-hidden="true">
                    <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={theme.mix(0.1)} strokeWidth={stroke} />
                    <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={color} strokeWidth={stroke}
                            strokeLinecap="round" strokeDasharray={circumference}
                            strokeDashoffset={circumference * (1 - pct)}
                            transform={`rotate(-90 ${size / 2} ${size / 2})`}
                            style={{ transition: 'stroke-dashoffset 0.8s ease' }} />
                </svg>
                <Box sx={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    {done
                        ? <CheckIcon sx={{ color, fontSize: 34 }} />
                        : <Typography sx={{ color: theme.mix(1), fontWeight: 700, fontFamily: FONT, fontSize: '0.95rem' }}>
                            {Math.round(pct * 100)}%
                        </Typography>}
                </Box>
            </Box>
            <Typography sx={{ color: theme.mix(1), fontWeight: 700, mt: 1, fontFamily: FONT }}>{title}</Typography>
            <Typography sx={{ color: theme.mix(0.5), fontSize: '0.78rem', fontFamily: FONT }}>{caption}</Typography>
        </Box>
    );
}

function StatCard({ Icon, color, label, value, caption, to }) {
    const { theme } = useAppTheme();
    return (
        <Card component={Link} to={to} sx={{
            ...glassCard(theme), display: 'block', textDecoration: 'none',
            transition: 'transform 0.2s, border-color 0.2s',
            '&:hover': { transform: 'translateY(-3px)', borderColor: color },
        }}>
            <CardContent sx={{ p: 2.25, '&:last-child': { pb: 2.25 } }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Box sx={{
                        width: 32, height: 32, borderRadius: 2, display: 'flex', alignItems: 'center', justifyContent: 'center',
                        background: `${color}22`, color,
                    }}>
                        <Icon sx={{ fontSize: 19 }} />
                    </Box>
                    <Typography sx={{ color: theme.mix(0.6), fontSize: '0.85rem', fontWeight: 600, fontFamily: FONT }}>{label}</Typography>
                </Box>
                <Typography sx={{ color: theme.mix(1), fontWeight: 800, fontSize: '1.7rem', mt: 1.25, lineHeight: 1.1, fontFamily: FONT }}>
                    {value}
                </Typography>
                <Typography sx={{ color: theme.mix(0.45), fontSize: '0.78rem', mt: 0.5, fontFamily: FONT }}>{caption}</Typography>
            </CardContent>
        </Card>
    );
}

function Dashboard() {
    const { theme } = useAppTheme();
    // The backend aggregates most of this screen into one call; the week chart uses the workout list.
    const [summary, setSummary] = useState(null);
    const [workouts, setWorkouts] = useState([]);
    const [verifyNotice, setVerifyNotice] = useState('');
    const [resending, setResending] = useState(false);

    const name = summary?.name || localStorage.getItem('name') || '';
    const firstName = name.split(' ')[0];

    useEffect(() => {
        let ignore = false;
        API.get('/dashboard/summary')
            .then((res) => { if (!ignore) setSummary(res.data); })
            .catch((err) => console.error('Error fetching dashboard summary', err))
            // Celebrates any badge earned since the last visit.
            .finally(() => window.dispatchEvent(new Event(ACTIVITY_EVENT)));
        API.get('/workouts')
            .then((res) => { if (!ignore) setWorkouts(res.data); })
            .catch(() => {});
        return () => { ignore = true; };
    }, []);

    const resendVerification = async () => {
        setResending(true);
        try {
            const res = await API.post('/auth/resend-verification');
            setVerifyNotice(res.data?.message || 'Verification link sent.');
        } catch (err) {
            setVerifyNotice(errorMessage(err, 'Could not send the link. Please try again in a minute.'));
        } finally {
            setResending(false);
        }
    };

    const now = new Date();
    const week = lastSevenDays(workouts);
    const weekMax = Math.max(30, ...week.map((d) => d.minutes));
    const weekMinutes = week.reduce((sum, d) => sum + d.minutes, 0);
    const weekSessions = workouts.filter((w) => week.some((d) => d.key === w.date)).length;
    const trainedToday = week[week.length - 1].minutes > 0;

    const eaten = summary?.caloriesEatenToday ?? 0;
    const target = summary?.calorieTarget ?? 2000;
    const water = summary?.waterTodayMl ?? 0;

    const journeySteps = [
        { label: 'Complete your profile', done: !!summary?.profileComplete, path: '/profile' },
        { label: 'Set a fitness goal', done: (summary?.goalCount ?? 0) > 0, path: '/goals' },
        { label: 'Log your first workout', done: (summary?.workoutCount ?? 0) > 0, path: '/workouts' },
        { label: 'Track your water', done: !!summary?.hasWaterLog, path: '/water-intake' },
    ];
    const completedSteps = journeySteps.filter((s) => s.done).length;

    const sectionLabel = { color: theme.mix(1), fontWeight: 700, fontFamily: FONT, fontSize: '1rem' };

    return (
        <Box sx={{ minHeight: '100vh', background: theme.bgGradient, fontFamily: FONT, position: 'relative' }}>
            <Blobs />

            <Box sx={{
                position: 'relative', zIndex: 1, maxWidth: 1100, mx: 'auto', px: { xs: 2, md: 3 }, py: 3,
                display: 'flex', flexDirection: 'column', gap: 2.5, textAlign: 'left',
            }}>
                <Box>
                    <Typography sx={{ color: theme.mix(1), fontWeight: 800, fontSize: { xs: '1.5rem', md: '1.9rem' }, fontFamily: FONT, lineHeight: 1.2 }}>
                        {greetingFor(now.getHours())}{firstName ? `, ${firstName}` : ''}
                    </Typography>
                    <Typography sx={{ color: theme.mix(0.5), fontSize: '0.9rem', fontFamily: FONT, mt: 0.5 }}>
                        {now.toLocaleDateString(undefined, { weekday: 'long', day: 'numeric', month: 'long' })}
                    </Typography>
                </Box>
                {summary && !summary.emailVerified && (
                    <Alert severity="warning"
                           action={<Button color="inherit" size="small" disabled={resending} onClick={resendVerification}>Resend link</Button>}>
                        Please confirm your email address. We sent a link to {localStorage.getItem('email')}.
                        {verifyNotice && <Typography sx={{ fontSize: '0.8rem', mt: 0.5 }}>{verifyNotice}</Typography>}
                    </Alert>
                )}

                {/* Getting started, until every step is done */}
                {summary && completedSteps < journeySteps.length && (
                    <Card sx={glassCard(theme)}>
                        <CardContent sx={{ p: 2.5, '&:last-child': { pb: 2.5 } }}>
                            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1.25 }}>
                                <Typography sx={sectionLabel}>Get started</Typography>
                                <Typography sx={{ color: '#4ecdc4', fontWeight: 700, fontSize: '0.85rem', fontFamily: FONT }}>
                                    {completedSteps} of {journeySteps.length} done
                                </Typography>
                            </Box>
                            <LinearProgress variant="determinate" value={(completedSteps / journeySteps.length) * 100}
                                            sx={{ height: 6, borderRadius: 3, mb: 2, background: theme.mix(0.1), '& .MuiLinearProgress-bar': { background: '#4ecdc4' } }} />
                            <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)', md: 'repeat(4, 1fr)' }, gap: 1 }}>
                                {journeySteps.map((step) => (
                                    <Box key={step.label} component={Link} to={step.path} sx={{
                                        display: 'flex', alignItems: 'center', gap: 1, p: 1.25, borderRadius: 2, textDecoration: 'none',
                                        border: `1px solid ${step.done ? 'rgba(78,205,196,0.4)' : theme.mix(0.1)}`,
                                        background: step.done ? 'rgba(78,205,196,0.1)' : theme.mix(0.03),
                                        '&:hover': { background: theme.mix(0.07) },
                                    }}>
                                        <Box sx={{
                                            width: 22, height: 22, borderRadius: '50%', flexShrink: 0,
                                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                                            background: step.done ? '#4ecdc4' : 'transparent',
                                            border: step.done ? 'none' : `2px solid ${theme.mix(0.25)}`,
                                        }}>
                                            {step.done && <CheckIcon sx={{ fontSize: 15, color: '#1a1a2e' }} />}
                                        </Box>
                                        <Typography sx={{
                                            color: step.done ? theme.mix(0.5) : theme.mix(0.9), fontSize: '0.85rem', fontWeight: 600, fontFamily: FONT,
                                            textDecoration: step.done ? 'line-through' : 'none',
                                        }}>
                                            {step.label}
                                        </Typography>
                                    </Box>
                                ))}
                            </Box>
                        </CardContent>
                    </Card>
                )}

                {/* Today and this week */}
                <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '7fr 5fr' }, gap: 2.5 }}>
                    <Card sx={glassCard(theme)}>
                        <CardContent sx={{ p: 2.5, '&:last-child': { pb: 2 } }}>
                            <Typography sx={sectionLabel}>Today</Typography>
                            <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', mt: 1 }}>
                                <Ring value={eaten} max={target} color="#ff6b35" title={`${eaten.toLocaleString()} kcal`}
                                      caption={`of ${target.toLocaleString()} eaten`} to="/nutrition" />
                                <Ring value={water} max={WATER_GOAL_ML} color="#45b7d1" title={`${water.toLocaleString()} ml`}
                                      caption={`of ${WATER_GOAL_ML.toLocaleString()} water`} to="/water-intake" />
                                <Ring value={trainedToday ? 1 : 0} max={1} color="#e94560" done={trainedToday}
                                      title={trainedToday ? `${week[6].minutes} min` : 'Not yet'}
                                      caption={trainedToday ? 'trained today' : 'no workout today'} to="/workouts" />
                            </Box>
                        </CardContent>
                    </Card>

                    <Card sx={glassCard(theme)}>
                        <CardContent sx={{ p: 2.5, '&:last-child': { pb: 2 } }}>
                            <Box sx={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between' }}>
                                <Typography sx={sectionLabel}>This week</Typography>
                                <Typography sx={{ color: theme.mix(0.5), fontSize: '0.8rem', fontFamily: FONT }}>
                                    {weekMinutes} min in {weekSessions} {weekSessions === 1 ? 'session' : 'sessions'}
                                </Typography>
                            </Box>
                            <Box component={Link} to="/analytics" aria-label="Open analytics" sx={{
                                display: 'flex', alignItems: 'flex-end', gap: 1, height: 130, mt: 2, textDecoration: 'none',
                            }}>
                                {week.map((day, i) => (
                                    <Tooltip key={day.key} title={`${day.label}, ${day.minutes} min`}>
                                        <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', height: '100%', justifyContent: 'flex-end', gap: 0.75 }}>
                                            <Box sx={{
                                                width: '100%', maxWidth: 30, borderRadius: '6px 6px 3px 3px',
                                                height: `${Math.max(6, (day.minutes / weekMax) * 100)}%`,
                                                background: day.minutes > 0 ? '#e94560' : theme.mix(0.1),
                                                opacity: day.minutes > 0 && i < 6 ? 0.75 : 1,
                                                transition: 'height 0.6s ease',
                                            }} />
                                            <Typography sx={{
                                                color: i === 6 ? theme.mix(1) : theme.mix(0.45), fontSize: '0.72rem',
                                                fontWeight: i === 6 ? 700 : 500, fontFamily: FONT,
                                            }}>
                                                {day.letter}
                                            </Typography>
                                        </Box>
                                    </Tooltip>
                                ))}
                            </Box>
                        </CardContent>
                    </Card>
                </Box>

                {/* Key numbers */}
                <Box sx={{ display: 'grid', gridTemplateColumns: { xs: 'repeat(2, 1fr)', md: 'repeat(4, 1fr)' }, gap: 2.5 }}>
                    <StatCard Icon={LocalFireDepartmentIcon} color="#ffa726" label="Streak" to="/achievements"
                              value={`${summary?.currentStreak ?? 0} ${summary?.currentStreak === 1 ? 'day' : 'days'}`}
                              caption={`Best ${summary?.longestStreak ?? 0} days`} />
                    <StatCard Icon={FitnessCenterIcon} color="#e94560" label="Workouts" to="/workouts"
                              value={summary?.workoutCount ?? 0}
                              caption={`${(summary?.totalCaloriesBurned ?? 0).toLocaleString()} kcal burned`} />
                    <StatCard Icon={TrackChangesIcon} color="#4ecdc4" label="Active goals" to="/goals"
                              value={summary?.activeGoalCount ?? 0}
                              caption={(summary?.activeGoalCount ?? 0) > 0 ? 'Keep pushing' : 'Set one to aim for'} />
                    <StatCard Icon={EmojiEventsIcon} color="#ffd166" label="Badges" to="/achievements"
                              value={summary?.badgesEarned ?? 0} caption="Earned so far" />
                </Box>

                {/* Next up */}
                <Card component={Link} to="/plans" sx={{
                    ...glassCard(theme), display: 'block', textDecoration: 'none',
                    transition: 'border-color 0.2s', '&:hover': { borderColor: '#66bb6a' },
                }}>
                    <CardContent sx={{ p: 2.5, '&:last-child': { pb: 2.5 }, display: 'flex', alignItems: 'center', gap: 2 }}>
                        <Box sx={{
                            width: 44, height: 44, borderRadius: 2.5, flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center',
                            background: 'rgba(102,187,106,0.15)', color: '#66bb6a',
                        }}>
                            <EventNoteIcon />
                        </Box>
                        <Box sx={{ flex: 1, minWidth: 0 }}>
                            {summary?.activePlanName ? (
                                <>
                                    <Typography sx={{ color: theme.mix(1), fontWeight: 700, fontFamily: FONT }}>
                                        {summary.nextPlanSession || 'Plan complete'}
                                    </Typography>
                                    <Typography sx={{ color: theme.mix(0.55), fontSize: '0.85rem', fontFamily: FONT }}>
                                        Next up in {summary.activePlanName}, {summary.planProgressPercent ?? 0}% done
                                    </Typography>
                                    <LinearProgress variant="determinate" value={summary.planProgressPercent ?? 0}
                                                    sx={{ mt: 1, height: 5, borderRadius: 3, maxWidth: 360, background: theme.mix(0.1), '& .MuiLinearProgress-bar': { background: '#66bb6a' } }} />
                                </>
                            ) : (
                                <>
                                    <Typography sx={{ color: theme.mix(1), fontWeight: 700, fontFamily: FONT }}>Follow a workout plan</Typography>
                                    <Typography sx={{ color: theme.mix(0.55), fontSize: '0.85rem', fontFamily: FONT }}>
                                        Pick a plan for your goal and we'll line up every session for you.
                                    </Typography>
                                </>
                            )}
                        </Box>
                        <ChevronRightIcon sx={{ color: theme.mix(0.4) }} />
                    </CardContent>
                </Card>
            </Box>
        </Box>
    );
}

export default Dashboard;
