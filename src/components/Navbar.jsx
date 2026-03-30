import { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { 
    FaUserShield, FaHistory, FaBars, FaTimes, 
    FaUserCircle, FaSignOutAlt, FaAmbulance, FaHospitalAlt, FaThLarge,
    FaPlus, FaArrowRight
} from 'react-icons/fa';
import { getCurrentUser, logout, getReports, getAmbulances } from '../services/db';
import appIcon from '../../public/Image/icon-180.png';

const Navbar = () => {
    const location = useLocation();
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const user = getCurrentUser();
    const navigate = useNavigate();
    
    // Reactively track active ambulances (dispatched and logic for badge if needed)
    const [activeAltCount, setActiveAltCount] = useState(0);
    useEffect(() => {
        const findActiveCount = () => {
            const allReports = getReports();
            const active = allReports.filter(r => 
                r.missionStatus !== 'pending' && 
                r.missionStatus !== 'تم إنهاء المهمة' && 
                !r.isFalseReport
            ).length;
            setActiveAltCount(active);
        };
        findActiveCount();
        const interval = setInterval(findActiveCount, 3000);
        return () => clearInterval(interval);
    }, []);

    const handleLogout = () => {
        logout();
        navigate('/login');
    };

    // Unified Link Management
    const navLinks = [
        { 
            to: "/dashboard", 
            label: "الرئيسية", 
            icon: <FaThLarge className="text-xl shrink-0" />, 
            roles: ['SUPERVISOR', 'CENTER_ADMIN'],
            desc: "لوحة التحكم والعمليات"
        },
        { 
            to: "/logs", 
            label: "سجل العمليات", 
            icon: <FaHistory className="text-xl shrink-0" />, 
            roles: ['SUPERVISOR', 'CENTER_ADMIN'],
            desc: "تاريخ البلاغات والحوادث"
        },
        { 
            to: "/admin/centers", 
            label: "إدارة المراكز", 
            icon: <FaHospitalAlt className="text-xl shrink-0" />, 
            roles: ['SUPERVISOR'],
            desc: "إضافة وحذف مراكز المحافظة"
        },
        { 
            to: "/admin/drivers", 
            label: "حسابات العربات", 
            icon: <FaAmbulance className="text-xl shrink-0" />, 
            roles: ['SUPERVISOR', 'CENTER_ADMIN'],
            desc: "إدارة المسعفين والعربات"
        },
        { 
            to: "/admin/permissions", 
            label: "الصلاحيات", 
            icon: <FaUserShield className="text-xl shrink-0" />, 
            roles: ['SUPERVISOR'],
            desc: "إعدادات الدخول والأمان"
        }
    ].filter(link => !link.roles || link.roles.includes(user?.role));

    const isActive = (path) => location.pathname === path;

    return (
        <nav className="sticky top-0 z-30 w-full transition-all duration-300 backdrop-blur-xl bg-gray-900/80 border-b border-gray-800 shadow-[0_4px_30px_rgba(0,0,0,0.4)]">
            <div className="max-w-7xl mx-auto px-3 sm:px-6 md:px-8">
                <div className="flex justify-between items-center h-16 sm:h-20 md:h-24">
                    
                    {/* Brand / Logo Section */}
                    <Link 
                        to="/" 
                        className="flex items-center gap-2 sm:gap-3 group transition-transform active:scale-95 shrink-0" 
                        dir="rtl"
                    >
                        <div className="relative">
                            <div className="absolute -inset-1 bg-red-600 rounded-2xl blur opacity-25 group-hover:opacity-50 transition-opacity"></div>
                            <div className="relative bg-gray-900/50 p-1.5 sm:p-2 md:p-3 rounded-2xl border border-red-500/30 flex items-center justify-center backdrop-blur-md">
                                <img 
                                    src={appIcon} 
                                    alt="طوارئ" 
                                    className="h-8 w-8 sm:h-10 sm:w-10 md:h-12 md:w-12 object-contain drop-shadow-2xl brightness-110" 
                                />
                            </div>
                        </div>
                        <div className="flex flex-col">
                            <span className="font-black text-lg sm:text-xl md:text-2xl text-white tracking-tighter leading-none">طوارئ</span>
                            <span className="text-[8px] sm:text-[10px] md:text-xs font-black text-red-500 uppercase tracking-widest mt-0.5 sm:mt-1">الإسعاف الذكي</span>
                        </div>
                    </Link>

                    {/* Desktop Navigation - Middle Links (Visible on lg+) */}
                    <div className="hidden lg:flex items-center space-x-1 space-x-reverse" dir="rtl">
                        {navLinks.map((link) => {
                            const active = isActive(link.to);
                            return (
                                <Link 
                                    key={link.to}
                                    to={link.to} 
                                    className={`relative px-3 lg:px-5 py-3 rounded-2xl flex items-center gap-2 transition-all duration-500 group overflow-hidden ${
                                        active 
                                        ? 'text-white bg-blue-600 shadow-[0_10px_25px_-5px_rgba(37,99,235,0.4)]' 
                                        : 'text-gray-400 hover:text-white hover:bg-gray-800'
                                    }`}
                                >
                                    <span className={`transition-transform duration-500 group-hover:scale-110 ${active ? 'text-white' : 'group-hover:text-blue-400'}`}>
                                        {link.icon}
                                    </span>
                                    <span className="font-black text-sm lg:text-base tracking-tight">{link.label}</span>
                                    
                                    {!active && (
                                        <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-0 h-1 bg-blue-500 transition-all duration-300 group-hover:w-1/2 rounded-t-full"></div>
                                    )}
                                </Link>
                            );
                        })}
                    </div>

                    {/* Right Section - Profile & Login/Logout (Adaptive md+) */}
                    <div className="hidden sm:flex items-center gap-3 md:gap-4" dir="rtl">
                        
                        {/* Profile Bar (Visible on md+) */}
                        <div className="h-12 md:h-14 bg-gray-800/40 border border-gray-700/50 px-3 md:px-4 rounded-xl md:rounded-2xl flex items-center gap-2 md:gap-4 backdrop-blur-md shadow-inner group hover:border-gray-600 transition-all">
                            <div className="relative shrink-0">
                                <div className="h-8 w-8 md:h-10 md:w-10 rounded-lg md:rounded-xl bg-blue-600/20 border border-blue-500/30 flex items-center justify-center text-blue-400 group-hover:scale-105 transition-transform">
                                    <FaUserCircle className="text-xl md:text-2xl" />
                                </div>
                                <div className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-green-500 border-2 border-gray-800 rounded-full"></div>
                            </div>
                            
                            <div className="hidden md:flex flex-col min-w-[80px] lg:min-w-[100px]">
                                <span className="text-xs md:text-sm font-black text-white leading-none mb-1 truncate">{user?.name}</span>
                                <span className="text-[8px] md:text-[10px] text-blue-400 font-black uppercase tracking-tighter px-1 rounded bg-blue-400/10 w-fit">
                                    {user?.role === 'SUPERVISOR' ? 'مشرف' : 'مدير'}
                                </span>
                            </div>

                            {/* Divider and Logout button inside the box for Tablet/Desktop */}
                            <div className="w-px h-6 md:h-8 bg-gray-700 mx-0.5 md:mx-1"></div>
                            <button 
                                onClick={handleLogout}
                                className="group/btn h-8 w-8 md:h-10 md:w-10 bg-red-900/10 hover:bg-red-600 text-red-500 hover:text-white rounded-lg md:rounded-xl border border-red-500/10 transition-all flex items-center justify-center shadow-lg active:scale-90 shrink-0"
                                title="خروج"
                            >
                                <FaSignOutAlt className="text-sm md:text-base group-hover/btn:rotate-180 transition-transform duration-500" />
                            </button>
                        </div>

                        {/* Mobile/Tablet Menu Button (Visible on < lg) */}
                        <button 
                            onClick={() => setIsMenuOpen(!isMenuOpen)}
                            className={`lg:hidden w-10 h-10 sm:w-12 sm:h-12 flex items-center justify-center rounded-xl sm:rounded-2xl transition-all duration-300 border-2 ${
                                isMenuOpen 
                                ? 'bg-blue-600 border-blue-400 text-white rotate-90' 
                                : 'bg-gray-800 border-gray-700 text-gray-400'
                            }`}
                        >
                            {isMenuOpen ? <FaTimes className="text-xl" /> : <FaBars className="text-xl" />}
                        </button>
                    </div>

                    {/* Mobile-Only Actions Section (Logo only visible here on small screens < sm) */}
                    <div className="flex sm:hidden items-center gap-2" dir="rtl">
                       <button 
                            onClick={() => setIsMenuOpen(!isMenuOpen)}
                            className={`w-10 h-10 flex items-center justify-center rounded-xl transition-all duration-300 border-2 ${
                                isMenuOpen 
                                ? 'bg-blue-600 border-blue-400 text-white rotate-90' 
                                : 'bg-gray-800 border-gray-700 text-gray-400 font-black'
                            }`}
                        >
                            {isMenuOpen ? <FaTimes className="text-lg" /> : <FaBars className="text-lg" />}
                        </button>
                    </div>
                </div>
            </div>

            {/* Mobile Navigation Drawer - Premium Style */}
            <div className={`lg:hidden fixed inset-0 top-[64px] sm:top-[80px] md:top-[96px] z-[90] transition-all duration-500 ease-in-out ${
                isMenuOpen ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-full pointer-events-none'
            }`} dir="rtl">
                {/* Backdrop Overlay */}
                <div className="absolute inset-0 bg-black/60 backdrop-blur-md" onClick={() => setIsMenuOpen(false)}></div>
                
                {/* Drawer Content */}
                <div className="absolute top-0 inset-x-0 bg-gray-900 border-b border-gray-800 p-4 space-y-4 shadow-2xl rounded-b-[2.5rem]">
                    
                    {/* Compact Profile Info in Drawer (Visible on < md) */}
                    <div className="flex md:hidden items-center gap-4 bg-gray-800/80 p-5 rounded-3xl border border-gray-700 shadow-inner">
                        <div className="w-14 h-14 rounded-2xl bg-blue-600 shadow-lg shadow-blue-900/40 flex items-center justify-center text-white shrink-0">
                            <FaUserCircle className="text-3xl" />
                        </div>
                        <div className="flex flex-col">
                            <span className="text-lg font-black text-white">{user?.name}</span>
                            <div className="flex items-center gap-2 mt-1">
                                <span className="text-[10px] text-blue-400 font-bold tracking-widest uppercase bg-blue-400/10 px-2 py-0.5 rounded">
                                    {user?.role === 'SUPERVISOR' ? 'مشرف عام' : 'مدير عمليات'}
                                </span>
                                <button 
                                    onClick={handleLogout}
                                    className="text-red-500 text-xs font-black hover:underline flex items-center gap-1"
                                >
                                    <FaSignOutAlt /> خروج
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* Navigation Links in Drawer */}
                    <div className="grid grid-cols-1 gap-2">
                        {navLinks.map((link) => {
                            const active = isActive(link.to);
                            return (
                                <Link 
                                    key={link.to}
                                    to={link.to} 
                                    onClick={() => setIsMenuOpen(false)}
                                    className={`flex items-center justify-between p-4 rounded-2xl transition-all border ${
                                        active 
                                        ? 'bg-blue-600 border-blue-400 text-white shadow-xl' 
                                        : 'bg-gray-800/40 border-gray-700/50 text-gray-400 hover:bg-gray-800'
                                    }`}
                                >
                                    <div className="flex items-center gap-4">
                                        <div className={`p-2.5 rounded-xl ${active ? 'bg-white/20' : 'bg-gray-900/50 text-blue-400'} border border-white/10`}>
                                            {link.icon}
                                        </div>
                                        <div className="flex flex-col text-right">
                                            <span className="font-black text-base">{link.label}</span>
                                            <span className={`text-[10px] ${active ? 'text-blue-100 opacity-80' : 'text-gray-500'}`}>{link.desc}</span>
                                        </div>
                                    </div>
                                    <FaArrowRight className="text-xs rotate-180 opacity-40 shrink-0" />
                                </Link>
                            );
                        })}
                    </div>

                    {/* Floating Status / Info Footer */}
                    <div className="pt-2 pb-2">
                        <div className="flex items-center justify-center gap-2 text-[10px] font-black text-gray-600 uppercase tracking-widest">
                            <div className="w-1 h-1 rounded-full bg-blue-600 animate-ping"></div>
                            نظام طوارئ الإسعاف الموحد • {new Date().getFullYear()}
                        </div>
                    </div>
                </div>
            </div>
        </nav>
    );
};

export default Navbar;
