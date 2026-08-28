import React from 'react';
import {
  Sparkles,
  Volume2,
  AlertTriangle,
  Clock,
  Compass,
  ArrowRight,
  TrendingDown,
  Info,
} from 'lucide-react';
import { useNavigation } from '../context/NavigationContext';

export default function SmartAssistant() {
  const {
    activeRoute,
    useAlternativeRoute,
    toggleRouteVariant,
    speakAssistantMessage,
  } = useNavigation();

  const traffic = activeRoute.traffic;
  const alt = activeRoute.alternative;

  // Assistant advice generation
  const getAdviceText = () => {
    if (useAlternativeRoute) {
      return `AI Navigation Assistant: You are currently on the ${alt.name}. This corridor is ${alt.distanceKm} kilometers long, avoids all subterranean GNSS blackout zones, and maintains a continuous satellite navigation signal.`;
    }

    if (traffic.severity === 'high') {
      return `AI Navigation Assistant: Traffic congestion is currently high at ${traffic.locationName} due to ${traffic.reason.toLowerCase()} I highly recommend switching to the ${alt.name}. It is only ${Math.round((alt.distanceKm - activeRoute.distanceKm) * 1000)} meters longer but bypasses a ${activeRoute.blackoutZones[0]?.lengthMeters || 700} meter GNSS blackout zone and saves you time.`;
    }

    return `AI Navigation Assistant: You are navigating on the shortest path via the ${activeRoute.name}. A ${activeRoute.blackoutZones[0]?.lengthMeters || 700} meter GNSS blackout zone lies ahead inside the ${activeRoute.blackoutZones[0]?.name || 'tunnel'}. Alternative bypass route is available.`;
  };

  const handleSpeak = () => {
    speakAssistantMessage(getAdviceText());
  };

  const trafficColor =
    traffic.severity === 'high'
      ? 'bg-red-100 text-govt-red border-red-200'
      : traffic.severity === 'moderate'
        ? 'bg-amber-100 text-govt-amber border-amber-200'
        : 'bg-green-100 text-govt-green border-green-200';

  return (
    <div className="bg-white border border-govt-border rounded-lg shadow-sm overflow-hidden text-govt-text">
      {/* Header */}
      <div className="bg-navy px-3.5 py-2 flex items-center justify-between text-white border-b border-navy-light">
        <div className="flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-amber-300 animate-pulse" />
          <span className="text-xs font-bold tracking-wide uppercase">AI Co-Driver Assistant</span>
        </div>
        <button
          onClick={handleSpeak}
          className="p-1 rounded bg-white/10 hover:bg-white/20 transition-colors flex items-center justify-center"
          title="Listen to Advice"
        >
          <Volume2 className="w-3.5 h-3.5" />
        </button>
      </div>

      <div className="p-3.5 space-y-3">
        {/* Real-time traffic congestion card */}
        <div className={`border rounded p-3 text-xs flex gap-2 ${trafficColor}`}>
          <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
          <div className="space-y-0.5">
            <span className="font-bold">TRAFFIC ALERT:</span>{' '}
            <span className="font-medium">
              {traffic.locationName} is experiencing {traffic.severity} congestion due to {traffic.reason}
            </span>
            <div className="flex items-center gap-3 pt-1 text-[10px] opacity-90 font-mono">
              <span className="flex items-center gap-0.5">
                <Clock className="w-3 h-3" /> Delay: +{Math.round(traffic.delaySeconds / 60)} mins
              </span>
            </div>
          </div>
        </div>

        {/* Shortest vs Avoid Outage Choice Buttons */}
        <div className="border border-govt-border rounded-lg p-2.5 bg-gray-50 space-y-2">
          <div className="text-[10px] text-govt-muted uppercase font-bold tracking-wider">
            Select Route Corridor
          </div>
          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={() => {
                if (useAlternativeRoute) toggleRouteVariant();
              }}
              className={`p-2 rounded border text-left transition-all ${
                !useAlternativeRoute
                  ? 'border-navy bg-navy/5 text-navy font-bold shadow-xs'
                  : 'border-govt-border bg-white text-govt-text'
              }`}
            >
              <div className="text-xs">Shortest Route</div>
              <div className="text-[9px] text-govt-muted font-mono mt-0.5">
                {activeRoute.distanceKm} km | {activeRoute.estimatedMinutes} min
              </div>
              <div className="text-[8px] text-govt-red font-semibold mt-1">
                ⚠️ Contains GNSS Blackout
              </div>
            </button>

            <button
              onClick={() => {
                if (!useAlternativeRoute) toggleRouteVariant();
              }}
              className={`p-2 rounded border text-left transition-all ${
                useAlternativeRoute
                  ? 'border-navy bg-navy/5 text-navy font-bold shadow-xs'
                  : 'border-govt-border bg-white text-govt-text'
              }`}
            >
              <div className="text-xs">Bypass / GNSS-Safe</div>
              <div className="text-[9px] text-govt-muted font-mono mt-0.5">
                {alt.distanceKm} km | {alt.estimatedMinutes} min
              </div>
              <div className="text-[8px] text-govt-green font-semibold mt-1">
                ✓ Continuous GPS Coverage
              </div>
            </button>
          </div>
        </div>

        {/* Assistant Advice Explanation */}
        <div className="bg-govt-grey/80 border border-govt-border rounded-lg p-3 text-xs leading-relaxed flex gap-2">
          <div className="w-5 h-5 rounded-full bg-navy/10 flex items-center justify-center shrink-0 text-navy mt-0.5">
            <Sparkles className="w-3 h-3" />
          </div>
          <div>
            <div className="font-bold text-navy mb-0.5">Co-Driver Recommendation</div>
            <div className="text-govt-muted">{getAdviceText()}</div>
            <button
              onClick={handleSpeak}
              className="mt-2 text-[10px] text-navy font-bold hover:underline flex items-center gap-1"
            >
              <Volume2 className="w-3 h-3" /> Listen to Audio Announcement
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
