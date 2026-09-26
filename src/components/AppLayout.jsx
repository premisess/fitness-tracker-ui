import { useState } from 'react';
import { Link, Outlet, useLocation } from 'react-router-dom';
import { Box, Drawer, IconButton, Tooltip, Typography, useMediaQuery } from '@mui/material';
import ChevronLeftIcon from '@mui/icons-material/ChevronLeft';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import MenuIcon from '@mui/icons-material/Menu';
import DashboardIcon from '@mui/icons-material/Dashboard';
import FitnessCenterIcon from '@mui/icons-material/FitnessCenter';
import DirectionsRunIcon from '@mui/icons-material/DirectionsRun';
import RestaurantIcon from '@mui/icons-material/Restaurant';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import InsightsIcon from '@mui/icons-material/Insights';
import PersonIcon from '@mui/icons-material/Person';
import { useAppTheme } from '../context/ThemeContext';
import { FONT } from '../theme/styles';

const ACCENT = '#e94560';

// A few sidebar tabs. Each groups related pages, shown as tabs at the top of the page.
const SECTIONS = [
    { label: 'Dashboard', icon: DashboardIcon, pages: [{ label: 'Dashboard', path: '/dashboard' }] },
    {
        label: 'Workouts', icon: FitnessCenterIcon, pages: [
            { label: 'Log Workout', path: '/workouts' },
            { label: 'Plans', path: '/plans' },
            { label: 'Exercises', path: '/exercises' },
        ],
    },
    {
        label: 'Running', icon: DirectionsRunIcon, pages: [
            { label: 'Start Run', path: '/run' },
            { label: 'Activities', path: '/runs' },
        ],
    },
    {
        label: 'Nutrition', icon: RestaurantIcon, pages: [
            { label: 'Food Diary', path: '/nutrition' },
            { label: 'Water', path: '/water-intake' },
        ],
    },
    {
        label: 'Progress', icon: TrendingUpIcon, pages: [
            { label: 'Goals', path: '/goals' },
            { label: 'Achievements', path: '/achievements' },
        ],
    },
    {
        label: 'Analytics', icon: InsightsIcon, pages: [
            { label: 'Overview', path: '/analytics' },
            { label: 'Records', path: '/records' },
            { label: 'BMI', path: '/bmi' },
        ],
    },
    {
        label: 'Profile', icon: PersonIcon, pages: [
            { label: 'Profile', path: '/profile' },
            { label: 'Account Settings', path: '/account-settings' },
        ],
    },
];

const WIDE = 220;
const NARROW = 68;
const STORAGE_KEY = 'sidebarCollapsed';

const readCollapsed = () => {
    try {
        return localStorage.getItem(STORAGE_KEY) === 'true';
    } catch {
        return false;
    }
};

// /run and /runs are different pages, so match whole path segments only.
const matches = (pathname, path) => pathname === path || pathname.startsWith(`${path}/`);
const sectionFor = (pathname) => SECTIONS.find((s) => s.pages.some((p) => matches(pathname, p.path)));

function SidebarContent({ collapsed, onToggle, onNavigate }) {
    const { theme } = useAppTheme();
    const { pathname } = useLocation();
    const current = sectionFor(pathname);

    return (
        <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%', px: 1.25, py: 2, fontFamily: FONT }}>
            <Box sx={{
                display: 'flex', alignItems: 'center', mb: 3,
                justifyContent: collapsed ? 'center' : 'space-between', px: collapsed ? 0 : 0.75,
            }}>
                {!collapsed && (
                    <Box component={Link} to="/dashboard" onClick={onNavigate}
                         sx={{ display: 'flex', alignItems: 'center', gap: 1, textDecoration: 'none' }}>
                        <FitnessCenterIcon sx={{ color: ACCENT, fontSize: 26 }} />
                        <Typography sx={{ color: theme.mix(1), fontWeight: 800, fontFamily: FONT, letterSpacing: 0.5 }}>
                            FitTracker
                        </Typography>
                    </Box>
                )}
                {onToggle && (
                    <IconButton size="small" onClick={onToggle} aria-label={collapsed ? 'Show sidebar' : 'Hide sidebar'}
                                sx={{ color: theme.mix(0.6), '&:hover': { background: theme.mix(0.08) } }}>
                        {collapsed ? <ChevronRightIcon fontSize="small" /> : <ChevronLeftIcon fontSize="small" />}
                    </IconButton>
                )}
            </Box>

            <Box component="nav" sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
                {SECTIONS.map((section) => {
                    const active = section === current;
                    const Icon = section.icon;
                    const link = (
                        <Box key={section.label} component={Link} to={section.pages[0].path} onClick={onNavigate}
                             aria-current={active ? 'page' : undefined}
                             sx={{
                                 display: 'flex', alignItems: 'center', gap: 1.5,
                                 justifyContent: collapsed ? 'center' : 'flex-start',
                                 px: collapsed ? 0 : 1.25, py: 1.1, borderRadius: 2,
                                 textDecoration: 'none', fontFamily: FONT, fontSize: '0.9rem', fontWeight: active ? 700 : 500,
                                 color: active ? theme.mix(1) : theme.mix(0.65),
                                 background: active ? theme.mix(0.1) : 'transparent',
                                 border: `1px solid ${active ? theme.mix(0.12) : 'transparent'}`,
                                 transition: 'background 0.15s, color 0.15s',
                                 '&:hover': { background: theme.mix(0.07), color: theme.mix(1) },
                             }}>
                            <Icon sx={{ fontSize: 21, color: active ? ACCENT : 'inherit' }} />
                            {!collapsed && <span>{section.label}</span>}
                        </Box>
                    );
                    return collapsed
                        ? <Tooltip key={section.label} title={section.label} placement="right">{link}</Tooltip>
                        : link;
                })}
            </Box>
        </Box>
    );
}

/** Tabs for the other pages in the current section, so related pages are one click apart. */
function SectionTabs() {
    const { theme } = useAppTheme();
    const { pathname } = useLocation();
    const section = sectionFor(pathname);
    if (!section || section.pages.length < 2) return null;

    return (
        <Box component="nav" aria-label={section.label} sx={{
            position: 'relative', zIndex: 11,
            display: 'flex', gap: 0.75, overflowX: 'auto',
            px: { xs: 2, md: 3 }, py: 1.25,
            background: theme.mix(0.03),
            backdropFilter: 'blur(14px)', WebkitBackdropFilter: 'blur(14px)',
            borderBottom: `1px solid ${theme.mix(0.08)}`,
        }}>
            {section.pages.map((page) => {
                const active = matches(pathname, page.path);
                return (
                    <Box key={page.path} component={Link} to={page.path} aria-current={active ? 'page' : undefined} sx={{
                        flexShrink: 0, px: 1.75, py: 0.6, borderRadius: 999,
                        textDecoration: 'none', fontFamily: FONT, fontSize: '0.82rem', fontWeight: active ? 700 : 500,
                        color: active ? '#fff' : theme.mix(0.7),
                        background: active ? ACCENT : theme.mix(0.05),
                        border: `1px solid ${active ? ACCENT : theme.mix(0.1)}`,
                        transition: 'background 0.15s, color 0.15s',
                        '&:hover': { background: active ? ACCENT : theme.mix(0.1), color: active ? '#fff' : theme.mix(1) },
                    }}>
                        {page.label}
                    </Box>
                );
            })}
        </Box>
    );
}

/** The signed-in shell: a sidebar that can be hidden to icons on desktop, and a slide-out menu on phones. */
function AppLayout() {
    const { theme } = useAppTheme();
    const isDesktop = useMediaQuery('(min-width:900px)');
    const [collapsed, setCollapsed] = useState(readCollapsed);
    const [mobileOpen, setMobileOpen] = useState(false);

    const toggle = () => setCollapsed((c) => {
        try {
            localStorage.setItem(STORAGE_KEY, String(!c));
        } catch {
            // Storage blocked: the choice just won't be remembered.
        }
        return !c;
    });

    // The same frosted glass as the page headers.
    const glass = {
        background: theme.mix(0.04),
        backdropFilter: 'blur(14px)', WebkitBackdropFilter: 'blur(14px)',
        borderRight: `1px solid ${theme.mix(0.08)}`,
    };

    return (
        <Box sx={{ display: 'flex', minHeight: '100vh' }}>
            {isDesktop ? (
                <Box component="aside" sx={{
                    ...glass,
                    width: collapsed ? NARROW : WIDE, flexShrink: 0,
                    position: 'sticky', top: 0, height: '100vh', zIndex: 20,
                    transition: 'width 0.2s ease',
                }}>
                    <SidebarContent collapsed={collapsed} onToggle={toggle} />
                </Box>
            ) : (
                <>
                    <Drawer open={mobileOpen} onClose={() => setMobileOpen(false)}
                            slotProps={{ paper: { sx: { ...glass, background: theme.menuBg, width: WIDE } } }}>
                        <SidebarContent collapsed={false} onNavigate={() => setMobileOpen(false)} />
                    </Drawer>
                    <IconButton onClick={() => setMobileOpen(true)} aria-label="Open menu" sx={{
                        position: 'fixed', left: 16, bottom: 16, zIndex: 1200, width: 48, height: 48,
                        color: '#fff', background: ACCENT, boxShadow: '0 6px 20px rgba(233,69,96,0.4)',
                        '&:hover': { background: '#d63d56' },
                    }}>
                        <MenuIcon />
                    </IconButton>
                </>
            )}

            <Box component="main" sx={{ flex: 1, minWidth: 0 }}>
                <SectionTabs />
                <Outlet />
            </Box>
        </Box>
    );
}

export default AppLayout;
