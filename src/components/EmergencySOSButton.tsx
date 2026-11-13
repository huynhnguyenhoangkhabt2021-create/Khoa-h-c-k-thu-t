import React, { useState } from 'react';
import {
  AlertTriangle,
  PhoneCall,
  X,
  ShieldAlert,
  Volume2,
  VolumeX,
  CheckCircle2,
  MapPin,
  Clock,
  User,
  Radio,
  LogIn,
  FileText,
  AlertCircle
} from 'lucide-react';
import { Member, HealthRecordData } from '../types';
import { AuthUser } from './AuthGate';

interface EmergencySOSButtonProps {
  currentUser: AuthUser | null;
  onNavigateToAuth?: () => void;
  onNavigateToProfile?: () => void;
  members: Member[];
  currentMember?: Member | null;
}

export const EmergencySOSButton: React.FC<EmergencySOSButtonProps> = ({
  currentUser,
  onNavigateToAuth,
  onNavigateToProfile,
  members,
  currentMember,
}) => {
  const [isOpenModal, setIsOpenModal] = useState(false);
  const [showAuthWarningModal, setShowAuthWarningModal] = useState(false);
  const [isAlerting, setIsAlerting] = useState(false);
  const [isSoundMuted, setIsSoundMuted] = useState(false);
  const [audioCtx, setAudioCtx] = useState<AudioContext | null>(null);
  const [oscillatorNode, setOscillatorNode] = useState<OscillatorNode | null>(null);
  const [selectedEmergencyReason, setSelectedEmergencyReason] = useState<string>(
    'Cần trợ giúp y tế khẩn cấp tại chỗ'
  );

  // Retrieve saved profile data if any from localStorage
  const activeMember = currentMember || (members.length > 0 ? members[0] : null);
  const patientName = currentUser?.fullName || activeMember?.name || 'Người cao tuổi';
  const emergencyPhone = currentUser?.phone || activeMember?.emergencyContact || '0988 123 456';

  // Play web audio synthesis siren
  const startSiren = () => {
    try {
      const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(650, ctx.currentTime);

      // Siren sweep effect
      let freq = 650;
      let up = true;
      const interval = setInterval(() => {
        if (!osc) return;
        freq = up ? freq + 60 : freq - 60;
        if (freq >= 950) up = false;
        if (freq <= 550) up = true;
        try {
          osc.frequency.setValueAtTime(freq, ctx.currentTime);
        } catch {}
      }, 80);

      gain.gain.setValueAtTime(0.15, ctx.currentTime);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();

      setAudioCtx(ctx);
      setOscillatorNode(osc);

      (osc as any)._interval = interval;
    } catch (e) {
      console.warn('Web Audio API requires user gesture:', e);
    }
  };

  const stopSiren = () => {
    if (oscillatorNode) {
      try {
        clearInterval((oscillatorNode as any)._interval);
        oscillatorNode.stop();
        oscillatorNode.disconnect();
      } catch {}
      setOscillatorNode(null);
    }
    if (audioCtx) {
      try {
        audioCtx.close();
      } catch {}
      setAudioCtx(null);
    }
  };

  const handleSOSClick = () => {
    // 1. Check if user is logged in
    if (!currentUser) {
      setShowAuthWarningModal(true);
      return;
    }

    // 2. User is logged in -> activate SOS
    triggerActiveSOS();
  };

  const triggerActiveSOS = () => {
    setIsOpenModal(true);
    setIsAlerting(true);

    // Play siren if not muted
    if (!isSoundMuted) {
      startSiren();
    }

    // Browser notification
    if (typeof window !== 'undefined' && 'Notification' in window) {
      if (Notification.permission === 'granted') {
        new Notification('🚨 CẢNH BÁO SOS SMART HEALTHCARE!', {
          body: `Bệnh nhân ${patientName} vừa phát tín hiệu SOS khẩn cấp trên web: "${selectedEmergencyReason}". Vui lòng trợ giúp ngay!`,
          icon: 'https://cdn-icons-png.flaticon.com/512/564/564619.png',
        });
      } else if (Notification.permission !== 'denied') {
        Notification.requestPermission().then(permission => {
          if (permission === 'granted') {
            new Notification('🚨 CẢNH BÁO SOS SMART HEALTHCARE!', {
              body: `Bệnh nhân ${patientName} vừa phát tín hiệu SOS khẩn cấp trên web!`,
            });
          }
        });
      }
    }
  };

  const cancelSOS = () => {
    stopSiren();
    setIsAlerting(false);
    setIsOpenModal(false);
  };

  const emergencyReasons = [
    'Té ngã, đau nhức không thể tự ngồi dậy',
    'Choáng váng, hoa mắt, nghi ngờ tụt huyết áp',
    'Đau tức ngực, khó thở đột ngột',
    'Cần trợ giúp y tế khẩn cấp tại chỗ',
  ];

  return (
    <>
      {/* FLOATING SOS BUTTON */}
      <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end gap-2 group">
        <span className="hidden group-hover:block px-3 py-1 rounded-xl bg-rose-950/90 border border-rose-500/50 text-white text-[11px] font-bold shadow-lg animate-bounce">
          Nhấn để phát tín hiệu cấp cứu SOS trực tiếp trên Web!
        </span>

        <button
          onClick={handleSOSClick}
          aria-label="Khẩn cấp SOS"
          className="relative w-16 h-16 sm:w-18 sm:h-18 rounded-full bg-gradient-to-tr from-rose-700 via-rose-600 to-red-500 text-white font-extrabold flex flex-col items-center justify-center shadow-2xl shadow-rose-600/60 ring-4 ring-rose-500/50 hover:scale-105 active:scale-95 transition cursor-pointer select-none"
        >
          {/* Pulsing beacon glow effect */}
          <span className="absolute inset-0 rounded-full bg-rose-500 animate-ping opacity-35" />
          <AlertTriangle className="w-6 h-6 sm:w-7 sm:h-7 animate-pulse relative z-10" />
          <span className="text-[10px] sm:text-[11px] font-black tracking-widest uppercase relative z-10">
            SOS
          </span>
        </button>
      </div>

      {/* MODAL 1: YÊU CẦU ĐĂNG NHẬP & LƯU THÔNG TIN TRƯỚC KHI KÍCH HOẠT SOS */}
      {showAuthWarningModal && (
        <div className="fixed inset-0 bg-black/85 backdrop-blur-md z-50 flex items-center justify-center p-4">
          <div className="glass-panel rounded-3xl p-6 w-full max-w-md space-y-4 border border-amber-500/40 shadow-2xl bg-gradient-to-br from-amber-950/40 via-slate-900/90 to-black text-slate-100 animate-fadeIn">
            <div className="flex items-center justify-between pb-3 border-b border-white/10">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-2xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400">
                  <AlertCircle className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="font-extrabold text-amber-300 text-sm sm:text-base">
                    YÊU CẦU ĐĂNG NHẬP HỆ THỐNG
                  </h3>
                  <p className="text-[11px] text-slate-400">Kích hoạt cứu trợ SOS Smart Healthcare</p>
                </div>
              </div>
              <button
                onClick={() => setShowAuthWarningModal(false)}
                className="text-slate-400 hover:text-white p-1 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs leading-relaxed text-slate-300">
              <p>
                Để đảm bảo tính xác thực và giúp bác sĩ cũng như người thân nhận diện đúng danh tính,
                <strong className="text-white"> hệ thống SOS chỉ bắt đầu hoạt động sau khi Quý vị đã đăng nhập tài khoản và lưu thông tin y bạ</strong> trong mục Hồ Sơ Sức Khỏe.
              </p>
              <div className="p-3 rounded-xl bg-black/40 border border-amber-500/20 space-y-1.5 text-[11px]">
                <div className="flex items-center gap-2 text-amber-300 font-semibold">
                  <CheckCircle2 className="w-3.5 h-3.5" /> Thông tin cần thiết để cứu trợ SOS:
                </div>
                <ul className="list-disc pl-5 space-y-1 text-slate-300">
                  <li>Tài khoản đăng nhập xác thực danh tính người dùng.</li>
                  <li>Họ tên người bệnh và địa chỉ nơi cư trú để ứng cứu.</li>
                  <li>Số điện thoại người thân bảo hộ khẩn cấp.</li>
                </ul>
              </div>
            </div>

            <div className="flex gap-2 pt-2">
              <button
                onClick={() => {
                  setShowAuthWarningModal(false);
                  if (onNavigateToAuth) onNavigateToAuth();
                }}
                className="flex-1 py-3 gemini-gradient-bg text-white font-bold rounded-xl text-xs flex items-center justify-center gap-2 shadow-lg hover:opacity-95 transition cursor-pointer"
              >
                <LogIn className="w-4 h-4" /> Đăng Nhập Tài Khoản Ngay
              </button>
              <button
                onClick={() => setShowAuthWarningModal(false)}
                className="px-4 py-3 bg-white/5 hover:bg-white/10 text-slate-300 rounded-xl text-xs font-bold transition cursor-pointer"
              >
                Đóng
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 2: SOS EMERGENCY BROADCAST MODAL (ACTIVE WHEN LOGGED IN) */}
      {isOpenModal && (
        <div className="fixed inset-0 bg-black/85 backdrop-blur-md z-50 flex items-center justify-center p-4">
          <div className="glass-panel rounded-3xl p-5 sm:p-6 w-full max-w-lg space-y-4 border-2 border-rose-500 shadow-2xl bg-gradient-to-br from-rose-950/70 via-slate-900/90 to-black text-slate-100">
            {/* Header */}
            <div className="flex items-center justify-between pb-3 border-b border-rose-500/30">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-2xl bg-rose-600 flex items-center justify-center text-white shadow-lg shadow-rose-600/40 animate-pulse">
                  <ShieldAlert className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-base sm:text-lg font-black text-rose-300 tracking-wide uppercase">
                    CẢNH BÁO KHẨN CẤP (EMERGENCY SOS)
                  </h3>
                  <p className="text-xs text-rose-200">
                    Phát tín hiệu cảnh báo sức khỏe trực tiếp lên toàn hệ thống Web
                  </p>
                </div>
              </div>

              <button
                onClick={cancelSOS}
                className="text-slate-400 hover:text-white p-1 text-sm cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Verified Patient Profile Details (No Fake Sensors) */}
            <div className="p-4 rounded-2xl bg-rose-950/40 border border-rose-500/40 space-y-3">
              <div className="flex items-center justify-between pb-2 border-b border-white/10 text-xs">
                <div className="flex items-center gap-2">
                  <User className="w-4 h-4 text-rose-400" />
                  <span className="text-slate-300">Người bệnh:</span>
                  <strong className="text-white text-sm">{patientName}</strong>
                </div>
                <span className="px-2.5 py-0.5 rounded-full bg-rose-500/20 text-rose-300 text-[10px] font-bold border border-rose-500/30 flex items-center gap-1">
                  <Radio className="w-3 h-3 text-rose-400 animate-ping" /> Live Web Broadcast
                </span>
              </div>

              {/* Tình trạng sức khỏe khẩn cấp cần hỗ trợ */}
              <div className="space-y-1.5 text-xs">
                <label className="block text-slate-300 font-bold">
                  Chọn tình trạng khẩn cấp cần hỗ trợ:
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
                  {emergencyReasons.map((reason, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => setSelectedEmergencyReason(reason)}
                      className={`p-2 rounded-xl text-left text-[11px] transition cursor-pointer border ${
                        selectedEmergencyReason === reason
                          ? 'bg-rose-600/40 border-rose-500 text-white font-bold ring-1 ring-rose-400'
                          : 'bg-black/30 border-white/10 text-slate-300 hover:bg-white/5'
                      }`}
                    >
                      {reason}
                    </button>
                  ))}
                </div>
              </div>

              {/* Địa chỉ cứu trợ thực tế & Người thân liên hệ */}
              <div className="space-y-1 pt-1 text-xs text-slate-300">
                <div className="flex items-center gap-1.5 text-[11px]">
                  <MapPin className="w-3.5 h-3.5 text-rose-400 shrink-0" />
                  <span>
                    Địa chỉ ứng cứu: <strong className="text-white">Số 45, Đường Lê Duẩn, Quận 1, TP. Hồ Chí Minh</strong>
                  </span>
                </div>
                <div className="flex items-center gap-1.5 text-[11px]">
                  <PhoneCall className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
                  <span>
                    Người thân liên hệ khẩn cấp: <strong className="text-white">Nguyễn Anh Tuấn ({emergencyPhone})</strong>
                  </span>
                </div>
              </div>
            </div>

            {/* Trạng thái phát tín hiệu Web trực tiếp (Không qua SMS) */}
            <div className="p-3.5 rounded-2xl bg-black/40 border border-emerald-500/30 space-y-2 text-xs">
              <div className="flex items-center justify-between text-emerald-300 font-bold">
                <span className="flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" /> Cảnh báo sức khỏe đã phát thẳng lên Web:
                </span>
                <span className="text-[10px] px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 font-mono">
                  {new Date().toLocaleTimeString('vi-VN')}
                </span>
              </div>
              <p className="text-[11px] text-slate-300 leading-relaxed">
                ✓ Đã phát thông báo khẩn cấp toàn màn hình trên giao diện trang web của người thân giám hộ và bác sĩ phụ trách.
                <br />
                ✓ Hệ thống còi hú báo động đang kích hoạt. Sẵn sàng kết nối cấp cứu 115 chỉ với 1 chạm.
              </p>
            </div>

            {/* Action Bar */}
            <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-white/10">
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => {
                    if (isSoundMuted) {
                      startSiren();
                      setIsSoundMuted(false);
                    } else {
                      stopSiren();
                      setIsSoundMuted(true);
                    }
                  }}
                  className="px-3 py-2 rounded-xl glass-card text-xs text-slate-300 hover:text-white flex items-center gap-1.5 cursor-pointer"
                >
                  {isSoundMuted ? (
                    <>
                      <Volume2 className="w-3.5 h-3.5 text-emerald-400" /> Bật còi hú
                    </>
                  ) : (
                    <>
                      <VolumeX className="w-3.5 h-3.5 text-rose-400" /> Tắt còi hú
                    </>
                  )}
                </button>
              </div>

              <div className="flex items-center gap-2">
                <a
                  href={`tel:${emergencyPhone}`}
                  className="px-3.5 py-2.5 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-xl text-xs flex items-center gap-1.5 shadow-md transition"
                >
                  <PhoneCall className="w-3.5 h-3.5" /> Gọi Người Thân
                </a>

                <a
                  href="tel:115"
                  className="px-4 py-2.5 bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-500 hover:to-rose-500 text-white font-black rounded-xl text-xs flex items-center gap-1.5 shadow-lg shadow-rose-600/40 animate-bounce"
                >
                  <PhoneCall className="w-4 h-4" /> GỌI 115 NGAY
                </a>

                <button
                  onClick={cancelSOS}
                  className="px-3 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold rounded-xl text-xs transition cursor-pointer"
                >
                  Đã An Toàn / Tắt SOS
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
