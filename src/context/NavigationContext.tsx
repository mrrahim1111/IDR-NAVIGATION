import React, { createContext, useContext, useState, useRef, useCallback, useEffect } from 'react';
import type {
  GNSSStatus,
  NavigationMode,
  Position,
  SensorReading,
  MotionState,
  NavigationState,
  NavigationRoute,
  Maneuver,
  BlackoutZone,
} from '../types';
import { PRESET_ROUTES, VIJAYAWADA_ROUTE } from '../data/routes';

function getHeading(from: Position, to: Position): number {
  const dLng = to.lng - from.lng;
  const dLat = to.lat - from.lat;
  let angle = Math.atan2(dLng, dLat) * (180 / Math.PI);
  if (angle < 0) angle += 360;
  return Math.round(angle);
}

function getHeadingLabel(deg: number): string {
  if (deg >= 337.5 || deg < 22.5) return 'North';
  if (deg >= 22.5 && deg < 67.5) return 'North-East';
  if (deg >= 67.5 && deg < 112.5) return 'East';
  if (deg >= 112.5 && deg < 157.5) return 'South-East';
  if (deg >= 157.5 && deg < 202.5) return 'South';
  if (deg >= 202.5 && deg < 247.5) return 'South-West';
  if (deg >= 247.5 && deg < 292.5) return 'West';
  return 'North-West';
}

function distanceBetween(a: Position, b: Position): number {
  const R = 6371000;
  const dLat = ((b.lat - a.lat) * Math.PI) / 180;
  const dLng = ((b.lng - a.lng) * Math.PI) / 180;
  const aVal =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((a.lat * Math.PI) / 180) *
      Math.cos((b.lat * Math.PI) / 180) *
      Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(aVal), Math.sqrt(1 - aVal));
}

function generateSensorReading(base: number, noiseScale: number): SensorReading {
  return {
    x: base + (Math.random() - 0.5) * noiseScale,
    y: (Math.random() - 0.5) * noiseScale * 0.8,
    z: 9.8 + (Math.random() - 0.5) * noiseScale * 0.3,
    timestamp: Date.now(),
  };
}

interface NavContextValue extends NavigationState {
  availableRoutes: NavigationRoute[];
  selectRoute: (routeId: string) => void;
  startNavigation: () => void;
  pauseNavigation: () => void;
  resumeNavigation: () => void;
  stopNavigation: () => void;
  simulateBlackout: () => void;
  restoreGNSS: () => void;
  resetSimulation: () => void;
  toggleAutoBlackout: () => void;
}

const NavigationContext = createContext<NavContextValue | null>(null);

export function useNavigation(): NavContextValue {
  const ctx = useContext(NavigationContext);
  if (!ctx) throw new Error('useNavigation must be used within NavigationProvider');
  return ctx;
}

export function NavigationProvider({ children }: { children: React.ReactNode }) {
  const [activeRoute, setActiveRoute] = useState<NavigationRoute>(VIJAYAWADA_ROUTE);
  const [routeIndex, setRouteIndex] = useState(0);
  const [isNavigating, setIsNavigating] = useState(true);
  const [isPaused, setIsPaused] = useState(false);
  const [autoBlackoutEnabled, setAutoBlackoutEnabled] = useState(true);

  const [gnssStatus, setGnssStatus] = useState<GNSSStatus>('healthy');
  const [navigationMode, setNavigationMode] = useState<NavigationMode>('GNSS + INS Fusion');
  const [position, setPosition] = useState<Position>(VIJAYAWADA_ROUTE.waypoints[0]);
  const [speed, setSpeed] = useState(48);
  const [heading, setHeading] = useState(62);
  const [headingLabel, setHeadingLabel] = useState('North-East');
  const [positionConfidence, setPositionConfidence] = useState(98);
  const [drift, setDrift] = useState(0);
  const [driftPercentage, setDriftPercentage] = useState(0);
  const [blackoutDistance, setBlackoutDistance] = useState(0);
  const [isBlackout, setIsBlackout] = useState(false);
  const [systemMessage, setSystemMessage] = useState('System active. GNSS + INS Fusion engaged.');

  const [gnssTrajectory, setGnssTrajectory] = useState<Position[]>([VIJAYAWADA_ROUTE.waypoints[0]]);
  const [drTrajectory, setDrTrajectory] = useState<Position[]>([]);
  const [blackoutSegment, setBlackoutSegment] = useState<Position[]>([]);
  const [accelerometer, setAccelerometer] = useState<SensorReading[]>([]);
  const [gyroscope, setGyroscope] = useState<SensorReading[]>([]);
  const [motionState, setMotionState] = useState<MotionState>('Moving');
  const [motionConfidence, setMotionConfidence] = useState(94);

  const [currentManeuver, setCurrentManeuver] = useState<Maneuver | null>(VIJAYAWADA_ROUTE.maneuvers[0]);
  const [distanceToNextManeuver, setDistanceToNextManeuver] = useState(550);
  const [remainingDistanceMeters, setRemainingDistanceMeters] = useState(3400);
  const [activeBlackoutZone, setActiveBlackoutZone] = useState<BlackoutZone | null>(null);

  const blackoutDistRef = useRef(0);
  const driftAccumulatorRef = useRef(0);
  const recoveryTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Switch Route Function
  const selectRoute = useCallback((routeId: string) => {
    const route = PRESET_ROUTES.find((r) => r.id === routeId) || VIJAYAWADA_ROUTE;
    setActiveRoute(route);
    setRouteIndex(0);
    setPosition(route.waypoints[0]);
    setGnssTrajectory([route.waypoints[0]]);
    setDrTrajectory([]);
    setBlackoutSegment([]);
    setIsBlackout(false);
    setGnssStatus('healthy');
    setNavigationMode('GNSS + INS Fusion');
    setDrift(0);
    setDriftPercentage(0);
    setBlackoutDistance(0);
    blackoutDistRef.current = 0;
    driftAccumulatorRef.current = 0;
    setCurrentManeuver(route.maneuvers[0]);
    setRemainingDistanceMeters(route.distanceKm * 1000);
    setSystemMessage(`Route loaded: ${route.name}. Ready for navigation.`);
    setIsPaused(false);
    setIsNavigating(true);
  }, []);

  const simulateBlackout = useCallback(() => {
    setIsBlackout(true);
    setGnssStatus('unavailable');
    setNavigationMode('Intelligent Dead Reckoning');
    setSystemMessage('⚠ GNSS signal unavailable. Intelligent Dead Reckoning activated.');
    setPositionConfidence(92);
    setDrift(0);
    setDriftPercentage(0);
    blackoutDistRef.current = 0;
    driftAccumulatorRef.current = 0;
    setBlackoutDistance(0);
    setBlackoutSegment([{ ...position }]);
    setDrTrajectory([{ ...position }]);
  }, [position]);

  const restoreGNSS = useCallback(() => {
    setGnssStatus('restored');
    setNavigationMode('Fusion Correction');
    setSystemMessage('✓ GNSS signal restored. Fusion correction in progress...');

    if (recoveryTimerRef.current) clearTimeout(recoveryTimerRef.current);
    recoveryTimerRef.current = setTimeout(() => {
      setGnssStatus('healthy');
      setNavigationMode('GNSS + INS Fusion');
      setSystemMessage('✓ Navigation stabilized. GNSS + INS Fusion active.');
      setIsBlackout(false);
      setActiveBlackoutZone(null);
      setPositionConfidence(98);
      setDrift(0);
      setDriftPercentage(0);
      setBlackoutDistance(0);

      setBlackoutSegment((seg) => {
        setGnssTrajectory((t) => [...t, ...seg]);
        return [];
      });
      setDrTrajectory([]);
    }, 2800);
  }, []);

  // Main Vehicle Route Loop
  useEffect(() => {
    if (!isNavigating || isPaused) return;

    const interval = setInterval(() => {
      setRouteIndex((prev) => {
        const waypoints = activeRoute.waypoints;
        const next = prev < waypoints.length - 1 ? prev + 1 : 0;
        const from = waypoints[prev];
        const to = waypoints[next];

        // Heading & Speed
        const newHeading = getHeading(from, to);
        setHeading(newHeading);
        setHeadingLabel(getHeadingLabel(newHeading));
        setPosition(to);
        setSpeed(Math.max(25, Math.min(activeRoute.speedLimitKmh, 40 + Math.random() * 20)));

        // Calculate remaining trip distance
        let remDist = 0;
        for (let i = next; i < waypoints.length - 1; i++) {
          remDist += distanceBetween(waypoints[i], waypoints[i + 1]);
        }
        setRemainingDistanceMeters(Math.round(remDist));

        // Find applicable maneuver
        const nextManeuver = [...activeRoute.maneuvers]
          .reverse()
          .find((m) => next >= m.stepIndex) || activeRoute.maneuvers[0];
        setCurrentManeuver(nextManeuver);

        // Check if inside any BlackoutZone
        const matchingZone = activeRoute.blackoutZones.find(
          (z) => next >= z.startIndex && next <= z.endIndex
        );

        if (autoBlackoutEnabled) {
          if (matchingZone && !isBlackout && gnssStatus === 'healthy') {
            // ENTERING BLACKOUT ZONE
            setIsBlackout(true);
            setActiveBlackoutZone(matchingZone);
            setGnssStatus('unavailable');
            setNavigationMode('Intelligent Dead Reckoning');
            setSystemMessage(`⚠ Entering ${matchingZone.name} (${matchingZone.type}). Satellite link lost. AI Dead Reckoning engaged.`);
            blackoutDistRef.current = 0;
            driftAccumulatorRef.current = 0;
            setBlackoutDistance(0);
            setDrift(0);
            setDriftPercentage(0);
            setBlackoutSegment([to]);
            setDrTrajectory([to]);
          } else if (!matchingZone && isBlackout && gnssStatus === 'unavailable') {
            // EXITING BLACKOUT ZONE
            restoreGNSS();
          }
        }

        // Update Trajectories
        if (gnssStatus === 'healthy' || gnssStatus === 'restored') {
          setGnssTrajectory((t) => [...t.slice(-120), to]);
        }

        if (isBlackout) {
          setDrTrajectory((t) => [...t.slice(-120), to]);
          setBlackoutSegment((t) => [...t.slice(-120), to]);
          const stepDist = distanceBetween(from, to);
          blackoutDistRef.current += stepDist;
          setBlackoutDistance(Math.round(blackoutDistRef.current));

          // Dead reckoning drift calculation (realistic 3-5% error rate)
          const errorPerMeter = 0.035 + (Math.random() * 0.02);
          driftAccumulatorRef.current += stepDist * errorPerMeter;
          setDrift(parseFloat(driftAccumulatorRef.current.toFixed(1)));

          if (blackoutDistRef.current > 0) {
            const pct = (driftAccumulatorRef.current / blackoutDistRef.current) * 100;
            setDriftPercentage(parseFloat(pct.toFixed(2)));
          }

          setPositionConfidence((c) => Math.max(82, c - 0.2));
        }

        // Sensor Feed (Accelerometer & Gyroscope)
        const disturbance = isBlackout ? 3.8 : 2.0;
        setAccelerometer((prev) => [...prev.slice(-60), generateSensorReading(0.6, disturbance)]);
        setGyroscope((prev) => [...prev.slice(-60), generateSensorReading(0.02, disturbance * 0.12)]);

        // Motion State Classification
        if (Math.random() < 0.08) {
          const states: MotionState[] = ['Moving', 'Accelerating', 'Turning', 'Moving', 'Moving'];
          if (isBlackout && Math.random() < 0.3) {
            states.push('Road Disturbance Detected');
          }
          setMotionState(states[Math.floor(Math.random() * states.length)]);
          setMotionConfidence(Math.round(89 + Math.random() * 9));
        }

        return next;
      });
    }, 750);

    return () => clearInterval(interval);
  }, [isNavigating, isPaused, activeRoute, isBlackout, gnssStatus, autoBlackoutEnabled, restoreGNSS]);

  const startNavigation = useCallback(() => {
    setIsNavigating(true);
    setIsPaused(false);
    setSystemMessage(`Navigating along ${activeRoute.name}`);
  }, [activeRoute]);

  const pauseNavigation = useCallback(() => {
    setIsPaused(true);
    setSystemMessage('Navigation paused.');
  }, []);

  const resumeNavigation = useCallback(() => {
    setIsPaused(false);
    setSystemMessage('Navigation resumed.');
  }, []);

  const stopNavigation = useCallback(() => {
    setIsNavigating(false);
    setIsPaused(false);
    setSystemMessage('Navigation stopped.');
  }, []);

  const resetSimulation = useCallback(() => {
    selectRoute(activeRoute.id);
  }, [activeRoute.id, selectRoute]);

  const toggleAutoBlackout = useCallback(() => {
    setAutoBlackoutEnabled((prev) => !prev);
  }, []);

  const value: NavContextValue = {
    gnssStatus,
    navigationMode,
    position,
    speed,
    heading,
    headingLabel,
    positionConfidence,
    drift,
    driftPercentage,
    blackoutDistance,
    isBlackout,
    systemMessage,
    gnssTrajectory,
    drTrajectory,
    blackoutSegment,
    accelerometer,
    gyroscope,
    motionState,
    motionConfidence,
    activeRoute,
    isNavigating,
    isPaused,
    currentManeuver,
    distanceToNextManeuver,
    remainingDistanceMeters,
    activeBlackoutZone,
    autoBlackoutEnabled,
    availableRoutes: PRESET_ROUTES,
    selectRoute,
    startNavigation,
    pauseNavigation,
    resumeNavigation,
    stopNavigation,
    simulateBlackout,
    restoreGNSS,
    resetSimulation,
    toggleAutoBlackout,
  };

  return <NavigationContext.Provider value={value}>{children}</NavigationContext.Provider>;
}
