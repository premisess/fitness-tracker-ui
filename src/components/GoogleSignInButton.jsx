import { useEffect, useRef, useState } from 'react';
import { Box, Button, CircularProgress, Tooltip } from '@mui/material';
import API from '../services/api';
import { useAppTheme } from '../context/ThemeContext';

const GIS_SRC = 'https://accounts.google.com/gsi/client';

// Both are loaded once per page and shared by every button.
let gisPromise = null;
let providersPromise = null;

function loadGoogleIdentityServices() {
    if (window.google?.accounts?.id) return Promise.resolve();
    if (!gisPromise) {
        gisPromise = new Promise((resolve, reject) => {
            const script = document.createElement('script');
            script.src = GIS_SRC;
            script.async = true;
            script.onload = resolve;
            script.onerror = () => {
                gisPromise = null;
                reject(new Error('Google sign-in could not be loaded'));
            };
            document.head.appendChild(script);
        });
    }
    return gisPromise;
}

function loadProviders() {
    if (!providersPromise) {
        providersPromise = API.get('/auth/providers')
            .then((res) => res.data)
            .catch((err) => {
                providersPromise = null;
                throw err;
            });
    }
    return providersPromise;
}

function GoogleLogo() {
    return (
        <svg width="18" height="18" viewBox="0 0 48 48" aria-hidden="true">
            <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z" />
            <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z" />
            <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z" />
            <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z" />
        </svg>
    );
}

/**
 * "Continue with Google". Renders Google's own button once the server reports a client ID; until then,
 * or when Google sign-in isn't configured, shows a matching placeholder explaining why it can't be used.
 * onCredential receives the ID token to send to POST /api/auth/google.
 */
function GoogleSignInButton({ onCredential, text = 'continue_with', busy = false, iconOnly = false }) {
    const { mode } = useAppTheme();
    const containerRef = useRef(null);
    const callbackRef = useRef(onCredential);
    const [status, setStatus] = useState('loading'); // loading | ready | unavailable | error

    useEffect(() => {
        callbackRef.current = onCredential;
    }, [onCredential]);

    useEffect(() => {
        let cancelled = false;
        loadProviders()
            .then(({ googleClientId }) => {
                if (!googleClientId) {
                    if (!cancelled) setStatus('unavailable');
                    return undefined;
                }
                return loadGoogleIdentityServices().then(() => {
                    const container = containerRef.current;
                    if (cancelled || !container) return;
                    window.google.accounts.id.initialize({
                        client_id: googleClientId,
                        callback: (response) => callbackRef.current?.(response.credential),
                        ux_mode: 'popup',
                        cancel_on_tap_outside: true,
                    });
                    container.innerHTML = '';
                    if (iconOnly) {
                        window.google.accounts.id.renderButton(container, {
                            type: 'icon',
                            shape: 'circle',
                            theme: mode === 'dark' ? 'filled_black' : 'outline',
                            size: 'large',
                        });
                    } else {
                        window.google.accounts.id.renderButton(container, {
                            type: 'standard',
                            theme: mode === 'dark' ? 'filled_black' : 'outline',
                            size: 'large',
                            shape: 'pill',
                            text,
                            logo_alignment: 'left',
                            width: Math.round(Math.min(400, Math.max(220, container.offsetWidth))),
                        });
                    }
                    setStatus('ready');
                });
            })
            .catch(() => {
                if (!cancelled) setStatus('error');
            });
        return () => { cancelled = true; };
    }, [mode, text, iconOnly]);

    const reason = status === 'unavailable'
        ? "Google sign-in isn't set up on this server yet"
        : status === 'error' ? "Couldn't reach Google sign-in. Check your connection and reload." : '';

    const placeholder = iconOnly ? null : (status === 'loading' ? <CircularProgress size={16} /> : <GoogleLogo />);

    return (
        <Box sx={{ position: 'relative', minHeight: 44, width: iconOnly ? 48 : '100%', mx: 'auto' }}>
            {/* Google draws its button (an iframe) in here */}
            <Box ref={containerRef} sx={{ display: 'flex', justifyContent: 'center', colorScheme: 'light' }} />

            {status !== 'ready' && (
                <Tooltip title={reason} placement="top" arrow>
                    <span>
                        <Button fullWidth disabled variant="outlined"
                                sx={{
                                    width: iconOnly ? 48 : 'auto', height: iconOnly ? 48 : 'auto', minWidth: iconOnly ? 48 : 'auto',
                                    borderRadius: iconOnly ? '50%' : 999, py: 1.1, textTransform: 'none', fontWeight: 600,
                                    fontFamily: "'Poppins', sans-serif",
                                    '&.Mui-disabled': { color: 'text.secondary', borderColor: 'divider', opacity: 0.8 },
                                }}>
                            {placeholder}
                        </Button>
                    </span>
                </Tooltip>
            )}

            {busy && (
                <Box sx={{
                    position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center',
                    background: 'rgba(0,0,0,0.25)', borderRadius: iconOnly ? '50%' : 999,
                }}>
                    <CircularProgress size={22} sx={{ color: '#fff' }} />
                </Box>
            )}
        </Box>
    );
}

export default GoogleSignInButton;
