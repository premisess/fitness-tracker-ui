import API from './api';

/**
 * Downloads the workout report the backend renders (PDFBox, /api/export/workouts/pdf).
 * The server is the single source of truth for the report layout — pages just trigger it.
 */
export default async function exportWorkoutsPdf() {
    const res = await API.get('/export/workouts/pdf', { responseType: 'blob' });
    const url = window.URL.createObjectURL(new Blob([res.data], { type: 'application/pdf' }));
    const link = document.createElement('a');
    link.href = url;
    link.download = 'workout-report.pdf';
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.URL.revokeObjectURL(url);
}
