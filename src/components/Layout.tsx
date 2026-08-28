import { NavLink, Outlet } from 'react-router-dom';
import {
  Map,
  Activity,
  Radio,
  Zap,
  BarChart3,
  Info,
  Settings,
  Wifi,
} from 'lucide-react';
import { useNavigation } from '../context/NavigationContext';

const NAV_ITEMS = [
  { to: '/', label: 'Dashboard', shortLabel: 'Map', icon: Map },
  { to: '/status', label: 'System Status', shortLabel: 'Status', icon: Activity },
  { to: '/sensors', label: 'Sensor Monitoring', shortLabel: 'Sensors', icon: Radio },
  { to: '/simulation', label: 'GNSS Blackout', shortLabel: 'Demo', icon: Zap },
  { to: '/performance', label: 'Trajectory & Perf.', shortLabel: 'Perf.', icon: BarChart3 },
  { to: '/info', label: 'System Info', shortLabel: 'Info', icon: Info },
];

function StatusBadge() {
  const { gnssStatus, navigationMode } = useNavigation();
  const color =
    gnssStatus === 'healthy'
      ? 'bg-govt-green'
      : gnssStatus === 'unavailable'
        ? 'bg-govt-red'
        : gnssStatus === 'weak'
          ? 'bg-govt-amber'
          : 'bg-govt-green';
  const pulseClass =
    gnssStatus === 'healthy' || gnssStatus === 'restored'
      ? 'pulse-green'
      : gnssStatus === 'unavailable'
        ? 'pulse-red'
        : '';
  const label =
    gnssStatus === 'healthy'
      ? 'SYSTEM ACTIVE'
      : gnssStatus === 'unavailable'
        ? 'DR MODE'
        : gnssStatus === 'weak'
          ? 'DEGRADED'
          : 'RECOVERING';

  return (
    <div className="flex items-center gap-2 text-xs sm:text-sm">
      <span className="hidden sm:inline text-gray-300 font-medium">{navigationMode}</span>
      <span className="flex items-center gap-1.5 bg-white/10 px-2 py-1 rounded text-white font-semibold">
        <span className={`w-2.5 h-2.5 rounded-full ${color} ${pulseClass}`} />
        {label}
      </span>
    </div>
  );
}

export default function Layout() {
  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <header className="bg-navy text-white flex items-center justify-between px-4 py-2.5 shadow-md z-30 shrink-0">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded bg-white/15 flex items-center justify-center">
              <Map className="w-4.5 h-4.5 text-white" />
            </div>
            <div>
              <h1 className="text-sm sm:text-base font-bold tracking-wide leading-tight">
                IDR-NAV
              </h1>
              <p className="text-[10px] sm:text-xs text-gray-400 leading-tight hidden sm:block">
                Intelligent Dead Reckoning System
              </p>
            </div>
          </div>
          <span className="hidden md:inline text-gray-500 text-xs">|</span>
          <span className="hidden md:inline text-gray-400 text-xs">
            AI-ML Based GNSS Fusion
          </span>
        </div>
        <div className="flex items-center gap-3">
          <StatusBadge />
          <div className="hidden sm:flex items-center gap-1 text-gray-400">
            <Wifi className="w-4 h-4" />
          </div>
          <button className="text-gray-400 hover:text-white transition-colors">
            <Settings className="w-4 h-4" />
          </button>
        </div>
      </header>

      <div className="flex flex-1 overflow-hidden">
        {/* Desktop Sidebar */}
        <nav className="hidden lg:flex flex-col w-52 bg-white border-r border-govt-border shrink-0">
          <div className="py-3 flex flex-col gap-0.5">
            {NAV_ITEMS.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.to === '/'}
                className={({ isActive }) =>
                  `flex items-center gap-3 px-4 py-2.5 text-sm font-medium transition-colors ${
                    isActive
                      ? 'bg-navy/5 text-navy border-r-3 border-navy'
                      : 'text-govt-muted hover:bg-gray-50 hover:text-govt-text'
                  }`
                }
              >
                <item.icon className="w-4 h-4 shrink-0" />
                {item.label}
              </NavLink>
            ))}
          </div>
        </nav>

        {/* Main Content */}
        <main className="flex-1 overflow-y-auto pb-16 lg:pb-0">
          <Outlet />
        </main>
      </div>

      {/* Mobile Bottom Nav */}
      <nav className="lg:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-govt-border flex z-30">
        {NAV_ITEMS.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.to === '/'}
            className={({ isActive }) =>
              `flex-1 flex flex-col items-center py-2 text-[10px] sm:text-xs font-medium transition-colors ${
                isActive ? 'text-navy' : 'text-govt-muted'
              }`
            }
          >
            <item.icon className="w-4 h-4 mb-0.5" />
            {item.shortLabel}
          </NavLink>
        ))}
      </nav>
    </div>
  );
}
