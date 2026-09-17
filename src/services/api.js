import axios from 'axios';

// Session-based auth: the backend sets an HttpOnly JSESSIONID cookie on login/register.
// withCredentials makes the browser send and store that cookie on every request.
// VITE_API_URL is set per environment (see .env.example); "/api" when the site and API share a domain.
const API = axios.create({
    baseURL: import.meta.env.VITE_API_URL || 'http://localhost:8080/api',
    withCredentials: true,
});

// Saves that can earn a badge. BadgeCelebration listens for this and asks the server what was earned.
export const ACTIVITY_EVENT = 'fittracker:activity';

// The server answers 402 when a free user tries an Ultimate feature; UpgradeDialog listens for this.
export const UPGRADE_EVENT = 'fittracker:upgrade-required';

const ACTIVITY_PATHS = /^\/?(workouts|runs|nutrition\/diary|plans\/active\/sessions|water-intake|goals|bmi|auth\/verify-email)(\/|$|\?)/;

API.interceptors.response.use((response) => {
    const { method = 'get', url = '' } = response.config;
    if (method.toLowerCase() !== 'get' && ACTIVITY_PATHS.test(url)) {
        window.dispatchEvent(new Event(ACTIVITY_EVENT));
    }
    return response;
}, (error) => {
    if (error.response?.status === 402) {
        const message = typeof error.response.data?.message === 'string' ? error.response.data.message : null;
        window.dispatchEvent(new CustomEvent(UPGRADE_EVENT, { detail: message }));
    }
    return Promise.reject(error);
});

export default API;