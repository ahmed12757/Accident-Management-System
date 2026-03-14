import { FaAmbulance, FaMapMarkerAlt, FaHospitalAlt, FaStreetView } from 'react-icons/fa';
import { getCenters } from '../services/db';

const MapComponent = ({ centerLocation, incidents = [], ambulances = [] }) => {
    // Map bounds for Riyadh approx visualization
    const minLat = 24.6;
    const maxLat = 24.8;
    const minLng = 46.5;
    const maxLng = 46.8;

    const getPosition = (lat, lng) => {
        const x = ((lng - minLng) / (maxLng - minLng)) * 100;
        const y = ((maxLat - lat) / (maxLat - minLat)) * 100; // inverted Y
        return { left: `${Math.max(5, Math.min(95, x))}%`, top: `${Math.max(5, Math.min(95, y))}%` };
    };

    return (
        <div className="relative w-full h-[450px] bg-[#0c1322] rounded-xl overflow-hidden border-2 border-slate-700 shadow-2xl">
            {/* Grid overlay for tech look */}
            <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.03)_1px,transparent_1px)] bg-[size:40px_40px]"></div>
            
            {/* Radar scanner effect */}
            <div className="absolute top-1/2 left-1/2 w-[800px] h-[800px] -ml-[400px] -mt-[400px] rounded-full border border-blue-500/10 shadow-[inset_0_0_50px_rgba(59,130,246,0.1)] pointer-events-none"></div>

            {/* Center Pin */}
            {centerLocation && (
                <div 
                    className="absolute transform -translate-x-1/2 -translate-y-1/2 flex flex-col items-center z-10 transition-all duration-500"
                    style={getPosition(centerLocation.lat, centerLocation.lng)}
                >
                    <div className="absolute w-16 h-16 bg-blue-500/20 rounded-full animate-ping"></div>
                    <div className="bg-blue-600 p-3 rounded-full shadow-[0_0_20px_rgba(37,99,235,0.8)] border-2 border-blue-300">
                        <FaHospitalAlt className="text-white text-2xl" />
                    </div>
                </div>
            )}

            {/* Incidents Pins */}
            {incidents.map(inc => (
                <div 
                    key={inc.id}
                    className="absolute transform -translate-x-1/2 -translate-y-1/2 flex flex-col items-center z-20 group"
                    style={getPosition(inc.location.lat, inc.location.lng)}
                >
                    {inc.missionStatus === 'pending' && <div className="absolute w-12 h-12 bg-red-500/30 rounded-full animate-ping"></div>}
                    <FaMapMarkerAlt className={`text-4xl filter drop-shadow-[0_0_10px_rgba(220,38,38,0.9)] transition-colors ${
                        inc.missionStatus === 'pending' ? 'text-red-500' : 
                        inc.missionStatus === 'تم إنهاء المهمة' ? 'text-gray-500 drop-shadow-none' : 'text-yellow-400'
                    }`} />
                    <div className="opacity-0 group-hover:opacity-100 transition-opacity absolute top-10 w-32 bg-gray-900 border border-gray-600 text-white text-xs p-2 rounded shadow-xl text-center z-50">
                        بلاغ #{inc.id}<br/>
                        {inc.missionStatus}
                    </div>
                </div>
            ))}

            {/* Ambulances Pins Mocking Movement */}
            {ambulances.map(ambulance => {
                let mockLat, mockLng;
                const center = getCenters().find(c => c.id === ambulance.centerId);
                
                if (ambulance.status === 'متاحة') {
                    if (center) {
                        mockLat = center.location.lat;
                        mockLng = center.location.lng;
                    } else {
                        // Fallback if no center is defined for an available ambulance
                        mockLat = centerLocation ? centerLocation.lat : 24.7;
                        mockLng = centerLocation ? centerLocation.lng : 46.6;
                    }
                } else {
                    // Find an incident this ambulance is assigned to (handling ambulanceIds array)
                    const assignedIncident = incidents.find(inc => 
                        inc.ambulanceIds && inc.ambulanceIds.includes(ambulance.id) && inc.missionStatus !== 'تم إنهاء المهمة'
                    );
                    
                    if (assignedIncident && assignedIncident.location) {
                        // Place slightly offset from incident to avoid exact overlap if multiple ambulances
                        // This uses a simple deterministic offset based on the ambulance ID's last character code
                        const idCode = ambulance.id.charCodeAt(ambulance.id.length - 1);
                        const offsetLat = (idCode % 5) * 0.0003; 
                        const offsetLng = (idCode % 7) * 0.0003;
                        mockLat = assignedIncident.location.lat + offsetLat;
                        mockLng = assignedIncident.location.lng + offsetLng;
                    } else if (center) {
                        mockLat = center.location.lat;
                        mockLng = center.location.lng;
                    } else {
                        // Fallback if no assigned incident or center
                        mockLat = centerLocation ? centerLocation.lat + 0.02 : 24.72;
                        mockLng = centerLocation ? centerLocation.lng + 0.02 : 46.62;
                    }
                }

                return (
                    <div 
                        key={ambulance.id}
                        className="absolute transform -translate-x-1/2 -translate-y-1/2 flex flex-col items-center z-30 transition-all duration-[2000ms] ease-in-out group"
                        style={getPosition(mockLat, mockLng)}
                    >
                        <div className={`p-2 rounded-lg border-2 shadow-[0_0_15px_rgba(0,0,0,0.5)] ${
                            ambulance.status === 'متاحة' ? 'bg-gray-800 border-green-500 text-green-400' : 'bg-orange-900 border-orange-500 text-orange-200'
                        }`}>
                            <FaAmbulance className="text-xl" />
                        </div>
                        <span className="text-[11px] font-bold text-gray-200 mt-1 bg-black/80 px-2 py-0.5 rounded border border-gray-700">{ambulance.name}</span>
                    </div>
                )
            })}
            
            {/* Map Legend */}
            <div className="absolute bottom-4 right-4 bg-gray-900/90 border border-gray-700 p-3 rounded-lg shadow-xl backdrop-blur flex flex-col gap-2">
                <div className="flex items-center gap-2 text-xs text-white"><FaHospitalAlt className="text-blue-500"/> مركز الإسعاف</div>
                <div className="flex items-center gap-2 text-xs text-white"><FaMapMarkerAlt className="text-red-500"/> حادث جديد</div>
                <div className="flex items-center gap-2 text-xs text-white"><FaMapMarkerAlt className="text-yellow-400"/> سيارة في الموقع</div>
                <div className="flex items-center gap-2 text-xs text-white"><FaAmbulance className="text-green-400"/> إسعاف متاح</div>
                <div className="flex items-center gap-2 text-xs text-white"><FaAmbulance className="text-orange-400"/> إسعاف في مهمة</div>
            </div>
        </div>
    );
};

export default MapComponent;
