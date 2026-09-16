import { Box } from '@mui/material';
import FitnessCenterIcon from '@mui/icons-material/FitnessCenter';
import EmojiEventsIcon from '@mui/icons-material/EmojiEvents';
import LocalFireDepartmentIcon from '@mui/icons-material/LocalFireDepartment';
import DirectionsRunIcon from '@mui/icons-material/DirectionsRun';
import MilitaryTechIcon from '@mui/icons-material/MilitaryTech';
import MapIcon from '@mui/icons-material/Map';
import SportsGymnasticsIcon from '@mui/icons-material/SportsGymnastics';
import TrackChangesIcon from '@mui/icons-material/TrackChanges';
import RestaurantIcon from '@mui/icons-material/Restaurant';
import WaterDropIcon from '@mui/icons-material/WaterDrop';
import EventNoteIcon from '@mui/icons-material/EventNote';
import VerifiedIcon from '@mui/icons-material/Verified';

// Icon keys and categories come from the backend's BadgeDefinition.
const ICONS = {
    fitness: FitnessCenterIcon,
    trophy: EmojiEventsIcon,
    fire: LocalFireDepartmentIcon,
    run: DirectionsRunIcon,
    medal: MilitaryTechIcon,
    map: MapIcon,
    dumbbell: SportsGymnasticsIcon,
    target: TrackChangesIcon,
    food: RestaurantIcon,
    water: WaterDropIcon,
    plan: EventNoteIcon,
    verified: VerifiedIcon,
};

const CATEGORY_COLORS = {
    Workouts: '#e94560',
    Streaks: '#ffa726',
    Running: '#4ecdc4',
    Strength: '#a29bfe',
    Goals: '#45b7d1',
    Nutrition: '#ff6b35',
    Plans: '#66bb6a',
    Account: '#4fc3f7',
};

/** A round badge medallion; locked badges are drawn as a grey outline. */
function BadgeIcon({ icon, category, earned = true, size = 64 }) {
    const Icon = ICONS[icon] || EmojiEventsIcon;
    const color = CATEGORY_COLORS[category] || '#e94560';
    return (
        <Box sx={{
            width: size, height: size, borderRadius: '50%', flexShrink: 0,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            background: earned ? `radial-gradient(circle at 30% 30%, ${color}, ${color}cc 60%, ${color}88)` : 'rgba(128,128,128,0.15)',
            boxShadow: earned ? `0 0 0 3px ${color}33, 0 8px 22px ${color}55` : 'none',
            border: earned ? '2px solid rgba(255,255,255,0.35)' : '2px dashed rgba(128,128,128,0.45)',
        }}>
            <Icon sx={{ fontSize: size * 0.5, color: earned ? '#fff' : 'rgba(128,128,128,0.75)' }} />
        </Box>
    );
}

export default BadgeIcon;
