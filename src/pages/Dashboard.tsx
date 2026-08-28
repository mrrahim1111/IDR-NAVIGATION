import { useEffect, useMemo, useRef } from 'react';
import { MapContainer, TileLayer, Polyline, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { Crosshair, Navigation, Gauge, Compass } from 'lucide-react';
import { useNavigation } from '../context/NavigationContext';

// Vehicle marker that rotates with heading
function VehicleMarker() {
  const { position, heading } = useNavigation();
  const map = useMap();
  const markerRef = useRef<L.Marker | null>(null);

  const icon = useMemo(
    () =>
      L.divIcon({
        className: 'vehicle-marker',
        html: `<div style="transform:rotate(${heading}deg);width:28px;height:28px;display:flex;align-items:center;justify-content:center;">
          <svg width="28" height="28" viewBox="0 0 28 28" fill="none">
            <circle cx="14" cy="14" r="13" fill="#1a2744" stroke="white" stroke-width="2"/>
            <path d="M14 6 L20 20 L14 16 L8 20 Z" fill="#3b82f6"/>
          </svg>
        </div>`,
        iconSize: [28, 28],
        iconAnchor: [14, 14],
      }),
    [heading]
  );

  useEffect(() => {
    if (!markerRef.current) {
      markerRef.current = L.marker([position.lat, position.lng], { icon, zIndexOffset: 1000 }).addTo(map);
    } else {
      markerRef.current.setLatLng([position.lat, position.lng]);
      markerRef.current.setIcon(icon);
    }
    map.panTo([position.lat, position.lng], { animate: true, duration: 0.5 });
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

function MapLegend() {
  return (
    <div className="absolute bottom-3 left-3 z-[1000] bg-white border border-govt-border rounded shadow-sm px-3 py-2 text-xs">
      <div className="font-semibold text-govt-text mb-1">Legend</div>
      <div className="flex items-center gap-2 mb-0.5">
        <span className="w-5 h-0.5 bg-govt-green inline-block rounded" />
        <span>GNSS Trajectory</span>
      </div>
      <div className="flex items-center gap-2 mb-0.5">
        <span className="w-5 h-0.5 bg-blue-500 inline-block rounded" />
        <span>Dead Reckoning</span>
      </div>
      <div className="flex items-center gap-2">
        <span className="w-5 h-0.5 border-t-2 border-dashed border-govt-red inline-block" />
        <span>Blackout Segment</span>
      </div>
    </div>
  );
}

function InfoRow({ icon: Icon, label, value, mono }: { icon: React.ElementType; label: string; value: string; mono?: boolean }) {
  return (
    <div className="flex items-start gap-2 py-1.5">
      <Icon className="w-3.5 h-3.5 text-govt-muted mt-0.5 shrink-0" />
      <div className="min-w-0">
        <div className="text-[10px] text-govt-muted uppercase tracking-wider">{label}</div>
        <div className={`text-sm font-semibold text-govt-text ${mono ? 'font-mono' : ''}`}>{value}</div>
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
    isBlackout,
    systemMessage,
    gnssTrajectory,
    drTrajectory,
    blackoutSegment,
  } = useNavigation();

  const gnssCoords = gnssTrajectory.map((p) => [p.lat, p.lng] as [number, number]);
  const drCoords = drTrajectory.map((p) => [p.lat, p.lng] as [number, number]);
  const blackoutCoords = blackoutSegment.map((p) => [p.lat, p.lng] as [number, number]);

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

  return (
    <div className="h-full flex flex-col lg:flex-row">
      {/* Map */}
      <div className="flex-1 relative min-h-[300px]">
        <MapContainer
          center={[16.5062, 80.648]}
          zoom={15}
          scrollWheelZoom={true}
          zoomControl={false}
          className="w-full h-full"
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          <VehicleMarker />
          {gnssCoords.length > 1 && (
            <Polyline positions={gnssCoords} pathOptions={{ color: '#16a34a', weight: 3, opacity: 0.8 }} />
          )}
          {drCoords.length > 1 && (
            <Polyline positions={drCoords} pathOptions={{ color: '#3b82f6', weight: 3, opacity: 0.8 }} />
          )}
          {blackoutCoords.length > 1 && (
            <Polyline positions={blackoutCoords} pathOptions={{ color: '#dc2626', weight: 2, dashArray: '8 6', opacity: 0.7 }} />
          )}
        </MapContainer>
        <MapLegend />

        {/* Floating GNSS status on mobile */}
        <div className="lg:hidden absolute top-3 right-3 z-[1000] bg-white border border-govt-border rounded shadow-sm px-3 py-1.5 text-xs font-semibold flex items-center gap-2">
          <span className={`w-2 h-2 rounded-full ${statusDot}`} />
          {gnssStatus === 'unavailable' ? 'GNSS LOST' : 'GNSS OK'}
        </div>
      </div>

      {/* Status Panel */}
      <div className="lg:w-72 xl:w-80 bg-white border-t lg:border-t-0 lg:border-l border-govt-border shrink-0 overflow-y-auto">
        <div className="p-4">
          {/* Navigation Mode Banner */}
          <div className={`border rounded px-3 py-2 mb-4 ${
            gnssStatus === 'unavailable'
              ? 'bg-red-50 border-red-200'
              : gnssStatus === 'restored'
                ? 'bg-amber-50 border-amber-200'
                : 'bg-green-50 border-green-200'
          }`}>
            <div className="text-[10px] uppercase tracking-wider text-govt-muted mb-0.5">Navigation Mode</div>
            <div className={`text-sm font-bold ${modeColor}`}>{navigationMode}</div>
          </div>

          {/* System message */}
          <div className="text-xs text-govt-muted bg-govt-grey rounded px-3 py-2 mb-4 border border-govt-border">
            {systemMessage}
          </div>

          {/* Position */}
          <div className="mb-3">
            <h3 className="text-xs font-semibold text-govt-text uppercase tracking-wider border-b border-govt-border pb-1 mb-2">
              Current Position
            </h3>
            <InfoRow icon={Crosshair} label="Latitude" value={`${position.lat.toFixed(4)}° N`} mono />
            <InfoRow icon={Crosshair} label="Longitude" value={`${position.lng.toFixed(4)}° E`} mono />
          </div>

          {/* Motion */}
          <div className="mb-3">
            <h3 className="text-xs font-semibold text-govt-text uppercase tracking-wider border-b border-govt-border pb-1 mb-2">
              Vehicle Motion
            </h3>
            <InfoRow icon={Gauge} label="Speed" value={`${Math.round(speed)} km/h`} />
            <InfoRow icon={Compass} label="Heading" value={`${headingLabel} | ${heading}°`} />
          </div>

          {/* Source */}
          <div className="mb-3">
            <h3 className="text-xs font-semibold text-govt-text uppercase tracking-wider border-b border-govt-border pb-1 mb-2">
              Position Source
            </h3>
            <div className="flex items-center gap-2 py-1">
              <span className={`w-2 h-2 rounded-full ${statusDot}`} />
              <span className="text-sm font-medium text-govt-text">{navigationMode}</span>
            </div>
            <div className="flex justify-between text-xs text-govt-muted mt-1">
              <span>Confidence: {positionConfidence.toFixed(0)}%</span>
              <span>Update: 10 Hz</span>
            </div>
          </div>

          {/* Drift info during blackout */}
          {isBlackout && (
            <div className="border border-red-200 bg-red-50 rounded px-3 py-2">
              <h3 className="text-xs font-semibold text-govt-red uppercase tracking-wider mb-1">
                DR Drift Status
              </h3>
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div>
                  <div className="text-govt-muted">Drift</div>
                  <div className="font-mono font-bold text-govt-text">{drift.toFixed(1)} m</div>
                </div>
                <div>
                  <div className="text-govt-muted">Confidence</div>
                  <div className="font-mono font-bold text-govt-text">{positionConfidence.toFixed(0)}%</div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
