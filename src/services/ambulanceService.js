import { getCenters, addReport, updateAmbulanceStatus, updateReportStatus, getReports, getAmbulances, updateAmbulanceLiveLocation, clearAmbulanceLiveLocation } from './db';
import { findNearestCenter } from '../utils/geo';


export const handleNewIncident = (incidentData) => {
    const centers = getCenters();
    const { nearestCenter, distance } = findNearestCenter(
        incidentData.location.lat, 
        incidentData.location.lng, 
        centers
    );

    const report = addReport({
        ...incidentData,
        assignedCenterId: nearestCenter.id,
        distanceToCenter: distance,
        ambulanceIds: [],
        ambulanceAssignments: {}, // { "ambId": { status: "...", lastUpdated: "..." } }
        missionStatus: 'pending' // summary status
    });

    return { report, nearestCenter };
};

export const dispatchMultipleAmbulances = (reportId, selectedAmbulanceIds) => {
    const reports = getReports();
    const currentReport = reports.find(r => r.id === reportId);
    if (!currentReport) return;
    
    // Mark vehicles busy
    selectedAmbulanceIds.forEach(id => {
        updateAmbulanceStatus(id, 'في مهمة');
    });

    const newAmbulanceIds = [...(currentReport.ambulanceIds || []), ...selectedAmbulanceIds];
    const ambulanceAssignments = currentReport.ambulanceAssignments || {};
    
    // Only set to "traveling" if it was pending/new, otherwise keep current advanced status
    const newStatus = (currentReport.missionStatus === 'pending' || currentReport.status === 'جديد') 
        ? 'في الطريق إلى موقع الحادث' 
        : currentReport.missionStatus;

    selectedAmbulanceIds.forEach(id => {
        ambulanceAssignments[id] = { 
            status: 'في الطريق إلى موقع الحادث', 
            updated: new Date().toISOString() 
        };
    });
    
    updateReportStatus(reportId, {
        ambulanceIds: newAmbulanceIds,
        ambulanceAssignments,
        missionStatus: newStatus,
        dispatchTime: currentReport.dispatchTime || new Date().toISOString()
    });

    // ── Start live location simulation for each dispatched ambulance ──────────
    const allCenters = getCenters();
    const allAmbs = getAmbulances();
    selectedAmbulanceIds.forEach(ambId => {
        const amb = allAmbs.find(a => a.id === ambId);
        const center = allCenters.find(c => c.id === (amb?.centerId || currentReport.assignedCenterId));
        if (center && currentReport.location) {
            simulateAmbulanceMovement(ambId, center.location, currentReport.location);
        }
    });
};

export const smartRequestBackup = (reportId) => {
    const reports = getReports();
    const currentReport = reports.find(r => r.id === reportId);
    if (!currentReport) return null;

    const allAmbulances = getAmbulances();
    const localAvailable = allAmbulances.filter(a => a.centerId === currentReport.assignedCenterId && a.status === 'متاحة');
    
    
    const requestEntry = {
        type: 'طلب دعم',
        timestamp: new Date().toISOString(),
        details: 'تم طلب مركبة إضافية للموقع'
    };

    const backupRequests = currentReport.backupRequests || [];
    const updates = { 
        backupRequests: [...backupRequests, requestEntry]
    };

    if (localAvailable.length > 0) {
        // Increment requirement locally
        updateReportStatus(reportId, updates);
        return { type: 'local', centerId: currentReport.assignedCenterId };
    } else {
        // No local cars, transfer to nearest center automatically
        const neighbor = transferReportToNearestCenter(reportId, currentReport.assignedCenterId);
        // Also update the backup requests list on the report (even if transferred)
        updateReportStatus(reportId, { backupRequests: [...backupRequests, { ...requestEntry, details: `تحويل الطلب للمركز المجاور: ${neighbor?.name}` }] });
        return { type: 'external', neighbor };
    }
};

export const updateMissionTracker = (reportId, statusText, ambulanceId = null) => {
    const reports = getReports();
    const currentReport = reports.find(r => r.id === reportId);
    if (!currentReport) return;

    const updateData = {};
    const assignments = currentReport.ambulanceAssignments || {};

    if (ambulanceId) {
        assignments[ambulanceId] = { 
            status: statusText, 
            updated: new Date().toISOString() 
        };
        updateData.ambulanceAssignments = assignments;
        // Optionally update global missionStatus as the "latest" status
        updateData.missionStatus = statusText;
    } else {
        updateData.missionStatus = statusText;
    }
    
    if (statusText === 'تم إنهاء المهمة') {
        if (ambulanceId) {
            // Free up ONLY this specific ambulance
            updateAmbulanceStatus(ambulanceId, 'متاحة');
            stopAmbulanceSimulation(ambulanceId);
            
            // Check if ALL ambulances for this report are done
            const allAssignments = Object.values(assignments);
            const allDone = allAssignments.every(a => a.status === 'تم إنهاء المهمة');
            if (allDone) {
                updateData.completedAt = new Date().toISOString();
                updateData.missionStatus = 'تم إنهاء المهمة';
            } else {
                // Report is still active because other cars aren't done
                // But this one is finished.
                updateData.missionStatus = 'جاري إنهاء المهمة جزئياً';
            }
        } else {
            // Legacy/Global close: Free all
            updateData.completedAt = new Date().toISOString();
            if (currentReport.ambulanceIds) {
                currentReport.ambulanceIds.forEach(id => {
                    updateAmbulanceStatus(id, 'متاحة');
                    stopAmbulanceSimulation(id);
                });
            }
        }
    }
    
    updateReportStatus(reportId, updateData);
};

export const transferReportToNearestCenter = (reportId, currentCenterId) => {
    const report = getReports().find(r => r.id === reportId);
    if (!report) return null;

    const allCenters = getCenters();
    // Exclude current center
    const remainingCenters = allCenters.filter(c => c.id !== currentCenterId);
    
    if (remainingCenters.length === 0) return null; // No other centers available

    // Try finding the nearest center that has at least the needed number of ambulances
    // Normally we should check DB for availability counts, but simply transferring is ok 
    // for this mock level.
    const { nearestCenter, distance } = findNearestCenter(
        report.location.lat,
        report.location.lng,
        remainingCenters
    );

    const newStatus = (report.missionStatus === 'pending') ? 'pending' : report.missionStatus;

    updateReportStatus(reportId, {
        assignedCenterId: nearestCenter.id,
        distanceToCenter: distance,
        status: 'جديد',
        missionStatus: newStatus
    });

    return nearestCenter;
};

// ─── Live Location Simulation ─────────────────────────────────────────────────
// Tracks active simulation intervals per ambulance so we don't double-start.
const _activeSimulations = {};

/**
 * Begins interpolating the ambulance's live location from `startLocation`
 * to `endLocation` over `durationMs` milliseconds, writing to localStorage
 * every `stepMs` so both dashboards can read the live position.
 */
export const simulateAmbulanceMovement = (ambulanceId, startLocation, endLocation, durationMs = 90000, stepMs = 2000) => {
    // Clear any existing simulation for this ambulance
    stopAmbulanceSimulation(ambulanceId);

    const totalSteps = Math.floor(durationMs / stepMs);
    let currentStep = 0;

    // Immediately set starting position
    updateAmbulanceLiveLocation(ambulanceId, startLocation.lat, startLocation.lng);

    _activeSimulations[ambulanceId] = setInterval(() => {
        currentStep++;
        if (currentStep >= totalSteps) {
            // Arrived — snap to destination and stop
            updateAmbulanceLiveLocation(ambulanceId, endLocation.lat, endLocation.lng);
            stopAmbulanceSimulation(ambulanceId);
            return;
        }

        const t = currentStep / totalSteps;
        // Add slight sinusoidal deviation to simulate road curves
        const deviation = Math.sin(t * Math.PI) * 0.0008;
        const lat = startLocation.lat + (endLocation.lat - startLocation.lat) * t + deviation;
        const lng = startLocation.lng + (endLocation.lng - startLocation.lng) * t;
        updateAmbulanceLiveLocation(ambulanceId, lat, lng);
    }, stepMs);

    return _activeSimulations[ambulanceId];
};

export const stopAmbulanceSimulation = (ambulanceId) => {
    if (_activeSimulations[ambulanceId]) {
        clearInterval(_activeSimulations[ambulanceId]);
        delete _activeSimulations[ambulanceId];
    }
    clearAmbulanceLiveLocation(ambulanceId);
};


