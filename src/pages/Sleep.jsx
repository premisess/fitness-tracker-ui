import { useEffect, useState } from 'react';
import {
    Alert, Box, Button, Card, CardContent, CircularProgress, IconButton, Rating, TextField, Tooltip, Typography,
} from '@mui/material';
import BedtimeIcon from '@mui/icons-material/Bedtime';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutlined';
import NightsStayIcon from '@mui/icons-material/NightsStay';
import TimelapseIcon from '@mui/icons-material/Timelapse';
import FlagIcon from '@mui/icons-material/Flag';
import StarIcon from '@mui/icons-material/Star';
import API from '../services/api';
import { errorMessage } from '../services/errors';
import { useAppTheme } from '../context/ThemeContext';
import Blobs from '../components/Glass';
import PageHeader from '../components/PageHeader';
import { FONT, glassCard, fieldStyle, sectionTitle } from '../theme/styles';

const LAVENDER = '#a29bfe';
const QUALITY = ['', 'Poor', 'Restless', 'Okay', 'Good', 'Great'];

const pad = (n) => String(n).padStart(2, '0');
// The value format of <input type="datetime-local">, in local time.
const localInput = (d) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;

/** Last night's usual times as a starting point: 22:30 yesterday to 06:30 today. */
function defaultTimes() {
    const wake = new Date();
    wake.setHours(6, 30, 0, 0);
    const bed = new Date(wake);
    bed.setDate(bed.getDate() - 1);
    bed.setHours(22, 30, 0, 0);
    return { bedTime: localInput(bed), wakeTime: localInput(wake) };
}

const hoursAndMinutes = (minutes) => {
    if (minutes == null) return '0 h';
    const h = Math.floor(minutes / 60);
    const m = minutes % 60;
    return m ? `${h} h ${m} min` : `${h} h`;
};
const clock = (iso) => new Date(iso).toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' });
const dayLabel = (iso) => new Date(`${iso}T12:00:00`).toLocaleDateString(undefined, { weekday: 'short', day: 'numeric', month: 'short' });

function StatCard({ Icon, color, label, value, caption }) {
    const { theme } = useAppTheme();
    return (
        <Card sx={glassCard(theme)}>
            <CardContent sx={{ p: 2.25, '&:last-child': { pb: 2.25 } }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Box sx={{ width: 32, height: 32, borderRadius: 2, display: 'flex', alignItems: 'center', justifyContent: 'center', background: `${color}22`, color }}>
                        <Icon sx={{ fontSize: 19 }} />
                    </Box>
                    <Typography sx={{ color: theme.mix(0.6), fontSize: '0.85rem', fontWeight: 600, fontFamily: FONT }}>{label}</Typography>
                </Box>
                <Typography sx={{ color: theme.mix(1), fontWeight: 800, fontSize: '1.45rem', mt: 1.25, lineHeight: 1.15, fontFamily: FONT }}>{value}</Typography>
                <Typography sx={{ color: theme.mix(0.45), fontSize: '0.78rem', mt: 0.5, fontFamily: FONT }}>{caption}</Typography>
            </CardContent>
        </Card>
    );
}

function Sleep() {
    const { theme } = useAppTheme();
    const [summary, setSummary] = useState(null);
    const [form, setForm] = useState(() => ({ ...defaultTimes(), quality: 4, notes: '' }));
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState('');
    const [notice, setNotice] = useState('');
    const [reloadKey, setReloadKey] = useState(0);

    useEffect(() => {
        let ignore = false;
        API.get('/sleep', { params: { days: 14 } })
            .then((res) => { if (!ignore) setSummary(res.data); })
            .catch((err) => { if (!ignore) setError(errorMessage(err, 'Could not load your sleep')); });
        return () => { ignore = true; };
    }, [reloadKey]);

    const save = async (e) => {
        e.preventDefault();
        setError('');
        setNotice('');
        setSaving(true);
        try {
            const res = await API.post('/sleep', {
                bedTime: form.bedTime, wakeTime: form.wakeTime,
                quality: form.quality || null, notes: form.notes,
            });
            setNotice(`Saved ${hoursAndMinutes(res.data.minutes)} of sleep.`);
            setForm((f) => ({ ...f, notes: '' }));
            setReloadKey((k) => k + 1);
        } catch (err) {
            setError(errorMessage(err, 'Could not save your sleep'));
        } finally {
            setSaving(false);
        }
    };

    const remove = async (id) => {
        try {
            await API.delete(`/sleep/${id}`);
            setReloadKey((k) => k + 1);
        } catch (err) {
            setError(errorMessage(err, 'Could not delete that night'));
        }
    };

    const lastNight = summary?.entries?.[0];
    const goal = summary?.goalMinutes ?? 480;

    // The last 14 mornings, oldest first, with any logged sleep.
    const byDate = new Map((summary?.entries || []).map((e) => [e.sleepDate, e]));
    const nights = Array.from({ length: 14 }, (_, i) => {
        const d = new Date();
        d.setDate(d.getDate() - (13 - i));
        const key = `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
        return { key, letter: d.toLocaleDateString(undefined, { weekday: 'narrow' }), entry: byDate.get(key) };
    });
    const chartMax = Math.max(goal + 60, ...nights.map((n) => n.entry?.minutes || 0));
    const inputStyle = { ...fieldStyle(theme), mb: 0 };

    return (
        <Box sx={{ minHeight: '100vh', background: theme.bgGradient, fontFamily: FONT, position: 'relative' }}>
            <Blobs />
            <Box sx={{ maxWidth: 900, mx: 'auto', py: 3, px: 2, position: 'relative', zIndex: 1, textAlign: 'left' }}>
                <PageHeader>
                    <BedtimeIcon sx={{ color: LAVENDER, mr: 1 }} />
                    <Typography variant="h6">Sleep</Typography>
                </PageHeader>

                {error && <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError('')}>{error}</Alert>}
                {notice && <Alert severity="success" sx={{ mb: 2 }} onClose={() => setNotice('')}>{notice}</Alert>}

                {!summary && !error && <Box sx={{ textAlign: 'center', py: 6 }}><CircularProgress sx={{ color: LAVENDER }} /></Box>}

                {summary && (
                    <>
                        <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: 'repeat(3, 1fr)' }, gap: 2, mb: 2.5 }}>
                            <StatCard Icon={NightsStayIcon} color={LAVENDER} label="Last night"
                                      value={lastNight ? hoursAndMinutes(lastNight.minutes) : 'Not logged'}
                                      caption={lastNight ? `${clock(lastNight.bedTime)} to ${clock(lastNight.wakeTime)}` : 'Log it below'} />
                            <StatCard Icon={TimelapseIcon} color="#45b7d1" label="7 day average"
                                      value={summary.averageMinutes != null ? hoursAndMinutes(summary.averageMinutes) : 'No data'}
                                      caption={`${summary.nightsLoggedThisWeek} of 7 nights logged`} />
                            <StatCard Icon={FlagIcon} color="#4ecdc4" label={`Goal ${goal / 60} h`}
                                      value={`${summary.nightsOnGoalThisWeek} of 7`}
                                      caption="nights on goal this week" />
                        </Box>

                        <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '5fr 7fr' }, gap: 2.5, mb: 2.5 }}>
                            <Card sx={glassCard(theme)}>
                                <CardContent component="form" onSubmit={save} sx={{ p: 2.5, '&:last-child': { pb: 2.5 } }}>
                                    <Typography sx={{ ...sectionTitle(theme), mb: 2 }}>Log a night</Typography>
                                    <Box sx={{ display: 'grid', gap: 2 }}>
                                        <TextField label="Went to bed" type="datetime-local" size="small" required value={form.bedTime}
                                                   onChange={(e) => setForm({ ...form, bedTime: e.target.value })}
                                                   slotProps={{ inputLabel: { shrink: true } }} sx={inputStyle} />
                                        <TextField label="Woke up" type="datetime-local" size="small" required value={form.wakeTime}
                                                   onChange={(e) => setForm({ ...form, wakeTime: e.target.value })}
                                                   slotProps={{ inputLabel: { shrink: true } }} sx={inputStyle} />
                                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                                            <Typography sx={{ color: theme.mix(0.6), fontSize: '0.85rem', fontFamily: FONT }}>Quality</Typography>
                                            <Rating value={form.quality} onChange={(_, v) => setForm({ ...form, quality: v })}
                                                    icon={<StarIcon fontSize="inherit" sx={{ color: LAVENDER }} />}
                                                    emptyIcon={<StarIcon fontSize="inherit" sx={{ color: theme.mix(0.2) }} />} />
                                            <Typography sx={{ color: theme.mix(0.5), fontSize: '0.8rem', fontFamily: FONT }}>{QUALITY[form.quality || 0]}</Typography>
                                        </Box>
                                        <TextField label="Notes (optional)" size="small" value={form.notes} inputProps={{ maxLength: 280 }}
                                                   onChange={(e) => setForm({ ...form, notes: e.target.value })} sx={inputStyle} />
                                        <Button type="submit" variant="contained" disabled={saving}
                                                sx={{ borderRadius: 999, textTransform: 'none', fontWeight: 700, fontFamily: FONT, background: LAVENDER, color: '#1a1a2e', boxShadow: 'none', '&:hover': { background: '#8c84f5', boxShadow: 'none' } }}>
                                            {saving ? <CircularProgress size={20} color="inherit" /> : 'Save night'}
                                        </Button>
                                    </Box>
                                </CardContent>
                            </Card>

                            <Card sx={glassCard(theme)}>
                                <CardContent sx={{ p: 2.5, '&:last-child': { pb: 2 } }}>
                                    <Box sx={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between' }}>
                                        <Typography sx={sectionTitle(theme)}>Last 2 weeks</Typography>
                                        <Typography sx={{ color: theme.mix(0.5), fontSize: '0.78rem', fontFamily: FONT }}>line shows your {goal / 60} h goal</Typography>
                                    </Box>
                                    <Box sx={{ position: 'relative', height: 150, mt: 2 }}>
                                        <Box sx={{ position: 'absolute', left: 0, right: 0, bottom: `${(goal / chartMax) * 100}%`, borderTop: `1px dashed ${theme.mix(0.3)}` }} />
                                        <Box sx={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'flex-end', gap: 0.75 }}>
                                            {nights.map((n) => (
                                                <Tooltip key={n.key} title={n.entry ? `${dayLabel(n.key)}, ${hoursAndMinutes(n.entry.minutes)}` : `${dayLabel(n.key)}, not logged`}>
                                                    <Box sx={{
                                                        flex: 1, borderRadius: '5px 5px 2px 2px',
                                                        height: n.entry ? `${(n.entry.minutes / chartMax) * 100}%` : '4%',
                                                        background: n.entry ? (n.entry.minutes >= goal ? '#4ecdc4' : LAVENDER) : theme.mix(0.08),
                                                        transition: 'height 0.6s ease',
                                                    }} />
                                                </Tooltip>
                                            ))}
                                        </Box>
                                    </Box>
                                    <Box sx={{ display: 'flex', gap: 0.75, mt: 0.75 }}>
                                        {nights.map((n) => (
                                            <Typography key={n.key} sx={{ flex: 1, textAlign: 'center', color: theme.mix(0.45), fontSize: '0.68rem', fontFamily: FONT }}>{n.letter}</Typography>
                                        ))}
                                    </Box>
                                </CardContent>
                            </Card>
                        </Box>

                        <Card sx={glassCard(theme)}>
                            <CardContent sx={{ p: 2.5, '&:last-child': { pb: 1.5 } }}>
                                <Typography sx={{ ...sectionTitle(theme), mb: 1 }}>Recent nights</Typography>
                                {summary.entries.length === 0 ? (
                                    <Typography sx={{ color: theme.mix(0.5), fontSize: '0.9rem', fontFamily: FONT, py: 2 }}>
                                        Log your first night above to start seeing your sleep pattern.
                                    </Typography>
                                ) : summary.entries.map((e) => (
                                    <Box key={e.id} sx={{
                                        display: 'flex', alignItems: 'center', gap: 2, py: 1.25,
                                        borderTop: `1px solid ${theme.mix(0.07)}`, '&:first-of-type': { borderTop: 'none' },
                                    }}>
                                        <Box sx={{ minWidth: 110 }}>
                                            <Typography sx={{ color: theme.mix(0.95), fontWeight: 700, fontSize: '0.9rem', fontFamily: FONT }}>{dayLabel(e.sleepDate)}</Typography>
                                            <Typography sx={{ color: theme.mix(0.5), fontSize: '0.78rem', fontFamily: FONT }}>{clock(e.bedTime)} to {clock(e.wakeTime)}</Typography>
                                        </Box>
                                        <Typography sx={{ color: e.minutes >= goal ? '#4ecdc4' : theme.mix(0.9), fontWeight: 700, fontFamily: FONT, minWidth: 90 }}>
                                            {hoursAndMinutes(e.minutes)}
                                        </Typography>
                                        <Box sx={{ flex: 1, minWidth: 0 }}>
                                            {e.quality && <Rating value={e.quality} readOnly size="small"
                                                                  icon={<StarIcon fontSize="inherit" sx={{ color: LAVENDER }} />}
                                                                  emptyIcon={<StarIcon fontSize="inherit" sx={{ color: theme.mix(0.15) }} />} />}
                                            {e.notes && <Typography noWrap sx={{ color: theme.mix(0.5), fontSize: '0.78rem', fontFamily: FONT }}>{e.notes}</Typography>}
                                        </Box>
                                        <Tooltip title="Delete">
                                            <IconButton size="small" onClick={() => remove(e.id)} aria-label={`Delete ${dayLabel(e.sleepDate)}`} sx={{ color: theme.mix(0.4), '&:hover': { color: '#e94560' } }}>
                                                <DeleteOutlineIcon fontSize="small" />
                                            </IconButton>
                                        </Tooltip>
                                    </Box>
                                ))}
                            </CardContent>
                        </Card>
                    </>
                )}
            </Box>
        </Box>
    );
}

export default Sleep;
