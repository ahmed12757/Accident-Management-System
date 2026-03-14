import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getReports, getAmbulances, getCenters, updateReportStatus, updateAmbulanceStatus } from '../services/db';
import { updateMissionTracker, transferReportToNearestCenter, smartRequestBackup } from '../services/ambulanceService';
import MapComponent from '../components/MapComponent';
import { 
    FaAmbulance, FaMapMarkerAlt, FaClock, FaExclamationTriangle, 
    FaCheckCircle, FaChevronRight, FaTrafficLight, FaTools, FaCloudSun,
    FaBriefcaseMedical, FaHistory, FaGasPump, FaMedkit, FaShieldAlt
} from 'react-icons/fa';

const ParamedicDashboard = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const [report, setReport] = useState(null);
    const [assignedAmbulances, setAssignedAmbulances] = useState([]);
    const [showDelayModal, setShowDelayModal] = useState(false);
    const [delayReason, setDelayReason] = useState('');
    const [showBackupAlert, setShowBackupAlert] = useState(false);
    const [notification, setNotification] = useState(null);

    const fetchReport = () => {
        const allReports = getReports();
        const found = allReports.find(r => r.id === id);
        if (found) {
            setReport(found);
            const allAmbs = getAmbulances();
            setAssignedAmbulances(allAmbs.filter(a => found.ambulanceIds?.includes(a.id)));
        }
    };

    useEffect(() => {
        fetchReport();
        const interval = setInterval(fetchReport, 3000);
        return () => clearInterval(interval);
    }, [id]);

    const showToast = (msg, type = 'success') => {
        setNotification({ msg, type });
        setTimeout(() => setNotification(null), 5000);
    };

    const handleStatusUpdate = (newStatus) => {
        updateMissionTracker(id, newStatus);
        fetchReport(); // Refresh immediately
        showToast(`تم تغيير الحالة إلى: ${newStatus}`);
    };

    const handleBackupRequest = () => {
        // Guard: Driver must be at the scene or transporting to request backup
        if (report.missionStatus === 'في الطريق إلى موقع الحادث' || report.missionStatus === 'pending') {
            showToast('عفواً، لا يمكنك طلب دعم إضافي إلا بعد الوصول لموقع الحادث وتقييم الوضع.', 'warning');
            return;
        }

        const result = smartRequestBackup(id);
        if (result) {
            fetchReport(); // Refresh immediately to show in history
            setShowBackupAlert(true);
            setTimeout(() => setShowBackupAlert(false), 5000);
            
            if (result.type === 'local') {
                showToast('تم إرسال طلب دعم لمركزك الحالي (سيتم توفير سيارة إضافية فور توفرها)', 'success');
            } else {
                showToast(`تم تحويل طلب الدعم تلقائياً لأقرب مركز متاح: ${result.neighbor?.name || 'مركز مجاور'}`, 'warning');
            }
        }
    };

    const submitDelayReport = (e) => {
        e.preventDefault();
        const delayEntry = {
            reason: delayReason,
            timestamp: new Date().toISOString(),
            statusAtTime: report.missionStatus
        };
        
        const delays = report.delays || [];
        updateReportStatus(id, { delays: [...delays, delayEntry] });
        fetchReport(); // Refresh
        setShowDelayModal(false);
        setDelayReason('');
        showToast('تم تسجيل بلاغ التأخير في النظام');
    };


    if (!report) return (
        <div className="flex flex-col items-center justify-center h-screen bg-gray-900">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-500 mb-4"></div>
            <p className="text-gray-400">جاري تحميل بيانات المهمة...</p>
        </div>
    );

    return (
        <div className="p-4 lg:p-6 max-w-7xl mx-auto" dir="rtl">
            {/* Notification Toast */}
            {notification && (
                <div className={`fixed top-20 left-1/2 -translate-x-1/2 z-[100] px-6 py-3 rounded-2xl shadow-2xl flex items-center gap-3 animate-slide-down border ${
                    notification.type === 'success' ? 'bg-green-600 border-green-500 text-white' : 
                    notification.type === 'warning' ? 'bg-orange-600 border-orange-500 text-white' :
                    'bg-red-600 border-red-500 text-white'
                }`}>
                    {notification.type === 'success' ? <FaCheckCircle /> : <FaExclamationTriangle />}
                    <span className="font-bold">{notification.msg}</span>
                </div>
            )}

            {/* Header Area */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                <div className="bg-gray-800/80 p-5 rounded-3xl border border-gray-700 backdrop-blur-md flex items-center justify-between">
                    <div>
                        <div className="text-xs text-gray-400 mb-1">المهمة الحالية</div>
                        <h1 className="text-2xl font-black text-white tracking-wider">#{report.id}</h1>
                    </div>
                    <div className="text-left">
                        <div className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600/20 text-blue-400 border border-blue-500/30 rounded-2xl font-bold">
                            <span className="relative flex h-3 w-3">
                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
                                <span className="relative inline-flex rounded-full h-3 w-3 bg-blue-500"></span>
                            </span>
                            {report.missionStatus}
                        </div>
                    </div>
                </div>

                <div className="bg-gray-800/80 p-5 rounded-3xl border border-gray-700 backdrop-blur-md flex items-center gap-4">
                    <div className="h-12 w-12 bg-red-600/20 rounded-2xl flex items-center justify-center text-red-500 text-2xl border border-red-500/20">
                        <FaClock />
                    </div>
                    <div>
                        <div className="text-xs text-gray-400 mb-0.5">وقت الاستلام</div>
                        <div className="text-white font-bold">{new Date(report.timestamp).toLocaleTimeString('ar-SA')}</div>
                    </div>
                    <div className="mr-auto">
                        <div className="text-xs text-center text-gray-500 mb-1">سيارات الدعم</div>
                        <div className="flex -space-x-2 space-x-reverse">
                            {assignedAmbulances.map(a => (
                                <div key={a.id} title={a.name} className="h-8 w-8 rounded-full bg-gray-700 border-2 border-gray-800 flex items-center justify-center text-[10px] text-white">
                                    {a.id}
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
                {/* Map & Main Controls */}
                <div className="lg:col-span-3 space-y-4 md:space-y-6">
                    <div className="rounded-[2.5rem] md:rounded-[40px] overflow-hidden border border-gray-700 shadow-2xl relative h-[350px] md:h-[500px] bg-gray-900">
                        <MapComponent 
                            centerLocation={report.location} 
                            incidents={[report]} 
                            ambulances={assignedAmbulances} 
                        />
                        <div className="absolute top-4 right-4 md:top-6 md:right-6 z-40 bg-gray-900/95 border border-gray-700 p-4 md:p-5 rounded-[2rem] md:rounded-[2.5rem] backdrop-blur-xl shadow-2xl max-w-xs ring-1 ring-white/10 hidden sm:block">
                             <div className="flex items-center gap-3 mb-2 md:mb-3 font-black text-red-500 text-sm md:text-lg uppercase">
                                <FaMapMarkerAlt /> الموقع المستهدف
                             </div>
                             <p className="text-gray-300 text-[10px] md:text-sm leading-relaxed mb-3 md:mb-4 line-clamp-3">{report.description}</p>
                             <div className="flex items-center gap-2 text-[8px] md:text-[10px] font-mono text-gray-500">
                                <span className="bg-gray-800 px-2 py-1 rounded">LAT: {report.location.lat.toFixed(4)}</span>
                                <span className="bg-gray-800 px-2 py-1 rounded">LNG: {report.location.lng.toFixed(4)}</span>
                             </div>
                        </div>
                    </div>

                    {/* Giant Action Buttons for Driver */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-5">
                        <button 
                            disabled={report.missionStatus !== 'في الطريق إلى موقع الحادث'}
                            onClick={() => handleStatusUpdate('وصل للموقع')}
                            className="flex items-center justify-between p-8 bg-gradient-to-br from-orange-600/20 to-orange-900/20 border border-orange-500/40 rounded-[2.5rem] hover:from-orange-600/30 hover:to-orange-900/30 transition-all group disabled:opacity-20 shadow-xl"
                        >
                            <div className="text-right">
                                <div className="text-white text-2xl font-black mb-1">وصل للموقع</div>
                                <div className="text-orange-400/70 text-sm">تأكيد الوصول لتبديل الحالة</div>
                            </div>
                            <FaMapMarkerAlt className="text-5xl text-orange-500 group-hover:scale-110 transition-transform" />
                        </button>

                        <button 
                            disabled={report.missionStatus !== 'وصل للموقع'}
                            onClick={() => handleStatusUpdate('جاري النقل للمستشفى')}
                            className="flex items-center justify-between p-8 bg-gradient-to-br from-blue-600/20 to-blue-900/20 border border-blue-500/40 rounded-[2.5rem] hover:from-blue-600/30 hover:to-blue-900/30 transition-all group disabled:opacity-20 shadow-xl"
                        >
                            <div className="text-right">
                                <div className="text-white text-2xl font-black mb-1">بدء النقل</div>
                                <div className="text-blue-400/70 text-sm">التوجه لأقرب مستشفى</div>
                            </div>
                            <FaAmbulance className="text-5xl text-blue-500 group-hover:scale-110 transition-transform" />
                        </button>

                        <button 
                            disabled={report.missionStatus !== 'جاري النقل للمستشفى'}
                            onClick={() => {
                                handleStatusUpdate('تم إنهاء المهمة');
                                navigate('/logs');
                            }}
                            className="flex items-center justify-between p-8 bg-gradient-to-br from-green-600/20 to-green-900/20 border border-green-500/40 rounded-[2.5rem] hover:from-green-600/30 hover:to-green-900/30 transition-all group disabled:opacity-20 shadow-xl"
                        >
                            <div className="text-right">
                                <div className="text-white text-2xl font-black mb-1">إنهاء المهمة</div>
                                <div className="text-green-400/70 text-sm">تسليم الحالة والعودة</div>
                            </div>
                            <FaCheckCircle className="text-5xl text-green-500 group-hover:scale-110 transition-transform" />
                        </button>
                    </div>

                  
                </div>

                {/* Side Actions & History */}
                <div className="space-y-6">
                    {/* Emergency Tools */}
                    <div className="bg-gray-800/60 p-6 rounded-[2.5rem] border border-gray-700/50 backdrop-blur-xl">
                        <h2 className="text-lg font-black text-white mb-5 flex items-center gap-2">
                            <FaTools className="text-red-500" /> أدوات الدعم
                        </h2>
                        
                        <div className="space-y-4">

                            <button 
                                disabled={report.missionStatus === 'في الطريق إلى موقع الحادث' || report.missionStatus === 'pending' || report.missionStatus === 'تم إنهاء المهمة'}
                                onClick={handleBackupRequest}
                                className="w-full flex items-center justify-between p-5 bg-red-900/30 border border-red-400/30 rounded-2xl hover:bg-red-900/50 transition-all text-red-100 ring-1 ring-red-400/10 group disabled:opacity-30 disabled:cursor-not-allowed"
                            >
                                <div className="flex items-center gap-4">
                                    <div className="h-10 w-10 bg-red-500/20 rounded-xl flex items-center justify-center text-red-400 group-hover:scale-110 transition-transform">
                                        <FaAmbulance />
                                    </div>
                                    <div className="text-right">
                                        <div className="font-bold">طلب سيارة دعم</div>
                                        <div className="text-[10px] opacity-60">
                                            {report.missionStatus === 'في الطريق إلى موقع الحادث' 
                                                ? 'يتاح عند الوصول' 
                                                : 'الحادث يحتاج مساعدة'}
                                        </div>
                                    </div>
                                </div>
                            </button>

                            <button 
                                onClick={() => setShowDelayModal(true)}
                                className="w-full flex items-center justify-between p-5 bg-yellow-900/30 border border-yellow-400/30 rounded-2xl hover:bg-yellow-900/50 transition-all text-yellow-100 ring-1 ring-yellow-400/10 group"
                            >
                                <div className="flex items-center gap-4">
                                    <div className="h-10 w-10 bg-yellow-500/20 rounded-xl flex items-center justify-center text-yellow-400 group-hover:scale-110 transition-transform">
                                        <FaTrafficLight />
                                    </div>
                                    <div className="text-right">
                                        <div className="font-bold">إبلاغ عن تأخير</div>
                                        <div className="text-[10px] opacity-60">عقبات مرورية أو فنية</div>
                                    </div>
                                </div>
                            </button>
                        </div>
                    </div>

                    {/* Timeline / History */}
                    <div className="bg-gray-800/40 p-6 rounded-[2.5rem] border border-gray-700/30 backdrop-blur-xl">
                        <h2 className="text-lg font-black text-white mb-5 flex items-center gap-2">
                            <FaHistory className="text-gray-400" /> سجل الأحداث
                        </h2>
                        <div className="space-y-4 max-h-[300px] overflow-y-auto custom-scrollbar pl-2">
                            {/* Combined History: Delays, Supplies, & Backups */}
                            {[...(report.delays || []), ...(report.backupRequests || [])]
                                .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
                                .map((item, idx) => (
                                    <div key={idx} className={`p-4 rounded-2xl border ${
                                        item.reason ? 'bg-yellow-600/10 border-yellow-500/20' : 
                                        'bg-red-600/10 border-red-500/20'
                                    }`}>
                                        <div className="flex justify-between items-start mb-2">
                                            <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                                                item.reason ? 'bg-yellow-500/20 text-yellow-400' : 
                                                'bg-red-500/20 text-red-400'
                                            }`}>
                                                {item.reason ? 'تأخير' : 'طلب دعم'}
                                            </span>
                                            <span className="text-[10px] text-gray-500">
                                                {new Date(item.timestamp).toLocaleTimeString('ar-SA')}
                                            </span>
                                        </div>
                                        <div className="text-sm text-gray-300">
                                            {item.reason || `تم طلب سيارة دعم إضافية #${idx + 1}`}
                                        </div>
                                    </div>
                                ))}
                            {(!report.delays?.length && !report.backupRequests?.length) && (
                                <div className="text-center py-8 text-gray-600 text-sm italic">
                                    لا توجد أحداث مسجلة بعد
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* Delay Report Modal */}
            {showDelayModal && (
                <div className="fixed inset-0 z-[120] flex items-center justify-center p-4 bg-black/90 backdrop-blur-md">
                    <div className="bg-gray-800 border-2 border-yellow-500/30 rounded-[3rem] p-10 max-w-md w-full shadow-[0_0_50px_rgba(234,179,8,0.1)]">
                        <h2 className="text-3xl font-black text-white mb-8 flex items-center gap-4">
                            <FaTrafficLight className="text-yellow-500" /> إبلاغ عن معوقات
                        </h2>
                        <form onSubmit={submitDelayReport} className="space-y-8">
                            <div className="grid grid-cols-2 gap-4">
                                {[
                                    { icon: <FaTrafficLight />, label: 'زحام مروري' },
                                    { icon: <FaTools />, label: 'عطل فني' },
                                    { icon: <FaCloudSun />, label: 'ظروف جوية' },
                                    { icon: <FaExclamationTriangle />, label: 'عائق آخر' }
                                ].map(opt => (
                                    <button 
                                        key={opt.label}
                                        type="button"
                                        onClick={() => setDelayReason(opt.label)}
                                        className={`flex flex-col items-center p-5 rounded-3xl border-2 transition-all gap-2 ${
                                            delayReason === opt.label 
                                            ? 'bg-yellow-600/20 border-yellow-500 text-yellow-500 scale-105 shadow-lg' 
                                            : 'bg-gray-900 border-gray-700 text-gray-500 hover:border-gray-500'
                                        }`}
                                    >
                                        <span className="text-3xl">{opt.icon}</span>
                                        <span className="text-xs font-black">{opt.label}</span>
                                    </button>
                                ))}
                            </div>
                            <textarea 
                                placeholder="اكتب تفاصيل إضافية هنا (اختياري)..."
                                className="w-full bg-gray-900 border-2 border-gray-700 rounded-3xl p-6 text-white placeholder-gray-600 focus:ring-4 focus:ring-yellow-500/20 focus:border-yellow-500 focus:outline-none h-32 transition-all"
                                value={delayReason.includes(' : ') ? delayReason.split(' : ')[1] : ''}
                                onChange={(e) => setDelayReason(delayReason.split(' : ')[0] + ' : ' + e.target.value)}
                            />
                            <div className="flex gap-4 pt-2">
                                <button 
                                    type="submit"
                                    className="flex-1 bg-yellow-600 hover:bg-yellow-700 text-white text-lg font-black py-5 rounded-3xl transition-all shadow-xl shadow-yellow-900/40 active:scale-95"
                                >
                                    إرسال التقرير
                                </button>
                                <button 
                                    type="button"
                                    onClick={() => setShowDelayModal(false)}
                                    className="bg-gray-700 hover:bg-gray-600 text-white px-10 py-5 rounded-3xl font-black transition-all active:scale-95"
                                >
                                    إلغاء
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

        </div>
    );
};

export default ParamedicDashboard;
