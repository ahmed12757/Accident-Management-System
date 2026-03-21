import React, { createContext, useContext, useState, useCallback } from 'react';
import { FaBell, FaCheckCircle, FaExclamationTriangle, FaInfoCircle, FaTimes } from 'react-icons/fa';

const NotificationContext = createContext();

export const useNotification = () => useContext(NotificationContext);

export const NotificationProvider = ({ children }) => {
    const [notifications, setNotifications] = useState([]);

    const showNotification = useCallback((message, type = 'info', duration = 4000) => {
        const id = Math.random().toString(36).substring(2, 9);
        setNotifications(prev => [...prev, { id, message, type }]);

        if (duration) {
            setTimeout(() => {
                setNotifications(prev => prev.filter(n => n.id !== id));
            }, duration);
        }
    }, []);

    const removeNotification = (id) => {
        setNotifications(prev => prev.filter(n => n.id !== id));
    };

    const [modal, setModal] = useState(null); // { title, message, onConfirm, onCancel, confirmText, cancelText }

    const showConfirm = useCallback((title, message, onConfirm, confirmText = 'تأكيد', cancelText = 'إلغاء') => {
        setModal({ 
            title, 
            message, 
            onConfirm: () => { onConfirm(); setModal(null); }, 
            onCancel: () => setModal(null),
            confirmText,
            cancelText
        });
    }, []);

    return (
        <NotificationContext.Provider value={{ showNotification, showConfirm }}>
            {children}
            
            {/* Toast Container */}
            <div className="fixed bottom-6 right-6 z-[200] flex flex-col gap-3 pointer-events-none max-w-sm w-full" dir="rtl">
                {notifications.map(n => (
                    <div 
                        key={n.id} 
                        className={`pointer-events-auto p-4 rounded-2xl shadow-2xl border backdrop-blur-xl animate-in slide-in-from-right-10 duration-300 flex items-center gap-4 ${
                            n.type === 'success' ? 'bg-green-600/20 border-green-500/30 text-green-400' :
                            n.type === 'error' ? 'bg-red-600/20 border-red-500/30 text-red-400' :
                            n.type === 'warning' ? 'bg-orange-600/20 border-orange-500/30 text-orange-400' :
                            'bg-blue-600/20 border-blue-500/30 text-blue-400'
                        }`}
                    >
                        <div className="text-xl shrink-0">
                            {n.type === 'success' ? <FaCheckCircle /> :
                             n.type === 'error' ? <FaExclamationTriangle /> :
                             n.type === 'warning' ? <FaExclamationTriangle /> :
                             <FaInfoCircle />}
                        </div>
                        <div className="flex-1 text-sm font-bold">{n.message}</div>
                        <button onClick={() => removeNotification(n.id)} className="text-gray-400 hover:text-white transition-colors">
                            <FaTimes />
                        </button>
                    </div>
                ))}
            </div>

            {/* Confirmation Modal */}
            {modal && (
                <div className="fixed inset-0 z-[210] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in duration-200" dir="rtl">
                    <div className="bg-gray-900 border border-gray-700 w-full max-w-sm rounded-3xl shadow-2xl overflow-hidden p-8 animate-in zoom-in-95 duration-200">
                        <div className="w-16 h-16 bg-orange-600/20 rounded-full flex items-center justify-center text-orange-400 text-3xl mb-6 mx-auto border border-orange-500/30">
                            <FaExclamationTriangle />
                        </div>
                        <h3 className="text-xl font-black text-white text-center mb-2">{modal.title}</h3>
                        <p className="text-gray-400 text-center text-sm mb-8 leading-relaxed px-2">{modal.message}</p>
                        <div className="flex gap-3">
                            <button 
                                onClick={modal.onConfirm}
                                className="flex-1 bg-orange-600 hover:bg-orange-500 text-white font-bold py-3 rounded-2xl transition-all shadow-lg shadow-orange-900/40 active:scale-95 text-sm"
                            >
                                {modal.confirmText}
                            </button>
                            <button 
                                onClick={modal.onCancel}
                                className="flex-1 bg-gray-800 hover:bg-gray-700 text-gray-300 font-bold py-3 rounded-2xl border border-gray-700 transition-all active:scale-95 text-sm"
                            >
                                {modal.cancelText}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </NotificationContext.Provider>
    );
};
