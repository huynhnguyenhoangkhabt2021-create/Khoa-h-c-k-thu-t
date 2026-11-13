import React, { useState, useEffect, useRef } from 'react';
import {
  Dumbbell,
  Play,
  Pause,
  RotateCcw,
  Plus,
  Video,
  X,
  Sparkles,
  Heart,
  Brain,
  CheckCircle2,
  Clock,
  Upload,
  ExternalLink,
  Volume2,
  VolumeX,
  Gauge,
  Film,
  Activity
} from 'lucide-react';
import { WorkoutVideo } from '../types';

interface ExerciseTabProps {
  workoutList: WorkoutVideo[];
  onAddWorkout: (workout: WorkoutVideo) => void;
}

export const ExerciseTab: React.FC<ExerciseTabProps> = ({ workoutList, onAddWorkout }) => {
  const [activeCategory, setActiveCategory] = useState<'all' | 'physical' | 'mental'>('all');
  const [selectedWorkout, setSelectedWorkout] = useState<WorkoutVideo | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);

  // Video Player Mode inside Modal: 'animated' (100% reliable canvas coach) or 'online' (YouTube stream)
  const [videoMode, setVideoMode] = useState<'animated' | 'online'>('animated');
  const [isPlaying, setIsPlaying] = useState(true);
  const [playbackTime, setPlaybackTime] = useState(0);
  const [playbackSpeed, setPlaybackSpeed] = useState<number>(1.0);
  const [voiceCoachEnabled, setVoiceCoachEnabled] = useState(true);
  const [currentStepIndex, setCurrentStepIndex] = useState(0);

  // Form states for adding custom workout
  const [newTitle, setNewTitle] = useState('');
  const [newCategory, setNewCategory] = useState<'physical' | 'mental'>('physical');
  const [newDuration, setNewDuration] = useState('15 phút');
  const [newLevel, setNewLevel] = useState<'Nhẹ nhàng' | 'Vừa sức' | 'Dưỡng sinh'>('Nhẹ nhàng');
  const [newTarget, setNewTarget] = useState('Tăng sức bền và độ dẻo dai');
  const [newDesc, setNewDesc] = useState('');
  const [newSteps, setNewSteps] = useState('Khởi động 3 phút\nThực hiện động tác nhẹ nhàng 10 phút\nThả lỏng hít thở sâu 2 phút');
  const [newVideoUrl, setNewVideoUrl] = useState('');

  // 4-7-8 interactive breathing guide state
  const [isBreathingRunning, setIsBreathingRunning] = useState(false);
  const [breathPhase, setBreathPhase] = useState<'Hít vào' | 'Giữ hơi' | 'Thở ra' | 'Sẵn sàng'>('Sẵn sàng');
  const [breathSeconds, setBreathSeconds] = useState(0);

  // Canvas ref for animated coach
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const animFrameRef = useRef<number | null>(null);

  // Open modal and initialize video playback
  const handleOpenWorkoutModal = (workout: WorkoutVideo) => {
    setSelectedWorkout(workout);
    setVideoMode('animated');
    setIsPlaying(true);
    setPlaybackTime(0);
    setCurrentStepIndex(0);

    // Speak initial welcome cue if voice is enabled
    if (voiceCoachEnabled && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      const utter = new SpeechSynthesisUtterance(`Bắt đầu bài tập: ${workout.title}.`);
      utter.lang = 'vi-VN';
      utter.rate = 0.9;
      window.speechSynthesis.speak(utter);
    }
  };

  // Close workout modal
  const handleCloseWorkoutModal = () => {
    setSelectedWorkout(null);
    setIsPlaying(false);
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }
    if (animFrameRef.current) {
      cancelAnimationFrame(animFrameRef.current);
    }
  };

  // Playback timer ticker
  useEffect(() => {
    if (!selectedWorkout || !isPlaying) return;

    const timer = setInterval(() => {
      setPlaybackTime(prev => {
        const next = prev + 1;
        // Step progression every 20 seconds
        const stepCount = selectedWorkout.steps?.length || 1;
        const newStep = Math.min(Math.floor(next / 18) % stepCount, stepCount - 1);
        if (newStep !== currentStepIndex) {
          setCurrentStepIndex(newStep);
          if (voiceCoachEnabled && 'speechSynthesis' in window) {
            window.speechSynthesis.cancel();
            const stepText = selectedWorkout.steps[newStep] || '';
            const utter = new SpeechSynthesisUtterance(`Động tác ${newStep + 1}: ${stepText}`);
            utter.lang = 'vi-VN';
            utter.rate = 0.95;
            window.speechSynthesis.speak(utter);
          }
        }
        return next;
      });
    }, 1000 / playbackSpeed);

    return () => clearInterval(timer);
  }, [selectedWorkout, isPlaying, playbackSpeed, currentStepIndex, voiceCoachEnabled]);

  // Animated Coach Canvas Rendering Loop
  useEffect(() => {
    if (!selectedWorkout || videoMode !== 'animated') return;

    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let tick = 0;
    const isMental = selectedWorkout.category === 'mental';

    const render = () => {
      if (isPlaying) {
        tick += 0.04 * playbackSpeed;
      }

      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // 1. Dark Gradient Background
      const bgGrad = ctx.createLinearGradient(0, 0, 0, canvas.height);
      bgGrad.addColorStop(0, '#090d16');
      bgGrad.addColorStop(1, '#0f172a');
      ctx.fillStyle = bgGrad;
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Floor grid line
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.08)';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(0, canvas.height - 40);
      ctx.lineTo(canvas.width, canvas.height - 40);
      ctx.stroke();

      // Floor glow
      const floorGrad = ctx.createRadialGradient(
        canvas.width / 2,
        canvas.height - 40,
        10,
        canvas.width / 2,
        canvas.height - 40,
        180
      );
      floorGrad.addColorStop(0, isMental ? 'rgba(168, 85, 247, 0.25)' : 'rgba(16, 185, 129, 0.25)');
      floorGrad.addColorStop(1, 'rgba(0, 0, 0, 0)');
      ctx.fillStyle = floorGrad;
      ctx.fillRect(0, canvas.height - 80, canvas.width, 80);

      const cx = canvas.width / 2;
      const cy = canvas.height / 2;

      if (isMental) {
        // MENTAL & BREATHING VISUAL COACH: Aura spheres & ripple waves
        const pulse = Math.sin(tick) * 20;
        const breathRadius = 55 + pulse;

        // Outer breathing wave rings
        for (let r = 1; r <= 3; r++) {
          const waveR = (breathRadius + r * 28 + (tick * 10) % 30) % 150;
          ctx.beginPath();
          ctx.arc(cx, cy - 10, waveR, 0, Math.PI * 2);
          ctx.strokeStyle = `rgba(168, 85, 247, ${Math.max(0, 0.4 - waveR / 180)})`;
          ctx.lineWidth = 2;
          ctx.stroke();
        }

        // Inner glowing core
        const coreGrad = ctx.createRadialGradient(cx, cy - 10, 5, cx, cy - 10, breathRadius);
        coreGrad.addColorStop(0, '#c084fc');
        coreGrad.addColorStop(0.6, 'rgba(147, 51, 234, 0.4)');
        coreGrad.addColorStop(1, 'rgba(88, 28, 135, 0)');
        ctx.fillStyle = coreGrad;
        ctx.beginPath();
        ctx.arc(cx, cy - 10, breathRadius, 0, Math.PI * 2);
        ctx.fill();

        // Seated Lotus Pose Silhouette
        ctx.fillStyle = '#f8fafc';
        // Head
        ctx.beginPath();
        ctx.arc(cx, cy - 50, 16, 0, Math.PI * 2);
        ctx.fill();
        // Torso
        ctx.beginPath();
        ctx.roundRect(cx - 14, cy - 30, 28, 45, 8);
        ctx.fill();
        // Crossed legs
        ctx.beginPath();
        ctx.ellipse(cx, cy + 22, 45, 14, 0, 0, Math.PI * 2);
        ctx.fill();
        // Hands resting in lap
        ctx.beginPath();
        ctx.arc(cx, cy + 12, 6, 0, Math.PI * 2);
        ctx.fillStyle = '#38bdf8';
        ctx.fill();
      } else {
        // PHYSICAL EXERCISE ANIMATED COACH
        const titleLower = selectedWorkout.title.toLowerCase();

        // Bobbing & joint motions
        const bob = Math.sin(tick * 2) * 6;
        const armSwing = Math.sin(tick * 2) * 35;
        const legLift = Math.sin(tick * 2) * 20;

        const headY = cy - 85 + bob;
        const torsoY = headY + 30;

        // Head
        ctx.fillStyle = '#f8fafc';
        ctx.beginPath();
        ctx.arc(cx, headY, 16, 0, Math.PI * 2);
        ctx.fill();

        // Headband
        ctx.fillStyle = '#10b981';
        ctx.fillRect(cx - 16, headY - 4, 32, 6);

        // Torso
        ctx.fillStyle = '#0284c7';
        ctx.beginPath();
        ctx.roundRect(cx - 16, torsoY, 32, 60, 10);
        ctx.fill();

        // Arms motion depending on exercise type
        ctx.lineWidth = 8;
        ctx.lineCap = 'round';
        ctx.strokeStyle = '#38bdf8';

        if (titleLower.includes('vung tay') || titleLower.includes('dịch cân kinh')) {
          // Backward-forward powerful arm swings
          const swingAngle = Math.sin(tick * 3) * 65;
          ctx.beginPath();
          ctx.moveTo(cx - 14, torsoY + 12);
          ctx.lineTo(cx - 14 + swingAngle * 0.7, torsoY + 50);
          ctx.stroke();

          ctx.beginPath();
          ctx.moveTo(cx + 14, torsoY + 12);
          ctx.lineTo(cx + 14 + swingAngle * 0.7, torsoY + 50);
          ctx.stroke();
        } else if (titleLower.includes('thái cực') || titleLower.includes('tai chi')) {
          // Circular graceful Tai Chi sweeping
          const sweepX1 = Math.cos(tick) * 45;
          const sweepY1 = Math.sin(tick) * 25;
          ctx.beginPath();
          ctx.moveTo(cx - 14, torsoY + 12);
          ctx.lineTo(cx - 30 + sweepX1, torsoY + 20 + sweepY1);
          ctx.stroke();

          ctx.beginPath();
          ctx.moveTo(cx + 14, torsoY + 12);
          ctx.lineTo(cx + 30 - sweepX1, torsoY + 20 - sweepY1);
          ctx.stroke();
        } else if (titleLower.includes('cổ gáy') || titleLower.includes('khớp vai')) {
          // Stretching overhead
          const reach = Math.sin(tick) * 20;
          ctx.beginPath();
          ctx.moveTo(cx - 14, torsoY + 12);
          ctx.lineTo(cx - 35, headY - 10 + reach);
          ctx.stroke();

          ctx.beginPath();
          ctx.moveTo(cx + 14, torsoY + 12);
          ctx.lineTo(cx + 35, headY - 10 - reach);
          ctx.stroke();
        } else {
          // Standard rhythmic walking / exercise arm pump
          ctx.beginPath();
          ctx.moveTo(cx - 14, torsoY + 12);
          ctx.lineTo(cx - 28, torsoY + 45 + armSwing);
          ctx.stroke();

          ctx.beginPath();
          ctx.moveTo(cx + 14, torsoY + 12);
          ctx.lineTo(cx + 28, torsoY + 45 - armSwing);
          ctx.stroke();
        }

        // Legs motion
        ctx.strokeStyle = '#64748b';
        ctx.lineWidth = 9;

        if (titleLower.includes('nhón gót') || titleLower.includes('calf')) {
          // Up and down calf raise
          const heelRise = Math.max(0, Math.sin(tick * 2)) * 14;
          ctx.beginPath();
          ctx.moveTo(cx - 10, torsoY + 58);
          ctx.lineTo(cx - 10, canvas.height - 40 - heelRise);
          ctx.stroke();

          ctx.beginPath();
          ctx.moveTo(cx + 10, torsoY + 58);
          ctx.lineTo(cx + 10, canvas.height - 40 - heelRise);
          ctx.stroke();
        } else if (titleLower.includes('thăng bằng')) {
          // Standing on one leg, other lifted
          ctx.beginPath();
          ctx.moveTo(cx - 8, torsoY + 58);
          ctx.lineTo(cx - 8, canvas.height - 40);
          ctx.stroke();

          ctx.beginPath();
          ctx.moveTo(cx + 8, torsoY + 58);
          ctx.lineTo(cx + 25, torsoY + 75);
          ctx.lineTo(cx + 20, torsoY + 105);
          ctx.stroke();
        } else {
          // Marching alternating legs
          const leftLegY = canvas.height - 40 - Math.max(0, legLift);
          const rightLegY = canvas.height - 40 - Math.max(0, -legLift);

          ctx.beginPath();
          ctx.moveTo(cx - 10, torsoY + 58);
          ctx.lineTo(cx - 10, leftLegY);
          ctx.stroke();

          ctx.beginPath();
          ctx.moveTo(cx + 10, torsoY + 58);
          ctx.lineTo(cx + 10, rightLegY);
          ctx.stroke();
        }
      }

      // Rep / Tempo Tracker text overlay
      ctx.fillStyle = 'rgba(255, 255, 255, 0.85)';
      ctx.font = 'bold 12px monospace';
      ctx.fillText(
        `NHỊP TẬP: ${Math.floor(tick % 16) + 1} / 16  •  BƯỚC ${currentStepIndex + 1}/${selectedWorkout.steps.length}`,
        16,
        28
      );

      animFrameRef.current = requestAnimationFrame(render);
    };

    render();

    return () => {
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    };
  }, [selectedWorkout, videoMode, isPlaying, playbackSpeed, currentStepIndex]);

  const startBreathingSession = () => {
    if (isBreathingRunning) {
      setIsBreathingRunning(false);
      setBreathPhase('Sẵn sàng');
      return;
    }

    setIsBreathingRunning(true);
    let currentPhase: 'inhale' | 'hold' | 'exhale' = 'inhale';
    let count = 4;
    setBreathPhase('Hít vào');
    setBreathSeconds(4);

    const interval = setInterval(() => {
      count--;
      setBreathSeconds(count);

      if (count <= 0) {
        if (currentPhase === 'inhale') {
          currentPhase = 'hold';
          count = 7;
          setBreathPhase('Giữ hơi');
        } else if (currentPhase === 'hold') {
          currentPhase = 'exhale';
          count = 8;
          setBreathPhase('Thở ra');
        } else {
          currentPhase = 'inhale';
          count = 4;
          setBreathPhase('Hít vào');
        }
        setBreathSeconds(count);
      }
    }, 1000);

    (window as any).__breathTimer = interval;
  };

  const stopBreathingSession = () => {
    if ((window as any).__breathTimer) {
      clearInterval((window as any).__breathTimer);
    }
    setIsBreathingRunning(false);
    setBreathPhase('Sẵn sàng');
  };

  const handleCreateWorkout = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) return;

    const created: WorkoutVideo = {
      id: 'w-custom-' + Date.now(),
      title: newTitle.trim(),
      category: newCategory,
      duration: newDuration,
      level: newLevel,
      target: newTarget,
      description: newDesc || 'Bài tập tăng cường sức khỏe được lưu từ danh sách người dùng.',
      steps: newSteps.split('\n').filter(s => s.trim().length > 0),
      videoUrl: newVideoUrl || 'https://www.youtube-nocookie.com/embed/dQw4w9WgXcQ',
      isCustom: true,
    };

    onAddWorkout(created);
    setShowAddModal(false);
    setNewTitle('');
    setNewDesc('');
    setNewVideoUrl('');
  };

  const filtered = workoutList.filter(w => {
    if (activeCategory === 'all') return true;
    return w.category === activeCategory;
  });

  const formatSeconds = (sec: number) => {
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  return (
    <div className="space-y-4">
      {/* HEADER BANNER */}
      <div className="glass-panel rounded-2xl p-4 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-base sm:text-lg font-bold text-white flex items-center gap-2">
            <Dumbbell className="w-5 h-5 text-emerald-400" /> EXERCISES TO IMPROVE HEALTH (14+ Bài Tập)
          </h2>
          <p className="text-xs text-slate-400">
            Tổng hợp bài tập phục hồi thể chất, dưỡng sinh kinh lạc, thở 4-7-8 và thư giãn tinh thần cho người cao tuổi
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {/* Category Filter */}
          <div className="flex rounded-xl glass-card p-1 text-xs">
            <button
              onClick={() => setActiveCategory('all')}
              className={`px-3 py-1 rounded-lg font-bold transition cursor-pointer ${
                activeCategory === 'all' ? 'bg-emerald-600 text-white shadow-sm' : 'text-slate-400 hover:text-white'
              }`}
            >
              Tất Cả ({workoutList.length})
            </button>
            <button
              onClick={() => setActiveCategory('physical')}
              className={`px-3 py-1 rounded-lg font-bold transition cursor-pointer ${
                activeCategory === 'physical'
                  ? 'bg-emerald-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Thể Chất ({workoutList.filter(w => w.category === 'physical').length})
            </button>
            <button
              onClick={() => setActiveCategory('mental')}
              className={`px-3 py-1 rounded-lg font-bold transition cursor-pointer ${
                activeCategory === 'mental'
                  ? 'bg-emerald-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Tinh Thần ({workoutList.filter(w => w.category === 'mental').length})
            </button>
          </div>

          <button
            onClick={() => setShowAddModal(true)}
            className="px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-500 hover:opacity-95 text-white font-bold text-xs flex items-center gap-1.5 shadow-md transition cursor-pointer"
          >
            <Plus className="w-4 h-4" /> + Thêm bài tập / Tải video
          </button>
        </div>
      </div>

      {/* FEATURED: MEDICAL BREATHING 4-7-8 EXERCISE */}
      <div className="glass-panel rounded-2xl p-5 space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <h3 className="text-sm font-bold text-cyan-400 flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-cyan-400" /> BÀI TẬP THỞ 4-7-8 CHUẨN Y KHOA HÔ HẤP
            </h3>
            <p className="text-xs text-slate-300">
              Mở rộng phế nang, làm chậm nhịp tim tự nhiên và giải tỏa lo âu cho người cao tuổi
            </p>
          </div>
          <span className="text-xs px-2.5 py-1 rounded-lg bg-cyan-500/20 text-cyan-300 font-bold">
            Bài tập hàng ngày
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-center pt-2">
          {/* Animated Lung visual */}
          <div className="md:col-span-2 relative h-48 rounded-2xl bg-black/40 border border-cyan-500/30 flex flex-col items-center justify-center p-4 text-center overflow-hidden">
            <div
              className={`w-28 h-28 rounded-full border-4 border-cyan-400/80 flex items-center justify-center transition-all duration-1000 ${
                isBreathingRunning
                  ? breathPhase === 'Hít vào'
                    ? 'scale-125 bg-cyan-500/25 border-cyan-300 shadow-[0_0_30px_rgba(6,182,212,0.6)]'
                    : breathPhase === 'Giữ hơi'
                    ? 'scale-125 bg-purple-500/25 border-purple-300 shadow-[0_0_30px_rgba(168,85,247,0.6)]'
                    : 'scale-90 bg-emerald-500/20 border-emerald-300'
                  : 'scale-100 bg-white/5'
              }`}
            >
              <div className="text-center">
                <div className="text-xs font-bold text-slate-300 uppercase tracking-widest">{breathPhase}</div>
                <div className="text-2xl font-extrabold text-white font-mono">
                  {isBreathingRunning ? `${breathSeconds}s` : '4-7-8'}
                </div>
              </div>
            </div>

            <div className="mt-3 text-xs text-slate-300 max-w-md">
              {isBreathingRunning ? (
                breathPhase === 'Hít vào' ? (
                  'Hít sâu bằng mũi trong 4 giây, căng đầy lồng ngực...'
                ) : breathPhase === 'Giữ hơi' ? (
                  'Giữ hơi nhẹ nhàng trong 7 giây, phế nang nạp oxy...'
                ) : (
                  'Thở ra chậm rãi qua miệng trong 8 giây, thả lỏng toàn thân...'
                )
              ) : (
                'Nhấn bắt đầu để thực hiện nhịp hít vào 4s - giữ hơi 7s - thở ra 8s.'
              )}
            </div>
          </div>

          {/* Controls */}
          <div className="space-y-3">
            <div className="glass-card p-3 rounded-xl space-y-1.5 text-xs">
              <div className="font-bold text-white flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-400" /> Lợi ích cho người cao tuổi:
              </div>
              <ul className="text-slate-300 space-y-1 pl-1 text-[11px]">
                <li>• Làm dịu hệ thần kinh giao cảm nhanh chóng</li>
                <li>• Giúp ngủ ngon và phòng ngừa huyết áp dao động</li>
                <li>• Tăng độ thông khí oxy trong máu tự nhiên</li>
              </ul>
            </div>

            <button
              onClick={isBreathingRunning ? stopBreathingSession : startBreathingSession}
              className={`w-full py-3 rounded-xl font-bold text-xs sm:text-sm flex items-center justify-center gap-2 transition shadow-lg cursor-pointer ${
                isBreathingRunning
                  ? 'bg-rose-600 hover:bg-rose-500 text-white'
                  : 'bg-emerald-600 hover:bg-emerald-500 text-white'
              }`}
            >
              {isBreathingRunning ? (
                'TẠM DỪNG BÀI TẬP THỞ'
              ) : (
                <>
                  <Play className="w-4 h-4 fill-white" /> BẮT ĐẦU LUYỆN THỞ 4-7-8
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* WORKOUT CARDS GRID (14 comprehensive exercises) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {filtered.map(workout => (
          <div
            key={workout.id}
            className="glass-card rounded-2xl p-4 flex flex-col justify-between border border-white/10 hover:border-emerald-500/40 transition group"
          >
            <div className="space-y-2.5">
              <div className="flex items-center justify-between">
                <span
                  className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                    workout.category === 'physical'
                      ? 'bg-emerald-500/20 text-emerald-400'
                      : 'bg-purple-500/20 text-purple-400'
                  }`}
                >
                  {workout.category === 'physical' ? 'Thể Chất' : 'Tinh Thần'}
                </span>
                <span className="text-[11px] text-slate-400 flex items-center gap-1">
                  <Clock className="w-3.5 h-3.5" /> {workout.duration}
                </span>
              </div>

              <h4 className="font-bold text-white text-sm group-hover:text-emerald-300 transition line-clamp-1">
                {workout.title}
              </h4>

              <p className="text-xs text-slate-300 line-clamp-2 leading-relaxed">{workout.description}</p>

              <div className="text-[11px] text-slate-400 pt-1 border-t border-white/5 flex items-center justify-between">
                <span>Mức độ: <strong className="text-white">{workout.level}</strong></span>
                <span className="text-cyan-300 font-medium truncate max-w-[140px] text-right">{workout.target}</span>
              </div>
            </div>

            <div className="pt-3 mt-3 border-t border-white/5 flex gap-2">
              <button
                onClick={() => handleOpenWorkoutModal(workout)}
                className="flex-1 py-2.5 rounded-xl bg-emerald-600/20 border border-emerald-500/30 hover:bg-emerald-600 text-emerald-300 hover:text-white font-bold text-xs flex items-center justify-center gap-1.5 transition cursor-pointer shadow-sm"
              >
                <Play className="w-3.5 h-3.5 fill-emerald-400 group-hover:fill-white" />
                <span>Xem Video & Mở Hướng Dẫn</span>
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* MODAL: VIEW WORKOUT VIDEO & DETAILED STEPS (100% RELIABLE PLAYABLE COACH) */}
      {selectedWorkout && (
        <div className="fixed inset-0 bg-black/85 backdrop-blur-md z-50 flex items-center justify-center p-4">
          <div className="glass-panel rounded-3xl p-5 w-full max-w-3xl max-h-[92vh] flex flex-col gap-3 overflow-hidden text-xs">
            {/* Modal Header */}
            <div className="flex justify-between items-center pb-2 border-b border-white/10">
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-400 uppercase">
                    {selectedWorkout.category === 'physical' ? 'Thể chất dưỡng sinh' : 'Tinh thần & Giấc ngủ'}
                  </span>
                  <span className="text-[10px] text-slate-400 font-mono">
                    Thời lượng: {selectedWorkout.duration}
                  </span>
                </div>
                <h3 className="font-bold text-base text-white mt-1">{selectedWorkout.title}</h3>
              </div>
              <button
                onClick={handleCloseWorkoutModal}
                className="text-slate-400 hover:text-white p-1 text-base cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Mode Switcher Tabs */}
            <div className="flex items-center justify-between bg-black/40 p-1.5 rounded-xl border border-white/5">
              <div className="flex gap-1.5">
                <button
                  onClick={() => setVideoMode('animated')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition cursor-pointer ${
                    videoMode === 'animated'
                      ? 'bg-emerald-600 text-white shadow-md'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  <Film className="w-3.5 h-3.5" /> 🎥 Video Huấn Luyện Viên Mô Phỏng (Phát 100% Ổn Định)
                </button>
                <button
                  onClick={() => setVideoMode('online')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition cursor-pointer ${
                    videoMode === 'online' ? 'bg-cyan-600 text-white shadow-md' : 'text-slate-400 hover:text-white'
                  }`}
                >
                  <Video className="w-3.5 h-3.5" /> 🌐 Video Trực Tuyến & YouTube
                </button>
              </div>

              {/* Voice coach toggle */}
              <button
                onClick={() => setVoiceCoachEnabled(!voiceCoachEnabled)}
                className={`px-2.5 py-1.5 rounded-lg text-[11px] font-medium flex items-center gap-1 transition cursor-pointer ${
                  voiceCoachEnabled ? 'bg-purple-600/30 text-purple-300' : 'text-slate-500 hover:text-slate-300'
                }`}
                title="Bật/Tắt giọng đọc hướng dẫn"
              >
                {voiceCoachEnabled ? (
                  <>
                    <Volume2 className="w-3.5 h-3.5 text-purple-400" /> <span>Giọng đọc: Bật</span>
                  </>
                ) : (
                  <>
                    <VolumeX className="w-3.5 h-3.5 text-slate-500" /> <span>Giọng đọc: Tắt</span>
                  </>
                )}
              </button>
            </div>

            {/* Video Player Area */}
            {videoMode === 'animated' ? (
              <div className="space-y-2">
                <div className="relative w-full aspect-video rounded-2xl bg-black overflow-hidden border border-white/10 flex items-center justify-center">
                  <canvas
                    ref={canvasRef}
                    width={640}
                    height={360}
                    className="w-full h-full object-contain"
                  />

                  {/* Play/Pause Center Indicator on pause */}
                  {!isPlaying && (
                    <div
                      onClick={() => setIsPlaying(true)}
                      className="absolute inset-0 bg-black/40 backdrop-blur-[2px] flex items-center justify-center cursor-pointer"
                    >
                      <div className="w-16 h-16 rounded-full bg-emerald-600 text-white flex items-center justify-center shadow-xl shadow-emerald-500/40">
                        <Play className="w-8 h-8 fill-white ml-1" />
                      </div>
                    </div>
                  )}

                  {/* Top-Right Level Badge */}
                  <div className="absolute top-3 right-3 px-2.5 py-1 rounded-lg bg-black/60 backdrop-blur-md border border-white/10 text-white text-[10px] font-bold">
                    Mức độ: <span className="text-emerald-400">{selectedWorkout.level}</span>
                  </div>
                </div>

                {/* Player Control Bar */}
                <div className="p-3 rounded-2xl bg-black/40 border border-white/10 flex flex-wrap items-center justify-between gap-3 text-xs">
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setIsPlaying(!isPlaying)}
                      className="w-8 h-8 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white flex items-center justify-center shadow-md transition cursor-pointer"
                    >
                      {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4 fill-white ml-0.5" />}
                    </button>
                    <button
                      onClick={() => {
                        setPlaybackTime(0);
                        setCurrentStepIndex(0);
                      }}
                      className="w-8 h-8 rounded-xl glass-card text-slate-300 hover:text-white flex items-center justify-center transition cursor-pointer"
                      title="Phát lại từ đầu"
                    >
                      <RotateCcw className="w-4 h-4" />
                    </button>
                    <span className="font-mono text-slate-300 text-[11px] ml-1">
                      {formatSeconds(playbackTime)} / 03:00
                    </span>
                  </div>

                  {/* Current Active Step Highlight */}
                  <div className="text-[11px] text-cyan-300 font-semibold truncate max-w-xs flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-cyan-400 animate-ping" />
                    <span className="truncate">
                      Đang tập bước {currentStepIndex + 1}: {selectedWorkout.steps[currentStepIndex]}
                    </span>
                  </div>

                  {/* Playback speed selector */}
                  <div className="flex items-center gap-1 text-[11px]">
                    <span className="text-slate-400">Tốc độ:</span>
                    {[0.75, 1.0, 1.25].map(spd => (
                      <button
                        key={spd}
                        onClick={() => setPlaybackSpeed(spd)}
                        className={`px-2 py-0.5 rounded transition ${
                          playbackSpeed === spd ? 'bg-cyan-600 text-white font-bold' : 'text-slate-400 hover:text-white'
                        }`}
                      >
                        {spd}x
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            ) : (
              <div className="space-y-2">
                <div className="relative w-full aspect-video rounded-2xl bg-black overflow-hidden border border-white/10 flex items-center justify-center">
                  <iframe
                    src={selectedWorkout.videoUrl || 'https://www.youtube-nocookie.com/embed/dQw4w9WgXcQ'}
                    title={selectedWorkout.title}
                    className="w-full h-full"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                  />
                </div>
                <div className="flex items-center justify-between text-xs text-slate-400 px-1">
                  <span>Trường hợp mạng hạn chế phát video nhúng:</span>
                  <a
                    href={selectedWorkout.videoUrl || 'https://youtube.com'}
                    target="_blank"
                    rel="noreferrer"
                    className="flex items-center gap-1 text-cyan-400 hover:text-cyan-300 font-bold"
                  >
                    <span>Mở video trong Tab mới</span>
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                </div>
              </div>
            )}

            {/* Step by step guide */}
            <div className="space-y-2 overflow-y-auto pr-1 max-h-40 pt-1">
              <h4 className="font-bold text-cyan-300 text-xs uppercase tracking-wider flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-cyan-400" />
                <span>Các bước thực hiện bài tập ({selectedWorkout.duration}):</span>
              </h4>
              <div className="space-y-1.5">
                {selectedWorkout.steps.map((step, idx) => (
                  <div
                    key={idx}
                    className={`p-2.5 rounded-xl flex items-start gap-2.5 transition ${
                      currentStepIndex === idx
                        ? 'bg-emerald-500/20 border border-emerald-500/40 text-emerald-200'
                        : 'glass-card text-slate-200'
                    }`}
                  >
                    <span
                      className={`w-5 h-5 rounded-full flex items-center justify-center font-bold shrink-0 text-[10px] ${
                        currentStepIndex === idx
                          ? 'bg-emerald-500 text-white'
                          : 'bg-white/10 text-slate-300'
                      }`}
                    >
                      {idx + 1}
                    </span>
                    <span className="leading-relaxed text-xs">{step}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Modal Footer */}
            <div className="flex justify-between items-center pt-2 border-t border-white/10">
              <span className="text-[11px] text-slate-400">
                Mục tiêu: <strong className="text-white">{selectedWorkout.target}</strong>
              </span>
              <button
                onClick={handleCloseWorkoutModal}
                className="px-5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl text-xs transition cursor-pointer shadow-md"
              >
                Đã Hoàn Thành Bài Tập ✓
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: ADD / UPLOAD CUSTOM WORKOUT VIDEO */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="glass-panel rounded-3xl p-5 w-full max-w-md space-y-3 text-xs">
            <div className="flex justify-between items-center pb-2 border-b border-white/10">
              <h3 className="font-bold text-sm text-emerald-400 flex items-center gap-2">
                <Plus className="w-4 h-4" /> THÊM BÀI TẬP & TẢI VIDEO YÊU THÍCH
              </h3>
              <button
                onClick={() => setShowAddModal(false)}
                className="text-slate-400 hover:text-white p-1 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateWorkout} className="space-y-2.5">
              <div>
                <label className="block text-slate-400 mb-1">Tên bài tập *</label>
                <input
                  type="text"
                  required
                  placeholder="Ví dụ: Bài tập Dưỡng sinh khớp gối, Yoga thư giãn cổ..."
                  value={newTitle}
                  onChange={e => setNewTitle(e.target.value)}
                  className="w-full glass-input p-2.5 rounded-xl"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-slate-400 mb-1">Thể loại</label>
                  <select
                    value={newCategory}
                    onChange={e => setNewCategory(e.target.value as any)}
                    className="w-full glass-input p-2.5 rounded-xl"
                  >
                    <option value="physical">Thể chất</option>
                    <option value="mental">Tinh thần</option>
                  </select>
                </div>
                <div>
                  <label className="block text-slate-400 mb-1">Thời lượng</label>
                  <input
                    type="text"
                    value={newDuration}
                    onChange={e => setNewDuration(e.target.value)}
                    placeholder="15 phút..."
                    className="w-full glass-input p-2.5 rounded-xl"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-slate-400 mb-1">Mức độ</label>
                  <select
                    value={newLevel}
                    onChange={e => setNewLevel(e.target.value as any)}
                    className="w-full glass-input p-2.5 rounded-xl"
                  >
                    <option value="Nhẹ nhàng">Nhẹ nhàng</option>
                    <option value="Dưỡng sinh">Dưỡng sinh</option>
                    <option value="Vừa sức">Vừa sức</option>
                  </select>
                </div>
                <div>
                  <label className="block text-slate-400 mb-1">Mục tiêu chính</label>
                  <input
                    type="text"
                    value={newTarget}
                    onChange={e => setNewTarget(e.target.value)}
                    className="w-full glass-input p-2.5 rounded-xl"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-400 mb-1">Đường dẫn Video (YouTube Embed hoặc MP4 URL)</label>
                <input
                  type="text"
                  placeholder="https://www.youtube-nocookie.com/embed/..."
                  value={newVideoUrl}
                  onChange={e => setNewVideoUrl(e.target.value)}
                  className="w-full glass-input p-2.5 rounded-xl font-mono text-cyan-300"
                />
              </div>

              <div>
                <label className="block text-slate-400 mb-1">Các bước hướng dẫn tập (mỗi dòng 1 bước)</label>
                <textarea
                  rows={3}
                  value={newSteps}
                  onChange={e => setNewSteps(e.target.value)}
                  className="w-full glass-input p-2.5 rounded-xl resize-none"
                />
              </div>

              <button
                type="submit"
                className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl shadow-md transition cursor-pointer"
              >
                + Lưu Bài Tập Vào Danh Sách
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
