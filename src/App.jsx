import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import CenterDashboard from './pages/CenterDashboard';
import MissionTracking from './pages/MissionTracking';
import IncidentLogs from './pages/IncidentLogs';
import ParamedicDashboard from './pages/ParamedicDashboard';
import Navbar from './components/Navbar';
import { initDB } from './services/db';

const App = () => {
    // Initialize mock database for the demo
    initDB();
    
    return (
        <Router>
            <div className="min-h-screen flex flex-col bg-gray-900 text-white/95 font-sans">
                <Navbar />
                <main className="flex-1 overflow-auto bg-[url('https://www.transparenttextures.com/patterns/dark-matter.png')]">
                    <Routes>
                        <Route path="/" element={<Navigate to="/dashboard" replace />} />
                        <Route path="/dashboard" element={<CenterDashboard />} />
                        <Route path="/logs" element={<IncidentLogs />} />
                        <Route path="/track/:id" element={<MissionTracking />} />
                        <Route path="/paramedic/:id" element={<ParamedicDashboard />} />
                        <Route path="/driver/:ambulanceId" element={<ParamedicDashboard />} />
                    </Routes>
                </main>
            </div>
        </Router>
    );
};

export default App;
