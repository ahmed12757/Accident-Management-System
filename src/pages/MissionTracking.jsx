import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { getReports, getAmbulances } from '../services/db';
import { FaAmbulance, FaMapMarkerAlt, FaCheckCircle, FaSpinner, FaHospitalAlt, FaClock, FaExclamationCircle } from 'react-icons/fa';
import MapComponent from '../components/MapComponent';

const STATUS_STAGES = [
    { key: 'pending', label: 'بانتظار الإسعاف', icon: <FaClock /> },
    { key: 'في الطريق إلى موقع الحادث', label: 'في الطريق', icon: <FaAmbulance /> },
    { key: 'وصلت إلى موقع الحادث', label: 'المسعف في الموقع', icon: <FaMapMarkerAlt /> },
    { key: 'في الطريق للمستشفى', label: 'نقل للمستشفى', icon: <FaHospitalAlt /> },
    { key: 'تم إنهاء المهمة', label: 'مكتملة', icon: <FaCheckCircle /> }
];

const MissionTracking = () => {
    const { id } = useParams();
    const [report, setReport] = useState(null);
    const [ambulance, setAmbulance] = useState(null);
    const [notFound, setNotFound] = useState(false);

    const loadData = () => {
        const allReports = getReports();
        const found = allReports.find(r => r.id === id);
        
        if (found) {
            setReport(found);
            if (found.ambulanceIds && found.ambulanceIds.length > 0) {
                const ambs = getAmbulances();
                const assignedAmbs = ambs.filter(a => found.ambulanceIds.includes(a.id));
                setAmbulance(assignedAmbs);
            } else {
                setAmbulance([]);
            }
        } else {
            setNotFound(true);
        }
    };

    useEffect(() => {
        loadData();
        const interval = setInterval(loadData, 3000); // Polling for live tracking
        return () => clearInterval(interval);
    }, [id]);

    if (notFound) {
        return (
            <div className="flex flex-col items-center justify-center p-12 text-center" dir="rtl">
                <FaExclamationCircle className="text-6xl text-red-500 mb-4" />
                <h2 className="text-2xl font-bold text-white mb-2">البلاغ غير موجود</h2>
                <p className="text-gray-400">تأكد من رقم البلاغ المدخل.</p>
                <Link to="/dashboard" className="mt-6 bg-blue-600 hover:bg-blue-500 text-white px-6 py-2 rounded-lg transition-colors">الرجوع للوحة التحكم</Link>
            </div>
        );
    }

    if (!report) {
        return (
            <div className="flex justify-center items-center p-20 text-blue-400 text-xl font-bold gap-3" dir="rtl">
                <FaSpinner className="animate-spin" /> جاري البحث عن البلاغ...
            </div>
        );
    }

    // Determine active step index
    let activeIndex = STATUS_STAGES.findIndex(s => s.key === report.missionStatus);
    if (activeIndex === -1) activeIndex = 0; // Fallback to pending if unknown

    return (
        <div className="p-4 md:p-6 max-w-4xl mx-auto flex flex-col gap-6" dir="rtl">
            <div className="bg-gray-800/80 backdrop-blur-md rounded-2xl border border-gray-700 p-6 shadow-2xl">
                
                <div className="flex flex-col gap-4 sm:flex-row sm:justify-between sm:items-center mb-8 border-b border-gray-700 pb-4">
                    <div>
                        <h2 className="text-xl sm:text-2xl font-bold text-white mb-1">متابعة البلاغ #{report.id}</h2>
                        <p className="text-gray-400 text-sm">{new Date(report.timestamp).toLocaleString('ar-EG')}</p>
                    </div>
                    {report.missionStatus === 'تم إنهاء المهمة' && (
                        <div className="flex items-center gap-2 text-green-400 bg-green-900/30 px-4 py-2 rounded-lg border border-green-500/30">
                            <FaCheckCircle className="text-xl" /> مكتمل
                        </div>
                    )}
                </div>

                {/* Progress Tracker Tracker */}
                <div className="relative mb-12 px-4 md:px-0">
                    <div className="absolute top-1/2 left-0 w-full h-1 bg-gray-700 -translate-y-1/2 z-0"></div>
                    <div 
                        className="absolute top-1/2 right-0 h-1 bg-blue-500 -translate-y-1/2 z-0 transition-all duration-1000" 
                        style={{ width: `${(activeIndex / (STATUS_STAGES.length - 1)) * 100}%` }}
                    ></div>
                    
                    <div className="relative z-10 flex justify-between">
                        {STATUS_STAGES.map((stage, index) => {
                            const isCompleted = index <= activeIndex;
                            const isActive = index === activeIndex;
                            
                            return (
                                <div key={stage.key} className="flex flex-col items-center">
                                    <div className={`w-10 h-10 md:w-12 md:h-12 rounded-full flex items-center justify-center border-4 transition-all duration-500 ${
                                        isCompleted ? 'bg-blue-600 border-gray-900 text-white' : 'bg-gray-800 border-gray-700 text-gray-500'
                                    } ${isActive ? 'ring-4 ring-blue-500/50 scale-110 shadow-[0_0_15px_rgba(59,130,246,0.5)]' : ''}`}>
                                        {stage.icon}
                                    </div>
                                    <span className={`text-[10px] md:text-xs mt-3 font-bold text-center max-w-[80px] ${isCompleted ? 'text-blue-400' : 'text-gray-500'}`}>
                                        {stage.label}
                                    </span>
                                </div>
                            )
                        })}
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Mission Details */}
                    <div className="bg-gray-900/50 p-5 rounded-xl border border-gray-600 shadow-inner flex flex-col justify-center">
                        <h3 className="text-gray-400 mb-4 font-bold border-b border-gray-700 pb-2">تفاصيل المهمة</h3>
                        
                        <div className="space-y-4">
                            <div className="flex items-center justify-between">
                                <span className="text-gray-500 text-sm">حالة المهمة</span>
                                <span className="text-white font-bold bg-gray-800 px-3 py-1 rounded-md border border-gray-700">{report.missionStatus === 'pending' ? 'جاري توجيه سيارة' : report.missionStatus}</span>
                            </div>
                            
                            <div className="flex items-center justify-between">
                                <span className="text-gray-500 text-sm">سيارات الإسعاف المكلفة</span>
                                <div className="flex flex-col gap-1 items-end">
                                    {ambulance && ambulance.length > 0 ? (
                                        ambulance.map(amb => (
                                            <span key={amb.id} className="font-bold px-3 py-1 rounded-md border bg-blue-900/30 border-blue-500/40 text-blue-300 text-sm block">
                                                {amb.name}
                                            </span>
                                        ))
                                    ) : (
                                        <span className="font-bold px-3 py-1 rounded-md border bg-gray-800 border-gray-700 text-gray-500">
                                            لم يتم التعيين بعد
                                        </span>
                                    )}
                                </div>
                            </div>

                            {report.description && (
                                <div className="mt-4 break-words">
                                    <span className="text-gray-500 text-sm block mb-1">الوصف العام للأزمة</span>
                                    <p className="text-gray-300 text-sm bg-gray-800 p-3 rounded-lg border border-gray-700 leading-relaxed">
                                        {report.description}
                                    </p>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Live Tracking Map Overlay */}
                    <div className="bg-gray-900/50 p-2 rounded-xl border border-gray-600 shadow-inner h-[250px] relative overflow-hidden">
                        <MapComponent 
                            centerLocation={null}
                            incidents={[report]}
                            // If mission isn't completed and has ambulances assigned, pass them in as moving on the map
                            ambulances={ambulance && report.missionStatus !== 'تم إنهاء المهمة' && report.missionStatus !== 'pending' ? ambulance.map(a => ({...a, status: 'في مهمة'})) : []}
                        />
                         {report.missionStatus === 'pending' && (
                             <div className="absolute inset-0 bg-black/40 backdrop-blur-[2px] z-40 flex items-center justify-center">
                                 <span className="bg-red-900/80 px-4 py-2 rounded-lg text-white font-bold animate-pulse flex items-center gap-2">
                                     <FaClock /> بانتظار الإنطلاق
                                 </span>
                             </div>
                         )}
                    </div>
                </div>

            </div>
        </div>
    );
};

export default MissionTracking;
