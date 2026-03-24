import { useState, useEffect } from 'react';
import { FaAmbulance } from 'react-icons/fa';

const SplashScreen = ({ onFinish }) => {
    const [isVisible, setIsVisible] = useState(true);

    useEffect(() => {
        const timer = setTimeout(() => {
            setIsVisible(false);
            setTimeout(onFinish, 500); // Wait for fade out animation
        }, 2500);

        return () => clearTimeout(timer);
    }, [onFinish]);

    return (
        <div 
            className={`fixed inset-0 z-[100] flex flex-col items-center justify-center bg-gray-900 transition-opacity duration-500 bg-[url('https://www.transparenttextures.com/patterns/dark-matter.png')]
                ${isVisible ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
            dir="rtl"
        >
            <div className="flex flex-col items-center gap-6 p-8 rounded-3xl bg-gray-800/50 border border-gray-700 shadow-2xl backdrop-blur-sm animate-slide-down">
                <div className="relative">
                    <div className="absolute inset-0 bg-red-600 rounded-full blur-xl opacity-20 animate-pulse"></div>
                    <div className="bg-red-600 p-6 rounded-2xl shadow-lg shadow-red-600/30 animate-bounce-slow relative z-10 border border-red-500/50">
                        <FaAmbulance className="text-white text-6xl" />
                    </div>
                </div>
                
                <div className="text-center space-y-2">
                    <h1 className="text-4xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-red-400 to-red-600 tracking-tight">
                        طوارئ الإسعاف
                    </h1>
                    <p className="text-gray-400 font-medium text-lg tracking-wide">
                        نظام إدارة الحوادث الذكي
                    </p>
                </div>

                <div className="mt-4 flex gap-2">
                    <div className="w-3 h-3 bg-red-600 rounded-full animate-bounce [animation-delay:-0.3s]"></div>
                    <div className="w-3 h-3 bg-red-600 rounded-full animate-bounce [animation-delay:-0.15s]"></div>
                    <div className="w-3 h-3 bg-red-600 rounded-full animate-bounce"></div>
                </div>
            </div>
        </div>
    );
};

export default SplashScreen;
