import { useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import CenterDashboard from './pages/CenterDashboard';
import MissionTracking from './pages/MissionTracking';
import IncidentLogs from './pages/IncidentLogs';
import ParamedicDashboard from './pages/ParamedicDashboard';
import Login from './pages/Login';
import Navbar from './components/Navbar';
import { NotificationProvider } from './context/NotificationContext';
import { initDB, getCurrentUser } from './services/db';
import SplashScreen from './components/pwa/SplashScreen';
import InstallPrompt from './components/pwa/InstallPrompt';
import PermissionsAdmin from './pages/PermissionsAdmin';
import { getRoutePermissions } from './services/permissions';
import DriverAccounts from './pages/DriverAccounts';
import ManageCenters from './pages/ManageCenters';
import HotspotsAnalytics from './pages/HotspotsAnalytics';

const ProtectedRoute = ({ children, allowedRoles, pathKey }) => {
    const user = getCurrentUser();
    const location = useLocation();

    if (!user) {
        return <Navigate to="/login" state={{ from: location }} replace />;
    }

    let finalAllowed = allowedRoles;
    if (pathKey) {
        const perms = getRoutePermissions();
        if (perms[pathKey]) {
            finalAllowed = perms[pathKey];
        }
    }

    if (finalAllowed && !finalAllowed.includes(user.role)) {
        return <Navigate to="/dashboard" replace />;
    }

    return (
        <>
            <Navbar />
            <main className="flex-1 bg-[url('https://www.transparenttextures.com/patterns/dark-matter.png')]">
                {children}
            </main>
        </>
    );
};

const App = () => {
    // Initialize mock database for the demo
    initDB();

    const [showSplash, setShowSplash] = useState(true);
    
    return (
        <NotificationProvider>
            {showSplash && <SplashScreen onFinish={() => setShowSplash(false)} />}
            <InstallPrompt />
            <Router>
                <div className="min-h-screen flex flex-col bg-gray-900 text-white/95 font-sans">
                    <Routes>
                        <Route path="/login" element={<Login />} />
                        
                        <Route path="/" element={<ProtectedRoute pathKey="/dashboard"><Navigate to="/dashboard" replace /></ProtectedRoute>} />
                        <Route path="/dashboard" element={<ProtectedRoute pathKey="/dashboard"><CenterDashboard /></ProtectedRoute>} />
                        <Route path="/logs" element={<ProtectedRoute pathKey="/logs" allowedRoles={['SUPERVISOR', 'CENTER_ADMIN']}><IncidentLogs /></ProtectedRoute>} />
                        <Route path="/track/:id" element={<ProtectedRoute pathKey="/track/:id"><MissionTracking /></ProtectedRoute>} />
                        <Route path="/paramedic/:id" element={<ProtectedRoute pathKey="/paramedic/:id"><ParamedicDashboard /></ProtectedRoute>} />
                        <Route path="/driver/:ambulanceId" element={<ProtectedRoute pathKey="/driver/:ambulanceId"><ParamedicDashboard /></ProtectedRoute>} />
                        <Route path="/admin/permissions" element={<ProtectedRoute allowedRoles={['SUPERVISOR']}><PermissionsAdmin /></ProtectedRoute>} />
                        <Route path="/admin/drivers" element={<ProtectedRoute pathKey="/admin/drivers" allowedRoles={['SUPERVISOR', 'CENTER_ADMIN']}><DriverAccounts /></ProtectedRoute>} />
                        <Route path="/admin/centers" element={<ProtectedRoute allowedRoles={['SUPERVISOR']}><ManageCenters /></ProtectedRoute>} />
                        <Route path="/analytics" element={<ProtectedRoute pathKey="/analytics" allowedRoles={['SUPERVISOR', 'CENTER_ADMIN']}><HotspotsAnalytics /></ProtectedRoute>} />

                        {/* Catch all redirect to dashboard */}
                        <Route path="*" element={<Navigate to="/dashboard" replace />} />
                    </Routes>
                </div>
            </Router>
        </NotificationProvider>
    );
};


export default App;
