import { useCallback, useEffect, useRef, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import {
    Alert, Badge, Box, Button, Card, CircularProgress, IconButton, TextField, Tooltip, Typography, useMediaQuery,
} from '@mui/material';
import ChatIcon from '@mui/icons-material/Chat';
import SendIcon from '@mui/icons-material/Send';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import API, { FRIENDS_EVENT } from '../services/api';
import { errorMessage } from '../services/errors';
import { useAppTheme } from '../context/ThemeContext';
import Blobs from '../components/Glass';
import PageHeader from '../components/PageHeader';
import PersonAvatar from '../components/PersonAvatar';
import ChallengeDialog from '../components/ChallengeDialog';
import { ALERT_KINDS } from '../utils/alerts';
import { FONT, glassCard, fieldStyle } from '../theme/styles';

// How often an open chat checks for new messages.
const THREAD_POLL_MS = 5000;

const when = (iso) => {
    const d = new Date(iso);
    const today = new Date();
    return d.toDateString() === today.toDateString()
        ? d.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' })
        : d.toLocaleDateString(undefined, { day: 'numeric', month: 'short' });
};

function Bubble({ message }) {
    const { theme } = useAppTheme();
    const alert = ALERT_KINDS[message.kind];
    const mine = message.fromMe;
    return (
        <Box sx={{ display: 'flex', justifyContent: mine ? 'flex-end' : 'flex-start', mb: 1 }}>
            <Box sx={{
                maxWidth: '78%', px: 1.75, py: 1.1, borderRadius: 3,
                borderBottomRightRadius: mine ? 6 : 24, borderBottomLeftRadius: mine ? 24 : 6,
                background: alert ? `${alert.color}1f` : mine ? '#e94560' : theme.mix(0.08),
                border: alert ? `1px solid ${alert.color}66` : 'none',
                color: mine && !alert ? '#fff' : theme.mix(0.95),
            }}>
                {alert && (
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75, mb: 0.5, color: alert.color }}>
                        <alert.Icon sx={{ fontSize: 18 }} />
                        <Typography sx={{ fontWeight: 800, fontSize: '0.8rem', fontFamily: FONT }}>{alert.title}</Typography>
                    </Box>
                )}
                <Typography sx={{ fontSize: '0.9rem', fontFamily: FONT, whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>{message.body}</Typography>
                <Typography sx={{ fontSize: '0.68rem', mt: 0.25, textAlign: 'right', fontFamily: FONT, opacity: 0.7 }}>{when(message.createdAt)}</Typography>
            </Box>
        </Box>
    );
}

function Messages() {
    const { theme } = useAppTheme();
    const navigate = useNavigate();
    const { userId } = useParams();
    const openId = userId ? Number(userId) : null;
    const wide = useMediaQuery('(min-width:760px)');

    const [conversations, setConversations] = useState(null);
    const [friends, setFriends] = useState([]);
    const [thread, setThread] = useState(null);
    const [text, setText] = useState('');
    const [sending, setSending] = useState(false);
    const [error, setError] = useState('');
    const [alertKind, setAlertKind] = useState(null);
    const bottomRef = useRef(null);

    const loadConversations = useCallback(() => {
        API.get('/friends/messages').then((res) => setConversations(res.data)).catch((err) => setError(errorMessage(err, 'Could not load messages')));
    }, []);

    useEffect(() => {
        loadConversations();
        API.get('/friends').then((res) => setFriends(res.data.friends)).catch(() => {});
    }, [loadConversations]);

    // The open chat, refreshed every few seconds while it's on screen.
    useEffect(() => {
        if (!openId) return undefined;
        let ignore = false;
        const load = () => API.get(`/friends/${openId}/messages`)
            .then((res) => {
                if (ignore) return;
                setThread((prev) => (prev && prev.length === res.data.length && prev.at(-1)?.id === res.data.at(-1)?.id ? prev : res.data));
                window.dispatchEvent(new Event(FRIENDS_EVENT));
            })
            .catch((err) => { if (!ignore) setError(errorMessage(err, 'Could not load this chat')); });
        load();
        const id = setInterval(load, THREAD_POLL_MS);
        return () => { ignore = true; clearInterval(id); setThread(null); };
    }, [openId]);

    useEffect(() => {
        bottomRef.current?.scrollIntoView({ block: 'end' });
    }, [thread]);

    const send = async (e) => {
        e.preventDefault();
        if (!text.trim()) return;
        setSending(true);
        try {
            const res = await API.post(`/friends/${openId}/messages`, { kind: 'TEXT', body: text });
            setThread((t) => [...(t || []), res.data]);
            setText('');
            loadConversations();
        } catch (err) {
            setError(errorMessage(err, 'Could not send your message'));
        } finally {
            setSending(false);
        }
    };

    // Friends you haven't messaged yet, so a chat can be started from here.
    const talkedTo = new Set((conversations || []).map((c) => c.person.id));
    const others = friends.filter((f) => !talkedTo.has(f.person.id));
    const openPerson = (conversations || []).find((c) => c.person.id === openId)?.person
        || friends.find((f) => f.person.id === openId)?.person;

    const list = (
        <Card sx={{ ...glassCard(theme), height: '100%', overflowY: 'auto' }}>
            {conversations === null && <Box sx={{ textAlign: 'center', py: 4 }}><CircularProgress size={24} sx={{ color: '#e94560' }} /></Box>}
            {conversations && conversations.length === 0 && others.length === 0 && (
                <Box sx={{ p: 3, textAlign: 'center' }}>
                    <Typography sx={{ color: theme.mix(0.6), fontSize: '0.9rem', fontFamily: FONT, mb: 1.5 }}>Add friends to start chatting.</Typography>
                    <Button component={Link} to="/friends/find" size="small" sx={{ color: '#e94560', textTransform: 'none', fontWeight: 700 }}>Find people</Button>
                </Box>
            )}
            {(conversations || []).map((c) => (
                <Box key={c.person.id} component={Link} to={`/friends/messages/${c.person.id}`} sx={{
                    display: 'flex', alignItems: 'center', gap: 1.5, px: 2, py: 1.5, textDecoration: 'none',
                    background: c.person.id === openId ? theme.mix(0.08) : 'transparent',
                    borderBottom: `1px solid ${theme.mix(0.06)}`, '&:hover': { background: theme.mix(0.06) },
                }}>
                    <Badge badgeContent={c.unread} color="error" overlap="circular">
                        <PersonAvatar person={c.person} />
                    </Badge>
                    <Box sx={{ flex: 1, minWidth: 0 }}>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', gap: 1 }}>
                            <Typography noWrap sx={{ color: theme.mix(1), fontWeight: c.unread ? 800 : 700, fontFamily: FONT }}>{c.person.name}</Typography>
                            <Typography sx={{ color: theme.mix(0.4), fontSize: '0.72rem', fontFamily: FONT, flexShrink: 0 }}>{when(c.last.createdAt)}</Typography>
                        </Box>
                        <Typography noWrap sx={{ color: c.unread ? theme.mix(0.85) : theme.mix(0.5), fontSize: '0.82rem', fontFamily: FONT }}>
                            {c.last.fromMe ? 'You · ' : ''}{ALERT_KINDS[c.last.kind] ? `${ALERT_KINDS[c.last.kind].title} · ` : ''}{c.last.body}
                        </Typography>
                    </Box>
                </Box>
            ))}
            {others.length > 0 && (
                <Box sx={{ px: 2, pt: 1.5, pb: 1 }}>
                    <Typography sx={{ color: theme.mix(0.45), fontSize: '0.72rem', fontWeight: 700, letterSpacing: 1, textTransform: 'uppercase', fontFamily: FONT, mb: 0.5 }}>
                        Start a chat
                    </Typography>
                    {others.map((f) => (
                        <Box key={f.person.id} component={Link} to={`/friends/messages/${f.person.id}`} sx={{
                            display: 'flex', alignItems: 'center', gap: 1.25, py: 0.9, textDecoration: 'none', borderRadius: 2, '&:hover': { background: theme.mix(0.06) },
                        }}>
                            <PersonAvatar person={f.person} size={30} />
                            <Typography noWrap sx={{ color: theme.mix(0.85), fontSize: '0.88rem', fontWeight: 600, fontFamily: FONT }}>{f.person.name}</Typography>
                        </Box>
                    ))}
                </Box>
            )}
        </Card>
    );

    const chat = openId ? (
        <Card sx={{ ...glassCard(theme), height: '100%', display: 'flex', flexDirection: 'column' }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, px: 1.5, py: 1.25, borderBottom: `1px solid ${theme.mix(0.08)}` }}>
                {!wide && (
                    <IconButton onClick={() => navigate('/friends/messages')} aria-label="Back to conversations" sx={{ color: theme.mix(0.8) }}>
                        <ArrowBackIcon />
                    </IconButton>
                )}
                {openPerson && <PersonAvatar person={openPerson} size={34} />}
                <Typography noWrap sx={{ flex: 1, color: theme.mix(1), fontWeight: 700, fontFamily: FONT }}>{openPerson?.name || ''}</Typography>
                {Object.entries(ALERT_KINDS).map(([kind, cfg]) => (
                    <Tooltip key={kind} title={cfg.title}>
                        <IconButton onClick={() => setAlertKind(kind)} aria-label={cfg.title} sx={{ color: cfg.color }} disabled={!openPerson}>
                            <cfg.Icon fontSize="small" />
                        </IconButton>
                    </Tooltip>
                ))}
            </Box>
            <Box sx={{ flex: 1, overflowY: 'auto', p: 2 }}>
                {thread === null
                    ? <Box sx={{ textAlign: 'center', py: 4 }}><CircularProgress size={24} sx={{ color: '#e94560' }} /></Box>
                    : thread.length === 0
                        ? <Typography sx={{ color: theme.mix(0.5), textAlign: 'center', py: 4, fontSize: '0.9rem', fontFamily: FONT }}>Say hi, or send a challenge to get things going.</Typography>
                        : thread.map((m) => <Bubble key={m.id} message={m} />)}
                <div ref={bottomRef} />
            </Box>
            <Box component="form" onSubmit={send} sx={{ display: 'flex', gap: 1, p: 1.5, borderTop: `1px solid ${theme.mix(0.08)}` }}>
                <TextField fullWidth size="small" placeholder="Write a message" value={text} onChange={(e) => setText(e.target.value)}
                           inputProps={{ maxLength: 1000 }} sx={{ ...fieldStyle(theme), mb: 0 }} />
                <IconButton type="submit" disabled={sending || !text.trim()} aria-label="Send"
                            sx={{ background: '#e94560', color: '#fff', '&:hover': { background: '#d63d56' }, '&.Mui-disabled': { background: theme.mix(0.1) } }}>
                    <SendIcon fontSize="small" />
                </IconButton>
            </Box>
        </Card>
    ) : (
        <Card sx={{ ...glassCard(theme), height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', p: 3 }}>
            <Box sx={{ textAlign: 'center' }}>
                <ChatIcon sx={{ fontSize: 44, color: theme.mix(0.25) }} />
                <Typography sx={{ color: theme.mix(0.55), fontFamily: FONT, mt: 1 }}>Pick a conversation to start chatting.</Typography>
            </Box>
        </Card>
    );

    return (
        <Box sx={{ minHeight: '100vh', background: theme.bgGradient, fontFamily: FONT, position: 'relative' }}>
            <Blobs />
            <Box sx={{ maxWidth: 1000, mx: 'auto', py: 3, px: 2, position: 'relative', zIndex: 1, textAlign: 'left' }}>
                <PageHeader>
                    <ChatIcon sx={{ color: '#45b7d1', mr: 1 }} />
                    <Typography variant="h6">Messages</Typography>
                </PageHeader>
                {error && <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError('')}>{error}</Alert>}
                <Box sx={{
                    display: 'grid', gap: 2, height: 'calc(100vh - 200px)', minHeight: 420,
                    gridTemplateColumns: wide ? '300px 1fr' : '1fr',
                }}>
                    {(wide || !openId) && list}
                    {(wide || openId) && chat}
                </Box>
            </Box>

            {alertKind && openPerson && (
                <ChallengeDialog person={openPerson} kind={alertKind} onClose={() => setAlertKind(null)}
                                 onSent={(m) => { setThread((t) => [...(t || []), m]); loadConversations(); }} />
            )}
        </Box>
    );
}

export default Messages;
