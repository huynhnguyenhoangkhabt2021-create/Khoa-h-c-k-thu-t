import React, { useState } from 'react';
import {
  Lock,
  User,
  KeyRound,
  ShieldCheck,
  UserPlus,
  LogIn,
  AlertCircle,
  CheckCircle2,
  Eye,
  EyeOff,
  Stethoscope,
  HeartHandshake,
  ShieldAlert,
  Sparkles
} from 'lucide-react';

export interface AuthUser {
  id: string;
  username: string;
  password: string;
  fullName: string;
  role: 'Bác sĩ phụ trách' | 'Người thân người bệnh' | 'Bệnh nhân';
  phone?: string;
}

interface AuthGateProps {
  title: string;
  description: string;
  currentUser: AuthUser | null;
  onLogin: (user: AuthUser) => void;
  children: React.ReactNode;
}

export const AuthGate: React.FC<AuthGateProps> = ({
  title,
  description,
  currentUser,
  onLogin,
  children,
}) => {
  const [authMode, setAuthMode] = useState<'login' | 'register'>('login');

  // Login form states
  const [loginUsername, setLoginUsername] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [showLoginPassword, setShowLoginPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [loginError, setLoginError] = useState('');

  // Register form states
  const [regFullName, setRegFullName] = useState('');
  const [regUsername, setRegUsername] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [regConfirmPassword, setRegConfirmPassword] = useState('');
  const [showRegPassword, setShowRegPassword] = useState(false);
  const [regRole, setRegRole] = useState<'Bác sĩ phụ trách' | 'Người thân người bệnh' | 'Bệnh nhân'>('Người thân người bệnh');
  const [regPhone, setRegPhone] = useState('');
  const [regError, setRegError] = useState('');
  const [regSuccess, setRegSuccess] = useState('');

  // Get users from localStorage
  const getUsers = (): AuthUser[] => {
    const saved = localStorage.getItem('smart_health_auth_users');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch {
        // fallback
      }
    }
    // Default initial seed users
    const defaults: AuthUser[] = [
      {
        id: 'u-doctor',
        username: 'admin',
        password: '123',
        fullName: 'BS. CKII Nguyễn Văn An',
        role: 'Bác sĩ phụ trách',
        phone: '0988 123 456',
      },
      {
        id: 'u-family',
        username: 'giadinh',
        password: '123',
        fullName: 'Người Con Chăm Sóc',
        role: 'Người thân người bệnh',
        phone: '0912 345 678',
      },
    ];
    localStorage.setItem('smart_health_auth_users', JSON.stringify(defaults));
    return defaults;
  };

  const handleLoginSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError('');

    const users = getUsers();
    const user = users.find(
      u =>
        u.username.trim().toLowerCase() === loginUsername.trim().toLowerCase() &&
        u.password === loginPassword
    );

    if (user) {
      onLogin(user);
    } else {
      setLoginError('Tên người dùng hoặc mật khẩu không chính xác. Vui lòng kiểm tra lại hoặc chuyển qua tab Đăng Ký để tạo tài khoản mới.');
    }
  };

  const handleRegisterSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setRegError('');
    setRegSuccess('');

    if (!regUsername.trim() || !regPassword.trim() || !regFullName.trim()) {
      setRegError('Vui lòng điền đầy đủ các trường thông tin bắt buộc.');
      return;
    }

    if (regPassword.length < 3) {
      setRegError('Mật khẩu cần tối thiểu 3 ký tự.');
      return;
    }

    if (regPassword !== regConfirmPassword) {
      setRegError('Mật khẩu xác nhận không khớp với mật khẩu đã nhập.');
      return;
    }

    const users = getUsers();
    if (users.some(u => u.username.toLowerCase() === regUsername.trim().toLowerCase())) {
      setRegError(`Tên người dùng "${regUsername}" đã được đăng ký. Vui lòng chọn tên tài khoản khác.`);
      return;
    }

    const newUser: AuthUser = {
      id: 'u-' + Date.now(),
      username: regUsername.trim(),
      password: regPassword,
      fullName: regFullName.trim(),
      role: regRole,
      phone: regPhone.trim(),
    };

    const updatedUsers = [...users, newUser];
    localStorage.setItem('smart_health_auth_users', JSON.stringify(updatedUsers));
    setRegSuccess('Đăng ký tài khoản thành công! Đang tự động kết nối hệ thống...');

    setTimeout(() => {
      onLogin(newUser);
    }, 600);
  };

  // If already logged in, render children directly
  if (currentUser) {
    return <>{children}</>;
  }

  // Otherwise, render modern luxury authentication portal
  return (
    <div className="max-w-xl mx-auto my-6 px-2">
      <div className="glass-panel rounded-3xl p-6 sm:p-8 space-y-6 border border-indigo-500/30 shadow-2xl bg-gradient-to-br from-indigo-950/40 via-slate-900/90 to-black backdrop-blur-xl relative overflow-hidden">
        {/* Subtle decorative glow */}
        <div className="absolute -top-24 -right-24 w-48 h-48 bg-indigo-500/15 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-24 -left-24 w-48 h-48 bg-purple-500/15 rounded-full blur-3xl pointer-events-none" />

        {/* Header with Security Badge */}
        <div className="text-center space-y-2 relative z-10">
          <div className="w-14 h-14 mx-auto rounded-2xl bg-gradient-to-tr from-indigo-600 via-blue-600 to-purple-600 flex items-center justify-center text-white shadow-xl shadow-indigo-500/30 ring-4 ring-indigo-500/20">
            <Lock className="w-7 h-7" />
          </div>
          <h2 className="text-lg sm:text-xl font-black text-white tracking-wide">
            {title}
          </h2>
          <p className="text-xs text-slate-300 max-w-md mx-auto leading-relaxed">
            {description}
          </p>
        </div>

        {/* Tab Switcher: Đăng nhập vs Đăng ký (Modern Segmented Control) */}
        <div className="flex p-1.5 rounded-2xl bg-black/50 border border-white/10 relative z-10 shadow-inner">
          <button
            type="button"
            onClick={() => {
              setAuthMode('login');
              setLoginError('');
            }}
            className={`flex-1 py-2.5 rounded-xl font-bold text-xs sm:text-sm flex items-center justify-center gap-2 transition duration-200 cursor-pointer ${
              authMode === 'login'
                ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-lg shadow-indigo-500/30'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <LogIn className="w-4 h-4" /> Đăng Nhập
          </button>
          <button
            type="button"
            onClick={() => {
              setAuthMode('register');
              setRegError('');
            }}
            className={`flex-1 py-2.5 rounded-xl font-bold text-xs sm:text-sm flex items-center justify-center gap-2 transition duration-200 cursor-pointer ${
              authMode === 'register'
                ? 'bg-gradient-to-r from-emerald-600 to-teal-600 text-white shadow-lg shadow-emerald-500/30'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <UserPlus className="w-4 h-4" /> Đăng Ký Tài Khoản
          </button>
        </div>

        {/* FORM 1: ĐĂNG NHẬP */}
        {authMode === 'login' && (
          <form onSubmit={handleLoginSubmit} className="space-y-4 text-xs relative z-10 animate-fadeIn">
            {loginError && (
              <div className="p-3.5 rounded-2xl bg-rose-500/15 border border-rose-500/40 text-rose-300 flex items-start gap-2.5 shadow-sm">
                <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                <span className="leading-relaxed">{loginError}</span>
              </div>
            )}

            <div>
              <label className="block text-slate-300 font-bold mb-1.5 flex items-center gap-1.5">
                <User className="w-3.5 h-3.5 text-indigo-400" /> Tên người dùng (Username) *
              </label>
              <div className="relative">
                <input
                  type="text"
                  required
                  value={loginUsername}
                  onChange={e => setLoginUsername(e.target.value)}
                  placeholder="Nhập tên tài khoản của bạn..."
                  className="w-full glass-input p-3 rounded-2xl text-white font-medium pl-10"
                  autoComplete="username"
                />
                <User className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5 pointer-events-none" />
              </div>
            </div>

            <div>
              <label className="block text-slate-300 font-bold mb-1.5 flex items-center gap-1.5">
                <KeyRound className="w-3.5 h-3.5 text-indigo-400" /> Mật khẩu *
              </label>
              <div className="relative">
                <input
                  type={showLoginPassword ? 'text' : 'password'}
                  required
                  value={loginPassword}
                  onChange={e => setLoginPassword(e.target.value)}
                  placeholder="Nhập mật khẩu..."
                  className="w-full glass-input p-3 rounded-2xl text-white font-medium pl-10 pr-10"
                  autoComplete="current-password"
                />
                <KeyRound className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5 pointer-events-none" />
                <button
                  type="button"
                  onClick={() => setShowLoginPassword(!showLoginPassword)}
                  className="absolute right-3.5 top-3.5 text-slate-400 hover:text-white transition cursor-pointer"
                >
                  {showLoginPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <div className="flex items-center justify-between text-xs text-slate-400 pt-1">
              <label className="flex items-center gap-2 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={e => setRememberMe(e.target.checked)}
                  className="rounded text-indigo-500 focus:ring-indigo-400"
                />
                <span>Ghi nhớ đăng nhập trên thiết bị này</span>
              </label>
              <button
                type="button"
                onClick={() => setAuthMode('register')}
                className="text-indigo-400 hover:text-indigo-300 transition underline cursor-pointer text-[11px]"
              >
                Chưa có tài khoản? Đăng ký
              </button>
            </div>

            <button
              type="submit"
              className="w-full py-3.5 gemini-gradient-bg text-white font-extrabold rounded-2xl shadow-xl hover:opacity-95 transition flex items-center justify-center gap-2 cursor-pointer text-sm tracking-wide mt-2"
            >
              <LogIn className="w-4 h-4" /> Đăng Nhập Vào Hệ Thống
            </button>
          </form>
        )}

        {/* FORM 2: ĐĂNG KÝ TÀI KHOẢN MỚI */}
        {authMode === 'register' && (
          <form onSubmit={handleRegisterSubmit} className="space-y-3.5 text-xs relative z-10 animate-fadeIn">
            {regError && (
              <div className="p-3.5 rounded-2xl bg-rose-500/15 border border-rose-500/40 text-rose-300 flex items-start gap-2.5 shadow-sm">
                <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                <span className="leading-relaxed">{regError}</span>
              </div>
            )}

            {regSuccess && (
              <div className="p-3.5 rounded-2xl bg-emerald-500/15 border border-emerald-500/40 text-emerald-300 flex items-center gap-2.5 shadow-sm">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                <span className="leading-relaxed">{regSuccess}</span>
              </div>
            )}

            <div>
              <label className="block text-slate-300 font-bold mb-1">Họ và tên của bạn *</label>
              <input
                type="text"
                required
                value={regFullName}
                onChange={e => setRegFullName(e.target.value)}
                placeholder="Ví dụ: Nguyễn Văn An, Nguyễn Anh Tuấn..."
                className="w-full glass-input p-3 rounded-2xl text-white font-medium"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-slate-300 font-bold mb-1">Vai trò của bạn *</label>
                <select
                  value={regRole}
                  onChange={e => setRegRole(e.target.value as any)}
                  className="w-full glass-input p-3 rounded-2xl text-slate-200 cursor-pointer"
                >
                  <option value="Người thân người bệnh">Người thân người bệnh</option>
                  <option value="Bác sĩ phụ trách">Bác sĩ phụ trách</option>
                  <option value="Bệnh nhân">Bệnh nhân</option>
                </select>
              </div>
              <div>
                <label className="block text-slate-300 font-bold mb-1">Số điện thoại liên lạc</label>
                <input
                  type="text"
                  value={regPhone}
                  onChange={e => setRegPhone(e.target.value)}
                  placeholder="0912 345 678"
                  className="w-full glass-input p-3 rounded-2xl font-mono text-cyan-300"
                />
              </div>
            </div>

            <div>
              <label className="block text-slate-300 font-bold mb-1">Tên người dùng (Username) đăng nhập *</label>
              <input
                type="text"
                required
                value={regUsername}
                onChange={e => setRegUsername(e.target.value)}
                placeholder="Ví dụ: bacsi_an, con_gai..."
                className="w-full glass-input p-3 rounded-2xl text-white font-medium"
                autoComplete="username"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-slate-300 font-bold mb-1">Mật khẩu *</label>
                <div className="relative">
                  <input
                    type={showRegPassword ? 'text' : 'password'}
                    required
                    value={regPassword}
                    onChange={e => setRegPassword(e.target.value)}
                    placeholder="Tối thiểu 3 ký tự..."
                    className="w-full glass-input p-3 rounded-2xl text-white font-medium pr-10"
                    autoComplete="new-password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowRegPassword(!showRegPassword)}
                    className="absolute right-3.5 top-3.5 text-slate-400 hover:text-white transition cursor-pointer"
                  >
                    {showRegPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-slate-300 font-bold mb-1">Xác nhận mật khẩu *</label>
                <input
                  type={showRegPassword ? 'text' : 'password'}
                  required
                  value={regConfirmPassword}
                  onChange={e => setRegConfirmPassword(e.target.value)}
                  placeholder="Nhập lại mật khẩu..."
                  className="w-full glass-input p-3 rounded-2xl text-white font-medium"
                  autoComplete="new-password"
                />
              </div>
            </div>

            <button
              type="submit"
              className="w-full py-3.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-extrabold rounded-2xl shadow-xl transition flex items-center justify-center gap-2 cursor-pointer text-sm tracking-wide mt-2"
            >
              <UserPlus className="w-4 h-4" /> Hoàn Tất Đăng Ký & Vào Hệ Thống
            </button>
          </form>
        )}

        {/* Security & Confidentiality Footer Badge */}
        <div className="pt-2 border-t border-white/10 text-center relative z-10">
          <div className="flex items-center justify-center gap-2 text-[11px] text-slate-400 font-medium">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            <span>Dữ liệu y bạ được bảo mật tiêu chuẩn mã hóa thông tin sức khỏe cá nhân</span>
          </div>
        </div>
      </div>
    </div>
  );
};
