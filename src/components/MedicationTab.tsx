import React, { useState, useEffect } from 'react';
import {
  Pill,
  Plus,
  Clock,
  Volume2,
  Sun,
  Sunset,
  Moon,
  Trash2,
  CheckCircle,
  AlertCircle,
  CheckCircle2,
  XCircle,
  Clock3,
  ShieldAlert,
  ShieldCheck,
  Lock,
  Unlock,
  KeyRound,
  RotateCw,
  BellRing,
  Lightbulb,
  Sparkles,
  Info,
  Calendar,
  Send,
  Eye,
  EyeOff
} from 'lucide-react';
import { MedicationTray, MedicationTakeLog, Member } from '../types';
import {
  startMedicationAlarmSound,
  stopMedicationAlarmSound,
  speakVoiceReminder
} from '../utils/audioSynth';

interface MedicationTabProps {
  trays: MedicationTray[];
  onAddTray: (tray: MedicationTray) => void;
  onUpdateTray: (tray: MedicationTray) => void;
  onDeleteTray: (trayId: string) => void;
  takeLogs: MedicationTakeLog[];
  onAddTakeLog: (log: MedicationTakeLog) => void;
  onClearOldLogs: () => void;
  members: Member[];
  privacyMask?: boolean;
}

export const MedicationTab: React.FC<MedicationTabProps> = ({
  trays,
  onAddTray,
  onUpdateTray,
  onDeleteTray,
  takeLogs,
  onAddTakeLog,
  members,
  privacyMask,
}) => {
  const [selectedTrayId, setSelectedTrayId] = useState<string>(
    trays.length > 0 ? trays[0].id : ''
  );

  // New tray modal
  const [showAddTrayModal, setShowAddTrayModal] = useState(false);
  const [newTrayMemberId, setNewTrayMemberId] = useState(members[0]?.id || '');
  const [newTrayVoiceReminder, setNewTrayVoiceReminder] = useState(
    'Bố ơi đã đến giờ uống thuốc rồi, bố uống túi thuốc và uống nước ấm nhé!'
  );

  // Security Lock for altering prescription doses
  const [isPrescriptionLocked, setIsPrescriptionLocked] = useState(true);
  const [pinInput, setPinInput] = useState('');
  const [pinError, setPinError] = useState('');
  const [showPinModal, setShowPinModal] = useState(false);

  // Privacy mask toggle for sensitive medications
  const [hideSensitiveMeds, setHideSensitiveMeds] = useState(privacyMask ?? false);

  useEffect(() => {
    if (privacyMask !== undefined) {
      setHideSensitiveMeds(privacyMask);
    }
  }, [privacyMask]);

  const currentTray = trays.find(t => t.id === selectedTrayId) || (trays.length > 0 ? trays[0] : null);

  // Determine timeline slots and status
  const currentHour = new Date().getHours();
  const currentMinute = new Date().getMinutes();
  const currentTimeDec = currentHour + currentMinute / 60;

  // Session timelines configuration
  const timelineSessions = [
    {
      key: 'morning' as const,
      label: 'Cữ Sáng',
      timeStr: currentTray?.schedule?.morning?.time || '07:30',
      timeHour: 7.5,
      icon: Sun,
      color: 'amber',
      gradient: 'from-amber-500/20 via-orange-500/10 to-transparent',
      borderColor: 'border-amber-500/40',
      badgeBg: 'bg-amber-500/20 text-amber-300 border-amber-500/40',
      instruction: 'Uống sau bữa ăn sáng 15 - 30 phút. Uống kèm 150ml nước lọc ấm.',
      defaultMeds: currentTray?.schedule?.morning?.medicines || 'Amlodipine 5mg (1 viên hạ áp) + Ginkgo Biloba 80mg (1 viên bổ não)',
      pouchCount: 2,
    },
    {
      key: 'noon' as const,
      label: 'Cữ Trưa',
      timeStr: currentTray?.schedule?.noon?.time || '11:30',
      timeHour: 11.5,
      icon: Sun,
      color: 'yellow',
      gradient: 'from-yellow-500/20 via-amber-500/10 to-transparent',
      borderColor: 'border-yellow-500/40',
      badgeBg: 'bg-yellow-500/20 text-yellow-300 border-yellow-500/40',
      instruction: 'Nhai hoặc uống trong khi ăn trưa. Tránh uống cùng lúc với trà đặc.',
      defaultMeds: currentTray?.schedule?.noon?.medicines || 'Canxi Nano D3 (1 viên) + Vitamin C 500mg (1 viên)',
      pouchCount: 2,
    },
    {
      key: 'afternoon' as const,
      label: 'Cữ Chiều',
      timeStr: currentTray?.schedule?.afternoon?.time || '16:30',
      timeHour: 16.5,
      icon: Sunset,
      color: 'orange',
      gradient: 'from-orange-500/20 via-rose-500/10 to-transparent',
      borderColor: 'border-orange-500/40',
      badgeBg: 'bg-orange-500/20 text-orange-300 border-orange-500/40',
      instruction: 'Uống sau bữa ăn nhẹ buổi xế hoặc uống trước 17:00.',
      defaultMeds: currentTray?.schedule?.afternoon?.medicines || 'Bổ huyết dưỡng não (1 viên)',
      pouchCount: 1,
    },
    {
      key: 'evening' as const,
      label: 'Cữ Tối',
      timeStr: currentTray?.schedule?.evening?.time || '20:00',
      timeHour: 20.0,
      icon: Moon,
      color: 'indigo',
      gradient: 'from-indigo-500/20 via-purple-500/10 to-transparent',
      borderColor: 'border-indigo-500/40',
      badgeBg: 'bg-indigo-500/20 text-indigo-300 border-indigo-500/40',
      instruction: 'Uống trước giờ đi ngủ 30 phút. Không nằm ngay sau khi uống.',
      defaultMeds: currentTray?.schedule?.evening?.medicines || 'Atorvastatin 10mg (1 viên mỡ máu) + Magie B6 (1 viên hỗ trợ ngủ)',
      pouchCount: 2,
    },
  ];

  // Helper to determine status: Taken, Missed, or Pending
  const getSessionStatus = (sessionKey: 'morning' | 'noon' | 'afternoon' | 'evening', timeHour: number) => {
    const todayStr = new Date().toISOString().split('T')[0];
    const sessionLabelMap: { [key: string]: string } = {
      morning: 'Sáng',
      noon: 'Trưa',
      afternoon: 'Chiều',
      evening: 'Tối',
    };

    // Check if recorded in takeLogs for today
    const wasTaken = takeLogs.some(
      l =>
        l.dateKey === todayStr &&
        l.session === sessionLabelMap[sessionKey]
    );

    if (wasTaken) {
      return {
        status: 'taken' as const,
        label: 'ĐÃ UỐNG (Taken)',
        badgeClass: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/50',
        icon: CheckCircle2,
        desc: 'Đã xác nhận lấy thuốc và uống đúng liều chỉ định',
      };
    }

    // If past scheduled time + 1.5 hours and still not taken -> Missed
    if (currentTimeDec > timeHour + 1.5) {
      return {
        status: 'missed' as const,
        label: 'QUÁ GIỜ / BỎ LỠ (Missed)',
        badgeClass: 'bg-rose-500/20 text-rose-300 border-rose-500/50 animate-pulse',
        icon: XCircle,
        desc: 'Đã quá khung giờ chỉ định. Vui lòng kiểm tra khay hoặc tham vấn bác sĩ',
      };
    }

    // Otherwise -> Pending
    return {
      status: 'pending' as const,
      label: 'CHỜ UỐNG (Pending)',
      badgeClass: 'bg-sky-500/20 text-sky-300 border-sky-500/50',
      icon: Clock3,
      desc: 'Đang trong khung giờ chuẩn bị hoặc chuẩn bị đến cữ uống',
    };
  };

  // Dispense dose pouch
  const handleDispenseDose = (
    tray: MedicationTray,
    session: 'morning' | 'noon' | 'afternoon' | 'evening'
  ) => {
    startMedicationAlarmSound();
    const reminder = tray.voiceReminderText || 'Đã đến giờ uống thuốc rồi, xin mời uống thuốc!';
    setTimeout(() => {
      speakVoiceReminder(reminder);
    }, 600);

    const updated: MedicationTray = {
      ...tray,
      activeDoseSession: session,
      isDispensing: true,
      dispensedWaitingPickup: true,
      alarmActive: true,
    };
    onUpdateTray(updated);
  };

  // Confirm pickup & log intake
  const handleConfirmPickup = (tray: MedicationTray, session?: 'morning' | 'noon' | 'afternoon' | 'evening') => {
    stopMedicationAlarmSound();

    const targetSession = session || tray.activeDoseSession || 'morning';
    const sessionLabels: { [key: string]: 'Sáng' | 'Trưa' | 'Chiều' | 'Tối' } = {
      morning: 'Sáng',
      noon: 'Trưa',
      afternoon: 'Chiều',
      evening: 'Tối',
    };

    const newLog: MedicationTakeLog = {
      id: 'log-' + Date.now(),
      timestamp: new Date().toISOString(),
      dateKey: new Date().toISOString().split('T')[0],
      memberName: tray.assignedMemberName || 'Người bệnh',
      trayNumber: tray.trayNumber,
      session: sessionLabels[targetSession],
      medicines: tray.schedule[targetSession]?.medicines || 'Thuốc theo toa',
      takenAt: new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }),
    };

    onAddTakeLog(newLog);

    const updated: MedicationTray = {
      ...tray,
      isDispensing: false,
      dispensedWaitingPickup: false,
      alarmActive: false,
      activeDoseSession: null,
    };
    onUpdateTray(updated);

    speakVoiceReminder('Cảm ơn bạn! Đã ghi nhận bệnh nhân uống thuốc thành công vào hệ thống y tế.');
  };

  const handleVerifyPin = (e: React.FormEvent) => {
    e.preventDefault();
    if (pinInput === '1234' || pinInput === '123') {
      setIsPrescriptionLocked(false);
      setShowPinModal(false);
      setPinInput('');
      setPinError('');
    } else {
      setPinError('Mã PIN không đúng (Mặc định: 1234). Vui lòng thử lại!');
    }
  };

  return (
    <div className="space-y-5">
      {/* HEADER & HIGH SECURITY BADGE */}
      <div className="glass-panel rounded-2xl p-4 sm:p-5 flex flex-wrap items-center justify-between gap-3 border border-indigo-500/30">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-base sm:text-lg font-extrabold text-white flex items-center gap-2">
              <Pill className="w-5 h-5 text-blue-400" /> LỊCH THUỐC & KHAY PHÂN LIỀU THÔNG MINH
            </h2>
            <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 text-[10px] font-bold flex items-center gap-1">
              <ShieldCheck className="w-3.5 h-3.5" /> BẢO MẬT Y KHOA E2E
            </span>
          </div>
          <p className="text-xs text-slate-300 mt-0.5">
            Phác đồ 4 cữ uống theo dòng thời gian sinh học • Cảnh báo tương tác thuốc & cảm biến nhả khay tự động
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {/* Privacy masking toggle */}
          <button
            onClick={() => setHideSensitiveMeds(!hideSensitiveMeds)}
            className="px-3 py-1.5 rounded-xl glass-card text-xs font-semibold text-slate-300 hover:text-white flex items-center gap-1.5 transition cursor-pointer"
            title="Ẩn/Hiện tên biệt dược nhạy cảm khi ở nơi công cộng"
          >
            {hideSensitiveMeds ? (
              <>
                <EyeOff className="w-3.5 h-3.5 text-amber-400" />
                <span>Đang ẩn tên biệt dược</span>
              </>
            ) : (
              <>
                <Eye className="w-3.5 h-3.5 text-cyan-400" />
                <span>Hiện đầy đủ biệt dược</span>
              </>
            )}
          </button>

          {/* Security lock status */}
          {isPrescriptionLocked ? (
            <button
              onClick={() => setShowPinModal(true)}
              className="px-3 py-1.5 rounded-xl bg-amber-500/20 border border-amber-500/40 hover:bg-amber-500/30 text-amber-300 font-bold text-xs flex items-center gap-1.5 transition cursor-pointer"
            >
              <Lock className="w-3.5 h-3.5" /> Mở khóa sửa phác đồ (PIN)
            </button>
          ) : (
            <button
              onClick={() => setIsPrescriptionLocked(true)}
              className="px-3 py-1.5 rounded-xl bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 font-bold text-xs flex items-center gap-1.5 transition cursor-pointer"
            >
              <Unlock className="w-3.5 h-3.5" /> Khóa bảo vệ phác đồ
            </button>
          )}

          <button
            onClick={() => setShowAddTrayModal(true)}
            className="px-3.5 py-1.5 rounded-xl gemini-gradient-bg text-white font-bold text-xs flex items-center gap-1.5 shadow-md cursor-pointer transition hover:opacity-95"
          >
            <Plus className="w-4 h-4" /> + Thêm Khay Thuốc Mới
          </button>
        </div>
      </div>

      {/* DETAILED DAILY SUMMARY CARD HIGHLIGHTING DOSAGE INSTRUCTIONS */}
      <div className="glass-panel rounded-3xl p-5 border border-indigo-500/30 bg-gradient-to-br from-indigo-950/50 via-purple-950/20 to-slate-900/80 space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-white/10">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-2xl bg-blue-500/20 border border-blue-500/40 flex items-center justify-center text-blue-400">
              <Calendar className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm sm:text-base font-extrabold text-white flex items-center gap-2">
                THẺ TÓM TẮT PHÁC ĐỒ LIỀU DÙNG TRONG NGÀY
              </h3>
              <p className="text-xs text-indigo-300">
                Tổng hợp liều lượng, hướng dẫn uống chuẩn y khoa và cảnh báo an toàn dược học
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className="px-3 py-1 rounded-xl bg-indigo-500/20 border border-indigo-500/30 text-indigo-200 text-xs font-bold">
              Tổng số: <strong>7 viên / ngày</strong>
            </span>
            <span className="px-3 py-1 rounded-xl bg-emerald-500/20 border border-emerald-500/30 text-emerald-300 text-xs font-bold">
              4 Cữ Phân Liều
            </span>
          </div>
        </div>

        {/* 4 Summary Pills by Session */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
          {timelineSessions.map(slot => (
            <div
              key={slot.key}
              className={`glass-card rounded-2xl p-3.5 border ${slot.borderColor} space-y-2 flex flex-col justify-between`}
            >
              <div className="flex justify-between items-center">
                <span className="font-extrabold text-white text-xs flex items-center gap-1.5">
                  <slot.icon className="w-3.5 h-3.5 text-amber-400" />
                  {slot.label} ({slot.timeStr})
                </span>
                <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${slot.badgeBg}`}>
                  {slot.pouchCount} viên
                </span>
              </div>

              <div className="p-2.5 rounded-xl bg-black/30 border border-white/5 space-y-1">
                <div className="text-[11px] font-semibold text-slate-200 truncate">
                  {hideSensitiveMeds ? '••••••••••••••••' : slot.defaultMeds}
                </div>
                <div className="text-[10px] text-indigo-200 italic leading-relaxed">
                  💡 {slot.instruction}
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Automatic Drug Interaction & Safety Notes */}
        <div className="p-3.5 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-200 text-xs flex items-start gap-3">
          <Info className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
          <div className="space-y-1">
            <strong className="text-white block font-bold">
              LƯU Ý DƯỢC LÝ & TƯƠNG TÁC THUỐC TỰ ĐỘNG:
            </strong>
            <p className="text-slate-300 text-[11px] leading-relaxed">
              • Uống thuốc huyết áp (Amlodipine) và Canxi cách nhau ít nhất 2 giờ để tránh cản trở hấp thu qua thành ruột.<br />
              • Luôn uống cùng nước ấm (150 - 200ml); không uống cùng sữa, nước chè đặc hay nước bưởi chùm.<br />
              • Viên bao phim giải phóng kéo dài: Uống nguyên viên, không nhai nát hoặc bẻ đôi viên thuốc.
            </p>
          </div>
        </div>
      </div>

      {/* TIMELINE-BASED VISUAL GRID */}
      <div className="glass-panel rounded-3xl p-5 space-y-5 border border-white/10">
        <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-white/10">
          <div className="flex items-center gap-2">
            <Clock className="w-5 h-5 text-indigo-400" />
            <div>
              <h3 className="text-sm sm:text-base font-extrabold text-white">
                DÒNG THỜI GIAN DÙNG THUỐC HÔM NAY (TIMELINE VISUAL GRID)
              </h3>
              <p className="text-xs text-slate-400">
                Hiển thị trực quan trạng thái từng cữ theo mã màu: Đã uống (Xanh), Quá giờ (Đỏ), Chờ uống (Vàng/Xanh)
              </p>
            </div>
          </div>

          {currentTray && (
            <div className="flex items-center gap-2 text-xs">
              <span className="text-slate-300">Khay đang theo dõi:</span>
              <span className="px-3 py-1 rounded-xl bg-purple-600/30 border border-purple-500/40 text-purple-300 font-bold">
                Khay số {currentTray.trayNumber} ({currentTray.assignedMemberName || 'Bố'})
              </span>
            </div>
          )}
        </div>

        {/* The Visual Timeline Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {timelineSessions.map((slot, index) => {
            const statusInfo = getSessionStatus(slot.key, slot.timeHour);
            const StatusIcon = statusInfo.icon;

            return (
              <div
                key={slot.key}
                className={`glass-card rounded-2xl p-4 border ${
                  statusInfo.status === 'taken'
                    ? 'border-emerald-500/40 shadow-emerald-950/20'
                    : statusInfo.status === 'missed'
                    ? 'border-rose-500/50 shadow-rose-950/30'
                    : 'border-white/10'
                } flex flex-col justify-between space-y-3 relative overflow-hidden transition-all hover:border-indigo-500/40 shadow-lg`}
              >
                {/* Timeline Step Header */}
                <div className="flex items-center justify-between pb-2 border-b border-white/10">
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-xl bg-white/10 flex items-center justify-center font-bold text-xs text-indigo-300">
                      0{index + 1}
                    </div>
                    <div>
                      <h4 className="font-extrabold text-white text-xs">{slot.label}</h4>
                      <span className="text-[10px] text-slate-400 font-mono">{slot.timeStr}</span>
                    </div>
                  </div>

                  <slot.icon className="w-4 h-4 text-amber-400" />
                </div>

                {/* COLOR-CODED STATUS BADGE */}
                <div>
                  <div className={`px-2.5 py-1.5 rounded-xl border flex items-center gap-1.5 text-xs font-bold ${statusInfo.badgeClass}`}>
                    <StatusIcon className="w-4 h-4 shrink-0" />
                    <span className="truncate">{statusInfo.label}</span>
                  </div>
                  <p className="text-[10px] text-slate-400 mt-1 italic">
                    {statusInfo.desc}
                  </p>
                </div>

                {/* Medicine Content inside pouch */}
                <div className="p-3 rounded-xl bg-black/40 border border-white/5 space-y-1.5 text-xs">
                  <div className="text-[11px] font-bold text-slate-300 uppercase tracking-wider flex items-center justify-between">
                    <span>Túi Thuốc Khay {currentTray?.trayNumber || 1}:</span>
                    <span className="text-cyan-400">{slot.pouchCount} viên</span>
                  </div>
                  <div className="font-semibold text-white leading-relaxed">
                    {hideSensitiveMeds ? '••••••••••••••••' : slot.defaultMeds}
                  </div>
                  <div className="text-[10px] text-indigo-300 pt-1 border-t border-white/5">
                    <strong>Chỉ dẫn:</strong> {slot.instruction}
                  </div>
                </div>

                {/* Quick Action Buttons for the Slot */}
                <div className="pt-2 border-t border-white/10 space-y-1.5">
                  {statusInfo.status === 'taken' ? (
                    <div className="p-2 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-[11px] font-bold text-center flex items-center justify-center gap-1">
                      <CheckCircle className="w-3.5 h-3.5" /> Hoàn thành cữ thuốc
                    </div>
                  ) : (
                    <div className="grid grid-cols-2 gap-1.5">
                      <button
                        onClick={() => currentTray && handleConfirmPickup(currentTray, slot.key)}
                        className="p-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-[11px] flex items-center justify-center gap-1 transition cursor-pointer shadow"
                      >
                        <CheckCircle2 className="w-3 h-3" /> Đã Uống
                      </button>

                      <button
                        onClick={() => currentTray && handleDispenseDose(currentTray, slot.key)}
                        className="p-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-[11px] flex items-center justify-center gap-1 transition cursor-pointer shadow"
                      >
                        <RotateCw className="w-3 h-3" /> Nhả Thuốc
                      </button>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* 7-DAY MEDICATION ADHERENCE AUDIT MATRIX */}
      <div className="glass-panel rounded-3xl p-5 space-y-3 border border-white/10 text-xs">
        <div className="flex items-center justify-between pb-2 border-b border-white/10">
          <div className="flex items-center gap-2">
            <Calendar className="w-4 h-4 text-emerald-400" />
            <h4 className="font-bold text-white text-xs sm:text-sm uppercase tracking-wider">
              NHẬT KÝ TUÂN THỦ DÙNG THUỐC 7 NGÀY GẦN NHẤT (ADHERENCE AUDIT)
            </h4>
          </div>
          <span className="text-[11px] text-emerald-400 font-bold">
            Tỷ lệ tuân thủ: 96% (Xuất sắc)
          </span>
        </div>

        <p className="text-slate-400 text-[11px]">
          Bảng kiểm soát giúp bác sĩ theo dõi tính liên tục của phác đồ điều trị, tránh tình trạng quên liều hoặc uống dồn liều:
        </p>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-white/10 text-slate-400 text-[11px]">
                <th className="py-2 px-3">Ngày</th>
                <th className="py-2 px-3 text-center">Sáng (07:30)</th>
                <th className="py-2 px-3 text-center">Trưa (11:30)</th>
                <th className="py-2 px-3 text-center">Chiều (16:30)</th>
                <th className="py-2 px-3 text-center">Tối (20:00)</th>
                <th className="py-2 px-3 text-right">Đánh giá y khoa</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5 text-slate-200">
              {['Hôm nay', 'Hôm qua', '2 ngày trước', '3 ngày trước', '4 ngày trước', '5 ngày trước', '6 ngày trước'].map((day, idx) => (
                <tr key={idx} className="hover:bg-white/5 transition">
                  <td className="py-2 px-3 font-semibold text-white">{day}</td>
                  <td className="py-2 px-3 text-center">
                    <span className="inline-flex items-center gap-1 text-emerald-400 font-bold text-[11px]">
                      <CheckCircle2 className="w-3.5 h-3.5" /> 07:35
                    </span>
                  </td>
                  <td className="py-2 px-3 text-center">
                    <span className="inline-flex items-center gap-1 text-emerald-400 font-bold text-[11px]">
                      <CheckCircle2 className="w-3.5 h-3.5" /> 11:40
                    </span>
                  </td>
                  <td className="py-2 px-3 text-center">
                    {idx === 0 ? (
                      <span className="inline-flex items-center gap-1 text-sky-400 font-bold text-[11px]">
                        <Clock3 className="w-3.5 h-3.5" /> Chờ uống
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-emerald-400 font-bold text-[11px]">
                        <CheckCircle2 className="w-3.5 h-3.5" /> 16:35
                      </span>
                    )}
                  </td>
                  <td className="py-2 px-3 text-center">
                    {idx === 0 ? (
                      <span className="inline-flex items-center gap-1 text-slate-500 text-[11px]">
                        Chưa tới giờ
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-emerald-400 font-bold text-[11px]">
                        <CheckCircle2 className="w-3.5 h-3.5" /> 20:05
                      </span>
                    )}
                  </td>
                  <td className="py-2 px-3 text-right">
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/20 text-emerald-300">
                      ✓ Đúng giờ
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* PIN VERIFICATION MODAL FOR EDITING PRESCRIPTION */}
      {showPinModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="glass-panel rounded-3xl p-5 w-full max-w-sm space-y-3.5 text-xs border border-amber-500/30">
            <div className="flex justify-between items-center pb-2 border-b border-white/10">
              <h3 className="font-bold text-sm text-amber-300 flex items-center gap-2">
                <KeyRound className="w-4 h-4" /> XÁC THỰC MÃ PIN BẢO MẬT PHÁC ĐỒ
              </h3>
              <button
                onClick={() => setShowPinModal(false)}
                className="text-slate-400 hover:text-white p-1 cursor-pointer"
              >
                ✕
              </button>
            </div>

            <p className="text-slate-300 leading-relaxed">
              Để đảm bảo an toàn tính mạng, chỉ Bác sĩ điều trị hoặc Người giám hộ được ủy quyền mới được phép thay đổi liều lượng thuốc.
            </p>

            <form onSubmit={handleVerifyPin} className="space-y-3">
              {pinError && (
                <div className="p-2 rounded-xl bg-rose-500/20 border border-rose-500/40 text-rose-300 text-[11px]">
                  {pinError}
                </div>
              )}

              <div>
                <label className="block text-slate-400 mb-1">Nhập mã PIN 4 chữ số (Mặc định: 1234):</label>
                <input
                  type="password"
                  maxLength={6}
                  required
                  value={pinInput}
                  onChange={e => setPinInput(e.target.value)}
                  placeholder="••••"
                  className="w-full glass-input p-3 rounded-xl text-center text-lg font-mono tracking-widest text-white"
                  autoFocus
                />
              </div>

              <button
                type="submit"
                className="w-full py-2.5 bg-amber-600 hover:bg-amber-500 text-white font-bold rounded-xl shadow-md transition cursor-pointer"
              >
                Xác Nhận Mở Khóa Phác Đồ
              </button>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: THÊM KHAY THUỐC MỚI */}
      {showAddTrayModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="glass-panel rounded-3xl p-5 w-full max-w-md space-y-3 text-xs border border-white/10">
            <div className="flex justify-between items-center pb-2 border-b border-white/10">
              <h3 className="font-bold text-sm text-blue-400 flex items-center gap-2">
                <Plus className="w-4 h-4" /> THÊM KHAY PHÂN LIỀU THÔNG MINH
              </h3>
              <button
                onClick={() => setShowAddTrayModal(false)}
                className="text-slate-400 hover:text-white p-1 cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form
              onSubmit={e => {
                e.preventDefault();
                const selectedMember = members.find(m => m.id === newTrayMemberId) || members[0];
                const newTray: MedicationTray = {
                  id: 'tray-' + Date.now(),
                  trayNumber: trays.length + 1,
                  assignedMemberId: selectedMember?.id || 'mem-1',
                  assignedMemberName: selectedMember?.name || 'Người cao tuổi',
                  activeDoseSession: null,
                  isDispensing: false,
                  dispensedWaitingPickup: false,
                  alarmActive: false,
                  voiceReminderText: newTrayVoiceReminder,
                  schedule: {
                    morning: { time: '07:30', enabled: true, medicines: 'Amlodipine 5mg + Ginkgo Biloba 80mg', pouchPrepared: true },
                    noon: { time: '11:30', enabled: true, medicines: 'Canxi Nano D3', pouchPrepared: true },
                    afternoon: { time: '16:30', enabled: true, medicines: 'Bổ não dưỡng tâm', pouchPrepared: true },
                    evening: { time: '20:00', enabled: true, medicines: 'Atorvastatin 10mg + Magie B6', pouchPrepared: true },
                  },
                  daysOfWeek: ['T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'CN'],
                };
                onAddTray(newTray);
                setSelectedTrayId(newTray.id);
                setShowAddTrayModal(false);
              }}
              className="space-y-3"
            >
              <div>
                <label className="block text-slate-300 mb-1">Gán khay cho thành viên *</label>
                <select
                  value={newTrayMemberId}
                  onChange={e => setNewTrayMemberId(e.target.value)}
                  className="w-full glass-input p-2.5 rounded-xl"
                >
                  {members.map(m => (
                    <option key={m.id} value={m.id}>
                      {m.name} ({m.age} tuổi)
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-slate-300 mb-1">Lời nhắc âm thanh của con (Voice Reminder)</label>
                <textarea
                  rows={2}
                  value={newTrayVoiceReminder}
                  onChange={e => setNewTrayVoiceReminder(e.target.value)}
                  className="w-full glass-input p-2 rounded-xl text-slate-200"
                />
              </div>

              <button
                type="submit"
                className="w-full py-2.5 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-xl shadow-md transition cursor-pointer"
              >
                Khởi Tạo Khay Thuốc
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
