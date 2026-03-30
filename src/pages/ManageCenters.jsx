import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useNavigate } from 'react-router-dom';
import { FaHospitalAlt, FaPlus, FaTrashAlt, FaMapMarkerAlt, FaSearch, FaArrowRight, FaCity, FaUserShield, FaKey, FaUserEdit, FaExclamationCircle } from 'react-icons/fa';
import { getCenters, addCenter, deleteCenter, getCurrentUser } from '../services/db';

const ManageCenters = () => {
  const navigate = useNavigate();
  const user = getCurrentUser();
  const [centers, setCenters] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [newCenter, setNewCenter] = useState({ 
    name: '', 
    lat: '30.41', 
    lng: '31.11',
    adminName: '',
    adminUsername: '',
    adminPassword: ''
  });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    refreshCenters();
  }, []);

  const refreshCenters = () => {
    setCenters(getCenters());
  };

  if (!user || user.role !== 'SUPERVISOR') {
    return (
      <div className="flex flex-col items-center justify-center min-h-[70vh] p-4 text-center animate-fade-in">
        <div className="bg-red-500/10 border border-red-500/20 p-8 md:p-12 rounded-[2.5rem] backdrop-blur-xl max-w-md shadow-2xl">
          <div className="w-20 h-20 bg-red-500/20 rounded-3xl flex items-center justify-center mx-auto mb-6 border border-red-500/30">
            <FaUserShield className="text-4xl text-red-500 opacity-80" />
          </div>
          <h2 className="text-2xl md:text-3xl font-black text-white mb-3">وصول مرفوض</h2>
          <p className="text-gray-400 leading-relaxed">عذراً، هذه الصفحة مخصصة لمشرفي المحافظة فقط لإدارة الأصول والمراكز.</p>
        </div>
      </div>
    );
  }

  const handleAddCenter = (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    
    try {
      if (!newCenter.name.trim()) throw new Error('يرجى إدخال اسم المركز');
      if (!newCenter.adminUsername.trim()) throw new Error('يرجى إدخال اسم مستخدم المدير');
      
      const lat = parseFloat(newCenter.lat);
      const lng = parseFloat(newCenter.lng);
      
      if (isNaN(lat) || isNaN(lng)) throw new Error('إحداثيات غير صحيحة');

      addCenter({
        name: newCenter.name,
        location: { lat, lng },
        adminName: newCenter.adminName,
        adminUsername: newCenter.adminUsername,
        adminPassword: newCenter.adminPassword
      });
      
      setSuccess(`تم إضافة المركز بنجاح! يمكن للمدير الآن الدخول بحساب "${newCenter.adminUsername}"`);
      setNewCenter({ 
        name: '', 
        lat: '24.7136', 
        lng: '46.6753',
        adminName: '',
        adminUsername: '',
        adminPassword: ''
      });
      setShowAddModal(false);
      refreshCenters();
      
      setTimeout(() => setSuccess(''), 5000);
    } catch (err) {
      setError(err.message);
    }
  };

  const handleDeleteCenter = (id, name) => {
    if (window.confirm(`هل أنت متأكد من حذف مركز "${name}"؟ سيؤدي ذلك لحذف جميع العربات والحسابات المرتبطة به نهائياً.`)) {
      deleteCenter(id);
      refreshCenters();
      setSuccess('تم إزالة المركز وجميع متعلقاته من النظام بنجاح');
      setTimeout(() => setSuccess(''), 4000);
    }
  };

  const filteredCenters = centers.filter(c => 
    c.name?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <>
      <div className="p-4 md:p-10 max-w-7xl mx-auto space-y-10 animate-fade-in" dir="rtl">
        {/* Decorative background element */}
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-blue-600/10 rounded-full blur-[100px] pointer-events-none -z-10"></div>

      {/* Header Section */}
      <div className="relative flex flex-col lg:flex-row lg:items-center justify-between gap-8">
        <div className="space-y-4">
          <div className="flex items-center gap-4">
            <div className="p-4 bg-blue-600 rounded-3xl shadow-xl shadow-blue-900/40 border border-blue-400/50">
              <FaCity className="text-3xl text-white" />
            </div>
            <div>
              <h1 className="text-3xl md:text-4xl font-black text-white tracking-tight leading-none">إدارة المراكز</h1>
              <div className="flex items-center gap-2 mt-2">
                 <span className="w-2 h-2 rounded-full bg-blue-500 animate-pulse"></span>
                 <span className="text-blue-400 font-bold text-xs uppercase tracking-widest">نظام المحافظة الموحد</span>
              </div>
            </div>
          </div>
          <p className="text-gray-400 text-sm md:text-base max-w-2xl leading-relaxed">
            من هنا يمكنك التحكم الكامل في مراكز الإسعاف بالمحافظة عبر إضافة وحدات جديدة أو تحديث القائم منها لضمان أسرع استجابة للطوارئ.
          </p>
        </div>
        
        <button
          onClick={() => setShowAddModal(true)}
          className="group flex items-center justify-center gap-3 bg-white hover:bg-blue-600 text-gray-900 hover:text-white font-black py-4 px-8 rounded-2xl transition-all shadow-2xl active:scale-95 shrink-0"
        >
          <div className="bg-blue-600 group-hover:bg-white p-1.5 rounded-lg transition-colors">
            <FaPlus className="text-white group-hover:text-blue-600" />
          </div>
          <span className="text-lg">إضافة مركز إقليمي</span>
        </button>
      </div>

      {/* Notifications */}
      {success && (
        <div className="bg-green-500/10 border border-green-500/30 text-green-400 p-5 rounded-3xl flex items-center gap-4 animate-scale-up shadow-lg backdrop-blur-md">
           <div className="p-2 bg-green-500/20 rounded-full">
            <FaPlus className="text-xs" />
           </div>
           <span className="font-bold text-sm md:text-base">{success}</span>
        </div>
      )}

      {/* Controls & Grid Area */}
      <div className="space-y-8">
        {/* Search Bar - Enhanced */}
        <div className="relative group max-w-2xl">
          <div className="absolute inset-y-0 right-0 pr-5 flex items-center pointer-events-none">
            <FaSearch className="text-gray-500 group-focus-within:text-blue-400 transition-colors" />
          </div>
          <input
            type="text"
            placeholder="ابحث عن مركز باسم المدينة أو المنطقة..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-gray-800/40 border-2 border-gray-700/50 rounded-[2rem] py-5 pr-14 pl-6 text-white text-lg placeholder-gray-500 focus:outline-none focus:border-blue-500/50 focus:bg-gray-800/80 transition-all backdrop-blur-xl shadow-inner shadow-black/20"
          />
        </div>

        {/* Centers Grid - Premium Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8">
          {filteredCenters.map((center) => (
            <div 
              key={center.id}
              className="group bg-gradient-to-br from-gray-800/50 to-gray-900/50 border border-gray-700/40 rounded-[2.5rem] p-8 hover:border-blue-500/50 transition-all hover:shadow-[0_25px_60px_-15px_rgba(0,0,0,0.6)] relative overflow-hidden backdrop-blur-md flex flex-col h-full"
            >
              {/* Card top flare */}
              <div className="absolute -top-24 -right-24 w-48 h-48 bg-blue-600/10 rounded-full blur-3xl group-hover:bg-blue-600/20 transition-all"></div>
              
              <div className="flex justify-between items-start mb-8 relative z-10">
                <div className="p-4 bg-gray-900/80 rounded-[1.5rem] border border-gray-700 group-hover:border-blue-500/40 transition-all shadow-xl group-hover:scale-110">
                  <FaHospitalAlt className="text-3xl text-blue-500" />
                </div>
                <button
                  onClick={() => handleDeleteCenter(center.id, center.name)}
                  className="p-3 text-gray-500 hover:text-white hover:bg-red-600 rounded-2xl transition-all border border-transparent hover:border-red-400 shadow-lg"
                  title="إزالة المركز"
                >
                  <FaTrashAlt className="text-lg" />
                </button>
              </div>

              <div className="relative z-10 mb-8">
                <h3 className="text-2xl font-black text-white mb-2 leading-tight group-hover:text-blue-400 transition-colors uppercase tracking-tight">{center.name}</h3>
                <div className="inline-flex items-center gap-2 bg-gray-900/60 px-3 py-1 rounded-full border border-gray-700">
                  <div className="w-1.5 h-1.5 rounded-full bg-green-500"></div>
                  <span className="text-[10px] font-black text-gray-400 uppercase tracking-tighter">مركز نشط بالمحافظة</span>
                </div>
              </div>
              
              <div className="space-y-4 mb-8 flex-1">
                <div className="bg-gray-900/40 p-4 rounded-2xl border border-gray-700/50">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2 text-gray-400 text-xs font-bold">
                      <FaMapMarkerAlt className="text-blue-500" />
                      <span>الإحداثيات الجغرافية</span>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <div className="text-[10px] text-gray-500 font-bold uppercase mb-0.5">خط العرض</div>
                      <div className="text-white font-mono text-xs">{center.location?.lat?.toFixed?.(6) || '---'}</div>
                    </div>
                    <div>
                      <div className="text-[10px] text-gray-500 font-bold uppercase mb-0.5">خط الطول</div>
                      <div className="text-white font-mono text-xs">{center.location?.lng?.toFixed?.(6) || '---'}</div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="pt-6 border-t border-gray-700/50 flex justify-between items-center relative z-10 mt-auto">
                 <div className="text-[10px] font-black text-gray-600 bg-black/20 px-2 py-1 rounded tracking-widest">{center.id}</div>
                 <button 
                  onClick={() => navigate('/logs', { state: { filterCenter: center.id } })}
                  className="flex items-center gap-2 text-blue-500 hover:text-blue-400 text-sm font-black group-hover:gap-4 transition-all"
                 >
                    <span>عرض التقارير</span>
                    <FaArrowRight className="text-[10px] rotate-180" />
                 </button>
              </div>
            </div>
          ))}

          {filteredCenters.length === 0 && (
            <div className="col-span-full py-28 text-center bg-gray-800/10 rounded-[3rem] border-3 border-dashed border-gray-700 flex flex-col items-center justify-center space-y-6 backdrop-blur-sm animate-fade-in">
               <div className="p-8 bg-gray-800/50 rounded-full border border-gray-700 border-dashed">
                <FaHospitalAlt className="text-7xl text-gray-700 opacity-40" />
               </div>
               <div className="space-y-2">
                <p className="text-gray-300 text-xl font-bold">لم نجد أي مركز يطابق هذا البحث</p>
                <p className="text-gray-500">جرب كتابة اسم مختلف أو أضف مركزاً جديداً للمحافظة</p>
               </div>
            </div>
          )}
        </div>
        </div>
      </div>

      {/* Add Center Modal - Portaled to document.body to ensure it's ALWAYS on top */}
      {showAddModal && createPortal(
        <div className="fixed inset-0 z-[10000] flex items-center justify-center p-3 md:p-6 backdrop-blur-2xl bg-black/80 animate-fade-in overflow-y-auto">
          <div className="bg-gray-900 border border-white/10 rounded-[2.5rem] w-full max-w-2xl my-auto shadow-[0_40px_120px_-15px_rgba(0,0,0,0.8)] overflow-hidden animate-scale-up relative">
            
            {/* Modal Glow Header */}
            <div className="absolute top-0 inset-x-0 h-40 bg-gradient-to-b from-blue-600/10 to-transparent pointer-events-none"></div>

            <div className="relative px-6 py-6 border-b border-gray-800 flex justify-between items-center bg-gray-900/50 backdrop-blur-md">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center shadow-lg shadow-blue-900/40">
                  <FaPlus className="text-white text-sm" />
                </div>
                <h2 className="text-xl md:text-2xl font-black text-white">إضافة مركز إقليمي جديد</h2>
              </div>
              <button 
                onClick={() => setShowAddModal(false)}
                className="w-10 h-10 flex items-center justify-center bg-gray-800 hover:bg-gray-700 rounded-full text-gray-400 hover:text-white transition-all border border-gray-700"
              >
                ✕
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-6 md:p-10 custom-scrollbar relative">
              {error && (
                <div className="bg-red-500/10 border border-red-500/30 text-red-400 p-5 rounded-[1.5rem] mb-8 text-sm flex items-center gap-4 animate-shake">
                   <div className="p-1.5 bg-red-500/20 rounded-lg shrink-0">
                    <FaExclamationCircle className="text-xs" />
                   </div>
                   <span className="font-bold">{error}</span>
                </div>
              )}

              <form id="add-center-form" onSubmit={handleAddCenter} className="space-y-10">
                {/* Center Section */}
                <section className="space-y-6">
                  <div className="flex items-center gap-3">
                    <FaMapMarkerAlt className="text-blue-500" />
                    <h3 className="font-black text-white uppercase tracking-widest text-xs">بيانات المركز والموقع</h3>
                  </div>

                  <div className="grid grid-cols-1 gap-6">
                    <div className="space-y-2">
                      <label className="text-xs font-black text-gray-500 mr-1 uppercase">اسم المركز (سيظهر للعامة وسائقي الإسعاف)</label>
                      <input
                        required
                        type="text"
                        value={newCenter.name}
                        onChange={(e) => setNewCenter({ ...newCenter, name: e.target.value })}
                        className="w-full bg-gray-800/80 border-2 border-gray-700 rounded-2xl py-4 px-6 text-white focus:outline-none focus:border-blue-500 transition-all font-bold text-lg placeholder-gray-600"
                        placeholder="مثال: مركز إسعاف بنها العام"
                      />
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <label className="text-xs font-black text-gray-500 mr-1 uppercase">إحداثيات خط العرض</label>
                        <input
                          required
                          type="text"
                          value={newCenter.lat}
                          onChange={(e) => setNewCenter({ ...newCenter, lat: e.target.value })}
                          className="w-full bg-gray-800/80 border-2 border-gray-700 rounded-2xl py-4 px-6 text-white focus:outline-none focus:border-blue-500 transition-all text-center font-mono placeholder-gray-600"
                          placeholder="30.4100"
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-xs font-black text-gray-500 mr-1 uppercase">إحداثيات خط الطول</label>
                        <input
                          required
                          type="text"
                          value={newCenter.lng}
                          onChange={(e) => setNewCenter({ ...newCenter, lng: e.target.value })}
                          className="w-full bg-gray-800/80 border-2 border-gray-700 rounded-2xl py-4 px-6 text-white focus:outline-none focus:border-blue-500 transition-all text-center font-mono placeholder-gray-600"
                          placeholder="31.1100"
                        />
                      </div>
                    </div>
                  </div>
                </section>

                {/* Admin Account Section */}
                <section className="bg-blue-600/5 p-6 md:p-8 rounded-[2rem] border border-blue-500/20 space-y-6 relative overflow-hidden">
                  <div className="absolute top-0 right-0 p-12 bg-blue-600/5 rounded-full blur-3xl pointer-events-none"></div>
                  
                  <div className="flex items-center gap-3 relative z-10">
                    <FaKey className="text-blue-500" />
                    <h3 className="font-black text-blue-400 uppercase tracking-widest text-xs">إعدادات حساب مدير المركز</h3>
                  </div>
                  
                  <div className="space-y-6 relative z-10">
                    <div className="space-y-2">
                      <label className="text-xs font-black text-gray-500 mr-1 uppercase">الاسم الكامل لمدير المركز</label>
                      <div className="relative">
                        <FaUserEdit className="absolute right-5 top-1/2 -translate-y-1/2 text-gray-600" />
                        <input
                          required
                          type="text"
                          value={newCenter.adminName}
                          onChange={(e) => setNewCenter({ ...newCenter, adminName: e.target.value })}
                          className="w-full bg-gray-900 border-2 border-gray-700 rounded-2xl py-4 pr-14 pl-6 text-white focus:outline-none focus:border-blue-500 transition-all placeholder-gray-600"
                          placeholder="مثال: د. ياسر أحمد سليم"
                        />
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <label className="text-xs font-black text-gray-500 mr-1 uppercase">اسم المستخدم (Login ID)</label>
                        <input
                          required
                          type="text"
                          value={newCenter.adminUsername}
                          onChange={(e) => setNewCenter({ ...newCenter, adminUsername: e.target.value })}
                          className="w-full bg-gray-900 border-2 border-gray-700 rounded-2xl py-4 px-6 text-white focus:outline-none focus:border-blue-500 transition-all placeholder-gray-600"
                          placeholder="مثلاً: admin_banha"
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-xs font-black text-gray-500 mr-1 uppercase">كلمة مرور النظام</label>
                        <input
                          required
                          type="password"
                          value={newCenter.adminPassword}
                          onChange={(e) => setNewCenter({ ...newCenter, adminPassword: e.target.value })}
                          className="w-full bg-gray-900 border-2 border-gray-700 rounded-2xl py-4 px-6 text-white focus:outline-none focus:border-blue-500 transition-all placeholder-gray-600"
                          placeholder="••••••••"
                        />
                      </div>
                    </div>
                  </div>
                </section>
              </form>
            </div>
            
            {/* Modal Action Bar */}
            <div className="p-6 md:p-8 bg-gray-900/90 backdrop-blur-xl border-t border-gray-800 flex flex-col sm:flex-row gap-4">
              <button
                type="button"
                onClick={() => setShowAddModal(false)}
                className="flex-1 bg-gray-800 hover:bg-gray-700 text-white font-black py-4 rounded-2xl transition-all border border-gray-700 shadow-xl"
              >
                تراجع
              </button>
              <button
                form="add-center-form"
                type="submit"
                className="flex-[1.5] bg-blue-600 hover:bg-blue-500 text-white font-black py-4 rounded-2xl transition-all shadow-2xl shadow-blue-600/30 active:scale-95"
              >
                تأكيد وبدء النظام لهذا المركز
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}
    </>
  );
};

export default ManageCenters;
