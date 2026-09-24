export type GNSSStatus = 'healthy' | 'weak' | 'unavailable' | 'restored';

export type NavigationMode =
  | 'GNSS + INS Fusion'
  | 'Transitioning'
  | 'Intelligent Dead Reckoning'
  | 'Fusion Correction';

export type MotionState =
  | 'Moving'
  | 'Accelerating'
  | 'Braking'
  | 'Turning'
  | 'Stationary'
  | 'Road Disturbance Detected';

export interface Position {
  lat: number;
  lng: number;
}

export interface SensorReading {
  x: number;
  y: number;
  z: number;
  timestamp: number;
}

export interface BlackoutZone {
  name: string;
  type: 'Tunnel' | 'Underpass' | 'Urban Canyon' | 'Forest Dense Canopy';
  startIndex: number;
  endIndex: number;
  lengthMeters: number;
  description: string;
}

export interface Maneuver {
  stepIndex: number;
  instruction: string;
  roadName: string;
  direction: 'straight' | 'slight-right' | 'right' | 'slight-left' | 'left' | 'u-turn' | 'tunnel-entry' | 'destination';
  distanceMeters: number;
}

export interface TrafficZone {
  locationName: string;
  severity: 'low' | 'moderate' | 'high';
  delaySeconds: number;
  reason: string;
}

export interface AlternativeRoute {
  name: string;
  distanceKm: number;
  estimatedMinutes: number;
  waypoints: Position[];
  reason: string;
  hasBlackout: boolean;
}

export interface NavigationRoute {
  id: string;
  name: string;
  originName: string;
  destinationName: string;
  originCoords: Position;
  destinationCoords: Position;
  distanceKm: number;
  estimatedMinutes: number;
  speedLimitKmh: number;
  waypoints: Position[];
  blackoutZones: BlackoutZone[];
  maneuvers: Maneuver[];
  tags: string[];
  traffic: TrafficZone;
  alternative: AlternativeRoute;
}

export interface GeocodedLocation {
  displayName: string;
  lat: number;
  lng: number;
}

export interface NavigationState {
  gnssStatus: GNSSStatus;
  navigationMode: NavigationMode;
  position: Position;
  speed: number;
  heading: number;
  headingLabel: string;
  positionConfidence: number;
  drift: number;
  driftPercentage: number;
  blackoutDistance: number;
  isBlackout: boolean;
  systemMessage: string;
  accelerometer: SensorReading[];
  gyroscope: SensorReading[];
  motionState: MotionState;
  motionConfidence: number;
  gnssTrajectory: Position[];
  drTrajectory: Position[];
  blackoutSegment: Position[];
  activeRoute: NavigationRoute;
  isNavigating: boolean;
  isPaused: boolean;
  currentManeuver: Maneuver | null;
  distanceToNextManeuver: number;
  remainingDistanceMeters: number;
  activeBlackoutZone: BlackoutZone | null;
  autoBlackoutEnabled: boolean;
  // Route variants (shortest vs. bypass)
  useAlternativeRoute: boolean;
}

export interface ModuleStatus {
  name: string;
  status: 'Active' | 'Warning' | 'Unavailable';
}
