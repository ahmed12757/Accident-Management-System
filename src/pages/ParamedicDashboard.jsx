import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { getReports, getAmbulances, getCenters, updateReportStatus, updateAmbulanceStatus, flagAsFalseByParamedic, findPrimaryIncidentById, getCurrentUser } from '../services/db';
import { updateMissionTracker, transferReportToNearestCenter, smartRequestBackup } from '../services/ambulanceService';
import MapComponent from '../components/MapComponent';
import { 
    FaAmbulance, FaMapMarkerAlt, FaClock, FaExclamationTriangle, 
    FaCheckCircle, FaChevronRight, FaTrafficLight, FaTools, FaCloudSun,
    FaBriefcaseMedical, FaHistory, FaGasPump, FaMedkit, FaShieldAlt
} from 'react-icons/fa';
import { useNotification } from '../context/NotificationContext';

const ParamedicDashboard = () => {
    const { id, ambulanceId } = useParams();
    const navigate = useNavigate();
    const [report, setReport] = useState(null);
    const [myAmbulance, setMyAmbulance] = useState(null);
    const [assignedAmbulances, setAssignedAmbulances] = useState([]);
    const [allActiveReports, setAllActiveReports] = useState([]);
    const [centerLocation, setCenterLocation] = useState(null);
    const [showDelayModal, setShowDelayModal] = useState(false);
    const [showFalseReportModal, setShowFalseReportModal] = useState(false);
    const [delayReason, setDelayReason] = useState('');
    const [falseReason, setFalseReason] = useState('');
    const [showBackupAlert, setShowBackupAlert] = useState(false);
    const [user, setUser] = useState(null);
    const { showNotification, showConfirm } = useNotification();

    // Determine the effective ambulance ID for this session
    const currentUser = getCurrentUser();
    let effectiveAmbId = ambulanceId;
    if (currentUser?.role === 'DRIVER') {
        effectiveAmbId = currentUser.ambulanceId;
    }

    const fetchReport = () => {
        setUser(currentUser);
        const allAmbs = getAmbulances();
        const allReports = getReports();
        const allCenters = getCenters();

        if (effectiveAmbId) {
            // Find this ambulance's data
            const amb = allAmbs.find(a => a.id === effectiveAmbId);
            setMyAmbulance(amb || null);

            // Find the report this specific ambulance is assigned to
            const assignedReport = allReports.find(r =>
                r.ambulanceIds?.includes(effectiveAmbId) &&
                r.missionStatus !== 'تم إنهاء المهمة' &&
                r.missionStatus !== 'تم إلغاء المهمة (بلاغ كاذب)' &&
                (r.ambulanceAssignments?.[effectiveAmbId]?.status !== 'تم إنهاء المهمة')
            );
            setReport(assignedReport || null);
            if (assignedReport) {
                setAssignedAmbulances(allAmbs.filter(a => assignedReport.ambulanceIds?.includes(a.id)));
                // Resolve center location for route drawing
                const centerId = amb?.centerId || assignedReport.assignedCenterId;
                const center = allCenters.find(c => c.id === centerId);
                setCenterLocation(center?.location || null);
            }
        } else {
            // OLD MODE: by report ID (fallback)
            const found = findPrimaryIncidentById(id);
            if (found) {
                setReport(found);
                setAssignedAmbulances(allAmbs.filter(a => found.ambulanceIds?.includes(a.id)));
                const center = allCenters.find(c => c.id === found.assignedCenterId);
                setCenterLocation(center?.location || null);
            }
        }

        // Situational awareness — all active reports
        setAllActiveReports(allReports.filter(r => !r.isFalseReport && r.missionStatus !== 'تم إنهاء المهمة'));
    };

    // The current status for THIS specific ambulance
    const myStatus = report?.ambulanceAssignments?.[effectiveAmbId]?.status || report?.missionStatus || 'pending';

    // The effective report ID to use for actions
    const reportId = report?.id || id;

    useEffect(() => {
        fetchReport();
        const interval = setInterval(fetchReport, 3000);
        return () => clearInterval(interval);
    }, [id, ambulanceId]);

    const showToast = (msg, type = 'success') => {
        showNotification(msg, type);
    };

    const handleStatusUpdate = (newStatus) => {
        updateMissionTracker(reportId, newStatus, effectiveAmbId);
        fetchReport();
        showToast(`تم تغيير الحالة إلى: ${newStatus}`);
    };

    const handleBackupRequest = () => {
        if (report.missionStatus === 'في الطريق إلى موقع الحادث' || report.missionStatus === 'pending') {
            showToast('عفواً، لا يمكنك طلب دعم إضافي إلا بعد الوصول لموقع الحادث وتقييم الوضع.', 'warning');
            return;
        }
        const result = smartRequestBackup(reportId);
        if (result) {
            fetchReport();
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
        updateReportStatus(reportId, { delays: [...delays, delayEntry] });
        fetchReport();
        setShowDelayModal(false);
        setDelayReason('');
        showToast('تم تسجيل بلاغ التأخير في النظام');
    };

    const submitFalseReport = (e) => {
        e.preventDefault();
        if (!falseReason) return showToast('يرجى ذكر السبب لإتمام البلاغ الكاذب', 'error');
        flagAsFalseByParamedic(reportId, falseReason);
        showToast('تم إبلاغ المركز بأن البلاغ كاذب. في انتظار التأكيد الإداري.');
        setShowFalseReportModal(false);
        setFalseReason('');
        fetchReport();
    };


    // Ambulance mode with no mission yet
    if (ambulanceId && !report) {
        return (
            <div className="flex flex-col items-center justify-center h-screen bg-gray-900" dir="rtl">
                <div className="bg-gray-800 border border-gray-700 p-6 sm:p-10 rounded-[2rem] sm:rounded-[3rem] max-w-md w-full flex flex-col items-center gap-6 shadow-2xl">
                    <div className="w-24 h-24 bg-orange-600/20 rounded-full flex items-center justify-center text-orange-400 text-5xl border-4 border-orange-500/30 animate-pulse">
                        <FaAmbulance />
                    </div>
                    <div className="text-center">
                        <div className="text-xs text-orange-400 font-bold tracking-[0.22em] mb-1">سيارة الإسعاف</div>
                        <h1 className="text-3xl font-black text-white">
                            {myAmbulance ? myAmbulance.name : ambulanceId}
                        </h1>
                        <p className="text-gray-400 mt-3 text-sm">في انتظار التكليف من غرفة العمليات...</p>
                    </div>
                    <div className="flex items-center gap-2 text-green-400 text-sm">
                        <span className="relative flex h-3 w-3">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                            <span className="relative inline-flex rounded-full h-3 w-3 bg-green-500"></span>
                        </span>
                        جاهز للانطلاق
                    </div>
                </div>
            </div>
        );
    }

    if (!report) return (
        <div className="flex flex-col items-center justify-center h-screen bg-gray-900">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-500 mb-4"></div>
            <p className="text-gray-400">جاري تحميل بيانات المهمة...</p>
        </div>
    );

    if (report.isFalseReport) return (
        <div className="flex flex-col items-center justify-center min-h-screen bg-gray-900 p-6 text-center" dir="rtl">
            <div className="w-24 h-24 bg-red-600/20 rounded-full flex items-center justify-center text-red-500 text-5xl mb-6 animate-pulse border-4 border-red-500/30">
                <FaExclamationTriangle />
            </div>
            <h1 className="text-3xl sm:text-4xl font-black text-white mb-4 italic">إلغاء المهمة فوراً 🚨</h1>
            <div className="bg-gray-800 border border-red-500/50 p-6 rounded-3xl max-w-md w-full shadow-2xl">
                <p className="text-gray-400 text-sm mb-2 font-bold tracking-[0.22em]">سبب الإلغاء الإداري:</p>
                <p className="text-red-400 text-xl font-black">"{report.falseReportReason || 'تم تصنيف هذا البلاغ كبلاغ كاذب'}"</p>
                <div className="mt-6 pt-6 border-t border-gray-700 flex flex-col gap-3">
                    <p className="text-gray-500 text-xs italic">يرجى العودة إلى المركز أو انتظار تعليمات جديدة من غرفة العمليات.</p>
                    <button 
                        onClick={() => navigate('/logs')}
                        className="w-full bg-gray-700 hover:bg-gray-600 text-white font-bold py-4 rounded-2xl transition-all active:scale-95 flex items-center justify-center gap-2"
                    >
                        <FaHistory /> العودة لسجل المهام
                    </button>
                </div>
            </div>
        </div>
    );

    return (
        <div className="p-4 lg:p-6 max-w-7xl mx-auto" dir="rtl">
             {/* Notification Toast Section Removed - Using Global Notification */}

            {/* Header Area */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                <div className="bg-gray-800/80 p-5 rounded-3xl border border-gray-700 backdrop-blur-md flex items-center justify-between">
                    <div>
                        {ambulanceId && myAmbulance && (
                            <div className="flex items-center gap-2 mb-2 bg-orange-900/30 border border-orange-500/30 px-3 py-1 rounded-xl">
                                <FaAmbulance className="text-orange-400 text-xs" />
                                <span className="text-orange-300 text-[10px] font-bold">{myAmbulance.name}</span>
                            </div>
                        )}
                        <div className="text-xs text-gray-400 mb-1">المهمة الحالية</div>
                        <h1 className="text-2xl font-black text-white tracking-wider">#{report.id}</h1>
                    </div>
                    <div className="text-left">
                        <div className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600/20 text-blue-400 border border-blue-500/30 rounded-2xl font-bold">
                            <span className="relative flex h-3 w-3">
                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
                                <span className="relative inline-flex rounded-full h-3 w-3 bg-blue-500"></span>
                            </span>
                             {myStatus}
                        </div>
                    </div>
                </div>

                <div className="bg-gray-800/80 p-5 rounded-3xl border border-gray-700 backdrop-blur-md flex items-center gap-4">
                    <div className="h-12 w-12 bg-red-600/20 rounded-2xl flex items-center justify-center text-red-500 text-2xl border border-red-500/20">
                        <FaClock />
                    </div>
                    <div>
                        <div className="text-xs text-gray-400 mb-0.5">وقت الاستلام</div>
                        <div className="text-white font-bold">{new Date(report.timestamp).toLocaleTimeString('ar-EG')}</div>
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
                    <div className="rounded-[2rem] md:rounded-[40px] overflow-hidden border border-gray-700 shadow-2xl relative h-[300px] sm:h-[350px] md:h-[500px] bg-gray-900">
                        <MapComponent 
                            centerLocation={centerLocation || report.location}
                            incidents={[report]}
                            ambulances={assignedAmbulances}
                            routeMode={!!(centerLocation && myStatus === 'في الطريق إلى موقع الحادث')}
                            liveAmbulanceIds={effectiveAmbId ? [effectiveAmbId] : assignedAmbulances.map(a => a.id)}
                        />
                        <div className="absolute top-4 right-4 md:top-6 md:right-6 z-40 bg-gray-900/95 border border-gray-700 p-4 md:p-5 rounded-[2.5rem] backdrop-blur-xl shadow-2xl max-w-xs ring-1 ring-white/10 hidden sm:block">
                             <div className="flex items-center gap-3 mb-2 md:mb-3 font-black text-red-500 text-sm md:text-lg">
                                <FaMapMarkerAlt /> الموقع المستهدف
                             </div>
                             <p className="text-gray-300 text-[10px] md:text-sm leading-relaxed mb-3 md:mb-4 line-clamp-3">{report.description}</p>
                             <div className="flex items-center gap-2 text-[8px] md:text-[10px] font-mono text-gray-500">
                                <span className="bg-gray-800 px-2 py-1 rounded">خط العرض: {report.location.lat.toFixed(4)}</span>
                                <span className="bg-gray-800 px-2 py-1 rounded">خط الطول: {report.location.lng.toFixed(4)}</span>
                             </div>
                        </div>
                    </div>

                    {/* Giant Action Buttons for Driver */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-5">
                        <button 
                            disabled={myStatus !== 'في الطريق إلى موقع الحادث'}
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
                            disabled={myStatus !== 'وصل للموقع'}
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
                            disabled={myStatus !== 'جاري النقل للمستشفى'}
                            onClick={() => {
                                showConfirm(
                                    'إنهاء المهمة',
                                    'هل أنت متأكد من إتمام المهمة والعودة للوضع الجاهز؟',
                                    () => {
                                        handleStatusUpdate('تم إنهاء المهمة');
                                    }
                                );
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
                                disabled={myStatus === 'في الطريق إلى موقع الحادث' || myStatus === 'pending' || myStatus === 'تم إنهاء المهمة'}
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
                                            {myStatus === 'في الطريق إلى موقع الحادث' 
                                                ? 'يتاح عند الوصول' 
                                                : 'الحادث يحتاج مساعدة'}
                                        </div>
                                    </div>
                                </div>
                            </button>

                        

                            <button 
                                disabled={myStatus !== 'وصل للموقع'}
                                onClick={() => setShowFalseReportModal(true)}
                                className="w-full flex items-center justify-between p-5 bg-purple-900/30 border border-purple-400/30 rounded-2xl hover:bg-purple-900/50 transition-all text-purple-100 ring-1 ring-purple-400/10 group disabled:opacity-30 disabled:cursor-not-allowed"
                            >
                                <div className="flex items-center gap-4">
                                    <div className="h-10 w-10 bg-purple-500/20 rounded-xl flex items-center justify-center text-purple-400 group-hover:scale-110 transition-transform">
                                        <FaExclamationTriangle />
                                    </div>
                                    <div className="text-right">
                                        <div className="font-bold">إبلاغ: بلاغ كاذب</div>
                                        <div className="text-[10px] opacity-60">لا يوجد حادث في الموقع</div>
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
                                                {new Date(item.timestamp).toLocaleTimeString('ar-EG')}
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
                    <div className="bg-gray-800 border-2 border-yellow-500/30 rounded-[2rem] sm:rounded-[3rem] p-5 sm:p-10 max-w-md w-full shadow-[0_0_50px_rgba(234,179,8,0.1)]">
                        <h2 className="text-3xl font-black text-white mb-8 flex items-center gap-4">
                            <FaTrafficLight className="text-yellow-500" /> إبلاغ عن معوقات
                        </h2>
                        <form onSubmit={submitDelayReport} className="space-y-8">
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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

            {/* False Report Modal */}
            {showFalseReportModal && (
                <div className="fixed inset-0 z-[120] flex items-center justify-center p-4 bg-black/95 backdrop-blur-xl">
                    <div className="bg-gray-800 border-2 border-red-500/50 rounded-[3rem] p-8 md:p-12 max-w-xl w-full shadow-[0_0_80px_rgba(239,68,68,0.2)]">
                        <div className="w-20 h-20 bg-red-600/20 rounded-full flex items-center justify-center text-red-500 text-4xl mb-6 mx-auto border-2 border-red-500/30 animate-pulse">
                            <FaExclamationTriangle />
                        </div>
                        <h2 className="text-3xl font-black text-white mb-2 text-center italic">تأكيد: بلاغ كاذب؟</h2>
                        <p className="text-gray-400 text-center mb-8 px-4">أكدت وصولك للموقع ولم تجد أثر للحادث؟ يرجى ذكر السبب بدقة ليقوم المركز باتخاذ الإجراءات القانونية ضد المُبلغين.</p>
                        
                        <form onSubmit={submitFalseReport} className="space-y-6">
                            <textarea 
                                required
                                placeholder="صف ما تراه في الموقع ولماذا تعتبر البلاغ كاذباً... (مثال: الشارع هادئ تماماً ولا توجد أي آثار للتصادم)"
                                className="w-full bg-gray-900 border-2 border-gray-700 rounded-3xl p-6 text-white placeholder-gray-600 focus:ring-4 focus:ring-red-500/20 focus:border-red-500 focus:outline-none h-40 transition-all resize-none font-bold"
                                value={falseReason}
                                onChange={(e) => setFalseReason(e.target.value)}
                            />
                            
                            <div className="flex flex-col sm:flex-row gap-4">
                                <button 
                                    type="submit"
                                    className="flex-[2] bg-red-600 hover:bg-red-500 text-white text-lg font-black py-5 rounded-3xl transition-all shadow-xl shadow-red-900/40 active:scale-95"
                                >
                                    إرسال البلاغ فوراً 🚀
                                </button>
                                <button 
                                    type="button"
                                    onClick={() => {
                                        setShowFalseReportModal(false);
                                        setFalseReason('');
                                    }}
                                    className="flex-1 bg-gray-700 hover:bg-gray-600 text-white px-8 py-5 rounded-3xl font-black transition-all active:scale-95"
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
