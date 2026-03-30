import { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { getReports, getCenters, getAmbulances, getCurrentUser } from '../services/db';
import { FaHistory, FaFilter, FaEye, FaSearch, FaUserCircle, FaVideo, FaFileExport, FaClock, FaExclamationCircle, FaCheckCircle, FaAmbulance } from 'react-icons/fa';
import ReportDetails from './ReportDetails';

const IncidentLogs = () => {
    const location = useLocation();
    const [reports, setReports] = useState([]);
    const [centers, setCenters] = useState([]);
    const [ambulances, setAmbulances] = useState([]);
    
    // Filtering state
    const [filterStatus, setFilterStatus] = useState('all');
    const [filterCenter, setFilterCenter] = useState(location.state?.filterCenter || 'all');
    const [searchQuery, setSearchQuery] = useState('');
    
    const [selectedReportForDetails, setSelectedReportForDetails] = useState(null);
    const [user, setUser] = useState(null);

    const loadData = () => {
        const currentUser = getCurrentUser();
        setUser(currentUser);
        
        let allReports = getReports();
        let allCenters = getCenters();
        
        if (currentUser.role === 'CENTER_ADMIN') {
            allReports = allReports.filter(r => r.assignedCenterId === currentUser.centerId || r.involvedCenterIds?.includes(currentUser.centerId));
            allCenters = allCenters.filter(c => c.id === currentUser.centerId);
            if (filterCenter !== currentUser.centerId) {
                setFilterCenter(currentUser.centerId);
            }
        }

        setReports(allReports.sort((a,b) => new Date(b.timestamp) - new Date(a.timestamp)));
        setCenters(allCenters);
        setAmbulances(getAmbulances());
    };

    useEffect(() => {
        loadData();
        // Setup polling to catch status changes implicitly
        const interval = setInterval(loadData, 5000);
        return () => clearInterval(interval);
    }, []);

    const filteredReports = reports.filter(r => {
        const matchStatus = filterStatus === 'all' || 
            (filterStatus === 'completed' && r.missionStatus === 'تم إنهاء المهمة') ||
            (filterStatus === 'active' && r.missionStatus !== 'تم إنهاء المهمة' && !r.isFalseReport) ||
            (filterStatus === 'false' && r.isFalseReport);
            
        const matchCenter = filterCenter === 'all' || r.assignedCenterId === filterCenter;
        
        const searchMatches = searchQuery === '' || 
            r.id.toLowerCase().includes(searchQuery.toLowerCase()) || 
            r.sender?.nationalId?.includes(searchQuery) ||
            r.sender?.fullName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
            r.sender?.phone?.includes(searchQuery);

        return matchStatus && matchCenter && searchMatches;
    });

    const getAmbulanceName = (ambulanceId) => {
        if (!ambulanceId) return 'لم يُكلف';
        const amb = ambulances.find(a => a.id === ambulanceId);
        return amb ? amb.name : 'مجهول';
    };

    const getCenterName = (centerId) => {
        const c = centers.find(c => c.id === centerId);
        return c ? c.name : 'مجهول';
    };

    const getDuration = (report) => {
        if (!report.dispatchTime || !report.completedAt) return '-';
        const start = new Date(report.dispatchTime);
        const end = new Date(report.completedAt);
        const diffInMs = end - start;
        const minutes = Math.floor(diffInMs / 60000);
        return `${minutes} دقيقة`;
    };

    return (
        <div className="p-3 md:p-6 max-w-7xl mx-auto flex flex-col gap-4 md:gap-6" dir="rtl">
            <div className="flex flex-col md:flex-row justify-between items-center gap-4 bg-gray-900 border border-gray-700 p-6 rounded-2xl shadow-lg">
                <div className="flex items-center gap-3 w-full md:w-auto">
                    <FaHistory className="text-blue-500 text-3xl" />
                    <div>
                        <h1 className="text-2xl font-bold text-white">سجل البلاغات والمهام</h1>
                        <p className="text-gray-400 text-sm mt-1">عرض الأرشيف وتاريخ الحوادث لكافة المراكز</p>
                    </div>
                </div>

                {/* Filters */}
                <div className="flex flex-col sm:flex-row gap-3 items-center w-full md:w-auto">
                    <div className="relative w-full sm:w-64">
                        <FaSearch className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500" />
                        <input 
                            type="text" 
                            placeholder="بحث بالاسم، الهوية، الجوال..." 
                            className="w-full bg-gray-800 border border-gray-700 rounded-xl py-2 pr-10 pl-3 text-white focus:outline-none focus:border-blue-500"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                        />
                    </div>
                    
                    <div className="flex gap-2 w-full sm:w-auto overflow-x-auto pb-1 no-scrollbar">
                        {['all', 'active', 'completed', 'false'].map((status) => (
                            <button
                                key={status}
                                onClick={() => setFilterStatus(status)}
                                className={`px-4 py-2 rounded-xl text-sm font-bold transition-all whitespace-nowrap border ${
                                    filterStatus === status 
                                    ? 'bg-blue-600 border-blue-500 text-white shadow-lg shadow-blue-900/40' 
                                    : 'bg-gray-800 border-gray-700 text-gray-400 hover:text-white hover:bg-gray-700'
                                }`}
                            >
                                {status === 'all' ? 'الكل' : 
                                 status === 'active' ? 'نشط حالياً' : 
                                 status === 'completed' ? 'تم إنهاؤه' : 'بلاغات كاذبة'}
                            </button>
                        ))}
                    </div>
                    {user?.role === 'SUPERVISOR' && (
                        <select 
                            className="bg-gray-800 text-white p-2 rounded-lg border border-gray-700 focus:outline-none w-full sm:w-auto"
                            value={filterCenter}
                            onChange={(e) => setFilterCenter(e.target.value)}
                        >
                            <option value="all">كافة المراكز</option>
                            {centers.map(c => (
                                <option key={c.id} value={c.id}>{c.name}</option>
                            ))}
                        </select>
                    )}
                </div>
            </div>

            {/* Logs List - Desktop Table & Mobile Cards */}
            <div className="bg-gray-900 border border-gray-700 rounded-2xl shadow-lg overflow-hidden">
                {/* Desktop View */}
                <div className="hidden md:block overflow-x-auto">
                    <table className="w-full text-right text-gray-300">
                        <thead className="bg-gray-800 text-gray-400 text-sm">
                            <tr>
                                <th className="px-6 py-4 border-b border-gray-700 font-semibold">المُبلّغ / رقم البلاغ</th>
                                <th className="px-6 py-4 border-b border-gray-700 font-semibold">التاريخ والوقت</th>
                                <th className="px-6 py-4 border-b border-gray-700 font-semibold">المركز المكلف</th>
                                <th className="px-6 py-4 border-b border-gray-700 font-semibold">الإسعاف</th>
                                <th className="px-6 py-4 border-b border-gray-700 font-semibold">المُدة</th>
                                <th className="px-6 py-4 border-b border-gray-700 font-semibold">الحالة</th>
                                <th className="px-6 py-4 border-b border-gray-700 font-semibold text-center">الإجراءات</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-800">
                            {filteredReports.map(report => (
                                <tr key={report.id} className={`hover:bg-gray-800/50 transition-colors ${report.isFalseReport ? 'bg-red-900/5 opacity-80' : ''}`}>
                                    <td className="px-6 py-4">
                                        <div className="font-bold text-white mb-1">
                                            {report.source === 'automated' ? `وحدة رصد: ${report.cameraId}` : (report.sender?.fullName || 'مُبلّغ مجهول')}
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <span className="text-xs font-mono text-gray-500">رقم البلاغ: #{report.id}</span>
                                            <span className={`text-[9px] px-1.5 py-0.5 rounded border ${
                                                report.source === 'automated' ? 'bg-purple-900/20 border-purple-500/30 text-purple-400' : 'bg-blue-900/20 border-blue-500/30 text-blue-400'
                                            }`}>
                                                {report.source === 'automated' ? 'رصد آلي' : 'تطبيق'}
                                            </span>
                                            {report.subReports?.length > 0 && (
                                                <span className="text-[9px] px-1.5 py-0.5 rounded border bg-orange-900/20 border-orange-500/30 text-orange-400 font-bold">
                                                    +{report.subReports.length} بلاغات متكررة
                                                </span>
                                            )}
                                            {report.isFalseReport && (
                                                <span className="text-[9px] px-1.5 py-0.5 rounded border bg-red-900/20 border-red-500/30 text-red-500 font-bold">
                                                    بلاغ كاذب
                                                </span>
                                            )}
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-400">
                                        {new Date(report.timestamp).toLocaleString('ar-EG')}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <span className="bg-gray-800 px-3 py-1 rounded text-sm border border-gray-700">
                                            {getCenterName(report.assignedCenterId)}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 text-sm">
                                        {report.ambulanceIds && report.ambulanceIds.length > 0 
                                            ? <div className="flex flex-col gap-1">
                                                {report.ambulanceIds.map(id => (
                                                    <span key={id} className="bg-blue-900/20 text-blue-300 px-2 py-0.5 rounded border border-blue-500/20 text-xs inline-block w-fit">
                                                        {getAmbulanceName(id)}
                                                    </span>
                                                ))}
                                              </div>
                                            : <span className="text-gray-500 italic">بانتظار الإرسال</span>}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">
                                        {getDuration(report)}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <span className={`px-3 py-1 rounded-full text-xs font-bold border inline-block ${
                                            report.isFalseReport ? 'bg-gray-700 border-gray-500 text-gray-400' :
                                            report.missionStatus === 'pending' ? 'bg-red-900/30 border-red-500/50 text-red-400' : 
                                            report.missionStatus === 'تم إنهاء المهمة' ? 'bg-green-900/30 border-green-500/50 text-green-400' :
                                            'bg-blue-900/30 border-blue-500/50 text-blue-400'
                                        }`}>
                                            {report.isFalseReport ? 'بلاغ كاذب' : (report.missionStatus === 'pending' ? 'بانتظار سيارة' : report.missionStatus)}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-center">
                                        <button 
                                            onClick={() => setSelectedReportForDetails(report)}
                                            className="text-blue-400 hover:text-blue-300 bg-blue-900/20 hover:bg-blue-900/40 p-2 rounded transition-colors inline-block"
                                            title="عرض التفاصيل"
                                        >
                                            <FaEye />
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                {/* Mobile View - Cards */}
                <div className="md:hidden divide-y divide-gray-800">
                    {filteredReports.map(report => (
                        <div key={report.id} className="p-5 space-y-4 hover:bg-gray-800/30 transition-colors">
                            <div className="flex justify-between items-start">
                                <div>
                                    <div className="font-black text-white text-lg">
                                        {report.source === 'automated' ? `وحدة رصد: ${report.cameraId}` : (report.sender?.fullName || 'مُبلّغ مجهول')}
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <span className="text-xs font-mono text-gray-500">رقم البلاغ: #{report.id}</span>
                                        <span className={`text-[9px] px-1.5 py-0.5 rounded border ${
                                            report.source === 'automated' ? 'bg-purple-900/20 border-purple-500/30 text-purple-400' : 'bg-blue-900/20 border-blue-500/30 text-blue-400'
                                        }`}>
                                            {report.source === 'automated' ? 'رصد آلي' : 'تطبيق'}
                                        </span>
                                        {report.subReports?.length > 0 && (
                                            <span className="text-[9px] px-1.5 py-0.5 rounded border bg-orange-900/20 border-orange-500/30 text-orange-400 font-bold">
                                                +{report.subReports.length} بلاغات متكررة
                                            </span>
                                        )}
                                    </div>
                                </div>
                                <span className={`px-3 py-1 rounded-full text-[10px] font-black border ${
                                    report.missionStatus === 'pending' ? 'bg-red-900/30 border-red-500/50 text-red-400' : 
                                    report.missionStatus === 'تم إنهاء المهمة' ? 'bg-green-900/30 border-green-500/50 text-green-400' :
                                    'bg-blue-900/30 border-blue-500/50 text-blue-400'
                                }`}>
                                    {report.missionStatus === 'pending' ? 'بانتظار سيارة' : report.missionStatus}
                                </span>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs font-medium">
                                <div className="space-y-1">
                                    <div className="text-gray-500">التاريخ والوقت</div>
                                    <div className="text-gray-300">{new Date(report.timestamp).toLocaleString('ar-EG')}</div>
                                </div>
                                <div className="space-y-1">
                                    <div className="text-gray-500">المركز المنتدب</div>
                                    <div className="text-gray-300">{getCenterName(report.assignedCenterId)}</div>
                                </div>
                                <div className="space-y-1">
                                    <div className="text-gray-500">المُدة الإجمالية</div>
                                    <div className="text-gray-300">{getDuration(report)}</div>
                                </div>
                                <div className="space-y-2">
                                    <div className="text-gray-500">سيارات الإسعاف</div>
                                    <div className="flex flex-wrap gap-1">
                                        {report.ambulanceIds && report.ambulanceIds.length > 0 
                                            ? report.ambulanceIds.map(id => (
                                                <span key={id} className="bg-blue-900/20 text-blue-300 px-2 py-0.5 rounded border border-blue-500/20 text-[10px]">
                                                    {getAmbulanceName(id)}
                                                </span>
                                              ))
                                            : <span className="text-gray-600 italic">لا يوجد</span>}
                                    </div>
                                </div>
                            </div>

                            <button 
                                onClick={() => setSelectedReportForDetails(report)}
                                className="w-full flex items-center justify-center gap-2 py-3 bg-blue-600/10 hover:bg-blue-600/20 text-blue-400 rounded-xl border border-blue-500/20 transition-all font-bold"
                            >
                                <FaEye /> عرض كافة تفاصيل الحادث
                            </button>
                        </div>
                    ))}
                </div>

                {filteredReports.length === 0 && (
                    <div className="px-6 py-12 text-center text-gray-500 bg-gray-900/50 backdrop-blur-sm">
                        <FaFilter className="text-4xl mx-auto mb-4 opacity-10" />
                        <p>لا توجد بلاغات مسجلة تطابق شروط البحث الحالية.</p>
                    </div>
                )}
            </div>

            {/* Details Modal Re-use */}
            {selectedReportForDetails && (
                <ReportDetails 
                    report={selectedReportForDetails} 
                    onClose={() => setSelectedReportForDetails(null)} 
                />
            )}
        </div>
    );
};

export default IncidentLogs;
