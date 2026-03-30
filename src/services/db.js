import { calculateDistance } from '../utils/geo';

export const INITIAL_CENTERS = [
  { id: 'c1', name: 'مركز إسعاف قليوب الرئيسي', location: { lat: 30.1770, lng: 31.2061 } },
  { id: 'c2', name: 'مركز إسعاف شبرا الخيمة', location: { lat: 30.1286, lng: 31.2422 } }
];

export const INITIAL_USERS = [
  { id: 'u1', username: 'admin', password: '123', name: 'مدير عام المنظومة', role: 'SUPERVISOR' },
  { id: 'u2', username: 'center1', password: '123', name: 'مدير مركز قليوب', role: 'CENTER_ADMIN', centerId: 'c1' },
  { id: 'u3', username: 'center2', password: '123', name: 'مدير مركز شبرا', role: 'CENTER_ADMIN', centerId: 'c2' },
  { id: 'u4', username: 'driver1', password: '123', name: 'أحمد علي (قليوب)', role: 'DRIVER', ambulanceId: 'a1' },
  { id: 'u5', username: 'driver2', password: '123', name: 'ياسر كمال (قليوب)', role: 'DRIVER', ambulanceId: 'a2' },
  { id: 'u6', username: 'driver3', password: '123', name: 'سامي محمود (شبرا)', role: 'DRIVER', ambulanceId: 'a3' }
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
    location: { lat: 30.1850, lng: 31.2100 },
    description: 'حادث تصادم بين سيارتين، يوجد مصاب واحد فاقد للوعي ويحتاج لتدخل سريع.',
    images: ['https://images.unsplash.com/photo-1543353846-5be81ce4e211?q=80&w=400&auto=format&fit=crop'],
    videos: [],
    audios: [],
    missionStatus: 'تم إنهاء المهمة',
    assignedCenterId: 'c1',
    involvedCenterIds: ['c1'],
    ambulanceIds: ['a1'],
    source: 'manual',
    severity: 1,
    subReports: [],
    isFalseReport: false,
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
    location: { lat: 30.1900, lng: 31.2000 },
    description: '[رصد آلي]: تصادم مركبات، تأكيد إرتطام عالي القوة',
    images: [],
    videos: [],
    audios: [],
    missionStatus: 'pending',
    assignedCenterId: 'c1',
    involvedCenterIds: ['c1'],
    ambulanceIds: [],
    source: 'automated',
    cameraId: 'CAM-402',
    severity: 1,
    subReports: [],
    isFalseReport: false,
    distanceToCenter: 3.1
  },
  {
    id: 'REP-9956',
    timestamp: new Date().toISOString(),
    location: { lat: 30.1750, lng: 31.2150 },
    description: 'اندلاع حريق محدود في محرك حافلة ركاب.',
    images: [
      'https://images.unsplash.com/photo-1563201515-ad694e9f90c6?q=80&w=400&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1543085350-058074917d05?q=80&w=400&auto=format&fit=crop'
    ],
    videos: ['https://www.w3schools.com/html/mov_bbb.mp4'],
    audios: ['https://www.w3schools.com/html/horse.mp3'],
    missionStatus: 'pending',
    assignedCenterId: 'c1',
    involvedCenterIds: ['c1'],
    ambulanceIds: [],
    source: 'manual',
    severity: 3,
    subReports: [
      {
        id: 'SUB-001',
        timestamp: new Date(Date.now() - 5 * 60 * 1000).toISOString(),
        location: { lat: 30.1750, lng: 31.2150 },
        description: 'رأيت حافلة تشتعل في الشارع الرئيسي - أرسلوا دعماً',
        images: [
          'https://images.unsplash.com/photo-1543353846-5be81ce4e211?q=80&w=400&auto=format&fit=crop',
          'https://images.unsplash.com/photo-1543085350-058074917d05?q=80&w=400&auto=format&fit=crop'
        ],
        videos: [],
        audios: ['https://www.w3schools.com/html/horse.mp3'],
        sender: { 
            fullName: 'عمر فاروق', 
            nationalId: '1022334455', 
            phone: '0555111222',
            senderPhoto: 'https://images.unsplash.com/photo-1599566150163-29194dcaad36?q=80&w=200&auto=format&fit=crop'
        }
      },
      {
        id: 'SUB-002',
        timestamp: new Date(Date.now() - 2 * 60 * 1000).toISOString(),
        location: { lat: 24.7150, lng: 46.6850 },
        description: 'يوجد دخان كثيف يخرج من الحافلة، الناس يساعدون الركاب على الخروج.',
        images: [
          'https://images.unsplash.com/photo-1543353846-5be81ce4e211?q=80&w=400&auto=format&fit=crop',
          'https://images.unsplash.com/photo-1563201515-ad694e9f90c6?q=80&w=400&auto=format&fit=crop'
        ],
        videos: ['https://www.w3schools.com/html/movie.mp4'],
        audios: [],
        sender: { 
            fullName: 'ياسين علي', 
            nationalId: '1099887766', 
            phone: '0544333222',
            senderPhoto: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?q=80&w=200&auto=format&fit=crop'
        }
      }
    ],
    isFalseReport: false,
    distanceToCenter: 1.8,
    sender: {
      fullName: 'سارة عبدالرحمن',
      nationalId: '1088776655',
      phone: '0567123456',
      senderPhoto: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?q=80&w=200&auto=format&fit=crop'
    }
  }
];

export const initDB = () => {
  // Migration: If the user has old Riyadh data, force a reset to Al Qalyubiyah
  const centersInStorage = JSON.parse(localStorage.getItem('centers'));
  if (centersInStorage && centersInStorage.length > 0) {
    const firstCenter = centersInStorage[0];
    // Coordinates around 24 are Riyadh, 30 are Egypt/Qalyubia
    if (firstCenter.location?.lat < 25) {
       console.warn('Old Riyadh data detected. Resetting to Al Qalyubiyah...');
       localStorage.removeItem('centers');
       localStorage.removeItem('reports');
       localStorage.removeItem('ambulances');
       localStorage.removeItem('users');
       localStorage.removeItem('currentUser');
       window.location.reload(); // Refresh to load new INITIAL_X constants
       return;
    }
  }

  if (!localStorage.getItem('centers')) localStorage.setItem('centers', JSON.stringify(INITIAL_CENTERS));
  if (!localStorage.getItem('ambulances')) localStorage.setItem('ambulances', JSON.stringify(INITIAL_AMBULANCES));
  if (!localStorage.getItem('reports')) localStorage.setItem('reports', JSON.stringify(INITIAL_REPORTS));
  if (!localStorage.getItem('users')) {
    const ambById = new Map(INITIAL_AMBULANCES.map(a => [a.id, a]));
    const normalized = INITIAL_USERS.map(u => {
      if (u.role !== 'DRIVER') return u;
      const amb = ambById.get(u.ambulanceId);
      return { ...u, centerId: amb?.centerId };
    });
    localStorage.setItem('users', JSON.stringify(normalized));
  }
};

const normalizeStoredUsers = (users) => {
  const ambs = JSON.parse(localStorage.getItem('ambulances')) || INITIAL_AMBULANCES;
  const ambById = new Map(ambs.map(a => [a.id, a]));
  return (users || []).map(u => {
    if (u.role !== 'DRIVER') return u;
    if (u.centerId) return u;
    const amb = ambById.get(u.ambulanceId);
    return { ...u, centerId: amb?.centerId };
  });
};

export const login = (username, password, centerId) => {
  const raw = JSON.parse(localStorage.getItem('users')) || INITIAL_USERS;
  const users = normalizeStoredUsers(raw);
  // keep storage normalized
  localStorage.setItem('users', JSON.stringify(users));

  const matches = users.filter(u => u.username === username && u.password === password);
  if (matches.length === 0) return null;
  if (matches.length === 1) {
    localStorage.setItem('currentUser', JSON.stringify(matches[0]));
    return matches[0];
  }

  // Multiple matches: allow duplicates across centers for DRIVER only
  const driverMatches = matches.filter(u => u.role === 'DRIVER');
  if (driverMatches.length !== matches.length) return null;
  if (!centerId) return { __needsCenter: true, centers: [...new Set(driverMatches.map(d => d.centerId).filter(Boolean))] };

  const chosen = driverMatches.find(d => d.centerId === centerId);
  if (!chosen) return null;
  localStorage.setItem('currentUser', JSON.stringify(chosen));
  return chosen;
};

export const logout = () => {
  localStorage.removeItem('currentUser');
};

export const getCurrentUser = () => JSON.parse(localStorage.getItem('currentUser')) || null;
export const setCurrentUser = (user) => localStorage.setItem('currentUser', JSON.stringify(user));

export const getUsers = () => {
  const raw = JSON.parse(localStorage.getItem('users')) || [];
  const normalized = normalizeStoredUsers(raw);
  if (JSON.stringify(raw) !== JSON.stringify(normalized)) {
    localStorage.setItem('users', JSON.stringify(normalized));
  }
  return normalized;
};
export const setUsers = (users) => localStorage.setItem('users', JSON.stringify(users));

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
export const setCenters = (centers) => localStorage.setItem('centers', JSON.stringify(centers));

export const addCenter = ({ name, location, adminName, adminUsername, adminPassword }) => {
  if (!name || !location || !adminName || !adminUsername || !adminPassword) {
    throw new Error('البيانات غير مكتملة (يرجى إكمال بيانات المركز والمدير)');
  }
  
  const centers = getCenters();
  const trimmedName = name.trim();
  if (!trimmedName) throw new Error('اسم المركز مطلوب');

  const duplicateName = centers.some(c => c.name?.trim?.() === trimmedName);
  if (duplicateName) throw new Error('اسم المركز موجود بالفعل');

  const users = getUsers();
  const duplicateUser = users.some(u => u.username?.toLowerCase() === adminUsername.toLowerCase());
  if (duplicateUser) throw new Error('اسم مستخدم المدير موجود بالفعل، اختر اسماً آخر');

  const centerId = `c_${Date.now()}`;
  const newCenter = {
    id: centerId,
    name: trimmedName,
    location,
  };

  const newAdmin = {
    id: `u_${Date.now()}_admin`,
    name: adminName,
    username: adminUsername,
    password: adminPassword,
    role: 'CENTER_ADMIN',
    centerId: centerId
  };

  setCenters([...centers, newCenter]);
  setUsers([...users, newAdmin]);
  
  return { center: newCenter, admin: newAdmin };
};

export const deleteCenter = (id) => {
  const centers = getCenters();
  const next = centers.filter(c => c.id !== id);
  setCenters(next);
  
  // Optional: cleanup ambulances and users associated with this center
  const ambulances = getAmbulances().filter(a => a.centerId !== id);
  setAmbulances(ambulances);
  
  const users = getUsers().filter(u => u.centerId !== id);
  setUsers(users);
  
  return next;
};

export const addAmbulance = ({ centerId, name }) => {
  if (!centerId || !name) throw new Error('البيانات غير مكتملة');

  const ambulances = getAmbulances();
  const trimmedName = name.trim();
  if (!trimmedName) throw new Error('اسم العربة مطلوب');

  const duplicateName = ambulances.some(
    (a) => a.centerId === centerId && a.name?.trim?.() === trimmedName
  );
  if (duplicateName) throw new Error('اسم العربة موجود بالفعل داخل هذا المركز');

  const newAmbulance = {
    id: `a_${Date.now()}`,
    centerId,
    name: trimmedName,
    status: 'متاحة',
  };

  setAmbulances([...ambulances, newAmbulance]);
  return newAmbulance;
};

export const addDriverAccount = ({ name, username, password, ambulanceId, centerId }) => {
  if (!name || !username || !password || !ambulanceId) {
    throw new Error('البيانات غير مكتملة');
  }

  const users = getUsers();
  const normalizedUsername = username.toLowerCase();
  // Username uniqueness:
  // - for DRIVER: unique within the same center only
  // - for others: keep it global
  const targetCenterId = centerId || (getAmbulances().find(a => a.id === ambulanceId)?.centerId);
  const existsUsername = users.some(u => {
    if (u.username?.toLowerCase?.() !== normalizedUsername) return false;
    if (u.role !== 'DRIVER') return true;
    return u.centerId === targetCenterId;
  });
  if (existsUsername) throw new Error('اسم المستخدم موجود بالفعل داخل هذا المركز');

  const existsAmb = users.some(u => u.role === 'DRIVER' && u.ambulanceId === ambulanceId);
  if (existsAmb) throw new Error('هذه العربة لديها حساب سائق بالفعل');

  const newUser = {
    id: `u_${Date.now()}`,
    name,
    username,
    password,
    role: 'DRIVER',
    ambulanceId,
    centerId: targetCenterId,
  };

  setUsers([...users, newUser]);
  return newUser;
};

export const removeUserById = (id) => {
  const users = getUsers();
  const next = users.filter(u => u.id !== id);
  setUsers(next);
  return next;
};

export const getBlacklist = () => JSON.parse(localStorage.getItem('blacklist')) || [];
export const addToBlacklist = (nationalId) => {
    if (!nationalId) return;
    const list = getBlacklist();
    if (!list.includes(nationalId)) {
        localStorage.setItem('blacklist', JSON.stringify([...list, nationalId]));
    }
};

export const updateAmbulanceStatus = (ambulanceId, status) => {
  const ambulances = getAmbulances();
  const updated = ambulances.map(a => a.id === ambulanceId ? { ...a, status } : a);
  setAmbulances(updated);
  return updated;
};

export const findMatchingIncident = (reportData) => {
  const reports = getReports();
  const DISTANCE_THRESHOLD_KM = 0.5; // 500 meters
  const TIME_THRESHOLD_MS = 30 * 60 * 1000; // 30 minutes
  
  return reports.find(r => {
    if (r.missionStatus === 'تم إنهاء المهمة') return false;
    
    const dist = calculateDistance(
      reportData.location.lat, 
      reportData.location.lng, 
      r.location.lat, 
      r.location.lng
    );
    
    const timeDiff = Math.abs(new Date(reportData.timestamp) - new Date(r.timestamp));
    return dist < DISTANCE_THRESHOLD_KM && timeDiff < TIME_THRESHOLD_MS;
  });
};

export const findPrimaryIncidentById = (id) => {
    const reports = getReports();
    // 1. Direct match
    const direct = reports.find(r => r.id === id);
    if (direct) return direct;

    // 2. Search in sub-reports
    return reports.find(r => r.subReports && r.subReports.some(sub => sub.id === id));
};

export const addReport = (reportData) => {
  const reports = getReports();
  const existingIncident = findMatchingIncident(reportData);

  if (existingIncident) {
    // Group with existing incident
    const updatedReports = reports.map(r => {
      if (r.id === existingIncident.id) {
        const subReports = r.subReports || [];
        return {
          ...r,
          subReports: [...subReports, { ...reportData, id: Date.now().toString() }],
          severity: Math.min((r.severity || 1) + 1, 5) // Increment severity up to 5
        };
      }
      return r;
    });
    setReports(updatedReports);
    return updatedReports.find(r => r.id === existingIncident.id);
  }

  // Check if sender is blacklisted
  const isBlacklisted = reportData.sender && getBlacklist().includes(reportData.sender.nationalId);

  // No match found: Create new primary incident
  const newReport = { 
    ...reportData, 
    id: Date.now().toString(), 
    status: isBlacklisted ? 'تحت الفحص' : 'جديد', 
    source: reportData.source || 'manual',
    severity: isBlacklisted ? 1 : (reportData.severity || 1),
    subReports: [],
    isFalseReport: false,
    isSuspicious: isBlacklisted,
    ambulanceIds: reportData.ambulanceIds || [], 
    involvedCenterIds: [reportData.assignedCenterId]
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

export const updateIncidentSeverity = (id, severity) => {
    const reports = getReports();
    const updated = reports.map(r => r.id === id ? { ...r, severity } : r);
    setReports(updated);
    return updated.find(r => r.id === id);
};

export const markAsFalseReport = (id, reason) => {
    const reports = getReports();
    const report = reports.find(r => r.id === id);
    
    if (report) {
        // Blacklist primary sender
        if (report.sender?.nationalId) addToBlacklist(report.sender.nationalId);
        
        // Blacklist all sub-reporters
        if (report.subReports) {
            report.subReports.forEach(sub => {
                if (sub.sender?.nationalId) addToBlacklist(sub.sender.nationalId);
            });
        }

        // NEW: Free up ambulances!
        if (report.ambulanceIds && report.ambulanceIds.length > 0) {
            report.ambulanceIds.forEach(ambId => {
                updateAmbulanceStatus(ambId, 'متاحة');
            });
        }
    }

    const updated = reports.map(r => r.id === id ? { 
        ...r, 
        isFalseReport: true, 
        falseReportReason: reason,
        missionStatus: 'تم إلغاء المهمة (بلاغ كاذب)',
        status: 'كاذب'
    } : r);
    setReports(updated);
    return updated.find(r => r.id === id);
};

export const flagAsFalseByParamedic = (id, reason) => {
    const reports = getReports();
    const updated = reports.map(r => r.id === id ? { 
        ...r, 
        paramedicFlaggedAsFalse: true, 
        paramedicReason: reason,
        status: 'بلاغ كاذب (بانتظار التأكيد)'
    } : r);
    setReports(updated);
    return updated.find(r => r.id === id);
};

export const rejectFalseFlagByParamedic = (id) => {
    const reports = getReports();
    const updated = reports.map(r => r.id === id ? { 
        ...r, 
        paramedicFlaggedAsFalse: false, 
        paramedicReason: null,
        status: 'تحت المتابعة'
    } : r);
    setReports(updated);
    return updated.find(r => r.id === id);
};
