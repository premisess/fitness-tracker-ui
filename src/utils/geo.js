// Geometry and formatting helpers for GPS activities. The filtering in createActivityTracker
// mirrors the backend's RunMetricsCalculator, so the live numbers match what gets saved.

const EARTH_RADIUS_M = 6371008.8;
const toRad = (deg) => (deg * Math.PI) / 180;

export const GPS_ACTIVITY_TYPES = ['Running', 'Walking', 'Hiking', 'Cycling'];

// A fix vaguer than this can't place you on the right street.
export const MAX_ACCURACY_M = 50;

// Moving faster than this between fixes is a GPS jump, not you.
const MAX_SPEED_MPS = { Running: 12.5, Walking: 4, Hiking: 5, Cycling: 25 };

// After this many jumps in a row, trust the new position (the old anchor was the bad one).
const MAX_REJECTED_IN_A_ROW = 3;

export function haversineMeters(a, b) {
    const dLat = toRad(b.lat - a.lat);
    const dLng = toRad(b.lng - a.lng);
    const h = Math.sin(dLat / 2) ** 2
        + Math.cos(toRad(a.lat)) * Math.cos(toRad(b.lat)) * Math.sin(dLng / 2) ** 2;
    return 2 * EARTH_RADIUS_M * Math.asin(Math.min(1, Math.sqrt(h)));
}

/** Movement smaller than this is treated as GPS jitter, scaled to how accurate the fix is. */
export function movementThreshold(accuracy) {
    return Math.min(10, Math.max(3, (accuracy || 0) * 0.5));
}

/**
 * Incremental distance / moving-time tracker for a live activity. Feed it every fix as
 * { lat, lng, t (epoch ms), acc, seg }; `seg` increases after each pause.
 */
export function createActivityTracker(type) {
    const maxSpeed = MAX_SPEED_MPS[type] ?? MAX_SPEED_MPS.Running;
    let anchor = null;
    let segmentStart = 0;
    let lastInSegment = null;
    let closedSegmentsSec = 0;
    let distance = 0;
    let rejectedInARow = 0;
    const history = [];

    return {
        add(point) {
            if (point.acc != null && point.acc > MAX_ACCURACY_M) return;

            if (anchor && point.seg !== anchor.seg) {
                closedSegmentsSec += (lastInSegment.t - segmentStart) / 1000;
                anchor = null;
            }
            if (!anchor) {
                anchor = point;
                segmentStart = point.t;
                lastInSegment = point;
                rejectedInARow = 0;
                return;
            }

            const d = haversineMeters(anchor, point);
            const dt = (point.t - anchor.t) / 1000;
            if (dt > 0 && d / dt > maxSpeed) {
                rejectedInARow += 1;
                if (rejectedInARow >= MAX_REJECTED_IN_A_ROW) {
                    anchor = point;
                    lastInSegment = point;
                    rejectedInARow = 0;
                }
                return;
            }
            rejectedInARow = 0;
            lastInSegment = point;
            if (d < movementThreshold(point.acc)) return;

            distance += d;
            anchor = point;
            history.push({ t: point.t, seg: point.seg, distance });
            if (history.length > 120) history.shift();
        },

        get distanceMeters() {
            return distance;
        },

        get movingTimeSec() {
            const current = lastInSegment ? (lastInSegment.t - segmentStart) / 1000 : 0;
            return closedSegmentsSec + current;
        },

        /** Pace over roughly the last 30 seconds of movement in the current segment. */
        currentPaceSecPerKm() {
            if (history.length < 2) return null;
            const latest = history[history.length - 1];
            const earlier = [...history].reverse()
                .find((h) => h.seg === latest.seg && latest.t - h.t >= 30000);
            if (!earlier) return null;
            const meters = latest.distance - earlier.distance;
            return meters > 0 ? ((latest.t - earlier.t) / 1000) / (meters / 1000) : null;
        },
    };
}

/** Decodes a Google encoded polyline into [[lat, lng], ...]. */
export function decodePolyline(encoded, precision = 5) {
    if (!encoded) return [];
    const factor = 10 ** precision;
    const coords = [];
    let index = 0;
    let lat = 0;
    let lng = 0;
    while (index < encoded.length) {
        for (let axis = 0; axis < 2; axis += 1) {
            let result = 0;
            let shift = 0;
            let byte;
            do {
                byte = encoded.charCodeAt(index) - 63;
                index += 1;
                result |= (byte & 0x1f) << shift;
                shift += 5;
            } while (byte >= 0x20);
            const delta = (result & 1) ? ~(result >> 1) : (result >> 1);
            if (axis === 0) lat += delta; else lng += delta;
        }
        coords.push([lat / factor, lng / factor]);
    }
    return coords;
}

export function formatDuration(totalSec) {
    const s = Math.max(0, Math.round(totalSec || 0));
    const h = Math.floor(s / 3600);
    const m = Math.floor((s % 3600) / 60);
    const sec = s % 60;
    const mm = String(m).padStart(h ? 2 : 1, '0');
    const ss = String(sec).padStart(2, '0');
    return h ? `${h}:${mm}:${ss}` : `${mm}:${ss}`;
}

export function formatDistance(meters) {
    if (meters == null) return '–';
    return meters < 1000 ? `${Math.round(meters)} m` : `${(meters / 1000).toFixed(2)} km`;
}

export function formatPace(secPerKm) {
    if (!secPerKm || !Number.isFinite(secPerKm) || secPerKm > 3600) return '–';
    const s = Math.round(secPerKm);
    return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')} /km`;
}

export function formatSpeed(distanceMeters, seconds) {
    if (!distanceMeters || !seconds) return '–';
    return `${((distanceMeters / 1000) / (seconds / 3600)).toFixed(1)} km/h`;
}

/** Cyclists think in km/h; runners, walkers and hikers think in minutes per km. */
export function usesSpeed(type) {
    return type === 'Cycling';
}

export function paceOrSpeed(type, distanceMeters, seconds) {
    if (usesSpeed(type)) return formatSpeed(distanceMeters, seconds);
    return distanceMeters > 0 ? formatPace(seconds / (distanceMeters / 1000)) : '–';
}
