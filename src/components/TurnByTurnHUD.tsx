import React from 'react';
import {
  ArrowUp,
  ArrowUpRight,
  ArrowUpLeft,
  CornerUpRight,
  CornerUpLeft,
  RotateCcw,
  ShieldAlert,
  Play,
  Pause,
  RotateCw,
  Clock,
  Compass,
} from 'lucide-react';
import { useNavigation } from '../context/NavigationContext';

export default function TurnByTurnHUD({ onOpenRouteSelector }: { onOpenRouteSelector: () => void }) {
  const {
    activeRoute,
    currentManeuver,
    remainingDistanceMeters,
    speed,
    isPaused,
    isBlackout,
    activeBlackoutZone,
    pauseNavigation,
    resumeNavigation,
    resetSimulation,
  } = useNavigation();

  const getManeuverIcon = () => {
    if (!currentManeuver) return <ArrowUp className="w-6 h-6 text-white" />;
    switch (currentManeuver.direction) {
      case 'tunnel-entry':
        return <ShieldAlert className="w-6 h-6 text-amber-300 animate-pulse" />;
      case 'right':
        return <CornerUpRight className="w-6 h-6 text-white" />;
      case 'slight-right':
        return <ArrowUpRight className="w-6 h-6 text-white" />;
      case 'left':
        return <CornerUpLeft className="w-6 h-6 text-white" />;
      case 'slight-left':
        return <ArrowUpLeft className="w-6 h-6 text-white" />;
      case 'u-turn':
        return <RotateCcw className="w-6 h-6 text-white" />;
      default:
        return <ArrowUp className="w-6 h-6 text-white" />;
    }
  };

  const etaMinutes = Math.max(1, Math.round(remainingDistanceMeters / 1000 / 0.7));

  return (
    <div className="absolute top-3 left-3 right-3 sm:right-auto sm:max-w-md z-[1000] flex flex-col gap-2">
      {/* Top Turn Guidance Box */}
      <div className="bg-navy text-white rounded-lg shadow-lg overflow-hidden border border-navy-light/40">
        <div className="p-3 sm:p-3.5 flex items-center justify-between gap-3">
          {/* Turn Icon */}
          <div className="w-11 h-11 rounded-lg bg-white/10 flex items-center justify-center shrink-0 border border-white/10">
            {getManeuverIcon()}
          </div>

          {/* Instruction & Road Name */}
          <div className="flex-1 min-w-0">
            <div className="text-xs sm:text-sm font-bold leading-snug line-clamp-2">
              {currentManeuver?.instruction || 'Proceed along designated route'}
            </div>
            <div className="text-[11px] text-gray-300 flex items-center gap-1.5 mt-0.5">
              <span className="font-semibold text-govt-amber truncate">
                {currentManeuver?.roadName || activeRoute.name}
              </span>
            </div>
          </div>

          {/* Route Change Button */}
          <button
            onClick={onOpenRouteSelector}
            className="px-2.5 py-1.5 rounded bg-white/15 hover:bg-white/25 text-[11px] font-semibold transition-colors shrink-0 flex items-center gap-1"
          >
            Change Route
          </button>
        </div>

        {/* Status Strip */}
        <div className="bg-navy-dark px-3 py-1.5 flex items-center justify-between text-[11px] border-t border-white/10 text-gray-300">
          <div className="flex items-center gap-3">
            <span className="font-mono font-bold text-white">
              {(remainingDistanceMeters / 1000).toFixed(1)} km left
            </span>
            <span className="flex items-center gap-1 text-gray-400">
              <Clock className="w-3 h-3" /> ~{etaMinutes} min
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={isPaused ? resumeNavigation : pauseNavigation}
              className="hover:text-white transition-colors p-1"
              title={isPaused ? 'Resume' : 'Pause'}
            >
              {isPaused ? <Play className="w-3.5 h-3.5 text-govt-green" /> : <Pause className="w-3.5 h-3.5" />}
            </button>
            <button
              onClick={resetSimulation}
              className="hover:text-white transition-colors p-1"
              title="Restart Route"
            >
              <RotateCw className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* In-Tunnel Dead Reckoning Alert Banner */}
      {isBlackout && (
        <div className="bg-red-900/90 backdrop-blur-sm text-white px-3.5 py-2 rounded-lg border border-red-500/50 shadow-md flex items-center justify-between text-xs animate-fadeIn">
          <div className="flex items-center gap-2">
            <ShieldAlert className="w-4 h-4 text-red-300 shrink-0" />
            <div>
              <span className="font-bold">IN BLACKOUT ZONE: </span>
              <span className="text-red-200">{activeBlackoutZone?.name || 'Underpass Corridor'}</span>
            </div>
          </div>
          <span className="bg-white/20 text-white font-mono px-1.5 py-0.5 rounded text-[10px] font-bold">
            AI DR ACTIVE
          </span>
        </div>
      )}
    </div>
  );
}
