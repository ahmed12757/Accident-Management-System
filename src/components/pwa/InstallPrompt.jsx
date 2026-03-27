import { useState, useEffect } from 'react';
import { FaDownload, FaTimes } from 'react-icons/fa';
import appIcon from '../../../public/Image/icon-180.png';

const InstallPrompt = () => {
    const [deferredPrompt, setDeferredPrompt] = useState(null);
    const [isInstallable, setIsInstallable] = useState(false);
    const [isDismissed, setIsDismissed] = useState(false);

    useEffect(() => {
        // Check if already dismissed in this session
        if (sessionStorage.getItem('pwa_install_dismissed')) {
            setIsDismissed(true);
        }

        const handleBeforeInstallPrompt = (e) => {
            // Prevent Chrome 67 and earlier from automatically showing the prompt
            e.preventDefault();
            // Stash the event so it can be triggered later.
            setDeferredPrompt(e);
            setIsInstallable(true);
        };

        window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

        // Check if app is already installed
        window.addEventListener('appinstalled', () => {
            setIsInstallable(false);
            setDeferredPrompt(null);
            console.log('PWA was installed');
        });

        return () => {
            window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
        };
    }, []);

    const handleInstallClick = async () => {
        if (!deferredPrompt) return;
        
        // Show the install prompt
        deferredPrompt.prompt();
        
        // Wait for the user to respond to the prompt
        const { outcome } = await deferredPrompt.userChoice;
        console.log(`User response to the install prompt: ${outcome}`);
        
        // We've used the prompt, and can't use it again, throw it away
        setDeferredPrompt(null);
        setIsInstallable(false);
    };

    const handleDismiss = () => {
        setIsDismissed(true);
        sessionStorage.setItem('pwa_install_dismissed', 'true');
    };

    if (!isInstallable || isDismissed) return null;

    return (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 w-[90%] max-w-sm animate-slide-down" dir="rtl">
            <div className="bg-gray-800 border border-gray-700 rounded-2xl shadow-2xl p-4 flex items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                    <div className="bg-red-600/20 p-2 rounded-xl border border-red-500/30 w-12 h-12 flex items-center justify-center shrink-0">
                        <img src={appIcon} alt="أيقونة التطبيق" className="w-full h-full object-contain" onError={(e) => { e.target.style.display = 'none'; }} />
                    </div>
                    <div>
                        <h4 className="text-white font-bold text-sm">تثبيت التطبيق</h4>
                        <p className="text-gray-400 text-xs mt-0.5">للوصول السريع وتجربة أفضل</p>
                    </div>
                </div>
                
                <div className="flex items-center gap-2">
                    <button 
                        onClick={handleInstallClick}
                        className="bg-red-600 hover:bg-red-500 text-white px-4 py-2 rounded-xl text-sm font-bold shadow-lg shadow-red-600/30 transition-all flex items-center gap-2"
                    >
                        <FaDownload />
                        تثبيت
                    </button>
                    <button 
                        onClick={handleDismiss}
                        className="p-2 text-gray-400 hover:text-white hover:bg-gray-700 rounded-xl transition-colors"
                        aria-label="إغلاق"
                    >
                        <FaTimes />
                    </button>
                </div>
            </div>
        </div>
    );
};

export default InstallPrompt;
