import { useEffect, useMemo, useState } from 'react';
import { addAmbulance, addDriverAccount, getAmbulances, getCenters, getCurrentUser, getUsers, removeUserById } from '../services/db';

const DriverAccounts = () => {
  const user = getCurrentUser();
  const [centers, setCenters] = useState([]);
  const [ambulances, setAmbulances] = useState([]);
  const [users, setUsers] = useState([]);

  const [selectedCenterId, setSelectedCenterId] = useState('');
  const [selectedAmbulanceId, setSelectedAmbulanceId] = useState('');
  const [newAmbulanceName, setNewAmbulanceName] = useState('');
  const [name, setName] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const canManage = user?.role === 'SUPERVISOR' || user?.role === 'CENTER_ADMIN';

  const reload = () => {
    const allCenters = getCenters();
    const allAmbs = getAmbulances();
    const allUsers = getUsers();

    setCenters(allCenters);
    setAmbulances(allAmbs);
    setUsers(allUsers);

    if (user?.role === 'CENTER_ADMIN') {
      setSelectedCenterId(user.centerId);
    } else if (!selectedCenterId && allCenters.length) {
      setSelectedCenterId(allCenters[0].id);
    }
  };

  useEffect(() => {
    reload();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const ambulancesForCenter = useMemo(() => {
    if (!selectedCenterId) return [];
    return ambulances.filter(a => a.centerId === selectedCenterId);
  }, [ambulances, selectedCenterId]);

  const driverAccounts = useMemo(() => {
    const drivers = users.filter(u => u.role === 'DRIVER');
    const byCenter = selectedCenterId
      ? drivers.filter(d => {
          const amb = ambulances.find(a => a.id === d.ambulanceId);
          return amb?.centerId === selectedCenterId;
        })
      : drivers;
    return byCenter;
  }, [users, ambulances, selectedCenterId]);

  const usedAmbulanceIds = useMemo(() => {
    const ids = new Set(users.filter(u => u.role === 'DRIVER').map(u => u.ambulanceId));
    return ids;
  }, [users]);

  const availableAmbulances = useMemo(() => {
    return ambulancesForCenter.filter(a => !usedAmbulanceIds.has(a.id));
  }, [ambulancesForCenter, usedAmbulanceIds]);

  useEffect(() => {
    // reset ambulance when center changes
    setSelectedAmbulanceId('');
  }, [selectedCenterId]);

  if (!canManage) {
    return (
      <div className="p-6 text-center text-red-400" dir="rtl">
        غير مسموح لك بالوصول إلى هذه الصفحة.
      </div>
    );
  }

  const onSubmit = (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    try {
      addDriverAccount({
        name: name.trim(),
        username: username.trim(),
        password,
        ambulanceId: selectedAmbulanceId,
        centerId: selectedCenterId,
      });
      setSuccess('تم إنشاء حساب السائق بنجاح');
      setName('');
      setUsername('');
      setPassword('');
      setSelectedAmbulanceId('');
      reload();
    } catch (err) {
      setError(err?.message || 'حدث خطأ');
    }
  };

  const onAddAmbulance = () => {
    setError('');
    setSuccess('');

    try {
      addAmbulance({ centerId: selectedCenterId, name: newAmbulanceName });
      setSuccess('تمت إضافة العربة بنجاح');
      setNewAmbulanceName('');
      reload();
    } catch (err) {
      setError(err?.message || 'حدث خطأ');
    }
  };

  const deleteDriver = (driverId) => {
    setError('');
    setSuccess('');
    removeUserById(driverId);
    setSuccess('تم حذف الحساب');
    reload();
  };

  const centerName = (id) => centers.find(c => c.id === id)?.name || id;
  const ambulanceName = (id) => ambulances.find(a => a.id === id)?.name || id;

  return (
    <div className="p-4 md:p-6 max-w-6xl mx-auto flex flex-col gap-6" dir="rtl">
      <div className="bg-gray-800/70 border border-gray-700 rounded-2xl p-4 md:p-6 shadow-xl">
        <h1 className="text-2xl font-black text-white">إدارة حسابات العربات (السائقين)</h1>
        <p className="text-gray-400 mt-2 text-sm">
          اعمل حساب سواق لعربية إسعاف داخل مركز محدد. كل عربية ليها حساب واحد بس.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-gray-800/70 border border-gray-700 rounded-2xl p-4 md:p-6 shadow-xl">
          <h2 className="text-lg font-bold text-white mb-4">إنشاء حساب جديد</h2>

          {(error || success) && (
            <div
              className={`mb-4 p-3 rounded-xl border text-sm ${
                error
                  ? 'bg-red-900/20 border-red-500/40 text-red-300'
                  : 'bg-green-900/20 border-green-500/40 text-green-300'
              }`}
            >
              {error || success}
            </div>
          )}

          <form onSubmit={onSubmit} className="space-y-4">
            <div>
              <label className="block text-xs text-gray-300 font-bold mb-2">المركز</label>
              <select
                className="w-full bg-gray-900/60 border border-gray-700 rounded-xl p-3 text-white"
                value={selectedCenterId}
                onChange={(e) => setSelectedCenterId(e.target.value)}
                disabled={user?.role === 'CENTER_ADMIN'}
              >
                {centers.map(c => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            </div>

            <div className="bg-gray-900/40 border border-gray-700 rounded-2xl p-4">
              <div className="flex items-center justify-between gap-3 mb-3">
                <h3 className="text-sm font-black text-white">إضافة عربة جديدة للمركز</h3>
                <span className="text-[10px] text-gray-400">هتظهر فوراً في قائمة العربات</span>
              </div>
              <div className="flex flex-col md:flex-row gap-3">
                <input
                  className="flex-1 bg-gray-950/40 border border-gray-700 rounded-xl p-3 text-white"
                  value={newAmbulanceName}
                  onChange={(e) => setNewAmbulanceName(e.target.value)}
                  placeholder="مثال: إسعاف طوارئ 303"
                />
                <button
                  type="button"
                  onClick={onAddAmbulance}
                  className="bg-emerald-600 hover:bg-emerald-500 text-white font-black px-5 py-3 rounded-xl transition-colors disabled:bg-gray-700"
                  disabled={!selectedCenterId || !newAmbulanceName.trim()}
                >
                  إضافة العربة
                </button>
              </div>
            </div>

            <div>
              <label className="block text-xs text-gray-300 font-bold mb-2">العربة (سيارة الإسعاف)</label>
              <select
                className="w-full bg-gray-900/60 border border-gray-700 rounded-xl p-3 text-white"
                value={selectedAmbulanceId}
                onChange={(e) => setSelectedAmbulanceId(e.target.value)}
                required
              >
                <option value="" disabled>اختر عربة متاحة...</option>
                {availableAmbulances.map(a => (
                  <option key={a.id} value={a.id}>{a.name}</option>
                ))}
              </select>
              {availableAmbulances.length === 0 && (
                <p className="text-xs text-amber-300/90 mt-2">
                  لا توجد عربات بدون حساب داخل هذا المركز حالياً.
                </p>
              )}
            </div>

            <div>
              <label className="block text-xs text-gray-300 font-bold mb-2">اسم السائق</label>
              <input
                className="w-full bg-gray-900/60 border border-gray-700 rounded-xl p-3 text-white"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                placeholder="مثال: محمد أحمد"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs text-gray-300 font-bold mb-2">اسم المستخدم</label>
                <input
                  className="w-full bg-gray-900/60 border border-gray-700 rounded-xl p-3 text-white"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  required
                  placeholder="مثال: driver_new"
                />
              </div>
              <div>
                <label className="block text-xs text-gray-300 font-bold mb-2">كلمة السر</label>
                <input
                  type="password"
                  className="w-full bg-gray-900/60 border border-gray-700 rounded-xl p-3 text-white"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  placeholder="••••••"
                />
              </div>
            </div>

            <button
              type="submit"
              className="w-full bg-blue-600 hover:bg-blue-500 text-white font-black py-3 rounded-xl transition-colors disabled:bg-gray-700"
              disabled={!selectedCenterId || !selectedAmbulanceId}
            >
              إنشاء الحساب
            </button>
          </form>
        </div>

        <div className="bg-gray-800/70 border border-gray-700 rounded-2xl p-4 md:p-6 shadow-xl">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold text-white">حسابات السائقين</h2>
            <span className="text-xs text-gray-400">
              {selectedCenterId ? centerName(selectedCenterId) : 'كل المراكز'} • {driverAccounts.length}
            </span>
          </div>

          <div className="space-y-3 max-h-[520px] overflow-auto pr-1 custom-scrollbar">
            {driverAccounts.map((d) => (
              <div key={d.id} className="bg-gray-900/60 border border-gray-700 rounded-2xl p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div className="min-w-0">
                  <div className="text-white font-black truncate">{d.name}</div>
                  <div className="text-xs text-gray-400 mt-1">
                    اسم المستخدم: <span className="text-gray-200 font-bold break-all">{d.username}</span>
                  </div>
                  <div className="text-xs text-gray-400 mt-1">
                    العربة: <span className="text-gray-200 font-bold">{ambulanceName(d.ambulanceId)}</span>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => deleteDriver(d.id)}
                  className="shrink-0 bg-red-600/20 hover:bg-red-600 text-red-300 hover:text-white border border-red-500/30 px-3 py-2 rounded-xl text-xs font-black transition-colors"
                >
                  حذف
                </button>
              </div>
            ))}

            {driverAccounts.length === 0 && (
              <div className="text-center text-gray-500 py-10">
                لا توجد حسابات سائقين لهذا المركز.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default DriverAccounts;
