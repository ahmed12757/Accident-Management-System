import { useEffect, useRef, useState } from 'react';
import { getCenters, getAmbulanceLiveLocations } from '../services/db';

/**
 * MapComponent
 *
 * Props:
 *  centerLocation   – { lat, lng } – center marker (optional)
 *  incidents        – array of report objects
 *  ambulances       – array of ambulance objects
 *  routeMode        – boolean: if true, draw route from centerLocation → incidents[0]
 *  liveAmbulanceIds – array of ambulance IDs to track with live markers
 */
const MapComponent = ({
    centerLocation,
    incidents = [],
    ambulances = [],
    routeMode = false,
    liveAmbulanceIds = []
}) => {
    const mapRef = useRef(null);
    const mapInstance = useRef(null);
    const markersRef = useRef({ centers: {}, incidents: {}, ambulances: {}, live: {} });
    const routeLayerRef = useRef(null);
    const [routeInfo, setRouteInfo] = useState(null); // { distance, duration, steps }

    // ── Initialize map once ──────────────────────────────────────────────────
    useEffect(() => {
        if (!mapInstance.current && window.L && mapRef.current) {
            const initialLat = centerLocation?.lat || 30.41;
            const initialLng = centerLocation?.lng || 31.11;

            mapInstance.current = window.L.map(mapRef.current, {
                zoomControl: false,
                attributionControl: false
            }).setView([initialLat, initialLng], 13);

            window.L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
                maxZoom: 19
            }).addTo(mapInstance.current);

            window.L.control.zoom({ position: 'bottomright' }).addTo(mapInstance.current);
        }

        return () => {
            if (mapInstance.current) {
                mapInstance.current.remove();
                mapInstance.current = null;
            }
        };
    }, []);

    // ── Draw / update route polyline + OSRM directions ───────────────────────
    useEffect(() => {
        if (!mapInstance.current || !window.L) return;
        if (!routeMode || !centerLocation || incidents.length === 0) return;

        const dest = incidents[0]?.location;
        if (!dest) return;

        const drawStraightLine = () => {
            if (routeLayerRef.current) {
                routeLayerRef.current.remove();
                routeLayerRef.current = null;
            }
            routeLayerRef.current = window.L.polyline(
                [[centerLocation.lat, centerLocation.lng], [dest.lat, dest.lng]],
                { color: '#3b82f6', weight: 5, opacity: 0.8, dashArray: '10,6' }
            ).addTo(mapInstance.current);
        };

        // Try OSRM public API for real route
        const url = `https://router.project-osrm.org/route/v1/driving/${centerLocation.lng},${centerLocation.lat};${dest.lng},${dest.lat}?overview=full&geometries=geojson&steps=true`;

        fetch(url)
            .then(r => r.json())
            .then(data => {
                if (!mapInstance.current) return;
                if (data.code !== 'Ok' || !data.routes?.[0]) {
                    drawStraightLine();
                    return;
                }
                const route = data.routes[0];
                const coords = route.geometry.coordinates.map(([lng, lat]) => [lat, lng]);

                if (routeLayerRef.current) {
                    routeLayerRef.current.remove();
                    routeLayerRef.current = null;
                }

                // Draw background shadow
                window.L.polyline(coords, {
                    color: '#1e3a5f',
                    weight: 9,
                    opacity: 0.5
                }).addTo(mapInstance.current);

                // Draw main route line
                routeLayerRef.current = window.L.polyline(coords, {
                    color: '#3b82f6',
                    weight: 5,
                    opacity: 0.95
                }).addTo(mapInstance.current);

                // Fit map to route
                mapInstance.current.fitBounds(routeLayerRef.current.getBounds(), { padding: [40, 40] });

                // Extract step-by-step directions
                const legs = route.legs?.[0];
                const distKm = (route.distance / 1000).toFixed(1);
                const durMin = Math.ceil(route.duration / 60);
                const steps = (legs?.steps || []).slice(0, 8).map(s => ({
                    instruction: s.maneuver?.type || 'تابع',
                    name: s.name || '',
                    distance: (s.distance / 1000).toFixed(2)
                }));

                setRouteInfo({ distance: distKm, duration: durMin, steps });
            })
            .catch(() => drawStraightLine());

        return () => {
            if (routeLayerRef.current) {
                routeLayerRef.current.remove();
                routeLayerRef.current = null;
            }
        };
    }, [routeMode, centerLocation, incidents]);

    // ── Update static markers (centers, incidents, ambulances) ───────────────
    useEffect(() => {
        if (!mapInstance.current || !window.L) return;

        const L = window.L;

        const clearMarkers = (type) => {
            Object.values(markersRef.current[type]).forEach(m => m.remove());
            markersRef.current[type] = {};
        };

        // 1. Center Marker
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
                .bindPopup(`<b class="text-blue-500">المركز</b>`);
        }

        // 2. Incident Markers
        clearMarkers('incidents');
        incidents.forEach(inc => {
            if (!inc.location) return;
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
                            </div>`);
        });

        // 3. Static Ambulance Markers (for non-live mode)
        clearMarkers('ambulances');
        const allCenters = getCenters();

        ambulances.forEach(ambulance => {
            // Skip if this ambulance has a live-tracked position (handled separately)
            if (liveAmbulanceIds.includes(ambulance.id)) return;

            let mockLat, mockLng;
            const center = allCenters.find(c => c.id === ambulance.centerId);

            if (ambulance.status === 'متاحة') {
                mockLat = center?.location?.lat || centerLocation?.lat || 30.41;
                mockLng = center?.location?.lng || centerLocation?.lng || 31.11;
            } else {
                const assignedIncident = incidents.find(inc =>
                    inc.ambulanceIds?.includes(ambulance.id) && inc.missionStatus !== 'تم إنهاء المهمة'
                );
                if (assignedIncident?.location) {
                    const idCode = ambulance.id.charCodeAt(ambulance.id.length - 1);
                    mockLat = assignedIncident.location.lat + (idCode % 5) * 0.0003;
                    mockLng = assignedIncident.location.lng + (idCode % 7) * 0.0003;
                } else {
                    mockLat = center?.location?.lat || 30.41;
                    mockLng = center?.location?.lng || 31.11;
                }
            }

            const ambIcon = L.divIcon({
                className: 'custom-div-icon',
                html: `<div class="relative group">
                        <div class="bg-gray-900 p-2 rounded-lg border-2 border-blue-500 shadow-xl flex items-center justify-center">
                            <svg stroke="currentColor" fill="currentColor" stroke-width="0" viewBox="0 0 640 512" class="text-blue-400 text-lg" height="1em" width="1em" xmlns="http://www.w3.org/2000/svg"><path d="M624 352h-16V243.9c0-12.7-5.1-24.9-14.1-33.9L494 110.1c-9-9-21.2-14.1-33.9-14.1H416V48c0-26.5-21.5-48-48-48H112C85.5 0 64 21.5 64 48v48H8c-4.4 0-8 3.6-8 8v16c0 4.4 3.6 8 8 8h400c4.4 0 8-3.6 8-8v-16c0-4.4-3.6-8-8-8H128V48c0-8.8 7.2-16 16-16h288c8.8 0 16 7.2 16 16v48h-96c-17.6 0-32 14.4-32 32v192H224c-53 0-96 43-96 96s43 96 96 96 96-43 96-96h128c0 53 43 96 96 96s96-43 96-96h64c8.8 0 16-7.2 16-16v-32c0-8.8-7.2-16-16-16zM224 480c-26.5 0-48-21.5-48-48s21.5-48 48-48 48 21.5 48 48-21.5 48-48 48zm320 0c-26.5 0-48-21.5-48-48s21.5-48 48-48 48 21.5 48 48-21.5 48-48 48zm48-208H416V144h44.1l131.9 128H592z"></path></svg>
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
                .bindPopup(`<div class="text-right"><b class="text-blue-500">${ambulance.name}</b><br/><span class="text-xs">${ambulance.status}</span></div>`);
        });

    }, [centerLocation, incidents, ambulances, liveAmbulanceIds]);

    // ── Live tracking markers (poll localStorage every 2s) ───────────────────
    useEffect(() => {
        if (!mapInstance.current || !window.L || liveAmbulanceIds.length === 0) return;

        const L = window.L;

        const makeLiveIcon = (name, isMoving = true) => L.divIcon({
            className: 'custom-div-icon',
            html: `<div class="relative flex flex-col items-center">
                     ${isMoving ? '<div class="absolute -inset-5 bg-orange-500/25 rounded-full animate-ping"></div>' : ''}
                     <div class="bg-gray-900 p-2 rounded-xl border-2 ${isMoving ? 'border-orange-400 shadow-[0_0_18px_rgba(249,115,22,0.7)]' : 'border-green-400'} flex items-center justify-center z-10">
                       <svg stroke="currentColor" fill="currentColor" stroke-width="0" viewBox="0 0 640 512" class="${isMoving ? 'text-orange-400' : 'text-green-400'} text-xl" height="1em" width="1em" xmlns="http://www.w3.org/2000/svg"><path d="M624 352h-16V243.9c0-12.7-5.1-24.9-14.1-33.9L494 110.1c-9-9-21.2-14.1-33.9-14.1H416V48c0-26.5-21.5-48-48-48H112C85.5 0 64 21.5 64 48v48H8c-4.4 0-8 3.6-8 8v16c0 4.4 3.6 8 8 8h400c4.4 0 8-3.6 8-8v-16c0-4.4-3.6-8-8-8H128V48c0-8.8 7.2-16 16-16h288c8.8 0 16 7.2 16 16v48h-96c-17.6 0-32 14.4-32 32v192H224c-53 0-96 43-96 96s43 96 96 96 96-43 96-96h128c0 53 43 96 96 96s96-43 96-96h64c8.8 0 16-7.2 16-16v-32c0-8.8-7.2-16-16-16zM224 480c-26.5 0-48-21.5-48-48s21.5-48 48-48 48 21.5 48 48-21.5 48-48 48zm320 0c-26.5 0-48-21.5-48-48s21.5-48 48-48 48 21.5 48 48-21.5 48-48 48zm48-208H416V144h44.1l131.9 128H592z"></path></svg>
                     </div>
                     <div class="bg-gray-900/90 border border-orange-500/50 text-orange-300 text-[9px] font-bold px-2 py-0.5 rounded-full mt-1 whitespace-nowrap shadow-lg">
                       🚑 ${name}
                     </div>
                   </div>`,
            iconSize: [44, 58],
            iconAnchor: [22, 29]
        });

        const updateLiveMarkers = () => {
            if (!mapInstance.current) return;
            const liveLocations = getAmbulanceLiveLocations();

            liveAmbulanceIds.forEach(ambId => {
                const pos = liveLocations[ambId];
                const amb = ambulances.find(a => a.id === ambId);
                const name = amb?.name || ambId;

                if (!pos) {
                    // Remove stale live marker
                    if (markersRef.current.live[ambId]) {
                        markersRef.current.live[ambId].remove();
                        delete markersRef.current.live[ambId];
                    }
                    return;
                }

                const isMoving = (Date.now() - pos.updatedAt) < 5000;

                if (markersRef.current.live[ambId]) {
                    // Smooth move existing marker
                    markersRef.current.live[ambId].setLatLng([pos.lat, pos.lng]);
                    markersRef.current.live[ambId].setIcon(makeLiveIcon(name, isMoving));
                } else {
                    // Create new live marker
                    markersRef.current.live[ambId] = L.marker([pos.lat, pos.lng], {
                        icon: makeLiveIcon(name, isMoving),
                        zIndexOffset: 1000
                    })
                        .addTo(mapInstance.current)
                        .bindPopup(`<div class="text-right font-bold text-orange-500">🚑 ${name}<br/><span class="text-xs text-gray-400">تتبع مباشر</span></div>`);
                }
            });

            // Clean up markers for IDs no longer tracked
            Object.keys(markersRef.current.live).forEach(id => {
                if (!liveAmbulanceIds.includes(id)) {
                    markersRef.current.live[id].remove();
                    delete markersRef.current.live[id];
                }
            });
        };

        updateLiveMarkers();
        const interval = setInterval(updateLiveMarkers, 1500);

        return () => {
            clearInterval(interval);
            Object.values(markersRef.current.live).forEach(m => m.remove());
            markersRef.current.live = {};
        };
    }, [liveAmbulanceIds, ambulances]);

    // ─────────────────────────────────────────────────────────────────────────
    return (
        <div className="relative h-full min-h-[400px] w-full rounded-3xl overflow-hidden border border-gray-800 shadow-2xl group">
            <div ref={mapRef} className="h-full w-full z-0"></div>

            {/* Decorative overlay */}
            <div className="absolute inset-0 pointer-events-none border-[12px] border-white/5 z-10 rounded-3xl"></div>
            <div className="absolute inset-0 pointer-events-none bg-gradient-to-t from-gray-200/10 to-transparent z-10"></div>

            {/* Route Info Panel – only in routeMode */}
            {routeMode && routeInfo && (
                <div className="absolute bottom-4 right-4 z-20 bg-gray-900/95 backdrop-blur-xl border border-blue-500/40 rounded-2xl p-4 shadow-2xl max-w-[220px] w-full" dir="rtl">
                    <div className="flex items-center gap-2 mb-3">
                        <div className="w-2.5 h-2.5 rounded-full bg-blue-500 animate-pulse"></div>
                        <span className="text-blue-400 font-black text-sm tracking-wide">مسار المهمة</span>
                    </div>
                    <div className="grid grid-cols-2 gap-2 mb-3">
                        <div className="bg-gray-800 rounded-xl p-2 text-center">
                            <div className="text-white font-black text-lg">{routeInfo.distance}</div>
                            <div className="text-gray-500 text-[10px]">كم</div>
                        </div>
                        <div className="bg-gray-800 rounded-xl p-2 text-center">
                            <div className="text-orange-400 font-black text-lg">{routeInfo.duration}</div>
                            <div className="text-gray-500 text-[10px]">دقيقة</div>
                        </div>
                    </div>
                    <div className="space-y-1.5 max-h-[120px] overflow-y-auto">
                        {routeInfo.steps.map((step, i) => (
                            <div key={i} className="flex items-start gap-2 text-[10px] text-gray-300 bg-gray-800/60 rounded-lg px-2 py-1.5">
                                <span className="text-blue-400 font-black shrink-0">{i + 1}.</span>
                                <span className="leading-tight">{TURN_LABELS[step.instruction] || step.instruction} {step.name && `(${step.name})`} — {step.distance} كم</span>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Legend */}
            <div className={`absolute top-6 ${routeMode ? 'left-6' : 'right-6'} z-20 flex flex-col gap-3`}>
                <div className="bg-white/90 backdrop-blur-xl border border-gray-200 p-4 rounded-2xl shadow-2xl space-y-3">
                    <div className="flex items-center gap-3">
                        <div className="w-3 h-3 rounded-full bg-blue-600 shadow-[0_0_10px_rgba(37,99,235,0.4)]"></div>
                        <span className="text-[10px] font-black text-gray-700 uppercase tracking-widest">المركز</span>
                    </div>
                    <div className="flex items-center gap-3">
                        <div className="w-3 h-3 rounded-full bg-red-600 animate-pulse shadow-[0_0_10px_rgba(220,38,38,0.4)]"></div>
                        <span className="text-[10px] font-black text-gray-700 uppercase tracking-widest">موقع الحادث</span>
                    </div>
                    {liveAmbulanceIds.length > 0 && (
                        <div className="flex items-center gap-3">
                            <div className="w-3 h-3 rounded-full bg-orange-500 animate-ping shadow-[0_0_10px_rgba(249,115,22,0.4)]"></div>
                            <span className="text-[10px] font-black text-gray-700 uppercase tracking-widest">إسعاف مباشر</span>
                        </div>
                    )}
                </div>
            </div>

            <style>{`
                .leaflet-container { background: #f8fafc !important; }
                .leaflet-popup-content-wrapper {
                    background: white !important; color: #1e293b !important;
                    border: 1px solid #e2e8f0 !important; border-radius: 1rem !important;
                    box-shadow: 0 10px 15px -3px rgb(0 0 0 / 0.1) !important;
                }
                .leaflet-popup-tip { background: white !important; border: 1px solid #e2e8f0 !important; }
                .custom-div-icon { background: transparent !important; border: none !important; }
            `}</style>
        </div>
    );
};

// Arabic turn-by-turn label mapping
const TURN_LABELS = {
    'turn': 'انعطف',
    'new name': 'استمر في',
    'depart': 'انطلق',
    'arrive': 'وصلت للهدف',
    'merge': 'ادمج المسار',
    'on ramp': 'ادخل الرامب',
    'off ramp': 'اخرج من الرامب',
    'fork': 'تفرع',
    'end of road': 'نهاية الطريق',
    'continue': 'تابع',
    'roundabout': 'دوار',
    'rotary': 'دوار',
    'roundabout turn': 'انعطف في الدوار',
    'notification': 'ملاحظة',
    'exit roundabout': 'اخرج من الدوار',
    'exit rotary': 'اخرج من الدوار',
};

export default MapComponent;
