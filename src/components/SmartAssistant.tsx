import React from 'react';
import {
  Sparkles,
  Volume2,
  VolumeX,
  Mic,
  MicOff,
  AlertTriangle,
  Clock,
  Compass,
  ArrowRight,
  TrendingDown,
  Info,
  Settings,
  Eye,
  EyeOff,
  Play,
} from 'lucide-react';
import { useNavigation } from '../context/NavigationContext';

type VoiceRecognition = {
  lang: string;
  continuous: boolean;
  interimResults: boolean;
  start: () => void;
  onstart: (() => void) | null;
  onend: (() => void) | null;
  onerror: ((event: { error: string }) => void) | null;
  onresult: ((event: { results: { 0: { 0: { transcript: string } } } }) => void) | null;
};

type VoiceRecognitionConstructor = new () => VoiceRecognition;

export default function SmartAssistant() {
  const {
    activeRoute,
    useAlternativeRoute,
    toggleRouteVariant,
    currentManeuver,
    remainingDistanceMeters,
    isBlackout,
    activeBlackoutZone,
    gnssStatus,
    isNavigating,
    isPaused,
    isLiveDataEnabled,
    hasLiveGpsFix,
    vehicleType,
    speakAssistantMessage,
    stopAssistantMessage,
    isAssistantSpeaking,
    voiceConfig,
    updateVoiceConfig,
    startNavigation,
    pauseNavigation,
    resumeNavigation,
    setVehicleType,
  } = useNavigation();

  const traffic = activeRoute.traffic;
  const alt = activeRoute.alternative;
  const isLiveRoute = activeRoute.tags.includes('Live road route');
  const hasConfiguredBypass = !isLiveRoute && alt.name !== 'Live route alternative';

  // Assistant advice generation
  const getAdviceText = () => {
    if (!isNavigating || isPaused) {
      return `AI Navigation Assistant: Navigation is paused. Press resume when you are ready to continue.`;
    }

    if (isLiveDataEnabled && !hasLiveGpsFix) {
      return `AI Navigation Assistant: I am waiting for a live GPS fix. Keep location permission enabled while I prepare your ${vehicleType} route.`;
    }

    if (isBlackout) {
      return `AI Navigation Assistant: GNSS is unavailable inside ${activeBlackoutZone?.name || 'the blackout zone'}. Intelligent dead reckoning is active. Continue ${Math.round(remainingDistanceMeters)} meters to the next maneuver.`;
    }

    if (currentManeuver?.direction === 'destination') {
      return `AI Navigation Assistant: You are approaching your destination. ${currentManeuver.instruction}`;
    }

    if (hasConfiguredBypass && !useAlternativeRoute && traffic.severity === 'high') {
      return `AI Navigation Assistant: Heavy traffic is reported near ${traffic.locationName}. Consider ${alt.name}, which is ${Math.round((alt.distanceKm - activeRoute.distanceKm) * 1000)} meters different and avoids the configured blackout zone.`;
    }

    const maneuverDistance = currentManeuver?.distanceMeters || remainingDistanceMeters;
    return `AI Navigation Assistant: Continue on ${currentManeuver?.roadName || activeRoute.name}. ${currentManeuver?.instruction || 'Follow the highlighted route'} in approximately ${Math.round(maneuverDistance)} meters. You have ${Math.max(0, Math.round(remainingDistanceMeters))} meters remaining.`;
  };

  const handleSpeak = () => {
    if (isAssistantSpeaking) {
      stopAssistantMessage();
    } else {
      speakAssistantMessage(getAdviceText());
    }
  };

  const trafficColor = isLiveRoute
    ? 'bg-green-100 text-govt-green border-green-200'
    : traffic.severity === 'high'
      ? 'bg-red-100 text-govt-red border-red-200'
      : traffic.severity === 'moderate'
        ? 'bg-amber-100 text-govt-amber border-amber-200'
        : 'bg-green-100 text-govt-green border-green-200';

  const [isSettingsOpen, setIsSettingsOpen] = React.useState(false);
  const [showApiKey, setShowApiKey] = React.useState(false);
  const [isListening, setIsListening] = React.useState(false);
  const [voiceCommandStatus, setVoiceCommandStatus] = React.useState('');
  const [isVoiceAssistantEnabled, setIsVoiceAssistantEnabled] = React.useState(false);
  const [commandInput, setCommandInput] = React.useState('');

  const respondToVoiceCommand = (message: string) => {
    setVoiceCommandStatus(message);
    speakAssistantMessage(message);
  };

  const executeCommand = (command: string) => {
    const normalizedCommand = command.trim().toLowerCase();
    if (normalizedCommand.includes('start') || normalizedCommand.includes('begin') || normalizedCommand.includes('शुरू')) {
      startNavigation();
      respondToVoiceCommand('Navigation started. I will guide you along the route.');
    } else if (normalizedCommand.includes('pause') || normalizedCommand.includes('stop') || normalizedCommand.includes('रोक')) {
      pauseNavigation();
      respondToVoiceCommand('Navigation paused.');
    } else if (normalizedCommand.includes('resume') || normalizedCommand.includes('continue') || normalizedCommand.includes('जारी')) {
      resumeNavigation();
      respondToVoiceCommand('Navigation resumed.');
    } else if (normalizedCommand.includes('hindi') || normalizedCommand.includes('हिंदी')) {
      updateVoiceConfig({ language: 'hi-IN' });
      respondToVoiceCommand('Hindi voice selected.');
    } else if (normalizedCommand.includes('english') || normalizedCommand.includes('अंग्रेजी')) {
      updateVoiceConfig({ language: 'en-IN' });
      respondToVoiceCommand('English voice selected.');
    } else if (normalizedCommand.includes('bike') || normalizedCommand.includes('motorcycle')) {
      setVehicleType('motorcycle');
      respondToVoiceCommand('Motorcycle selected.');
    } else if (normalizedCommand.includes('bus')) {
      setVehicleType('bus');
      respondToVoiceCommand('Bus selected.');
    } else if (normalizedCommand.includes('truck')) {
      setVehicleType('truck');
      respondToVoiceCommand('Truck selected.');
    } else if (normalizedCommand.includes('car')) {
      setVehicleType('car');
      respondToVoiceCommand('Car selected.');
    } else if (normalizedCommand.includes('read') || normalizedCommand.includes('status') || normalizedCommand.includes('बताओ')) {
      speakAssistantMessage(getAdviceText());
      setVoiceCommandStatus('Reading current navigation status.');
    } else {
      respondToVoiceCommand('I did not understand that. Try start navigation or read status.');
    }
  };

  const handleVoiceCommand = () => {
    if (!window.isSecureContext && window.location.hostname !== 'localhost') {
      setIsVoiceAssistantEnabled(false);
      setVoiceCommandStatus('Microphone requires HTTPS on the deployed site. Open the secure https:// address.');
      return;
    }

    const speechWindow = window as typeof window & {
      SpeechRecognition?: VoiceRecognitionConstructor;
      webkitSpeechRecognition?: VoiceRecognitionConstructor;
    };
    const SpeechRecognition = speechWindow.SpeechRecognition || speechWindow.webkitSpeechRecognition;

    if (!SpeechRecognition) {
      setIsVoiceAssistantEnabled(false);
      setVoiceCommandStatus('Voice commands are not supported in this browser.');
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.lang = voiceConfig.language;
    recognition.continuous = false;
    recognition.interimResults = false;
    recognition.onstart = () => {
      setIsListening(true);
      setVoiceCommandStatus('Listening...');
    };
    recognition.onend = () => setIsListening(false);
    recognition.onerror = (event) => {
      setIsListening(false);
      setIsVoiceAssistantEnabled(false);
      setVoiceCommandStatus(event.error === 'network'
        ? 'Voice recognition needs an internet connection. Type a command below or try the mic again.'
        : `Voice command failed: ${event.error}`);
    };
    recognition.onresult = (event) => {
      const command = event.results[0][0].transcript.trim().toLowerCase();
      setVoiceCommandStatus(`Heard: “${command}”`);
      executeCommand(command);
    };
    try {
      recognition.start();
    } catch (error) {
      setIsListening(false);
      setIsVoiceAssistantEnabled(false);
      setVoiceCommandStatus('Microphone could not start. Check browser microphone permission and try again.');
    }
  };

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
          title={isAssistantSpeaking ? 'Stop speaking' : 'Listen to Advice'}
          aria-label={isAssistantSpeaking ? 'Stop speaking' : 'Listen to Advice'}
        >
          {isAssistantSpeaking ? <VolumeX className="w-3.5 h-3.5" /> : <Volume2 className="w-3.5 h-3.5" />}
        </button>
        <button
          onClick={() => {
            setIsVoiceAssistantEnabled((enabled) => !enabled);
            handleVoiceCommand();
          }}
          className={`ml-1 p-1 rounded transition-colors ${isListening || isVoiceAssistantEnabled ? 'bg-govt-red text-white animate-pulse' : 'bg-white/10 hover:bg-white/20'}`}
          title={isListening ? 'Listening for a command' : 'Talk to AI Co-Driver'}
          aria-label={isListening ? 'Listening for a command' : 'Talk to AI Co-Driver'}
        >
          {isListening ? <MicOff className="w-3.5 h-3.5" /> : <Mic className="w-3.5 h-3.5" />}
        </button>
      </div>

      {voiceCommandStatus && (
        <div className="border-b border-govt-border bg-blue-50 px-3.5 py-1.5 text-[10px] font-semibold text-blue-800">
          <span className="mr-1">{isVoiceAssistantEnabled ? 'AI listening:' : 'AI:'}</span>{voiceCommandStatus}
        </div>
      )}

      <form
        className="flex gap-1.5 border-b border-govt-border bg-slate-50 px-3.5 py-1.5"
        onSubmit={(event) => {
          event.preventDefault();
          if (commandInput.trim()) {
            executeCommand(commandInput);
            setCommandInput('');
          }
        }}
      >
        <input
          value={commandInput}
          onChange={(event) => setCommandInput(event.target.value)}
          placeholder="Type a command if mic is unavailable"
          aria-label="Assistant command"
          className="min-w-0 flex-1 rounded border border-govt-border bg-white px-2 py-1 text-[10px] text-govt-text outline-none focus:border-navy"
        />
        <button type="submit" className="rounded bg-navy px-2 py-1 text-[10px] font-bold text-white">Send</button>
      </form>

      {/* Voice Selection Row */}
      <div className="bg-slate-50 border-b border-govt-border px-3.5 py-2 flex flex-wrap items-center justify-between gap-2 text-xs">
        <div className="flex items-center gap-1.5 font-semibold text-govt-text">
          <span>Voice:</span>
          <select
            value={voiceConfig.persona}
            onChange={(e) => updateVoiceConfig({ persona: e.target.value as 'male' | 'female' })}
            className="bg-white border border-govt-border rounded px-2 py-1 text-xs focus:ring-1 focus:ring-navy focus:border-navy cursor-pointer font-medium"
          >
            <option value="male">Male</option>
            <option value="female">Female</option>
          </select>
        </div>
        <div className="flex items-center gap-1.5 font-semibold text-govt-text">
          <span>Language:</span>
          <select
            value={voiceConfig.language}
            onChange={(e) => {
              stopAssistantMessage();
              updateVoiceConfig({ language: e.target.value as 'en-IN' | 'hi-IN' });
            }}
            className="bg-white border border-govt-border rounded px-2 py-1 text-xs focus:ring-1 focus:ring-navy focus:border-navy cursor-pointer font-medium"
          >
            <option value="en-IN">English</option>
            <option value="hi-IN">Hindi</option>
          </select>
        </div>
        
        <div className="flex items-center gap-1">
          <button
            onClick={() => speakAssistantMessage('Hello, this is your AI Navigation Co-Driver. I will guide you along your route.')}
            className="p-1 text-navy hover:bg-navy/10 rounded transition-colors"
            title="Test current voice"
          >
            <Play className="w-3.5 h-3.5 fill-current" />
          </button>
          
          <button
            onClick={() => setIsSettingsOpen(!isSettingsOpen)}
            className={`p-1 rounded transition-colors ${isSettingsOpen ? 'bg-navy/10 text-navy' : 'text-govt-muted hover:bg-slate-200'}`}
            title="Advanced voice settings"
          >
            <Settings className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Advanced Voice Settings Panel */}
      {isSettingsOpen && (
        <div className="bg-slate-100 border-b border-govt-border p-3.5 space-y-3 text-xs">
          <div className="flex items-center justify-between border-b border-slate-200 pb-1.5 font-bold text-navy">
            <span>Voice Assistant Settings</span>
            {voiceConfig.useElevenLabs && (
              <span className="flex items-center gap-1 text-[10px] text-green-600 font-medium">
                <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse"></span>
                ElevenLabs Active
              </span>
            )}
          </div>
          
          {/* Play Chime Toggle */}
          <div className="flex items-center justify-between">
            <label className="font-semibold text-govt-text flex flex-col cursor-pointer" htmlFor="playChime">
              <span>Play wake chime sound</span>
              <span className="text-[9px] text-govt-muted font-normal">Double chime before speech</span>
            </label>
            <input
              id="playChime"
              type="checkbox"
              checked={voiceConfig.playChime}
              onChange={(e) => updateVoiceConfig({ playChime: e.target.checked })}
              className="rounded text-navy focus:ring-navy border-govt-border w-4 h-4 cursor-pointer"
            />
          </div>
          
          {/* ElevenLabs API Toggle */}
          <div className="space-y-1 border-t border-slate-200 pt-2">
            <div className="flex items-center justify-between">
              <label className="font-bold text-govt-text cursor-pointer" htmlFor="useElevenLabs">
                Use ElevenLabs AI Cloning
              </label>
              <input
                id="useElevenLabs"
                type="checkbox"
                checked={voiceConfig.useElevenLabs}
                onChange={(e) => updateVoiceConfig({ useElevenLabs: e.target.checked })}
                className="rounded text-navy focus:ring-navy border-govt-border w-4 h-4 cursor-pointer"
              />
            </div>
            <p className="text-[10px] text-govt-muted">
              Use ElevenLabs API for high-fidelity actor clones.
            </p>
          </div>
          
          {voiceConfig.useElevenLabs && (
            <div className="space-y-3.5 pl-2 border-l-2 border-navy/20">
              {/* API Key Input */}
              <div className="space-y-1">
                <label className="font-semibold text-govt-text">ElevenLabs API Key</label>
                <div className="relative">
                  <input
                    type={showApiKey ? 'text' : 'password'}
                    value={voiceConfig.elevenLabsApiKey}
                    onChange={(e) => updateVoiceConfig({ elevenLabsApiKey: e.target.value })}
                    placeholder="Enter ElevenLabs API Key"
                    className="w-full bg-white border border-govt-border rounded pl-2.5 pr-8 py-1 text-xs focus:ring-1 focus:ring-navy focus:border-navy"
                  />
                  <button
                    type="button"
                    onClick={() => setShowApiKey(!showApiKey)}
                    className="absolute right-2 top-1.5 text-govt-muted hover:text-govt-text"
                  >
                    {showApiKey ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                  </button>
                </div>
              </div>
              
              {/* Voice IDs Mapping */}
              <div className="space-y-2">
                <div className="font-semibold text-govt-text border-b border-slate-200 pb-0.5">
                  Voice IDs Mapping
                </div>
                
                <div className="grid grid-cols-2 gap-2 text-[10px]">
                  <div>
                    <label className="text-govt-muted block mb-0.5">Amitabh Bachchan</label>
                    <input
                      type="text"
                      value={voiceConfig.elevenLabsVoiceIds.amitabh}
                      onChange={(e) => updateVoiceConfig({
                        elevenLabsVoiceIds: { ...voiceConfig.elevenLabsVoiceIds, amitabh: e.target.value }
                      })}
                      className="w-full bg-white border border-govt-border rounded px-1.5 py-0.5 font-mono text-[9px]"
                    />
                  </div>
                  <div>
                    <label className="text-govt-muted block mb-0.5">Morgan Freeman</label>
                    <input
                      type="text"
                      value={voiceConfig.elevenLabsVoiceIds.morgan}
                      onChange={(e) => updateVoiceConfig({
                        elevenLabsVoiceIds: { ...voiceConfig.elevenLabsVoiceIds, morgan: e.target.value }
                      })}
                      className="w-full bg-white border border-govt-border rounded px-1.5 py-0.5 font-mono text-[9px]"
                    />
                  </div>
                  <div>
                    <label className="text-govt-muted block mb-0.5">JARVIS (Tech)</label>
                    <input
                      type="text"
                      value={voiceConfig.elevenLabsVoiceIds.jarvis}
                      onChange={(e) => updateVoiceConfig({
                        elevenLabsVoiceIds: { ...voiceConfig.elevenLabsVoiceIds, jarvis: e.target.value }
                      })}
                      className="w-full bg-white border border-govt-border rounded px-1.5 py-0.5 font-mono text-[9px]"
                    />
                  </div>
                  <div>
                    <label className="text-govt-muted block mb-0.5">Scarlett (Samantha)</label>
                    <input
                      type="text"
                      value={voiceConfig.elevenLabsVoiceIds.scarlett}
                      onChange={(e) => updateVoiceConfig({
                        elevenLabsVoiceIds: { ...voiceConfig.elevenLabsVoiceIds, scarlett: e.target.value }
                      })}
                      className="w-full bg-white border border-govt-border rounded px-1.5 py-0.5 font-mono text-[9px]"
                    />
                  </div>
                </div>
                
                {/* Info Tip */}
                <div className="bg-blue-50 text-blue-800 border border-blue-100 rounded p-2 text-[10px] space-y-1 font-medium leading-relaxed">
                  <div className="font-bold flex items-center gap-1">
                    <Info className="w-3 h-3 text-blue-700 shrink-0" />
                    How to clone any actor's voice:
                  </div>
                  <ol className="list-decimal list-inside pl-0.5 space-y-0.5 text-[9px] font-normal">
                    <li>Record 1 min of clean actor audio (e.g. from YouTube).</li>
                    <li>Go to ElevenLabs Voice Library and add a new cloned voice.</li>
                    <li>Copy its Voice ID and paste it in the inputs above!</li>
                  </ol>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      <div className="p-3.5 space-y-3">
        {/* Real-time traffic congestion card */}
        <div className={`border rounded p-3 text-xs flex gap-2 ${trafficColor}`}>
          <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
          <div className="space-y-0.5">
            <span className="font-bold">{isLiveRoute ? 'LIVE ROUTE:' : 'TRAFFIC ALERT:'}</span>{' '}
            <span className="font-medium">{isLiveRoute
              ? `Following ${vehicleType} route guidance. ${currentManeuver?.instruction || 'Follow the highlighted route.'}`
              : `${traffic.locationName} is experiencing ${traffic.severity} congestion due to ${traffic.reason}`}</span>
            <div className="flex items-center gap-3 pt-1 text-[10px] opacity-90 font-mono">
              {isLiveRoute ? (
                <span>Live road geometry loaded</span>
              ) : (
                <span className="flex items-center gap-0.5">
                  <Clock className="w-3 h-3" /> Delay: +{Math.round(traffic.delaySeconds / 60)} mins
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Preset corridor choices only exist for the tunnel demo routes. */}
        <div className="border border-govt-border rounded-lg p-2.5 bg-gray-50 space-y-2">
          <div className="text-[10px] text-govt-muted uppercase font-bold tracking-wider">
            {isLiveRoute ? 'Live Route Status' : 'Select Route Corridor'}
          </div>
          {isLiveRoute ? (
            <div className="text-xs font-semibold text-govt-text">
              {currentManeuver?.roadName || 'Road route'}<span className="text-govt-muted font-normal"> · {Math.max(0, Math.round(remainingDistanceMeters))} m remaining</span>
            </div>
          ) : <div className="grid grid-cols-2 gap-2">
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
          </div>}
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
              {isAssistantSpeaking ? <VolumeX className="w-3 h-3" /> : <Volume2 className="w-3 h-3" />}
              {isAssistantSpeaking ? 'Stop Audio Announcement' : 'Listen to Audio Announcement'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
