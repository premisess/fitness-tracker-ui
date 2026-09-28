import { useEffect, useRef, useState } from 'react';
import { Box, Button, CircularProgress, Tooltip } from '@mui/material';
import API from '../services/api';
import { useAppTheme } from '../context/ThemeContext';

const GIS_SRC = 'https://accounts.google.com/gsi/client';

// Both are loaded once per page and shared by every button.
let gisPromise = null;
let providersPromise = null;

function loadGoogleIdentityServices() {
    if (window.google?.accounts?.oauth2) return Promise.resolve();
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
 * "Continue with Google": the site's own glass button. A click opens Google's sign-in popup, which
 * always asks which account to use, so the page never shows the last Google account used on this
 * browser. onGoogle receives { accessToken } to send to POST /api/auth/google; onError gets a message.
 */
function GoogleSignInButton({ onGoogle, onError, text = 'continue_with', busy = false }) {
    const { mode, theme } = useAppTheme();
    const clientRef = useRef(null);
    const callbacksRef = useRef({ onGoogle, onError });
    const [status, setStatus] = useState('loading'); // loading | ready | unavailable | error

    useEffect(() => {
        callbacksRef.current = { onGoogle, onError };
    }, [onGoogle, onError]);

    useEffect(() => {
        let cancelled = false;
        loadProviders()
            .then(({ googleClientId }) => {
                if (!googleClientId) {
                    if (!cancelled) setStatus('unavailable');
                    return undefined;
                }
                return loadGoogleIdentityServices().then(() => {
                    if (cancelled) return;
                    clientRef.current = window.google.accounts.oauth2.initTokenClient({
                        client_id: googleClientId,
                        scope: 'openid email profile',
                        prompt: 'select_account',
                        callback: (response) => {
                            if (response.error || !response.access_token) {
                                callbacksRef.current.onError?.('Google sign-in was cancelled or failed. Please try again.');
                                return;
                            }
                            callbacksRef.current.onGoogle?.({ accessToken: response.access_token });
                        },
                        error_callback: (err) => {
                            // Closing the popup isn't an error worth showing.
                            if (err?.type === 'popup_closed') return;
                            callbacksRef.current.onError?.(err?.type === 'popup_failed_to_open'
                                ? 'Your browser blocked the Google window. Allow pop-ups for this site and try again.'
                                : 'Google sign-in failed. Please try again.');
                        },
                    });
                    setStatus('ready');
                });
            })
            .catch(() => {
                if (!cancelled) setStatus('error');
            });
        return () => { cancelled = true; };
    }, []);

    // Called straight from the click, so the browser allows the popup.
    const handleClick = () => {
        if (status !== 'ready' || busy) return;
        clientRef.current?.requestAccessToken();
    };

    const label = text === 'signup_with' ? 'Sign up with Google' : 'Continue with Google';
    const reason = status === 'unavailable'
        ? "Google sign-in isn't set up on this server yet"
        : status === 'error' ? "Couldn't reach Google sign-in. Check your connection and reload." : '';
    const disabled = status !== 'ready' || busy;

    const button = (
        <Button fullWidth onClick={handleClick} disabled={disabled}
                startIcon={busy || status === 'loading' ? <CircularProgress size={16} /> : <GoogleLogo />}
                sx={{
                    borderRadius: 999, py: 1.3, textTransform: 'none', fontWeight: 600, fontSize: '0.95rem',
                    color: mode === 'dark' ? '#ffffff' : '#0f172a',
                    background: mode === 'dark' ? 'rgba(255,255,255,0.09)' : 'rgba(255,255,255,0.65)',
                    backdropFilter: 'blur(10px)', WebkitBackdropFilter: 'blur(10px)',
                    border: `1px solid ${mode === 'dark' ? 'rgba(255,255,255,0.18)' : 'rgba(15,23,42,0.15)'}`,
                    fontFamily: "'Poppins', sans-serif",
                    '&:hover': { background: mode === 'dark' ? 'rgba(255,255,255,0.16)' : 'rgba(255,255,255,0.85)' },
                    '&.Mui-disabled': {
                        color: mode === 'dark' ? '#ffffffd9' : '#0f172abb',
                        borderColor: theme.mix(0.15), opacity: 0.85,
                    },
                }}>
            {label}
        </Button>
    );

    return reason
        ? <Tooltip title={reason} placement="top" arrow><span style={{ display: 'block' }}>{button}</span></Tooltip>
        : <Box>{button}</Box>;
}

export default GoogleSignInButton;
