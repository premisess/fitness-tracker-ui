// How people reach FitTracker. Each deployment can override these (see .env.example).
export const CONTACT_EMAIL = import.meta.env.VITE_CONTACT_EMAIL || 'joglows97@gmail.com';
// International format without spaces, for tel: links.
export const CONTACT_PHONE = import.meta.env.VITE_CONTACT_PHONE || '+255623413993';

/** "+255623413993" → "+255 623 413 993" */
export const formatPhone = (phone) => phone.replace(/^(\+\d{3})(\d{3})(\d{3})(\d{3})$/, '$1 $2 $3 $4');
