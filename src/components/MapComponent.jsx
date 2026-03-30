import { useEffect, useRef } from 'react';
import { getCenters } from '../services/db';

const MapComponent = ({ centerLocation, incidents = [], ambulances = [] }) => {
    const mapRef = useRef(null);
    const mapInstance = useRef(null);
    const markersRef = useRef({ centers: {}, incidents: {}, ambulances: {} });

    useEffect(() => {
        // Initialize map if not already done and Leaflet is available via CDN
        if (!mapInstance.current && window.L && mapRef.current) {
            const initialLat = centerLocation?.lat || 30.41;
            const initialLng = centerLocation?.lng || 31.11;

            mapInstance.current = window.L.map(mapRef.current, {
                zoomControl: false,
                attributionControl: false
            }).setView([initialLat, initialLng], 13);

            // Standard Light TileLayer (OpenStreetMap)
            window.L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
                maxZoom: 19
            }).addTo(mapInstance.current);

            // Add back zoom control to bottom right
            window.L.control.zoom({ position: 'bottomright' }).addTo(mapInstance.current);
        }

        // Cleanup on unmount
        return () => {
            if (mapInstance.current) {
                mapInstance.current.remove();
                mapInstance.current = null;
            }
        };
    }, []);

    // Handle marker updates
    useEffect(() => {
        if (!mapInstance.current || !window.L) return;

        const L = window.L;

        // Helper to clear specific marker types
        const clearMarkers = (type) => {
            Object.values(markersRef.current[type]).forEach(m => m.remove());
            markersRef.current[type] = {};
        };

        // 1. Update Center Marker
        clearMarkers('centers');
        if (centerLocation) {
            const centerIcon = L.divIcon({
                className: 'custom-div-icon',
                html: `<div class="relative">
                        <div class="absolute -inset-4 bg-blue-500/20 rounded-full animate-ping"></div>
                        <div class="bg-blue-600 p-2.5 rounded-xl shadow-[0_0_20px_rgba(37,99,235,0.8)] border-2 border-blue-300 flex items-center justify-center">
                            <svg stroke="currentColor" fill="currentColor" stroke-width="0" viewBox="0 0 512 512" class="text-white text-xl" height="1em" width="1em" xmlns="http://www.w3.org/2000/svg"><path d="M416 192h-64v-64h-96v64h-64v96h64v64h96v-64h64v-96zm32-128H64c-35.3 0-64 28.7-64 64v224c0 35.3 28.7 64 64 64h384c35.3 0 64-28.7 64-64V128c0-35.3-28.7-64-64-64zm-32 288H96V128h320v224z"></path></svg>
                        </div>
                      </div>`,
                iconSize: [40, 40],
                iconAnchor: [20, 20]
            });
            
            markersRef.current.centers['main'] = L.marker([centerLocation.lat, centerLocation.lng], { icon: centerIcon })
                .addTo(mapInstance.current)
                .bindPopup(`<b class="text-blue-500">مركز المحافظة الرئيسي</b>`);
        }

        // 2. Update Incident Markers
        clearMarkers('incidents');
        incidents.forEach(inc => {
            const isPending = inc.missionStatus === 'pending';
            const colorClass = isPending ? 'text-red-500' : (inc.missionStatus === 'تم إنهاء المهمة' ? 'text-gray-500' : 'text-yellow-400');
            const shadowClass = isPending ? 'drop-shadow-[0_0_10px_rgba(239,68,68,0.8)]' : '';
            
            const incidentIcon = L.divIcon({
                className: 'custom-div-icon',
                html: `<div class="relative flex flex-col items-center">
                        ${isPending ? '<div class="absolute -inset-4 bg-red-500/30 rounded-full animate-ping"></div>' : ''}
                        <svg stroke="currentColor" fill="currentColor" stroke-width="0" viewBox="0 0 384 512" class="${colorClass} ${shadowClass} text-4xl" height="1em" width="1em" xmlns="http://www.w3.org/2000/svg"><path d="M172.268 501.67C26.97 291.031 0 269.413 0 192 0 85.961 85.961 0 192 0s192 85.961 192 192c0 77.413-26.97 99.031-172.268 309.67-9.535 13.774-29.93 13.773-39.464 0zM192 272c44.183 0 80-35.817 80-80s-35.817-80-80-80-80 35.817-80 80 35.817 80 80 80z"></path></svg>
                      </div>`,
                iconSize: [40, 48],
                iconAnchor: [20, 48]
            });

            markersRef.current.incidents[inc.id] = L.marker([inc.location.lat, inc.location.lng], { icon: incidentIcon })
                .addTo(mapInstance.current)
                .bindPopup(`<div class="text-right flex flex-col gap-1">
                                <b class="${isPending ? 'text-red-500' : 'text-blue-500'}">بلاغ #${inc.id}</b>
                                <span class="text-xs text-gray-400">${inc.missionStatus}</span>
                                <hr class="my-1 border-gray-700"/>
                                <button class="text-[10px] text-blue-400 hover:underline">عرض التفاصيل</button>
                            </div>`);
        });

        // 3. Update Ambulance Markers
        clearMarkers('ambulances');
        const allCenters = getCenters();
        
        ambulances.forEach(ambulance => {
            let mockLat, mockLng;
            const center = allCenters.find(c => c.id === ambulance.centerId);
            
            if (ambulance.status === 'متاحة') {
                if (center) {
                    mockLat = center.location.lat;
                    mockLng = center.location.lng;
                } else {
                    mockLat = centerLocation?.lat || 30.41;
                    mockLng = centerLocation?.lng || 31.11;
                }
            } else {
                const assignedIncident = incidents.find(inc => 
                    inc.ambulanceIds && inc.ambulanceIds.includes(ambulance.id) && inc.missionStatus !== 'تم إنهاء المهمة'
                );
                
                if (assignedIncident && assignedIncident.location) {
                    const idCode = ambulance.id.charCodeAt(ambulance.id.length - 1);
                    const offsetLat = (idCode % 5) * 0.0003; 
                    const offsetLng = (idCode % 7) * 0.0003;
                    mockLat = assignedIncident.location.lat + offsetLat;
                    mockLng = assignedIncident.location.lng + offsetLng;
                } else if (center) {
                    mockLat = center.location.lat;
                    mockLng = center.location.lng;
                } else {
                    mockLat = (centerLocation?.lat || 24.7) + 0.01;
                    mockLng = (centerLocation?.lng || 46.6) + 0.01;
                }
            }

            const ambIcon = L.divIcon({
                className: 'custom-div-icon',
                html: `<div class="relative group">
                        <div class="bg-gray-900 p-2 rounded-lg border-2 border-blue-500 shadow-xl flex items-center justify-center transition-transform hover:scale-110">
                            <svg stroke="currentColor" fill="currentColor" stroke-width="0" viewBox="0 0 640 512" class="text-blue-400 text-lg" height="1em" width="1em" xmlns="http://www.w3.org/2000/svg"><path d="M312 320h48V192h-48v128zM192 128h-32c-17.67 0-32 14.33-32 32v160c0 17.67 14.33 32 32 32h32v48c0 26.51 21.49 48 48 48h288c26.51 0 48-21.49 48-48v-48h32c17.67 0 32-14.33 32-32V160c0-17.67-14.33-32-32-32h-32v-48c0-26.51-21.49-48-48-48H240c-26.51 0-48 21.49-48 48v48zm256 0H240V80h208v48zM240 352h208v48H240v-48zm352-160v128h-32V192h32zM80 192H48v128h32V192z"></path></svg>
                        </div>
                        <div class="absolute -top-8 left-1/2 -translate-x-1/2 bg-blue-600 text-white text-[8px] px-1.5 py-0.5 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                            ${ambulance.name}
                        </div>
                      </div>`,
                iconSize: [36, 36],
                iconAnchor: [18, 18]
            });

            markersRef.current.ambulances[ambulance.id] = L.marker([mockLat, mockLng], { icon: ambIcon })
                .addTo(mapInstance.current)
                .bindPopup(`<div class="text-right">
                                <b class="text-blue-500">${ambulance.name}</b><br/>
                                <span class="text-xs">${ambulance.status}</span>
                            </div>`);
        });

    }, [centerLocation, incidents, ambulances]);

    return (
        <div className="relative h-full min-h-[400px] w-full rounded-3xl overflow-hidden border border-gray-800 shadow-2xl group">
             {/* Map Container Ref */}
            <div ref={mapRef} className="h-full w-full z-0"></div>
            
            {/* Tech Overlay - Subtle light theme adjustment */}
            <div className="absolute inset-0 pointer-events-none border-[12px] border-white/5 z-10 rounded-3xl"></div>
            <div className="absolute inset-0 pointer-events-none bg-gradient-to-t from-gray-200/10 to-transparent z-10"></div>

            {/* Legend/Control - Refined for Light Map */}
            <div className="absolute top-6 right-6 z-20 flex flex-col gap-3">
                <div className="bg-white/90 backdrop-blur-xl border border-gray-200 p-4 rounded-2xl shadow-2xl space-y-3">
                    <div className="flex items-center gap-3">
                        <div className="w-3 h-3 rounded-full bg-blue-600 shadow-[0_0_10px_rgba(37,99,235,0.4)]"></div>
                        <span className="text-[10px] font-black text-gray-700 uppercase tracking-widest">تغطية المراكز</span>
                    </div>
                    <div className="flex items-center gap-3">
                        <div className="w-3 h-3 rounded-full bg-red-600 animate-pulse shadow-[0_0_10px_rgba(220,38,38,0.4)]"></div>
                        <span className="text-[10px] font-black text-gray-700 uppercase tracking-widest">بلاغات طارئة</span>
                    </div>
                    <div className="flex items-center gap-3">
                        <div className="w-3 h-3 rounded-full bg-yellow-500 shadow-[0_0_10px_rgba(234,179,8,0.4)]"></div>
                        <span className="text-[10px] font-black text-gray-700 uppercase tracking-widest">مهام جارية</span>
                    </div>
                </div>
            </div>

            <style>{`
                .leaflet-container {
                    background: #f8fafc !important;
                }
                .leaflet-popup-content-wrapper {
                    background: white !important;
                    color: #1e293b !important;
                    border: 1px solid #e2e8f0 !important;
                    border-radius: 1rem !important;
                    box-shadow: 0 10px 15px -3px rgb(0 0 0 / 0.1) !important;
                }
                .leaflet-popup-tip {
                    background: white !important;
                    border: 1px solid #e2e8f0 !important;
                }
                .custom-div-icon {
                    background: transparent !important;
                    border: none !important;
                }
            `}</style>
        </div>
    );
};

export default MapComponent;
