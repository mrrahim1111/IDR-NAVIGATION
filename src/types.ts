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
}

export interface ModuleStatus {
  name: string;
  status: 'Active' | 'Warning' | 'Unavailable';
}
