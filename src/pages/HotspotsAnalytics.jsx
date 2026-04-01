import React, { useState, useMemo, useEffect } from 'react';
import { MapContainer, TileLayer, CircleMarker, Popup, useMap, Tooltip } from 'react-leaflet';
import { 
    FaChartArea, FaFilter, FaMapMarkerAlt, FaCalendarAlt, FaHospitalAlt, 
    FaExclamationCircle, FaFireAlt
} from 'react-icons/fa';
import { getReports, getCenters, getCurrentUser } from '../services/db';
import { calculateDistance } from '../utils/geo';
import 'leaflet/dist/leaflet.css';

// Component to dynamically fit map to clusters
const MapFitBounds = ({ clusters }) => {
    const map = useMap();
    useEffect(() => {
        if (clusters.length === 0) return;
        
        const lats = clusters.map(c => c.centerLat);
        const lngs = clusters.map(c => c.centerLng);
        
        const minLat = Math.min(...lats);
        const maxLat = Math.max(...lats);
        const minLng = Math.min(...lngs);
        const maxLng = Math.max(...lngs);
        
        // Add small padding to bounds
        const padding = 0.05;
        try {
            map.fitBounds([
                [minLat - padding, minLng - padding],
                [maxLat + padding, maxLng + padding]
            ]);
        } catch (e) {
            console.error("Error setting map bounds", e);
        }
    }, [clusters, map]);
    return null;
};

const HotspotsAnalytics = () => {
    const user = getCurrentUser();
    const isSupervisor = user?.role === 'SUPERVISOR';
    
    const [timeFrame, setTimeFrame] = useState('7d'); // 24h, 7d, 30d, all
    const [centerFilter, setCenterFilter] = useState(isSupervisor ? 'all' : user?.centerId || 'all');
    
    const reports = getReports();
    const centers = getCenters();

    // Grouping threshold (in kilometers)
    const CLUSTER_RADIUS_KM = 0.5;

    // Derived clustered data
    const clusters = useMemo(() => {
        const now = new Date();
        
        // 1. Filter reports by Time and Center
        const filteredReports = reports.filter(r => {
            // Apply False Report Filter
            if (r.isFalseReport) return false;

            // Apply Center Filter
            if (centerFilter !== 'all') {
                if (!r.involvedCenterIds?.includes(centerFilter) && r.assignedCenterId !== centerFilter) {
                    return false;
                }
            }

            // Apply Time Frame Filter
            if (timeFrame !== 'all') {
                const rDate = new Date(r.timestamp);
                const diffTime = Math.abs(now - rDate);
                const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
                const diffHours = Math.ceil(diffTime / (1000 * 60 * 60));
                
                if (timeFrame === '24h' && diffHours > 24) return false;
                if (timeFrame === '7d' && diffDays > 7) return false;
                if (timeFrame === '30d' && diffDays > 30) return false;
            }

            return true;
        });

        // 2. Group into Hotspots (Clusters)
        const resultingClusters = [];
        
        filteredReports.forEach(report => {
            let matchedCluster = null;
            
            for (let c of resultingClusters) {
                const dist = calculateDistance(report.location.lat, report.location.lng, c.centerLat, c.centerLng);
                if (dist <= CLUSTER_RADIUS_KM) {
                    matchedCluster = c;
                    break;
                }
            }

            if (matchedCluster) {
                matchedCluster.reports.push(report);
                // Simple average for new center
                matchedCluster.centerLat = (matchedCluster.centerLat * (matchedCluster.reports.length - 1) + report.location.lat) / matchedCluster.reports.length;
                matchedCluster.centerLng = (matchedCluster.centerLng * (matchedCluster.reports.length - 1) + report.location.lng) / matchedCluster.reports.length;
                matchedCluster.totalSeverity += (report.severity || 1);
            } else {
                resultingClusters.push({
                    id: `hotspot-${report.id}`,
                    centerLat: report.location.lat,
                    centerLng: report.location.lng,
                    reports: [report],
                    totalSeverity: report.severity || 1
                });
            }
        });

        // Sort clusters by number of reports (descending)
        return resultingClusters.sort((a, b) => b.reports.length - a.reports.length);

    }, [reports, timeFrame, centerFilter]);

    // UI Helpers
    const getMarkerColor = (count) => {
        if (count >= 5) return '#ef4444'; // Red for severe hotspots
        if (count >= 3) return '#f97316'; // Orange
        return '#eab308'; // Yellow
    };

    const getMarkerRadius = (count) => {
        return Math.min(15 + (count * 3), 40); // Base radius + dynamically grow, capped at 40
    };

    return (
        <div className="flex flex-col h-[calc(100vh-64px)] sm:h-[calc(100vh-80px)] md:h-[calc(100vh-96px)]" dir="rtl">
            {/* Header & Filters */}
            <div className="bg-gray-900 border-b border-gray-800 p-4 shrink-0 shadow-lg relative z-20">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                    <div className="flex items-center gap-3">
                        <div className="p-3 rounded-2xl bg-purple-600/20 border border-purple-500/30 text-purple-400">
                            <FaChartArea className="text-2xl" />
                        </div>
                        <div>
                            <h1 className="text-xl md:text-2xl font-black text-white tracking-tight text-right">تحليل بؤر الحوادث</h1>
                            <p className="text-xs md:text-sm text-gray-400 text-right mt-1">النقاط الساخنة بناءً على التوزيع الجغرافي والزمني</p>
                        </div>
                    </div>

                    <div className="flex flex-wrap items-center gap-3 bg-gray-800/50 p-2 rounded-2xl border border-gray-700/50">
                        {/* Time Filter */}
                        <div className="flex items-center gap-2 bg-gray-900 px-3 py-1.5 rounded-xl border border-gray-700">
                            <FaCalendarAlt className="text-gray-400 text-sm" />
                            <select 
                                value={timeFrame} 
                                onChange={(e) => setTimeFrame(e.target.value)}
                                className="bg-transparent text-sm text-white font-bold focus:outline-none cursor-pointer"
                            >
                                <option className="bg-gray-800 text-white" value="24h">آخر 24 ساعة</option>
                                <option className="bg-gray-800 text-white" value="7d">آخر 7 أيام</option>
                                <option className="bg-gray-800 text-white" value="30d">آخر 30 يوم</option>
                                <option className="bg-gray-800 text-white" value="all">كل الأوقات</option>
                            </select>
                        </div>

                        {/* Center Filter */}
                        <div className="flex items-center gap-2 bg-gray-900 px-3 py-1.5 rounded-xl border border-gray-700">
                            <FaHospitalAlt className="text-gray-400 text-sm" />
                            <select 
                                value={centerFilter} 
                                onChange={(e) => setCenterFilter(e.target.value)}
                                disabled={!isSupervisor}
                                className={`bg-transparent text-sm font-bold focus:outline-none ${!isSupervisor ? 'text-gray-500 cursor-not-allowed' : 'text-white cursor-pointer'}`}
                            >
                                {isSupervisor && <option className="bg-gray-800 text-white" value="all">المحافظة بأكملها</option>}
                                {centers.map(c => (
                                    <option className="bg-gray-800 text-white" key={c.id} value={c.id}>{c.name}</option>
                                ))}
                            </select>
                        </div>
                    </div>
                </div>
            </div>

            {/* Main Content Area */}
            <div className="flex flex-col lg:flex-row flex-1 overflow-hidden relative">
                
                {/* Map View */}
                <div className="flex-1 h-full z-0 relative bg-gray-800">
                    <MapContainer 
                        center={[30.1770, 31.2061]} // Qalyubia Default fallback
                        zoom={13} 
                        style={{ height: '100%', width: '100%' }}
                        className="bg-gray-100"
                    >
                        <TileLayer
                            url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png"
                            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OSM</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
                        />
                        
                        <MapFitBounds clusters={clusters} />

                        {clusters.map((cluster) => (
                            <CircleMarker
                                key={cluster.id}
                                center={[cluster.centerLat, cluster.centerLng]}
                                radius={getMarkerRadius(cluster.reports.length)}
                                pathOptions={{ 
                                    color: getMarkerColor(cluster.reports.length), 
                                    fillColor: getMarkerColor(cluster.reports.length), 
                                    fillOpacity: 0.6,
                                    weight: 2
                                }}
                            >
                                <Tooltip direction="top" offset={[0, -10]} opacity={1}>
                                    <div className="text-right font-bold dir-rtl">
                                        {cluster.reports.length} حادث
                                    </div>
                                </Tooltip>
                                <Popup className="hotspot-popup">
                                    <div className="p-2 text-right dir-rtl min-w-[200px]">
                                        <div className="flex items-center justify-between mb-3 border-b pb-2">
                                            <span className="font-bold text-gray-800">تفاصيل البؤرة</span>
                                            <FaFireAlt className="text-red-500 text-lg" />
                                        </div>
                                        <div className="space-y-2 text-sm text-gray-700">
                                            <div className="flex justify-between">
                                                <span>إجمالي الحوادث:</span>
                                                <span className="font-black text-red-600">{cluster.reports.length}</span>
                                            </div>
                                            <div className="flex justify-between">
                                                <span>بلاغات فرعية:</span>
                                                <span className="font-bold">{cluster.reports.reduce((sum, r) => sum + (r.subReports?.length || 0), 0)}</span>
                                            </div>
                                            <div className="flex justify-between">
                                                <span>مؤشر الخطورة:</span>
                                                <span className="font-bold text-orange-600">{cluster.totalSeverity}</span>
                                            </div>
                                        </div>
                                    </div>
                                </Popup>
                            </CircleMarker>
                        ))}
                    </MapContainer>

                    {/* Overlay Stats Float */}
                    <div className="absolute bottom-6 left-6 z-[400] bg-gray-900/90 backdrop-blur-md p-4 rounded-3xl border border-gray-700 shadow-2xl flex items-center gap-6">
                        <div className="flex flex-col items-center">
                            <span className="text-3xl font-black text-white">{clusters.length}</span>
                            <span className="text-xs text-gray-400 font-bold mt-1">بؤرة ساخنة</span>
                        </div>
                        <div className="w-px h-10 bg-gray-700"></div>
                        <div className="flex flex-col items-center">
                            <span className="text-3xl font-black text-red-500">
                                {clusters.reduce((acc, c) => acc + c.reports.length, 0)}
                            </span>
                            <span className="text-xs text-gray-400 font-bold mt-1">حوادث مسجلة</span>
                        </div>
                    </div>
                </div>

                {/* Sidebar List */}
                <div className="w-full lg:w-96 bg-gray-900 border-r border-gray-800 flex flex-col h-64 lg:h-full z-10 shrink-0 shadow-[-10px_0_30px_rgba(0,0,0,0.5)]">
                    <div className="p-4 border-b border-gray-800 bg-gray-800/50 flex items-center gap-2">
                        <FaExclamationCircle className="text-red-500" />
                        <h2 className="font-black text-white text-lg">قائمة البؤر الحرجة</h2>
                    </div>
                    
                    <div className="flex-1 overflow-y-auto p-3 space-y-3 custom-scrollbar">
                        {clusters.length === 0 ? (
                            <div className="flex flex-col items-center justify-center h-full text-gray-500 gap-3 opacity-60">
                                <FaMapMarkerAlt className="text-4xl" />
                                <p className="font-bold">لا توجد حوادث مسجلة في هذا النطاق</p>
                            </div>
                        ) : (
                            clusters.map((cluster, index) => (
                                <div key={cluster.id} className="bg-gray-800/40 p-4 rounded-2xl border border-gray-700 hover:border-gray-500 hover:bg-gray-800 transition-all group">
                                    <div className="flex justify-between items-start mb-3">
                                        <div className="flex items-center gap-2">
                                            <div className={`w-8 h-8 rounded-full flex items-center justify-center font-black `}
                                                 style={{ backgroundColor: `${getMarkerColor(cluster.reports.length)}20`, color: getMarkerColor(cluster.reports.length) }}>
                                                {index + 1}
                                            </div>
                                            <div className="flex flex-col">
                                                <span className="text-white font-bold text-sm">بؤرة #{cluster.id.slice(-4)}</span>
                                                <span className="text-[10px] text-gray-400">نصف القطر: {CLUSTER_RADIUS_KM * 1000} متر</span>
                                            </div>
                                        </div>
                                        <div className="bg-red-500 text-white px-2 py-1 rounded-lg text-xs font-black flex items-center gap-1 shadow-[0_0_10px_rgba(239,68,68,0.4)]">
                                            {cluster.reports.length} <FaFireAlt />
                                        </div>
                                    </div>
                                    
                                    <div className="grid grid-cols-2 gap-2 mt-2 pt-2 border-t border-gray-700/50">
                                        <div className="text-xs text-gray-400">
                                            أحدث بلاغ:
                                            <div className="font-bold text-gray-300 mt-0.5 truncate" dir="ltr">
                                                {new Date(Math.max(...cluster.reports.map(r => new Date(r.timestamp)))).toLocaleString('ar-EG', { hour: '2-digit', minute:'2-digit', day:'numeric', month:'numeric' })}
                                            </div>
                                        </div>
                                        <div className="text-xs text-gray-400">
                                            مؤشر الخطورة:
                                            <div className="font-black text-white mt-0.5">
                                                {cluster.totalSeverity}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default HotspotsAnalytics;
