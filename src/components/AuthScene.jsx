import { keyframes } from '@emotion/react';
import { Box, Typography } from '@mui/material';
import DirectionsRunIcon from '@mui/icons-material/DirectionsRun';
import FitnessCenterIcon from '@mui/icons-material/FitnessCenter';
import LocalFireDepartmentIcon from '@mui/icons-material/LocalFireDepartment';
import EmojiEventsIcon from '@mui/icons-material/EmojiEvents';
import BoltIcon from '@mui/icons-material/Bolt';
import RestaurantIcon from '@mui/icons-material/Restaurant';
import MapIcon from '@mui/icons-material/Map';

const drift = keyframes`
  0%, 100% { transform: translate(0, 0) scale(1); }
  33% { transform: translate(30px, -40px) scale(1.1); }
  66% { transform: translate(-20px, 20px) scale(0.95); }
`;
const bob = keyframes`
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(-12px); }
`;
const popIn = keyframes`
  from { opacity: 0; transform: translateY(18px) scale(0.9); }
  to { opacity: 1; transform: none; }
`;
const fadeUp = keyframes`
  from { opacity: 0; transform: translateY(14px); }
  to { opacity: 1; transform: none; }
`;
const pulse = keyframes`
  from { transform: scale(1); opacity: 0.5; }
  to { transform: scale(1.8); opacity: 0; }
`;
const iconSwap = keyframes`
  0% { opacity: 0; transform: scale(0.6) rotate(-12deg); }
  8%, 30% { opacity: 1; transform: none; }
  38%, 100% { opacity: 0; transform: scale(0.6) rotate(12deg); }
`;
const heartbeat = keyframes`
  from { stroke-dashoffset: 1400; }
  to { stroke-dashoffset: 0; }
`;

// Activity rings that fill up, hold, and empty again.
const RINGS = [
    { r: 88, color: '#ff4d6d', target: 0.82, delay: 0 },
    { r: 68, color: '#4ecdc4', target: 0.64, delay: 0.25 },
    { r: 48, color: '#ffd166', target: 0.92, delay: 0.5 },
].map((ring) => {
    const length = 2 * Math.PI * ring.r;
    const end = length * (1 - ring.target);
    return {
        ...ring,
        length,
        end,
        fill: keyframes`
          0% { stroke-dashoffset: ${length}; }
          45%, 75% { stroke-dashoffset: ${end}; }
          100% { stroke-dashoffset: ${length}; }
        `,
    };
});

const CENTER_ICONS = [DirectionsRunIcon, FitnessCenterIcon, LocalFireDepartmentIcon];

const CHIPS = {
    login: [
        { icon: DirectionsRunIcon, label: '5.2 km', sub: 'Morning run', color: '#4ecdc4', pos: { top: '12%', left: '7%' } },
        { icon: LocalFireDepartmentIcon, label: '12 day streak', sub: 'Keep it going', color: '#ffa726', pos: { top: '17%', right: '7%' } },
        { icon: EmojiEventsIcon, label: 'New PR', sub: 'Squat 100 kg', color: '#ffd166', pos: { top: '52%', left: '5%' } },
        { icon: BoltIcon, label: '642 kcal', sub: 'Burned today', color: '#ff6b81', pos: { top: '56%', right: '6%' } },
    ],
    register: [
        { icon: MapIcon, label: 'GPS runs', sub: 'Maps and splits', color: '#4ecdc4', pos: { top: '12%', left: '7%' } },
        { icon: FitnessCenterIcon, label: '870+ exercises', sub: 'With demos', color: '#ff6b81', pos: { top: '17%', right: '7%' } },
        { icon: RestaurantIcon, label: 'Food diary', sub: 'Calories and macros', color: '#ffa726', pos: { top: '52%', left: '5%' } },
        { icon: EmojiEventsIcon, label: 'Badges', sub: 'Earn as you train', color: '#ffd166', pos: { top: '56%', right: '6%' } },
    ],
};

const COPY = {
    login: {
        eyebrow: 'Welcome back',
        title: 'Your streak is waiting.',
        body: "Pick up where you left off: today's plan session, your runs and your records.",
    },
    register: {
        eyebrow: 'Join FitTracker',
        title: 'Start strong. Track everything.',
        body: 'Workouts, GPS runs, meals and training plans in one place, with badges for every milestone.',
    },
};

const reducedMotion = (extra = {}) => ({
    '@media (prefers-reduced-motion: reduce)': { animation: 'none', ...extra },
});

// A single heartbeat blip repeated across the width.
const HEARTBEAT_PATH = Array.from({ length: 4 }, (_, i) => {
    const x = i * 150;
    return `L${x + 60} 40 L${x + 72} 28 L${x + 84} 52 L${x + 96} 8 L${x + 108} 70 L${x + 120} 40 L${x + 150} 40`;
}).join(' ');

/** The animated side of the sign-in / sign-up page. {@code compact} is the short banner used on phones. */
function AuthScene({ mode, compact = false, showCopy = true }) {
    const copy = COPY[mode];
    const ringSize = compact ? 130 : 230;

    return (
        <Box sx={{
            position: 'relative', height: '100%', overflow: 'hidden', color: '#fff',
            background: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 45%, #0f3460 100%)',
            fontFamily: "'Poppins', sans-serif",
        }}>
            {/* Colour wash that shifts between the two modes */}
            <Box sx={{
                position: 'absolute', inset: 0, transition: 'opacity 0.9s ease',
                background: 'radial-gradient(circle at 25% 25%, rgba(233,69,96,0.55), transparent 55%)',
                opacity: mode === 'login' ? 1 : 0,
            }} />
            <Box sx={{
                position: 'absolute', inset: 0, transition: 'opacity 0.9s ease',
                background: 'radial-gradient(circle at 75% 30%, rgba(78,205,196,0.5), transparent 55%)',
                opacity: mode === 'register' ? 1 : 0,
            }} />

            {[
                { size: 260, color: 'rgba(233,69,96,0.35)', top: '62%', left: '-6%', duration: 18 },
                { size: 200, color: 'rgba(78,205,196,0.3)', top: '-6%', left: '58%', duration: 22 },
                { size: 170, color: 'rgba(255,209,102,0.22)', top: '72%', left: '72%', duration: 26 },
            ].map((blob) => (
                <Box key={blob.top} sx={{
                    position: 'absolute', width: blob.size, height: blob.size, borderRadius: '50%',
                    background: blob.color, filter: 'blur(40px)', top: blob.top, left: blob.left,
                    animation: `${drift} ${blob.duration}s ease-in-out infinite`,
                    ...reducedMotion(),
                }} />
            ))}

            {/* Activity rings */}
            <Box sx={{
                position: 'absolute', width: ringSize, height: ringSize, transform: 'translate(-50%, -50%)',
                top: compact ? '50%' : '36%', left: compact ? 'calc(100% - 85px)' : '50%',
            }}>
                {[0, 1.5].map((delay) => (
                    <Box key={delay} sx={{
                        position: 'absolute', inset: '8%', borderRadius: '50%', border: '2px solid rgba(255,255,255,0.35)',
                        animation: `${pulse} 3s ease-out ${delay}s infinite`,
                        ...reducedMotion({ display: 'none' }),
                    }} />
                ))}
                <svg viewBox="0 0 220 220" width="100%" height="100%" style={{ transform: 'rotate(-90deg)', position: 'relative' }}>
                    {RINGS.map((ring) => (
                        <g key={ring.r}>
                            <circle cx="110" cy="110" r={ring.r} fill="none" stroke="rgba(255,255,255,0.12)" strokeWidth="14" />
                            <Box component="circle" cx="110" cy="110" r={ring.r} fill="none" stroke={ring.color}
                                 strokeWidth="14" strokeLinecap="round" strokeDasharray={ring.length}
                                 sx={{
                                     strokeDashoffset: ring.length,
                                     animation: `${ring.fill} 5s ease-in-out ${ring.delay}s infinite`,
                                     ...reducedMotion({ strokeDashoffset: ring.end }),
                                 }} />
                        </g>
                    ))}
                </svg>
                {CENTER_ICONS.map((Icon, i) => (
                    <Box key={i} sx={{
                        position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center',
                        opacity: 0, animation: `${iconSwap} 7.5s ease-in-out ${i * 2.5}s infinite`,
                        ...reducedMotion({ opacity: i === 0 ? 1 : 0 }),
                    }}>
                        <Icon sx={{ fontSize: ringSize * 0.2, color: '#fff' }} />
                    </Box>
                ))}
            </Box>

            {/* Floating stat chips; keyed by mode so they pop in again on every switch */}
            {!compact && CHIPS[mode].map((chip, i) => {
                const Icon = chip.icon;
                return (
                    <Box key={`${mode}-${chip.label}`} sx={{
                        position: 'absolute', ...chip.pos,
                        animation: `${popIn} 0.6s ease ${0.35 + i * 0.12}s both`,
                        ...reducedMotion(),
                    }}>
                        <Box sx={{
                            display: 'flex', alignItems: 'center', gap: 1.2, px: 1.6, py: 1, borderRadius: '16px',
                            background: 'rgba(255,255,255,0.1)', backdropFilter: 'blur(12px)',
                            border: '1px solid rgba(255,255,255,0.18)', boxShadow: '0 10px 30px rgba(0,0,0,0.25)',
                            animation: `${bob} ${4 + i * 0.6}s ease-in-out ${i * 0.7}s infinite`,
                            ...reducedMotion(),
                        }}>
                            <Box sx={{
                                width: 34, height: 34, borderRadius: '50%', background: chip.color,
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                            }}>
                                <Icon sx={{ fontSize: 20, color: '#1a1a2e' }} />
                            </Box>
                            <Box>
                                <Typography sx={{ color: 'inherit', fontWeight: 700, fontSize: '0.9rem', lineHeight: 1.2, fontFamily: 'inherit' }}>{chip.label}</Typography>
                                <Typography sx={{ color: 'inherit', fontSize: '0.72rem', opacity: 0.75, fontFamily: 'inherit' }}>{chip.sub}</Typography>
                            </Box>
                        </Box>
                    </Box>
                );
            })}

            {/* Headline */}
            {showCopy && (
                <Box key={mode} sx={{
                    position: 'absolute',
                    left: compact ? 20 : 56, right: compact ? 150 : 56, bottom: compact ? 44 : 112,
                    animation: `${fadeUp} 0.7s ease 0.2s both`,
                    ...reducedMotion(),
                }}>
                    <Typography sx={{
                        textTransform: 'uppercase', letterSpacing: 3, fontSize: compact ? '0.65rem' : '0.75rem',
                        fontWeight: 700, color: mode === 'login' ? '#ff8fa3' : '#7ee8e0', fontFamily: 'inherit',
                    }}>
                        {copy.eyebrow}
                    </Typography>
                    <Typography component="h2" sx={{
                        color: 'inherit', fontWeight: 800, lineHeight: 1.15, mt: 0.5, fontFamily: 'inherit',
                        fontSize: compact ? '1.15rem' : { md: '2.2rem', lg: '2.6rem' },
                    }}>
                        {copy.title}
                    </Typography>
                    {!compact && (
                        <Typography sx={{ color: 'inherit', mt: 1.5, maxWidth: 460, opacity: 0.8, fontSize: '1rem', fontFamily: 'inherit' }}>
                            {copy.body}
                        </Typography>
                    )}
                </Box>
            )}

            {/* Heartbeat line */}
            {!compact && (
                <Box component="svg" viewBox="0 0 600 80" preserveAspectRatio="none" sx={{
                    position: 'absolute', left: 0, right: 0, bottom: 24, width: '100%', height: 64, opacity: 0.5,
                }}>
                    <Box component="path" d={`M0 40 ${HEARTBEAT_PATH}`} fill="none"
                         stroke={mode === 'login' ? '#ff4d6d' : '#4ecdc4'} strokeWidth="2.5" strokeLinejoin="round"
                         strokeDasharray="1400"
                         sx={{
                             transition: 'stroke 0.9s ease',
                             animation: `${heartbeat} 4s linear infinite`,
                             ...reducedMotion({ strokeDashoffset: 0 }),
                         }} />
                </Box>
            )}
        </Box>
    );
}

export default AuthScene;
