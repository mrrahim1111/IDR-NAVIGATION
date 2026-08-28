import { useNavigation } from '../context/NavigationContext';
import type { ModuleStatus } from '../types';

function StatusDot({ status }: { status: ModuleStatus['status'] }) {
  const color =
    status === 'Active'
      ? 'bg-govt-green'
      : status === 'Warning'
        ? 'bg-govt-amber'
        : 'bg-govt-red';
  return <span className={`w-2.5 h-2.5 rounded-full ${color} inline-block`} />;
}

export default function SystemStatus() {
  const { gnssStatus, navigationMode, isBlackout } = useNavigation();

  const modules: ModuleStatus[] = [
    { name: 'GNSS Receiver', status: gnssStatus === 'unavailable' ? 'Unavailable' : gnssStatus === 'weak' ? 'Warning' : 'Active' },
    { name: 'IMU Sensors', status: 'Active' },
    { name: 'AI Motion Model', status: 'Active' },
    { name: 'Speed Estimation', status: 'Active' },
    { name: 'Map Matching', status: 'Active' },
    { name: 'GNSS + INS Fusion', status: gnssStatus === 'unavailable' ? 'Unavailable' : 'Active' },
    { name: 'Intelligent Dead Reckoning', status: isBlackout ? 'Active' : 'Warning' },
    { name: 'AI Vibration Filter', status: 'Active' },
    { name: 'Phone-Vehicle Alignment', status: 'Active' },
  ];

  const modeColor =
    gnssStatus === 'healthy'
      ? 'border-green-300 bg-green-50 text-govt-green'
      : gnssStatus === 'unavailable'
        ? 'border-red-300 bg-red-50 text-govt-red'
        : 'border-amber-300 bg-amber-50 text-govt-amber';

  return (
    <div className="p-4 sm:p-6 max-w-3xl mx-auto">
      <h2 className="text-lg font-bold text-govt-text mb-1">System Status</h2>
      <p className="text-xs text-govt-muted mb-5">Real-time module health monitoring</p>

      {/* Module table */}
      <div className="bg-white border border-govt-border rounded overflow-hidden mb-6">
        <div className="grid grid-cols-[1fr_auto_auto] gap-x-4 px-4 py-2 bg-govt-grey border-b border-govt-border text-xs font-semibold text-govt-muted uppercase tracking-wider">
          <span>Module</span>
          <span>Status</span>
          <span className="w-16 text-center">Indicator</span>
        </div>
        {modules.map((mod, i) => (
          <div
            key={mod.name}
            className={`grid grid-cols-[1fr_auto_auto] gap-x-4 items-center px-4 py-3 text-sm ${
              i % 2 === 0 ? 'bg-white' : 'bg-govt-grey/50'
            } ${i < modules.length - 1 ? 'border-b border-govt-border' : ''}`}
          >
            <span className="font-medium text-govt-text">{mod.name}</span>
            <span className={`text-xs font-semibold ${
              mod.status === 'Active' ? 'text-govt-green' : mod.status === 'Warning' ? 'text-govt-amber' : 'text-govt-red'
            }`}>
              {mod.status}
            </span>
            <span className="w-16 flex justify-center">
              <StatusDot status={mod.status} />
            </span>
          </div>
        ))}
      </div>

      {/* Navigation Mode Banner */}
      <div className={`border-2 rounded px-5 py-4 text-center ${modeColor}`}>
        <div className="text-xs uppercase tracking-wider font-semibold mb-1 opacity-70">
          Current Navigation Mode
        </div>
        <div className="text-lg font-bold tracking-wide">{navigationMode.toUpperCase()}</div>
      </div>

      {/* System uptime */}
      <div className="mt-6 bg-white border border-govt-border rounded px-4 py-3">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-center">
          <div>
            <div className="text-xs text-govt-muted">Update Rate</div>
            <div className="text-sm font-bold text-govt-text font-mono">10 Hz</div>
          </div>
          <div>
            <div className="text-xs text-govt-muted">Sensor Freq</div>
            <div className="text-sm font-bold text-govt-text font-mono">100 Hz</div>
          </div>
          <div>
            <div className="text-xs text-govt-muted">Fusion Latency</div>
            <div className="text-sm font-bold text-govt-text font-mono">12 ms</div>
          </div>
          <div>
            <div className="text-xs text-govt-muted">AI Inference</div>
            <div className="text-sm font-bold text-govt-text font-mono">8 ms</div>
          </div>
        </div>
      </div>
    </div>
  );
}
