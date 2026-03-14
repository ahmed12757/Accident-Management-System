import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { getCenters, getReports, getAmbulances, getCurrentUser } from '../services/db';
import { dispatchMultipleAmbulances, updateMissionTracker, transferReportToNearestCenter } from '../services/ambulanceService';
import { integrateExternalAPI } from '../services/api';
import { FaUserMd, FaMapMarkedAlt, FaClock, FaCheck, FaExclamationCircle, FaEye, FaAmbulance, FaExclamationTriangle, FaCheckCircle } from 'react-icons/fa';
import MapComponent from '../components/MapComponent';
import ReportDetails from './ReportDetails';

const CenterDashboard = () => {
    const [centers, setCenters] = useState([]);
    const [currentCenterId, setCurrentCenterId] = useState('');
    const [reports, setReports] = useState([]);
    const [ambulances, setAmbulances] = useState([]);
    const [selectedReportForDetails, setSelectedReportForDetails] = useState(null);
    const [selectedAmbulancesMap, setSelectedAmbulancesMap] = useState({}); // { reportId: [ambId, ambId] }
    const [user, setUser] = useState(null);

    const loadData = () => {
        const currentUser = getCurrentUser();
        setUser(currentUser);
        
        let allCenters = getCenters();
        
        // Isolation logic: If Center Admin, only show their center
        if (currentUser.role === 'CENTER_ADMIN') {
            allCenters = allCenters.filter(c => c.id === currentUser.centerId);
            if (currentCenterId !== currentUser.centerId) {
                setCurrentCenterId(currentUser.centerId);
            }
        }
        
        setCenters(allCenters);
        const allReports = getReports();
        const allAmbulances = getAmbulances();
        
        if (currentCenterId) {
            setReports(
                allReports
                    .filter(r => (r.assignedCenterId === currentCenterId || r.involvedCenterIds?.includes(currentCenterId)) && r.missionStatus !== 'تم إنهاء المهمة')
                    .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
            );
            setAmbulances(allAmbulances.filter(a => a.centerId === currentCenterId));
        } else {
            setReports([]);
            setAmbulances([]);
        }
    };

    useEffect(() => {
        loadData();
        // Setup polling to simulate real-time updates within the DB
        const interval = setInterval(loadData, 3000);
        
        // Setup External API Integration (Webhook / Simulation from User App)
        const cleanupExternalAPI = integrateExternalAPI((newReportResult) => {
            // A new report has arrived! Let's force a reload.
            // In a real app we might play a sound or show a generic Toast notification here.
            loadData();
        });

        return () => {
            clearInterval(interval);
            cleanupExternalAPI(); // Unmount listener
        };
    }, [currentCenterId]);

    // Set default center on load if none selected
    useEffect(() => {
        const currentUser = getCurrentUser();
        if (currentUser.role === 'CENTER_ADMIN') {
            setCurrentCenterId(currentUser.centerId);
        } else if (centers.length > 0 && !currentCenterId) {
            setCurrentCenterId(centers[0].id);
        }
    }, [centers]);

    const handleDispatch = (reportId) => {
        const selectedIds = selectedAmbulancesMap[reportId] || [];
        if (selectedIds.length === 0) return alert('الرجاء تحديد سيارة إسعاف واحدة على الأقل');
        
        dispatchMultipleAmbulances(reportId, selectedIds);
        
        // Clear selection
        setSelectedAmbulancesMap(prev => {
            const newMap = {...prev};
            delete newMap[reportId];
            return newMap;
        });

        loadData(); // Force immediate refresh
    };

    const handleStatusUpdate = (reportId, newStatus) => {
        updateMissionTracker(reportId, newStatus);
        loadData();
    };

    const handleTransfer = (reportId) => {
        const newCenter = transferReportToNearestCenter(reportId, currentCenterId);
        if (newCenter) {
            alert(`تم طلب الإمداد بنجاح! المركز المعاون: ${newCenter.name}`);
            loadData();
        } else {
            alert('للأسف، لا توجد مراكز أخرى متاحة لطلب الإمداد!');
        }
    };

    const toggleAmbulanceSelection = (reportId, ambId) => {
        setSelectedAmbulancesMap(prev => {
            const currentSelected = prev[reportId] || [];
            if (currentSelected.includes(ambId)) {
                return { ...prev, [reportId]: currentSelected.filter(id => id !== ambId) };
            } else {
                return { ...prev, [reportId]: [...currentSelected, ambId] };
            }
        });
    };

    const availableAmbulances = ambulances.filter(a => a.status === 'متاحة');

    return (
        <div className="p-3 md:p-6 max-w-7xl mx-auto flex flex-col gap-4 md:gap-6" dir="rtl">
            {/* Header / Center Selection */}
            <div className="bg-gray-800 border border-gray-700 rounded-2xl p-3 md:p-6 flex flex-col md:flex-row justify-between items-start md:items-center shadow-lg gap-4 md:gap-6">
                <div className="flex items-center gap-4">
                    <div className="bg-blue-600/20 p-3 md:p-4 rounded-2xl border border-blue-500/30">
                        <FaUserMd className="text-blue-400 text-2xl md:text-3xl" />
                    </div>
                    <div>
                        <h2 className="text-xl md:text-2xl font-black text-white tracking-tight">
                            {user?.role === 'SUPERVISOR' ? 'لوحة تحكم المشرف العام' : `إدارة ${centers.find(c => c.id === currentCenterId)?.name || 'المركز'}`}
                        </h2>
                        <p className="text-xs md:text-sm text-gray-400 font-medium opacity-70">
                            {user?.role === 'SUPERVISOR' ? 'إدارة البلاغات وسيارات الإسعاف المركزية' : 'إدارة المهمات والسيارات التابعة للمركز'}
                        </p>
                    </div>
                </div>
                
                {user?.role === 'SUPERVISOR' && (
                    <div className="w-full md:w-auto min-w-0 md:min-w-[300px]">
                        <label className="block text-[10px] text-blue-400 font-bold uppercase tracking-widest mb-2 mr-1">المركز المختار</label>
                        <select 
                            className="bg-gray-900 border-2 border-gray-700 hover:border-blue-500/50 text-white text-base md:text-lg rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 block w-full p-3 transition-all cursor-pointer appearance-none shadow-inner"
                            value={currentCenterId}
                            onChange={(e) => setCurrentCenterId(e.target.value)}
                        >
                            <option value="" disabled>اختر المركز الإقليمي...</option>
                            {centers.map(c => (
                                <option key={c.id} value={c.id}>{c.name}</option>
                            ))}
                        </select>
                    </div>
                )}
            </div>

            {/* Map Area */}
            {currentCenterId && (
                <div className="w-full">
                    <MapComponent 
                        centerLocation={centers.find(c => c.id === currentCenterId)?.location} 
                        incidents={reports} 
                        ambulances={ambulances} 
                    />
                </div>
            )}

            <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
                
                {/* Ambulances Status Panel */}
                <div className="xl:col-span-1 border border-gray-700 bg-gray-800/80 rounded-xl shadow-xl flex flex-col">
                    <div className="p-4 border-b border-gray-700 bg-gray-900/50 rounded-t-xl">
                        <h3 className="text-lg font-bold text-white flex items-center gap-2">
                            سيارات الإسعاف المركزية
                            <span className="bg-gray-700 text-gray-300 text-xs py-1 px-2 rounded-full">{ambulances.length}</span>
                        </h3>
                    </div>
                    <div className="p-4 flex-1 overflow-auto space-y-3">
                        {ambulances.map(amb => (
                            <div key={amb.id} className="bg-gray-900 border border-gray-700 p-3 rounded-lg flex justify-between items-center">
                                <span className="font-bold text-gray-200">{amb.name}</span>
                                <span className={`px-3 py-1 rounded-full text-xs font-bold border ${
                                    amb.status === 'متاحة' ? 'bg-green-500/20 border-green-500/50 text-green-400' : 
                                    amb.status === 'في مهمة' ? 'bg-orange-500/20 border-orange-500/50 text-orange-400' : 
                                    'bg-red-500/20 border-red-500/50 text-red-400'
                                }`}>
                                    {amb.status}
                                </span>
                            </div>
                        ))}
                        {ambulances.length === 0 && <p className="text-center text-gray-500 py-4">لا توجد سيارات مسجلة</p>}
                    </div>
                </div>

                {/* Reports Panel */}
                <div className="xl:col-span-2 border border-gray-700 bg-gray-800/80 rounded-xl shadow-xl flex flex-col">
                    <div className="p-4 border-b border-gray-700 bg-gray-900/50 rounded-t-xl flex justify-between items-center">
                        <h3 className="text-lg font-bold text-white flex items-center gap-2">
                            سجل البلاغات
                            {reports.filter(r => r.missionStatus === 'pending').length > 0 && (
                                <span className="flex h-3 w-3 relative">
                                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                                    <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500"></span>
                                </span>
                            )}
                        </h3>
                    </div>
                    <div className="p-4 flex-1 overflow-auto space-y-4">
                        {reports.length === 0 ? (
                            <div className="text-center p-12 text-gray-500 flex flex-col items-center">
                                <FaCheck className="text-4xl mb-3 text-gray-600" />
                                <p className="text-lg">لا توجد بلاغات حالية لهذا المركز</p>
                            </div>
                        ) : reports.map(report => (
                            <div key={report.id} className={`border p-4 rounded-xl transition-all ${
                                report.missionStatus === 'pending' ? 'bg-red-900/20 border-red-500/50' : 'bg-gray-900 border-gray-700'
                            }`}>
                                <div className="flex justify-between items-start mb-4 gap-4">
                                    <div>
                                        <div className="flex items-center gap-2 mb-1">
                                            <span className="text-xs font-mono bg-gray-800 px-2 py-1 rounded text-gray-400 border border-gray-700">ID: #{report.id}</span>
                                            <span className="text-xs text-gray-400 flex items-center gap-1"><FaClock/> {new Date(report.timestamp).toLocaleTimeString('ar-SA')}</span>
                                        </div>
                                        <p className="text-white text-lg font-medium">{report.description}</p>
                                        <p className="text-sm text-gray-400 mt-1 flex items-center gap-1">
                                            <FaMapMarkedAlt className="text-blue-400"/> يبعد {report.distanceToCenter.toFixed(1)} كم
                                        </p>
                                        <button 
                                            onClick={() => setSelectedReportForDetails(report)}
                                            className="mt-3 flex items-center gap-2 text-sm text-blue-400 hover:text-blue-300 transition-colors bg-blue-900/20 px-3 py-1.5 rounded border border-blue-500/30"
                                        >
                                            <FaEye /> عرض كافة تفاصيل المُبلّغ والحادث
                                        </button>
                                        {report.backupRequests?.length > 0 && (
                                            <div className="mt-3 inline-flex items-center gap-2 bg-red-600 border border-red-400 text-white px-4 py-2 rounded-xl text-sm font-black animate-pulse shadow-lg shadow-red-900/40">
                                                <FaExclamationTriangle className="text-lg" /> 
                                                <span>إنتباه: السائق يطلب دعم إضافي للموقع فوراً!</span>
                                            </div>
                                        )}
                                    </div>
                                    <div className="text-left">
                                        <span className={`px-3 py-1 rounded-full text-sm font-bold border block text-center shadow-lg ${
                                            report.missionStatus === 'pending' ? 'bg-red-600 border-red-500 text-white' : 
                                            report.missionStatus === 'تم إنهاء المهمة' ? 'bg-green-600/30 border-green-500 text-green-400' :
                                            'bg-blue-600/30 border-blue-500 text-blue-400'
                                        }`}>
                                            {report.missionStatus === 'pending' ? 'بانتظار الإرسال' : report.missionStatus}
                                        </span>
                                    </div>
                                </div>

                                {/* Actions: Initial Dispatch or Ongoing Support */}
                                {report.missionStatus !== 'تم إنهاء المهمة' && (
                                    <div className="mt-4 pt-4 border-t border-gray-700 flex flex-col gap-4">
                                        <div className="flex flex-col gap-2">
                                            <label className="text-gray-300 text-sm font-bold mb-1 flex items-center gap-2">
                                                {report.missionStatus === 'pending' ? <FaAmbulance className="text-blue-400"/> : <FaExclamationTriangle className="text-orange-400"/>}
                                                {report.missionStatus === 'pending' ? 'توجيه سيارات الإسعاف للموقع:' : 'إرسال وحدات دعم إضافية:'}
                                            </label>
                                            {availableAmbulances.length > 0 ? (
                                                <div className="grid grid-cols-2 lg:grid-cols-3 gap-2">
                                                    {availableAmbulances.map(a => {
                                                        const isSelected = (selectedAmbulancesMap[report.id] || []).includes(a.id);
                                                        return (
                                                            <div 
                                                                key={a.id} 
                                                                onClick={() => toggleAmbulanceSelection(report.id, a.id)}
                                                                className={`cursor-pointer border p-2 rounded-lg text-sm flex items-center gap-2 transition-colors ${
                                                                    isSelected 
                                                                    ? 'bg-blue-600/30 border-blue-500 text-blue-300' 
                                                                    : 'bg-gray-800 border-gray-600 text-gray-400 hover:bg-gray-700'
                                                                }`}
                                                            >
                                                                <input type="checkbox" checked={isSelected} readOnly className="rounded text-blue-500 bg-gray-900 border-gray-600 w-4 h-4" />
                                                                <span className="truncate">{a.name}</span>
                                                            </div>
                                                        );
                                                    })}
                                                </div>
                                            ) : (
                                                <div className="text-red-400 text-sm flex items-center gap-2 bg-red-900/20 p-3 rounded-lg border border-red-500/30">
                                                    <FaExclamationCircle className="shrink-0 text-xl" />
                                                    <span>ليس لديك أي سيارات متاحة في هذا المركز في الوقت الحالي!</span>
                                                </div>
                                            )}
                                        </div>
                                        
                                        <div className="flex flex-wrap gap-3 mt-2">
                                            {/* Dispatch Button */}
                                            <button 
                                                onClick={() => handleDispatch(report.id)}
                                                disabled={(selectedAmbulancesMap[report.id] || []).length === 0}
                                                className={`${
                                                    report.missionStatus === 'pending' ? 'bg-red-600 hover:bg-red-500' : 'bg-orange-600 hover:bg-orange-500'
                                                } disabled:bg-gray-700 disabled:text-gray-500 text-white font-bold py-2 px-6 rounded-lg transition-colors flex-1 min-w-[200px] shadow-lg`}
                                            >
                                                {report.missionStatus === 'pending' ? 'بدء المهمة بالسيارات المحددة' : 'إرسال وحدات الدعم المحددة'} 🚨
                                            </button>

                                            {/* Transfer/Backup Button */}
                                            <button
                                                onClick={() => handleTransfer(report.id)}
                                                className="bg-gray-800 hover:bg-gray-700 text-orange-400 hover:text-orange-300 font-bold py-2 px-4 rounded-lg transition-colors border border-gray-700 hover:border-orange-500/50 flex justify-center items-center gap-2 text-sm shadow-md"
                                                title="طلب إمداد من مركز إسعاف مجاور"
                                            >
                                                طلب دعم من مركز مجاور 🔄
                                            </button>
                                        </div>
                                    </div>
                                )}

                                {report.ambulanceIds && report.ambulanceIds.length > 0 && report.missionStatus !== 'تم إنهاء المهمة' && (
                                    <div className="mt-4 pt-4 border-t border-gray-700">
                                        <div className="flex items-center justify-between">
                                            <div className="text-gray-400 text-sm">الوحدات المستجيبة: <span className="text-blue-400 font-bold">{report.ambulanceIds.length} سيارات</span></div>
                                            
                                        </div>
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                </div>

            </div>
            {/* Details Modal */}
            {selectedReportForDetails && (
                <ReportDetails 
                    report={selectedReportForDetails} 
                    onClose={() => setSelectedReportForDetails(null)} 
                />
            )}

        </div>
    );
};

export default CenterDashboard;
