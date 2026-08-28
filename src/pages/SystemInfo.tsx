import { ChevronDown } from 'lucide-react';

const WORKFLOW_STEPS = [
  'GNSS + IMU Data',
  'Phone-Vehicle Alignment',
  'AI Noise & Vibration Filtering',
  'AI Motion and Speed Estimation',
  'Intelligent Dead Reckoning',
  'Map Matching + Vehicle Kinematic Constraints',
  'GNSS + INS Fusion',
  'Continuous Navigation Output',
];

const MODULES = [
  {
    title: 'In-Vehicle Alignment',
    description:
      'Automatically determines the phone orientation relative to vehicle movement using accelerometer and gyroscope data. This allows the system to work regardless of how the smartphone is placed inside the vehicle.',
  },
  {
    title: 'AI Speed & Vibration Filter',
    description:
      'Filters non-navigation motion such as road vibrations, potholes, and hand movements. Uses a trained neural network to isolate true vehicle motion signals and estimate speed from IMU data alone.',
  },
  {
    title: 'Intelligent Dead Reckoning',
    description:
      'Estimates vehicle position during GNSS signal outages by integrating heading and speed estimates. Uses AI-ML models to reduce cumulative drift errors that affect traditional dead reckoning systems.',
  },
  {
    title: 'Map Matching',
    description:
      'Uses offline road network data to constrain the estimated trajectory to valid road segments. This significantly reduces lateral drift and prevents impossible trajectories such as crossing buildings or water bodies.',
  },
  {
    title: 'GNSS + INS Fusion',
    description:
      'Combines satellite positioning (GNSS) and inertial navigation (INS) data using an Extended Kalman Filter. When GNSS is available, it continuously calibrates the inertial system. When GNSS returns after an outage, it smoothly corrects the Dead Reckoning position without abrupt jumps.',
  },
  {
    title: 'Edge Deployment',
    description:
      'Supports lightweight on-device model execution using TensorFlow Lite or ONNX Runtime. Designed for real-time inference on smartphones with minimal battery and memory impact. Also compatible with external IMU sensor modules via Bluetooth or USB.',
  },
];

export default function SystemInfo() {
  return (
    <div className="p-4 sm:p-6 max-w-4xl mx-auto">
      <h2 className="text-lg font-bold text-govt-text mb-0.5">System Information</h2>
      <p className="text-xs text-govt-muted mb-1">IDR-NAV — AI-ML Based Intelligent Dead Reckoning & GNSS Fusion System</p>
      <p className="text-xs text-govt-muted italic mb-6">
        "The Signal May Disappear. Navigation Shouldn't."
      </p>

      {/* Architecture Flowchart */}
      <div className="bg-white border border-govt-border rounded p-5 mb-6">
        <h3 className="text-sm font-semibold text-govt-text mb-4 uppercase tracking-wider">
          System Architecture
        </h3>
        <div className="flex flex-col items-center gap-1">
          {WORKFLOW_STEPS.map((step, i) => (
            <div key={step} className="flex flex-col items-center w-full max-w-sm">
              <div
                className={`w-full text-center px-4 py-2.5 rounded border text-sm font-medium ${
                  i === 0
                    ? 'bg-navy text-white border-navy'
                    : i === WORKFLOW_STEPS.length - 1
                      ? 'bg-govt-green/10 text-govt-green border-green-300 font-bold'
                      : 'bg-govt-grey text-govt-text border-govt-border'
                }`}
              >
                {step}
              </div>
              {i < WORKFLOW_STEPS.length - 1 && (
                <ChevronDown className="w-4 h-4 text-govt-muted my-0.5" />
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Module Descriptions */}
      <div className="space-y-3">
        <h3 className="text-sm font-semibold text-govt-text uppercase tracking-wider">
          Module Details
        </h3>
        {MODULES.map((mod) => (
          <div
            key={mod.title}
            className="bg-white border border-govt-border rounded p-4"
          >
            <h4 className="text-sm font-bold text-navy mb-1.5">{mod.title}</h4>
            <p className="text-xs text-govt-muted leading-relaxed">{mod.description}</p>
          </div>
        ))}
      </div>

      {/* Footer */}
      <div className="mt-6 border-t border-govt-border pt-4 text-center text-xs text-govt-muted">
        <p className="font-semibold text-govt-text mb-1">IDR-NAV v1.0 — SIH Prototype</p>
        <p>Smart India Hackathon 2024 • AI-ML Based Intelligent Dead Reckoning</p>
        <p className="mt-1">Problem Statement: Seamless Navigation During GNSS Signal Outage</p>
      </div>
    </div>
  );
}
