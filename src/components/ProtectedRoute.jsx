import { useState, useEffect } from 'react';
import { Navigate } from 'react-router-dom';
import API from '../services/api';
import { Box, CircularProgress } from '@mui/material';

function ProtectedRoute({ children, adminOnly = false }) {
    // The session lives in an HttpOnly cookie invisible to JS, so the only way
    // to know if we're logged in is to ask the backend.
    const [status, setStatus] = useState('checking'); // checking | ok | unauthorized | forbidden

    useEffect(() => {
        let cancelled = false;
        API.get('/auth/me')
            .then((res) => {
                if (cancelled) return;
                localStorage.setItem('name', res.data.name);
                localStorage.setItem('email', res.data.email);
                localStorage.setItem('role', res.data.role);
                setStatus(adminOnly && res.data.role !== 'ADMIN' ? 'forbidden' : 'ok');
            })
            .catch(() => {
                if (!cancelled) {
                    localStorage.clear();
                    setStatus('unauthorized');
                }
            });
        return () => { cancelled = true; };
    }, [adminOnly]);

    if (status === 'checking') {
        return (
            <Box sx={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <CircularProgress sx={{ color: '#e94560' }} />
            </Box>
        );
    }

    if (status === 'unauthorized') {
        return <Navigate to="/login" />;
    }

    if (status === 'forbidden') {
        return <Navigate to="/dashboard" />;
    }

    return children;
}

export default ProtectedRoute;
