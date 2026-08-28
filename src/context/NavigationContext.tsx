import React, { createContext, useContext, useState, useRef, useCallback, useEffect } from 'react';
import type {
  GNSSStatus,
  NavigationMode,
  Position,
  SensorReading,
  MotionState,
  NavigationState,
} from '../types';

// Predefined route near Vijayawada (16.5062°N, 80.6480°E)
const ROUTE_POINTS: Position[] = [
  { lat: 16.5020, lng: 80.6400 },
  { lat: 16.5025, lng: 80.6410 },
  { lat: 16.5030, lng: 80.6420 },
  { lat: 16.5035, lng: 80.6430 },
  { lat: 16.5040, lng: 80.6440 },
  { lat: 16.5045, lng: 80.6448 },
  { lat: 16.5050, lng: 80.6455 },
  { lat: 16.5055, lng: 80.6460 },
  { lat: 16.5058, lng: 80.6465 },
  { lat: 16.5060, lng: 80.6470 },
  { lat: 16.5062, lng: 80.6475 },
  { lat: 16.5062, lng: 80.6480 },
  { lat: 16.5063, lng: 80.6488 },
  { lat: 16.5065, lng: 80.6495 },
  { lat: 16.5068, lng: 80.6502 },
  { lat: 16.5072, lng: 80.6508 },
  { lat: 16.5076, lng: 80.6515 },
  { lat: 16.5080, lng: 80.6520 },
  { lat: 16.5085, lng: 80.6525 },
  { lat: 16.5090, lng: 80.6530 },
  { lat: 16.5095, lng: 80.6535 },
  { lat: 16.5100, lng: 80.6540 },
  { lat: 16.5105, lng: 80.6544 },
  { lat: 16.5110, lng: 80.6548 },
  { lat: 16.5115, lng: 80.6550 },
  { lat: 16.5120, lng: 80.6552 },
  { lat: 16.5125, lng: 80.6556 },
  { lat: 16.5130, lng: 80.6560 },
  { lat: 16.5135, lng: 80.6565 },
  { lat: 16.5140, lng: 80.6570 },
];

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
  simulateBlackout: () => void;
  restoreGNSS: () => void;
  resetSimulation: () => void;
}

const NavigationContext = createContext<NavContextValue | null>(null);

export function useNavigation(): NavContextValue {
  const ctx = useContext(NavigationContext);
  if (!ctx) throw new Error('useNavigation must be used within NavigationProvider');
  return ctx;
}

export function NavigationProvider({ children }: { children: React.ReactNode }) {
  const [routeIndex, setRouteIndex] = useState(0);
  const [gnssStatus, setGnssStatus] = useState<GNSSStatus>('healthy');
  const [navigationMode, setNavigationMode] = useState<NavigationMode>('GNSS + INS Fusion');
  const [position, setPosition] = useState<Position>(ROUTE_POINTS[0]);
  const [speed, setSpeed] = useState(48);
  const [heading, setHeading] = useState(62);
  const [headingLabel, setHeadingLabel] = useState('North-East');
  const [positionConfidence, setPositionConfidence] = useState(98);
  const [drift, setDrift] = useState(0);
  const [driftPercentage, setDriftPercentage] = useState(0);
  const [blackoutDistance, setBlackoutDistance] = useState(0);
  const [isBlackout, setIsBlackout] = useState(false);
  const [systemMessage, setSystemMessage] = useState('System active. GNSS signal healthy.');
  const [gnssTrajectory, setGnssTrajectory] = useState<Position[]>([ROUTE_POINTS[0]]);
  const [drTrajectory, setDrTrajectory] = useState<Position[]>([]);
  const [blackoutSegment, setBlackoutSegment] = useState<Position[]>([]);
  const [accelerometer, setAccelerometer] = useState<SensorReading[]>([]);
  const [gyroscope, setGyroscope] = useState<SensorReading[]>([]);
  const [motionState, setMotionState] = useState<MotionState>('Moving');
  const [motionConfidence, setMotionConfidence] = useState(94);

  const blackoutStartRef = useRef<Position | null>(null);
  const blackoutDistRef = useRef(0);
  const recoveryTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Vehicle movement simulation
  useEffect(() => {
    const interval = setInterval(() => {
      setRouteIndex((prev) => {
        const next = prev < ROUTE_POINTS.length - 1 ? prev + 1 : 0;
        const from = ROUTE_POINTS[prev];
        const to = ROUTE_POINTS[next];

        const newHeading = getHeading(from, to);
        setHeading(newHeading);
        setHeadingLabel(getHeadingLabel(newHeading));
        setPosition(to);
        setSpeed(42 + Math.random() * 16);

        // Update trajectories
        setGnssStatus((currentGnss) => {
          if (currentGnss === 'healthy' || currentGnss === 'restored') {
            setGnssTrajectory((t) => [...t.slice(-100), to]);
          }
          return currentGnss;
        });

        setIsBlackout((currentBlackout) => {
          if (currentBlackout) {
            setDrTrajectory((t) => [...t.slice(-100), to]);
            setBlackoutSegment((t) => [...t.slice(-100), to]);
            const dist = distanceBetween(from, to);
            blackoutDistRef.current += dist;
            setBlackoutDistance(blackoutDistRef.current);
            const d = 1.2 + Math.random() * 0.8;
            setDrift((prev) => prev + d * 0.15);
            setDriftPercentage(() => {
              const totalDist = blackoutDistRef.current;
              if (totalDist === 0) return 0;
              return parseFloat(((drift / totalDist) * 100).toFixed(2));
            });
            setPositionConfidence((prev) => Math.max(78, prev - 0.3));
          }
          return currentBlackout;
        });

        // Update sensor data
        const noiseScale = 2.5;
        setAccelerometer((prev) => [...prev.slice(-60), generateSensorReading(0.5, noiseScale)]);
        setGyroscope((prev) => [
          ...prev.slice(-60),
          generateSensorReading(0.02, noiseScale * 0.1),
        ]);

        // Cycle motion states occasionally
        if (Math.random() < 0.05) {
          const states: MotionState[] = [
            'Moving',
            'Accelerating',
            'Turning',
            'Moving',
            'Moving',
          ];
          setMotionState(states[Math.floor(Math.random() * states.length)]);
          setMotionConfidence(88 + Math.random() * 10);
        }

        return next;
      });
    }, 800);

    return () => clearInterval(interval);
  // eslint-disable-next-line react-hooks/exhaustive-deps
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
    setBlackoutDistance(0);
    blackoutStartRef.current = { ...position };
    setBlackoutSegment([{ ...position }]);
    setDrTrajectory([{ ...position }]);
  }, [position]);

  const restoreGNSS = useCallback(() => {
    // Phase 1: Restored
    setGnssStatus('restored');
    setNavigationMode('Fusion Correction');
    setSystemMessage('✓ GNSS signal restored. Correcting inertial trajectory...');

    // Phase 2: After 2s, stabilize
    if (recoveryTimerRef.current) clearTimeout(recoveryTimerRef.current);
    recoveryTimerRef.current = setTimeout(() => {
      setGnssStatus('healthy');
      setNavigationMode('GNSS + INS Fusion');
      setSystemMessage('✓ Navigation stabilized. GNSS + INS Fusion active.');
      setIsBlackout(false);
      setPositionConfidence(98);
      setDrift(0);
      setDriftPercentage(0);
      setBlackoutDistance(0);

      // Move blackout segment into GNSS trajectory for continuity
      setBlackoutSegment((seg) => {
        setGnssTrajectory((t) => [...t, ...seg]);
        return [];
      });
      setDrTrajectory([]);
    }, 3000);
  }, []);

  const resetSimulation = useCallback(() => {
    setRouteIndex(0);
    setGnssStatus('healthy');
    setNavigationMode('GNSS + INS Fusion');
    setPosition(ROUTE_POINTS[0]);
    setSpeed(48);
    setHeading(62);
    setHeadingLabel('North-East');
    setPositionConfidence(98);
    setDrift(0);
    setDriftPercentage(0);
    setBlackoutDistance(0);
    setIsBlackout(false);
    setSystemMessage('System active. GNSS signal healthy.');
    setGnssTrajectory([ROUTE_POINTS[0]]);
    setDrTrajectory([]);
    setBlackoutSegment([]);
    blackoutDistRef.current = 0;
    blackoutStartRef.current = null;
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
    simulateBlackout,
    restoreGNSS,
    resetSimulation,
  };

  return (
    <NavigationContext.Provider value={value}>{children}</NavigationContext.Provider>
  );
}
