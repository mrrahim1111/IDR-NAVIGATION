import { useState, useEffect, useRef } from 'react';
import { Satellite, AlertTriangle, CheckCircle2, Radio } from 'lucide-react';
import { useNavigation } from '../context/NavigationContext';

interface LogEntry {
  time: string;
  message: string;
  type: 'info' | 'warning' | 'error' | 'success';
}

export default function BlackoutSimulation() {
  const {
    gnssStatus,
    navigationMode,
    positionConfidence,
    drift,
    driftPercentage,
    blackoutDistance,
    isBlackout,
    position,
    speed,
    simulateBlackout,
    restoreGNSS,
  } = useNavigation();

  const [logs, setLogs] = useState<LogEntry[]>([
    { time: new Date().toLocaleTimeString(), message: 'System initialized. Ready for simulation.', type: 'info' },
  ]);
  const logEndRef = useRef<HTMLDivElement>(null);
  const prevGnssRef = useRef(gnssStatus);

  const addLog = (message: string, type: LogEntry['type']) => {
    setLogs((prev) => [...prev.slice(-30), { time: new Date().toLocaleTimeString(), message, type }]);
  };

  useEffect(() => {
    if (prevGnssRef.current !== gnssStatus) {
      if (gnssStatus === 'unavailable') {
        addLog('GNSS signal lost. Switching to Intelligent Dead Reckoning.', 'error');
        addLog('AI motion model activated. Map matching engaged.', 'warning');
      } else if (gnssStatus === 'restored') {
        addLog('GNSS signal restored. Fusion correction in progress...', 'success');
      } else if (gnssStatus === 'healthy' && prevGnssRef.current === 'restored') {
        addLog('Navigation stabilized. GNSS + INS Fusion active.', 'success');
      }
      prevGnssRef.current = gnssStatus;
    }
  }, [gnssStatus]);

  useEffect(() => {
    logEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [logs]);

  const handleSimulate = () => {
    addLog('User initiated GNSS blackout simulation.', 'warning');
    simulateBlackout();
  };

  const handleRestore = () => {
    addLog('User initiated GNSS signal restoration.', 'info');
    restoreGNSS();
  };

  const statusIcon =
    gnssStatus === 'healthy' ? (
      <Satellite className="w-6 h-6 text-govt-green" />
    ) : gnssStatus === 'unavailable' ? (
      <AlertTriangle className="w-6 h-6 text-govt-red" />
    ) : gnssStatus === 'restored' ? (
      <CheckCircle2 className="w-6 h-6 text-govt-green" />
    ) : (
      <Radio className="w-6 h-6 text-govt-amber" />
    );

  const statusLabel =
    gnssStatus === 'healthy'
      ? 'AVAILABLE'
      : gnssStatus === 'unavailable'
        ? 'SIGNAL LOST'
        : gnssStatus === 'restored'
          ? 'RESTORED'
          : 'DEGRADED';

  const statusColor =
    gnssStatus === 'healthy'
      ? 'border-green-300 bg-green-50'
      : gnssStatus === 'unavailable'
        ? 'border-red-300 bg-red-50'
        : gnssStatus === 'restored'
          ? 'border-green-300 bg-green-50'
          : 'border-amber-300 bg-amber-50';

  const dotColor =
    gnssStatus === 'healthy'
      ? 'bg-govt-green pulse-green'
      : gnssStatus === 'unavailable'
        ? 'bg-govt-red pulse-red'
        : gnssStatus === 'restored'
          ? 'bg-govt-green pulse-green'
          : 'bg-govt-amber';

  return (
    <div className="p-4 sm:p-6 max-w-4xl mx-auto">
      <h2 className="text-lg font-bold text-govt-text mb-1">GNSS Blackout Simulation</h2>
      <p className="text-xs text-govt-muted mb-5">
        Simulate GNSS signal loss to demonstrate Intelligent Dead Reckoning capabilities
      </p>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Left: Controls */}
        <div className="space-y-4">
          {/* GNSS Signal Status */}
          <div className={`border-2 rounded p-5 text-center ${statusColor}`}>
            <div className="text-xs uppercase tracking-wider text-govt-muted mb-2 font-semibold">
              GNSS Signal Status
            </div>
            <div className="flex items-center justify-center gap-3 mb-3">
              {statusIcon}
              <span className={`w-3 h-3 rounded-full ${dotColor}`} />
            </div>
            <div className={`text-xl font-bold tracking-wider ${
              gnssStatus === 'unavailable' ? 'text-govt-red' : 'text-govt-green'
            }`}>
              {statusLabel}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col gap-3">
            <button
              onClick={handleSimulate}
              disabled={isBlackout}
              className={`w-full py-3 rounded font-semibold text-sm border-2 transition-colors ${
                isBlackout
                  ? 'bg-gray-100 border-gray-300 text-gray-400 cursor-not-allowed'
                  : 'bg-white border-govt-red text-govt-red hover:bg-red-50 active:bg-red-100'
              }`}
            >
              ⚠ SIMULATE GNSS BLACKOUT
            </button>
            <button
              onClick={handleRestore}
              disabled={!isBlackout}
              className={`w-full py-3 rounded font-semibold text-sm border-2 transition-colors ${
                !isBlackout
                  ? 'bg-gray-100 border-gray-300 text-gray-400 cursor-not-allowed'
                  : 'bg-white border-govt-green text-govt-green hover:bg-green-50 active:bg-green-100'
              }`}
            >
              ✓ RESTORE GNSS SIGNAL
            </button>
          </div>

          {/* Current Mode */}
          <div className="bg-white border border-govt-border rounded p-4">
            <div className="text-[10px] text-govt-muted uppercase tracking-wider mb-1 font-semibold">
              Navigation Mode
            </div>
            <div className={`text-sm font-bold ${
              navigationMode === 'Intelligent Dead Reckoning' ? 'text-govt-red' : 'text-govt-green'
            }`}>
              {navigationMode.toUpperCase()}
            </div>
          </div>
        </div>

        {/* Right: Metrics & Log */}
        <div className="space-y-4">
          {/* Metrics Grid */}
          <div className="bg-white border border-govt-border rounded p-4">
            <h3 className="text-xs font-semibold text-govt-text uppercase tracking-wider mb-3">
              Live Metrics
            </h3>
            <div className="grid grid-cols-2 gap-3">
              <div className="border border-govt-border rounded p-2.5">
                <div className="text-[10px] text-govt-muted uppercase">Position Confidence</div>
                <div className="text-lg font-bold font-mono text-govt-text">
                  {positionConfidence.toFixed(0)}%
                </div>
              </div>
              <div className="border border-govt-border rounded p-2.5">
                <div className="text-[10px] text-govt-muted uppercase">Current Drift</div>
                <div className="text-lg font-bold font-mono text-govt-text">
                  {drift.toFixed(1)} m
                </div>
              </div>
              <div className="border border-govt-border rounded p-2.5">
                <div className="text-[10px] text-govt-muted uppercase">Blackout Distance</div>
                <div className="text-lg font-bold font-mono text-govt-text">
                  {blackoutDistance.toFixed(0)} m
                </div>
              </div>
              <div className="border border-govt-border rounded p-2.5">
                <div className="text-[10px] text-govt-muted uppercase">Drift %</div>
                <div className="text-lg font-bold font-mono text-govt-text">
                  {blackoutDistance > 0
                    ? ((drift / blackoutDistance) * 100).toFixed(2)
                    : '0.00'}
                  %
                </div>
              </div>
              <div className="border border-govt-border rounded p-2.5">
                <div className="text-[10px] text-govt-muted uppercase">Current Speed</div>
                <div className="text-lg font-bold font-mono text-govt-text">
                  {Math.round(speed)} km/h
                </div>
              </div>
              <div className="border border-govt-border rounded p-2.5">
                <div className="text-[10px] text-govt-muted uppercase">Position</div>
                <div className="text-xs font-bold font-mono text-govt-text">
                  {position.lat.toFixed(4)}°N
                  <br />
                  {position.lng.toFixed(4)}°E
                </div>
              </div>
            </div>
          </div>

          {/* Event Log */}
          <div className="bg-white border border-govt-border rounded p-4">
            <h3 className="text-xs font-semibold text-govt-text uppercase tracking-wider mb-2">
              Event Log
            </h3>
            <div className="h-36 overflow-y-auto bg-govt-grey rounded p-2 text-xs font-mono space-y-1">
              {logs.map((log, i) => (
                <div
                  key={i}
                  className={`flex gap-2 ${
                    log.type === 'error'
                      ? 'text-govt-red'
                      : log.type === 'warning'
                        ? 'text-govt-amber'
                        : log.type === 'success'
                          ? 'text-govt-green'
                          : 'text-govt-muted'
                  }`}
                >
                  <span className="text-gray-400 shrink-0">[{log.time}]</span>
                  <span>{log.message}</span>
                </div>
              ))}
              <div ref={logEndRef} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
