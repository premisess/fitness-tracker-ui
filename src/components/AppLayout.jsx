import { useCallback, useEffect, useState } from 'react';
import { Link, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { Badge, Box, Drawer, IconButton, Tooltip, Typography, useMediaQuery } from '@mui/material';
import ChevronLeftIcon from '@mui/icons-material/ChevronLeft';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import MenuIcon from '@mui/icons-material/Menu';
import DashboardIcon from '@mui/icons-material/Dashboard';
import FitnessCenterIcon from '@mui/icons-material/FitnessCenter';
import DirectionsRunIcon from '@mui/icons-material/DirectionsRun';
import RestaurantIcon from '@mui/icons-material/Restaurant';
import BedtimeIcon from '@mui/icons-material/Bedtime';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import InsightsIcon from '@mui/icons-material/Insights';
import PeopleIcon from '@mui/icons-material/People';
import PersonIcon from '@mui/icons-material/Person';
import SettingsIcon from '@mui/icons-material/Settings';
import LogoutIcon from '@mui/icons-material/Logout';
import DarkModeIcon from '@mui/icons-material/DarkMode';
import LightModeIcon from '@mui/icons-material/LightMode';
import API, { FRIENDS_EVENT } from '../services/api';
import { useAppTheme } from '../context/ThemeContext';
import { FONT, stickyHeader } from '../theme/styles';
import UltimateButton from './UltimateButton';

const ACCENT = '#e94560';

// A few sidebar tabs. Each groups related pages, shown as tabs in the top bar.
// exact: the tab is only active on that exact path, not on the pages under it.
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
    { label: 'Sleep', icon: BedtimeIcon, pages: [{ label: 'Sleep', path: '/sleep' }] },
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
        label: 'Friends', icon: PeopleIcon, alert: 'total', pages: [
            { label: 'Friends', path: '/friends', exact: true, alert: 'pendingRequests' },
            { label: 'Find people', path: '/friends/find' },
            { label: 'Messages', path: '/friends/messages', alert: 'unreadMessages' },
        ],
    },
    {
        // Shown as Profile and Settings links at the bottom of the sidebar, and as tabs on those pages.
        label: 'Profile', icon: PersonIcon, bottom: true, pages: [
            { label: 'Profile', path: '/profile' },
            { label: 'Account Settings', path: '/account-settings' },
        ],
    },
];

// Pinned to the bottom of the sidebar.
const BOTTOM_LINKS = [
    { label: 'Profile', icon: PersonIcon, path: '/profile' },
    { label: 'Settings', icon: SettingsIcon, path: '/account-settings' },
];

const WIDE = 220;
const NARROW = 68;
const STORAGE_KEY = 'sidebarCollapsed';
const ALERTS_POLL_MS = 30000;

const readCollapsed = () => {
    try {
        return localStorage.getItem(STORAGE_KEY) === 'true';
    } catch {
        return false;
    }
};

// /run and /runs are different pages, so match whole path segments only.
const matches = (pathname, page) => pathname === page.path || (!page.exact && pathname.startsWith(`${page.path}/`));
const sectionFor = (pathname) => SECTIONS.find((s) => s.pages.some((p) => matches(pathname, p)));
const alertCount = (alerts, key) => (key === 'total' ? alerts.unreadMessages + alerts.pendingRequests : alerts[key] || 0);

function NavLink({ to, label, Icon, active, collapsed, onNavigate, count = 0 }) {
    const { theme } = useAppTheme();
    const link = (
        <Box component={Link} to={to} onClick={onNavigate} aria-current={active ? 'page' : undefined}
             sx={{
                 display: 'flex', alignItems: 'center', gap: 1.5,
                 justifyContent: collapsed ? 'center' : 'flex-start',
                 px: collapsed ? 0 : 1.25, py: 1, borderRadius: 2,
                 textDecoration: 'none', fontFamily: FONT, fontSize: '0.9rem', fontWeight: active ? 700 : 500,
                 color: active ? theme.mix(1) : theme.mix(0.65),
                 background: active ? theme.mix(0.1) : 'transparent',
                 border: `1px solid ${active ? theme.mix(0.12) : 'transparent'}`,
                 transition: 'background 0.15s, color 0.15s',
                 '&:hover': { background: theme.mix(0.07), color: theme.mix(1) },
             }}>
            <Badge badgeContent={count} color="error" invisible={!count || !collapsed} variant="dot">
                <Icon sx={{ fontSize: 21, color: active ? ACCENT : 'inherit' }} />
            </Badge>
            {!collapsed && <Box component="span" sx={{ flex: 1 }}>{label}</Box>}
            {!collapsed && count > 0 && (
                <Box component="span" sx={{
                    minWidth: 20, height: 20, px: 0.75, borderRadius: 999, background: ACCENT, color: '#fff',
                    fontSize: '0.7rem', fontWeight: 700, display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                }}>
                    {count > 99 ? '99+' : count}
                </Box>
            )}
        </Box>
    );
    return collapsed ? <Tooltip title={label} placement="right">{link}</Tooltip> : link;
}

function SidebarContent({ collapsed, onToggle, onNavigate, alerts }) {
    const { theme } = useAppTheme();
    const { pathname } = useLocation();
    const current = sectionFor(pathname);

    return (
        <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%', px: 1.25, py: 2, fontFamily: FONT, textAlign: 'left' }}>
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

            <Box component="nav" sx={{ display: 'flex', flexDirection: 'column', gap: 0.25, overflowY: 'auto' }}>
                {SECTIONS.filter((section) => !section.bottom).map((section) => (
                    <NavLink key={section.label} to={section.pages[0].path} label={section.label} Icon={section.icon}
                             active={section === current} collapsed={collapsed} onNavigate={onNavigate}
                             count={section.alert ? alertCount(alerts, section.alert) : 0} />
                ))}
            </Box>

            <Box component="nav" aria-label="Account" sx={{
                display: 'flex', flexDirection: 'column', gap: 0.25,
                mt: 'auto', pt: 1.5, borderTop: `1px solid ${theme.mix(0.08)}`,
            }}>
                {BOTTOM_LINKS.map((link) => (
                    <NavLink key={link.path} to={link.path} label={link.label} Icon={link.icon}
                             active={matches(pathname, link)} collapsed={collapsed} onNavigate={onNavigate} />
                ))}
            </Box>
        </Box>
    );
}

/** The pinned glass bar: the section's page tabs on the left, account controls on the right. */
function TopBar({ onOpenMenu, alerts }) {
    const { theme, mode, toggleTheme } = useAppTheme();
    const { pathname } = useLocation();
    const navigate = useNavigate();
    const section = sectionFor(pathname);
    const tabs = section && section.pages.length > 1 ? section.pages : null;

    const handleLogout = async () => {
        try {
            await API.post('/auth/logout');
        } catch {
            // Session may already be gone server-side, so clear local state anyway.
        }
        localStorage.clear();
        navigate('/login');
    };

    return (
        <Box sx={{ ...stickyHeader(theme), position: 'sticky', zIndex: 15 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, px: { xs: 1.5, md: 3 }, minHeight: 60 }}>
                {onOpenMenu && (
                    <IconButton onClick={onOpenMenu} aria-label="Open menu" sx={{ color: theme.mix(0.85), ml: -0.5 }}>
                        <MenuIcon />
                    </IconButton>
                )}

                <Box component="nav" aria-label={section?.label} sx={{
                    flex: 1, minWidth: 0, display: 'flex', alignItems: 'center', gap: 0.75, overflowX: 'auto', py: 1,
                    scrollbarWidth: 'none', '&::-webkit-scrollbar': { display: 'none' },
                }}>
                    {tabs ? tabs.map((page) => {
                        const active = matches(pathname, page);
                        const count = page.alert ? alertCount(alerts, page.alert) : 0;
                        return (
                            <Box key={page.path} component={Link} to={page.path} aria-current={active ? 'page' : undefined} sx={{
                                flexShrink: 0, display: 'inline-flex', alignItems: 'center', gap: 0.75, px: 1.75, py: 0.65, borderRadius: 999,
                                textDecoration: 'none', fontFamily: FONT, fontSize: '0.84rem', fontWeight: active ? 700 : 500,
                                color: active ? '#fff' : theme.mix(0.7),
                                background: active ? ACCENT : theme.mix(0.05),
                                border: `1px solid ${active ? ACCENT : theme.mix(0.1)}`,
                                transition: 'background 0.15s, color 0.15s',
                                '&:hover': { background: active ? ACCENT : theme.mix(0.1), color: active ? '#fff' : theme.mix(1) },
                            }}>
                                {page.label}
                                {count > 0 && (
                                    <Box component="span" sx={{
                                        minWidth: 18, height: 18, px: 0.5, borderRadius: 999, fontSize: '0.68rem', fontWeight: 700,
                                        display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                                        background: active ? '#fff' : ACCENT, color: active ? ACCENT : '#fff',
                                    }}>
                                        {count}
                                    </Box>
                                )}
                            </Box>
                        );
                    }) : (
                        <Typography noWrap sx={{ color: theme.mix(0.85), fontWeight: 700, fontFamily: FONT }}>
                            {section?.label}
                        </Typography>
                    )}
                </Box>

                <UltimateButton />
                <Tooltip title={mode === 'dark' ? 'Light mode' : 'Dark mode'}>
                    <IconButton onClick={toggleTheme} aria-label="Switch theme" sx={{ color: theme.mix(0.75) }}>
                        {mode === 'dark' ? <LightModeIcon /> : <DarkModeIcon />}
                    </IconButton>
                </Tooltip>
                <Tooltip title="Log out">
                    <IconButton onClick={handleLogout} aria-label="Log out" sx={{ color: theme.mix(0.75) }}>
                        <LogoutIcon />
                    </IconButton>
                </Tooltip>
            </Box>
        </Box>
    );
}

/** The signed-in shell: sidebar (icons only when hidden, slide-out on phones) and the pinned top bar. */
function AppLayout() {
    const { theme } = useAppTheme();
    const { pathname } = useLocation();
    const isDesktop = useMediaQuery('(min-width:900px)');
    const [collapsed, setCollapsed] = useState(readCollapsed);
    const [mobileOpen, setMobileOpen] = useState(false);
    const [alerts, setAlerts] = useState({ unreadMessages: 0, pendingRequests: 0 });

    const toggle = () => setCollapsed((c) => {
        try {
            localStorage.setItem(STORAGE_KEY, String(!c));
        } catch {
            // Storage blocked: the choice just won't be remembered.
        }
        return !c;
    });

    // Unread messages and friend requests, for the badges. Refreshed on a timer, on every page change,
    // and whenever a Friends page reads messages or answers a request.
    const refreshAlerts = useCallback(() => {
        API.get('/friends/alerts').then((res) => setAlerts(res.data)).catch(() => {});
    }, []);

    useEffect(() => {
        refreshAlerts();
    }, [pathname, refreshAlerts]);

    useEffect(() => {
        const id = setInterval(refreshAlerts, ALERTS_POLL_MS);
        window.addEventListener(FRIENDS_EVENT, refreshAlerts);
        return () => {
            clearInterval(id);
            window.removeEventListener(FRIENDS_EVENT, refreshAlerts);
        };
    }, [refreshAlerts]);

    // The same frosted glass as the top bar.
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
                    <SidebarContent collapsed={collapsed} onToggle={toggle} alerts={alerts} />
                </Box>
            ) : (
                <Drawer open={mobileOpen} onClose={() => setMobileOpen(false)}
                        slotProps={{ paper: { sx: { ...glass, background: theme.menuBg, width: WIDE } } }}>
                    <SidebarContent collapsed={false} onNavigate={() => setMobileOpen(false)} alerts={alerts} />
                </Drawer>
            )}

            <Box component="main" sx={{ flex: 1, minWidth: 0, background: theme.bgGradient, textAlign: 'left' }}>
                <TopBar onOpenMenu={isDesktop ? null : () => setMobileOpen(true)} alerts={alerts} />
                <Outlet />
            </Box>
        </Box>
    );
}

export default AppLayout;
