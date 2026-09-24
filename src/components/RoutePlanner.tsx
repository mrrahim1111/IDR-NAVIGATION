import React, { useEffect, useState } from 'react';
import {
  MapPin,
  Navigation,
  Search,
  Check,
  Zap,
  Clock,
  ShieldAlert,
  Car,
  Bike,
  Bus,
  Truck,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import { useNavigation } from '../context/NavigationContext';
import type { VehicleType } from '../context/NavigationContext';
import type { GeocodedLocation, Maneuver, NavigationRoute, Position } from '../types';

type OsrmRoute = {
  distance: number;
  duration: number;
  geometry: { coordinates: [number, number][] };
  legs?: { steps?: { distance: number; name?: string; maneuver?: { type?: string; modifier?: string; location?: [number, number] } }[] }[];
};

function routePoints(route: OsrmRoute): Position[] {
  return route.geometry.coordinates.map(([lng, lat]) => ({ lat, lng }));
}

function maneuverDirection(step: NonNullable<NonNullable<OsrmRoute['legs']>[number]['steps']>[number]): Maneuver['direction'] {
  const modifier = step.maneuver?.modifier || '';
  if (step.maneuver?.type === 'arrive') return 'destination';
  if (step.maneuver?.type === 'merge' || step.maneuver?.type === 'continue') return 'straight';
  if (modifier.includes('slight right')) return 'slight-right';
  if (modifier.includes('slight left')) return 'slight-left';
  if (modifier.includes('uturn')) return 'u-turn';
  if (modifier.includes('right')) return 'right';
  if (modifier.includes('left')) return 'left';
  return 'straight';
}

function makeNavigationRoute(
  osrmRoute: OsrmRoute,
  origin: GeocodedLocation,
  destination: GeocodedLocation,
  index: number,
): NavigationRoute {
  const waypoints = routePoints(osrmRoute);
  const maneuvers: Maneuver[] = (osrmRoute.legs?.[0]?.steps || []).map((step, stepIndex) => ({
    stepIndex,
    instruction: `${step.maneuver?.type === 'arrive' ? 'Arrive' : 'Continue'} ${step.name || 'on the current road'}`,
    roadName: step.name || 'Road route',
    direction: maneuverDirection(step),
    distanceMeters: Math.round(step.distance),
  }));

  return {
    id: `live-route-${index}-${Date.now()}`,
    name: index === 0 ? 'Fastest route' : `Alternative route ${index}`,
    originName: origin.displayName,
    destinationName: destination.displayName,
    originCoords: { lat: origin.lat, lng: origin.lng },
    destinationCoords: { lat: destination.lat, lng: destination.lng },
    distanceKm: Number((osrmRoute.distance / 1000).toFixed(1)),
    estimatedMinutes: Math.max(1, Math.round(osrmRoute.duration / 60)),
    speedLimitKmh: 50,
    waypoints,
    blackoutZones: [],
    maneuvers,
    tags: ['Live road route'],
    traffic: { locationName: destination.displayName, severity: index === 0 ? 'low' : index === 1 ? 'moderate' : 'high', delaySeconds: 0, reason: index === 0 ? 'Fastest available route' : 'Alternative route estimate' },
    alternative: { name: 'Live route alternative', distanceKm: Number((osrmRoute.distance / 1000).toFixed(1)), estimatedMinutes: Math.max(1, Math.round(osrmRoute.duration / 60)), waypoints, reason: 'Calculated from live road data.', hasBlackout: false },
  };
}

export default function RoutePlanner() {
  const {
    activeRoute,
    availableRoutes,
    selectRoute,
    loadRoute,
    autoBlackoutEnabled,
    toggleAutoBlackout,
    position,
    isLiveDataEnabled,
    isNetworkOnline,
    vehicleType,
    setVehicleType,
    startNavigation,
  } = useNavigation();

  const [selectedRouteId, setSelectedRouteId] = useState(activeRoute.id);
  const [fromQuery, setFromQuery] = useState(isLiveDataEnabled ? 'Current location' : activeRoute.originName);
  const [toQuery, setToQuery] = useState(activeRoute.destinationName);
  const [isFromFocused, setIsFromFocused] = useState(false);
  const [isDestinationFocused, setIsDestinationFocused] = useState(false);
  const [fromSuggestions, setFromSuggestions] = useState<GeocodedLocation[]>([]);
  const [destinationSuggestions, setDestinationSuggestions] = useState<GeocodedLocation[]>([]);
  const [selectedOrigin, setSelectedOrigin] = useState<GeocodedLocation | null>(null);
  const [selectedDestination, setSelectedDestination] = useState<GeocodedLocation | null>(null);
  const [routeOptions, setRouteOptions] = useState<NavigationRoute[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [searchError, setSearchError] = useState('');
  const [isPlannerExpanded, setIsPlannerExpanded] = useState(false);

  useEffect(() => {
    setFromQuery(isLiveDataEnabled ? 'Current location' : activeRoute.originName);
    setToQuery(activeRoute.destinationName);
    setSelectedRouteId(activeRoute.id);
    if (!activeRoute.id.startsWith('live-route-')) setRouteOptions([]);
  }, [activeRoute]);

  const searchLocations = (query: string, setResults: (locations: GeocodedLocation[]) => void, enabled: boolean) => {
    if (!enabled || query.trim().length < 3 || !isNetworkOnline) {
      setResults([]);
      return () => undefined;
    }
    const controller = new AbortController();
    const timer = window.setTimeout(async () => {
      try {
        const response = await fetch(`https://nominatim.openstreetmap.org/search?format=jsonv2&limit=5&q=${encodeURIComponent(query.trim())}`, {
          signal: controller.signal,
          headers: { 'Accept-Language': 'en' },
        });
        if (!response.ok) throw new Error('Search failed');
        const results = await response.json() as { display_name: string; lat: string; lon: string }[];
        setResults(results.map((result) => ({ displayName: result.display_name, lat: Number(result.lat), lng: Number(result.lon) })));
      } catch (error) {
        if ((error as Error).name !== 'AbortError') setSearchError('Address search is unavailable right now.');
      }
    }, 450);
    return () => {
      window.clearTimeout(timer);
      controller.abort();
    };
  };

  useEffect(() => searchLocations(fromQuery, setFromSuggestions, isFromFocused), [fromQuery, isFromFocused, isNetworkOnline]);

  useEffect(() => {
    return searchLocations(toQuery, setDestinationSuggestions, isDestinationFocused);
  }, [toQuery, isDestinationFocused, isNetworkOnline]);

  const handleApplyRoute = (routeId: string) => {
    setSelectedRouteId(routeId);
    const liveRoute = routeOptions.find((route) => route.id === routeId);
    if (liveRoute) loadRoute(liveRoute);
    else selectRoute(routeId);
  };

  const requestRoutes = async (origin: GeocodedLocation, destination: GeocodedLocation) => {
    if (!isNetworkOnline) {
      setSearchError('You are offline. Choose a previously loaded route or wait for the connection to return.');
      return;
    }
    setIsSearching(true);
    setSearchError('');
    try {
      const response = await fetch(`https://router.project-osrm.org/route/v1/driving/${origin.lng},${origin.lat};${destination.lng},${destination.lat}?alternatives=true&steps=true&overview=full&geometries=geojson`);
      if (!response.ok) throw new Error('Routing failed');
      const result = await response.json() as { routes: OsrmRoute[] };
      const routes = result.routes.map((route, index) => makeNavigationRoute(route, origin, destination, index));
      if (routes.length === 0) throw new Error('No route found');
      setRouteOptions(routes);
      setSelectedRouteId(routes[0].id);
      loadRoute(routes[0]);
    } catch {
      setSearchError('No drivable route was found for this destination.');
    } finally {
      setIsSearching(false);
    }
  };

  const handleFromSelect = (origin: GeocodedLocation) => {
    setFromQuery(origin.displayName);
    setSelectedOrigin(origin);
    setIsFromFocused(false);
    if (selectedDestination) requestRoutes(origin, selectedDestination);
  };

  const handleDestinationSelect = (destination: GeocodedLocation) => {
    setToQuery(destination.displayName);
    setSelectedDestination(destination);
    setIsDestinationFocused(false);
    const origin = selectedOrigin || {
      displayName: isLiveDataEnabled ? 'Current location' : activeRoute.originName,
      lat: isLiveDataEnabled ? position.lat : activeRoute.originCoords.lat,
      lng: isLiveDataEnabled ? position.lng : activeRoute.originCoords.lng,
    };
    requestRoutes(origin, destination);
  };

  return (
    <div className={`bg-white/95 backdrop-blur-sm border border-govt-border rounded-lg shadow-md p-2.5 text-govt-text ${isPlannerExpanded ? 'max-h-[min(32rem,48vh)] overflow-y-auto' : ''}`}>
      {/* Header */}
      <div className="flex items-center justify-between pb-1.5">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded bg-navy flex items-center justify-center text-white">
            <Navigation className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-xs font-bold text-navy">Plan your trip</h3>
            <p className="text-[10px] text-govt-muted">Choose locations and a vehicle</p>
          </div>
          <button
            type="button"
            onClick={() => setIsPlannerExpanded((expanded) => !expanded)}
            className="rounded p-1 text-govt-muted hover:bg-gray-100 hover:text-navy"
            title={isPlannerExpanded ? 'Collapse trip planner' : 'Expand trip planner'}
            aria-label={isPlannerExpanded ? 'Collapse trip planner' : 'Expand trip planner'}
          >
            {isPlannerExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {isPlannerExpanded && <>

      <div className="flex items-center gap-1.5 py-1.5">
        <span className="text-[10px] font-bold uppercase tracking-wider text-govt-muted">Vehicle</span>
        {([
          ['car', Car, 'Car'],
          ['motorcycle', Bike, 'Bike'],
          ['bus', Bus, 'Bus'],
          ['truck', Truck, 'Truck'],
        ] as [VehicleType, React.ElementType, string][]).map(([type, Icon, label]) => (
          <button
            key={type}
            type="button"
            onClick={() => setVehicleType(type)}
            title={label}
            aria-label={label}
            className={`flex items-center gap-1 rounded px-2 py-1 text-[10px] font-semibold transition-colors ${vehicleType === type ? 'bg-navy text-white' : 'bg-gray-100 text-govt-muted hover:bg-gray-200'}`}
          >
            <Icon className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">{label}</span>
          </button>
        ))}
      </div>

      {/* From and destination selectors */}
      <div className="space-y-1.5">
        <div className="relative">
          <div className="flex items-center gap-2.5 rounded border border-govt-border bg-govt-grey/60 px-2.5 py-2">
            <div className="w-3.5 h-3.5 rounded-full border-2 border-govt-green shrink-0" />
            <div className="flex-1 min-w-0 relative">
              <label htmlFor="route-from" className="text-[10px] uppercase tracking-wider text-govt-muted font-bold block">From</label>
              <input
                id="route-from"
                value={fromQuery}
                onChange={(event) => setFromQuery(event.target.value)}
                onFocus={() => setIsFromFocused(true)}
                className="w-full bg-transparent text-xs font-semibold text-govt-text outline-none placeholder:text-govt-muted"
                placeholder="Starting location"
                aria-label="Starting location"
              />
              {isFromFocused && fromSuggestions.length > 0 && (
                <div className="absolute left-0 right-0 top-[calc(100%+0.5rem)] z-20 overflow-hidden rounded border border-govt-border bg-white shadow-lg">
                  {fromSuggestions.map((location) => (
                    <button key={`${location.lat}-${location.lng}`} type="button" onMouseDown={() => handleFromSelect(location)} className="w-full px-2.5 py-2 text-left hover:bg-navy/5">
                      <div className="text-xs font-semibold text-govt-text truncate">{location.displayName}</div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
        <div className="relative">
        <div className="flex items-center gap-2.5 rounded border border-govt-border bg-govt-grey/60 px-2.5 py-2">
          <MapPin className="w-4 h-4 text-govt-red shrink-0" />
          <div className="flex-1 min-w-0 relative">
              <label htmlFor="route-to" className="text-[10px] uppercase tracking-wider text-govt-muted font-bold block">
                To
              </label>
              <input
                id="route-to"
                value={toQuery}
                onChange={(event) => setToQuery(event.target.value)}
                onFocus={() => setIsDestinationFocused(true)}
                className="w-full bg-transparent text-xs font-semibold text-govt-text outline-none placeholder:text-govt-muted"
                placeholder="Choose destination"
                aria-label="Destination"
                aria-autocomplete="list"
                aria-controls="destination-suggestions"
              />
              {isDestinationFocused && destinationSuggestions.length > 0 && (
                <div
                  id="destination-suggestions"
                  role="listbox"
                  className="absolute left-0 right-0 top-[calc(100%+0.5rem)] z-20 overflow-hidden rounded border border-govt-border bg-white shadow-lg"
                >
                  <div className="px-2.5 py-1.5 text-[10px] font-bold uppercase tracking-wider text-govt-muted border-b border-govt-border">
                    Choose destination
                  </div>
                  {destinationSuggestions.map((destination) => (
                    <button
                      key={`${destination.lat}-${destination.lng}`}
                      type="button"
                      role="option"
                      onMouseDown={() => handleDestinationSelect(destination)}
                      className="w-full px-2.5 py-2 text-left hover:bg-navy/5 transition-colors"
                    >
                      <div className="text-xs font-semibold text-govt-text truncate">{destination.displayName}</div>
                    </button>
                  ))}
                </div>
              )}
              {isSearching && <div className="mt-1 text-[10px] text-govt-muted">Finding road routes...</div>}
          </div>
        </div>
      </div>
      </div>

      {/* Available routes matching the selected locations */}
      <div className="space-y-2 max-h-36 overflow-y-auto pr-1 mb-3">
        {(routeOptions.length > 0
          ? routeOptions
          : [activeRoute, ...availableRoutes.filter((route) => route.id !== activeRoute.id && route.destinationName.toLowerCase().includes(toQuery.toLowerCase()))]
        ).map((route) => {
          const isSelected = route.id === selectedRouteId;
          const blackoutCount = route.blackoutZones.length;
          const trafficStyle = route.traffic.severity === 'high'
            ? 'border-red-300 bg-red-50/90'
            : route.traffic.severity === 'moderate'
              ? 'border-amber-300 bg-amber-50/90'
              : 'border-green-300 bg-green-50/90';
          const trafficLabel = route.traffic.severity === 'high' ? 'Heavy traffic' : route.traffic.severity === 'moderate' ? 'Medium traffic' : 'Best route';

          return (
            <button
              type="button"
              key={route.id}
              onClick={() => handleApplyRoute(route.id)}
              className={`w-full text-left p-3 rounded border transition-all cursor-pointer ${
                `${trafficStyle} hover:shadow-sm ${isSelected ? 'ring-2 ring-navy' : ''}`
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
                <span className="font-bold text-govt-text">{trafficLabel}</span>
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
            </button>
          );
        })}
      </div>
      {searchError && <div className="mb-2 rounded border border-red-200 bg-red-50 px-2 py-1 text-[10px] font-semibold text-govt-red">{searchError}</div>}
      <button
        type="button"
        onClick={() => {
          startNavigation();
          setIsPlannerExpanded(false);
        }}
        disabled={isSearching}
        className="mb-2 w-full rounded bg-govt-green px-3 py-2 text-xs font-bold text-white transition-colors hover:bg-green-700 disabled:cursor-not-allowed disabled:opacity-60"
      >
        Start Navigation
      </button>

      {/* Optional simulation setting */}
      <div className="border-t border-govt-border pt-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Zap className="w-4 h-4 text-govt-amber" />
          <div>
            <div className="text-xs font-semibold text-govt-text">Tunnel simulation</div>
            <div className="text-[10px] text-govt-muted">Automatically switch to dead reckoning</div>
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
          {autoBlackoutEnabled ? 'ON' : 'OFF'}
        </button>
      </div>
      </>}
    </div>
  );
}
