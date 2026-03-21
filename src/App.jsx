import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import CenterDashboard from './pages/CenterDashboard';
import MissionTracking from './pages/MissionTracking';
import IncidentLogs from './pages/IncidentLogs';
import ParamedicDashboard from './pages/ParamedicDashboard';
import Login from './pages/Login';
import Navbar from './components/Navbar';
import { NotificationProvider } from './context/NotificationContext';
import { initDB, getCurrentUser } from './services/db';

const ProtectedRoute = ({ children, allowedRoles }) => {
    const user = getCurrentUser();
    const location = useLocation();

    if (!user) {
        return <Navigate to="/login" state={{ from: location }} replace />;
    }

    if (allowedRoles && !allowedRoles.includes(user.role)) {
        return <Navigate to="/dashboard" replace />;
    }

    return (
        <>
            <Navbar />
            <main className="flex-1 overflow-auto bg-[url('https://www.transparenttextures.com/patterns/dark-matter.png')]">
                {children}
            </main>
        </>
    );
};

const App = () => {
    // Initialize mock database for the demo
    initDB();
    
    return (
        <NotificationProvider>
            <Router>
                <div className="min-h-screen flex flex-col bg-gray-900 text-white/95 font-sans">
                    <Routes>
                        <Route path="/login" element={<Login />} />
                        
                        <Route path="/" element={<ProtectedRoute><Navigate to="/dashboard" replace /></ProtectedRoute>} />
                        <Route path="/dashboard" element={<ProtectedRoute><CenterDashboard /></ProtectedRoute>} />
                        <Route path="/logs" element={<ProtectedRoute allowedRoles={['SUPERVISOR', 'GOVERNORATE_ADMIN', 'CENTER_ADMIN']}><IncidentLogs /></ProtectedRoute>} />
                        <Route path="/track/:id" element={<ProtectedRoute><MissionTracking /></ProtectedRoute>} />
                        <Route path="/paramedic/:id" element={<ProtectedRoute><ParamedicDashboard /></ProtectedRoute>} />
                        <Route path="/driver/:ambulanceId" element={<ProtectedRoute><ParamedicDashboard /></ProtectedRoute>} />

                        {/* Catch all redirect to dashboard */}
                        <Route path="*" element={<Navigate to="/dashboard" replace />} />
                    </Routes>
                </div>
            </Router>
        </NotificationProvider>
    );
};


export default App;
