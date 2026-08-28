import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
} from 'recharts';
import { useNavigation } from '../context/NavigationContext';

function SensorChart({
  title,
  data,
  colors,
}: {
  title: string;
  data: { x: number; y: number; z: number; timestamp: number }[];
  colors: [string, string, string];
}) {
  const chartData = data.map((d, i) => ({
    idx: i,
    X: parseFloat(d.x.toFixed(3)),
    Y: parseFloat(d.y.toFixed(3)),
    Z: parseFloat(d.z.toFixed(3)),
  }));

  return (
    <div className="bg-white border border-govt-border rounded p-4">
      <h3 className="text-sm font-semibold text-govt-text mb-3">{title}</h3>
      <div className="h-44 sm:h-52">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={chartData} margin={{ top: 5, right: 10, left: -15, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
            <XAxis
              dataKey="idx"
              tick={{ fontSize: 10, fill: '#9ca3af' }}
              axisLine={{ stroke: '#d1d5db' }}
              tickLine={false}
            />
            <YAxis
              tick={{ fontSize: 10, fill: '#9ca3af' }}
              axisLine={{ stroke: '#d1d5db' }}
              tickLine={false}
            />
            <Tooltip
              contentStyle={{
                fontSize: 11,
                background: '#fff',
                border: '1px solid #d1d5db',
                borderRadius: 4,
              }}
            />
            <Line type="monotone" dataKey="X" stroke={colors[0]} dot={false} strokeWidth={1.5} />
            <Line type="monotone" dataKey="Y" stroke={colors[1]} dot={false} strokeWidth={1.5} />
            <Line type="monotone" dataKey="Z" stroke={colors[2]} dot={false} strokeWidth={1.5} />
          </LineChart>
        </ResponsiveContainer>
      </div>
      <div className="flex gap-4 mt-2 text-xs text-govt-muted">
        <span className="flex items-center gap-1">
          <span className="w-3 h-0.5 rounded" style={{ background: colors[0] }} /> X-Axis
        </span>
        <span className="flex items-center gap-1">
          <span className="w-3 h-0.5 rounded" style={{ background: colors[1] }} /> Y-Axis
        </span>
        <span className="flex items-center gap-1">
          <span className="w-3 h-0.5 rounded" style={{ background: colors[2] }} /> Z-Axis
        </span>
      </div>
    </div>
  );
}

export default function SensorMonitoring() {
  const { accelerometer, gyroscope, motionState, motionConfidence } = useNavigation();

  const motionColor =
    motionState === 'Moving'
      ? 'text-govt-green'
      : motionState === 'Accelerating'
        ? 'text-blue-600'
        : motionState === 'Braking'
          ? 'text-govt-red'
          : motionState === 'Turning'
            ? 'text-govt-amber'
            : motionState === 'Stationary'
              ? 'text-govt-muted'
              : 'text-govt-red';

  return (
    <div className="p-4 sm:p-6 max-w-5xl mx-auto">
      <h2 className="text-lg font-bold text-govt-text mb-1">Sensor Monitoring</h2>
      <p className="text-xs text-govt-muted mb-5">Real-time IMU sensor data and AI motion classification</p>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-5">
        <SensorChart
          title="Accelerometer (m/s²)"
          data={accelerometer}
          colors={['#2563eb', '#16a34a', '#dc2626']}
        />
        <SensorChart
          title="Gyroscope (rad/s)"
          data={gyroscope}
          colors={['#7c3aed', '#ea580c', '#0891b2']}
        />
      </div>

      {/* AI Motion Classification */}
      <div className="bg-white border border-govt-border rounded p-4">
        <h3 className="text-sm font-semibold text-govt-text mb-3">AI Motion Classification</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Motion State */}
          <div className="border border-govt-border rounded p-3">
            <div className="text-[10px] text-govt-muted uppercase tracking-wider mb-1">
              Current Motion State
            </div>
            <div className={`text-base font-bold ${motionColor}`}>
              {motionState.toUpperCase()}
            </div>
          </div>

          {/* Confidence */}
          <div className="border border-govt-border rounded p-3">
            <div className="text-[10px] text-govt-muted uppercase tracking-wider mb-1">
              Classification Confidence
            </div>
            <div className="text-base font-bold text-govt-text font-mono">
              {motionConfidence.toFixed(0)}%
            </div>
            <div className="mt-1.5 bg-gray-200 rounded-full h-1.5">
              <div
                className="bg-govt-green rounded-full h-1.5 transition-all duration-300"
                style={{ width: `${motionConfidence}%` }}
              />
            </div>
          </div>

          {/* Vibration Filter */}
          <div className="border border-govt-border rounded p-3">
            <div className="text-[10px] text-govt-muted uppercase tracking-wider mb-1">
              AI Vibration Filter
            </div>
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-govt-green" />
              <span className="text-sm font-semibold text-govt-green">ACTIVE</span>
            </div>
          </div>

          {/* Alignment */}
          <div className="border border-govt-border rounded p-3">
            <div className="text-[10px] text-govt-muted uppercase tracking-wider mb-1">
              Phone-Vehicle Alignment
            </div>
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-govt-green" />
              <span className="text-sm font-semibold text-govt-green">CALIBRATED</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
