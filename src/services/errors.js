/**
 * Turns an axios error into text a user can act on. The backend always sends
 * { message } for errors; this falls back when the server couldn't be reached at all.
 */
export function errorMessage(err, fallback = 'Something went wrong. Please try again.') {
    if (!err?.response) {
        return 'Cannot reach the server. Check your connection and try again.';
    }
    const data = err.response.data;
    if (typeof data === 'string' && data.trim()) {
        return data;
    }
    return data?.message || fallback;
}
