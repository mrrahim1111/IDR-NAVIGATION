import React, { useState } from 'react';
import {
  MapPin,
  Navigation,
  ArrowUpDown,
  Search,
  Check,
  Zap,
  Clock,
  Gauge,
  Info,
  ShieldAlert,
} from 'lucide-react';
import { useNavigation } from '../context/NavigationContext';

export default function RoutePlanner({ onClose }: { onClose?: () => void }) {
  const {
    activeRoute,
    availableRoutes,
    selectRoute,
    autoBlackoutEnabled,
    toggleAutoBlackout,
  } = useNavigation();

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedRouteId, setSelectedRouteId] = useState(activeRoute.id);

  const filteredRoutes = availableRoutes.filter((r) =>
    r.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    r.originName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    r.destinationName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    r.tags.some((t) => t.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const handleApplyRoute = (routeId: string) => {
    setSelectedRouteId(routeId);
    selectRoute(routeId);
    if (onClose) onClose();
  };

  return (
    <div className="bg-white border border-govt-border rounded-lg shadow-md p-4 text-govt-text">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-govt-border pb-3 mb-3">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded bg-navy flex items-center justify-center text-white">
            <Navigation className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-navy">Route & Corridor Selector</h3>
            <p className="text-[11px] text-govt-muted">Plan route with GNSS challenged blackout segments</p>
          </div>
        </div>
        <span className="text-[10px] uppercase font-semibold bg-navy/10 text-navy px-2 py-0.5 rounded">
          SIH Prototype
        </span>
      </div>

      {/* From / To Google Maps Style Inputs */}
      <div className="bg-govt-grey/60 border border-govt-border rounded p-3 mb-4 space-y-2 relative">
        {/* Origin */}
        <div className="flex items-center gap-2.5">
          <div className="w-4 h-4 rounded-full border-2 border-govt-green flex items-center justify-center shrink-0">
            <div className="w-1.5 h-1.5 rounded-full bg-govt-green" />
          </div>
          <div className="flex-1 min-w-0">
            <label className="text-[10px] uppercase tracking-wider text-govt-muted font-bold block">
              Origin (From)
            </label>
            <div className="text-xs font-semibold truncate text-govt-text">
              {activeRoute.originName}
            </div>
          </div>
        </div>

        {/* Connector Line */}
        <div className="ml-2 pl-3 border-l-2 border-dashed border-gray-300 h-3" />

        {/* Destination */}
        <div className="flex items-center gap-2.5">
          <MapPin className="w-4 h-4 text-govt-red shrink-0" />
          <div className="flex-1 min-w-0">
            <label className="text-[10px] uppercase tracking-wider text-govt-muted font-bold block">
              Destination (To)
            </label>
            <div className="text-xs font-semibold truncate text-govt-text">
              {activeRoute.destinationName}
            </div>
          </div>
        </div>
      </div>

      {/* Search Input */}
      <div className="relative mb-3">
        <Search className="w-4 h-4 text-govt-muted absolute left-3 top-2.5" />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search Indian testing corridors (e.g. Tunnel, Mumbai, Delhi)..."
          className="w-full pl-9 pr-3 py-2 text-xs border border-govt-border rounded focus:outline-none focus:border-navy bg-white"
        />
      </div>

      {/* Preset Route Cards */}
      <div className="space-y-2 max-h-60 overflow-y-auto pr-1 mb-4">
        {filteredRoutes.map((route) => {
          const isSelected = route.id === selectedRouteId;
          const blackoutCount = route.blackoutZones.length;

          return (
            <div
              key={route.id}
              onClick={() => handleApplyRoute(route.id)}
              className={`p-3 rounded border transition-all cursor-pointer ${
                isSelected
                  ? 'border-navy bg-navy/5 shadow-xs'
                  : 'border-govt-border hover:border-gray-400 bg-white'
              }`}
            >
              <div className="flex items-start justify-between gap-2 mb-1">
                <div className="font-bold text-xs text-govt-text leading-tight">
                  {route.name}
                </div>
                {isSelected && (
                  <span className="w-4 h-4 rounded-full bg-navy text-white flex items-center justify-center shrink-0 mt-0.5">
                    <Check className="w-2.5 h-2.5" />
                  </span>
                )}
              </div>

              <div className="text-[11px] text-govt-muted mb-2 flex items-center gap-1">
                <span className="truncate">{route.originName.split(',')[0]}</span>
                <span>→</span>
                <span className="truncate">{route.destinationName.split(',')[0]}</span>
              </div>

              {/* Badges / Metrics */}
              <div className="flex flex-wrap items-center gap-2 text-[10px]">
                <span className="flex items-center gap-1 bg-gray-100 text-govt-text px-1.5 py-0.5 rounded font-mono font-medium">
                  {route.distanceKm} km
                </span>
                <span className="flex items-center gap-1 bg-gray-100 text-govt-text px-1.5 py-0.5 rounded font-mono">
                  <Clock className="w-2.5 h-2.5" /> {route.estimatedMinutes} min
                </span>
                {blackoutCount > 0 && (
                  <span className="flex items-center gap-1 bg-red-100 text-govt-red px-1.5 py-0.5 rounded font-semibold">
                    <ShieldAlert className="w-2.5 h-2.5" /> {route.blackoutZones[0].type} ({route.blackoutZones[0].lengthMeters}m)
                  </span>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Auto Blackout Simulation Setting */}
      <div className="border-t border-govt-border pt-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Zap className="w-4 h-4 text-govt-amber" />
          <div>
            <div className="text-xs font-semibold text-govt-text">Auto Blackout in Tunnels</div>
            <div className="text-[10px] text-govt-muted">Auto switch to AI Dead Reckoning</div>
          </div>
        </div>
        <button
          onClick={toggleAutoBlackout}
          className={`px-3 py-1 rounded text-xs font-bold border transition-colors ${
            autoBlackoutEnabled
              ? 'bg-govt-green text-white border-govt-green'
              : 'bg-gray-200 text-gray-700 border-gray-300'
          }`}
        >
          {autoBlackoutEnabled ? 'ENABLED' : 'DISABLED'}
        </button>
      </div>
    </div>
  );
}
