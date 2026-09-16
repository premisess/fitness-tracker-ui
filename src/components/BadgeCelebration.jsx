import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { keyframes } from '@emotion/react';
import { Box, Button, Dialog, Typography } from '@mui/material';
import API, { ACTIVITY_EVENT } from '../services/api';
import { useAppTheme } from '../context/ThemeContext';
import BadgeIcon from './BadgeIcon';

const pop = keyframes`
  0% { transform: scale(0) rotate(-30deg); }
  60% { transform: scale(1.15) rotate(8deg); }
  100% { transform: scale(1) rotate(0); }
`;
const fall = keyframes`
  0% { transform: translate3d(0, -30px, 0) rotate(0deg); opacity: 1; }
  100% { transform: translate3d(var(--dx), 460px, 0) rotate(var(--spin)); opacity: 0; }
`;
const spin = keyframes`
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
`;
const rise = keyframes`
  from { opacity: 0; transform: translateY(10px); }
  to { opacity: 1; transform: none; }
`;

// Fixed pseudo-random confetti so every render draws the same pieces.
const CONFETTI = Array.from({ length: 40 }, (_, i) => ({
    left: (i * 37) % 100,
    delay: (i % 12) * 0.07,
    duration: 1.6 + ((i * 13) % 10) / 10,
    dx: `${((i * 29) % 140) - 70}px`,
    spin: `${((i * 47) % 720) - 360}deg`,
    color: ['#e94560', '#4ecdc4', '#ffd166', '#a29bfe', '#45b7d1'][i % 5],
    width: 6 + (i % 3) * 2,
}));

const noMotion = { '@media (prefers-reduced-motion: reduce)': { animation: 'none' } };

/**
 * Listens for activity (see api.js), asks the server whether it earned any badges, and celebrates each
 * new one. Mounted once for the whole app.
 */
function BadgeCelebration() {
    const { theme } = useAppTheme();
    const navigate = useNavigate();
    const [queue, setQueue] = useState([]);
    const timerRef = useRef(null);
    const busyRef = useRef(false);

    useEffect(() => {
        const check = () => {
            clearTimeout(timerRef.current);
            // Several saves in a row only need one check.
            timerRef.current = setTimeout(async () => {
                if (busyRef.current) return;
                busyRef.current = true;
                try {
                    const res = await API.post('/badges/check');
                    if (Array.isArray(res.data) && res.data.length > 0) {
                        setQueue((current) => [...current, ...res.data]);
                    }
                } catch {
                    // Signed out or offline: nothing to celebrate.
                } finally {
                    busyRef.current = false;
                }
            }, 700);
        };
        window.addEventListener(ACTIVITY_EVENT, check);
        return () => {
            window.removeEventListener(ACTIVITY_EVENT, check);
            clearTimeout(timerRef.current);
        };
    }, []);

    const badge = queue[0];
    const remaining = queue.length - 1;
    const next = () => setQueue((current) => current.slice(1));

    return (
        <Dialog open={!!badge} onClose={next} maxWidth="xs" fullWidth
                slotProps={{
                    paper: {
                        sx: {
                            background: theme.menuBg, color: theme.mix(1), borderRadius: 4, overflow: 'hidden',
                            textAlign: 'center', position: 'relative', fontFamily: "'Poppins', sans-serif",
                        },
                    },
                }}>
            {badge && (
                <Box key={badge.code} sx={{ position: 'relative', px: 4, pt: 5, pb: 4 }}>
                    <Box aria-hidden sx={{ position: 'absolute', inset: 0, pointerEvents: 'none', overflow: 'hidden' }}>
                        {CONFETTI.map((piece, i) => (
                            <Box key={i} sx={{
                                position: 'absolute', top: 0, left: `${piece.left}%`, width: piece.width, height: piece.width * 1.6,
                                background: piece.color, borderRadius: '2px', '--dx': piece.dx, '--spin': piece.spin,
                                animation: `${fall} ${piece.duration}s ease-in ${piece.delay}s both`,
                                ...noMotion,
                                '@media (prefers-reduced-motion: reduce)': { display: 'none' },
                            }} />
                        ))}
                    </Box>

                    <Box sx={{ position: 'relative', width: 150, height: 150, mx: 'auto', mb: 2 }}>
                        <Box aria-hidden sx={{
                            position: 'absolute', inset: -20, borderRadius: '50%', opacity: 0.35,
                            background: 'repeating-conic-gradient(from 0deg, #ffd166 0deg 10deg, transparent 10deg 30deg)',
                            animation: `${spin} 12s linear infinite`,
                            maskImage: 'radial-gradient(circle, black 30%, transparent 70%)',
                            ...noMotion,
                        }} />
                        <Box sx={{ position: 'absolute', inset: 20, animation: `${pop} 0.7s ease both`, ...noMotion }}>
                            <BadgeIcon icon={badge.icon} category={badge.category} size={110} />
                        </Box>
                    </Box>

                    <Box sx={{ animation: `${rise} 0.5s ease 0.35s both`, ...noMotion }}>
                        <Typography sx={{ textTransform: 'uppercase', letterSpacing: 3, fontSize: '0.72rem', fontWeight: 700, color: '#ffa726' }}>
                            Badge unlocked
                        </Typography>
                        <Typography variant="h5" sx={{ fontWeight: 800, mt: 0.5 }}>{badge.title}</Typography>
                        <Typography sx={{ color: theme.mix(0.6), mt: 0.5 }}>{badge.description}</Typography>
                    </Box>

                    <Box sx={{ display: 'flex', gap: 1.5, justifyContent: 'center', mt: 3, flexWrap: 'wrap' }}>
                        <Button onClick={() => { setQueue([]); navigate('/achievements'); }}
                                sx={{ color: theme.mix(0.7), textTransform: 'none', fontWeight: 600 }}>
                            See all badges
                        </Button>
                        <Button variant="contained" onClick={next}
                                sx={{ borderRadius: 999, px: 3, textTransform: 'none', fontWeight: 700, background: 'linear-gradient(90deg, #e94560, #ffa726)' }}>
                            {remaining > 0 ? `Next (${remaining} more)` : 'Awesome!'}
                        </Button>
                    </Box>
                </Box>
            )}
        </Dialog>
    );
}

export default BadgeCelebration;
