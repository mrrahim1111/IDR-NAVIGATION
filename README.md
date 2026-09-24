# IDR-NAV

**AI-ML Based Intelligent Dead Reckoning & GNSS Fusion System**

> *The Signal May Disappear. Navigation Shouldn't.*

A functional, responsive navigation prototype for the **Smart India Hackathon (SIH)**. It combines live browser GPS, device motion sensors, road routing, GNSS blackout simulation, and intelligent dead reckoning in one dashboard.

---

## Problem Statement

Navigation systems fail in environments with poor GNSS coverage:
- Long tunnels & underpasses
- Multi-level parking areas
- Dense urban canyons
- Dense forest highways

**IDR-NAV** uses GNSS + INS sensor fusion when satellite signals are available, and continues along the cached route using dead reckoning when GNSS is lost or the network disconnects.

---

## Features

- Live GPS tracking with accuracy, coordinates, speed, heading, and route status.
- Browser accelerometer and gyroscope feeds for live sensor monitoring.
- Address search for any origin and destination using OpenStreetMap Nominatim.
- Drivable route and alternative-route calculation using OSRM.
- Vehicle modes for car, motorcycle, bus, and truck with matching map markers.
- Green, yellow, and red route cards for best, medium, and heavy-traffic routes.
- Map and satellite imagery layers.
- Cached route continuation when the network disconnects.
- GNSS blackout simulation with dead-reckoning drift and recovery visualization.
- AI Co-Driver guidance based on the current maneuver, route distance, GPS state, and blackout state.
- English and Hindi speech output with male/female voice selection.
- Microphone commands for starting, pausing, resuming, changing language, selecting a vehicle, and reading status.
- Dark and light themes with persisted user preferences.

Additional pages include System Status, Sensor Monitoring, GNSS Blackout Simulation, Trajectory & Performance, and System Information.

---

## Tech Stack

- **Frontend**: React + TypeScript + Vite
- **Styling**: Tailwind CSS
- **Map**: Leaflet, OpenStreetMap, and Esri World Imagery
- **Charts**: Recharts
- **Icons**: Lucide React
- **Routing**: OSRM
- **Geocoding**: OpenStreetMap Nominatim

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

### Live GPS and microphone requirements

- Live GPS requires browser location permission.
- Accelerometer and gyroscope data require a supported device and permission. iOS requires the permission request to be accepted after pressing **Use Live GPS**.
- Microphone voice commands require a secure deployment URL using `https://` and work best in Chrome or Edge. `localhost` is treated as secure during development.
- Address search and new route calculation require an internet connection.

---

## Demo Flow

1. Open the Dashboard and expand **Plan your trip**.
2. Select a vehicle, enter From and To locations, and choose a route.
3. Click **Start Navigation** to see the selected vehicle move along the route.
4. Click **Use Live GPS** to replace demo movement with device location.
5. Try the Map/Satellite switch and the AI Co-Driver microphone command.
6. Open **GNSS Blackout Simulation**, click **SIMULATE GNSS BLACKOUT**, then restore the signal.

The current route remains available during a network interruption; only new address searches and route calculations wait for the connection to return.

## Application Pages

### Navigation Dashboard (`/`)

The dashboard contains the Leaflet map, road and satellite layers, origin and destination markers, planned route geometry, GNSS and dead-reckoning trajectories, blackout segments, a moving vehicle marker, turn-by-turn guidance, location status, live GPS controls, network status, the trip planner, and the AI Co-Driver.

### System Status (`/status`)

Shows the health of the GNSS receiver, IMU sensors, AI motion model, speed estimator, map matching, GNSS plus INS fusion, Intelligent Dead Reckoning, vibration filter, and phone-vehicle alignment. It also shows the current navigation mode and prototype timing values.

### Sensor Monitoring (`/sensors`)

Shows accelerometer and gyroscope X/Y/Z charts, motion classification, classification confidence, AI vibration filtering, and phone-vehicle alignment. Demo mode generates sensor samples; live mode uses browser device-motion data when supported.

### GNSS Blackout Simulation (`/simulation`)

Provides controls to simulate GNSS loss and restore it. It shows signal status, navigation mode, position confidence, drift, blackout distance, drift percentage, current speed, coordinates, and a timestamped event log.

### Trajectory and Performance (`/performance`)

Shows sample ground-truth, conventional dead-reckoning, and Intelligent Dead Reckoning trajectories, plus comparison metrics for error, drift, continuity, recovery, map matching, and kinematic constraints. These are demonstration values, not validated field measurements.

### System Information (`/info`)

Documents the intended pipeline: GNSS and IMU data, phone-vehicle alignment, AI filtering, motion and speed estimation, dead reckoning, map matching, fusion, and continuous navigation output.

## Dashboard Controls

The `Plan your trip` panel is collapsed by default so the map and moving vehicle remain visible. Expand it to use:

- `From` address autocomplete.
- `To` address autocomplete.
- Car, motorcycle, bus, or truck selection.
- Live route choices.
- `Start Navigation`.
- Tunnel blackout simulation toggle.

Route cards use green for the best route, yellow for an alternate route, and red for a heavy-traffic/slower route. The live route colors are prototype classifications based on route order; they are not a live traffic measurement.

The map supports OpenStreetMap road tiles and Esri World Imagery satellite tiles. The map also displays the current location status: `Live fix`, `Waiting`, or `Demo live`, with latitude and longitude.

The turn-by-turn HUD displays the next maneuver, road name, remaining distance, estimated time, pause/resume, restart, and route status: `ON ROUTE`, `OFF ROUTE`, `WAITING FOR GPS`, or `DEMO LIVE`.

## Vehicle Modes

The selected vehicle type changes the map marker and is included in AI Co-Driver guidance:

- Car.
- Motorcycle.
- Bus.
- Truck.

Demo mode moves the selected marker through bundled route waypoints. Live mode positions it using browser GPS.

## Navigation Modes

The shared navigation context supports:

- `GNSS + INS Fusion`: normal satellite and inertial fusion.
- `Transitioning`: transition state available to the navigation model.
- `Intelligent Dead Reckoning`: active during a GNSS blackout.
- `Fusion Correction`: active while simulated GNSS recovery is applied.

The demo route loop advances approximately every 750 milliseconds. It updates position, heading, speed, maneuver, remaining distance, trajectories, blackout state, drift, confidence, and sensor samples.

## Data Sources and Internet Services

Bundled route data lives in `src/data/routes.ts` and contains origins, destinations, waypoints, maneuvers, blackout zones, traffic metadata, and alternative corridors.

Address autocomplete uses OpenStreetMap Nominatim:

```text
https://nominatim.openstreetmap.org/search
```

Road routes and alternatives use OSRM:

```text
https://router.project-osrm.org/route/v1/driving
```

The app requests turn steps and full GeoJSON route geometry, then converts the response into its internal `NavigationRoute` type.

Map tiles use OpenStreetMap and Esri World Imagery. Hindi speech translation uses the configured Google Translate endpoint and caches translations in memory for the current page session. Public services have usage limits; production deployments should use approved providers, rate limits, and a backend proxy.

## Live GPS, Sensors, and Offline Operation

Live mode uses `navigator.geolocation.watchPosition` for location, accuracy, speed, and heading. `DeviceMotionEvent` supplies accelerometer and gyroscope data when the device and browser support it. iOS requires motion permission after pressing **Use Live GPS**.

The currently loaded route is saved locally and can continue during a network interruption. Demo movement, loaded route geometry, local telemetry, GPS updates already available from the browser, route status, and blackout simulation do not require a new network request. New address search, OSRM routing, uncached map tiles, some browser speech recognition services, and uncached Hindi translation do require internet access.

## AI Co-Driver and Voice Commands

The assistant generates guidance from the current maneuver, road name, remaining distance, pause state, live GPS fix, blackout state, active blackout zone, vehicle type, and route source. It avoids tunnel-specific advice for arbitrary live routes and only shows preset bypass guidance when a configured bypass exists.

Speech output supports Male/Female voices and English/Hindi. Clicking the speaker again stops speech. Changing language stops the current message before applying the new language. Hindi text is translated dynamically with an English fallback when translation is unavailable.

The microphone supports commands such as:

```text
Start navigation
Pause navigation
Resume navigation
Use Hindi
Use English
Select car
Select bike
Select bus
Select truck
Read status
```

If browser recognition is unsupported or returns a network error, the assistant provides a typed command input that uses the same command parser. The application cannot directly invoke or control macOS Siri because browser security prevents that integration.

## Project Structure

```text
src/
	App.tsx                         Browser routes and provider setup
	index.css                       Global styles and dark-mode overrides
	main.tsx                        React entry point
	types.ts                        Shared domain types
	components/
		Layout.tsx                    Header, sidebar, mobile nav, theme toggle
		RoutePlanner.tsx              Address search, routing, vehicles, route cards
		SmartAssistant.tsx            Guidance, speech output, mic commands
		TurnByTurnHUD.tsx             Maneuver, status, pause, restart
	context/
		NavigationContext.tsx         Shared navigation, GPS, sensors, speech, cache
	data/
		routes.ts                     Bundled demo routes
	pages/
		Dashboard.tsx                 Map and navigation dashboard
		SystemStatus.tsx              Module health
		SensorMonitoring.tsx          IMU charts and motion state
		BlackoutSimulation.tsx        GNSS outage and recovery demo
		TrajectoryPerformance.tsx     Sample performance comparison
		SystemInfo.tsx                Architecture documentation
```

`NavigationContext.tsx` owns the active route, position, trajectories, speed, heading, maneuver, GNSS state, blackout state, drift, sensor buffers, navigation actions, vehicle type, voice settings, live GPS subscription, device-motion subscription, network status, and last-route persistence.

## Deployment

Vercel and Netlify work well for this Vite frontend.

Recommended settings:

```text
Install command: npm install
Build command: npm run build
Output directory: dist
```

The deployed site must use HTTPS for microphone, location, and device-motion permissions. `localhost` is treated as secure during development. Chrome and Edge provide the most consistent microphone experience.

Repository:

```text
https://github.com/mrrahim1111/IDR-NAV.git
```

## Browser Permissions

- Location: allow location access after clicking `Use Live GPS`.
- Motion: allow device-motion access where requested, especially on iOS.
- Microphone: use an HTTPS deployment and allow microphone access.

Many desktop computers do not have GPS hardware. For live GPS testing, use a phone with location services enabled or use browser development tools to simulate a location.

## Limitations

- This is a browser prototype, not certified automotive navigation software.
- OSRM supplies road routes, not verified live traffic conditions.
- Green/yellow/red live route labels are prototype classifications.
- Demo dead reckoning and sensor values are simulated.
- Performance page values are sample demonstration data.
- Public geocoding, routing, translation, and tile services have usage limits.
- The ElevenLabs API key field is prototype-only; secrets should not be exposed in frontend code in production.
- There is no backend authentication, fleet telemetry ingestion, route history service, or production map-service proxy.

## Troubleshooting

### Microphone fails after deployment

Use an `https://` URL, allow microphone permission, try Chrome or Edge, and use the typed command field if browser speech recognition reports a network error.

### GPS remains waiting

Allow location permission, enable device location services, and test outdoors or near a window on a phone. Desktop computers may only provide approximate network location or none at all.

### Address suggestions do not appear

Confirm internet access, enter at least three characters, and check whether a browser extension or network policy blocks Nominatim.

### Route calculation fails

Select one From suggestion and one To suggestion, confirm both locations are connected by roads, and check the OSRM request in the browser network panel.

### Map tiles are missing

Confirm internet access for uncached tiles, switch between Map and Satellite, and inspect blocked tile requests.

## Development Commands

```bash
npm install       # Install dependencies
npm run dev       # Start the Vite development server
npm run build     # Type-check and create dist/
npm run preview   # Preview the production build
```

Run `npm run build` before committing changes. The build may report a bundle-size warning for the main JavaScript chunk; that warning does not mean the build failed.

---

## SIH Target Benchmarks

- Dead reckoning drift target: **< 10%** of distance travelled.
- Smartphone position update target: **10 Hz**.
- Continuous navigation output through a simulated GNSS outage.

These are demonstration targets and require controlled vehicle testing before they can be treated as validated measurements.

---

## License

MIT
