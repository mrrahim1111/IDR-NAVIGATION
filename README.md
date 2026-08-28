# IDR-NAV

**AI-ML Based Intelligent Dead Reckoning & GNSS Fusion System**

> *The Signal May Disappear. Navigation Shouldn't.*

A functional, responsive prototype for the **Smart India Hackathon (SIH)** that demonstrates seamless vehicle navigation during GNSS/GPS signal loss using AI-ML based Intelligent Dead Reckoning with smartphone IMU sensors.

---

## Problem Statement

Navigation systems fail in environments with poor GNSS coverage:
- Long tunnels & underpasses
- Multi-level parking areas
- Dense urban canyons
- Dense forest highways

**IDR-NAV** uses GNSS + INS sensor fusion when satellite signals are available, and seamlessly switches to AI-ML based Intelligent Dead Reckoning using accelerometer, gyroscope, and magnetometer data when GNSS is lost.

---

## Features

| Page | Description |
|------|-------------|
| **Navigation Dashboard** | Real-time map with vehicle tracking, trajectory visualization |
| **System Status** | Module health monitoring with status indicators |
| **Sensor Monitoring** | Live IMU sensor charts + AI motion classification |
| **GNSS Blackout Simulation** | Interactive demo of GNSS loss & recovery |
| **Trajectory & Performance** | DR comparison plots + SIH benchmark metrics |
| **System Information** | Architecture flowchart & module descriptions |

---

## Tech Stack

- **Frontend**: React + TypeScript + Vite
- **Styling**: Tailwind CSS
- **Map**: Leaflet + OpenStreetMap
- **Charts**: Recharts
- **Icons**: Lucide React

---

## Getting Started

```bash
# Install dependencies
npm install

# Start dev server
npm run dev

# Build for production
npm run build
```

Open **http://localhost:5173/** in your browser.

---

## SIH Demo Flow

1. Open the **Dashboard** — observe vehicle moving with GNSS tracking
2. Go to **GNSS Blackout Simulation** page
3. Click **SIMULATE GNSS BLACKOUT**
4. Watch: GNSS Lost → Dead Reckoning activates → vehicle continues → drift metrics update
5. Click **RESTORE GNSS SIGNAL**
6. Watch: Fusion Correction → Navigation Stabilized

A judge can understand the complete system within 30 seconds.

---

## SIH Target Benchmarks

- Dead Reckoning Drift: **< 10%** of distance travelled
- Smartphone Position Update Rate: **10 Hz**

---

## License

MIT
