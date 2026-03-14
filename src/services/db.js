export const INITIAL_CENTERS = [
  { id: 'c1', name: 'مركز إسعاف قليوب الرئيسي', location: { lat: 24.7136, lng: 46.6753 } },
  { id: 'c2', name: 'مركز إسعاف شبرا الخيمة', location: { lat: 24.7730, lng: 46.7553 } }
];

export const INITIAL_USERS = [
  { id: 'u1', name: 'مدير عام المنظومة', role: 'SUPERVISOR' },
  { id: 'u2', name: 'مدير مركز قليوب', role: 'CENTER_ADMIN', centerId: 'c1' },
  { id: 'u3', name: 'مدير مركز شبرا', role: 'CENTER_ADMIN', centerId: 'c2' }
];

export const INITIAL_AMBULANCES = [
  { id: 'a1', centerId: 'c1', name: 'سيارة عناية مركزة 101', status: 'متاحة' },
  { id: 'a2', centerId: 'c1', name: 'إسعاف طوارئ 102', status: 'متاحة' },
  { id: 'a3', centerId: 'c2', name: 'إسعاف طوارئ 201', status: 'متاحة' },
  { id: 'a4', centerId: 'c2', name: 'إسعاف طوارئ 202', status: 'متاحة' }
];

const TWO_HOURS_AGO = new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString();
const ONE_HOUR_HALF_AGO = new Date(Date.now() - 1.5 * 60 * 60 * 1000).toISOString();
const ONE_HOUR_AGO = new Date(Date.now() - 60 * 60 * 1000).toISOString();

export const INITIAL_REPORTS = [
  {
    id: 'REP-9954',
    timestamp: TWO_HOURS_AGO,
    location: { lat: 24.7250, lng: 46.6800 },
    description: 'حادث تصادم بين سيارتين، يوجد مصاب واحد فاقد للوعي ويحتاج لتدخل سريع.',
    image: 'https://images.unsplash.com/photo-1543353846-5be81ce4e211?q=80&w=400&auto=format&fit=crop',
    missionStatus: 'تم إنهاء المهمة',
    assignedCenterId: 'c1',
    involvedCenterIds: ['c1'],
    ambulanceIds: ['a1'],
    distanceToCenter: 2.4,
    dispatchTime: ONE_HOUR_HALF_AGO,
    completedAt: ONE_HOUR_AGO,
    sender: {
      fullName: 'أحمد محمود العتيبي',
      nationalId: '1098765432',
      phone: '0551234567',
      senderPhoto: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?q=80&w=200&auto=format&fit=crop'
    }
  },
  {
    id: 'REP-9955',
    timestamp: new Date().toISOString(),
    location: { lat: 24.7300, lng: 46.6700 },
    description: 'حالة إغماء مفاجئة لشخص مسن في الشارع، صعوبة في التنفس.',
    image: null,
    missionStatus: 'pending',
    assignedCenterId: 'c1',
    involvedCenterIds: ['c1'],
    ambulanceIds: [],
    distanceToCenter: 3.1,
    sender: {
      fullName: 'خالد عبدالله',
      nationalId: '1023456789',
      phone: '0509876543',
      senderPhoto: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?q=80&w=200&auto=format&fit=crop'
    }
  }
];

export const initDB = () => {
  // Commented out the conditional initialization.
  // We want to force a reset immediately when this file loads 
  // to clear out previous messy test data for backend prep.
  localStorage.setItem('centers', JSON.stringify(INITIAL_CENTERS));
  localStorage.setItem('ambulances', JSON.stringify(INITIAL_AMBULANCES));
  localStorage.setItem('reports', JSON.stringify(INITIAL_REPORTS));
  
  // Set default logged-in user if not exists (Default to Center Admin for C1)
  if (!localStorage.getItem('currentUser')) {
    localStorage.setItem('currentUser', JSON.stringify(INITIAL_USERS[1]));
  }
};

export const getCurrentUser = () => JSON.parse(localStorage.getItem('currentUser')) || INITIAL_USERS[1];
export const setCurrentUser = (user) => localStorage.setItem('currentUser', JSON.stringify(user));

export const getCenters = () => JSON.parse(localStorage.getItem('centers')) || [];
export const getAmbulances = () => JSON.parse(localStorage.getItem('ambulances')) || [];
export const getReports = () => {
  const reports = JSON.parse(localStorage.getItem('reports')) || [];
  return reports.map(r => ({
    ...r,
    involvedCenterIds: r.involvedCenterIds || [r.assignedCenterId]
  }));
};

export const setReports = (reports) => localStorage.setItem('reports', JSON.stringify(reports));
export const setAmbulances = (ambulances) => localStorage.setItem('ambulances', JSON.stringify(ambulances));

export const updateAmbulanceStatus = (ambulanceId, status) => {
  const ambulances = getAmbulances();
  const updated = ambulances.map(a => a.id === ambulanceId ? { ...a, status } : a);
  setAmbulances(updated);
  return updated;
};

export const addReport = (report) => {
  const reports = getReports();
  // Ensure array structure from the start
  const newReport = { 
    ...report, 
    id: Date.now().toString(), 
    status: 'جديد', 
    ambulanceIds: report.ambulanceIds || [], 
    involvedCenterIds: [report.assignedCenterId] // Track all centers involved
  };
  reports.push(newReport);
  setReports(reports);
  return newReport;
};

export const updateReportStatus = (reportId, updates) => {
  const reports = getReports();
  const updated = reports.map(r => {
    if (r.id === reportId) {
      const newReport = { ...r, ...updates };
      // If assigned center changed, add it to involved list if not already there
      if (updates.assignedCenterId && !newReport.involvedCenterIds.includes(updates.assignedCenterId)) {
        newReport.involvedCenterIds = [...newReport.involvedCenterIds, updates.assignedCenterId];
      }
      return newReport;
    }
    return r;
  });
  setReports(updated);
  return updated;
};
