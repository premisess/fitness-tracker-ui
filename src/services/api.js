import axios from 'axios';

// Session-based auth: the backend sets an HttpOnly JSESSIONID cookie on login/register.
// withCredentials makes the browser send and store that cookie on every request.
const API = axios.create({
    baseURL: 'http://localhost:8080/api',
    withCredentials: true,
});

export default API;