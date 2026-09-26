import API from '../services/api';

/** URL of an uploaded profile photo, served by the API wherever it's hosted. */
export const pictureUrl = (fileName) => (fileName ? `${API.defaults.baseURL}/profile/picture/${encodeURIComponent(fileName)}` : undefined);

/** A stable colour per person for avatars without a photo, from the app's palette. */
const AVATAR_COLORS = ['#e94560', '#4ecdc4', '#45b7d1', '#a29bfe', '#ff6b35', '#66bb6a', '#ffa726'];
export const avatarColor = (id) => AVATAR_COLORS[Math.abs(Number(id) || 0) % AVATAR_COLORS.length];
