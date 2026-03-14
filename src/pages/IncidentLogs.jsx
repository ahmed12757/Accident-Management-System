import { useState, useEffect } from 'react';
import { getReports, getCenters, getAmbulances, getCurrentUser } from '../services/db';
import { FaHistory, FaFilter, FaEye, FaSearch } from 'react-icons/fa';
import ReportDetails from './ReportDetails';

const IncidentLogs = () => {
    const [reports, setReports] = useState([]);
    const [centers, setCenters] = useState([]);
    const [ambulances, setAmbulances] = useState([]);
    
    // Filtering state
    const [filterStatus, setFilterStatus] = useState('all');
    const [filterCenter, setFilterCenter] = useState('all');
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
            (filterStatus === 'active' && r.missionStatus !== 'تم إنهاء المهمة');
            
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
                <div className="flex items-center gap-3">
                    <FaHistory className="text-blue-500 text-3xl" />
                    <div>
                        <h1 className="text-2xl font-bold text-white">سجل البلاغات والمهام</h1>
                        <p className="text-gray-400 text-sm mt-1">عرض الأرشيف وتاريخ الحوادث لكافة المراكز</p>
                    </div>
                </div>

                {/* Filters */}
                <div className="flex flex-wrap gap-3 items-center w-full md:w-auto">
                    <div className="relative">
                        <FaSearch className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500" />
                        <input 
                            type="text" 
                            placeholder="بحث بالاسم، الهوية، الجوال..." 
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="bg-gray-800 text-white pl-4 pr-10 py-2 rounded-lg border border-gray-700 focus:outline-none focus:border-blue-500 w-full md:w-64"
                        />
                    </div>
                    <select 
                        className="bg-gray-800 text-white p-2 rounded-lg border border-gray-700 focus:outline-none"
                        value={filterStatus}
                        onChange={(e) => setFilterStatus(e.target.value)}
                    >
                        <option value="all">كافة الحالات</option>
                        <option value="active">المهام النشطة</option>
                        <option value="completed">المهام المكتملة</option>
                    </select>
                    {user?.role === 'SUPERVISOR' && (
                        <select 
                            className="bg-gray-800 text-white p-2 rounded-lg border border-gray-700 focus:outline-none"
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
                        <thead className="bg-gray-800 text-gray-400 text-sm uppercase">
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
                                <tr key={report.id} className="hover:bg-gray-800/50 transition-colors">
                                    <td className="px-6 py-4">
                                        <div className="font-bold text-white mb-1">{report.sender?.fullName || 'مجهول'}</div>
                                        <div className="text-xs font-mono text-gray-500">ID: #{report.id}</div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-400">
                                        {new Date(report.timestamp).toLocaleString('ar-SA')}
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
                                            report.missionStatus === 'pending' ? 'bg-red-900/30 border-red-500/50 text-red-400' : 
                                            report.missionStatus === 'تم إنهاء المهمة' ? 'bg-green-900/30 border-green-500/50 text-green-400' :
                                            'bg-blue-900/30 border-blue-500/50 text-blue-400'
                                        }`}>
                                            {report.missionStatus === 'pending' ? 'بانتظار سيارة' : report.missionStatus}
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
                                    <div className="font-black text-white text-lg">{report.sender?.fullName || 'مجهول'}</div>
                                    <div className="text-xs font-mono text-gray-500">ID: #{report.id}</div>
                                </div>
                                <span className={`px-3 py-1 rounded-full text-[10px] font-black border uppercase ${
                                    report.missionStatus === 'pending' ? 'bg-red-900/30 border-red-500/50 text-red-400' : 
                                    report.missionStatus === 'تم إنهاء المهمة' ? 'bg-green-900/30 border-green-500/50 text-green-400' :
                                    'bg-blue-900/30 border-blue-500/50 text-blue-400'
                                }`}>
                                    {report.missionStatus === 'pending' ? 'بانتظار سيارة' : report.missionStatus}
                                </span>
                            </div>

                            <div className="grid grid-cols-2 gap-4 text-xs font-medium">
                                <div className="space-y-1">
                                    <div className="text-gray-500 uppercase tracking-tighter">التاريخ والوقت</div>
                                    <div className="text-gray-300">{new Date(report.timestamp).toLocaleString('ar-SA')}</div>
                                </div>
                                <div className="space-y-1">
                                    <div className="text-gray-500 uppercase tracking-tighter">المركز المنتدب</div>
                                    <div className="text-gray-300">{getCenterName(report.assignedCenterId)}</div>
                                </div>
                                <div className="space-y-1">
                                    <div className="text-gray-500 uppercase tracking-tighter">المُدة الإجمالية</div>
                                    <div className="text-gray-300">{getDuration(report)}</div>
                                </div>
                                <div className="space-y-2">
                                    <div className="text-gray-500 uppercase tracking-tighter">سيارات الإسعاف</div>
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
