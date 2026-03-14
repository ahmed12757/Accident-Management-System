import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { FaAmbulance, FaUserShield, FaExclamationTriangle, FaHistory, FaBars, FaTimes, FaUserCircle, FaExchangeAlt } from 'react-icons/fa';
import { getCurrentUser, setCurrentUser, INITIAL_USERS } from '../services/db';

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
    
    const navLinks = [
        { 
            to: "/dashboard", 
            label: user.role === 'SUPERVISOR' ? "إدارة المراكز (المشرف)" : "إدارة المركز المحلي", 
            icon: <FaUserShield />, 
            color: "bg-blue-900/30", 
            activeColor: "text-white bg-blue-900/40" 
        },
        { to: "/paramedic/REP-9955", label: "مهمة نشطة (السائق)", icon: <FaAmbulance />, color: "bg-orange-900/30", activeColor: "text-white bg-orange-900/40" },
        { to: "/logs", label: "سجل البلاغات", icon: <FaHistory />, color: "bg-purple-900/30", activeColor: "text-white bg-purple-900/40" }
    ];

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
                    </div>
                </div>
            )}
        </nav>
    );
};

export default Navbar;
