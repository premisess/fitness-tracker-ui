import { useState } from 'react';
import { Alert, Box, Button, ListItemIcon, ListItemText, Menu, MenuItem, Snackbar } from '@mui/material';
import PhoneOutlinedIcon from '@mui/icons-material/PhoneOutlined';
import WhatsAppIcon from '@mui/icons-material/WhatsApp';
import { useAppTheme } from '../context/ThemeContext';
import { CONTACT_PHONE, formatPhone } from '../config/contact';
import { FONT } from '../theme/styles';

// How long to wait for the phone or WhatsApp app to take over before saying it isn't there.
const APP_OPEN_WAIT_MS = 1500;
const DIGITS = CONTACT_PHONE.replace('+', '');

/**
 * Opens an app link and reports back if nothing opened. A web page can't ask whether an app is
 * installed, but when one opens the page loses focus or is hidden, so staying focused means none did.
 */
function openApp(url, onMissing) {
    let opened = false;
    const markOpened = () => { opened = true; };
    window.addEventListener('blur', markOpened);
    window.addEventListener('pagehide', markOpened);
    document.addEventListener('visibilitychange', markOpened);

    window.location.href = url;

    setTimeout(() => {
        window.removeEventListener('blur', markOpened);
        window.removeEventListener('pagehide', markOpened);
        document.removeEventListener('visibilitychange', markOpened);
        if (!opened && document.visibilityState === 'visible') onMissing();
    }, APP_OPEN_WAIT_MS);
}

const MISSING = {
    call: 'No calling app was found on this device.',
    whatsapp: 'WhatsApp isn\'t installed on this device.',
};

/**
 * The FitTracker phone number. Clicking it offers a phone call or WhatsApp, and says so when the
 * chosen app isn't on the device.
 *
 * children: what to show as the clickable number; sx: styles for that clickable element.
 */
function PhoneContact({ children, sx }) {
    const { theme } = useAppTheme();
    const [anchorEl, setAnchorEl] = useState(null);
    const menuOpen = !!anchorEl;
    const [missing, setMissing] = useState(null); // 'call' | 'whatsapp' | null
    const [copied, setCopied] = useState(false);

    const choose = (kind) => {
        setAnchorEl(null);
        setMissing(null);
        openApp(kind === 'call' ? `tel:${CONTACT_PHONE}` : `whatsapp://send?phone=${DIGITS}`, () => setMissing(kind));
    };

    const copyNumber = async () => {
        try {
            await navigator.clipboard.writeText(formatPhone(CONTACT_PHONE));
            setCopied(true);
        } catch {
            // Clipboard blocked: the number is shown in the message anyway.
        }
    };

    const itemSx = { fontFamily: FONT, py: 1.25 };

    return (
        <>
            <Box component="button" type="button" onClick={(e) => setAnchorEl(e.currentTarget)}
                 aria-haspopup="menu" aria-expanded={menuOpen}
                 sx={{ font: 'inherit', background: 'none', border: 'none', p: 0, cursor: 'pointer', ...sx }}>
                {children ?? formatPhone(CONTACT_PHONE)}
            </Box>

            <Menu anchorEl={anchorEl} open={menuOpen} onClose={() => setAnchorEl(null)}
                  slotProps={{
                      paper: {
                          sx: {
                              mt: 0.5, borderRadius: 2, minWidth: 220,
                              background: theme.menuBg, color: theme.mix(1),
                              border: `1px solid ${theme.mix(0.1)}`,
                          },
                      },
                  }}>
                <MenuItem onClick={() => choose('call')} sx={itemSx}>
                    <ListItemIcon><PhoneOutlinedIcon sx={{ color: '#4ecdc4' }} /></ListItemIcon>
                    <ListItemText primary="Call" secondary={formatPhone(CONTACT_PHONE)}
                                  slotProps={{ secondary: { sx: { color: theme.mix(0.5) } } }} />
                </MenuItem>
                <MenuItem onClick={() => choose('whatsapp')} sx={itemSx}>
                    <ListItemIcon><WhatsAppIcon sx={{ color: '#66bb6a' }} /></ListItemIcon>
                    <ListItemText primary="WhatsApp" secondary="Send us a message"
                                  slotProps={{ secondary: { sx: { color: theme.mix(0.5) } } }} />
                </MenuItem>
            </Menu>

            <Snackbar open={!!missing} onClose={() => { setMissing(null); setCopied(false); }}
                      autoHideDuration={9000} anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}>
                <Alert severity="info" onClose={() => { setMissing(null); setCopied(false); }}
                       sx={{
                           fontFamily: FONT, alignItems: 'center', borderRadius: 2,
                           background: theme.menuBg, color: theme.mix(0.9),
                           border: `1px solid ${theme.mix(0.12)}`, boxShadow: '0 10px 30px rgba(0,0,0,0.25)',
                           '& .MuiAlert-icon': { color: '#4ecdc4' },
                           '& .MuiButton-root': { color: '#e94560' },
                       }}
                       action={(
                           <Button color="inherit" size="small" onClick={copyNumber} sx={{ textTransform: 'none', fontWeight: 700 }}>
                               {copied ? 'Copied' : 'Copy number'}
                           </Button>
                       )}>
                    {missing && MISSING[missing]} You can reach us on {formatPhone(CONTACT_PHONE)} from a phone.
                </Alert>
            </Snackbar>
        </>
    );
}

export default PhoneContact;
