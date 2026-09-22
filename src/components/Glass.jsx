import { Box } from '@mui/material';

// The colourful blurred glow blobs behind the glass UI, as seen on the
// landing page, dashboard and auth screens.
function Blobs() {
    return (
        <Box sx={{ position: 'fixed', inset: 0, zIndex: 0, pointerEvents: 'none', overflow: 'hidden' }}>
            <Box sx={{ position: 'absolute', width: 460, height: 460, borderRadius: '50%', top: '-10%', left: '-8%',
                background: 'radial-gradient(circle, rgba(233,69,96,0.28), transparent 70%)', filter: 'blur(55px)' }} />
            <Box sx={{ position: 'absolute', width: 480, height: 480, borderRadius: '50%', top: '24%', right: '-12%',
                background: 'radial-gradient(circle, rgba(78,205,196,0.25), transparent 70%)', filter: 'blur(65px)' }} />
            <Box sx={{ position: 'absolute', width: 420, height: 420, borderRadius: '50%', bottom: '-14%', left: '30%',
                background: 'radial-gradient(circle, rgba(255,209,102,0.2), transparent 70%)', filter: 'blur(55px)' }} />
        </Box>
    );
}

export default Blobs;