import { useState } from 'react';
import { FaTimes, FaCamera, FaUser, FaIdCard, FaPhoneAlt, FaMapMarkerAlt, FaClock, FaCheckCircle, FaAmbulance } from 'react-icons/fa';
import MapComponent from '../components/MapComponent';

const ReportDetails = ({ report, onClose }) => {
    if (!report) return null;

    const { sender, location, description, image, timestamp, missionStatus, id, dispatchTime, completedAt, ambulanceIds } = report;

    const getDuration = () => {
        if (!dispatchTime || !completedAt) return null;
        const start = new Date(dispatchTime);
        const end = new Date(completedAt);
        const diffInMs = end - start;
        const minutes = Math.floor(diffInMs / 60000);
        return `${minutes} دقيقة`;
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm" dir="rtl">
            <div className="bg-gray-900 border border-gray-700 w-full max-w-4xl max-h-[90vh] rounded-2xl shadow-2xl overflow-hidden flex flex-col animate-in fade-in zoom-in duration-200">
                
                {/* Header */}
                <div className="bg-gray-800 p-4 border-b border-gray-700 flex justify-between items-center">
                    <h2 className="text-xl font-bold text-white flex items-center gap-2">
                        تفاصيل البلاغ 
                        <span className="text-sm font-mono bg-gray-700 px-2 py-1 rounded text-gray-300">#{id}</span>
                    </h2>
                    <button 
                        onClick={onClose}
                        className="text-gray-400 hover:text-white hover:bg-gray-700 p-2 rounded-lg transition-colors"
                    >
                        <FaTimes className="text-xl" />
                    </button>
                </div>

                {/* Content Body */}
                <div className="flex-1 overflow-y-auto p-6 scrollbar-thin scrollbar-thumb-gray-600">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        
                        {/* Right Column: Sender & Incident Info */}
                        <div className="space-y-6">
                            
                            {/* Status Badge */}
                            <div className="bg-gray-800/50 p-4 rounded-xl border border-gray-700">
                                <span className="text-gray-400 text-sm block mb-1">حالة المهمة الحالية</span>
                                <span className={`inline-block px-4 py-1.5 rounded-full font-bold border ${
                                    missionStatus === 'pending' ? 'bg-red-900/40 border-red-500 text-red-400' : 
                                    missionStatus === 'تم إنهاء المهمة' ? 'bg-green-900/40 border-green-500 text-green-400' :
                                    'bg-blue-900/40 border-blue-500 text-blue-400'
                                }`}>
                                    {missionStatus === 'pending' ? 'بانتظار توجيه سيارة إسعاف' : missionStatus}
                                </span>
                            </div>

                            {/* Sender Info */}
                            {sender && (
                                <div className="bg-gray-800/50 p-5 rounded-xl border border-gray-700">
                                    <h3 className="text-lg font-bold text-white mb-4 border-b border-gray-700 pb-2">بيانات المُبلّغ</h3>
                                    <div className="flex items-start gap-4">
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
                                </div>
                            </div>

                        </div>

                        {/* Left Column: Map & Media */}
                        <div className="space-y-6">
                            
                            {/* Photo Evidence */}
                            <div className="bg-gray-800/50 p-5 rounded-xl border border-gray-700">
                                <h3 className="text-lg font-bold text-white mb-4 border-b border-gray-700 pb-2">الصورة المرفقة</h3>
                                {image ? (
                                    <img src={image} alt="Incident" className="w-full h-48 object-cover rounded-lg border border-gray-700" />
                                ) : (
                                    <div className="w-full h-48 bg-gray-900 border border-gray-700 rounded-lg flex flex-col items-center justify-center text-gray-500">
                                        <FaCamera className="text-4xl mb-2 text-gray-600" />
                                        <span>لا توجد صورة مرفقة</span>
                                    </div>
                                )}
                            </div>

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

            </div>
        </div>
    );
};

export default ReportDetails;
