import { Box } from '@mui/material';
import { useAppTheme } from '../context/ThemeContext';
import { FONT } from '../theme/styles';

/**
 * The heading at the top of a page's content: an optional back button, the page icon and title
 * (a Typography h6), and any page actions. The pinned bar above it holds navigation and account controls.
 */
function PageHeader({ children }) {
    const { theme } = useAppTheme();
    return (
        <Box sx={{
            display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: 1, mb: 3, minHeight: 44, textAlign: 'left',
            '& .MuiTypography-h6': {
                fontSize: { xs: '1.3rem', md: '1.55rem' }, fontWeight: 800, fontFamily: FONT, color: theme.mix(1), lineHeight: 1.2,
            },
            '& > .MuiSvgIcon-root': { fontSize: 30, mr: '4px !important' },
        }}>
            {children}
        </Box>
    );
}

export default PageHeader;
