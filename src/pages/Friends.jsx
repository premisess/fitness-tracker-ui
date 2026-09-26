import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
    Alert, Box, Button, Card, CardContent, CircularProgress, IconButton, ListItemIcon, Menu, MenuItem, Tooltip, Typography,
} from '@mui/material';
import PeopleIcon from '@mui/icons-material/People';
import PersonAddIcon from '@mui/icons-material/PersonAdd';
import ChatBubbleOutlineIcon from '@mui/icons-material/ChatBubbleOutlined';
import MoreVertIcon from '@mui/icons-material/MoreVert';
import PersonRemoveIcon from '@mui/icons-material/PersonRemove';
import API, { FRIENDS_EVENT } from '../services/api';
import { errorMessage } from '../services/errors';
import { useAppTheme } from '../context/ThemeContext';
import Blobs from '../components/Glass';
import PageHeader from '../components/PageHeader';
import PersonAvatar from '../components/PersonAvatar';
import ChallengeDialog from '../components/ChallengeDialog';
import { ALERT_KINDS } from '../utils/alerts';
import { FONT, glassCard, sectionTitle } from '../theme/styles';

const since = (iso) => new Date(iso).toLocaleDateString(undefined, { month: 'short', year: 'numeric' });

function Friends() {
    const { theme } = useAppTheme();
    const navigate = useNavigate();
    const [data, setData] = useState(null);
    const [error, setError] = useState('');
    const [reloadKey, setReloadKey] = useState(0);
    const [busy, setBusy] = useState(null);
    const [menu, setMenu] = useState(null); // { anchor, person }
    const [alertFor, setAlertFor] = useState(null); // { person, kind }

    useEffect(() => {
        let ignore = false;
        API.get('/friends')
            .then((res) => { if (!ignore) setData(res.data); })
            .catch((err) => { if (!ignore) setError(errorMessage(err, 'Could not load your friends')); });
        return () => { ignore = true; };
    }, [reloadKey]);

    const act = async (key, request) => {
        setBusy(key);
        setError('');
        try {
            await request();
            window.dispatchEvent(new Event(FRIENDS_EVENT));
            setReloadKey((k) => k + 1);
        } catch (err) {
            setError(errorMessage(err, 'That didn\'t work. Please try again.'));
        } finally {
            setBusy(null);
        }
    };

    const smallButton = { borderRadius: 999, textTransform: 'none', fontWeight: 700, fontFamily: FONT, px: 1.75, minWidth: 0 };

    return (
        <Box sx={{ minHeight: '100vh', background: theme.bgGradient, fontFamily: FONT, position: 'relative' }}>
            <Blobs />
            <Box sx={{ maxWidth: 900, mx: 'auto', py: 3, px: 2, position: 'relative', zIndex: 1, textAlign: 'left' }}>
                <PageHeader>
                    <PeopleIcon sx={{ color: '#45b7d1', mr: 1 }} />
                    <Typography variant="h6" sx={{ flexGrow: 1 }}>Friends</Typography>
                    <Button startIcon={<PersonAddIcon />} component={Link} to="/friends/find" variant="contained"
                            sx={{ ...smallButton, background: '#e94560', boxShadow: 'none', '&:hover': { background: '#d63d56', boxShadow: 'none' } }}>
                        Find people
                    </Button>
                </PageHeader>

                {error && <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError('')}>{error}</Alert>}
                {!data && !error && <Box sx={{ textAlign: 'center', py: 6 }}><CircularProgress sx={{ color: '#e94560' }} /></Box>}

                {data && data.incoming.length > 0 && (
                    <Card sx={{ ...glassCard(theme), mb: 2.5, borderColor: 'rgba(233,69,96,0.45)' }}>
                        <CardContent sx={{ p: 2.5, '&:last-child': { pb: 2 } }}>
                            <Typography sx={{ ...sectionTitle(theme), mb: 1 }}>Friend requests</Typography>
                            {data.incoming.map((r) => (
                                <Box key={r.id} sx={{ display: 'flex', alignItems: 'center', gap: 1.5, py: 1 }}>
                                    <PersonAvatar person={r.person} />
                                    <Box sx={{ flex: 1, minWidth: 0 }}>
                                        <Typography noWrap sx={{ color: theme.mix(1), fontWeight: 700, fontFamily: FONT }}>{r.person.name}</Typography>
                                        <Typography sx={{ color: theme.mix(0.5), fontSize: '0.78rem', fontFamily: FONT }}>wants to be friends</Typography>
                                    </Box>
                                    <Button size="small" variant="contained" disabled={busy === `a${r.id}`}
                                            onClick={() => act(`a${r.id}`, () => API.post(`/friends/requests/${r.id}/accept`))}
                                            sx={{ ...smallButton, background: '#4ecdc4', color: '#1a1a2e', boxShadow: 'none', '&:hover': { background: '#3dbdb4', boxShadow: 'none' } }}>
                                        Accept
                                    </Button>
                                    <Button size="small" disabled={busy === `d${r.id}`}
                                            onClick={() => act(`d${r.id}`, () => API.delete(`/friends/requests/${r.id}`))}
                                            sx={{ ...smallButton, color: theme.mix(0.6) }}>
                                        Decline
                                    </Button>
                                </Box>
                            ))}
                        </CardContent>
                    </Card>
                )}

                {data && (
                    <>
                        <Typography sx={{ ...sectionTitle(theme), mb: 1.5 }}>
                            Your friends{data.friends.length > 0 ? ` (${data.friends.length})` : ''}
                        </Typography>
                        {data.friends.length === 0 ? (
                            <Card sx={{ ...glassCard(theme), mb: 2.5 }}>
                                <CardContent sx={{ p: 4, textAlign: 'center' }}>
                                    <PeopleIcon sx={{ fontSize: 44, color: theme.mix(0.3) }} />
                                    <Typography sx={{ color: theme.mix(1), fontWeight: 700, mt: 1, fontFamily: FONT }}>Train with friends</Typography>
                                    <Typography sx={{ color: theme.mix(0.55), fontSize: '0.9rem', mt: 0.5, mb: 2, fontFamily: FONT }}>
                                        Add friends to chat, send challenges and keep each other going.
                                    </Typography>
                                    <Button component={Link} to="/friends/find" variant="contained"
                                            sx={{ ...smallButton, px: 3, background: '#e94560', boxShadow: 'none', '&:hover': { background: '#d63d56', boxShadow: 'none' } }}>
                                        Find people
                                    </Button>
                                </CardContent>
                            </Card>
                        ) : (
                            <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', lg: 'repeat(2, 1fr)' }, gap: 1.5, mb: 2.5 }}>
                                {data.friends.map((f) => (
                                    <Card key={f.person.id} sx={glassCard(theme)}>
                                        <CardContent sx={{ p: 1.75, '&:last-child': { pb: 1.75 }, display: 'flex', alignItems: 'center', gap: 1.5 }}>
                                            <PersonAvatar person={f.person} size={44} />
                                            <Box sx={{ flex: 1, minWidth: 0 }}>
                                                <Typography noWrap sx={{ color: theme.mix(1), fontWeight: 700, fontFamily: FONT }}>{f.person.name}</Typography>
                                                <Typography sx={{ color: theme.mix(0.45), fontSize: '0.75rem', fontFamily: FONT }}>
                                                    {f.since ? `Friends since ${since(f.since)}` : 'Friends'}
                                                </Typography>
                                            </Box>
                                            <Tooltip title="Message">
                                                <IconButton onClick={() => navigate(`/friends/messages/${f.person.id}`)} aria-label={`Message ${f.person.name}`} sx={{ color: '#45b7d1' }}>
                                                    <ChatBubbleOutlineIcon fontSize="small" />
                                                </IconButton>
                                            </Tooltip>
                                            {Object.entries(ALERT_KINDS).map(([kind, cfg]) => (
                                                <Tooltip key={kind} title={cfg.title}>
                                                    <IconButton onClick={() => setAlertFor({ person: f.person, kind })} aria-label={`${cfg.title} ${f.person.name}`} sx={{ color: cfg.color }}>
                                                        <cfg.Icon fontSize="small" />
                                                    </IconButton>
                                                </Tooltip>
                                            ))}
                                            <IconButton onClick={(e) => setMenu({ anchor: e.currentTarget, person: f.person })} aria-label="More" sx={{ color: theme.mix(0.45) }}>
                                                <MoreVertIcon fontSize="small" />
                                            </IconButton>
                                        </CardContent>
                                    </Card>
                                ))}
                            </Box>
                        )}

                        {data.outgoing.length > 0 && (
                            <Card sx={glassCard(theme)}>
                                <CardContent sx={{ p: 2.5, '&:last-child': { pb: 1.5 } }}>
                                    <Typography sx={{ ...sectionTitle(theme), mb: 1 }}>Requests you sent</Typography>
                                    {data.outgoing.map((r) => (
                                        <Box key={r.id} sx={{ display: 'flex', alignItems: 'center', gap: 1.5, py: 0.75 }}>
                                            <PersonAvatar person={r.person} size={34} />
                                            <Typography noWrap sx={{ flex: 1, color: theme.mix(0.9), fontWeight: 600, fontFamily: FONT }}>{r.person.name}</Typography>
                                            <Button size="small" disabled={busy === `c${r.id}`}
                                                    onClick={() => act(`c${r.id}`, () => API.delete(`/friends/requests/${r.id}`))}
                                                    sx={{ ...smallButton, color: theme.mix(0.6) }}>
                                                Cancel
                                            </Button>
                                        </Box>
                                    ))}
                                </CardContent>
                            </Card>
                        )}
                    </>
                )}
            </Box>

            <Menu anchorEl={menu?.anchor} open={!!menu} onClose={() => setMenu(null)}
                  slotProps={{ paper: { sx: { background: theme.menuBg, color: theme.mix(1), border: `1px solid ${theme.mix(0.1)}`, borderRadius: 2 } } }}>
                <MenuItem onClick={() => { const p = menu.person; setMenu(null); act(`r${p.id}`, () => API.delete(`/friends/${p.id}`)); }}
                          sx={{ color: '#e94560', fontFamily: FONT }}>
                    <ListItemIcon><PersonRemoveIcon fontSize="small" sx={{ color: '#e94560' }} /></ListItemIcon>
                    Remove friend
                </MenuItem>
            </Menu>

            {alertFor && (
                <ChallengeDialog person={alertFor.person} kind={alertFor.kind} onClose={() => setAlertFor(null)}
                                 onSent={() => navigate(`/friends/messages/${alertFor.person.id}`)} />
            )}
        </Box>
    );
}

export default Friends;
