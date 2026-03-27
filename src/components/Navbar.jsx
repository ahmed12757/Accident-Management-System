import { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { FaUserShield, FaExclamationTriangle, FaHistory, FaBars, FaTimes, FaUserCircle, FaSignOutAlt, FaAmbulance } from 'react-icons/fa';
import { Link as RouterLink } from 'react-router-dom';
import { getCurrentUser, logout, getReports, getAmbulances } from '../services/db';
import appIcon from '../../public/Image/icon-180.png';

const Navbar = () => {
    const location = useLocation();
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    
    const user = getCurrentUser();
    const navigate = useNavigate();
    
    const handleLogout = () => {
        logout();
        navigate('/login');
    };

    // Reactively track active ambulances (those dispatched and still in mission)
    const [activeAmbulances, setActiveAmbulances] = useState([]);
    const [showAmbulanceMenu, setShowAmbulanceMenu] = useState(false);
    useEffect(() => {
        const findActiveAmbs = () => {
            const allAmbs = getAmbulances();
            const allReports = getReports();
            // Get IDs of ambulances currently on active missions
            const activeIds = new Set();
            allReports.forEach(r => {
                if (
                    r.ambulanceIds?.length > 0 &&
                    r.missionStatus !== 'pending' &&
                    r.missionStatus !== 'تم إنهاء المهمة' &&
                    r.missionStatus !== 'تم إلغاء المهمة (بلاغ كاذب)' &&
                    !r.isFalseReport
                ) {
                    r.ambulanceIds.forEach(id => activeIds.add(id));
                }
            });
            setActiveAmbulances(allAmbs.filter(a => activeIds.has(a.id)));
        };
        findActiveAmbs();
        const interval = setInterval(findActiveAmbs, 2000);
        return () => clearInterval(interval);
    }, []);

    
    const navLinks = [
        { 
            to: "/dashboard", 
            label: user?.role === 'SUPERVISOR' ? "إدارة المراكز (المشرف)" : "إدارة المركز المحلي", 
            icon: <FaUserShield />, 
            color: "bg-blue-900/30", 
            activeColor: "text-white bg-blue-900/40",
            roles: ['SUPERVISOR', 'CENTER_ADMIN']
        },
        { 
            to: "/logs", 
            label: "سجل البلاغات", 
            icon: <FaHistory />, 
            color: "bg-purple-900/30", 
            activeColor: "text-white bg-purple-900/40",
            roles: ['SUPERVISOR', 'CENTER_ADMIN']
        }
    ].filter(link => !link.roles || link.roles.includes(user?.role));

    const isDriverActive = location.pathname.startsWith('/driver') || location.pathname.startsWith('/paramedic');

    return (
        <nav className="bg-gray-900 border-b border-gray-800 shadow-lg sticky top-0 z-50">
            <div className="max-w-7xl mx-auto px-2 md:px-6 lg:px-8">
                <div className="flex justify-between items-center h-16 md:h-20">
                    
                    {/* Brand */}
                    <Link to="/" className="flex items-center gap-3 hover:opacity-80 transition-opacity" dir="rtl">
                        <div className="bg-red-600/30 p-1.5 md:p-2 rounded-lg border border-red-500/30 flex items-center justify-center">
                            <img 
                                src={appIcon} 
                                alt="طوارئ الإسعاف" 
                                className="w-13 h-13 md:w-14 md:h-14 object-contain drop-shadow-md" 
                            />
                        </div>
                        <span className="font-bold text-lg md:text-xl text-white tracking-wide">طوارئ الإسعاف</span>
                    </Link>

                    {/* Desktop Navigation Links */}
                    <div className="hidden md:flex items-center gap-4 lg:gap-6" dir="rtl">
                        {navLinks.map((link) => (
                            <Link 
                                key={link.to}
                                to={link.to} 
                                className={`flex items-center gap-2 px-3 py-2 rounded-md font-medium transition-all ${
                                    location.pathname.includes(link.to) 
                                    ? `text-white ${link.color}` 
                                    : 'text-gray-400 hover:text-white hover:bg-gray-800'
                                }`}
                            >
                                {link.icon} {link.label}
                            </Link>
                        ))}
                        {user?.role === 'SUPERVISOR' && (
                            <RouterLink 
                                to="/admin/permissions"
                                className={`flex items-center gap-2 px-3 py-2 rounded-md font-bold text-xs ${
                                    location.pathname.startsWith('/admin/permissions')
                                        ? 'text-amber-300 bg-amber-900/40 border border-amber-500/40'
                                        : 'text-amber-300/80 hover:text-amber-200 hover:bg-amber-900/30 border border-amber-500/20'
                                }`}
                            >
                                <FaUserShield className="text-sm" />
                                إعداد صلاحيات IT
                            </RouterLink>
                        )}
                        {(user?.role === 'SUPERVISOR' || user?.role === 'CENTER_ADMIN') && (
                            <RouterLink 
                                to="/admin/drivers"
                                className={`flex items-center gap-2 px-3 py-2 rounded-md font-bold text-xs ${
                                    location.pathname.startsWith('/admin/drivers')
                                        ? 'text-blue-200 bg-blue-900/40 border border-blue-500/40'
                                        : 'text-blue-200/80 hover:text-blue-100 hover:bg-blue-900/30 border border-blue-500/20'
                                }`}
                            >
                                <FaAmbulance className="text-sm" />
                                حسابات العربات
                            </RouterLink>
                        )}


                    </div>

                    {/* User Info / Profile - Desktop */}
                    <div className="hidden lg:flex items-center gap-4 bg-gray-800/50 px-5 py-2 rounded-2xl border border-gray-700 hover:border-gray-600 transition-all">
                        <div className="flex items-center gap-3">
                            <div className="h-10 w-10 rounded-full bg-blue-600/20 border border-blue-500/30 flex items-center justify-center text-blue-400">
                                <FaUserCircle className="text-2xl" />
                            </div>
                            <div className="flex flex-col">
                                <span className="text-sm font-black text-white leading-tight">{user?.name}</span>
                                <span className="text-[10px] text-blue-400 font-bold tracking-wider uppercase bg-blue-400/10 px-1.5 py-0.5 rounded mt-0.5">
                                    {user?.role === 'SUPERVISOR' ? 'مشرف عام' : user?.role === 'CENTER_ADMIN' ? 'مدير مركز' : 'قائد سيارة'}
                                </span>
                            </div>
                        </div>
                        <div className="h-8 w-px bg-gray-700 mx-1"></div>
                        <button 
                            onClick={handleLogout}
                            className="bg-red-900/20 hover:bg-red-600 text-red-400 hover:text-white p-2.5 rounded-xl border border-red-500/30 transition-all flex items-center gap-2 font-bold text-xs"
                            title="تسجيل الخروج"
                        >
                            <FaSignOutAlt />
                        </button>
                    </div>

                    {/* Mobile Menu Button */}
                    <div className="md:hidden flex items-center gap-2">
                        <button 
                            onClick={handleLogout}
                            className="bg-red-900/20 p-2 rounded-xl text-red-500 border border-red-500/30 shadow-lg active:scale-95 transition-transform"
                            title="تسجيل الخروج"
                        >
                            <FaSignOutAlt className="text-sm" />
                        </button>
                        <button 
                            onClick={() => setIsMenuOpen(!isMenuOpen)}
                            className="bg-gray-800 p-2 rounded-lg text-gray-400 hover:text-white focus:outline-none transition-colors border border-gray-700"
                        >
                            {isMenuOpen ? <FaTimes className="text-xl" /> : <FaBars className="text-xl" />}
                        </button>
                    </div>
                </div>
            </div>

            {/* Mobile Navigation Links */}
            {isMenuOpen && (
                <div className="md:hidden bg-gray-900 border-b border-gray-800 animate-slide-down shadow-2xl overflow-hidden" dir="rtl">
                    <div className="px-4 pt-4 pb-6 space-y-3">
                        {/* User Profile in Mobile Menu */}
                        <div className="flex items-center gap-4 bg-gray-800/80 p-4 rounded-2xl border border-gray-700 mb-4">
                            <div className="h-12 w-12 rounded-full bg-blue-600/20 border border-blue-500/30 flex items-center justify-center text-blue-400 shrink-0">
                                <FaUserCircle className="text-3xl" />
                            </div>
                            <div className="flex flex-col">
                                <span className="text-base font-black text-white leading-tight">{user?.name}</span>
                                <span className="text-xs text-blue-400 font-bold tracking-wider uppercase bg-blue-400/10 px-2 py-0.5 rounded mt-1 w-fit">
                                    {user?.role === 'SUPERVISOR' ? 'مشرف عام' : user?.role === 'CENTER_ADMIN' ? 'مدير مركز' : 'قائد سيارة'}
                                </span>
                            </div>
                        </div>

                        {navLinks.map((link) => (
                            <Link 
                                key={link.to}
                                to={link.to} 
                                onClick={() => setIsMenuOpen(false)}
                                className={`flex items-center gap-4 px-4 py-4 rounded-2xl font-bold transition-all ${
                                    location.pathname.includes(link.to) 
                                    ? `text-white ${link.color} border border-white/10 shadow-lg` 
                                    : 'text-gray-400 hover:text-white hover:bg-gray-800'
                                }`}
                            >
                                <span className="text-2xl">{link.icon}</span> 
                                <span className="text-lg">{link.label}</span>
                            </Link>
                        ))}
                    </div>
                </div>
            )}
        </nav>
    );
};

export default Navbar;
