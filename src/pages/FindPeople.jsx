import { useEffect, useState } from 'react';
import {
    Alert, Box, Button, Card, CardContent, CircularProgress, InputAdornment, TextField, Typography,
} from '@mui/material';
import PersonSearchIcon from '@mui/icons-material/PersonSearch';
import SearchIcon from '@mui/icons-material/Search';
import MailOutlineIcon from '@mui/icons-material/MailOutlined';
import API, { FRIENDS_EVENT } from '../services/api';
import { errorMessage } from '../services/errors';
import { useAppTheme } from '../context/ThemeContext';
import Blobs from '../components/Glass';
import PageHeader from '../components/PageHeader';
import PersonAvatar from '../components/PersonAvatar';
import { FONT, glassCard, fieldStyle, sectionTitle } from '../theme/styles';

const SEARCH_DELAY_MS = 350;

/** The button for someone in the results, depending on how you're connected. */
function RelationButton({ relation, busy, onAdd }) {
    const { theme } = useAppTheme();
    const base = { borderRadius: 999, textTransform: 'none', fontWeight: 700, fontFamily: FONT, px: 2, minWidth: 0, boxShadow: 'none' };
    if (relation === 'FRIEND') {
        return <Typography sx={{ color: '#4ecdc4', fontWeight: 700, fontSize: '0.85rem', fontFamily: FONT }}>Friends</Typography>;
    }
    if (relation === 'REQUESTED') {
        return <Typography sx={{ color: theme.mix(0.5), fontSize: '0.85rem', fontFamily: FONT }}>Request sent</Typography>;
    }
    return (
        <Button size="small" variant="contained" disabled={busy} onClick={onAdd}
                sx={{ ...base, background: relation === 'INCOMING' ? '#4ecdc4' : '#e94560', color: relation === 'INCOMING' ? '#1a1a2e' : '#fff', '&:hover': { boxShadow: 'none', background: relation === 'INCOMING' ? '#3dbdb4' : '#d63d56' } }}>
            {relation === 'INCOMING' ? 'Accept' : 'Add friend'}
        </Button>
    );
}

function FindPeople() {
    const { theme } = useAppTheme();
    const [query, setQuery] = useState('');
    const [results, setResults] = useState(null);
    const [searching, setSearching] = useState(false);
    const [suggestions, setSuggestions] = useState([]);
    const [busy, setBusy] = useState(null);
    const [error, setError] = useState('');
    const [email, setEmail] = useState('');
    const [inviting, setInviting] = useState(false);
    const [inviteNotice, setInviteNotice] = useState(null); // { severity, text }

    useEffect(() => {
        let ignore = false;
        API.get('/friends/suggestions').then((res) => { if (!ignore) setSuggestions(res.data); }).catch(() => {});
        return () => { ignore = true; };
    }, []);

    // Search as you type, once there are 3 letters, after a short pause.
    const q = query.trim();
    const canSearch = q.length >= 3;
    useEffect(() => {
        if (!canSearch) return undefined;
        let ignore = false;
        const id = setTimeout(() => {
            setSearching(true);
            API.get('/friends/search', { params: { q } })
                .then((res) => { if (!ignore) setResults(res.data); })
                .catch((err) => { if (!ignore) setError(errorMessage(err, 'Search failed')); })
                .finally(() => { if (!ignore) setSearching(false); });
        }, SEARCH_DELAY_MS);
        return () => { ignore = true; clearTimeout(id); };
    }, [q, canSearch]);

    const add = async (person, relation) => {
        setBusy(person.id);
        setError('');
        try {
            await API.post('/friends/requests', { userId: person.id });
            const next = relation === 'INCOMING' ? 'FRIEND' : 'REQUESTED';
            setResults((rs) => rs?.map((r) => (r.person.id === person.id ? { ...r, relation: next } : r)));
            setSuggestions((ss) => ss.map((s) => (s.person.id === person.id ? { ...s, relation: next } : s)));
            window.dispatchEvent(new Event(FRIENDS_EVENT));
        } catch (err) {
            setError(errorMessage(err, 'Could not send the request'));
        } finally {
            setBusy(null);
        }
    };

    const invite = async (e) => {
        e.preventDefault();
        setInviting(true);
        setInviteNotice(null);
        try {
            const res = await API.post('/friends/invite', { email });
            setInviteNotice({ severity: 'success', text: res.data.message });
            setEmail('');
        } catch (err) {
            setInviteNotice({ severity: 'error', text: errorMessage(err, 'Could not send the invitation') });
        } finally {
            setInviting(false);
        }
    };

    const personRow = (person, caption, relation) => (
        <Box key={person.id} sx={{ display: 'flex', alignItems: 'center', gap: 1.5, py: 1, borderTop: `1px solid ${theme.mix(0.07)}`, '&:first-of-type': { borderTop: 'none' } }}>
            <PersonAvatar person={person} />
            <Box sx={{ flex: 1, minWidth: 0 }}>
                <Typography noWrap sx={{ color: theme.mix(1), fontWeight: 700, fontFamily: FONT }}>{person.name}</Typography>
                {caption && <Typography sx={{ color: theme.mix(0.5), fontSize: '0.78rem', fontFamily: FONT }}>{caption}</Typography>}
            </Box>
            <RelationButton relation={relation} busy={busy === person.id} onAdd={() => add(person, relation)} />
        </Box>
    );

    return (
        <Box sx={{ minHeight: '100vh', background: theme.bgGradient, fontFamily: FONT, position: 'relative' }}>
            <Blobs />
            <Box sx={{ maxWidth: 760, mx: 'auto', py: 3, px: 2, position: 'relative', zIndex: 1, textAlign: 'left' }}>
                <PageHeader>
                    <PersonSearchIcon sx={{ color: '#45b7d1', mr: 1 }} />
                    <Typography variant="h6">Find people</Typography>
                </PageHeader>

                {error && <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError('')}>{error}</Alert>}

                <Card sx={{ ...glassCard(theme), mb: 2.5 }}>
                    <CardContent sx={{ p: 2.5, '&:last-child': { pb: 2 } }}>
                        <TextField fullWidth size="small" placeholder="Search by name or exact email" value={query}
                                   onChange={(e) => setQuery(e.target.value)} autoFocus
                                   slotProps={{
                                       input: {
                                           startAdornment: <InputAdornment position="start"><SearchIcon sx={{ color: theme.mix(0.45) }} /></InputAdornment>,
                                           endAdornment: searching ? <CircularProgress size={18} sx={{ color: theme.mix(0.5) }} /> : null,
                                       },
                                   }}
                                   sx={{ ...fieldStyle(theme), mb: 0 }} />
                        {!canSearch && q.length > 0 && (
                            <Typography sx={{ color: theme.mix(0.5), fontSize: '0.8rem', mt: 1, fontFamily: FONT }}>Type at least 3 letters.</Typography>
                        )}
                        {canSearch && results && (
                            <Box sx={{ mt: 1.5 }}>
                                {results.length === 0
                                    ? <Typography sx={{ color: theme.mix(0.55), fontSize: '0.9rem', py: 1, fontFamily: FONT }}>No one found. Invite them by email below.</Typography>
                                    : results.map((r) => personRow(r.person, null, r.relation))}
                            </Box>
                        )}
                    </CardContent>
                </Card>

                {suggestions.length > 0 && (
                    <Card sx={{ ...glassCard(theme), mb: 2.5 }}>
                        <CardContent sx={{ p: 2.5, '&:last-child': { pb: 1.5 } }}>
                            <Typography sx={{ ...sectionTitle(theme), mb: 1 }}>People you may know</Typography>
                            {suggestions.map((s) => personRow(s.person,
                                `${s.mutualFriends} mutual ${s.mutualFriends === 1 ? 'friend' : 'friends'}`, s.relation || 'NONE'))}
                        </CardContent>
                    </Card>
                )}

                <Card sx={glassCard(theme)}>
                    <CardContent component="form" onSubmit={invite} sx={{ p: 2.5, '&:last-child': { pb: 2.5 } }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
                            <MailOutlineIcon sx={{ color: '#e94560' }} />
                            <Typography sx={sectionTitle(theme)}>Invite a friend</Typography>
                        </Box>
                        <Typography sx={{ color: theme.mix(0.55), fontSize: '0.85rem', mb: 2, fontFamily: FONT }}>
                            Not on FitTracker yet? We'll email them a link to join for free.
                        </Typography>
                        {inviteNotice && <Alert severity={inviteNotice.severity} sx={{ mb: 2 }} onClose={() => setInviteNotice(null)}>{inviteNotice.text}</Alert>}
                        <Box sx={{ display: 'flex', gap: 1.5, flexWrap: 'wrap' }}>
                            <TextField type="email" size="small" required placeholder="friend@example.com" value={email}
                                       onChange={(e) => setEmail(e.target.value)} sx={{ ...fieldStyle(theme), mb: 0, flex: '1 1 240px' }} />
                            <Button type="submit" variant="contained" disabled={inviting}
                                    sx={{ borderRadius: 999, px: 3, textTransform: 'none', fontWeight: 700, fontFamily: FONT, background: '#e94560', boxShadow: 'none', '&:hover': { background: '#d63d56', boxShadow: 'none' } }}>
                                {inviting ? <CircularProgress size={20} color="inherit" /> : 'Send invite'}
                            </Button>
                        </Box>
                    </CardContent>
                </Card>
            </Box>
        </Box>
    );
}

export default FindPeople;
