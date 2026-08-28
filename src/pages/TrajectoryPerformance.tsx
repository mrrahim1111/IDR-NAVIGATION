import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  ResponsiveContainer,
  Legend,
  Tooltip,
} from 'recharts';

// Simulated trajectory comparison data
function generateTrajectoryData() {
  const data = [];
  for (let i = 0; i <= 50; i++) {
    const t = i / 50;
    // Ground truth: smooth curve
    const gtX = t * 100;
    const gtY = 20 * Math.sin(t * Math.PI * 0.8) + t * 30;

    // Conventional DR: increasing drift
    const convDrift = t * t * 18;
    const convX = gtX + convDrift * 0.3 + Math.random() * 2;
    const convY = gtY + convDrift * 0.7 + Math.random() * 2;

    // Intelligent DR: minimal drift
    const intDrift = t * t * 4.5;
    const intX = gtX + intDrift * 0.15 + Math.random() * 0.5;
    const intY = gtY + intDrift * 0.3 + Math.random() * 0.5;

    data.push({
      distance: (i * 2).toString(),
      gtX: parseFloat(gtX.toFixed(1)),
      gtY: parseFloat(gtY.toFixed(1)),
      convX: parseFloat(convX.toFixed(1)),
      convY: parseFloat(convY.toFixed(1)),
      intX: parseFloat(intX.toFixed(1)),
      intY: parseFloat(intY.toFixed(1)),
    });
  }
  return data;
}

const trajectoryData = generateTrajectoryData();

const metrics = [
  { metric: 'Position Error (mean)', conventional: '18.4 m', intelligent: '4.7 m' },
  { metric: 'Drift Percentage', conventional: '18.4%', intelligent: '4.7%' },
  { metric: 'Max Position Error', conventional: '32.1 m', intelligent: '8.2 m' },
  { metric: 'Navigation Continuity', conventional: 'Limited', intelligent: 'Continuous' },
  { metric: 'GNSS Recovery', conventional: 'Abrupt Jump', intelligent: 'Smooth Correction' },
  { metric: 'Map Matching', conventional: 'Not Applied', intelligent: 'Active' },
  { metric: 'Kinematic Constraints', conventional: 'Not Applied', intelligent: 'Active' },
];

export default function TrajectoryPerformance() {
  return (
    <div className="p-4 sm:p-6 max-w-5xl mx-auto">
      <h2 className="text-lg font-bold text-govt-text mb-1">Trajectory & Performance</h2>
      <p className="text-xs text-govt-muted mb-5">
        Comparison of Dead Reckoning methods during GNSS blackout
      </p>

      {/* Disclaimer */}
      <div className="bg-amber-50 border border-amber-200 rounded px-4 py-2.5 mb-5 text-xs text-govt-amber font-medium">
        ⚠ Demonstration / Sample Simulation Results — Not validated real-world data
      </div>

      {/* Trajectory Plot */}
      <div className="bg-white border border-govt-border rounded p-4 mb-5">
        <h3 className="text-sm font-semibold text-govt-text mb-3">
          Trajectory Comparison During GNSS Blackout (100m Segment)
        </h3>
        <div className="h-64 sm:h-80">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={trajectoryData} margin={{ top: 5, right: 20, left: -5, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis
                dataKey="distance"
                label={{ value: 'Distance (m)', position: 'insideBottom', offset: -2, style: { fontSize: 11, fill: '#6b7280' } }}
                tick={{ fontSize: 10, fill: '#9ca3af' }}
                axisLine={{ stroke: '#d1d5db' }}
              />
              <YAxis
                label={{ value: 'Lateral Position (m)', angle: -90, position: 'insideLeft', offset: 15, style: { fontSize: 11, fill: '#6b7280' } }}
                tick={{ fontSize: 10, fill: '#9ca3af' }}
                axisLine={{ stroke: '#d1d5db' }}
              />
              <Tooltip
                contentStyle={{
                  fontSize: 11,
                  background: '#fff',
                  border: '1px solid #d1d5db',
                  borderRadius: 4,
                }}
              />
              <Legend
                wrapperStyle={{ fontSize: 11, paddingTop: 8 }}
              />
              <Line
                type="monotone"
                dataKey="gtY"
                name="Ground Truth"
                stroke="#16a34a"
                dot={false}
                strokeWidth={2}
              />
              <Line
                type="monotone"
                dataKey="convY"
                name="Conventional DR"
                stroke="#dc2626"
                dot={false}
                strokeWidth={1.5}
                strokeDasharray="5 3"
              />
              <Line
                type="monotone"
                dataKey="intY"
                name="Intelligent DR (AI-ML)"
                stroke="#2563eb"
                dot={false}
                strokeWidth={2}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Performance Metrics Table */}
      <div className="bg-white border border-govt-border rounded overflow-hidden mb-5">
        <div className="px-4 py-3 bg-govt-grey border-b border-govt-border">
          <h3 className="text-sm font-semibold text-govt-text">Performance Metrics</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-govt-border bg-govt-grey/50">
                <th className="text-left px-4 py-2.5 text-xs font-semibold text-govt-muted uppercase">
                  Metric
                </th>
                <th className="text-center px-4 py-2.5 text-xs font-semibold text-govt-red uppercase">
                  Conventional DR
                </th>
                <th className="text-center px-4 py-2.5 text-xs font-semibold text-blue-600 uppercase">
                  Intelligent DR
                </th>
              </tr>
            </thead>
            <tbody>
              {metrics.map((row, i) => (
                <tr
                  key={row.metric}
                  className={`${i % 2 === 0 ? 'bg-white' : 'bg-govt-grey/30'} border-b border-govt-border last:border-b-0`}
                >
                  <td className="px-4 py-2.5 font-medium text-govt-text">{row.metric}</td>
                  <td className="px-4 py-2.5 text-center font-mono text-govt-muted">
                    {row.conventional}
                  </td>
                  <td className="px-4 py-2.5 text-center font-mono font-semibold text-govt-text">
                    {row.intelligent}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* SIH Benchmark */}
      <div className="bg-navy/5 border-2 border-navy/20 rounded px-5 py-4">
        <h3 className="text-sm font-bold text-navy mb-2">SIH Target Benchmark</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
          <div className="flex items-start gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-navy mt-1.5 shrink-0" />
            <div>
              <div className="font-medium text-govt-text">Dead Reckoning Drift</div>
              <div className="text-govt-muted">Less than 10% of distance travelled</div>
            </div>
          </div>
          <div className="flex items-start gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-navy mt-1.5 shrink-0" />
            <div>
              <div className="font-medium text-govt-text">Position Update Rate</div>
              <div className="text-govt-muted">10 Hz (smartphone sensors)</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
