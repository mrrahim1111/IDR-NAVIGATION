import { useEffect, useMemo, useRef, useState } from 'react';
import { MapContainer, TileLayer, Polyline, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import {
  Crosshair,
  Gauge,
  Compass,
  ShieldAlert,
  Layers,
  LocateFixed,
} from 'lucide-react';
import { useNavigation } from '../context/NavigationContext';
import TurnByTurnHUD from '../components/TurnByTurnHUD';
import RoutePlanner from '../components/RoutePlanner';
import SmartAssistant from '../components/SmartAssistant';

// Helper to center and fit bounds when route changes
function RouteMapController({ center, zoom, routePoints }: { center: [number, number]; zoom: number; routePoints: [number, number][] }) {
  const map = useMap();
  const prevCenterRef = useRef(center);
  const routeStart = routePoints[0];
  const routeEnd = routePoints[routePoints.length - 1];

  useEffect(() => {
    if (
      Math.abs(prevCenterRef.current[0] - center[0]) > 0.05 ||
      Math.abs(prevCenterRef.current[1] - center[1]) > 0.05
    ) {
      map.flyTo(center, zoom, { duration: 1.2 });
      prevCenterRef.current = center;
    }
  }, [center, zoom, map]);

  useEffect(() => {
    if (routePoints.length > 1) {
      map.fitBounds(L.latLngBounds(routePoints), { padding: [48, 48], maxZoom: 15, animate: true });
    }
  }, [map, routeStart?.[0], routeStart?.[1], routeEnd?.[0], routeEnd?.[1]]);

  return null;
}

// Vehicle marker that rotates with heading
function VehicleMarker() {
  const { position, heading, vehicleType } = useNavigation();
  const map = useMap();
  const markerRef = useRef<L.Marker | null>(null);

  const vehicleSymbol = vehicleType === 'motorcycle'
    ? '🏍️'
    : vehicleType === 'bus'
      ? '🚌'
      : vehicleType === 'truck'
        ? '🚚'
        : '🚗';

  const icon = useMemo(
    () =>
      L.divIcon({
        className: 'vehicle-marker',
        html: `<div style="transform:rotate(${heading}deg);width:32px;height:32px;display:flex;align-items:center;justify-content:center;filter:drop-shadow(0 2px 4px rgba(0,0,0,0.3));">
          <div style="width:32px;height:32px;border-radius:50%;background:white;border:2px solid #1a2744;display:flex;align-items:center;justify-content:center;font-size:19px;line-height:1;">${vehicleSymbol}</div>
        </div>`,
        iconSize: [32, 32],
        iconAnchor: [16, 16],
      }),
    [heading, vehicleSymbol]
  );

  useEffect(() => {
    if (!markerRef.current) {
      markerRef.current = L.marker([position.lat, position.lng], { icon, zIndexOffset: 1000 }).addTo(map);
    } else {
      markerRef.current.setLatLng([position.lat, position.lng]);
      markerRef.current.setIcon(icon);
    }
  }, [position, icon, map]);

  useEffect(() => {
    return () => {
      if (markerRef.current) {
        markerRef.current.remove();
      }
    };
  }, []);

  return null;
}

// Custom Origin / Destination Pin Icons
const originIcon = L.divIcon({
  className: 'origin-marker',
  html: `<div style="width:24px;height:24px;background:#16a34a;border:2px solid white;border-radius:50%;display:flex;align-items:center;justify-content:center;color:white;font-weight:bold;font-size:11px;box-shadow:0 2px 4px rgba(0,0,0,0.3);">A</div>`,
  iconSize: [24, 24],
  iconAnchor: [12, 12],
});

const destIcon = L.divIcon({
  className: 'dest-marker',
  html: `<div style="width:24px;height:24px;background:#dc2626;border:2px solid white;border-radius:50%;display:flex;align-items:center;justify-content:center;color:white;font-weight:bold;font-size:11px;box-shadow:0 2px 4px rgba(0,0,0,0.3);">B</div>`,
  iconSize: [24, 24],
  iconAnchor: [12, 12],
});

function MapLegend() {
  return (
    <div className="absolute bottom-3 left-3 z-[1000] bg-white/95 backdrop-blur-xs border border-govt-border rounded shadow-md px-3 py-2 text-[11px] max-w-xs">
      <div className="font-bold text-navy mb-1.5 uppercase tracking-wider text-[10px] border-b border-gray-200 pb-0.5">
        Map Telemetry Legend
      </div>
      <div className="flex items-center gap-2 mb-1">
        <span className="w-5 h-1 bg-govt-green inline-block rounded" />
        <span className="text-govt-text">GNSS + INS Fusion Trajectory</span>
      </div>
      <div className="flex items-center gap-2 mb-1">
        <span className="w-5 h-1 bg-blue-500 inline-block rounded" />
        <span className="text-govt-text">Intelligent Dead Reckoning (AI-ML)</span>
      </div>
      <div className="flex items-center gap-2 mb-1">
        <span className="w-5 h-0.5 border-t-2 border-dashed border-red-500 inline-block" />
        <span className="text-govt-text font-semibold text-govt-red">GNSS Blackout Zone / Tunnel</span>
      </div>
      <div className="flex items-center gap-2">
        <span className="w-5 h-1 bg-gray-400/65 inline-block rounded" />
        <span className="text-govt-muted">Planned Road Corridor</span>
      </div>
    </div>
  );
}

function MapLayerToggle({
  satellite,
  onChange,
}: {
  satellite: boolean;
  onChange: (satellite: boolean) => void;
}) {
  return (
    <div className="absolute top-3 left-3 z-[1020] flex items-center gap-1 rounded-lg bg-white/95 p-1 shadow-md border border-govt-border">
      <Layers className="w-3.5 h-3.5 text-govt-muted ml-1" />
      <button
        type="button"
        onClick={() => onChange(false)}
        className={`px-2.5 py-1 rounded text-[11px] font-semibold transition-colors ${
          !satellite ? 'bg-navy text-white' : 'text-govt-muted hover:bg-gray-100'
        }`}
        aria-pressed={!satellite}
      >
        Map
      </button>
      <button
        type="button"
        onClick={() => onChange(true)}
        className={`px-2.5 py-1 rounded text-[11px] font-semibold transition-colors ${
          satellite ? 'bg-navy text-white' : 'text-govt-muted hover:bg-gray-100'
        }`}
        aria-pressed={satellite}
      >
        Satellite
      </button>
    </div>
  );
}

function InfoRow({
  icon: Icon,
  label,
  value,
  mono,
}: {
  icon: React.ElementType;
  label: string;
  value: string;
  mono?: boolean;
}) {
  return (
    <div className="flex items-start gap-2 py-1.5">
      <Icon className="w-3.5 h-3.5 text-govt-muted mt-0.5 shrink-0" />
      <div className="min-w-0 flex-1">
        <div className="text-[10px] text-govt-muted uppercase tracking-wider font-semibold">{label}</div>
        <div className={`text-xs sm:text-sm font-bold text-govt-text ${mono ? 'font-mono' : ''}`}>{value}</div>
      </div>
    </div>
  );
}

export default function Dashboard() {
  const {
    position,
    speed,
    heading,
    headingLabel,
    navigationMode,
    gnssStatus,
    positionConfidence,
    drift,
    driftPercentage,
    isBlackout,
    systemMessage,
    gnssTrajectory,
    drTrajectory,
    blackoutSegment,
    activeRoute,
    activeBlackoutZone,
    useAlternativeRoute,
    isLiveDataEnabled,
    hasLiveGpsFix,
    liveDataError,
    enableLiveData,
    disableLiveData,
    isNetworkOnline,
  } = useNavigation();

  const [isSatellite, setIsSatellite] = useState(false);

  // Select path points based on variant
  const plannedCoords = useMemo(() => {
    const pts = useAlternativeRoute ? activeRoute.alternative.waypoints : activeRoute.waypoints;
    return pts.map((p) => [p.lat, p.lng] as [number, number]);
  }, [activeRoute, useAlternativeRoute]);

  const gnssCoords = gnssTrajectory.map((p) => [p.lat, p.lng] as [number, number]);
  const drCoords = drTrajectory.map((p) => [p.lat, p.lng] as [number, number]);
  const blackoutCoords = blackoutSegment.map((p) => [p.lat, p.lng] as [number, number]);

  // Extract blackout zone polylines for visualization (only if using main route containing blackouts)
  const tunnelSegments = useMemo(() => {
    if (useAlternativeRoute) return [];
    return activeRoute.blackoutZones.map((z) => {
      const pts = activeRoute.waypoints.slice(z.startIndex, z.endIndex + 1);
      return {
        zone: z,
        coords: pts.map((p) => [p.lat, p.lng] as [number, number]),
      };
    });
  }, [activeRoute, useAlternativeRoute]);

  const modeColor =
    gnssStatus === 'healthy'
      ? 'text-govt-green'
      : gnssStatus === 'unavailable'
        ? 'text-govt-red'
        : 'text-govt-amber';

  const statusDot =
    gnssStatus === 'healthy'
      ? 'bg-govt-green'
      : gnssStatus === 'unavailable'
        ? 'bg-govt-red'
        : gnssStatus === 'weak'
          ? 'bg-govt-amber'
          : 'bg-govt-green';

  const routeCenter: [number, number] = [
    isLiveDataEnabled ? position.lat : activeRoute.originCoords.lat,
    isLiveDataEnabled ? position.lng : activeRoute.originCoords.lng,
  ];

  return (
    <div className="h-full flex flex-col lg:flex-row relative">
      {/* Map Area */}
      <div className="flex-1 relative min-h-[350px]">
        {/* Turn By Turn Navigation HUD */}
        <div className="absolute top-3 left-3 right-3 sm:right-auto sm:w-[min(28rem,calc(100%-1.5rem))] z-[1010]">
          <RoutePlanner />
        </div>
        <TurnByTurnHUD />

        <MapLayerToggle satellite={isSatellite} onChange={setIsSatellite} />

        {/* Live data and GNSS status */}
        <div className="absolute top-3 right-3 z-[1000] flex flex-col items-end gap-2">
          <button
            onClick={isLiveDataEnabled ? disableLiveData : enableLiveData}
            className={`px-3 py-2 rounded-lg shadow-md font-semibold text-xs flex items-center gap-1.5 transition-colors border border-white/20 ${
              isLiveDataEnabled ? 'bg-govt-green text-white' : 'bg-white/95 text-navy hover:bg-white'
            }`}
            title={isLiveDataEnabled ? 'Use demo data' : 'Use live GPS and device sensors'}
          >
            <LocateFixed className="w-4 h-4" />
            <span>{isLiveDataEnabled ? 'Live GPS On' : 'Use Live GPS'}</span>
          </button>
          {/* Quick GNSS Badge */}
          <div className="bg-white/90 backdrop-blur-sm border border-govt-border rounded-md px-2.5 py-1 text-[11px] font-bold flex items-center gap-1.5 shadow-sm">
            <span className={`w-2 h-2 rounded-full ${statusDot}`} />
            <span>{isLiveDataEnabled ? (hasLiveGpsFix ? 'LIVE GPS' : 'WAITING FOR GPS') : gnssStatus === 'unavailable' ? 'GNSS LOST' : 'GNSS ACTIVE'}</span>
          </div>
          <div className="bg-white/90 backdrop-blur-sm border border-govt-border rounded-md px-2.5 py-1.5 text-[10px] shadow-sm">
            <div className="flex items-center gap-1.5 font-bold text-govt-text">
              <LocateFixed className={`w-3 h-3 ${hasLiveGpsFix ? 'text-govt-green' : 'text-govt-muted'}`} />
              <span>Location: {isLiveDataEnabled ? (hasLiveGpsFix ? 'Live fix' : 'Waiting') : 'Demo live'}</span>
            </div>
            <div className="mt-0.5 font-mono text-[9px] text-govt-muted">
              {position.lat.toFixed(5)}, {position.lng.toFixed(5)}
            </div>
          </div>
          {liveDataError && (
            <div className="max-w-56 rounded-md border border-red-200 bg-red-50 px-2.5 py-1.5 text-[10px] font-semibold text-govt-red shadow-sm">
              {liveDataError}
            </div>
          )}
        </div>

        {!isNetworkOnline && (
          <div className="absolute bottom-3 right-3 z-[1000] max-w-xs rounded-lg border border-amber-300 bg-amber-50/95 px-3 py-2 text-[11px] font-semibold text-amber-900 shadow-md">
            Offline mode: current route and GPS navigation continue. New address searches are paused until the connection returns.
          </div>
        )}

        {/* Leaflet Road Map */}
        <MapContainer
          center={routeCenter}
          zoom={14}
          scrollWheelZoom={true}
          zoomControl={false}
          className="w-full h-full"
        >
          <TileLayer
            key={isSatellite ? 'satellite' : 'map'}
            attribution={
              isSatellite
                ? '&copy; Esri, Maxar, Earthstar Geographics'
                : '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
            }
            url={
              isSatellite
                ? 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}'
                : 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png'
            }
          />

          <RouteMapController center={routeCenter} zoom={14} routePoints={plannedCoords} />

          {/* Origin Marker */}
          <Marker position={[activeRoute.originCoords.lat, activeRoute.originCoords.lng]} icon={originIcon}>
            <Popup>
              <strong>Origin (A):</strong> {activeRoute.originName}
            </Popup>
          </Marker>

          {/* Destination Marker */}
          <Marker position={[activeRoute.destinationCoords.lat, activeRoute.destinationCoords.lng]} icon={destIcon}>
            <Popup>
              <strong>Destination (B):</strong> {activeRoute.destinationName}
            </Popup>
          </Marker>

          {/* Planned Base Route Polyline */}
          <Polyline
            positions={plannedCoords}
            pathOptions={{ color: '#94a3b8', weight: 6, opacity: 0.5, lineCap: 'round' }}
          />

          {/* Designated Tunnel / Blackout Zones on the Route */}
          {tunnelSegments.map((t, idx) => (
            <Polyline
              key={idx}
              positions={t.coords}
              pathOptions={{ color: '#dc2626', weight: 8, dashArray: '10 8', opacity: 0.8 }}
            />
          ))}

          {/* Real-time Trajectories */}
          {gnssCoords.length > 1 && (
            <Polyline positions={gnssCoords} pathOptions={{ color: '#16a34a', weight: 4, opacity: 0.9 }} />
          )}
          {drCoords.length > 1 && (
            <Polyline positions={drCoords} pathOptions={{ color: '#2563eb', weight: 4, opacity: 0.9 }} />
          )}
          {blackoutCoords.length > 1 && (
            <Polyline positions={blackoutCoords} pathOptions={{ color: '#dc2626', weight: 3, dashArray: '6 6', opacity: 0.8 }} />
          )}

          {/* Vehicle Navigation Marker */}
          <VehicleMarker />
        </MapContainer>

        <MapLegend />
      </div>

      {/* Side Status & Navigation Panel */}
      <div className="lg:w-80 xl:w-96 bg-white border-t lg:border-t-0 lg:border-l border-govt-border shrink-0 overflow-y-auto max-h-[45vh] lg:max-h-full">
        <div className="p-4 space-y-4">
          {/* Smart Co-Driver Assistant Panel */}
          <SmartAssistant />

          {/* Navigation Mode Banner */}
          <div
            className={`border rounded-lg px-3.5 py-2.5 ${
              gnssStatus === 'unavailable'
                ? 'bg-red-50 border-red-200'
                : gnssStatus === 'restored'
                  ? 'bg-amber-50 border-amber-200'
                  : 'bg-green-50 border-green-200'
            }`}
          >
            <div className="text-[10px] uppercase tracking-wider text-govt-muted font-semibold mb-0.5">
              Navigation Mode
            </div>
            <div className={`text-sm font-bold ${modeColor}`}>{navigationMode}</div>
            <div className="text-[11px] text-govt-muted mt-1 leading-tight">{systemMessage}</div>
          </div>

          {/* Telemetry Metrics */}
          <div>
            <h3 className="text-xs font-bold text-govt-text uppercase tracking-wider border-b border-govt-border pb-1 mb-2">
              Vehicle Kinematics & Position
            </h3>
            <div className="grid grid-cols-2 gap-2">
              <InfoRow icon={Gauge} label="Speed" value={`${Math.round(speed)} km/h`} />
              <InfoRow icon={Compass} label="Heading" value={`${headingLabel} | ${heading}°`} />
              <InfoRow icon={Crosshair} label="Latitude" value={`${position.lat.toFixed(4)}° N`} mono />
              <InfoRow icon={Crosshair} label="Longitude" value={`${position.lng.toFixed(4)}° E`} mono />
            </div>
          </div>

          {/* Position Source / Confidence */}
          <div className="bg-gray-50 border border-govt-border rounded-lg p-3">
            <div className="flex items-center justify-between text-xs font-semibold mb-1">
              <span className="text-govt-muted">Position Confidence</span>
              <span className="font-mono text-govt-text">{positionConfidence.toFixed(0)}%</span>
            </div>
            <div className="bg-gray-200 rounded-full h-1.5 mb-2">
              <div
                className={`rounded-full h-1.5 transition-all duration-300 ${
                  positionConfidence > 90
                    ? 'bg-govt-green'
                    : positionConfidence > 75
                      ? 'bg-govt-amber'
                      : 'bg-govt-red'
                }`}
                style={{ width: `${positionConfidence}%` }}
              />
            </div>
            <div className="flex justify-between text-[10px] text-govt-muted font-mono">
              <span>Rate: 10 Hz</span>
              <span>Filter: EKF + AI-ML</span>
            </div>
          </div>

          {/* Dead Reckoning Drift Telemetry (shown during blackout) */}
          {isBlackout && (
            <div className="border border-red-300 bg-red-50/80 rounded-lg p-3">
              <div className="flex items-center gap-1.5 text-xs font-bold text-govt-red uppercase tracking-wider mb-2">
                <ShieldAlert className="w-4 h-4" />
                <span>Intelligent DR Performance</span>
              </div>
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div>
                  <div className="text-[10px] text-govt-muted uppercase">Cumulative Drift</div>
                  <div className="font-mono font-bold text-govt-text text-sm">{drift.toFixed(1)} m</div>
                </div>
                <div>
                  <div className="text-[10px] text-govt-muted uppercase">Drift %</div>
                  <div className="font-mono font-bold text-govt-green text-sm">{driftPercentage.toFixed(2)}%</div>
                </div>
              </div>
              <div className="mt-1 text-[10px] text-govt-green font-semibold">
                ✓ Well within SIH target (&lt;10%)
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
