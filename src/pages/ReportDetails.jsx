import { useState } from 'react';
import { FaTimes, FaCamera, FaUser, FaIdCard, FaPhoneAlt, FaMapMarkerAlt, FaClock, FaCheckCircle, FaAmbulance, FaVideo, FaBroadcastTower, FaExclamationCircle, FaMicrophone, FaVolumeUp } from 'react-icons/fa';
import MapComponent from '../components/MapComponent';
import { markAsFalseReport, getCenters, findPrimaryIncidentById } from '../services/db';
import { FaPrint, FaFileAlt, FaShieldAlt } from 'react-icons/fa';
import { Link } from 'react-router-dom';

const ReportDetails = ({ report, onClose }) => {
    const [selectedMedia, setSelectedMedia] = useState(null);
    const [isMarkingFalse, setIsMarkingFalse] = useState(false);
    const [falseReason, setFalseReason] = useState('');
    const [showFormalView, setShowFormalView] = useState(false);
    
    if (!report) return null;

    const { sender, location, description, images, image, videos, video, audios, audio, timestamp, missionStatus, id, dispatchTime, completedAt, ambulanceIds, source, cameraId, severity, subReports, isFalseReport, falseReportReason, assignedCenterId } = report;

    const centerName = getCenters().find(c => c.id === assignedCenterId)?.name || 'المركز الرئيسي';

    const getDuration = () => {
        if (!dispatchTime || !completedAt) return null;
        const start = new Date(dispatchTime);
        const end = new Date(completedAt);
        const diffInMs = end - start;
        const minutes = Math.floor(diffInMs / 60000);
        return `${minutes} دقيقة`;
    };

    const handleMarkFalse = () => {
        if (!falseReason.trim()) return;
        markAsFalseReport(id, falseReason);
        setIsMarkingFalse(false);
        onClose(); // Close details to refresh dashboard
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm" dir="rtl">
            <div className="bg-gray-900 border border-gray-700 w-full max-w-4xl max-h-[90vh] rounded-2xl shadow-2xl overflow-hidden flex flex-col animate-in fade-in zoom-in duration-200">
                
                {/* Header */}
                <div className="bg-gray-800 p-4 border-b border-gray-700 flex justify-between items-center">
                    <h2 className="text-xl font-bold text-white flex items-center gap-2">
                        تفاصيل الحادث
                        <span className="text-sm font-mono bg-gray-700 px-2 py-1 rounded text-gray-300">#{id}</span>
                        {subReports?.length > 0 && (
                            <span className="text-xs font-bold bg-orange-600 text-white px-2 py-1 rounded-full animate-pulse">
                                {subReports.length + 1} بلاغات مجمعة
                            </span>
                        )}
                    </h2>
                    <div className="flex items-center gap-2">
                        <Link 
                            to={`/paramedic-dashboard/${report.id}`}
                            className="bg-blue-600 hover:bg-blue-500 text-white px-4 py-2 rounded-lg text-xs font-bold flex items-center gap-2 transition-all"
                        >
                            <FaAmbulance /> صفحة السائق
                        </Link>
                        <button 
                            onClick={onClose}
                            className="text-gray-400 hover:text-white hover:bg-gray-700 p-2 rounded-lg transition-colors"
                        >
                            <FaTimes className="text-xl" />
                        </button>
                    </div>
                </div>

                {/* Content Body */}
                <div className="flex-1 overflow-y-auto p-4 md:p-6 scrollbar-thin scrollbar-thumb-gray-600">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-8">
                        
                        {/* Right Column: Sender & Incident Info */}
                        <div className="space-y-6">
                            
                            {/* Status Badge */}
                            <div className="bg-gray-800/50 p-4 rounded-xl border border-gray-700 flex justify-between items-center">
                                <div>
                                    <span className="text-gray-400 text-sm block mb-1">حالة المهمة الحالية</span>
                                    <span className={`inline-block px-4 py-1.5 rounded-full font-bold border ${
                                        isFalseReport ? 'bg-gray-700 border-gray-500 text-gray-400' :
                                        missionStatus === 'pending' ? 'bg-red-900/40 border-red-500 text-red-400' : 
                                        missionStatus === 'تم إنهاء المهمة' ? 'bg-green-900/40 border-green-500 text-green-400' :
                                        'bg-blue-900/40 border-blue-500 text-blue-400'
                                    }`}>
                                        {isFalseReport ? 'بلاغ كاذب (ملغي)' : (missionStatus === 'pending' ? 'بانتظار توجيه سيارة إسعاف' : missionStatus)}
                                    </span>
                                </div>
                                {isFalseReport && (
                                    <button 
                                        onClick={() => setShowFormalView(true)}
                                        className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-2 transition-all shadow-lg shadow-blue-900/20"
                                    >
                                        <FaFileAlt /> عرض التقرير الرسمي
                                    </button>
                                )}
                                <div className="text-left flex flex-col items-end gap-1">
                                    <span className="text-gray-400 text-sm block">مصدر البلاغ</span>
                                    <div className="flex gap-2">
                                        <span className={`flex items-center gap-2 px-3 py-1 rounded-lg text-xs font-bold border ${
                                            source === 'automated' ? 'bg-purple-900/30 border-purple-500/50 text-purple-400' : 'bg-blue-900/30 border-blue-500/50 text-blue-400'
                                        }`}>
                                            {source === 'automated' ? <><FaVideo/> رصد آلي</> : <><FaBroadcastTower/> تطبيق</>}
                                        </span>
                                        {severity > 1 && (
                                            <span className={`px-3 py-1 rounded-lg text-xs font-bold border ${
                                                severity >= 4 ? 'bg-red-600 text-white' : 'bg-orange-600/20 text-orange-400 border-orange-500/50'
                                            }`}>
                                                خطورة {severity}
                                            </span>
                                        )}
                                    </div>
                                </div>
                            </div>

                            {/* Sender Info / Camera Info */}
                            {source === 'automated' ? (
                                <div className="bg-purple-900/10 p-5 rounded-xl border border-purple-500/30 shadow-inner">
                                    <h3 className="text-lg font-bold text-white mb-4 border-b border-purple-500/20 pb-2 flex items-center gap-2">
                                        <FaVideo className="text-purple-400" /> تفاصيل الكاميرا الذكية
                                    </h3>
                                    <div className="flex items-center gap-6">
                                        <div className="w-20 h-20 rounded-2xl bg-purple-900/30 border-2 border-purple-500/50 flex items-center justify-center text-purple-400 shadow-xl shrink-0">
                                            <FaBroadcastTower className="text-4xl" />
                                        </div>
                                        <div className="space-y-2">
                                            <div className="text-gray-400 text-sm uppercase tracking-widest font-bold">معرف الوحدة التلقائية</div>
                                            <div className="text-2xl font-black text-white font-mono tracking-tighter">{cameraId || 'CAM-NODE-01'}</div>
                                            <div className="text-xs text-purple-300/70">نظام الرؤية الحاسوبية - الإصدار 2.4.0</div>
                                        </div>
                                    </div>
                                </div>
                            ) : sender && (
                                <div className="bg-gray-800/50 p-5 rounded-xl border border-gray-700">
                                    <h3 className="text-lg font-bold text-white mb-4 border-b border-gray-700 pb-2">بيانات المُبلّغ</h3>
                                    <div className="flex flex-col sm:flex-row items-center sm:items-start gap-4">
                                        {sender.senderPhoto ? (
                                            <img src={sender.senderPhoto} alt="Sender" className="w-24 h-24 rounded-full border-2 border-gray-600 object-cover shadow-lg" />
                                        ) : (
                                            <div className="w-24 h-24 rounded-full bg-gray-700 border-2 border-gray-600 flex items-center justify-center text-gray-400 shadow-lg shrink-0">
                                                <FaUser className="text-3xl" />
                                            </div>
                                        )}
                                        <div className="space-y-3 flex-1 mt-2">
                                            <div className="flex items-center gap-2 text-gray-200">
                                                <FaUser className="text-gray-500" /> <span className="font-semibold">{sender.fullName || 'غير متوفر'}</span>
                                            </div>
                                            <div className="flex items-center gap-2 text-gray-300 text-sm">
                                                <FaIdCard className="text-gray-500" /> <span className="font-mono">{sender.nationalId || 'غير متوفر'}</span>
                                            </div>
                                            <div className="flex items-center gap-2 text-gray-300 text-sm">
                                                <FaPhoneAlt className="text-gray-500" /> <span className="font-mono" dir="ltr">{sender.phone || 'غير متوفر'}</span>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* Additional Grouped Reports */}
                            {subReports && subReports.length > 0 && (
                                <div className="bg-gray-800/30 p-5 rounded-xl border border-dashed border-gray-600">
                                    <h3 className="text-md font-bold text-orange-400 mb-4 flex items-center gap-2">
                                        <FaExclamationCircle /> بلاغات إضافية مطابقة ({subReports.length})
                                    </h3>
                                    <div className="space-y-6">
                                        {subReports.map((sub, idx) => (
                                            <div key={idx} className="bg-gray-900/50 p-4 rounded-xl border border-gray-700 shadow-inner">
                                                <div className="flex justify-between items-center mb-4 pb-3 border-b border-gray-800">
                                                    <div className="flex items-center gap-3">
                                                        {sub.sender?.senderPhoto ? (
                                                            <img src={sub.sender.senderPhoto} alt={sub.sender.fullName} className="w-10 h-10 rounded-full border border-orange-500/30 object-cover" />
                                                        ) : (
                                                            <div className="w-10 h-10 rounded-full bg-orange-900/20 flex items-center justify-center text-orange-400 border border-orange-500/20">
                                                                <FaUser className="text-sm" />
                                                            </div>
                                                        )}
                                                        <div>
                                                            <span className="font-bold text-white text-sm block">{sub.sender?.fullName || 'مبلغ مجهول'}</span>
                                                            <span className="text-[10px] text-orange-400/80 font-bold uppercase tracking-wider">مُبلّغ إضافي #{idx + 1}</span>
                                                        </div>
                                                    </div>
                                                    <span className="text-[9px] text-gray-500 font-mono tracking-tighter bg-gray-950 px-1.5 py-0.5 rounded">INC-{sub.id?.slice(-4)}</span>
                                                </div>
                                                
                                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                                    <div className="space-y-2 relative pr-4 after:absolute after:right-0 after:top-1 after:bottom-1 after:w-[1px] after:bg-gray-700">
                                                        <div className="flex items-center gap-2 text-[11px] text-gray-300">
                                                            <FaIdCard className="text-gray-500 w-3" /> <span className="font-mono">{sub.sender?.nationalId || 'هوية غير مسجلة'}</span>
                                                        </div>
                                                        <div className="flex items-center gap-2 text-[11px] text-blue-400">
                                                            <FaPhoneAlt className="text-blue-500 w-3" /> <span className="font-mono" dir="ltr">{sub.sender?.phone || 'جوال غير مسجل'}</span>
                                                        </div>
                                                        <div className="flex items-center gap-2 text-[10px] text-gray-500">
                                                            <FaClock className="text-[10px]" /> {new Date(sub.timestamp).toLocaleString('ar-SA')}
                                                        </div>
                                                    </div>
                                                    <div className="space-y-2">
                                                        {sub.description ? (
                                                            <div className="relative p-2.5 bg-gray-950/60 rounded-lg border-r-2 border-orange-500/50 text-[11px] leading-relaxed italic text-gray-300 shadow-inner">
                                                                "{sub.description}"
                                                            </div>
                                                        ) : (
                                                            <div className="text-[10px] text-gray-600 italic">لا يوجد وصف نصي مرفق</div>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Incident Info */}
                            <div className="bg-gray-800/50 p-5 rounded-xl border border-gray-700">
                                <h3 className="text-lg font-bold text-white mb-4 border-b border-gray-700 pb-2">تفاصيل الحادث والمهمة</h3>
                                <div className="space-y-3">
                                    <div className="flex items-start gap-3 text-gray-300">
                                        <FaClock className="text-gray-500 mt-1 shrink-0" />
                                        <span>وقت البلاغ: {new Date(timestamp).toLocaleString('ar-SA')}</span>
                                    </div>
                                    
                                    {dispatchTime && (
                                        <div className="flex items-start gap-3 text-gray-300">
                                            <FaClock className="text-blue-400 mt-1 shrink-0" />
                                            <span>وقت الإنطلاق: {new Date(dispatchTime).toLocaleTimeString('ar-SA')}</span>
                                        </div>
                                    )}

                                    {completedAt && (
                                        <div className="flex items-start gap-3 text-gray-300">
                                            <FaCheckCircle className="text-green-500 mt-1 shrink-0" />
                                            <span>وقت الإنتهاء: {new Date(completedAt).toLocaleTimeString('ar-SA')}</span>
                                        </div>
                                    )}

                                    {getDuration() && (
                                        <div className="flex justify-between items-center bg-gray-900 border border-gray-700 p-2 rounded-lg text-sm text-gray-200 mt-2">
                                            <span>المدة المستغرقة للمهمة:</span>
                                            <span className="font-bold text-blue-400">{getDuration()}</span>
                                        </div>
                                    )}

                                    <div className="flex items-start gap-3 text-gray-300 mt-4">
                                        <FaMapMarkerAlt className="text-gray-500 mt-1 shrink-0" />
                                        <div className="font-mono text-sm leading-relaxed">
                                            Lat: {location?.lat?.toFixed(5)}<br/>
                                            Lng: {location?.lng?.toFixed(5)}
                                        </div>
                                    </div>
                                    
                                    <div className="flex items-start gap-3 text-gray-300 mt-4">
                                        <FaAmbulance className="text-gray-500 mt-1 shrink-0" />
                                        <div className="text-sm leading-relaxed">
                                            الوحدات الموجهة: {ambulanceIds && ambulanceIds.length > 0 ? ambulanceIds.length : 0}
                                        </div>
                                    </div>
                                    
                                    <div className="mt-4 p-3 bg-gray-900 border border-gray-700 rounded-lg text-gray-200 leading-relaxed">
                                        {description}
                                    </div>
                                    
                                    {isFalseReport && (
                                        <div className="mt-4 p-4 bg-red-900/20 border border-red-500/50 rounded-lg">
                                            <div className="text-red-400 font-bold text-sm mb-1 flex items-center gap-2">
                                                <FaExclamationCircle /> سبب تصنيف البلاغ كاذب:
                                            </div>
                                            <p className="text-gray-300 text-sm italic">{falseReportReason}</p>
                                        </div>
                                    )}

                                    {!isFalseReport && missionStatus !== 'تم إنهاء المهمة' && (
                                        <div className="mt-6 pt-6 border-t border-gray-700">
                                            {isMarkingFalse ? (
                                                <div className="space-y-3 animate-in slide-in-from-top-2 duration-200">
                                                    <textarea 
                                                        className="w-full bg-gray-900 border border-red-500/50 rounded-lg p-3 text-sm text-white placeholder-gray-500 focus:ring-1 focus:ring-red-500 outline-none"
                                                        placeholder="اذكر سبب تصنيف البلاغ كاذب (مثلاً: لا يوجد حادث في الموقع، بلاغ إزعاج...)"
                                                        rows="3"
                                                        value={falseReason}
                                                        onChange={(e) => setFalseReason(e.target.value)}
                                                    />
                                                    <div className="flex gap-2">
                                                        <button 
                                                            onClick={handleMarkFalse}
                                                            className="flex-1 bg-red-600 hover:bg-red-700 text-white font-bold py-2 rounded-lg text-sm transition-colors"
                                                        >
                                                            تأكيد أنه كاذب
                                                        </button>
                                                        <button 
                                                            onClick={() => setIsMarkingFalse(false)}
                                                            className="px-4 bg-gray-700 hover:bg-gray-600 text-white font-bold py-2 rounded-lg text-sm transition-colors"
                                                        >
                                                            إلغاء
                                                        </button>
                                                    </div>
                                                </div>
                                            ) : (
                                                <button 
                                                    onClick={() => setIsMarkingFalse(true)}
                                                    className="w-full border border-red-500/50 text-red-500 hover:bg-red-500 hover:text-white font-bold py-2 rounded-lg text-sm transition-all flex items-center justify-center gap-2"
                                                >
                                                    <FaExclamationCircle /> تصنيف كبلاغ كاذب
                                                </button>
                                            )}
                                        </div>
                                    )}
                                </div>
                            </div>

                        </div>

                        {/* Left Column: Map & Media */}
                        <div className="space-y-6">
                            
                            {/* Photo & Video Evidence Gallery */}
                             <div className="bg-gray-800/50 p-5 rounded-xl border border-gray-700">
                                 {(() => {
                                     const primaryImages = images || (image ? [image] : []);
                                     const primaryVideos = videos || (video ? [video] : []);
                                     
                                     const allSubMedia = (subReports || []).flatMap(sub => {
                                         const sImgs = sub.images || (sub.image ? [sub.image] : []);
                                         const sVids = sub.videos || (sub.video ? [sub.video] : []);
                                         return [
                                             ...sImgs.map(url => ({ url, type: 'image', sender: sub.sender?.fullName?.split(' ')[0] || 'مبلغ' })),
                                             ...sVids.map(url => ({ url, type: 'video', sender: sub.sender?.fullName?.split(' ')[0] || 'مبلغ' }))
                                         ];
                                     });

                                     const primaryMedia = [
                                         ...primaryImages.map(url => ({ url, type: 'image', isPrimary: true })),
                                         ...primaryVideos.map(url => ({ url, type: 'video', isPrimary: true }))
                                     ];

                                     const totalMedia = primaryMedia.length + allSubMedia.length;

                                     return ( totalMedia > 0 && 
                                         <>
                                             <h3 className="text-lg font-bold text-white mb-4 border-b border-gray-700 pb-2 flex items-center justify-between">
                                                 <span>المعرض المرئي للحادث ({totalMedia})</span>
                                                 {primaryVideos.length > 0 && <span className="text-[10px] bg-red-600 px-2 py-0.5 rounded text-white animate-pulse">يوجد فيديو 📹</span>}
                                             </h3>
                                             <div className="grid grid-cols-2 gap-2">
                                                 {[...primaryMedia, ...allSubMedia].map((item, i) => (
                                                     <div 
                                                        key={i} 
                                                        onClick={() => setSelectedMedia(item)}
                                                        className={`relative group cursor-pointer overflow-hidden rounded-lg border ${item.isPrimary ? 'border-blue-500/40 shadow-[0_0_10px_rgba(59,130,246,0.2)]' : 'border-gray-700'} hover:border-blue-400 transition-all`}
                                                     >
                                                         {item.type === 'video' ? (
                                                             <div className="relative h-32 w-full bg-black">
                                                                 <video 
                                                                     src={item.url} 
                                                                     className="w-full h-full object-cover opacity-80 group-hover:opacity-100 transition-opacity" 
                                                                     muted loop playsInline
                                                                     onMouseOver={e => e.target.play()}
                                                                     onMouseOut={e => e.target.pause()}
                                                                 />
                                                                 <div className="absolute inset-0 flex items-center justify-center">
                                                                     <div className="w-10 h-10 rounded-full bg-black/60 flex items-center justify-center border border-white/20 group-hover:scale-110 transition-transform">
                                                                         <FaVideo className="text-white text-sm" />
                                                                     </div>
                                                                 </div>
                                                             </div>
                                                         ) : (
                                                             <img src={item.url} alt="Evidence" className="w-full h-32 object-cover transition-transform group-hover:scale-110" />
                                                         )}
                                                         
                                                         {item.isPrimary ? (
                                                             <span className="absolute top-1 right-1 bg-blue-600 text-[8px] text-white px-1.5 py-0.5 rounded font-bold shadow-lg z-10">البلاغ الرئيسي</span>
                                                         ) : (
                                                             <span className="absolute top-1 right-1 bg-gray-900/80 text-[8px] text-gray-300 px-1.5 py-0.5 rounded font-bold z-10">{item.sender}</span>
                                                         )}
                                                         
                                                         <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end p-2">
                                                             <span className="text-[9px] text-white font-medium">{item.type === 'video' ? 'تشغيل الفيديو...' : 'عرض الصورة'}</span>
                                                         </div>
                                                     </div>
                                                 ))}
                                             </div>
                                         </>
                                     );
                                 })()}
                             </div>

                             {/* Voice Evidence Section */}
                             {(() => {
                                 const primaryAudios = audios || (audio ? [audio] : []);
                                 const allSubAudios = (subReports || []).flatMap(sub => {
                                     const sAuds = sub.audios || (sub.audio ? [sub.audio] : []);
                                     return sAuds.map(url => ({ url, sender: sub.sender?.fullName?.split(' ')[0] || 'مبلغ' }));
                                 });

                                 if (primaryAudios.length === 0 && allSubAudios.length === 0) return null;

                                 return (
                                     <div className="bg-gray-800/50 p-5 rounded-xl border border-gray-700">
                                         <h3 className="text-lg font-bold text-white mb-4 border-b border-gray-700 pb-2 flex items-center gap-2">
                                             <FaMicrophone className="text-orange-500" />
                                             البلاغات الصوتية ({primaryAudios.length + allSubAudios.length})
                                         </h3>
                                         <div className="space-y-3">
                                             {primaryAudios.map((url, i) => (
                                                 <div key={`p-aud-${i}`} className="bg-gray-900/50 p-3 rounded-lg border border-blue-500/30">
                                                     <div className="flex items-center justify-between mb-2">
                                                         <span className="text-[10px] text-blue-400 font-bold flex items-center gap-1">
                                                             <FaVolumeUp /> البلاغ الرئيسي
                                                         </span>
                                                     </div>
                                                     <audio src={url} controls className="w-full h-8 mt-1" />
                                                 </div>
                                             ))}
                                             {allSubAudios.map((item, i) => (
                                                 <div key={`s-aud-${i}`} className="bg-gray-900/50 p-3 rounded-lg border border-gray-700">
                                                     <div className="flex items-center justify-between mb-2">
                                                         <span className="text-[10px] text-orange-400 font-bold flex items-center gap-1">
                                                             <FaVolumeUp /> بلاغ إضافي ({item.sender})
                                                         </span>
                                                     </div>
                                                     <audio src={item.url} controls className="w-full h-8 mt-1" />
                                                 </div>
                                             ))}
                                         </div>
                                     </div>
                                 );
                             })()}

                             {/* Location Map */}
                            <div className="bg-gray-800/50 p-5 rounded-xl border border-gray-700 relative overflow-hidden">
                                <h3 className="text-lg font-bold text-white mb-4 border-b border-gray-700 pb-2 relative z-10 bg-gray-800">موقع الحادث جغرافياً</h3>
                                <div className="h-[250px] -mx-5 -mb-5 relative overflow-hidden border-t border-gray-700">
                                    <MapComponent 
                                        centerLocation={null} // Don't show the center locally, just the incident
                                        incidents={[report]} 
                                        ambulances={[]}
                                    />
                                    <div className="absolute inset-0 border-[4px] border-gray-800 pointer-events-none z-50 rounded-b-xl max-h-[250px]"></div>
                                </div>
                            </div>
                        </div>

                    </div>
                </div>

                {/* Media Lightbox/Modal */}
                {selectedMedia && (
                    <div 
                        className="fixed inset-0 z-[100] flex items-center justify-center bg-black/95 backdrop-blur-md p-4 md:p-12 transition-all animate-in fade-in duration-300"
                        onClick={() => setSelectedMedia(null)}
                    >
                        <button 
                            className="absolute top-6 left-6 text-white text-3xl hover:text-gray-300 z-[110]"
                            onClick={() => setSelectedMedia(null)}
                        >
                            <FaTimes />
                        </button>
                        
                        <div className="relative max-w-5xl w-full h-full flex flex-col items-center justify-center gap-4" onClick={e => e.stopPropagation()}>
                            {selectedMedia.type === 'video' ? (
                                <video 
                                    src={selectedMedia.url} 
                                    className="max-h-[80vh] rounded-xl shadow-2xl border border-gray-800"
                                    controls 
                                    autoPlay 
                                />
                            ) : (
                                <img 
                                    src={selectedMedia.url} 
                                    alt="Enlarged evidence" 
                                    className="max-h-[80vh] object-contain rounded-xl shadow-2xl border border-gray-800"
                                />
                            )}
                            
                            <div className="text-center">
                                <span className={`inline-block px-3 py-1 rounded-full text-xs font-bold mb-2 ${selectedMedia.isPrimary ? 'bg-blue-600' : 'bg-gray-700'}`}>
                                    {selectedMedia.isPrimary ? 'البلاغ الرئيسي' : `مبلغ: ${selectedMedia.sender}`}
                                </span>
                                <h4 className="text-white text-lg font-medium">معاينة كاملة للوسائط</h4>
                            </div>
                        </div>
                    </div>
                )}

                {/* Formal Report Document Modal */}
                {showFormalView && (
                    <div className="fixed inset-0 z-[120] flex items-center justify-center bg-black/80 backdrop-blur-md p-4 animate-in fade-in duration-300">
                        <div className="bg-white text-gray-900 w-full max-w-2xl h-[90vh] overflow-y-auto rounded-none shadow-2xl relative flex flex-col">
                            {/* Document Actions Bar */}
                            <div className="sticky top-0 bg-gray-100 p-2 border-b border-gray-300 flex justify-between items-center z-10 px-4">
                                <div className="flex gap-2">
                                    <button onClick={() => window.print()} className="bg-gray-800 text-white p-2 rounded hover:bg-gray-700 transition-colors" title="طباعة">
                                        <FaPrint />
                                    </button>
                                </div>
                                <h3 className="text-gray-600 font-bold text-sm">معاينة المستند الرسمي</h3>
                                <button onClick={() => setShowFormalView(false)} className="text-gray-500 hover:text-red-600 p-2 text-xl transition-colors">
                                    <FaTimes />
                                </button>
                            </div>

                            {/* Actual A4 Page */}
                            <div className="p-12 flex-1 font-serif bg-white text-right" id="printable-report">
                                {/* Header */}
                                <div className="flex justify-between items-start border-b-2 border-gray-900 pb-6 mb-8">
                                    <div className="text-center space-y-1">
                                        <h1 className="text-xl font-bold">هيئة الإسعاف المصرية</h1>
                                        <p className="text-xs">وزارة الصحة والسكان</p>
                                        <p className="text-xs">قطاع العمليات المركزية</p>
                                    </div>
                                    <div className="w-20 h-20 bg-gray-200 rounded-full flex items-center justify-center border-2 border-gray-900">
                                        <FaShieldAlt className="text-4xl text-gray-800" />
                                    </div>
                                    <div className="text-left text-[10px] space-y-1 font-mono">
                                        <p>REF NO: ERR-{id?.slice(0, 8)}</p>
                                        <p>DATE: {new Date().toLocaleDateString('en-GB')}</p>
                                        <p>ZONE: {centerName}</p>
                                    </div>
                                </div>

                                {/* Title */}
                                <div className="text-center mb-10">
                                    <h2 className="text-2xl font-black underline decoration-double underline-offset-8">تقرير إثبات بلاغ كاذب</h2>
                                </div>

                                {/* Body */}
                                <div className="space-y-6">
                                    <p className="leading-relaxed">
                                        بناءً على البلاغ الوارد إلى غرفة العمليات برقم مرجعي <span className="font-bold">({id})</span> في تمام الساعة <span className="font-bold">{new Date(timestamp).toLocaleTimeString('ar-SA')}</span> بتاريخ <span className="font-bold">{new Date(timestamp).toLocaleDateString('ar-SA')}</span>.
                                    </p>

                                    <div className="bg-gray-50 border border-gray-200 p-4 space-y-4">
                                        <h3 className="font-bold border-b border-gray-300 pb-2 flex items-center gap-2">
                                            <FaUser className="text-xs text-gray-400" /> بيانات المبلّغ الأول (الرئيسي):
                                        </h3>
                                        <div className="flex gap-6 items-start">
                                            {sender?.senderPhoto && (
                                                <img src={sender.senderPhoto} alt="Primary Reporter" className="w-16 h-16 rounded border-2 border-gray-900 object-cover bg-white" />
                                            )}
                                            <div className="grid grid-cols-2 gap-x-8 gap-y-2 text-sm flex-1">
                                                <div><span className="text-gray-600 font-bold">الاسم الكامل:</span> {sender?.fullName || 'غير متوفر'}</div>
                                                <div><span className="text-gray-600 font-bold">الرقم القومي / الهوية:</span> {sender?.nationalId || 'مجهولة'}</div>
                                                <div><span className="text-gray-600 font-bold">رقم الجوال:</span> {sender?.phone || 'غير متوفر'}</div>
                                                <div><span className="text-gray-600 font-bold">مصدر الإبلاغ:</span> {source === 'automated' ? 'نظام الرصد الآلي' : 'تطبيق الهاتف الذكي'}</div>
                                            </div>
                                        </div>
                                        <div className="text-sm bg-white p-2 border border-dashed border-gray-300 rounded">
                                            <span className="text-gray-600 italic font-bold">بلاغ المبلّغ:</span> "{description}"
                                        </div>
                                    </div>

                                    {/* Additional Reporters Section */}
                                    {subReports && subReports.length > 0 && (
                                        <div className="space-y-4 pt-2">
                                            <h3 className="font-bold border-b-2 border-gray-200 pb-2 text-sm">المُبلغون الإضافيون المرتبطون بنفس الحادث ({subReports.length}):</h3>
                                            <div className="grid grid-cols-1 gap-3">
                                                {subReports.map((sub, sIdx) => (
                                                    <div key={sIdx} className="flex gap-4 items-center bg-gray-50/50 p-3 border border-gray-200 rounded">
                                                        {sub.sender?.senderPhoto ? (
                                                            <img src={sub.sender.senderPhoto} alt={sub.sender.fullName} className="w-12 h-12 rounded border border-gray-400 object-cover shadow-sm bg-white" />
                                                        ) : (
                                                            <div className="w-12 h-12 rounded border border-gray-400 bg-gray-100 flex items-center justify-center text-gray-400">
                                                                <FaUser className="text-lg" />
                                                            </div>
                                                        )}
                                                        <div className="grid grid-cols-3 gap-4 text-[11px] flex-1">
                                                            <div><span className="text-gray-500">الاسم:</span> <span className="font-bold">{sub.sender?.fullName || 'غير مسجل'}</span></div>
                                                            <div><span className="text-gray-500">الهوية:</span> <span className="font-mono">{sub.sender?.nationalId || 'غير متوفر'}</span></div>
                                                            <div><span className="text-gray-500">الجوال:</span> <span className="font-mono">{sub.sender?.phone || 'غير متوفر'}</span></div>
                                                        </div>
                                                        <div className="text-[9px] text-gray-400 font-mono italic">REF: {sub.id?.slice(-5)}</div>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    )}

                                    <div className="space-y-4 pt-4">
                                        <h3 className="text-lg font-bold text-red-700 flex items-center gap-2">
                                            <FaExclamationCircle className="text-sm" /> نتيجة الفحص الإداري والميداني:
                                        </h3>
                                        <p className="bg-red-50 p-4 border-r-4 border-red-700 text-md leading-loose">
                                            بعد مراجعة المعطيات وموقع الحادث ومعايير التحقق، تم تصنيف هذا البلاغ كبلاغ <span className="font-black text-red-800">كاذب / غير حقيقي</span> للأسباب التالية:
                                            <br />
                                            <span className="font-bold text-lg underline decoration-red-300">"{falseReportReason}"</span>
                                        </p>
                                    </div>

                                    <p className="text-sm text-gray-600 pt-6 italic">
                                        * ملاحظة: تم إدراج هذا المُبلغ ضمن القائمة المحذورة (Blacklist) لحين المراجعة القانونية.
                                    </p>
                                </div>

                                {/* Footer / Stamps */}
                                <div className="mt-20 flex justify-between items-end">
                                    <div className="text-center space-y-6 w-48">
                                        <p className="text-sm font-bold">ختم المركز</p>
                                        <div className="w-24 h-24 border-2 border-blue-900/30 rounded-full mx-auto opacity-10 flex items-center justify-center border-dashed">
                                            <span className="text-[10px] transform -rotate-45">OFFICIAL STAMP</span>
                                        </div>
                                    </div>
                                    <div className="text-right space-y-2">
                                        <p className="text-sm font-bold underline">توقيع مدير العمليات:</p>
                                        <p className="font-mono text-lg italic pr-4 text-gray-400">Ahmed M. Al-Farouq</p>
                                        <p className="text-xs text-gray-500">تم اعتماده آلياً بواسطة النظام الذكي</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default ReportDetails;
