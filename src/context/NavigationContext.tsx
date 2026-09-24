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

const translationCache = new Map<string, string>();

async function translateToHindi(text: string): Promise<string> {
  const cached = translationCache.get(text);
  if (cached) return cached;

  try {
    const response = await fetch(`https://translate.googleapis.com/translate_a/single?client=gtx&sl=en&tl=hi&dt=t&q=${encodeURIComponent(text)}`);
    if (!response.ok) throw new Error('Translation request failed');
    const result = await response.json() as [Array<[string, string]>];
    const translated = result[0].map((part) => part[0]).join('');
    if (translated) {
      translationCache.set(text, translated);
      return translated;
    }
  } catch (error) {
    console.warn('Hindi translation unavailable, using the original message:', error);
  }
  return text;
}

export type VoicePersona = 'male' | 'female';
export type VoiceLanguage = 'en-IN' | 'hi-IN';
export type VehicleType = 'car' | 'motorcycle' | 'bus' | 'truck';

export interface VoiceConfig {
  persona: VoicePersona;
  language: VoiceLanguage;
  useElevenLabs: boolean;
  elevenLabsApiKey: string;
  elevenLabsVoiceIds: {
    amitabh: string;
    morgan: string;
    jarvis: string;
    scarlett: string;
  };
  playChime: boolean;
}

interface NavContextValue extends NavigationState {
  availableRoutes: NavigationRoute[];
  selectRoute: (routeId: string) => void;
  loadRoute: (route: NavigationRoute) => void;
  vehicleType: VehicleType;
  setVehicleType: (vehicleType: VehicleType) => void;
  isNetworkOnline: boolean;
  startNavigation: () => void;
  pauseNavigation: () => void;
  resumeNavigation: () => void;
  stopNavigation: () => void;
  simulateBlackout: () => void;
  restoreGNSS: () => void;
  resetSimulation: () => void;
  toggleAutoBlackout: () => void;
  // Route selection variants
  toggleRouteVariant: () => void;
  voiceConfig: VoiceConfig;
  updateVoiceConfig: (config: Partial<VoiceConfig>) => void;
  speakAssistantMessage: (text: string) => void;
  stopAssistantMessage: () => void;
  isAssistantSpeaking: boolean;
  isLiveDataEnabled: boolean;
  hasLiveGpsFix: boolean;
  liveDataError: string | null;
  enableLiveData: () => void;
  disableLiveData: () => void;
}

const NavigationContext = createContext<NavContextValue | null>(null);

export function useNavigation(): NavContextValue {
  const ctx = useContext(NavigationContext);
  if (!ctx) throw new Error('useNavigation must be used within NavigationProvider');
  return ctx;
}

export function NavigationProvider({ children }: { children: React.ReactNode }) {
  const [activeRoute, setActiveRoute] = useState<NavigationRoute>(() => {
    const cachedRoute = localStorage.getItem('idr-nav-last-route');
    if (cachedRoute) {
      try {
        return JSON.parse(cachedRoute) as NavigationRoute;
      } catch {
        localStorage.removeItem('idr-nav-last-route');
      }
    }
    return VIJAYAWADA_ROUTE;
  });
  const [routeIndex, setRouteIndex] = useState(0);
  const [isNavigating, setIsNavigating] = useState(true);
  const [isPaused, setIsPaused] = useState(false);
  const [autoBlackoutEnabled, setAutoBlackoutEnabled] = useState(true);
  const [useAlternativeRoute, setUseAlternativeRoute] = useState(false);
  const [vehicleType, setVehicleType] = useState<VehicleType>('car');

  const [gnssStatus, setGnssStatus] = useState<GNSSStatus>('healthy');
  const [navigationMode, setNavigationMode] = useState<NavigationMode>('GNSS + INS Fusion');
  const [position, setPosition] = useState<Position>(() => activeRoute.waypoints[0]);
  const [speed, setSpeed] = useState(48);
  const [heading, setHeading] = useState(62);
  const [headingLabel, setHeadingLabel] = useState('North-East');
  const [positionConfidence, setPositionConfidence] = useState(98);
  const [drift, setDrift] = useState(0);
  const [driftPercentage, setDriftPercentage] = useState(0);
  const [blackoutDistance, setBlackoutDistance] = useState(0);
  const [isBlackout, setIsBlackout] = useState(false);
  const [systemMessage, setSystemMessage] = useState('System active. GNSS + INS Fusion engaged.');

  const [gnssTrajectory, setGnssTrajectory] = useState<Position[]>(() => [activeRoute.waypoints[0]]);
  const [drTrajectory, setDrTrajectory] = useState<Position[]>([]);
  const [blackoutSegment, setBlackoutSegment] = useState<Position[]>([]);
  const [accelerometer, setAccelerometer] = useState<SensorReading[]>([]);
  const [gyroscope, setGyroscope] = useState<SensorReading[]>([]);
  const [motionState, setMotionState] = useState<MotionState>('Moving');
  const [motionConfidence, setMotionConfidence] = useState(94);

  const [currentManeuver, setCurrentManeuver] = useState<Maneuver | null>(() => activeRoute.maneuvers[0] || null);
  const [distanceToNextManeuver, setDistanceToNextManeuver] = useState(() => activeRoute.maneuvers[0]?.distanceMeters || 0);
  const [remainingDistanceMeters, setRemainingDistanceMeters] = useState(() => activeRoute.distanceKm * 1000);
  const [activeBlackoutZone, setActiveBlackoutZone] = useState<BlackoutZone | null>(null);

  const blackoutDistRef = useRef(0);
  const driftAccumulatorRef = useRef(0);
  const recoveryTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const elevenLabsAudioRef = useRef<HTMLAudioElement | null>(null);
  const speechTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const speechRequestRef = useRef(0);
  const [isAssistantSpeaking, setIsAssistantSpeaking] = useState(false);
  const [isLiveDataEnabled, setIsLiveDataEnabled] = useState(false);
  const [hasLiveGpsFix, setHasLiveGpsFix] = useState(false);
  const [liveDataError, setLiveDataError] = useState<string | null>(null);
  const [isNetworkOnline, setIsNetworkOnline] = useState(() => navigator.onLine);
  const geolocationWatchRef = useRef<number | null>(null);
  const lastLivePositionRef = useRef<Position | null>(null);

  const [voiceConfig, setVoiceConfig] = useState<VoiceConfig>(() => {
    const saved = localStorage.getItem('sih_voice_config');
    if (saved) {
      try {
        const savedConfig = JSON.parse(saved);
        return {
          ...savedConfig,
          persona: savedConfig.persona === 'female' ? 'female' : 'male',
          language: savedConfig.language === 'hi-IN' ? 'hi-IN' : 'en-IN',
        };
      } catch (e) {
        console.error('Failed to parse saved voice config', e);
      }
    }
    return {
      persona: 'male',
      language: 'en-IN',
      useElevenLabs: false,
      elevenLabsApiKey: '',
      elevenLabsVoiceIds: {
        amitabh: 'N2l57XT2szw66Tj6o52b',
        morgan: 'VR6AQC4as24tcl9EXaGt',
        jarvis: 'pNInz6obpgHs5162wdla',
        scarlett: 'EXAVITQu4vr4xnSDxMaL',
      },
      playChime: true,
    };
  });

  useEffect(() => {
    localStorage.setItem('sih_voice_config', JSON.stringify(voiceConfig));
  }, [voiceConfig]);

  useEffect(() => {
    const handleOnline = () => setIsNetworkOnline(true);
    const handleOffline = () => setIsNetworkOnline(false);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Pre-load voices on load
  useEffect(() => {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.getVoices();
    }
  }, []);

  const updateVoiceConfig = useCallback((newConfig: Partial<VoiceConfig>) => {
    setVoiceConfig((prev) => {
      const updated = { ...prev, ...newConfig };
      if (newConfig.elevenLabsVoiceIds) {
        updated.elevenLabsVoiceIds = { ...prev.elevenLabsVoiceIds, ...newConfig.elevenLabsVoiceIds };
      }
      return updated;
    });
  }, []);

  const playChime = useCallback(() => {
    if (!('AudioContext' in window || 'webkitAudioContext' in window)) return;
    try {
      const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
      const ctx = new AudioContext();
      
      const osc1 = ctx.createOscillator();
      const gain1 = ctx.createGain();
      const osc2 = ctx.createOscillator();
      const gain2 = ctx.createGain();
      
      osc1.connect(gain1);
      gain1.connect(ctx.destination);
      osc2.connect(gain2);
      gain2.connect(ctx.destination);
      
      const now = ctx.currentTime;
      
      osc1.type = 'sine';
      osc1.frequency.setValueAtTime(523.25, now); // C5
      osc1.frequency.exponentialRampToValueAtTime(1046.50, now + 0.12); // C6
      gain1.gain.setValueAtTime(0.12, now);
      gain1.gain.exponentialRampToValueAtTime(0.001, now + 0.25);
      
      osc2.type = 'triangle';
      osc2.frequency.setValueAtTime(659.25, now + 0.06); // E5
      osc2.frequency.exponentialRampToValueAtTime(1318.51, now + 0.20); // E6
      gain2.gain.setValueAtTime(0, now);
      gain2.gain.setValueAtTime(0.08, now + 0.06);
      gain2.gain.exponentialRampToValueAtTime(0.001, now + 0.35);
      
      osc1.start(now);
      osc1.stop(now + 0.25);
      osc2.start(now + 0.06);
      osc2.stop(now + 0.35);
    } catch (e) {
      console.error('Failed to play synthetic chime:', e);
    }
  }, []);

  const speakNativeSpeech = useCallback((text: string, persona: VoicePersona, language: VoiceLanguage, onEnd?: () => void) => {
    if (!('speechSynthesis' in window)) return;
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = language;
    
    let pitch = 1.0;
    let rate = 0.95;
    
    switch (persona) {
      case 'male':
        pitch = 0.75;
        rate = 0.80;
        break;
      case 'female':
        pitch = 0.95;
        rate = 0.90;
        break;
    }
    
    utterance.pitch = pitch;
    utterance.rate = rate;
    
    const voices = window.speechSynthesis.getVoices();
    if (voices.length > 0) {
      let matchedVoice = null;
      const languagePrefix = language.slice(0, 2).toLowerCase();
      const hasLanguage = (voice: SpeechSynthesisVoice) => voice.lang.toLowerCase().replace('_', '-').startsWith(languagePrefix);
      if (persona === 'male') {
        matchedVoice = voices.find(v => hasLanguage(v) && v.name.toLowerCase().match(/male|daniel|alex|david|fred|jorge/)) ||
                       voices.find(v => hasLanguage(v));
      } else {
        matchedVoice = voices.find(v => hasLanguage(v) && v.name.toLowerCase().match(/female|samantha|zira|victoria/)) ||
                       voices.find(v => hasLanguage(v));
      }
      if (matchedVoice) {
        utterance.voice = matchedVoice;
      }
    }
    if (onEnd) {
      utterance.onend = onEnd;
      utterance.onerror = onEnd;
    }
    window.speechSynthesis.speak(utterance);
  }, []);

  const speakElevenLabs = useCallback(async (text: string, voiceId: string, apiKey: string, requestId: number) => {
    try {
      if ('speechSynthesis' in window) {
        window.speechSynthesis.cancel();
      }
      if (elevenLabsAudioRef.current) {
        elevenLabsAudioRef.current.pause();
        elevenLabsAudioRef.current.src = '';
      }
      const response = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`, {
        method: 'POST',
        headers: {
          'Accept': 'audio/mpeg',
          'Content-Type': 'application/json',
          'xi-api-key': apiKey,
        },
        body: JSON.stringify({
          text: text,
          model_id: 'eleven_monolingual_v1',
          voice_settings: {
            stability: 0.5,
            similarity_boost: 0.75,
          },
        }),
      });
      if (!response.ok) {
        const errorDetail = await response.text();
        throw new Error(`HTTP ${response.status} - ${errorDetail}`);
      }
      const blob = await response.blob();
      const audioUrl = URL.createObjectURL(blob);
      const audio = new Audio(audioUrl);
      elevenLabsAudioRef.current = audio;
      if (requestId !== speechRequestRef.current) {
        URL.revokeObjectURL(audioUrl);
        return;
      }
      audio.onended = () => {
        URL.revokeObjectURL(audioUrl);
        setIsAssistantSpeaking(false);
      };
      await audio.play();
    } catch (err) {
      if (requestId !== speechRequestRef.current) return;
      console.error('ElevenLabs synthesis failed, falling back to native browser voice:', err);
      speakNativeSpeech(text, voiceConfig.persona, voiceConfig.language, () => setIsAssistantSpeaking(false));
    }
  }, [voiceConfig.persona, voiceConfig.language, speakNativeSpeech]);

  const stopAssistantMessage = useCallback(() => {
    speechRequestRef.current += 1;
    if (speechTimeoutRef.current) {
      clearTimeout(speechTimeoutRef.current);
      speechTimeoutRef.current = null;
    }
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }
    if (elevenLabsAudioRef.current) {
      elevenLabsAudioRef.current.pause();
      elevenLabsAudioRef.current.currentTime = 0;
      elevenLabsAudioRef.current = null;
    }
    setIsAssistantSpeaking(false);
  }, []);

  const speakAssistantMessage = useCallback((text: string) => {
    stopAssistantMessage();
    const requestId = speechRequestRef.current;
    setIsAssistantSpeaking(true);
    if (voiceConfig.playChime) {
      playChime();
    }
    const speakDelay = voiceConfig.playChime ? 350 : 0;
    speechTimeoutRef.current = setTimeout(async () => {
      speechTimeoutRef.current = null;
      const speechText = voiceConfig.language === 'hi-IN' ? await translateToHindi(text) : text;
      if (requestId !== speechRequestRef.current) return;
      if (voiceConfig.useElevenLabs && voiceConfig.elevenLabsApiKey && voiceConfig.language === 'en-IN') {
        const voiceId = voiceConfig.persona === 'female'
          ? voiceConfig.elevenLabsVoiceIds.scarlett
          : voiceConfig.elevenLabsVoiceIds.morgan;
        speakElevenLabs(speechText, voiceId, voiceConfig.elevenLabsApiKey, requestId);
      } else {
        speakNativeSpeech(speechText, voiceConfig.persona, voiceConfig.language, () => setIsAssistantSpeaking(false));
      }
    }, speakDelay);
  }, [voiceConfig, playChime, speakElevenLabs, speakNativeSpeech, stopAssistantMessage]);

  // Switch Route Function
  const loadRoute = useCallback((route: NavigationRoute) => {
    localStorage.setItem('idr-nav-last-route', JSON.stringify(route));
    setActiveRoute(route);
    setUseAlternativeRoute(false); // Reset to shortest path
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

  const selectRoute = useCallback((routeId: string) => {
    loadRoute(PRESET_ROUTES.find((r) => r.id === routeId) || VIJAYAWADA_ROUTE);
  }, [loadRoute]);

  // Toggle variant
  const toggleRouteVariant = useCallback(() => {
    setUseAlternativeRoute((prev) => {
      const nextVal = !prev;
      const waypoints = nextVal ? activeRoute.alternative.waypoints : activeRoute.waypoints;
      
      setRouteIndex(0);
      setPosition(waypoints[0]);
      setGnssTrajectory([waypoints[0]]);
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
      setCurrentManeuver(activeRoute.maneuvers[0]);
      setRemainingDistanceMeters((nextVal ? activeRoute.alternative.distanceKm : activeRoute.distanceKm) * 1000);
      setSystemMessage(`Switched to ${nextVal ? 'Bypass' : 'Shortest'} Route Corridor.`);
      
      return nextVal;
    });
  }, [activeRoute]);

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

  const disableLiveData = useCallback(() => {
    if (geolocationWatchRef.current !== null) {
      navigator.geolocation.clearWatch(geolocationWatchRef.current);
      geolocationWatchRef.current = null;
    }
    setIsLiveDataEnabled(false);
    setHasLiveGpsFix(false);
    setLiveDataError(null);
  }, []);

  const enableLiveData = useCallback(async () => {
    if (!('geolocation' in navigator)) {
      setLiveDataError('Live GPS is not available in this browser.');
      return;
    }

    if (geolocationWatchRef.current !== null) {
      return;
    }

    setLiveDataError(null);
    setHasLiveGpsFix(false);
    setIsLiveDataEnabled(true);
    setIsNavigating(false);
    setIsPaused(false);
    setSystemMessage('Waiting for live GPS location permission...');

    const motionPermission = (window.DeviceMotionEvent as typeof DeviceMotionEvent & {
      requestPermission?: () => Promise<'granted' | 'denied'>;
    }).requestPermission;
    if (motionPermission) {
      try {
        await motionPermission();
      } catch {
        setLiveDataError('GPS is active. Motion sensors were not permitted.');
      }
    }

    geolocationWatchRef.current = navigator.geolocation.watchPosition(
      (location) => {
        const nextPosition = { lat: location.coords.latitude, lng: location.coords.longitude };
        const previousPosition = lastLivePositionRef.current;
        const measuredDistance = previousPosition ? distanceBetween(previousPosition, nextPosition) : 0;
        const measuredHeading = location.coords.heading ?? (previousPosition ? getHeading(previousPosition, nextPosition) : heading);
        const measuredSpeed = location.coords.speed === null ? speed : Math.max(0, location.coords.speed * 3.6);

        setHasLiveGpsFix(true);
        setPosition(nextPosition);
        setHeading(Math.round(measuredHeading));
        setHeadingLabel(getHeadingLabel(measuredHeading));
        setSpeed(Math.round(measuredSpeed));
        setPositionConfidence(Math.max(0, Math.min(100, 100 - (location.coords.accuracy / 2))));
        setGnssStatus('healthy');
        setNavigationMode('GNSS + INS Fusion');
        setSystemMessage(`Live GPS active. Accuracy ±${Math.round(location.coords.accuracy)} m.`);
        setGnssTrajectory((trajectory) => [...trajectory.slice(-120), nextPosition]);
        setRemainingDistanceMeters((remaining) => Math.max(0, remaining - Math.round(measuredDistance)));
        lastLivePositionRef.current = nextPosition;
      },
      (error) => {
        if (!navigator.onLine) {
          setLiveDataError('Internet disconnected. Continuing with the current GPS/navigation data.');
          return;
        }
        const message = error.code === error.PERMISSION_DENIED
          ? 'Location permission was denied. Allow location access in browser settings.'
          : error.code === error.POSITION_UNAVAILABLE
            ? 'GPS position is unavailable. Use a phone outdoors or enable location services.'
            : 'GPS request timed out. Move to an open area and try again.';
        setLiveDataError(message);
        setSystemMessage(message);
        setIsLiveDataEnabled(false);
        setHasLiveGpsFix(false);
        if (geolocationWatchRef.current !== null) {
          navigator.geolocation.clearWatch(geolocationWatchRef.current);
          geolocationWatchRef.current = null;
        }
      },
      { enableHighAccuracy: true, maximumAge: 1000, timeout: 10000 }
    );
  }, [heading, speed]);

  useEffect(() => {
    if (!isLiveDataEnabled || !('DeviceMotionEvent' in window)) return;

    const handleDeviceMotion = (event: DeviceMotionEvent) => {
      const acceleration = event.accelerationIncludingGravity;
      const rotation = event.rotationRate;
      if (acceleration) {
        setAccelerometer((previous) => [...previous.slice(-60), {
          x: acceleration.x ?? 0,
          y: acceleration.y ?? 0,
          z: acceleration.z ?? 0,
          timestamp: Date.now(),
        }]);
      }
      if (rotation) {
        setGyroscope((previous) => [...previous.slice(-60), {
          x: rotation.alpha ?? 0,
          y: rotation.beta ?? 0,
          z: rotation.gamma ?? 0,
          timestamp: Date.now(),
        }]);
      }
    };

    window.addEventListener('devicemotion', handleDeviceMotion);
    return () => window.removeEventListener('devicemotion', handleDeviceMotion);
  }, [isLiveDataEnabled]);

  useEffect(() => () => disableLiveData(), [disableLiveData]);

  // Main Vehicle Route Loop
  useEffect(() => {
    if (!isNavigating || isPaused || isLiveDataEnabled) return;

    const interval = setInterval(() => {
      setRouteIndex((prev) => {
        const waypoints = useAlternativeRoute ? activeRoute.alternative.waypoints : activeRoute.waypoints;
        const next = prev < waypoints.length - 1 ? prev + 1 : 0;
        const from = waypoints[prev];
        const to = waypoints[next];

        // Heading & Speed
        const newHeading = getHeading(from, to);
        setHeading(newHeading);
        setHeadingLabel(getHeadingLabel(newHeading));
        setPosition(to);
        
        const maxSpeed = useAlternativeRoute ? activeRoute.speedLimitKmh - 10 : activeRoute.speedLimitKmh;
        setSpeed(Math.max(25, Math.min(maxSpeed, 40 + Math.random() * 20)));

        // Calculate remaining trip distance
        let remDist = 0;
        for (let i = next; i < waypoints.length - 1; i++) {
          remDist += distanceBetween(waypoints[i], waypoints[i + 1]);
        }
        setRemainingDistanceMeters(Math.round(remDist));

        // Find applicable maneuver (ignore indices for alternative/bypass route to keep simple straight guidance)
        const nextManeuver = useAlternativeRoute 
          ? { stepIndex: 0, instruction: `Proceed via ${activeRoute.alternative.name}`, roadName: activeRoute.alternative.name, direction: 'straight' as const, distanceMeters: remDist }
          : ([...activeRoute.maneuvers].reverse().find((m) => next >= m.stepIndex) || activeRoute.maneuvers[0]);
          
        setCurrentManeuver(nextManeuver);

        // Check if inside any BlackoutZone (only on main shortest route with blackout sections)
        const matchingZone = !useAlternativeRoute 
          ? activeRoute.blackoutZones.find((z) => next >= z.startIndex && next <= z.endIndex)
          : undefined;

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
  }, [isNavigating, isPaused, isLiveDataEnabled, activeRoute, isBlackout, gnssStatus, autoBlackoutEnabled, restoreGNSS, useAlternativeRoute]);

  const startNavigation = useCallback(() => {
    setIsNavigating(true);
    setIsPaused(false);
    setSystemMessage(`Navigation started along ${activeRoute.name}.`);
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
    useAlternativeRoute,
    selectRoute,
    loadRoute,
    vehicleType,
    setVehicleType,
    isNetworkOnline,
    startNavigation,
    pauseNavigation,
    resumeNavigation,
    stopNavigation,
    simulateBlackout,
    restoreGNSS,
    resetSimulation,
    toggleAutoBlackout,
    toggleRouteVariant,
    voiceConfig,
    updateVoiceConfig,
    speakAssistantMessage,
    stopAssistantMessage,
    isAssistantSpeaking,
    isLiveDataEnabled,
    hasLiveGpsFix,
    liveDataError,
    enableLiveData,
    disableLiveData,
  };

  return <NavigationContext.Provider value={value}>{children}</NavigationContext.Provider>;
}
