import React, { useState, useEffect } from 'react';
import {
  Volume2,
  VolumeX,
  Play,
  Square,
  Plus,
  Sparkles,
  Clock,
  RotateCw,
  Sliders,
  Music,
  Trash2,
  CheckCircle,
  Download,
  Flame,
  Radio
} from 'lucide-react';
import { SoundTrack } from '../types';
import { playSynthesizedTrack, stopAllSounds } from '../utils/audioSynth';
import { generateSoundWithAI } from '../utils/geminiClient';

interface AudioTabProps {
  tracks: SoundTrack[];
  onAddTrack: (track: SoundTrack) => void;
  onDeleteTrack: (trackId: string) => void;
  apiKey?: string;
}

export const AudioTab: React.FC<AudioTabProps> = ({
  tracks,
  onAddTrack,
  onDeleteTrack,
  apiKey,
}) => {
  const [activeTrackId, setActiveTrackId] = useState<string | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [volume, setVolume] = useState(65);

  // Timer: 0 means unlimited, or custom minutes
  const [timerMinutes, setTimerMinutes] = useState<number>(30);
  const [customTimerInput, setCustomTimerInput] = useState('45');
  const [timerRemainingSeconds, setTimerRemainingSeconds] = useState<number | null>(null);

  // Add custom track modal
  const [showAddModal, setShowAddModal] = useState(false);
  const [customTitle, setCustomTitle] = useState('');
  const [customSubtitle, setCustomSubtitle] = useState('');
  const [customCategory, setCustomCategory] = useState<'sleep' | 'relax' | 'focus' | 'custom'>('relax');
  const [customSynth, setCustomSynth] = useState<'rain' | 'waves' | 'delta' | 'stream' | 'bowl528' | 'piano'>('piano');

  // AI Sound Generator state
  const [aiPrompt, setAiPrompt] = useState('');
  const [aiDuration, setAiDuration] = useState(5);
  const [isGeneratingAiSound, setIsGeneratingAiSound] = useState(false);
  const [generatedAiTrack, setGeneratedAiTrack] = useState<any | null>(null);

  // Timer countdown effect
  useEffect(() => {
    let interval: any = null;
    if (isPlaying && timerMinutes > 0) {
      if (timerRemainingSeconds === null) {
        setTimerRemainingSeconds(timerMinutes * 60);
      }
      interval = setInterval(() => {
        setTimerRemainingSeconds(prev => {
          if (prev === null || prev <= 1) {
            // Timer expired: stop sound
            stopSound();
            return null;
          }
          return prev - 1;
        });
      }, 1000);
    } else if (!isPlaying) {
      setTimerRemainingSeconds(null);
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isPlaying, timerMinutes]);

  const handlePlayTrack = (track: SoundTrack) => {
    if (activeTrackId === track.id && isPlaying) {
      stopSound();
      return;
    }

    setActiveTrackId(track.id);
    setIsPlaying(true);
    if (timerMinutes > 0) {
      setTimerRemainingSeconds(timerMinutes * 60);
    } else {
      setTimerRemainingSeconds(null);
    }
    playSynthesizedTrack(track.synthType, volume / 100);
  };

  const stopSound = () => {
    stopAllSounds();
    setIsPlaying(false);
    setActiveTrackId(null);
    setTimerRemainingSeconds(null);
  };

  const handleVolumeChange = (newVol: number) => {
    setVolume(newVol);
    if (isPlaying && activeTrackId) {
      const track = tracks.find(t => t.id === activeTrackId);
      if (track) {
        playSynthesizedTrack(track.synthType, newVol / 100);
      }
    }
  };

  const handleAddCustomTrack = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customTitle.trim()) return;

    const newTrack: SoundTrack = {
      id: 'sound-custom-' + Date.now(),
      title: customTitle.trim(),
      subtitle: customSubtitle || 'Nhạc người dùng thêm',
      category: customCategory,
      frequency: 'Tự chọn',
      icon: '🎵',
      synthType: customSynth,
      isCustom: true,
    };

    onAddTrack(newTrack);
    setShowAddModal(false);
    setCustomTitle('');
    setCustomSubtitle('');
  };

  // AI Sound Generator
  const handleGenerateAiSound = async () => {
    if (!aiPrompt.trim() || isGeneratingAiSound) return;
    setIsGeneratingAiSound(true);
    setGeneratedAiTrack(null);

    try {
      const res = await generateSoundWithAI(aiPrompt.trim(), aiDuration, apiKey);
      setGeneratedAiTrack(res);
    } catch (err) {
      console.error(err);
    } finally {
      setIsGeneratingAiSound(false);
    }
  };

  const handleSaveAiTrackToList = () => {
    if (!generatedAiTrack) return;
    const newTrack: SoundTrack = {
      id: 'sound-ai-' + Date.now(),
      title: generatedAiTrack.theme || `Âm thanh AI: ${aiPrompt.slice(0, 20)}`,
      subtitle: generatedAiTrack.description || 'Sinh bởi AI Gemini',
      category: 'ai',
      frequency: generatedAiTrack.frequency || '432 Hz',
      icon: '✨',
      synthType: 'ai_ambient',
      isCustom: true,
    };
    onAddTrack(newTrack);
    alert('Đã lưu bản âm thanh AI vào danh sách thư giãn!');
  };

  const formatRemainingTime = (totalSec: number) => {
    const mins = Math.floor(totalSec / 60);
    const secs = totalSec % 60;
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  return (
    <div className="space-y-4">
      {/* HEADER */}
      <div className="glass-panel rounded-2xl p-4 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-base sm:text-lg font-bold text-white flex items-center gap-2">
            <Music className="w-5 h-5 text-purple-400" /> ÂM THANH
          </h2>
          <p className="text-xs text-slate-400">
            Âm thanh thư giãn, hỗ trợ giấc ngủ sâu, học tập tập trung và công cụ tạo âm thanh sinh học bằng AI
          </p>
        </div>

        <div className="flex items-center gap-2">
          {isPlaying && (
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-purple-500/20 border border-purple-500/30 text-purple-300 text-xs font-bold animate-pulse">
              <span className="w-2 h-2 rounded-full bg-purple-400 animate-ping" />
              <span>Đang phát: {tracks.find(t => t.id === activeTrackId)?.title}</span>
            </div>
          )}

          <button
            onClick={() => setShowAddModal(true)}
            className="px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs flex items-center gap-1.5 shadow-md transition cursor-pointer"
          >
            <Plus className="w-4 h-4" /> + Thêm Nhạc Mới
          </button>
        </div>
      </div>

      {/* TRACKS LIST (At least 5 tracks for sleep, relax, focus without the old wind/HEPA sound) */}
      <div className="glass-panel rounded-2xl p-5 space-y-4">
        <div className="flex items-center justify-between pb-2 border-b border-white/10">
          <h3 className="text-sm font-bold text-purple-300 uppercase tracking-wider flex items-center gap-2">
            <Radio className="w-4 h-4 text-purple-400" /> DANH SÁCH ÂM THANH TRỊ LIỆU & GIẤC NGỦ ({tracks.length})
          </h3>
          <span className="text-[11px] text-slate-400">Âm thanh thiên nhiên & Sóng não phục hồi</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {tracks.map(track => {
            const isThisPlaying = activeTrackId === track.id && isPlaying;
            return (
              <div
                key={track.id}
                className={`p-3.5 rounded-2xl border transition-all flex flex-col justify-between ${
                  isThisPlaying
                    ? 'border-purple-400 bg-purple-600/25 shadow-[0_0_20px_rgba(168,85,247,0.35)]'
                    : 'glass-card border-white/5 hover:border-purple-500/30'
                }`}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">{track.icon}</span>
                    <div>
                      <h4 className="font-bold text-white text-xs sm:text-sm">{track.title}</h4>
                      <p className="text-[10px] text-slate-300 mt-0.5">{track.subtitle}</p>
                    </div>
                  </div>
                  <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-purple-500/30 text-purple-200 shrink-0">
                    {track.frequency}
                  </span>
                </div>

                <div className="flex items-center justify-between pt-3 mt-3 border-t border-white/5">
                  <span className="text-[10px] text-slate-400 uppercase">
                    {track.category === 'sleep'
                      ? 'Giấc ngủ'
                      : track.category === 'relax'
                      ? 'Thư giãn'
                      : track.category === 'focus'
                      ? 'Tập trung'
                      : 'AI Sinh'}
                  </span>

                  <div className="flex items-center gap-2">
                    {track.isCustom && (
                      <button
                        onClick={() => onDeleteTrack(track.id)}
                        className="p-1 text-slate-500 hover:text-rose-400 transition"
                        title="Xóa bài hát"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                    <button
                      onClick={() => handlePlayTrack(track)}
                      className={`px-3.5 py-1.5 rounded-xl font-bold text-xs flex items-center gap-1.5 transition cursor-pointer ${
                        isThisPlaying
                          ? 'bg-rose-600 hover:bg-rose-500 text-white'
                          : 'bg-purple-600 hover:bg-purple-500 text-white'
                      }`}
                    >
                      {isThisPlaying ? (
                        <>
                          <Square className="w-3.5 h-3.5 fill-white" /> Dừng
                        </>
                      ) : (
                        <>
                          <Play className="w-3.5 h-3.5 fill-white" /> Phát
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* AUDIO CONTROLLER: VOLUME & UNLIMITED / CUSTOM TIMER SETTINGS */}
        <div className="p-4 rounded-2xl glass-card border border-white/10 space-y-3 pt-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Volume */}
            <div className="space-y-2">
              <div className="flex justify-between items-center text-xs">
                <span className="text-slate-300 flex items-center gap-1.5">
                  <Volume2 className="w-4 h-4 text-purple-400" /> Âm lượng phát:
                </span>
                <span className="font-bold text-purple-400">{volume}%</span>
              </div>
              <input
                type="range"
                min="0"
                max="100"
                value={volume}
                onChange={e => handleVolumeChange(parseInt(e.target.value))}
                className="w-full accent-purple-500 bg-slate-700 h-2 rounded-lg cursor-pointer"
              />
            </div>

            {/* Timer (Cài đặt thời gian sử dụng âm thanh thoải mái, không giới hạn) */}
            <div className="space-y-2">
              <div className="flex justify-between items-center text-xs">
                <span className="text-slate-300 flex items-center gap-1.5">
                  <Clock className="w-4 h-4 text-amber-400" /> Hẹn giờ tắt âm thanh:
                </span>
                <span className="font-bold text-amber-400">
                  {timerRemainingSeconds !== null
                    ? `Còn lại: ${formatRemainingTime(timerRemainingSeconds)}`
                    : timerMinutes === 0
                    ? 'Phát không giới hạn'
                    : `${timerMinutes} phút`}
                </span>
              </div>

              {/* Timer presets */}
              <div className="flex items-center gap-1.5 flex-wrap">
                <button
                  onClick={() => {
                    setTimerMinutes(15);
                    setTimerRemainingSeconds(15 * 60);
                  }}
                  className={`px-2.5 py-1 rounded-lg text-xs font-bold transition ${
                    timerMinutes === 15 ? 'bg-amber-500 text-slate-950' : 'glass-card text-slate-300'
                  }`}
                >
                  15p
                </button>
                <button
                  onClick={() => {
                    setTimerMinutes(30);
                    setTimerRemainingSeconds(30 * 60);
                  }}
                  className={`px-2.5 py-1 rounded-lg text-xs font-bold transition ${
                    timerMinutes === 30 ? 'bg-amber-500 text-slate-950' : 'glass-card text-slate-300'
                  }`}
                >
                  30p
                </button>
                <button
                  onClick={() => {
                    setTimerMinutes(60);
                    setTimerRemainingSeconds(60 * 60);
                  }}
                  className={`px-2.5 py-1 rounded-lg text-xs font-bold transition ${
                    timerMinutes === 60 ? 'bg-amber-500 text-slate-950' : 'glass-card text-slate-300'
                  }`}
                >
                  60p
                </button>
                <button
                  onClick={() => {
                    setTimerMinutes(120);
                    setTimerRemainingSeconds(120 * 60);
                  }}
                  className={`px-2.5 py-1 rounded-lg text-xs font-bold transition ${
                    timerMinutes === 120 ? 'bg-amber-500 text-slate-950' : 'glass-card text-slate-300'
                  }`}
                >
                  120p
                </button>
                <button
                  onClick={() => {
                    setTimerMinutes(0);
                    setTimerRemainingSeconds(null);
                  }}
                  className={`px-2.5 py-1 rounded-lg text-xs font-bold transition ${
                    timerMinutes === 0 ? 'bg-emerald-500 text-slate-950' : 'glass-card text-slate-300'
                  }`}
                >
                  ∞ Không giới hạn
                </button>

                {/* Custom minutes input */}
                <div className="flex items-center gap-1 ml-auto">
                  <input
                    type="number"
                    min="1"
                    max="999"
                    value={customTimerInput}
                    onChange={e => setCustomTimerInput(e.target.value)}
                    className="w-16 glass-input px-2 py-0.5 rounded text-xs text-center"
                    placeholder="Phút"
                  />
                  <button
                    onClick={() => {
                      const val = parseInt(customTimerInput) || 30;
                      setTimerMinutes(val);
                      setTimerRemainingSeconds(val * 60);
                    }}
                    className="px-2 py-1 bg-slate-700 hover:bg-slate-600 text-white rounded text-xs font-semibold"
                  >
                    Áp dụng
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* TẠO ÂM THANH BẰNG AI (AI Sound & Speech Generator) */}
      <div className="glass-panel rounded-2xl p-5 space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-2 pb-2 border-b border-white/10">
          <div>
            <h3 className="text-sm font-bold text-amber-400 flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-amber-400" /> TẠO ÂM THANH SINH HỌC & GIỌNG ĐỌC BẰNG AI
            </h3>
            <p className="text-xs text-slate-300">
              Mô hình AI tương đương ChatGPT/Gemini tạo bản hòa âm tần số Solfeggio, tiếng thiên nhiên và nhạc trị liệu
            </p>
          </div>
          <span className="text-xs px-2.5 py-0.5 rounded-full bg-purple-500/20 text-purple-300 font-bold">
            AI Studio Sound Engine
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
          <div className="md:col-span-2 space-y-1.5">
            <label className="text-xs text-slate-300 block">
              Mô tả âm thanh bạn muốn AI tạo (ví dụ: "Tiếng mưa phùn và chuông xoay 5 phút ru ngủ", "Sóng não 528Hz giảm đau đầu"):
            </label>
            <input
              type="text"
              placeholder="Nhập ý tưởng âm thanh muốn sinh..."
              value={aiPrompt}
              onChange={e => setAiPrompt(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleGenerateAiSound()}
              className="w-full glass-input p-2.5 rounded-xl text-xs text-white"
            />
          </div>

          <div className="flex gap-2">
            <div className="w-24">
              <label className="text-xs text-slate-400 block mb-1">Thời lượng:</label>
              <select
                value={aiDuration}
                onChange={e => setAiDuration(parseInt(e.target.value))}
                className="w-full glass-input p-2.5 rounded-xl text-xs"
              >
                <option value={3}>3 phút</option>
                <option value={5}>5 phút</option>
                <option value={10}>10 phút</option>
                <option value={20}>20 phút</option>
              </select>
            </div>

            <button
              onClick={handleGenerateAiSound}
              disabled={isGeneratingAiSound || !aiPrompt.trim()}
              className="flex-1 py-2.5 gemini-gradient-bg text-white font-bold text-xs rounded-xl shadow-md transition disabled:opacity-50 cursor-pointer flex items-center justify-center gap-1.5"
            >
              <Sparkles className="w-4 h-4" />
              {isGeneratingAiSound ? 'Đang tạo...' : 'Tạo Âm Thanh AI'}
            </button>
          </div>
        </div>

        {/* AI Output Card */}
        {generatedAiTrack && (
          <div className="p-4 rounded-2xl glass-card border border-amber-500/30 space-y-3 bg-amber-950/15 animate-in fade-in text-xs">
            <div className="flex items-center justify-between">
              <div>
                <span className="text-[10px] px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 font-bold">
                  Bản Âm Thanh AI Đã Tạo Thành Công
                </span>
                <h4 className="font-bold text-sm text-white mt-1">{generatedAiTrack.theme}</h4>
              </div>
              <span className="px-2.5 py-1 rounded-xl bg-purple-500/30 text-purple-200 font-mono font-bold text-xs">
                {generatedAiTrack.frequency}
              </span>
            </div>

            <p className="text-xs text-slate-300 leading-relaxed">{generatedAiTrack.description}</p>

            <div className="flex items-center gap-2 text-[11px] text-slate-400 flex-wrap">
              <span>Hòa âm:</span>
              {generatedAiTrack.soundElements?.map((elem: string, idx: number) => (
                <span key={idx} className="px-2 py-0.5 rounded-md bg-white/5 border border-white/10 text-slate-200">
                  {elem}
                </span>
              ))}
              <span className="ml-auto text-emerald-400">Đồng bộ nhịp tim: ~{generatedAiTrack.bpmSync} BPM</span>
            </div>

            <div className="flex gap-2 pt-2 border-t border-white/10">
              <button
                onClick={() => {
                  stopSound();
                  setIsPlaying(true);
                  playSynthesizedTrack('bowl528', volume / 100);
                }}
                className="flex-1 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl text-xs flex items-center justify-center gap-1.5 transition"
              >
                <Play className="w-3.5 h-3.5 fill-white" /> Nghe Thử Âm Thanh AI
              </button>
              <button
                onClick={handleSaveAiTrackToList}
                className="px-4 py-2 bg-purple-600 hover:bg-purple-500 text-white font-bold rounded-xl text-xs transition"
              >
                + Lưu Vào Danh Sách Nhạc
              </button>
            </div>
          </div>
        )}
      </div>

      {/* MODAL: THÊM NHẠC MỚI */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="glass-panel rounded-3xl p-5 w-full max-w-md space-y-3 text-xs">
            <div className="flex justify-between items-center pb-2 border-b border-white/10">
              <h3 className="font-bold text-sm text-purple-400 flex items-center gap-2">
                <Plus className="w-4 h-4" /> THÊM BẢN NHẠC YÊU THÍCH
              </h3>
              <button
                onClick={() => setShowAddModal(false)}
                className="text-slate-400 hover:text-white p-1 cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleAddCustomTrack} className="space-y-3">
              <div>
                <label className="block text-slate-400 mb-1">Tên bản nhạc / âm thanh *</label>
                <input
                  type="text"
                  required
                  placeholder="Ví dụ: Nhạc niệm Phật an nhiên, Tiếng mưa trên mái tôn..."
                  value={customTitle}
                  onChange={e => setCustomTitle(e.target.value)}
                  className="w-full glass-input p-2.5 rounded-xl"
                />
              </div>

              <div>
                <label className="block text-slate-400 mb-1">Mô tả tác dụng</label>
                <input
                  type="text"
                  placeholder="Ví dụ: Ru ngủ nhanh, thư giãn cơ bắp..."
                  value={customSubtitle}
                  onChange={e => setCustomSubtitle(e.target.value)}
                  className="w-full glass-input p-2.5 rounded-xl"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-slate-400 mb-1">Danh mục</label>
                  <select
                    value={customCategory}
                    onChange={e => setCustomCategory(e.target.value as any)}
                    className="w-full glass-input p-2.5 rounded-xl"
                  >
                    <option value="sleep">Giấc ngủ</option>
                    <option value="relax">Thư giãn</option>
                    <option value="focus">Tập trung</option>
                    <option value="custom">Tự chọn</option>
                  </select>
                </div>
                <div>
                  <label className="block text-slate-400 mb-1">Âm sắc tổng hợp</label>
                  <select
                    value={customSynth}
                    onChange={e => setCustomSynth(e.target.value as any)}
                    className="w-full glass-input p-2.5 rounded-xl"
                  >
                    <option value="piano">Piano êm dịu</option>
                    <option value="rain">Tiếng mưa rào</option>
                    <option value="waves">Sóng biển vỗ bờ</option>
                    <option value="stream">Suối róc rách</option>
                    <option value="bowl528">Chuông xoay 528Hz</option>
                    <option value="delta">Sóng não Delta 4.5Hz</option>
                  </select>
                </div>
              </div>

              <button
                type="submit"
                className="w-full py-2.5 bg-purple-600 hover:bg-purple-500 text-white font-bold rounded-xl shadow-md transition cursor-pointer"
              >
                + Lưu Bản Nhạc Vào Danh Sách
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
