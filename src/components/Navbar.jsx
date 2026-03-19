import { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { FaAmbulance, FaUserShield, FaExclamationTriangle, FaHistory, FaBars, FaTimes, FaUserCircle, FaExchangeAlt } from 'react-icons/fa';
import { getCurrentUser, setCurrentUser, INITIAL_USERS, getReports, getAmbulances } from '../services/db';

const Navbar = () => {
    const location = useLocation();
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    
    const user = getCurrentUser();
    
    const toggleRole = () => {
        // Cycle: Supervisor (u1) -> Qalyub Admin (u2) -> Shubra Admin (u3) -> Supervisor...
        const currentIndex = INITIAL_USERS.findIndex(u => u.id === user.id);
        const nextIndex = (currentIndex + 1) % INITIAL_USERS.length;
        const nextUser = INITIAL_USERS[nextIndex];
        
        setCurrentUser(nextUser);
        window.location.reload(); 
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
            label: user.role === 'SUPERVISOR' ? "إدارة المراكز (المشرف)" : "إدارة المركز المحلي", 
            icon: <FaUserShield />, 
            color: "bg-blue-900/30", 
            activeColor: "text-white bg-blue-900/40" 
        },
        { to: "/logs", label: "سجل البلاغات", icon: <FaHistory />, color: "bg-purple-900/30", activeColor: "text-white bg-purple-900/40" }
    ];

    const isDriverActive = location.pathname.startsWith('/driver') || location.pathname.startsWith('/paramedic');

    return (
        <nav className="bg-gray-900 border-b border-gray-800 shadow-lg sticky top-0 z-50">
            <div className="max-w-7xl mx-auto px-2 md:px-6 lg:px-8">
                <div className="flex justify-between items-center h-16 md:h-20">
                    
                    {/* Brand */}
                    <Link to="/" className="flex items-center gap-3 hover:opacity-80 transition-opacity">
                        <div className="bg-red-600 p-2 rounded-lg">
                            <FaAmbulance className="text-white text-xl" />
                        </div>
                        <span className="font-bold text-lg md:text-xl text-white tracking-wide">طوارئ الإسعاف  </span>
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

                        {/* Ambulance Dropdown */}
                        <div className="relative">
                            <button
                                onClick={() => setShowAmbulanceMenu(prev => !prev)}
                                className={`flex items-center gap-2 px-3 py-2 rounded-md font-medium transition-all ${
                                    isDriverActive ? 'text-white bg-orange-900/30' : 'text-gray-400 hover:text-white hover:bg-gray-800'
                                }`}
                            >
                                <FaAmbulance />
                                <span>سيارات نشطة</span>
                                {activeAmbulances.length > 0 && (
                                    <span className="bg-orange-500 text-white text-[10px] font-black rounded-full w-4 h-4 flex items-center justify-center">{activeAmbulances.length}</span>
                                )}
                            </button>
                            {showAmbulanceMenu && (
                                <div className="absolute top-full right-0 mt-2 w-60 bg-gray-900 border border-gray-700 rounded-2xl shadow-2xl z-[200] overflow-hidden animate-slide-down" dir="rtl">
                                    {activeAmbulances.length === 0 ? (
                                        <div className="px-4 py-5 text-gray-500 text-sm text-center">لا توجد سيارات في مهمة حالياً</div>
                                    ) : (
                                        activeAmbulances.map(amb => (
                                            <Link
                                                key={amb.id}
                                                to={`/driver/${amb.id}`}
                                                onClick={() => setShowAmbulanceMenu(false)}
                                                className={`flex items-center gap-3 px-4 py-3 hover:bg-orange-900/30 transition-colors border-b border-gray-800 last:border-0 ${
                                                    location.pathname === `/driver/${amb.id}` ? 'bg-orange-900/40 text-orange-300' : 'text-gray-300'
                                                }`}
                                            >
                                                <div className="h-8 w-8 rounded-full bg-orange-600/20 border border-orange-500/30 flex items-center justify-center text-orange-400 text-sm shrink-0">
                                                    <FaAmbulance />
                                                </div>
                                                <div className="flex flex-col min-w-0">
                                                    <span className="font-bold text-xs truncate">{amb.name}</span>
                                                    <span className="text-[10px] text-gray-500">{amb.id}</span>
                                                </div>
                                            </Link>
                                        ))
                                    )}
                                </div>
                            )}
                        </div>
                    </div>

                    {/* User Info / Context indicator - Desktop */}
                    <div className="hidden lg:flex items-center gap-3 bg-gray-800/50 px-4 py-1.5 rounded-full border border-gray-700">
                        <button 
                            onClick={toggleRole}
                            className="text-gray-400 hover:text-blue-400 transition-colors p-1"
                            title="تبديل الصلاحيات (لغرض التجربة)"
                        >
                            <FaExchangeAlt className="text-sm" />
                        </button>
                        <div className="flex items-center gap-2">
                            <FaUserCircle className="text-gray-400 text-lg" />
                            <div className="flex flex-col">
                                <span className="text-xs font-bold text-white leading-tight">{user.name}</span>
                                <span className="text-[10px] text-blue-400 font-medium leading-tight">
                                    {user.role === 'SUPERVISOR' ? 'مشرف عام' : 'مدير مركز'}
                                </span>
                            </div>
                        </div>
                    </div>

                    {/* Mobile Role Switcher (Compact) */}
                    <div className="flex lg:hidden items-center mr-auto ml-2">
                        <button 
                            onClick={toggleRole}
                            className="bg-gray-800 p-2 rounded-lg text-blue-400 border border-gray-700 shadow-lg active:scale-95 transition-transform"
                            title="تبديل الصلاحيات"
                        >
                            <FaExchangeAlt className="text-sm" />
                        </button>
                    </div>

                    {/* Mobile Menu Button */}
                    <div className="md:hidden">
                        <button 
                            onClick={() => setIsMenuOpen(!isMenuOpen)}
                            className="bg-gray-800 p-2 rounded-lg text-gray-400 hover:text-white focus:outline-none transition-colors"
                        >
                            {isMenuOpen ? <FaTimes className="text-xl" /> : <FaBars className="text-xl" />}
                        </button>
                    </div>
                </div>
            </div>

            {/* Mobile Navigation Links */}
            {isMenuOpen && (
                <div className="md:hidden bg-gray-900 border-b border-gray-800 animate-slide-down shadow-2xl overflow-hidden" dir="rtl">
                    <div className="px-4 pt-2 pb-6 space-y-2">
                        {navLinks.map((link) => (
                            <Link 
                                key={link.to}
                                to={link.to} 
                                onClick={() => setIsMenuOpen(false)}
                                className={`flex items-center gap-3 px-4 py-4 rounded-xl font-bold transition-all ${
                                    location.pathname.includes(link.to) 
                                    ? `text-white ${link.color} border border-white/10` 
                                    : 'text-gray-400 hover:text-white hover:bg-gray-800'
                                }`}
                            >
                                <span className="text-xl">{link.icon}</span> 
                                <span className="text-base">{link.label}</span>
                            </Link>
                        ))}
                        {/* Mobile Ambulance Links */}
                        <div className="pt-1">
                            <div className="text-[10px] text-orange-400 font-bold uppercase tracking-widest px-4 mb-2">سيارات نشطة:</div>
                            {activeAmbulances.length === 0 ? (
                                <div className="px-4 py-3 text-gray-500 text-sm">لا توجد سيارات في مهمة</div>
                            ) : activeAmbulances.map(amb => (
                                <Link
                                    key={amb.id}
                                    to={`/driver/${amb.id}`}
                                    onClick={() => setIsMenuOpen(false)}
                                    className={`flex items-center gap-3 px-4 py-3 rounded-xl font-bold transition-all mb-1 ${
                                        location.pathname === `/driver/${amb.id}` ? 'text-white bg-orange-900/30 border border-white/10' : 'text-orange-300 hover:bg-orange-900/20'
                                    }`}
                                >
                                    <FaAmbulance className="text-orange-400 text-xl" />
                                    <div className="flex flex-col">
                                        <span className="text-sm">{amb.name}</span>
                                        <span className="text-[10px] text-gray-500">{amb.id}</span>
                                    </div>
                                </Link>
                            ))}
                        </div>
                    </div>
                </div>
            )}
        </nav>
    );
};

export default Navbar;
