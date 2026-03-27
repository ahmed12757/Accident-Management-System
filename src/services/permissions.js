export const ALL_ROLES = ['SUPERVISOR', 'CENTER_ADMIN', 'DRIVER'];

// Default permissions per route path
export const DEFAULT_PERMISSIONS = {
  '/dashboard': ['SUPERVISOR', 'CENTER_ADMIN'],
  '/logs': ['SUPERVISOR', 'CENTER_ADMIN'],
  '/track/:id': ['SUPERVISOR', 'CENTER_ADMIN'],
  '/paramedic/:id': ['DRIVER'],
  '/driver/:ambulanceId': ['DRIVER'],
  '/admin/drivers': ['SUPERVISOR', 'CENTER_ADMIN'],
};

const KEY = 'route_permissions';

export const getRoutePermissions = () => {
  const saved = localStorage.getItem(KEY);
  if (saved) {
    try {
      const parsed = JSON.parse(saved);
      return { ...DEFAULT_PERMISSIONS, ...parsed };
    } catch {
      return { ...DEFAULT_PERMISSIONS };
    }
  }
  return { ...DEFAULT_PERMISSIONS };
};

export const setRoutePermissions = (perms) => {
  localStorage.setItem(KEY, JSON.stringify(perms));
};

