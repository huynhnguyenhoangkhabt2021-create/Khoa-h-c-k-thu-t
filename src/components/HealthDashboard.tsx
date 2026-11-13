import React, { useState, useEffect, useRef } from 'react';
import {
  Wind,
  Thermometer,
  Droplets,
  Heart,
  Activity,
  Plus,
  Trash2,
  Watch,
  UserCheck,
  AlertTriangle,
  ShieldCheck,
  RefreshCw,
  X,
  Volume2,
  VolumeX,
  Mic,
  Send,
  Sparkles,
  CheckCircle2,
  Clock,
  HelpCircle,
  MessageSquare,
  Moon,
  Zap,
  Layers,
  Fan,
  Filter
} from 'lucide-react';
import { Member, AbnormalHealthLog, AirPollutionLog, MedicationTray, MedicationTakeLog } from '../types';

interface HealthDashboardProps {
  members: Member[];
  onAddMember: (member: Member) => void;
  abnormalLogs: AbnormalHealthLog[];
  onDeleteAbnormalLog: (id: string) => void;
  onClearAbnormalLogs: () => void;
  pollutionLogs: AirPollutionLog[];
  onDeletePollutionLog: (id: string) => void;
  onClearPollutionLogs: () => void;
  telemetry: {
    aqi: number;
    pm25: number;
    temp: number;
    humidity: number;
  };
  trays?: MedicationTray[];
  onAddTakeLog?: (log: MedicationTakeLog) => void;
}

export const HealthDashboard: React.FC<HealthDashboardProps> = ({
  members,
  onAddMember,
  abnormalLogs,
  onDeleteAbnormalLog,
  onClearAbnormalLogs,
  pollutionLogs,
  onDeletePollutionLog,
  onClearPollutionLogs,
  telemetry,
  trays = [],
  onAddTakeLog,
}) => {
  // Currently active wearer for the right 2/3 view
  const [selectedWearerId, setSelectedWearerId] = useState<string>(
    members.length > 0 ? members[0].id : ''
  );

  // If members changed and current wearer is not valid, reset
  useEffect(() => {
    if (!members.find(m => m.id === selectedWearerId) && members.length > 0) {
      setSelectedWearerId(members[0].id);
    }
  }, [members, selectedWearerId]);

  // Modal to connect a new person with smart wristband
  const [showPairingModal, setShowPairingModal] = useState(false);
  const [pairingName, setPairingName] = useState('');
  const [pairingAge, setPairingAge] = useState<number>(68);
  const [pairingGender, setPairingGender] = useState<'Nam' | 'Nữ'>('Nam');
  const [pairingBandId, setPairingBandId] = useState('BLE-BAND-0' + (members.length + 1));
  const [isPairingScanning, setIsPairingScanning] = useState(false);

  // Real-time jitter for the selected wearer's live wristband telemetry
  const [liveBPM, setLiveBPM] = useState(76);
  const [liveSpO2, setLiveSpO2] = useState(98);
  const [liveBodyTemp, setLiveBodyTemp] = useState(36.6);

  const currentMember = members.find(m => m.id === selectedWearerId) || (members.length > 0 ? members[0] : null);

  useEffect(() => {
    const timer = setInterval(() => {
      // Natural biometric micro-fluctuations
      setLiveBPM(prev => {
        const delta = Math.floor(Math.random() * 3) - 1;
        const base = currentMember?.restBPM || 75;
        return Math.max(65, Math.min(88, base + delta));
      });
      setLiveSpO2(prev => {
        const base = currentMember?.avgSpO2 || 98;
        const delta = Math.random() > 0.8 ? (Math.random() > 0.5 ? 1 : -1) : 0;
        return Math.max(95, Math.min(100, base + delta));
      });
      setLiveBodyTemp(prev => {
        const base = currentMember?.bodyTemp || 36.6;
        const delta = (Math.random() - 0.5) * 0.1;
        return Math.round((base + delta) * 10) / 10;
      });
    }, 1500);

    return () => clearInterval(timer);
  }, [currentMember]);

  // 3-Stage Air Purifier States
  const [purifierMode, setPurifierMode] = useState<'auto' | 'manual'>('auto');
  const [manualPurifierLevel, setManualPurifierLevel] = useState<'low' | 'medium' | 'high'>('low');
  const [purifierScenario, setPurifierScenario] = useState<string | null>(null);

  // Effective operating level based on mode & PM2.5 or scenario
  const effectivePurifierLevel: 'low' | 'medium' | 'high' = (() => {
    if (purifierMode === 'manual') return manualPurifierLevel;
    if (purifierScenario === 'smoke' || purifierScenario === 'cleaning') return 'high';
    if (purifierScenario === 'activity') return 'medium';
    if (purifierScenario === 'sleep') return 'low';
    if (telemetry.pm25 < 25) return 'low';
    if (telemetry.pm25 <= 50) return 'medium';
    return 'high';
  })();

  // Canvas for ECG Waveform
  const ecgCanvasRef = useRef<HTMLCanvasElement | null>(null);
  useEffect(() => {
    const canvas = ecgCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let sweep = 0;
    let animId: number;

    const render = () => {
      const w = canvas.width;
      const h = canvas.height;
      const mid = h / 2;

      ctx.clearRect(0, 0, w, h);

      // Grid background
      ctx.strokeStyle = 'rgba(16, 185, 129, 0.08)';
      ctx.lineWidth = 1;
      for (let x = 0; x < w; x += 25) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, h);
        ctx.stroke();
      }

      // Dynamic ECG pulse line
      ctx.strokeStyle = '#10B981';
      ctx.lineWidth = 2;
      ctx.beginPath();

      for (let i = 0; i <= 100; i++) {
        const px = (i / 100) * w;
        const rel = ((px + sweep * 40) / 75) % 1;
        let py = mid;
        if (rel > 0.18 && rel < 0.22) py = mid - 4;
        else if (rel >= 0.22 && rel < 0.25) py = mid + 6;
        else if (rel >= 0.25 && rel < 0.28) py = mid - 26; // R peak
        else if (rel >= 0.28 && rel < 0.32) py = mid + 9;
        else if (rel >= 0.4 && rel < 0.5) py = mid - 8;

        if (i === 0) ctx.moveTo(px, py);
        else ctx.lineTo(px, py);
      }
      ctx.stroke();

      sweep = (sweep + 0.009) % 1;
      animId = requestAnimationFrame(render);
    };

    render();
    return () => cancelAnimationFrame(animId);
  }, []);

  // ==========================================
  // CHILD VOICE & DIRECT AI PATIENT INTERACTION
  // ==========================================
  const [selectedVoiceType, setSelectedVoiceType] = useState<'daughter' | 'son' | 'grandchild' | 'aiDoctor'>('daughter');
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);
  const [speechStatusText, setSpeechStatusText] = useState('');
  const [patientQuestion, setPatientQuestion] = useState('');
  const [dialogueLog, setDialogueLog] = useState<Array<{ sender: 'patient' | 'ai' | 'child'; text: string; time: string }>>([
    {
      sender: 'child',
      text: 'Bố ơi! Đến giờ uống thuốc buổi sáng rồi ạ. Con để sẵn thuốc huyết áp và bổ não trong khay rồi, bố uống cùng nước ấm nhé!',
      time: '08:00',
    },
  ]);

  const wearerName = currentMember ? currentMember.name : 'Bố';

  const voicePresets = {
    daughter: {
      label: 'Giọng con gái ân cần',
      role: 'child' as const,
      pitch: 1.2,
      rate: 0.95,
      message: `${wearerName} ơi, đến giờ uống thuốc rồi ạ. ${wearerName} nhớ uống túi thuốc đúng cữ và uống một ly nước ấm nha, con yêu ${wearerName} nhiều!`,
    },
    son: {
      label: 'Giọng con trai ấm áp',
      role: 'child' as const,
      pitch: 0.9,
      rate: 0.9,
      message: `${wearerName} ơi, con nhắc ${wearerName} uống thuốc đúng giờ nè. Thuốc con đã chia sẵn vào khay tự động rồi, ${wearerName} uống xong nghỉ ngơi nhé!`,
    },
    grandchild: {
      label: 'Giọng cháu ngoan dễ thương',
      role: 'child' as const,
      pitch: 1.4,
      rate: 1.0,
      message: `Ông bà ơi, cháu nhắc ông bà uống thuốc nè! Ông bà nhớ uống thuốc đầy đủ để luôn khỏe mạnh dắt cháu đi chơi công viên nhé!`,
    },
    aiDoctor: {
      label: 'Giọng AI Bác sĩ y khoa',
      role: 'ai' as const,
      pitch: 1.0,
      rate: 0.95,
      message: `Chào ${wearerName}, đây là hệ thống Smart Healthcare: Đã đến giờ uống thuốc theo phác đồ y tế. Vui lòng kiểm tra khay thuốc thông minh và uống cùng nước lọc đun sôi để nguội.`,
    },
  };

  const speakText = (text: string, onEnd?: () => void) => {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = 'vi-VN';
      utterance.rate = voicePresets[selectedVoiceType].rate;
      utterance.pitch = voicePresets[selectedVoiceType].pitch;

      setIsPlayingAudio(true);
      utterance.onend = () => {
        setIsPlayingAudio(false);
        if (onEnd) onEnd();
      };
      utterance.onerror = () => {
        setIsPlayingAudio(false);
      };
      window.speechSynthesis.speak(utterance);
    } else {
      setIsPlayingAudio(true);
      setTimeout(() => {
        setIsPlayingAudio(false);
        if (onEnd) onEnd();
      }, 3000);
    }
  };

  const handleStopAudio = () => {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }
    setIsPlayingAudio(false);
    setSpeechStatusText('');
  };

  const handlePlayReminder = () => {
    const text = voicePresets[selectedVoiceType].message;
    setSpeechStatusText(`Đang phát lời nhắc "${voicePresets[selectedVoiceType].label}" cho ${wearerName}...`);
    speakText(text, () => {
      setSpeechStatusText(`Đã phát xong lời nhắc qua loa ESP32!`);
    });
  };

  // Direct patient action: "Bố/mẹ đã uống rồi"
  const handlePatientTookMedication = () => {
    const timeNow = new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });
    const replyText = `Dạ con mừng quá! Con đã ghi nhận ${wearerName} đã uống thuốc thành công rồi ạ. ${wearerName} nhớ uống thêm chút nước ấm và ngồi nghỉ ngơi thư thái nhé!`;

    setDialogueLog(prev => [
      ...prev,
      {
        sender: 'patient',
        text: `${wearerName} đã uống thuốc xong rồi con nhé.`,
        time: timeNow,
      },
      {
        sender: 'child',
        text: replyText,
        time: timeNow,
      },
    ]);

    setSpeechStatusText(`Bệnh nhân xác nhận đã uống thuốc ✓`);

    if (onAddTakeLog && currentMember) {
      onAddTakeLog({
        id: 'take-dash-' + Date.now(),
        timestamp: new Date().toISOString(),
        dateKey: new Date().toISOString().split('T')[0],
        memberName: currentMember.name,
        trayNumber: 1,
        session: 'Sáng',
        medicines: 'Đã hoàn thành liều chỉ định trong khay',
        takenAt: timeNow,
      });
    }

    speakText(replyText);
  };

  // Direct patient action: "Nhắc lại sau 5 phút"
  const handleSnoozeReminder = () => {
    const timeNow = new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });
    const replyText = `Dạ vâng ạ! Con sẽ báo chuông và nhắc lại sau 5 phút nữa để ${wearerName} chuẩn bị nước ấm nha.`;

    setDialogueLog(prev => [
      ...prev,
      {
        sender: 'patient',
        text: 'Nhắc lại cho tôi sau 5 phút nữa.',
        time: timeNow,
      },
      {
        sender: 'child',
        text: replyText,
        time: timeNow,
      },
    ]);

    setSpeechStatusText(`Đã hẹn giờ nhắc lại sau 5 phút`);
    speakText(replyText);
  };

  // Direct patient action: "Hỏi AI liều lượng & hướng dẫn"
  const handleAskMedInstruction = () => {
    const timeNow = new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });
    const aiResponse = `Dạ thưa ${wearerName}, túi thuốc cữ này nên uống sau bữa ăn 15 đến 30 phút. Uống nguyên viên với 150ml nước lọc ấm, không nhai nát viên bao phim và không uống chung với sữa hay trà đặc ạ.`;

    setDialogueLog(prev => [
      ...prev,
      {
        sender: 'patient',
        text: 'Thuốc này uống trước hay sau ăn? Cần lưu ý gì không?',
        time: timeNow,
      },
      {
        sender: 'ai',
        text: aiResponse,
        time: timeNow,
      },
    ]);

    speakText(aiResponse);
  };

  // Custom question interaction directly with AI
  const handleSendPatientQuestion = (presetText?: string) => {
    const q = (presetText || patientQuestion).trim();
    if (!q) return;

    const timeNow = new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });
    let reply = '';

    if (q.toLowerCase().includes('huyết áp') || q.toLowerCase().includes('tim')) {
      reply = `Dạ thuốc huyết áp nên được uống cố định vào cùng một khung giờ mỗi sáng sau khi ăn nhẹ. Nếu thấy huyết áp dưới 100/60 hoặc hoa mắt, ${wearerName} hãy ngồi nghỉ và báo người nhà nhé!`;
    } else if (q.toLowerCase().includes('quên') || q.toLowerCase().includes('lỡ')) {
      reply = `Dạ nếu ${wearerName} lỡ quên cữ thuốc, hãy uống ngay khi nhớ ra nếu thời gian cách cữ tiếp theo trên 4 tiếng. Tuyệt đối không uống gấp đôi liều cùng một lúc ạ!`;
    } else if (q.toLowerCase().includes('nằm') || q.toLowerCase().includes('ngủ')) {
      reply = `Dạ sau khi uống thuốc ${wearerName} nên ngồi thẳng hoặc đi lại nhẹ nhàng khoảng 15-20 phút, không nên nằm ngay để tránh thuốc bị trào ngược dạ dày thực quản ạ.`;
    } else {
      reply = `Dạ AI Smart Healthcare đã ghi nhận câu hỏi của ${wearerName}: "${q}". Lời khuyên là ${wearerName} hãy uống thuốc đúng cữ với nước lọc ấm, ăn uống thanh đạm ít muối và giữ tinh thần luôn vui vẻ, thoải mái ạ!`;
    }

    setDialogueLog(prev => [
      ...prev,
      { sender: 'patient', text: q, time: timeNow },
      { sender: 'ai', text: reply, time: timeNow },
    ]);

    setPatientQuestion('');
    speakText(reply);
  };

  const handlePairNewMember = (e: React.FormEvent) => {
    e.preventDefault();
    if (!pairingName.trim()) return;

    setIsPairingScanning(true);
    setTimeout(() => {
      const newMember: Member = {
        id: 'mem-' + Date.now(),
        name: pairingName.trim(),
        age: pairingAge,
        gender: pairingGender,
        height: 165,
        weight: 60,
        bloodType: 'O',
        conditions: 'Theo dõi thường xuyên',
        allergies: 'Chưa ghi nhận',
        emergencyContact: '0988 123 456',
        wristbandId: pairingBandId,
        avgSpO2: 98,
        restBPM: 74,
        bodyTemp: 36.6,
        isCurrentWearer: true,
        logs: [
          {
            id: 'l-init-' + Date.now(),
            time: new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }),
            type: 'Kết nối thiết bị',
            note: `Đã liên kết vòng tay thông minh ${pairingBandId}`,
          },
        ],
      };

      onAddMember(newMember);
      setSelectedWearerId(newMember.id);
      setIsPairingScanning(false);
      setShowPairingModal(false);
      setPairingName('');
    }, 1200);
  };

  const getAqiCategory = (aqi: number) => {
    if (aqi <= 50) return { label: 'Tốt (Trong lành)', color: 'text-emerald-400', bg: 'bg-emerald-500/20' };
    if (aqi <= 100) return { label: 'Trung bình', color: 'text-yellow-400', bg: 'bg-yellow-500/20' };
    if (aqi <= 150) return { label: 'Kém cho người nhạy cảm', color: 'text-amber-400', bg: 'bg-amber-500/20' };
    return { label: 'Ô nhiễm cảnh báo', color: 'text-rose-400', bg: 'bg-rose-500/20' };
  };

  const aqiInfo = getAqiCategory(telemetry.aqi);

  return (
    <div className="space-y-4">
      {/* SECTION 1: TOP 1/3 (ENVIRONMENT) AND 2/3 (INDIVIDUAL WEARER) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* 1/3 LEFT: CÁC THÔNG SỐ MÔI TRƯỜNG (AQI, DHT22, ĐỘ ẨM) */}
        <div className="glass-panel rounded-2xl p-4 flex flex-col justify-between space-y-3">
          <div className="flex items-center justify-between pb-2 border-b border-white/10">
            <h3 className="text-xs font-bold uppercase tracking-wider text-cyan-400 flex items-center gap-1.5">
              <Wind className="w-4 h-4 text-cyan-400" /> THÔNG SỐ MÔI TRƯỜNG PHÒNG
            </h3>
            <span className="text-[10px] px-2 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300 font-bold">
              1/3 Hệ Thống
            </span>
          </div>

          <div className="space-y-3 flex-1 flex flex-col justify-around">
            {/* 1. AQI */}
            <div className="glass-card rounded-xl p-3.5 flex justify-between items-center border border-white/5">
              <div>
                <div className="text-[11px] font-semibold text-slate-400 uppercase">Chất lượng không khí (AQI)</div>
                <div className="flex items-baseline gap-2 my-1">
                  <span className={`text-3xl font-extrabold ${aqiInfo.color}`}>{telemetry.aqi}</span>
                  <span className="text-xs text-slate-400">AQI (EPA)</span>
                </div>
                <div className="text-[11px] text-slate-300">
                  Bụi mịn PM2.5: <strong className="text-white">{telemetry.pm25}</strong> µg/m³
                </div>
              </div>
              <span className={`px-2.5 py-1 rounded-lg text-xs font-bold ${aqiInfo.bg} ${aqiInfo.color}`}>
                {aqiInfo.label}
              </span>
            </div>

            {/* 2. DHT22 Nhiệt độ phòng */}
            <div className="glass-card rounded-xl p-3.5 flex justify-between items-center border border-white/5">
              <div>
                <div className="text-[11px] font-semibold text-slate-400 uppercase">Nhiệt độ phòng (DHT22)</div>
                <div className="flex items-baseline gap-2 my-1">
                  <span className="text-3xl font-extrabold text-amber-400">{telemetry.temp}</span>
                  <span className="text-xs text-slate-400">°C</span>
                </div>
                <div className="text-[11px] text-slate-300">Cảm nhận sinh học: Dễ chịu cho người cao tuổi</div>
              </div>
              <div className="w-10 h-10 rounded-xl bg-amber-500/15 flex items-center justify-center text-amber-400">
                <Thermometer className="w-5 h-5" />
              </div>
            </div>

            {/* 3. Độ ẩm không khí */}
            <div className="glass-card rounded-xl p-3.5 flex justify-between items-center border border-white/5">
              <div>
                <div className="text-[11px] font-semibold text-slate-400 uppercase">Độ ẩm không khí</div>
                <div className="flex items-baseline gap-2 my-1">
                  <span className="text-3xl font-extrabold text-sky-400">{telemetry.humidity}</span>
                  <span className="text-xs text-slate-400">% RH</span>
                </div>
                <div className="text-[11px] text-slate-300">Ngưỡng chuẩn y khoa: 45% - 70%</div>
              </div>
              <div className="w-10 h-10 rounded-xl bg-sky-500/15 flex items-center justify-center text-sky-400">
                <Droplets className="w-5 h-5" />
              </div>
            </div>
          </div>
        </div>

        {/* 2/3 RIGHT: THÔNG SỐ VÒNG TAY CỦA TỪNG NGƯỜI (Thân nhiệt, Nhịp tim, SpO2) */}
        <div className="lg:col-span-2 glass-panel rounded-2xl p-4 flex flex-col justify-between space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-2 pb-2 border-b border-white/10">
            <div className="flex items-center gap-2">
              <Watch className="w-4 h-4 text-purple-400" />
              <h3 className="text-xs font-bold uppercase tracking-wider text-purple-300">
                SINH HIỆU THỜI GIAN THỰC TỪNG NGƯỜI (2/3 HỆ THỐNG)
              </h3>
            </div>

            {/* Wearer Selector & Add Button */}
            <div className="flex items-center gap-2 flex-wrap">
              {members.length > 0 && (
                <div className="flex items-center gap-1 overflow-x-auto max-w-[280px] scrollbar-none">
                  {members.map(m => (
                    <button
                      key={m.id}
                      onClick={() => setSelectedWearerId(m.id)}
                      className={`px-3 py-1 rounded-xl text-xs font-bold transition flex items-center gap-1.5 shrink-0 cursor-pointer ${
                        m.id === selectedWearerId
                          ? 'bg-purple-600 text-white shadow-md'
                          : 'glass-card text-slate-300 hover:text-white'
                      }`}
                    >
                      <UserCheck className="w-3 h-3" />
                      <span>{m.name}</span>
                    </button>
                  ))}
                </div>
              )}

              <button
                onClick={() => setShowPairingModal(true)}
                className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center gap-1.5 shadow-md transition cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" /> + Thêm người theo dõi
              </button>
            </div>
          </div>

          {currentMember ? (
            <div className="space-y-3 flex-1 flex flex-col justify-between">
              {/* Wearer Header Tag */}
              <div className="flex items-center justify-between p-2 rounded-xl bg-purple-950/30 border border-purple-500/20 text-xs">
                <span className="text-slate-300">
                  Đang theo dõi trực tiếp qua vòng tay:{' '}
                  <strong className="text-white text-sm">{currentMember.name}</strong> ({currentMember.age} tuổi)
                </span>
                <span className="px-2 py-0.5 rounded-md bg-emerald-500/20 text-emerald-400 font-mono text-[11px] flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
                  {currentMember.wristbandId || 'BLE-BAND-SYNC'}
                </span>
              </div>

              {/* 3 Primary Vital Metrics of the Person */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {/* 1. Thân nhiệt vòng tay */}
                <div className="glass-card rounded-2xl p-4 flex flex-col justify-between border border-purple-500/20">
                  <div className="flex justify-between items-center text-xs text-slate-400 font-bold uppercase">
                    <span>Thân nhiệt vòng tay</span>
                    <Thermometer className="w-4 h-4 text-purple-400" />
                  </div>
                  <div className="my-2">
                    <span className="text-3xl font-extrabold text-purple-400">{liveBodyTemp}</span>
                    <span className="text-xs text-slate-400 ml-1">°C (BLE)</span>
                  </div>
                  <div className="flex justify-between items-center text-xs pt-1 border-t border-white/5">
                    <span className="text-slate-300">Trạng thái:</span>
                    <span
                      className={`px-2 py-0.5 rounded-md text-[10px] font-bold ${
                        liveBodyTemp > 37.5
                          ? 'bg-rose-500/20 text-rose-400'
                          : 'bg-purple-500/20 text-purple-400'
                      }`}
                    >
                      {liveBodyTemp > 37.5 ? 'Sốt nhẹ' : 'Thân nhiệt chuẩn'}
                    </span>
                  </div>
                </div>

                {/* 2. Nhịp tim */}
                <div className="glass-card rounded-2xl p-4 flex flex-col justify-between border border-rose-500/20">
                  <div className="flex justify-between items-center text-xs text-slate-400 font-bold uppercase">
                    <span>Nhịp tim</span>
                    <Heart className="w-4 h-4 text-rose-500 animate-pulse" />
                  </div>
                  <div className="my-2">
                    <span className="text-3xl font-extrabold text-rose-500">{liveBPM}</span>
                    <span className="text-xs text-slate-400 ml-1">BPM (PPG)</span>
                  </div>
                  <div className="flex justify-between items-center text-xs pt-1 border-t border-white/5">
                    <span className="text-slate-300">Chuẩn nghỉ ngơi:</span>
                    <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-rose-500/20 text-rose-400">
                      60-100 OK
                    </span>
                  </div>
                </div>

                {/* 3. Nồng độ Oxy trong máu (SpO2) */}
                <div className="glass-card rounded-2xl p-4 flex flex-col justify-between border border-cyan-500/20">
                  <div className="flex justify-between items-center text-xs text-slate-400 font-bold uppercase">
                    <span>Nồng độ Oxy (SpO2)</span>
                    <Activity className="w-4 h-4 text-cyan-400" />
                  </div>
                  <div className="my-2">
                    <span className="text-3xl font-extrabold text-cyan-400">{liveSpO2}</span>
                    <span className="text-xs text-slate-400 ml-1">% Oximeter</span>
                  </div>
                  <div className="flex justify-between items-center text-xs pt-1 border-t border-white/5">
                    <span className="text-slate-300">Đánh giá y tế:</span>
                    <span
                      className={`px-2 py-0.5 rounded-md text-[10px] font-bold ${
                        liveSpO2 < 94 ? 'bg-rose-500/20 text-rose-400' : 'bg-cyan-500/20 text-cyan-400'
                      }`}
                    >
                      {liveSpO2 < 94 ? 'Cần chú ý' : 'Rất tốt'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Dynamic PPG/ECG Waveform Monitor */}
              <div className="p-3 rounded-xl bg-slate-950/90 border border-emerald-500/30">
                <div className="flex justify-between items-center text-[10px] mb-1">
                  <span className="text-emerald-400 font-bold uppercase tracking-wider flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                    SÓNG XUNG TIM ĐỘNG PPG (MAX30102 SENSOR)
                  </span>
                  <span className="text-emerald-300 font-mono">
                    ĐỒNG BỘ: {currentMember.name} • {liveBPM} BPM
                  </span>
                </div>
                <canvas ref={ecgCanvasRef} width={600} height={55} className="w-full h-12 block rounded-lg" />
              </div>
            </div>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center p-8 text-center space-y-3 glass-card rounded-2xl border border-dashed border-white/10">
              <Watch className="w-12 h-12 text-slate-500 animate-bounce" />
              <div className="text-sm font-bold text-slate-300">Chưa có người đeo nào được kết nối</div>
              <p className="text-xs text-slate-400 max-w-sm">
                Hãy nhấn nút <strong>"+ Thêm người theo dõi"</strong> để kết nối vòng tay thông minh và đo các chỉ số
                thân nhiệt, nhịp tim và nồng độ oxy máu SpO2 tức thời.
              </p>
              <button
                onClick={() => setShowPairingModal(true)}
                className="px-4 py-2 bg-purple-600 hover:bg-purple-500 text-white rounded-xl text-xs font-bold transition shadow-lg"
              >
                + Kết Nối Vòng Tay Mới
              </button>
            </div>
          )}
        </div>
      </div>

      {/* ======================================================== */}
      {/* SECTION 2: ÂM THANH NHẮC NHỞ CỦA CON & TƯƠNG TÁC AI TRỰC TIẾP VỚI NGƯỜI BỆNH */}
      {/* ======================================================== */}
      <div className="glass-panel rounded-2xl p-4 md:p-5 space-y-4 border border-indigo-500/30 bg-gradient-to-br from-indigo-950/40 via-purple-950/20 to-slate-900/60">
        <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-white/10">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-indigo-500/20 border border-indigo-500/40 flex items-center justify-center text-indigo-400">
              <Volume2 className="w-5 h-5 animate-pulse" />
            </div>
            <div>
              <h3 className="text-sm sm:text-base font-extrabold text-white flex items-center gap-2">
                ÂM THANH NHẮC NHỞ UỐNG THUỐC CỦA NGƯỜI CON & TƯƠNG TÁC AI TRỰC TIẾP
              </h3>
              <p className="text-xs text-indigo-300">
                Phát thanh giọng nói người thân qua loa thiết bị • Người bệnh có thể trả lời, xác nhận đã uống hoặc hỏi đáp trực tiếp với AI
              </p>
            </div>
          </div>

          {/* Audio Visualizer / Status */}
          <div className="flex items-center gap-3">
            {isPlayingAudio && (
              <div className="flex items-center gap-1 px-3 py-1.5 rounded-full bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 text-xs font-bold">
                <span className="flex gap-0.5 items-end h-4">
                  <span className="w-1 bg-emerald-400 animate-pulse h-2" />
                  <span className="w-1 bg-emerald-400 animate-pulse h-4" />
                  <span className="w-1 bg-emerald-400 animate-pulse h-3" />
                  <span className="w-1 bg-emerald-400 animate-pulse h-4" />
                </span>
                <span>Đang phát giọng nói...</span>
              </div>
            )}

            {isPlayingAudio ? (
              <button
                onClick={handleStopAudio}
                className="px-3 py-1.5 rounded-xl bg-rose-600/80 hover:bg-rose-500 text-white font-bold text-xs flex items-center gap-1.5 cursor-pointer shadow-md"
              >
                <VolumeX className="w-3.5 h-3.5" /> Dừng âm thanh
              </button>
            ) : (
              <button
                onClick={handlePlayReminder}
                className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs flex items-center gap-2 cursor-pointer shadow-md transition hover:scale-102"
              >
                <Volume2 className="w-4 h-4" /> Phát Lời Nhắc Của Con
              </button>
            )}
          </div>
        </div>

        {/* LỜI NHẮC ÂM THANH TINH GỌN CỦA NGƯỜI CON */}
        <div className="glass-card rounded-2xl p-4 border border-indigo-500/20 space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <span className="text-xs font-bold text-indigo-300 flex items-center gap-1.5">
              <Sparkles className="w-4 h-4 text-indigo-400" /> Lời Nhắc Âm Thanh Của Người Con
            </span>
            <span className="text-[11px] text-slate-400">Dành cho: <strong className="text-white">{wearerName}</strong></span>
          </div>

          <div className="p-3.5 rounded-xl bg-black/40 border border-indigo-500/30 text-xs sm:text-sm text-indigo-100 italic leading-relaxed flex items-start gap-2.5">
            <span className="text-xl shrink-0 mt-0.5">❤️</span>
            <p className="flex-1">
              "Bố ơi! Đến giờ uống thuốc rồi ạ. Bố nhớ uống túi thuốc đúng cữ và uống một ly nước ấm nhé, con yêu bố nhiều!"
            </p>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-2 pt-1 text-xs">
            <span className="text-slate-400 text-[11px]">
              {speechStatusText || 'Âm thanh tự động phát qua loa thiết bị khi đến giờ cữ thuốc'}
            </span>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handlePlayReminder}
                disabled={isPlayingAudio}
                className="px-3.5 py-1.5 rounded-xl bg-indigo-600/30 hover:bg-indigo-600 border border-indigo-500/40 text-indigo-200 text-xs font-bold transition flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
              >
                <Volume2 className="w-3.5 h-3.5" /> Thử Nghe Giọng Nhắc
              </button>
            </div>
          </div>
        </div>

        {/* 3. TƯƠNG TÁC TRỰC TIẾP CỦA NGƯỜI BỆNH VỚI HỆ THỐNG */}
        <div className="space-y-3 pt-2 border-t border-white/10">
          <div className="flex items-center justify-between">
            <h4 className="text-xs font-bold uppercase tracking-wider text-emerald-400 flex items-center gap-2">
              <UserCheck className="w-4 h-4 text-emerald-400" /> TƯƠNG TÁC TRỰC TIẾP CỦA NGƯỜI BỆNH (BẤM NÚT HOẶC TRẢ LỜI BẰNG GIỌNG NÓI)
            </h4>
            <span className="text-[10px] text-slate-400">Hỗ trợ phản hồi bằng giọng nói tự nhiên</span>
          </div>

          {/* Big Friendly Quick Action Buttons for Elderly Patients */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
            {/* Action 1: Đã uống rồi */}
            <button
              onClick={handlePatientTookMedication}
              className="p-3 rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white shadow-lg transition flex items-center justify-center gap-2.5 cursor-pointer text-left group"
            >
              <div className="w-9 h-9 rounded-xl bg-white/20 flex items-center justify-center shrink-0">
                <CheckCircle2 className="w-5 h-5 text-white" />
              </div>
              <div>
                <div className="text-xs font-extrabold">{wearerName} ĐÃ UỐNG THUỐC RỒI</div>
                <div className="text-[10px] text-emerald-100">Báo con & ghi nhận vào lịch sử</div>
              </div>
            </button>

            {/* Action 2: Nhắc lại sau 5 phút */}
            <button
              onClick={handleSnoozeReminder}
              className="p-3 rounded-2xl bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-500 hover:to-orange-500 text-white shadow-lg transition flex items-center justify-center gap-2.5 cursor-pointer text-left group"
            >
              <div className="w-9 h-9 rounded-xl bg-white/20 flex items-center justify-center shrink-0">
                <Clock className="w-5 h-5 text-white" />
              </div>
              <div>
                <div className="text-xs font-extrabold">NHẮC LẠI SAU 5 PHÚT</div>
                <div className="text-[10px] text-amber-100">Hoãn chuông để chuẩn bị nước ấm</div>
              </div>
            </button>

            {/* Action 3: Hỏi AI cách uống */}
            <button
              onClick={handleAskMedInstruction}
              className="p-3 rounded-2xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white shadow-lg transition flex items-center justify-center gap-2.5 cursor-pointer text-left group"
            >
              <div className="w-9 h-9 rounded-xl bg-white/20 flex items-center justify-center shrink-0">
                <HelpCircle className="w-5 h-5 text-white" />
              </div>
              <div>
                <div className="text-xs font-extrabold">HỎI AI HƯỚNG DẪN UỐNG</div>
                <div className="text-[10px] text-purple-100">Trước hay sau ăn, lưu ý gì?</div>
              </div>
            </button>
          </div>

          {/* LIVE DIALOGUE INTERACTION & QUICK PATIENT QUESTIONS */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 pt-1">
            {/* Left: Dialogue history between Patient and Voice AI */}
            <div className="glass-card rounded-2xl p-3 border border-white/5 space-y-2 flex flex-col justify-between h-56">
              <div className="flex items-center justify-between pb-1.5 border-b border-white/10 text-xs">
                <span className="font-bold text-slate-300 flex items-center gap-1.5">
                  <MessageSquare className="w-3.5 h-3.5 text-indigo-400" /> Cuộc đối thoại âm thanh hai chiều
                </span>
                <span className="text-[10px] text-slate-400 font-mono">Loa & Mic ESP32</span>
              </div>

              <div className="space-y-2 overflow-y-auto pr-1 flex-1 text-xs">
                {dialogueLog.map((msg, idx) => (
                  <div
                    key={idx}
                    className={`p-2.5 rounded-xl ${
                      msg.sender === 'patient'
                        ? 'bg-blue-600/25 border border-blue-500/30 text-blue-100 ml-4'
                        : msg.sender === 'child'
                        ? 'bg-emerald-600/25 border border-emerald-500/30 text-emerald-100 mr-4'
                        : 'bg-purple-600/25 border border-purple-500/30 text-purple-100 mr-4'
                    }`}
                  >
                    <div className="flex items-center justify-between text-[10px] mb-1 opacity-75 font-bold">
                      <span>
                        {msg.sender === 'patient'
                          ? `👤 ${wearerName} (Bệnh nhân)`
                          : msg.sender === 'child'
                          ? `❤️ Lời con nhắc nhở`
                          : `🩺 Trợ lý y tế AI`}
                      </span>
                      <span>{msg.time}</span>
                    </div>
                    <div className="leading-relaxed">{msg.text}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* Right: Quick questions & voice input for patient */}
            <div className="glass-card rounded-2xl p-3 border border-white/5 space-y-2.5 flex flex-col justify-between">
              <div>
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block mb-1.5">
                  CÂU HỎI NHANH NGƯỜI BỆNH THƯỜNG THẮC MẮC (BẤM ĐỂ AI TRẢ LỜI NGAY BẰNG GIỌNG NÓI):
                </span>
                <div className="space-y-1.5">
                  {[
                    'Thuốc huyết áp uống lúc đói hay lúc no?',
                    'Nếu lỡ quên 1 cữ thì tôi phải làm sao?',
                    'Sau khi uống thuốc xong tôi có được nằm ngủ ngay không?',
                  ].map((q, idx) => (
                    <button
                      key={idx}
                      onClick={() => handleSendPatientQuestion(q)}
                      className="w-full text-left p-2 rounded-xl bg-white/5 hover:bg-white/10 text-xs text-slate-300 hover:text-white transition flex items-center justify-between gap-2 cursor-pointer border border-white/5"
                    >
                      <span className="truncate">👉 "{q}"</span>
                      <Volume2 className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
                    </button>
                  ))}
                </div>
              </div>

              {/* Direct question input */}
              <div className="pt-2 border-t border-white/10">
                <div className="text-[11px] text-slate-400 mb-1">
                  Hoặc đặt câu hỏi bất kỳ cho AI trả lời bằng giọng nói:
                </div>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={patientQuestion}
                    onChange={e => setPatientQuestion(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && handleSendPatientQuestion()}
                    placeholder="Ví dụ: Bác sĩ ơi tôi uống thuốc này có kiêng gì không?..."
                    className="flex-1 glass-input p-2 rounded-xl text-xs"
                  />
                  <button
                    onClick={() => handleSendPatientQuestion()}
                    className="px-3 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 cursor-pointer shadow-md transition"
                  >
                    <Send className="w-3.5 h-3.5" />
                    <span>Hỏi & Đọc</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ======================================================== */}
      {/* SECTION 2.5: HỆ THỐNG MÁY LỌC KHÔNG KHÍ THÔNG MINH 3 CẤP ĐỘ */}
      {/* ======================================================== */}
      <div className="glass-panel rounded-2xl p-4 md:p-5 space-y-4 border border-cyan-500/30 bg-gradient-to-br from-cyan-950/30 via-slate-900/80 to-black">
        {/* Header */}
        <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-white/10">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-cyan-500/20 border border-cyan-500/40 flex items-center justify-center text-cyan-400">
              <Filter className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm sm:text-base font-extrabold text-white">
                  HỆ THỐNG MÁY LỌC KHÔNG KHÍ THÔNG MINH 3 CẤP ĐỘ
                </h3>
                <span className="px-2 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300 text-[10px] font-bold border border-cyan-500/30">
                  HEPA H13 & Than Hoạt Tính
                </span>
              </div>
              <p className="text-xs text-slate-300">
                Điều hòa lưu lượng gió, bảo vệ hệ hô hấp và tim mạch người cao tuổi theo tiêu chuẩn y khoa
              </p>
            </div>
          </div>

          {/* Mode Switcher: Tự động vs Thủ công */}
          <div className="flex items-center gap-1.5 p-1 rounded-xl bg-black/50 border border-white/10 text-xs font-bold">
            <button
              onClick={() => {
                setPurifierMode('auto');
                setPurifierScenario(null);
              }}
              className={`px-3 py-1.5 rounded-lg transition cursor-pointer flex items-center gap-1.5 ${
                purifierMode === 'auto'
                  ? 'bg-cyan-600 text-white shadow-md'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Sparkles className="w-3.5 h-3.5" /> Chế độ Tự Động (Auto AI)
            </button>
            <button
              onClick={() => setPurifierMode('manual')}
              className={`px-3 py-1.5 rounded-lg transition cursor-pointer flex items-center gap-1.5 ${
                purifierMode === 'manual'
                  ? 'bg-purple-600 text-white shadow-md'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Zap className="w-3.5 h-3.5" /> Điều Khiển Thủ Công
            </button>
          </div>
        </div>

        {/* Current Operating Status Banner */}
        <div className={`p-4 rounded-2xl border transition-all ${
          effectivePurifierLevel === 'low'
            ? 'bg-emerald-950/40 border-emerald-500/40'
            : effectivePurifierLevel === 'medium'
            ? 'bg-amber-950/40 border-amber-500/40'
            : 'bg-rose-950/50 border-rose-500/50 animate-pulse'
        }`}>
          <div className="flex flex-wrap items-center justify-between gap-4">
            {/* Left: Fan visual + level label */}
            <div className="flex items-center gap-3.5">
              <div className={`w-14 h-14 rounded-2xl flex items-center justify-center text-white shadow-lg ${
                effectivePurifierLevel === 'low'
                  ? 'bg-emerald-600 shadow-emerald-500/30'
                  : effectivePurifierLevel === 'medium'
                  ? 'bg-amber-600 shadow-amber-500/30'
                  : 'bg-rose-600 shadow-rose-500/40'
              }`}>
                <Fan className={`w-8 h-8 ${
                  effectivePurifierLevel === 'low'
                    ? 'animate-spin [animation-duration:3.5s]'
                    : effectivePurifierLevel === 'medium'
                    ? 'animate-spin [animation-duration:1.8s]'
                    : 'animate-spin [animation-duration:0.6s]'
                }`} />
              </div>

              <div>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                    Trạng thái vận hành hiện tại:
                  </span>
                  <span className={`px-2 py-0.5 rounded text-[10px] font-black uppercase ${
                    effectivePurifierLevel === 'low'
                      ? 'bg-emerald-500/20 text-emerald-300'
                      : effectivePurifierLevel === 'medium'
                      ? 'bg-amber-500/20 text-amber-300'
                      : 'bg-rose-500/20 text-rose-300'
                  }`}>
                    {purifierMode === 'auto' ? 'Cảm biến tự động' : 'Người dùng chọn'}
                  </span>
                </div>

                <h4 className="text-base sm:text-lg font-black text-white mt-0.5">
                  {effectivePurifierLevel === 'low' && '1. Mức Thấp / Chế độ Ngủ (Low / Sleep)'}
                  {effectivePurifierLevel === 'medium' && '2. Mức Trung Bình (Medium)'}
                  {effectivePurifierLevel === 'high' && '3. Mức Cao / Tăng Cường (High / Turbo / Haze)'}
                </h4>

                <p className="text-xs text-slate-300 mt-0.5">
                  {effectivePurifierLevel === 'low' && 'Quạt êm dịu < 25dB, duy trì không khí sạch, tiết kiệm điện 8W, đèn LED màn hình tự động giảm sáng.'}
                  {effectivePurifierLevel === 'medium' && 'Quạt 38dB, công suất 22W, tăng tốc độ xử lý bụi mịn phát sinh do sinh hoạt, người đi lại hoặc mở cửa.'}
                  {effectivePurifierLevel === 'high' && 'Quạt cực đại 55dB Turbo, công suất 48W, kích hoạt màng Than Hoạt Tính & HEPA khử khói bụi và hóa chất cấp tốc.'}
                </p>
              </div>
            </div>

            {/* Right: Telemetry specs & Manual selector if in manual mode */}
            <div className="flex items-center gap-2">
              {purifierMode === 'manual' ? (
                <div className="flex gap-1.5 p-1 rounded-xl bg-black/60 border border-white/10">
                  <button
                    onClick={() => setManualPurifierLevel('low')}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${
                      manualPurifierLevel === 'low'
                        ? 'bg-emerald-600 text-white'
                        : 'text-slate-300 hover:text-white'
                    }`}
                  >
                    Mức 1 (Ngủ)
                  </button>
                  <button
                    onClick={() => setManualPurifierLevel('medium')}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${
                      manualPurifierLevel === 'medium'
                        ? 'bg-amber-600 text-white'
                        : 'text-slate-300 hover:text-white'
                    }`}
                  >
                    Mức 2 (Vừa)
                  </button>
                  <button
                    onClick={() => setManualPurifierLevel('high')}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${
                      manualPurifierLevel === 'high'
                        ? 'bg-rose-600 text-white'
                        : 'text-slate-300 hover:text-white'
                    }`}
                  >
                    Mức 3 (Turbo)
                  </button>
                </div>
              ) : (
                <div className="flex items-center gap-3 text-right">
                  <div>
                    <div className="text-[10px] text-slate-400">Độ ồn / Điện năng</div>
                    <div className="text-xs font-bold text-cyan-300 font-mono">
                      {effectivePurifierLevel === 'low' && '< 25 dB • 8W'}
                      {effectivePurifierLevel === 'medium' && '38 dB • 22W'}
                      {effectivePurifierLevel === 'high' && '55 dB • 48W'}
                    </div>
                  </div>
                  <div className="w-9 h-9 rounded-xl bg-black/40 border border-white/10 flex items-center justify-center text-cyan-400">
                    <Layers className="w-4 h-4" />
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* 3 Detailed Explanatory Cards (As strictly requested by user) */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
          {/* Card 1: Mức Thấp / Chế độ Ngủ (Low / Sleep) */}
          <div className={`p-4 rounded-2xl glass-card border space-y-2.5 transition ${
            effectivePurifierLevel === 'low'
              ? 'border-emerald-500 ring-2 ring-emerald-500/30 bg-emerald-950/20'
              : 'border-white/10 opacity-80 hover:opacity-100'
          }`}>
            <div className="flex items-center justify-between pb-2 border-b border-white/10">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-400" />
                <h4 className="font-bold text-emerald-300 text-xs sm:text-sm">
                  1. Mức Thấp / Chế độ Ngủ (Low / Sleep)
                </h4>
              </div>
              <Moon className="w-4 h-4 text-emerald-400" />
            </div>

            <div className="space-y-2 text-slate-300 leading-relaxed text-[11px]">
              <div>
                <strong className="text-white block font-semibold">• Khi nào kích hoạt:</strong>
                <span>Khi không khí đã sạch (đèn báo màu xanh lá / xanh dương, chỉ số PM2.5 dưới 15–25 µg/m³) hoặc vào ban đêm lúc đi ngủ.</span>
              </div>
              <div>
                <strong className="text-white block font-semibold">• Cơ chế hoạt động:</strong>
                <span>Quạt chạy ở tốc độ chậm nhất để duy trì luồng khí lưu thông nhẹ nhàng, giữ cho không khí luôn sạch mà không gây tiếng ồn (thường dưới 25dB) và tiết kiệm điện. Lúc này đèn hiển thị thường cũng được tắt bớt để tránh chói mắt người cao tuổi.</span>
              </div>
            </div>
          </div>

          {/* Card 2: Mức Trung bình (Medium) */}
          <div className={`p-4 rounded-2xl glass-card border space-y-2.5 transition ${
            effectivePurifierLevel === 'medium'
              ? 'border-amber-500 ring-2 ring-amber-500/30 bg-amber-950/20'
              : 'border-white/10 opacity-80 hover:opacity-100'
          }`}>
            <div className="flex items-center justify-between pb-2 border-b border-white/10">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-amber-400" />
                <h4 className="font-bold text-amber-300 text-xs sm:text-sm">
                  2. Mức Trung bình (Medium)
                </h4>
              </div>
              <Activity className="w-4 h-4 text-amber-400" />
            </div>

            <div className="space-y-2 text-slate-300 leading-relaxed text-[11px]">
              <div>
                <strong className="text-white block font-semibold">• Khi nào kích hoạt:</strong>
                <span>Khi không khí bắt đầu có dấu hiệu ô nhiễm nhẹ (đèn báo màu vàng / cam, chỉ số PM2.5 khoảng 25–50 µg/m³) hoặc trong sinh hoạt hàng ngày có người đi lại trong phòng.</span>
              </div>
              <div>
                <strong className="text-white block font-semibold">• Cơ chế hoạt động:</strong>
                <span>Tăng tốc độ hút để các màng lọc xử lý nhanh hơn lượng bụi phát sinh từ quần áo, di chuyển hoặc mở cửa phòng đón gió.</span>
              </div>
            </div>
          </div>

          {/* Card 3: Mức Cao / Tăng cường (High / Turbo / Haze) */}
          <div className={`p-4 rounded-2xl glass-card border space-y-2.5 transition ${
            effectivePurifierLevel === 'high'
              ? 'border-rose-500 ring-2 ring-rose-500/30 bg-rose-950/20'
              : 'border-white/10 opacity-80 hover:opacity-100'
          }`}>
            <div className="flex items-center justify-between pb-2 border-b border-white/10">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-rose-500 animate-ping" />
                <h4 className="font-bold text-rose-300 text-xs sm:text-sm">
                  3. Mức Cao / Tăng cường (High / Turbo / Haze)
                </h4>
              </div>
              <Zap className="w-4 h-4 text-rose-400" />
            </div>

            <div className="space-y-2 text-slate-300 leading-relaxed text-[11px]">
              <div>
                <strong className="text-white block font-semibold">• Khi nào kích hoạt:</strong>
                <span>Khi không khí ô nhiễm nặng (đèn báo màu đỏ / tím, chỉ số PM2.5 trên 50–100 µg/m³) hoặc có tác nhân gây ô nhiễm đột ngột.</span>
              </div>
              <div>
                <strong className="text-white block font-semibold">• Các tình huống cụ thể:</strong>
                <ul className="list-disc pl-4 space-y-1">
                  <li><strong>Có khói thuốc, mùi thức ăn, mùi sơn / hóa chất:</strong> Cảm biến mùi kích hoạt quạt chạy tối đa để đẩy không khí qua màng than hoạt tính liên tục, giúp khử mùi nhanh nhất.</li>
                  <li><strong>Mới bật máy khi phòng đóng kín lâu ngày, hoặc vừa quét dọn / giũ chăn màn:</strong> Quạt chạy công suất lớn nhất trong khoảng 15–30 phút đầu để màng lọc thô và HEPA gom sạch bụi lơ lửng, sau đó tự giảm về mức thấp.</li>
                </ul>
              </div>
            </div>
          </div>
        </div>

        {/* Simulation Triggers for User Testing */}
        <div className="p-3 rounded-xl bg-black/40 border border-white/10 space-y-2 text-xs">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-cyan-400" /> Mô phỏng thử nghiệm tình huống thực tế:
            </span>
            {purifierScenario && (
              <button
                onClick={() => setPurifierScenario(null)}
                className="text-[10px] text-cyan-400 hover:text-white underline cursor-pointer"
              >
                Đặt lại cảm biến tự nhiên
              </button>
            )}
          </div>

          <div className="flex flex-wrap gap-2 text-xs">
            <button
              onClick={() => {
                setPurifierMode('auto');
                setPurifierScenario('sleep');
              }}
              className="px-3 py-1.5 rounded-xl bg-emerald-500/15 hover:bg-emerald-500/25 border border-emerald-500/30 text-emerald-300 transition cursor-pointer flex items-center gap-1.5"
            >
              <Moon className="w-3.5 h-3.5" /> 1. Không khí sạch / Ban đêm (Low/Sleep)
            </button>

            <button
              onClick={() => {
                setPurifierMode('auto');
                setPurifierScenario('activity');
              }}
              className="px-3 py-1.5 rounded-xl bg-amber-500/15 hover:bg-amber-500/25 border border-amber-500/30 text-amber-300 transition cursor-pointer flex items-center gap-1.5"
            >
              <Activity className="w-3.5 h-3.5" /> 2. Sinh hoạt phòng / Mở cửa (Medium)
            </button>

            <button
              onClick={() => {
                setPurifierMode('auto');
                setPurifierScenario('smoke');
              }}
              className="px-3 py-1.5 rounded-xl bg-rose-500/15 hover:bg-rose-500/25 border border-rose-500/30 text-rose-300 transition cursor-pointer flex items-center gap-1.5"
            >
              <Zap className="w-3.5 h-3.5" /> 3a. Khói thuốc / Mùi sơn hóa chất (Turbo)
            </button>

            <button
              onClick={() => {
                setPurifierMode('auto');
                setPurifierScenario('cleaning');
              }}
              className="px-3 py-1.5 rounded-xl bg-purple-500/15 hover:bg-purple-500/25 border border-purple-500/30 text-purple-300 transition cursor-pointer flex items-center gap-1.5"
            >
              <Filter className="w-3.5 h-3.5" /> 3b. Quét dọn phòng / Giũ chăn màn (HEPA 30p)
            </button>
          </div>
        </div>
      </div>

      {/* SECTION 3: PHÍA DƯỚI CHIA ĐÔI (50% - 50%) */}
      {/* 1. LỊCH SỬ SỨC KHỎE BẤT THƯỜNG & 2. LỊCH SỬ LỌC KHÔNG KHÍ Ô NHIỄM (CẢ 2 ĐỀU XÓA ĐƯỢC) */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* CỘT 1: LỊCH SỬ SỨC KHỎE BẤT THƯỜNG */}
        <div className="glass-panel rounded-2xl p-4 space-y-3">
          <div className="flex items-center justify-between pb-2 border-b border-white/10">
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-rose-400" />
              <h3 className="text-xs sm:text-sm font-bold text-rose-300 uppercase">
                LỊCH SỬ SỨC KHỎE BẤT THƯỜNG ({abnormalLogs.length})
              </h3>
            </div>
            {abnormalLogs.length > 0 && (
              <button
                onClick={onClearAbnormalLogs}
                className="text-[11px] text-rose-400 hover:text-rose-300 font-semibold flex items-center gap-1 cursor-pointer"
                title="Xóa tất cả lịch sử bất thường"
              >
                <Trash2 className="w-3.5 h-3.5" /> Xóa tất cả
              </button>
            )}
          </div>

          <p className="text-[11px] text-slate-400">
            Ghi nhận các lần sinh hiệu bất ổn (SpO2 tụt, sốt cao, nhịp tim đột biến) của từng thành viên:
          </p>

          <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
            {abnormalLogs.length === 0 ? (
              <div className="p-4 rounded-xl glass-card text-center text-xs text-slate-500 border border-dashed border-white/10">
                ✓ Chưa có ghi nhận bất thường nào. Tất cả thành viên đều có sinh hiệu ổn định!
              </div>
            ) : (
              abnormalLogs.map(log => (
                <div
                  key={log.id}
                  className="p-3 rounded-xl glass-card border border-rose-500/20 flex items-center justify-between gap-2 hover:border-rose-500/40 transition"
                >
                  <div className="space-y-0.5">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-white text-xs">{log.memberName}</span>
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-rose-500/20 text-rose-400">
                        {log.type}
                      </span>
                    </div>
                    <div className="text-[11px] text-rose-200">
                      Chỉ số: <strong>{log.value}</strong>
                    </div>
                    <div className="text-[10px] text-slate-400">{log.timestamp}</div>
                  </div>
                  <button
                    onClick={() => onDeleteAbnormalLog(log.id)}
                    className="p-1.5 text-slate-400 hover:text-rose-400 transition cursor-pointer"
                    title="Xóa dòng này"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))
            )}
          </div>
        </div>

        {/* CỘT 2: LỊCH SỬ LỌC KHÔNG KHÍ Ô NHIỄM */}
        <div className="glass-panel rounded-2xl p-4 space-y-3">
          <div className="flex items-center justify-between pb-2 border-b border-white/10">
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              <h3 className="text-xs sm:text-sm font-bold text-emerald-300 uppercase">
                LỊCH SỬ LỌC KHÔNG KHÍ Ô NHIỄM ({pollutionLogs.length})
              </h3>
            </div>
            {pollutionLogs.length > 0 && (
              <button
                onClick={onClearPollutionLogs}
                className="text-[11px] text-emerald-400 hover:text-emerald-300 font-semibold flex items-center gap-1 cursor-pointer"
                title="Xóa tất cả lịch sử lọc khí"
              >
                <Trash2 className="w-3.5 h-3.5" /> Xóa tất cả
              </button>
            )}
          </div>

          <p className="text-[11px] text-slate-400">
            Ghi nhận các lần không khí ô nhiễm và thời gian hệ thống kích hoạt chế độ thanh lọc:
          </p>

          <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
            {pollutionLogs.length === 0 ? (
              <div className="p-4 rounded-xl glass-card text-center text-xs text-slate-500 border border-dashed border-white/10">
                ✓ Không khí phòng duy trì chất lượng trong lành (AQI an toàn).
              </div>
            ) : (
              pollutionLogs.map(log => (
                <div
                  key={log.id}
                  className="p-3 rounded-xl glass-card border border-emerald-500/20 flex items-center justify-between gap-2 hover:border-emerald-500/40 transition"
                >
                  <div className="space-y-0.5">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-amber-400 text-xs">AQI {log.aqi}</span>
                      <span className="text-[10px] text-slate-300">PM2.5: {log.pm25} µg/m³</span>
                    </div>
                    <div className="text-[11px] text-slate-200">{log.description}</div>
                    <div className="text-[10px] text-emerald-400 flex items-center gap-1">
                      <span>✓ {log.actionTaken}</span>
                      <span className="text-slate-400">• {log.timestamp}</span>
                    </div>
                  </div>
                  <button
                    onClick={() => onDeletePollutionLog(log.id)}
                    className="p-1.5 text-slate-400 hover:text-rose-400 transition cursor-pointer"
                    title="Xóa dòng này"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* MODAL KẾT NỐI VÒNG TAY CHO NGƯỜI MỚI */}
      {showPairingModal && (
        <div className="fixed inset-0 bg-black/75 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="glass-panel rounded-3xl p-5 w-full max-w-md space-y-4 text-xs">
            <div className="flex justify-between items-center pb-2 border-b border-white/10">
              <h3 className="font-bold text-sm text-purple-400 flex items-center gap-2">
                <Watch className="w-4 h-4" /> KẾT NỐI VÒNG TAY ĐO SỨC KHỎE
              </h3>
              <button
                onClick={() => setShowPairingModal(false)}
                className="text-slate-400 hover:text-white p-1 text-base cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handlePairNewMember} className="space-y-3">
              <div>
                <label className="block text-slate-400 mb-1">Tên người sử dụng vòng tay *</label>
                <input
                  type="text"
                  required
                  placeholder="Ví dụ: Ông Nội, Bà Ngoại, Bác Nam..."
                  value={pairingName}
                  onChange={e => setPairingName(e.target.value)}
                  className="w-full glass-input p-2.5 rounded-xl"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-slate-400 mb-1">Tuổi *</label>
                  <input
                    type="number"
                    required
                    min={1}
                    max={120}
                    value={pairingAge}
                    onChange={e => setPairingAge(parseInt(e.target.value) || 60)}
                    className="w-full glass-input p-2.5 rounded-xl"
                  />
                </div>
                <div>
                  <label className="block text-slate-400 mb-1">Giới tính</label>
                  <select
                    value={pairingGender}
                    onChange={e => setPairingGender(e.target.value as any)}
                    className="w-full glass-input p-2.5 rounded-xl"
                  >
                    <option value="Nam">Nam</option>
                    <option value="Nữ">Nữ</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-slate-400 mb-1">Mã thiết bị vòng tay (BLE Bluetooth)</label>
                <input
                  type="text"
                  value={pairingBandId}
                  onChange={e => setPairingBandId(e.target.value)}
                  className="w-full glass-input p-2.5 rounded-xl font-mono text-purple-300"
                />
              </div>

              <div className="p-3 rounded-xl bg-purple-950/20 border border-purple-500/20 text-slate-300 text-[11px] flex items-center gap-2">
                <Watch className="w-5 h-5 text-purple-400 shrink-0" />
                <span>
                  Đưa vòng tay thông minh lại gần trạm Smart Healthcare trong bán kính 2 mét để tự động ghép nối.
                </span>
              </div>

              <button
                type="submit"
                disabled={isPairingScanning}
                className="w-full py-2.5 gemini-gradient-bg text-white font-bold rounded-xl shadow-md hover:opacity-95 flex items-center justify-center gap-2 transition disabled:opacity-50 cursor-pointer"
              >
                {isPairingScanning ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" /> Đang quét & ghép nối BLE...
                  </>
                ) : (
                  <>
                    <Watch className="w-4 h-4" /> Xác Nhận Ghép Nối & Bắt Đầu Đo
                  </>
                )}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
