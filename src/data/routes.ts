import type { NavigationRoute, Position, AlternativeRoute } from '../types';

function generateInterpolatedPath(start: Position, end: Position, count: number, noise = 0.00005): Position[] {
  const points: Position[] = [];
  for (let i = 0; i <= count; i++) {
    const t = i / count;
    points.push({
      lat: start.lat + (end.lat - start.lat) * t + (Math.sin(t * Math.PI * 3) * noise),
      lng: start.lng + (end.lng - start.lng) * t + (Math.cos(t * Math.PI * 2) * noise),
    });
  }
  return points;
}

// 1. VIJAYAWADA NH-16 CORRIDOR
const vja1 = generateInterpolatedPath({ lat: 16.5020, lng: 80.6380 }, { lat: 16.5050, lng: 80.6440 }, 15);
const vjaTunnel = generateInterpolatedPath({ lat: 16.5050, lng: 80.6440 }, { lat: 16.5085, lng: 80.6510 }, 20); // Underpass blackout
const vja2 = generateInterpolatedPath({ lat: 16.5085, lng: 80.6510 }, { lat: 16.5140, lng: 80.6580 }, 18);
const vjaWaypoints = [...vja1, ...vjaTunnel.slice(1), ...vja2.slice(1)];

// Vijayawada Alternative (Surface bypass: MG Road instead of underpass expressway)
const vjaAltPath = generateInterpolatedPath({ lat: 16.5020, lng: 80.6380 }, { lat: 16.5140, lng: 80.6580 }, 45, 0.0006);

export const VIJAYAWADA_ROUTE: NavigationRoute = {
  id: 'vijayawada-nh16',
  name: 'Vijayawada Kanaka Durga Expressway & Underpass',
  originName: 'Vijayawada Junction Railway Station',
  destinationName: 'Benz Circle Commercial Hub',
  originCoords: { lat: 16.5020, lng: 80.6380 },
  destinationCoords: { lat: 16.5140, lng: 80.6580 },
  distanceKm: 3.4,
  estimatedMinutes: 8,
  speedLimitKmh: 50,
  waypoints: vjaWaypoints,
  blackoutZones: [
    {
      name: 'Kanaka Durga Transit Underpass',
      type: 'Underpass',
      startIndex: 14,
      endIndex: 34,
      lengthMeters: 750,
      description: 'Sub-surface reinforced concrete grade separator with total GNSS signal attenuation.',
    },
  ],
  maneuvers: [
    {
      stepIndex: 0,
      instruction: 'Head North-East on Station Road toward NH-16',
      roadName: 'Station Road',
      direction: 'straight',
      distanceMeters: 550,
    },
    {
      stepIndex: 10,
      instruction: 'In 200m, keep right to enter Kanaka Durga Underpass',
      roadName: 'NH-16 Expressway Underpass',
      direction: 'tunnel-entry',
      distanceMeters: 750,
    },
    {
      stepIndex: 35,
      instruction: 'Exit Underpass and continue onto MG Road toward Benz Circle',
      roadName: 'Mahatma Gandhi Road',
      direction: 'slight-right',
      distanceMeters: 900,
    },
    {
      stepIndex: 50,
      instruction: 'Arrive at Benz Circle on the left',
      roadName: 'Benz Circle',
      direction: 'destination',
      distanceMeters: 100,
    },
  ],
  tags: ['Underpass', 'Urban Highway', 'SIH Target Zone'],
  traffic: {
    locationName: 'Kanaka Durga Underpass Entrance',
    severity: 'high',
    delaySeconds: 240,
    reason: 'Waterlogging & vehicle breakdown inside underpass tunnel.',
  },
  alternative: {
    name: 'MG Road Surface Bypass (Avoids Underpass)',
    distanceKm: 3.7,
    estimatedMinutes: 7, // Faster because it avoids the underpass traffic jam!
    waypoints: vjaAltPath,
    reason: 'Avoids underpass congestion & maintains full GNSS satellite lock.',
    hasBlackout: false,
  },
};

// 2. MUMBAI COASTAL ROAD TWIN TUNNEL (Marine Drive to Worli)
const mum1 = generateInterpolatedPath({ lat: 18.9430, lng: 72.8230 }, { lat: 18.9550, lng: 72.8120 }, 15);
const mumTunnel = generateInterpolatedPath({ lat: 18.9550, lng: 72.8120 }, { lat: 18.9740, lng: 72.8010 }, 30); // 2.07 km Undersea tunnel
const mum2 = generateInterpolatedPath({ lat: 18.9740, lng: 72.8010 }, { lat: 18.9920, lng: 72.8120 }, 20);
const mumWaypoints = [...mum1, ...mumTunnel.slice(1), ...mum2.slice(1)];

const mumAltPath = generateInterpolatedPath({ lat: 18.9430, lng: 72.8230 }, { lat: 18.9920, lng: 72.8120 }, 55, 0.001);

export const MUMBAI_ROUTE: NavigationRoute = {
  id: 'mumbai-coastal-tunnel',
  name: 'Mumbai Coastal Road (Undersea Twin Tunnel Corridor)',
  originName: 'Princess Street Flyover, Marine Drive',
  destinationName: 'Priyadarshini Park Interchange, Breach Candy',
  originCoords: { lat: 18.9430, lng: 72.8230 },
  destinationCoords: { lat: 18.9920, lng: 72.8120 },
  distanceKm: 5.8,
  estimatedMinutes: 6,
  speedLimitKmh: 80,
  waypoints: mumWaypoints,
  blackoutZones: [
    {
      name: 'Dharamveer Swarajya Coastal Tunnel (Twin-Tube)',
      type: 'Tunnel',
      startIndex: 14,
      endIndex: 44,
      lengthMeters: 2070,
      description: 'Undersea / subterranean tunnel passing 20m under Arabian Sea and Malabar Hill. Zero satellite visibility.',
    },
  ],
  maneuvers: [
    {
      stepIndex: 0,
      instruction: 'Head North on Dharmveer Swarajya Rakshak Coastal Road',
      roadName: 'Marine Drive Expressway',
      direction: 'straight',
      distanceMeters: 1200,
    },
    {
      stepIndex: 12,
      instruction: 'Take the right tube into Malabar Hill Undersea Tunnel',
      roadName: 'Coastal Undersea Tunnel',
      direction: 'tunnel-entry',
      distanceMeters: 2070,
    },
    {
      stepIndex: 44,
      instruction: 'Exit Tunnel Tube at Priyadarshini Park portal and merge north',
      roadName: 'Worli-Bandra Connector Link',
      direction: 'straight',
      distanceMeters: 1500,
    },
    {
      stepIndex: 62,
      instruction: 'Destination is ahead on Worli Sea Face',
      roadName: 'Breach Candy Portal',
      direction: 'destination',
      distanceMeters: 150,
    },
  ],
  tags: ['Undersea Tunnel', 'Twin Tube', 'Severe Blackout'],
  traffic: {
    locationName: 'Coastal Tunnel Entry Gate',
    severity: 'moderate',
    delaySeconds: 90,
    reason: 'Routine lane security checks at Marine Drive entry portal.',
  },
  alternative: {
    name: 'Netaji Subhash Chandra Bose Road (Surface Bypass)',
    distanceKm: 6.4,
    estimatedMinutes: 11,
    waypoints: mumAltPath,
    reason: 'Scenic coastline route with constant GPS, but subject to city traffic signal stops.',
    hasBlackout: false,
  },
};

// 3. DELHI PRAGATI MAIDAN TRANSIT TUNNEL (Mathura Road to Ring Road)
const del1 = generateInterpolatedPath({ lat: 28.6180, lng: 77.2380 }, { lat: 28.6170, lng: 77.2440 }, 12);
const delTunnel = generateInterpolatedPath({ lat: 28.6170, lng: 77.2440 }, { lat: 28.6140, lng: 77.2560 }, 25); // 1.3 km Pragati tunnel
const del2 = generateInterpolatedPath({ lat: 28.6140, lng: 77.2560 }, { lat: 28.6110, lng: 77.2620 }, 15);
const delWaypoints = [...del1, ...delTunnel.slice(1), ...del2.slice(1)];

const delAltPath = generateInterpolatedPath({ lat: 28.6180, lng: 77.2380 }, { lat: 28.6110, lng: 77.2620 }, 40, 0.0008);

export const DELHI_ROUTE: NavigationRoute = {
  id: 'delhi-pragati-maidan',
  name: 'Delhi Pragati Maidan Integrated Transit Corridor',
  originName: 'Mathura Road / Supreme Court Junction',
  destinationName: 'Ring Road / Yamuna Bank Expressway',
  originCoords: { lat: 28.6180, lng: 77.2380 },
  destinationCoords: { lat: 28.6110, lng: 77.2620 },
  distanceKm: 2.7,
  estimatedMinutes: 5,
  speedLimitKmh: 60,
  waypoints: delWaypoints,
  blackoutZones: [
    {
      name: 'Pragati Maidan Main Tunnel',
      type: 'Tunnel',
      startIndex: 11,
      endIndex: 36,
      lengthMeters: 1300,
      description: '6-lane integrated underground transit tunnel below active railway tracks and Pragati Maidan.',
    },
  ],
  maneuvers: [
    {
      stepIndex: 0,
      instruction: 'Head East on Purana Qila Road toward Mathura Road',
      roadName: 'Purana Qila Road',
      direction: 'straight',
      distanceMeters: 450,
    },
    {
      stepIndex: 10,
      instruction: 'Enter Pragati Maidan Subterranean Expressway',
      roadName: 'Pragati Tunnel Tube',
      direction: 'tunnel-entry',
      distanceMeters: 1300,
    },
    {
      stepIndex: 36,
      instruction: 'Take Ring Road ramp toward Sarai Kale Khan',
      roadName: 'Yamuna River Bypass Ring Road',
      direction: 'slight-right',
      distanceMeters: 800,
    },
    {
      stepIndex: 50,
      instruction: 'Arrive at Ring Road Junction',
      roadName: 'Ring Road',
      direction: 'destination',
      distanceMeters: 100,
    },
  ],
  tags: ['Urban Underground', 'Multi-Level', 'Railway Underpass'],
  traffic: {
    locationName: 'Mathura Road Junction',
    severity: 'low',
    delaySeconds: 15,
    reason: 'Normal urban traffic flow.',
  },
  alternative: {
    name: 'Bhairon Marg Surface Loop (Avoids Tunnel)',
    distanceKm: 3.1,
    estimatedMinutes: 6,
    waypoints: delAltPath,
    reason: 'Full sky view for continuous GNSS lock; bypasses active underground section.',
    hasBlackout: false,
  },
};

// 4. ATAL TUNNEL ROHTANG (Himalayan High Altitude 9.02 km)
const atal1 = generateInterpolatedPath({ lat: 32.3600, lng: 77.1350 }, { lat: 32.3640, lng: 77.1400 }, 10);
const atalTunnel = generateInterpolatedPath({ lat: 32.3640, lng: 77.1400 }, { lat: 32.4410, lng: 77.1640 }, 40); // 9.02 km tunnel
const atal2 = generateInterpolatedPath({ lat: 32.4410, lng: 77.1640 }, { lat: 32.4480, lng: 77.1700 }, 10);
const atalWaypoints = [...atal1, ...atalTunnel.slice(1), ...atal2.slice(1)];

const atalAltPath = generateInterpolatedPath({ lat: 32.3600, lng: 77.1350 }, { lat: 32.4480, lng: 77.1700 }, 65, 0.003);

export const ATAL_TUNNEL_ROUTE: NavigationRoute = {
  id: 'atal-tunnel-rohtang',
  name: 'Leh-Manali Highway (Atal Tunnel Rohtang Corridor)',
  originName: 'Dhundi South Portal (Manali Side, 3060m Elev)',
  destinationName: 'Teling Sissu North Portal (Lahaul Valley, 3071m Elev)',
  originCoords: { lat: 32.3600, lng: 77.1350 },
  destinationCoords: { lat: 32.4480, lng: 77.1700 },
  distanceKm: 11.2,
  estimatedMinutes: 14,
  speedLimitKmh: 60,
  waypoints: atalWaypoints,
  blackoutZones: [
    {
      name: 'Atal Tunnel (Rohtang Himalayan Pass)',
      type: 'Tunnel',
      startIndex: 9,
      endIndex: 49,
      lengthMeters: 9020,
      description: 'World’s longest highway tunnel above 10,000 feet. Deep mountain granite overburden with zero satellite penetration.',
    },
  ],
  maneuvers: [
    {
      stepIndex: 0,
      instruction: 'Proceed North-East on NH-3 approaching South Portal',
      roadName: 'NH-3 Manali Approach Road',
      direction: 'straight',
      distanceMeters: 600,
    },
    {
      stepIndex: 8,
      instruction: 'Enter Atal Tunnel South Portal (Maintain 60 km/h speed limit)',
      roadName: 'Atal Tunnel (9.02 km)',
      direction: 'tunnel-entry',
      distanceMeters: 9020,
    },
    {
      stepIndex: 48,
      instruction: 'Exit North Portal into Lahaul Valley and continue on Leh Highway',
      roadName: 'Manali-Leh Highway',
      direction: 'straight',
      distanceMeters: 1400,
    },
    {
      stepIndex: 58,
      instruction: 'Arrive at Sissu Lahaul Valley Checkpost',
      roadName: 'Sissu Checkpoint',
      direction: 'destination',
      distanceMeters: 200,
    },
  ],
  tags: ['Himalayan High Altitude', '9.02 km Long Tunnel', 'Critical Testbed'],
  traffic: {
    locationName: 'Atal Tunnel Tube Interior',
    severity: 'high',
    delaySeconds: 420,
    reason: 'Single lane traffic control inside tunnel due to drainage maintenance.',
  },
  alternative: {
    name: 'Old Rohtang Pass Mountain Road (Surface Bypass)',
    distanceKm: 38.5,
    estimatedMinutes: 120, // Mountain pass is way slower!
    waypoints: atalAltPath,
    reason: 'Scenic high-altitude pass (3,978m). Full sky view, but extremely slow, hazardous, and seasonal.',
    hasBlackout: false,
  },
};

export const PRESET_ROUTES: NavigationRoute[] = [
  VIJAYAWADA_ROUTE,
  MUMBAI_ROUTE,
  DELHI_ROUTE,
  ATAL_TUNNEL_ROUTE,
];
