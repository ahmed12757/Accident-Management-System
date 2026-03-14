import { getCenters, addReport, updateAmbulanceStatus, updateReportStatus, getReports, getAmbulances } from './db';
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
        missionStatus: 'pending' // pending, traveling, arrived, completed
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
    
    // Only set to "traveling" if it was pending/new, otherwise keep current advanced status
    const newStatus = (currentReport.missionStatus === 'pending' || currentReport.status === 'جديد') 
        ? 'في الطريق إلى موقع الحادث' 
        : currentReport.missionStatus;

    updateReportStatus(reportId, {
        ambulanceIds: newAmbulanceIds,
        missionStatus: newStatus,
        dispatchTime: currentReport.dispatchTime || new Date().toISOString()
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

export const updateMissionTracker = (reportId, statusText) => {
    const updateData = { missionStatus: statusText };
    const reports = getReports();
    const currentReport = reports.find(r => r.id === reportId);
    
    if (statusText === 'تم إنهاء المهمة') {
        updateData.completedAt = new Date().toISOString();
        // Free up all assigned ambulances
        if (currentReport && currentReport.ambulanceIds) {
            currentReport.ambulanceIds.forEach(id => {
                updateAmbulanceStatus(id, 'متاحة');
            });
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

