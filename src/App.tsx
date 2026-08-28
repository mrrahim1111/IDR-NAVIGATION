import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { NavigationProvider } from './context/NavigationContext';
import Layout from './components/Layout';
import Dashboard from './pages/Dashboard';
import SystemStatus from './pages/SystemStatus';
import SensorMonitoring from './pages/SensorMonitoring';
import BlackoutSimulation from './pages/BlackoutSimulation';
import TrajectoryPerformance from './pages/TrajectoryPerformance';
import SystemInfo from './pages/SystemInfo';

function App() {
  return (
    <BrowserRouter>
      <NavigationProvider>
        <Routes>
          <Route element={<Layout />}>
            <Route path="/" element={<Dashboard />} />
            <Route path="/status" element={<SystemStatus />} />
            <Route path="/sensors" element={<SensorMonitoring />} />
            <Route path="/simulation" element={<BlackoutSimulation />} />
            <Route path="/performance" element={<TrajectoryPerformance />} />
            <Route path="/info" element={<SystemInfo />} />
          </Route>
        </Routes>
      </NavigationProvider>
    </BrowserRouter>
  );
}

export default App;
