import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { login } from '../services/db';
import { FaAmbulance, FaUser, FaLock, FaExclamationCircle } from 'react-icons/fa';

const Login = () => {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const navigate = useNavigate();

    const handleLogin = (e) => {
        e.preventDefault();
        setError('');
        setIsLoading(true);

        // Simulate network delay for premium feel
        setTimeout(() => {
            const user = login(username, password);
            if (user) {
                if (user.role === 'DRIVER') {
                    navigate(`/driver/${user.ambulanceId}`);
                } else {
                    navigate('/dashboard');
                }
            } else {
                setError('اسم المستخدم أو كلمة المرور غير صحيحة');
                setIsLoading(false);
            }
        }, 1000);
    };

    return (
        <div className="min-h-screen flex items-center justify-center p-4 bg-gray-900 overflow-hidden relative" dir="rtl">
            {/* Animated Background Blobs */}
            <div className="absolute top-0 -left-4 w-72 h-72 bg-blue-600 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob"></div>
            <div className="absolute top-0 -right-4 w-72 h-72 bg-purple-600 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob animation-delay-2000"></div>
            <div className="absolute -bottom-8 left-20 w-72 h-72 bg-red-600 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob animation-delay-4000"></div>

            <div className="max-w-md w-full relative z-10">
                <div className="bg-gray-800/50 backdrop-blur-xl border border-gray-700 rounded-3xl p-8 shadow-2xl overflow-hidden">
                    <div className="text-center mb-8">
                        <div className="inline-flex items-center justify-center w-20 h-20 rounded-2xl bg-red-600 shadow-lg shadow-red-900/40 mb-4 animate-bounce-slow">
                            <FaAmbulance className="text-white text-4xl" />
                        </div>
                        <h2 className="text-3xl font-black text-white tracking-tight">طوارئ الإسعاف</h2>
                        <p className="text-gray-400 mt-2 font-medium">سجل الدخول للوصول إلى لوحة التحكم</p>
                    </div>

                    <form onSubmit={handleLogin} className="space-y-6">
                        {error && (
                            <div className="bg-red-500/10 border border-red-500/50 text-red-400 px-4 py-3 rounded-xl text-sm flex items-center gap-3 animate-shake">
                                <FaExclamationCircle className="shrink-0" />
                                <span>{error}</span>
                            </div>
                        )}

                        <div className="space-y-4">
                            <div className="relative group">
                                <div className="absolute inset-y-0 right-0 pr-4 flex items-center pointer-events-none text-gray-500 group-focus-within:text-blue-500 transition-colors">
                                    <FaUser />
                                </div>
                                <input
                                    type="text"
                                    required
                                    className="block w-full pr-11 pl-4 py-4 bg-gray-900/50 border border-gray-700 rounded-2xl text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                                    placeholder="اسم المستخدم"
                                    value={username}
                                    onChange={(e) => setUsername(e.target.value)}
                                />
                            </div>

                            <div className="relative group">
                                <div className="absolute inset-y-0 right-0 pr-4 flex items-center pointer-events-none text-gray-500 group-focus-within:text-blue-500 transition-colors">
                                    <FaLock />
                                </div>
                                <input
                                    type="password"
                                    required
                                    className="block w-full pr-11 pl-4 py-4 bg-gray-900/50 border border-gray-700 rounded-2xl text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                                    placeholder="كلمة المرور"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                />
                            </div>
                        </div>

                        <button
                            type="submit"
                            disabled={isLoading}
                            className="w-full bg-blue-600 hover:bg-blue-500 disabled:bg-gray-700 text-white font-black py-4 rounded-2xl shadow-xl shadow-blue-900/40 transition-all active:scale-95 flex items-center justify-center gap-3 text-lg"
                        >
                            {isLoading ? (
                                <div className="w-6 h-6 border-4 border-white/20 border-t-white rounded-full animate-spin"></div>
                            ) : (
                                <>دخول الآمن <span className="text-xl">←</span></>
                            )}
                        </button>
                    </form>

                    <div className="mt-8 pt-6 border-t border-gray-700/50">
                        <p className="text-center text-gray-500 text-xs uppercase tracking-widest font-bold">نظام إدارة الحوادث الذكي</p>
                    </div>
                </div>
                
                {/* Mock Info Card */}
                <div className="mt-6 bg-blue-900/20 border border-blue-500/20 rounded-2xl p-4 backdrop-blur-sm animate-pulse">
                    <p className="text-blue-400 text-[10px] font-bold text-center">للتجربة: admin / center1 / driver1 (كلمة السر 123)</p>
                </div>
            </div>
        </div>
    );
};

export default Login;
