import { useEffect } from 'react';
import { Box } from '@mui/material';
import { CircleMarker, MapContainer, Polyline, TileLayer, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';

// OpenStreetMap's public tiles suit development and light use; set VITE_MAP_TILE_URL for a busy site.
const TILE_URL = import.meta.env.VITE_MAP_TILE_URL || 'https://tile.openstreetmap.org/{z}/{x}/{y}.png';
const ATTRIBUTION = '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors';

function FitView({ positions, current, follow }) {
    const map = useMap();
    useEffect(() => {
        if (follow && current) {
            map.setView(current, Math.max(map.getZoom(), 16), { animate: true });
        } else if (positions.length >= 2) {
            map.fitBounds(positions, { padding: [24, 24] });
        } else if (positions.length === 1) {
            map.setView(positions[0], 16);
        } else if (current) {
            map.setView(current, 16);
        }
    }, [map, positions, current, follow]);
    return null;
}

/**
 * Draws a route on an OpenStreetMap map. positions are [lat, lng] pairs; hiddenPositions
 * (optional) draws a dashed grey line underneath, used to show what a privacy zone removes.
 */
function RouteMap({
    positions = [], hiddenPositions = null, current = null, follow = false,
    height = 320, interactive = true, color = '#e94560', radius = 2,
}) {
    const center = current || positions[0] || [20, 0];
    const hasRoute = positions.length > 1;

    return (
        <Box sx={{
            height, borderRadius: radius, overflow: 'hidden', position: 'relative', zIndex: 0,
            '& .leaflet-container': { height: '100%', width: '100%', background: '#dfe6e9', fontFamily: 'inherit' },
        }}>
            <MapContainer
                center={center}
                zoom={positions.length || current ? 15 : 2}
                scrollWheelZoom={interactive}
                dragging={interactive}
                doubleClickZoom={interactive}
                touchZoom={interactive}
                zoomControl={interactive}
                keyboard={interactive}
            >
                <TileLayer url={TILE_URL} attribution={ATTRIBUTION} />
                {hiddenPositions?.length > 1 && (
                    <Polyline positions={hiddenPositions} pathOptions={{ color: '#636e72', weight: 4, opacity: 0.6, dashArray: '6 8' }} />
                )}
                {hasRoute && <Polyline positions={positions} pathOptions={{ color, weight: 5, opacity: 0.9 }} />}
                {positions.length > 0 && !current && (
                    <CircleMarker center={positions[0]} radius={6}
                                  pathOptions={{ color: '#ffffff', weight: 2, fillColor: '#00b894', fillOpacity: 1 }} />
                )}
                {hasRoute && !current && (
                    <CircleMarker center={positions[positions.length - 1]} radius={6}
                                  pathOptions={{ color: '#ffffff', weight: 2, fillColor: '#d63031', fillOpacity: 1 }} />
                )}
                {current && (
                    <CircleMarker center={current} radius={8}
                                  pathOptions={{ color: '#ffffff', weight: 3, fillColor: '#0984e3', fillOpacity: 1 }} />
                )}
                <FitView positions={positions} current={current} follow={follow} />
            </MapContainer>
        </Box>
    );
}

export default RouteMap;
