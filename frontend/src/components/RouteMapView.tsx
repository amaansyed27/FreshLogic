import { useEffect, useState } from 'react';
import { MapContainer, TileLayer, Polyline, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

interface WaypointData {
    lat: number;
    lon: number;
    internal_temp: number;
    humidity: number;
    weather_temp: number;
    distance_km: number;
    hours_elapsed: number;
    risk_score?: number;
    spoilage_risk?: number;
}

interface RouteMapViewProps {
    origin: { lat: number; lon: number; name: string };
    destination: { lat: number; lon: number; name: string };
    waypoints: WaypointData[];
    cropType: string;
    overallRisk: number;
}

// Custom marker icons based on risk level
const createRiskIcon = (risk: number, isEndpoint: boolean = false) => {
    let color = '#22c55e'; // green
    
    if (risk > 0.5) {
        color = '#ef4444'; // red
    } else if (risk > 0.2) {
        color = '#f59e0b'; // yellow
    }

    const size = isEndpoint ? 24 : 16;
    const border = isEndpoint ? 3 : 2;

    return L.divIcon({
        className: 'custom-marker',
        html: `
            <div style="
                width: ${size}px;
                height: ${size}px;
                background: ${color};
                border: ${border}px solid white;
                border-radius: 50%;
                box-shadow: 0 2px 8px rgba(0,0,0,0.4);
                cursor: pointer;
            "></div>
        `,
        iconSize: [size, size],
        iconAnchor: [size/2, size/2],
        popupAnchor: [0, -size/2]
    });
};

// Origin marker (green flag)
const originIcon = L.divIcon({
    className: 'origin-marker',
    html: `
        <div style="
            display: flex;
            align-items: center;
            gap: 4px;
            background: #22c55e;
            color: white;
            padding: 4px 8px;
            border-radius: 12px;
            font-size: 11px;
            font-weight: 600;
            white-space: nowrap;
            box-shadow: 0 2px 8px rgba(0,0,0,0.3);
        ">
            🌾 Origin
        </div>
    `,
    iconSize: [70, 24],
    iconAnchor: [35, 12]
});

// Destination marker (red flag)
const destinationIcon = L.divIcon({
    className: 'dest-marker',
    html: `
        <div style="
            display: flex;
            align-items: center;
            gap: 4px;
            background: #ef4444;
            color: white;
            padding: 4px 8px;
            border-radius: 12px;
            font-size: 11px;
            font-weight: 600;
            white-space: nowrap;
            box-shadow: 0 2px 8px rgba(0,0,0,0.3);
        ">
            📍 Destination
        </div>
    `,
    iconSize: [90, 24],
    iconAnchor: [45, 12]
});

// Map bounds auto-fit component
function FitBounds({ waypoints }: { waypoints: WaypointData[] }) {
    const map = useMap();
    
    useEffect(() => {
        if (waypoints.length > 0) {
            const bounds = L.latLngBounds(waypoints.map(w => [w.lat, w.lon]));
            map.fitBounds(bounds, { padding: [50, 50] });
        }
    }, [waypoints, map]);
    
    return null;
}

export default function RouteMapView({ origin, destination, waypoints, cropType, overallRisk }: RouteMapViewProps) {
    const [selectedWaypoint, setSelectedWaypoint] = useState<WaypointData | null>(null);

    // Create polyline coordinates
    const polylinePositions: [number, number][] = waypoints.map(w => [w.lat, w.lon]);

    // Default center (India)
    const defaultCenter: [number, number] = [20.5937, 78.9629];

    return (
        <div className="relative h-full w-full rounded-xl overflow-hidden">
            {/* Map Container */}
            <MapContainer
                center={defaultCenter}
                zoom={6}
                style={{ height: '100%', width: '100%', background: '#1a1a1e' }}
                zoomControl={false}
            >
                {/* Dark tile layer */}
                <TileLayer
                    attribution='&copy; <a href="https://carto.com/">CARTO</a>'
                    url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
                />

                {/* Auto-fit bounds */}
                <FitBounds waypoints={waypoints} />

                {/* Route polyline */}
                <Polyline
                    positions={polylinePositions}
                    color="#3b82f6"
                    weight={4}
                    opacity={0.8}
                />

                {/* Origin marker */}
                <Marker position={[origin.lat, origin.lon]} icon={originIcon}>
                    <Popup>
                        <div className="text-sm">
                            <strong>🌾 Origin</strong>
                            <br />
                            {origin.name}
                        </div>
                    </Popup>
                </Marker>

                {/* Destination marker */}
                <Marker position={[destination.lat, destination.lon]} icon={destinationIcon}>
                    <Popup>
                        <div className="text-sm">
                            <strong>📍 Destination</strong>
                            <br />
                            {destination.name}
                        </div>
                    </Popup>
                </Marker>

                {/* Waypoint markers */}
                {waypoints.map((waypoint, index) => {
                    const risk = waypoint.spoilage_risk || waypoint.risk_score || 0;
                    return (
                        <Marker
                            key={index}
                            position={[waypoint.lat, waypoint.lon]}
                            icon={createRiskIcon(risk)}
                            eventHandlers={{
                                mouseover: () => setSelectedWaypoint(waypoint),
                                mouseout: () => setSelectedWaypoint(null)
                            }}
                        >
                            <Popup>
                                <WaypointPopupContent waypoint={waypoint} index={index} />
                            </Popup>
                        </Marker>
                    );
                })}
            </MapContainer>

            {/* Legend */}
            <div className="absolute bottom-4 left-4 bg-black/80 backdrop-blur-md rounded-xl p-3 border border-white/10 z-1000">
                <div className="text-xs text-white/60 mb-2 font-medium">Risk Level</div>
                <div className="flex items-center gap-4 text-xs">
                    <div className="flex items-center gap-1.5">
                        <div className="w-3 h-3 rounded-full bg-green-500"></div>
                        <span className="text-white/80">Safe (&lt;20%)</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                        <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
                        <span className="text-white/80">Caution (20-50%)</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                        <div className="w-3 h-3 rounded-full bg-red-500"></div>
                        <span className="text-white/80">High (&gt;50%)</span>
                    </div>
                </div>
            </div>

            {/* Hover Tooltip */}
            {selectedWaypoint && (
                <div className="absolute top-4 right-4 bg-black/90 backdrop-blur-md rounded-xl p-4 border border-white/10 z-[1000] min-w-[200px]">
                    <WaypointTooltip waypoint={selectedWaypoint} cropType={cropType} />
                </div>
            )}

            {/* Stats Bar */}
            <div className="absolute top-4 left-4 bg-black/80 backdrop-blur-md rounded-xl p-3 border border-white/10 z-[1000]">
                <div className="flex items-center gap-4 text-xs">
                    <div>
                        <span className="text-white/40">Crop:</span>
                        <span className="text-white ml-1 font-medium">{cropType}</span>
                    </div>
                    <div className="w-px h-4 bg-white/20"></div>
                    <div>
                        <span className="text-white/40">Overall Risk:</span>
                        <span className={`ml-1 font-bold ${overallRisk > 0.5 ? 'text-red-400' : overallRisk > 0.2 ? 'text-yellow-400' : 'text-green-400'}`}>
                            {(overallRisk * 100).toFixed(0)}%
                        </span>
                    </div>
                    <div className="w-px h-4 bg-white/20"></div>
                    <div>
                        <span className="text-white/40">Waypoints:</span>
                        <span className="text-white ml-1">{waypoints.length}</span>
                    </div>
                </div>
            </div>
        </div>
    );
}

// Popup content for waypoint
function WaypointPopupContent({ waypoint, index }: { waypoint: WaypointData; index: number }) {
    const risk = waypoint.spoilage_risk || waypoint.risk_score || 0;
    const riskColor = risk > 0.5 ? 'text-red-500' : risk > 0.2 ? 'text-yellow-500' : 'text-green-500';
    
    return (
        <div className="text-sm min-w-45">
            <div className="font-bold text-gray-800 mb-2 pb-1 border-b">
                📍 Waypoint {index + 1}
            </div>
            <div className="space-y-1 text-gray-600">
                <div className="flex justify-between">
                    <span>🌡️ Temperature:</span>
                    <span className="font-medium text-gray-800">{waypoint.internal_temp?.toFixed(1)}°C</span>
                </div>
                <div className="flex justify-between">
                    <span>💧 Humidity:</span>
                    <span className="font-medium text-gray-800">{waypoint.humidity?.toFixed(0)}%</span>
                </div>
                <div className="flex justify-between">
                    <span>📏 Distance:</span>
                    <span className="font-medium text-gray-800">{waypoint.distance_km?.toFixed(1)} km</span>
                </div>
                <div className="flex justify-between">
                    <span>⏱️ Time:</span>
                    <span className="font-medium text-gray-800">{waypoint.hours_elapsed?.toFixed(1)} hrs</span>
                </div>
                <div className="flex justify-between pt-1 border-t mt-1">
                    <span>⚠️ Spoilage Risk:</span>
                    <span className={`font-bold ${riskColor}`}>{(risk * 100).toFixed(0)}%</span>
                </div>
            </div>
        </div>
    );
}

// Floating tooltip for hover
function WaypointTooltip({ waypoint, cropType }: { waypoint: WaypointData; cropType: string }) {
    const risk = waypoint.spoilage_risk || waypoint.risk_score || 0;
    const riskColor = risk > 0.5 ? 'text-red-400' : risk > 0.2 ? 'text-yellow-400' : 'text-green-400';
    const riskLabel = risk > 0.5 ? 'HIGH RISK' : risk > 0.2 ? 'CAUTION' : 'SAFE';
    
    return (
        <div>
            <div className={`text-xs font-bold ${riskColor} mb-2`}>
                ⚠️ {riskLabel}
            </div>
            <div className="space-y-1.5 text-xs">
                <div className="flex justify-between gap-4">
                    <span className="text-white/50">🌡️ Internal Temp</span>
                    <span className="text-white font-medium">{waypoint.internal_temp?.toFixed(1)}°C</span>
                </div>
                <div className="flex justify-between gap-4">
                    <span className="text-white/50">🌤️ Weather</span>
                    <span className="text-white font-medium">{waypoint.weather_temp?.toFixed(1)}°C</span>
                </div>
                <div className="flex justify-between gap-4">
                    <span className="text-white/50">💧 Humidity</span>
                    <span className="text-white font-medium">{waypoint.humidity?.toFixed(0)}%</span>
                </div>
                <div className="border-t border-white/10 pt-1.5 mt-1.5"></div>
                <div className="flex justify-between gap-4">
                    <span className="text-white/50">📏 From Origin</span>
                    <span className="text-white font-medium">{waypoint.distance_km?.toFixed(1)} km</span>
                </div>
                <div className="flex justify-between gap-4">
                    <span className="text-white/50">⏱️ Elapsed</span>
                    <span className="text-white font-medium">{waypoint.hours_elapsed?.toFixed(1)} hrs</span>
                </div>
                <div className="border-t border-white/10 pt-1.5 mt-1.5"></div>
                <div className="flex justify-between gap-4">
                    <span className="text-white/50">📦 {cropType}</span>
                    <span className={`font-bold ${riskColor}`}>{(risk * 100).toFixed(0)}% risk</span>
                </div>
            </div>
        </div>
    );
}
