import { Box } from '@mui/material';

// Original, dependency-free looping stick-figure animations — no external
// GIFs/images needed. Each exercise maps to a movement pattern by keyword,
// and each pattern drives a small set of CSS keyframes on SVG groups.
const KEYFRAMES = `
@keyframes fa-dip { 0%,100% { transform: translateY(0); } 50% { transform: translateY(10px); } }
@keyframes fa-hop { 0%,100% { transform: translateY(0); } 50% { transform: translateY(-14px); } }
@keyframes fa-run-legs { 0%,100% { transform: rotate(28deg); } 50% { transform: rotate(-28deg); } }
@keyframes fa-run-legs-r { 0%,100% { transform: rotate(-28deg); } 50% { transform: rotate(28deg); } }
@keyframes fa-run-arms { 0%,100% { transform: rotate(-22deg); } 50% { transform: rotate(22deg); } }
@keyframes fa-run-arms-r { 0%,100% { transform: rotate(22deg); } 50% { transform: rotate(-22deg); } }
@keyframes fa-rise { 0%,100% { transform: translateY(7px); } 50% { transform: translateY(-5px); } }
@keyframes fa-armswing { 0%,100% { transform: rotate(15deg); } 50% { transform: rotate(-35deg); } }
@keyframes fa-armcurl { 0%,100% { transform: rotate(0deg); } 50% { transform: rotate(-85deg); } }
@keyframes fa-press-l { 0%,100% { transform: rotate(20deg); } 50% { transform: rotate(-130deg); } }
@keyframes fa-press-r { 0%,100% { transform: rotate(-20deg); } 50% { transform: rotate(130deg); } }
@keyframes fa-crunch { 0%,100% { transform: rotate(0deg); } 50% { transform: rotate(-18deg); } }
@keyframes fa-legbend { 0%,100% { transform: scaleY(1); } 50% { transform: scaleY(0.8); } }
@keyframes fa-heel { 0%,100% { transform: translateY(0); } 50% { transform: translateY(-3px); } }
`;

function movementPatternFor(exercise) {
    const name = exercise.name.toLowerCase();
    if (/push.?up/.test(name)) return 'pushup';
    if (/curl/.test(name)) return 'curl';
    if (/calf raise/.test(name)) return 'calf';
    if (/pull.?up|row|face pull|superman/.test(name)) return 'pull';
    if (/squat|lunge|leg press|step.?up|glute bridge/.test(name)) return 'squat';
    if (/plank|sit.?up|russian twist|leg raise|mountain climber/.test(name)) return 'core';
    if (/running|jog|sprint/.test(name)) return 'run';
    if (/burpee|jump rope|box jump/.test(name)) return 'cardio';
    if (/press|dip|skull crusher/.test(name)) return 'press';
    return 'press';
}

// Horizontal, ground-based push-up — a standing figure reads as a squat or bob,
// not a push-up, so this pattern gets its own dedicated layout instead of
// reusing the upright stick figure.
function PushUpFigure({ color }) {
    return (
        <svg viewBox="0 0 150 100" width="100%" height="100%" fill="none"
             stroke={color} strokeWidth="5" strokeLinecap="round">
            <line x1="8" y1="86" x2="142" y2="86" stroke={color} strokeOpacity="0.25" strokeWidth="3" />
            <line x1="98" y1="62" x2="126" y2="82" />
            <line x1="98" y1="62" x2="122" y2="60" />
            <g style={{ animation: 'fa-dip 1.1s ease-in-out infinite' }}>
                <circle cx="22" cy="58" r="10" fill={color} stroke="none" />
                <line x1="32" y1="60" x2="98" y2="62" />
                <line x1="48" y1="61" x2="48" y2="86" />
                <line x1="75" y1="61.5" x2="75" y2="86" />
            </g>
        </svg>
    );
}

function RunFigure({ color }) {
    return (
        <svg viewBox="0 0 100 110" width="100%" height="100%" fill="none"
             stroke={color} strokeWidth="5" strokeLinecap="round">
            <g style={{ animation: 'fa-hop 0.6s ease-in-out infinite' }}>
                <circle cx="52" cy="18" r="9" fill={color} stroke="none" />
                <line x1="50" y1="27" x2="48" y2="58" />
                <g style={{ animation: 'fa-run-arms 0.6s ease-in-out infinite', transformOrigin: '49px 33px' }}>
                    <line x1="49" y1="33" x2="30" y2="42" />
                </g>
                <g style={{ animation: 'fa-run-arms-r 0.6s ease-in-out infinite', transformOrigin: '49px 33px' }}>
                    <line x1="49" y1="33" x2="68" y2="24" />
                </g>
                <g style={{ animation: 'fa-run-legs 0.6s ease-in-out infinite', transformOrigin: '48px 58px' }}>
                    <line x1="48" y1="58" x2="30" y2="80" />
                </g>
                <g style={{ animation: 'fa-run-legs-r 0.6s ease-in-out infinite', transformOrigin: '48px 58px' }}>
                    <line x1="48" y1="58" x2="66" y2="76" />
                </g>
            </g>
        </svg>
    );
}

function StickFigure({ color, pattern }) {
    const upperAnim = pattern === 'squat' ? 'fa-dip 1.4s ease-in-out infinite'
        : pattern === 'core' ? 'fa-crunch 1.5s ease-in-out infinite'
        : pattern === 'pull' ? 'fa-rise 1.3s ease-in-out infinite'
        : pattern === 'calf' ? 'fa-heel 1.2s ease-in-out infinite'
        : pattern === 'cardio' ? 'fa-hop 0.8s ease-in-out infinite'
        : undefined;

    const armL = pattern === 'press' ? 'fa-press-l 1.3s ease-in-out infinite'
        : pattern === 'pull' ? 'fa-armswing 1.3s ease-in-out infinite'
        : undefined;
    const armR = pattern === 'press' ? 'fa-press-r 1.3s ease-in-out infinite'
        : pattern === 'pull' ? 'fa-armswing 1.3s ease-in-out infinite'
        : pattern === 'curl' ? 'fa-armcurl 1.2s ease-in-out infinite'
        : undefined;
    const legs = pattern === 'squat' ? 'fa-legbend 1.4s ease-in-out infinite'
        : pattern === 'cardio' ? 'fa-hop 0.8s ease-in-out infinite'
        : undefined;

    return (
        <svg viewBox="-15 0 130 115" width="100%" height="100%" fill="none"
             stroke={color} strokeWidth="5" strokeLinecap="round">
            <g style={{ animation: upperAnim, transformOrigin: '50px 55px' }}>
                <circle cx="50" cy="18" r="9" fill={color} stroke="none" />
                <line x1="50" y1="27" x2="50" y2="60" />
                <g style={{ animation: armL, transformOrigin: '50px 35px' }}>
                    <line x1="50" y1="35" x2="28" y2="50" />
                </g>
                <g style={{ animation: armR, transformOrigin: '50px 35px' }}>
                    <line x1="50" y1="35" x2="72" y2="50" />
                </g>
            </g>
            <g style={{ animation: legs, transformOrigin: '50px 60px' }}>
                <line x1="50" y1="60" x2="33" y2="98" />
                <line x1="50" y1="60" x2="67" y2="98" />
            </g>
        </svg>
    );
}

function ExerciseAnimation({ exercise, color = '#4ecdc4', size = 110 }) {
    const pattern = movementPatternFor(exercise);

    return (
        <Box sx={{ width: size, height: size * (pattern === 'pushup' ? 0.7 : 1), mx: 'auto', flexShrink: 0 }}>
            <style>{KEYFRAMES}</style>
            {pattern === 'pushup' && <PushUpFigure color={color} />}
            {pattern === 'run' && <RunFigure color={color} />}
            {pattern !== 'pushup' && pattern !== 'run' && <StickFigure color={color} pattern={pattern} />}
        </Box>
    );
}

export default ExerciseAnimation;
