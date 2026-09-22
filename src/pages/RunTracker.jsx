import { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import API from '../services/api';
import { errorMessage } from '../services/errors';
import { useAppTheme } from '../context/ThemeContext';
import {
    Alert, AppBar, Box, Button, Card, CardContent, Chip, CircularProgress, Dialog, DialogActions,
    DialogContent, DialogContentText, DialogTitle, IconButton, TextField, Toolbar, Typography,
} from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import DirectionsRunIcon from '@mui/icons-material/DirectionsRun';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import PauseIcon from '@mui/icons-material/Pause';
import StopIcon from '@mui/icons-material/Stop';
import LocationOnIcon from '@mui/icons-material/LocationOn';
import HistoryIcon from '@mui/icons-material/History';
import RouteMap from '../components/RouteMap';
import Blobs from '../components/Glass';
import { FONT, glassCard, fieldStyle, sectionTitle } from '../theme/styles';
import {
    GPS_ACTIVITY_TYPES, MAX_ACCURACY_M, createActivityTracker,
    formatDistance, formatDuration, formatPace, paceOrSpeed, usesSpeed,
} from '../utils/geo';

// An in-progress activity is mirrored here so a reload or crash doesn't lose it.
const DRAFT_KEY = 'fittracker.unsavedActivity';
// Recording starts automatically once a fix is at least this accurate.
const GOOD_ACCURACY_M = 30;

const GEO_ERRORS = {
    1: 'Location permission was denied. Allow location access for this site in your browser settings, then try again.',
    2: "Your position isn't available right now. Move outdoors with a clear view of the sky.",
    3: 'Getting a GPS fix is taking a while. Keep the page open outdoors.',
};

function readDraft() {
    try {
        const raw = localStorage.getItem(DRAFT_KEY);
        const draft = raw ? JSON.parse(raw) : null;
        return draft?.points?.length ? draft : null;
    } catch {
        return null;
    }
}

function writeDraft(draft) {
    try {
        localStorage.setItem(DRAFT_KEY, JSON.stringify(draft));
    } catch {
        // Storage full or blocked: recording carries on in memory.
    }
}

function clearDraft() {
    try {
        localStorage.removeItem(DRAFT_KEY);
    } catch {
        // Nothing to clear.
    }
}

function localDate(ms) {
    const d = new Date(ms);
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

function stopWatch(watchIdRef) {
    if (watchIdRef.current != null) {
        navigator.geolocation.clearWatch(watchIdRef.current);
        watchIdRef.current = null;
    }
}

// Keeps the screen on while recording where the browser supports it; browsers suspend GPS when it locks.
async function acquireWakeLock(wakeLockRef) {
    try {
        if ('wakeLock' in navigator && !wakeLockRef.current) {
            const lock = await navigator.wakeLock.request('screen');
            wakeLockRef.current = lock;
            lock.addEventListener('release', () => { wakeLockRef.current = null; });
        }
    } catch {
        // Unsupported or refused: recording still works, the screen may just dim.
    }
}

function releaseWakeLock(wakeLockRef) {
    wakeLockRef.current?.release().catch(() => {});
    wakeLockRef.current = null;
}

function RunTracker() {
    const { theme } = useAppTheme();
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    // Started from a workout plan: the saved run completes the plan's next session.
    const countsForPlan = searchParams.get('planSession') === '1';

    const [settings, setSettings] = useState(null);
    const [loadError, setLoadError] = useState('');
    const [draft, setDraft] = useState(readDraft);

    const [type, setType] = useState('Running');
    const [phase, setPhase] = useState('idle'); // idle | acquiring | recording | paused | review
    const [points, setPoints] = useState([]);
    const [stats, setStats] = useState({ distance: 0, moving: 0, pace: null });
    const [lastFix, setLastFix] = useState(null);
    const [activeMsBefore, setActiveMsBefore] = useState(0);
    const [segmentStartedAt, setSegmentStartedAt] = useState(null);
    const [now, setNow] = useState(0);
    const [notes, setNotes] = useState('');
    const [error, setError] = useState('');
    const [saving, setSaving] = useState(false);
    const [consenting, setConsenting] = useState(false);
    const [confirmDiscard, setConfirmDiscard] = useState(false);

    // Geolocation callbacks outlive renders, so everything they touch lives in refs.
    const watchIdRef = useRef(null);
    const wakeLockRef = useRef(null);
    const trackerRef = useRef(null);
    const pointsRef = useRef([]);
    const segRef = useRef(0);
    const phaseRef = useRef('idle');
    const typeRef = useRef('Running');
    const startedAtRef = useRef(null);

    useEffect(() => {
        let ignore = false;
        API.get('/account/location-settings')
            .then((res) => { if (!ignore) setSettings(res.data); })
            .catch((err) => { if (!ignore) setLoadError(errorMessage(err, 'Could not load your location settings')); });
        return () => { ignore = true; };
    }, []);

    useEffect(() => {
        if (phase !== 'recording') return undefined;
        const id = setInterval(() => setNow(Date.now()), 1000);
        return () => clearInterval(id);
    }, [phase]);

    useEffect(() => {
        const onVisibility = () => {
            if (document.visibilityState === 'visible' && phaseRef.current === 'recording') {
                acquireWakeLock(wakeLockRef);
            }
        };
        document.addEventListener('visibilitychange', onVisibility);
        return () => {
            document.removeEventListener('visibilitychange', onVisibility);
            stopWatch(watchIdRef);
            releaseWakeLock(wakeLockRef);
        };
    }, []);

    const changePhase = (next) => {
        phaseRef.current = next;
        setPhase(next);
    };

    const persistDraft = (status, activeMs) => writeDraft({
        type: typeRef.current,
        startedAt: startedAtRef.current,
        points: pointsRef.current,
        seg: segRef.current,
        activeMs: activeMs ?? null,
        status,
        savedAt: Date.now(),
    });

    const beginRecording = () => {
        const nowMs = Date.now();
        if (startedAtRef.current == null) startedAtRef.current = nowMs;
        setSegmentStartedAt(nowMs);
        setNow(nowMs);
        changePhase('recording');
    };

    const handleFix = (position) => {
        const c = position.coords;
        const fix = {
            lat: Number(c.latitude.toFixed(6)),
            lng: Number(c.longitude.toFixed(6)),
            acc: c.accuracy != null ? Math.round(c.accuracy) : null,
        };
        setLastFix(fix);
        setError('');

        if (phaseRef.current === 'acquiring') {
            if (fix.acc != null && fix.acc > GOOD_ACCURACY_M) return;
            beginRecording();
        }
        if (phaseRef.current !== 'recording') return;

        const point = {
            ...fix,
            alt: c.altitude != null ? Number(c.altitude.toFixed(1)) : null,
            t: position.timestamp,
            seg: segRef.current,
        };
        pointsRef.current = [...pointsRef.current, point];
        trackerRef.current.add(point);
        setPoints(pointsRef.current);
        setStats({
            distance: trackerRef.current.distanceMeters,
            moving: trackerRef.current.movingTimeSec,
            pace: trackerRef.current.currentPaceSecPerKm(),
        });
        if (pointsRef.current.length % 5 === 0) persistDraft('recording');
    };

    const handleGeoError = (err) => {
        setError(GEO_ERRORS[err.code] || 'GPS error');
        if (err.code === 1) {
            stopWatch(watchIdRef);
            releaseWakeLock(wakeLockRef);
            changePhase(pointsRef.current.length ? 'paused' : 'idle');
        }
    };

    const watch = () => {
        stopWatch(watchIdRef);
        watchIdRef.current = navigator.geolocation.watchPosition(handleFix, handleGeoError, {
            enableHighAccuracy: true, maximumAge: 0, timeout: 20000,
        });
    };

    const giveConsent = async () => {
        setConsenting(true);
        try {
            const res = await API.put('/account/location-consent', { consent: true });
            setSettings(res.data);
        } catch (err) {
            setLoadError(errorMessage(err, 'Could not turn on location tracking'));
        } finally {
            setConsenting(false);
        }
    };

    const start = () => {
        setError('');
        if (!('geolocation' in navigator)) {
            setError("This browser can't access GPS.");
            return;
        }
        typeRef.current = type;
        trackerRef.current = createActivityTracker(type);
        pointsRef.current = [];
        segRef.current = 0;
        startedAtRef.current = null;
        setPoints([]);
        setStats({ distance: 0, moving: 0, pace: null });
        setActiveMsBefore(0);
        setNotes('');
        changePhase('acquiring');
        watch();
        acquireWakeLock(wakeLockRef);
    };

    const pause = () => {
        stopWatch(watchIdRef);
        releaseWakeLock(wakeLockRef);
        const total = activeMsBefore + (Date.now() - segmentStartedAt);
        setActiveMsBefore(total);
        segRef.current += 1;
        changePhase('paused');
        persistDraft('paused', total);
    };

    const resume = () => {
        setError('');
        const nowMs = Date.now();
        setSegmentStartedAt(nowMs);
        setNow(nowMs);
        changePhase('recording');
        watch();
        acquireWakeLock(wakeLockRef);
    };

    const finish = () => {
        stopWatch(watchIdRef);
        releaseWakeLock(wakeLockRef);
        if (!pointsRef.current.length) {
            changePhase('idle');
            return;
        }
        const total = phase === 'recording' ? activeMsBefore + (Date.now() - segmentStartedAt) : activeMsBefore;
        if (phase === 'recording') segRef.current += 1;
        setActiveMsBefore(total);
        changePhase('review');
        persistDraft('review', total);
    };

    const recoverDraft = () => {
        const tracker = createActivityTracker(draft.type);
        draft.points.forEach((p) => tracker.add(p));
        typeRef.current = draft.type;
        trackerRef.current = tracker;
        pointsRef.current = draft.points;
        segRef.current = (draft.seg ?? 0) + 1;
        startedAtRef.current = draft.startedAt;
        setType(draft.type);
        setPoints(draft.points);
        setStats({ distance: tracker.distanceMeters, moving: tracker.movingTimeSec, pace: null });
        setActiveMsBefore(draft.activeMs ?? tracker.movingTimeSec * 1000);
        setDraft(null);
        changePhase('review');
    };

    const discardDraft = () => {
        clearDraft();
        setDraft(null);
    };

    const discardActivity = () => {
        setConfirmDiscard(false);
        clearDraft();
        pointsRef.current = [];
        setPoints([]);
        setStats({ distance: 0, moving: 0, pace: null });
        setActiveMsBefore(0);
        changePhase('idle');
    };

    const save = async () => {
        setSaving(true);
        setError('');
        try {
            const res = await API.post('/runs', {
                type: typeRef.current,
                date: localDate(startedAtRef.current),
                startedAt: startedAtRef.current,
                notes: notes.trim() || null,
                points: pointsRef.current,
            });
            clearDraft();
            if (countsForPlan) {
                try {
                    await API.post('/plans/active/sessions', { workoutId: res.data.summary.workoutId });
                } catch {
                    // The activity is saved either way; the plan can be updated by hand.
                }
            }
            navigate(`/runs/${res.data.summary.workoutId}`, { replace: true });
        } catch (err) {
            setError(errorMessage(err, 'Could not save this activity'));
            setSaving(false);
        }
    };

    const positions = useMemo(
        () => points.filter((p) => p.acc == null || p.acc <= MAX_ACCURACY_M).map((p) => [p.lat, p.lng]),
        [points],
    );
    const live = phase === 'recording' || phase === 'acquiring' || phase === 'paused';
    const current = live && lastFix ? [lastFix.lat, lastFix.lng] : null;
    const elapsedMs = phase === 'recording' && segmentStartedAt ? activeMsBefore + Math.max(0, now - segmentStartedAt) : activeMsBefore;
    const speedMode = usesSpeed(type);
    const averagePace = paceOrSpeed(type, stats.distance, stats.moving);
    const livePace = speedMode ? averagePace : (stats.pace ? formatPace(stats.pace) : averagePace);

    const cardStyle = glassCard(theme);
    const bigNumber = { color: theme.mix(1), fontWeight: 800, fontSize: '1.6rem', lineHeight: 1.1, fontVariantNumeric: 'tabular-nums' };
    const label = { color: theme.mix(0.5), fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: 0.5 };

    const statGrid = (
        <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 1, textAlign: 'center', mb: 2 }}>
            <Box>
                <Typography sx={bigNumber}>{(stats.distance / 1000).toFixed(2)}</Typography>
                <Typography sx={label}>km</Typography>
            </Box>
            <Box>
                <Typography sx={bigNumber}>{formatDuration(elapsedMs / 1000)}</Typography>
                <Typography sx={label}>time</Typography>
            </Box>
            <Box>
                <Typography sx={bigNumber}>{(phase === 'recording' ? livePace : averagePace).replace(' /km', '').replace(' km/h', '')}</Typography>
                <Typography sx={label}>{speedMode ? 'km/h' : phase === 'recording' ? 'pace /km' : 'avg /km'}</Typography>
            </Box>
        </Box>
    );

    return (
        <Box sx={{ minHeight: '100vh', background: theme.bgGradient, fontFamily: FONT, position: 'relative' }}>
            <Blobs />
            <AppBar position="static" sx={{ background: theme.mix(0.05), backdropFilter: 'blur(10px)', boxShadow: 'none', borderBottom: `1px solid ${theme.mix(0.1)}` }}>
                <Toolbar>
                    <IconButton onClick={() => navigate('/dashboard')} sx={{ color: theme.mix(1), mr: 1 }} disabled={live && phase !== 'paused'}>
                        <ArrowBackIcon />
                    </IconButton>
                    <DirectionsRunIcon sx={{ color: '#4ecdc4', mr: 1 }} />
                    <Typography variant="h6" sx={{ color: theme.mix(1), fontWeight: 700, flexGrow: 1 }}>
                        Track Activity
                    </Typography>
                    {phase === 'idle' && (
                        <Button startIcon={<HistoryIcon />} onClick={() => navigate('/runs')} sx={{ color: theme.mix(0.8) }}>
                            History
                        </Button>
                    )}
                </Toolbar>
            </AppBar>

            <Box sx={{ maxWidth: 720, mx: 'auto', py: 3, px: 2, position: 'relative', zIndex: 1 }}>
                {loadError && <Alert severity="error" sx={{ mb: 2 }}>{loadError}</Alert>}
                {error && <Alert severity={phase === 'recording' ? 'warning' : 'error'} sx={{ mb: 2 }}>{error}</Alert>}
                {typeof window !== 'undefined' && !window.isSecureContext && (
                    <Alert severity="warning" sx={{ mb: 2 }}>
                        GPS only works over HTTPS (or on localhost). Open the site with https:// to track activities.
                    </Alert>
                )}

                {!settings && !loadError && (
                    <Box sx={{ textAlign: 'center', mt: 8 }}><CircularProgress /></Box>
                )}

                {settings && !settings.locationConsent && (
                    <Card sx={cardStyle}>
                        <CardContent sx={{ p: 3 }}>
                            <LocationOnIcon sx={{ fontSize: 38, color: '#4ecdc4' }} />
                            <Typography sx={{ ...sectionTitle(theme), mb: 1 }}>
                                Turn on location tracking
                            </Typography>
                            <Typography sx={{ color: theme.mix(0.75), mb: 2 }}>
                                To map your runs, walks, hikes and rides, FitTracker needs to record your GPS position while you track an activity.
                            </Typography>
                            <Box component="ul" sx={{ color: theme.mix(0.75), pl: 2.5, mb: 3, '& li': { mb: 1 } }}>
                                <li>Location is recorded only while you are actively tracking. Never in the background.</li>
                                <li>Your route is stored with the activity so you can see it on a map. Only you can see your full route.</li>
                                <li>A privacy zone ({settings.routePrivacyMeters} m by default) hides the start and finish of any route you share.</li>
                                <li>You can turn this off or delete all route data at any time in Account Settings.</li>
                            </Box>
                            <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                                <Button variant="contained" onClick={giveConsent} disabled={consenting}
                                        sx={{ borderRadius: 2, fontWeight: 700, background: 'linear-gradient(90deg, #4ecdc4, #0f3460)' }}>
                                    {consenting ? 'Turning on…' : 'Allow location tracking'}
                                </Button>
                                <Button onClick={() => navigate('/dashboard')} sx={{ color: theme.mix(0.7) }}>Not now</Button>
                            </Box>
                        </CardContent>
                    </Card>
                )}

                {settings?.locationConsent && phase === 'idle' && (
                    <>
                        {draft && (
                            <Alert severity="info" sx={{ mb: 2 }}
                                   action={(
                                       <Box sx={{ display: 'flex', gap: 1 }}>
                                           <Button color="inherit" size="small" onClick={recoverDraft}>Review</Button>
                                           <Button color="inherit" size="small" onClick={discardDraft}>Discard</Button>
                                       </Box>
                                   )}>
                                You have an unsaved {draft.type.toLowerCase()} from {new Date(draft.startedAt).toLocaleString()}.
                            </Alert>
                        )}
                        <Card sx={cardStyle}>
                            <CardContent sx={{ p: 3, textAlign: 'center' }}>
                                <Typography sx={{ color: theme.mix(0.7), mb: 1.5 }}>Choose an activity</Typography>
                                <Box sx={{ display: 'flex', gap: 1, justifyContent: 'center', flexWrap: 'wrap', mb: 3 }}>
                                    {GPS_ACTIVITY_TYPES.map((t) => (
                                        <Chip key={t} label={t} onClick={() => setType(t)}
                                              sx={{
                                                  px: 1, fontWeight: 600,
                                                  background: type === t ? '#4ecdc4' : theme.mix(0.1),
                                                  color: type === t ? '#0f3460' : theme.mix(1),
                                              }} />
                                    ))}
                                </Box>
                                <Button variant="contained" size="large" startIcon={<PlayArrowIcon />} onClick={start}
                                        sx={{ borderRadius: 10, px: 6, py: 2, fontSize: '1.1rem', fontWeight: 800, background: 'linear-gradient(90deg, #4ecdc4, #0f3460)' }}>
                                    Start {type.toLowerCase()}
                                </Button>
                                <Typography sx={{ color: theme.mix(0.45), fontSize: '0.8rem', mt: 2 }}>
                                    Keep this page open with the screen on while you move. Browsers stop GPS when a phone locks.
                                </Typography>
                            </CardContent>
                        </Card>
                    </>
                )}

                {phase === 'acquiring' && (
                    <Card sx={{ ...cardStyle, mb: 2 }}>
                        <CardContent sx={{ p: 3, textAlign: 'center' }}>
                            <CircularProgress sx={{ color: '#4ecdc4', mb: 2 }} />
                            <Typography sx={{ color: theme.mix(1), fontWeight: 700 }}>Finding your position…</Typography>
                            <Typography sx={{ color: theme.mix(0.6), fontSize: '0.9rem', mb: 2 }}>
                                {lastFix?.acc != null ? `Accuracy ±${lastFix.acc} m. Waiting for ±${GOOD_ACCURACY_M} m or better.` : 'Waiting for the first GPS fix.'}
                            </Typography>
                            <Box sx={{ display: 'flex', gap: 1, justifyContent: 'center' }}>
                                <Button variant="outlined" onClick={beginRecording} disabled={!lastFix}
                                        sx={{ borderRadius: 2, borderColor: '#4ecdc4', color: '#4ecdc4' }}>
                                    Start now anyway
                                </Button>
                                <Button onClick={() => { stopWatch(watchIdRef); releaseWakeLock(wakeLockRef); changePhase('idle'); }}
                                        sx={{ color: theme.mix(0.7) }}>
                                    Cancel
                                </Button>
                            </Box>
                        </CardContent>
                    </Card>
                )}

                {(phase === 'recording' || phase === 'paused') && (
                    <>
                        {phase === 'recording' && (
                            <Alert severity="info" sx={{ mb: 2 }}>
                                Recording. Keep this screen on and this page open.
                            </Alert>
                        )}
                        <Card sx={{ ...cardStyle, mb: 2 }}>
                            <CardContent>
                                <Typography sx={{ color: phase === 'paused' ? '#ffa726' : '#4ecdc4', fontWeight: 700, textAlign: 'center', mb: 1 }}>
                                    {phase === 'paused' ? 'Paused' : `${type} · ${lastFix?.acc != null ? `GPS ±${lastFix.acc} m` : 'GPS'}`}
                                </Typography>
                                {statGrid}
                                <RouteMap positions={positions} current={current} follow={phase === 'recording'} height={300} />
                            </CardContent>
                        </Card>
                        <Box sx={{ display: 'flex', gap: 2, justifyContent: 'center' }}>
                            {phase === 'recording' ? (
                                <Button variant="contained" size="large" startIcon={<PauseIcon />} onClick={pause}
                                        sx={{ borderRadius: 10, px: 4, py: 1.5, fontWeight: 800, background: '#ffa726', '&:hover': { background: '#fb8c00' } }}>
                                    Pause
                                </Button>
                            ) : (
                                <Button variant="contained" size="large" startIcon={<PlayArrowIcon />} onClick={resume}
                                        sx={{ borderRadius: 10, px: 4, py: 1.5, fontWeight: 800, background: '#4ecdc4', color: '#0f3460', '&:hover': { background: '#3aa89f' } }}>
                                    Resume
                                </Button>
                            )}
                            <Button variant="contained" size="large" startIcon={<StopIcon />} onClick={finish}
                                    sx={{ borderRadius: 10, px: 4, py: 1.5, fontWeight: 800, background: '#e94560', '&:hover': { background: '#c73652' } }}>
                                Finish
                            </Button>
                        </Box>
                    </>
                )}

                {phase === 'review' && (
                    <Card sx={cardStyle}>
                        <CardContent sx={{ p: 3 }}>
                            <Typography sx={{ ...sectionTitle(theme), mb: 2 }}>
                                Save your {type.toLowerCase()}?
                            </Typography>
                            {statGrid}
                            <Box sx={{ mb: 2 }}>
                                <RouteMap positions={positions} height={260} />
                            </Box>
                            <Typography sx={{ color: theme.mix(0.5), fontSize: '0.8rem', mb: 2 }}>
                                {formatDistance(stats.distance)} · {points.length} GPS points
                            </Typography>
                            <TextField fullWidth multiline rows={2} label="Notes (optional)" value={notes}
                                       onChange={(e) => setNotes(e.target.value)} inputProps={{ maxLength: 255 }}
                                       sx={fieldStyle(theme)} />
                            <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                                <Button variant="contained" onClick={save} disabled={saving}
                                        sx={{ borderRadius: 2, fontWeight: 700, px: 4, background: 'linear-gradient(90deg, #4ecdc4, #0f3460)' }}>
                                    {saving ? 'Saving…' : 'Save activity'}
                                </Button>
                                <Button variant="outlined" startIcon={<PlayArrowIcon />} onClick={resume} disabled={saving}
                                        sx={{ borderRadius: 2, borderColor: theme.mix(0.3), color: theme.mix(0.8) }}>
                                    Keep going
                                </Button>
                                <Button onClick={() => setConfirmDiscard(true)} disabled={saving} sx={{ color: '#e94560' }}>
                                    Discard
                                </Button>
                            </Box>
                        </CardContent>
                    </Card>
                )}
            </Box>

            <Dialog open={confirmDiscard} onClose={() => setConfirmDiscard(false)}>
                <DialogTitle>Discard this activity?</DialogTitle>
                <DialogContent>
                    <DialogContentText>The recorded route and time will be lost. This can&apos;t be undone.</DialogContentText>
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setConfirmDiscard(false)}>Keep it</Button>
                    <Button onClick={discardActivity} sx={{ color: '#e94560' }}>Discard</Button>
                </DialogActions>
            </Dialog>
        </Box>
    );
}

export default RunTracker;
