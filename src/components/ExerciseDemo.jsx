import { useEffect, useState } from 'react';
import { Box } from '@mui/material';
import ExerciseAnimation from './ExerciseAnimation';

// Roughly one rep per second: half a second in each position.
const FRAME_MS = 500;

/**
 * Real demo of an exercise: the catalog's start and end photos cross-faded in a loop.
 * Falls back to the stick-figure animation when an exercise has no photos or they fail to load.
 *
 * animate: 'always' loops continuously, 'hover' only while the pointer is over it, false shows the start frame.
 */
function ExerciseDemo({ exercise, height = 180, animate = 'always', color = '#4ecdc4', radius = 2 }) {
    const urls = exercise?.imageUrls || [];
    const [frame, setFrame] = useState(0);
    const [hovering, setHovering] = useState(false);
    const [failedId, setFailedId] = useState(null);
    const failed = failedId === exercise?.id;

    const playing = urls.length > 1 && !failed
        && (animate === 'always' || (animate === 'hover' && hovering));

    useEffect(() => {
        if (!playing) return undefined;
        const id = setInterval(() => setFrame((f) => (f + 1) % urls.length), FRAME_MS);
        return () => clearInterval(id);
    }, [playing, urls.length]);

    const shown = playing ? frame : 0;

    if (!urls.length || failed) {
        return (
            <Box sx={{ height, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <ExerciseAnimation exercise={exercise} color={color} size={Math.round(height * 0.7)} />
            </Box>
        );
    }

    return (
        <Box
            onMouseEnter={() => setHovering(true)}
            onMouseLeave={() => setHovering(false)}
            sx={{ position: 'relative', height, borderRadius: radius, overflow: 'hidden', background: '#ffffff' }}
        >
            {urls.map((url, i) => (
                <Box
                    key={url}
                    component="img"
                    src={url}
                    alt={`${exercise.name} – ${i === 0 ? 'start' : 'end'} position`}
                    loading="lazy"
                    onError={() => setFailedId(exercise.id)}
                    sx={{
                        position: 'absolute', inset: 0, width: '100%', height: '100%',
                        objectFit: 'contain', opacity: shown === i ? 1 : 0,
                        transition: 'opacity 120ms linear',
                    }}
                />
            ))}
        </Box>
    );
}

export default ExerciseDemo;
