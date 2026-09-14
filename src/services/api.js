import axios from 'axios';

// Session-based auth: the backend sets an HttpOnly JSESSIONID cookie on login/register.
// withCredentials makes the browser send and store that cookie on every request.
// VITE_API_URL is set per environment (see .env.example); "/api" when the site and API share a domain.
const API = axios.create({
    baseURL: import.meta.env.VITE_API_URL || 'http://localhost:8080/api',
    withCredentials: true,
});

export default API;