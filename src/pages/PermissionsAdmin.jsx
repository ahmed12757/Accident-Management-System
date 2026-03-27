import { useEffect, useState } from 'react';
import { ALL_ROLES, getRoutePermissions, setRoutePermissions, DEFAULT_PERMISSIONS } from '../services/permissions';
import { getCurrentUser } from '../services/db';

const AVAILABLE_ROUTES = [
  { path: '/dashboard', label: 'لوحة تحكم المراكز' },
  { path: '/logs', label: 'سجل البلاغات' },
  { path: '/track/:id', label: 'تتبع مهمة' },
  { path: '/paramedic/:id', label: 'واجهة المسعف' },
  { path: '/driver/:ambulanceId', label: 'واجهة قائد السيارة' },
];

const PermissionsAdmin = () => {
  const user = getCurrentUser();
  const [perms, setPerms] = useState(DEFAULT_PERMISSIONS);

  useEffect(() => {
    setPerms(getRoutePermissions());
  }, []);

  if (!user || user.role !== 'SUPERVISOR') {
    return (
      <div className="p-6 text-center text-red-400">
        غير مسموح لك بالوصول إلى صفحة إدارة الصلاحيات.
      </div>
    );
  }

  const toggleRole = (routePath, role) => {
    setPerms((prev) => {
      const current = prev[routePath] || [];
      const exists = current.includes(role);
      const next = {
        ...prev,
        [routePath]: exists ? current.filter((r) => r !== role) : [...current, role],
      };
      setRoutePermissions(next);
      return next;
    });
  };

  return (
    <div className="p-6 max-w-4xl mx-auto" dir="rtl">
      <h1 className="text-2xl font-bold mb-4 text-white">إدارة صلاحيات الصفحات (قسم الـ IT)</h1>
      <p className="text-gray-400 mb-6 text-sm">
        من هنا تقدر تحدد أي الصفحات مسموحة لكل دور. التغييرات يتم حفظها محلياً على هذا الجهاز.
      </p>

      <div className="bg-gray-800/70 border border-gray-700 rounded-2xl overflow-hidden shadow-xl">
        <table className="w-full text-sm">
          <thead className="bg-gray-900/80">
            <tr>
              <th className="px-4 py-3 text-right text-gray-300">المسار / الصفحة</th>
              {ALL_ROLES.map((role) => (
                <th key={role} className="px-3 py-3 text-center text-gray-300">
                  {role}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {AVAILABLE_ROUTES.map((route) => {
              const allowed = perms[route.path] || [];
              return (
                <tr key={route.path} className="border-t border-gray-700/60 hover:bg-gray-800/70">
                  <td className="px-4 py-3">
                    <div className="font-semibold text-white">{route.label}</div>
                    <div className="text-xs text-gray-400">{route.path}</div>
                  </td>
                  {ALL_ROLES.map((role) => {
                    const isChecked = allowed.includes(role);
                    return (
                      <td key={role} className="px-3 py-3 text-center">
                        <button
                          type="button"
                          onClick={() => toggleRole(route.path, role)}
                          className={`w-8 h-8 rounded-lg border text-xs font-bold transition-all ${
                            isChecked
                              ? 'bg-green-600/80 border-green-400 text-white'
                              : 'bg-gray-900/40 border-gray-600 text-gray-400'
                          }`}
                        >
                          {isChecked ? '✔' : '✕'}
                        </button>
                      </td>
                    );
                  })}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default PermissionsAdmin;

