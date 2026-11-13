import React, { useState } from 'react';
import {
  Users,
  Plus,
  Utensils,
  Sparkles,
  Heart,
  Activity,
  AlertCircle,
  CheckCircle,
  Clock,
  Trash2,
  Apple,
  AlertTriangle,
  UserPlus
} from 'lucide-react';
import { Member, FoodEvaluationResult } from '../types';
import { evaluateFoodWithAI } from '../utils/geminiClient';

interface FamilyHealthTabProps {
  members: Member[];
  onAddMember: (member: Member) => void;
  onUpdateMember: (member: Member) => void;
  onDeleteMember: (id: string) => void;
  apiKey?: string;
}

export const FamilyHealthTab: React.FC<FamilyHealthTabProps> = ({
  members,
  onAddMember,
  onUpdateMember,
  onDeleteMember,
  apiKey,
}) => {
  const [selectedMemberId, setSelectedMemberId] = useState<string>(
    members.length > 0 ? members[0].id : ''
  );

  // Add Member Modal
  const [showAddModal, setShowAddModal] = useState(false);
  const [memName, setMemName] = useState('');
  const [memAge, setMemAge] = useState(65);
  const [memGender, setMemGender] = useState<'Nam' | 'Nữ'>('Nam');
  const [memHeight, setMemHeight] = useState(165);
  const [memWeight, setMemWeight] = useState(62);
  const [memBlood, setMemBlood] = useState<'O' | 'A' | 'B' | 'AB'>('O');
  const [memConditions, setMemConditions] = useState('Huyết áp ổn định, Khớp gối nhẹ');
  const [memAllergies, setMemAllergies] = useState('Không có');
  const [memEmergency, setMemEmergency] = useState('0988 123 456');

  // Activity Log
  const [logType, setLogType] = useState('🏃 Đi bộ nhẹ nhàng 20 phút');
  const [logNote, setLogNote] = useState('');

  // AI Food Evaluator state
  const [foodQuery, setFoodQuery] = useState('');
  const [isEvaluatingFood, setIsEvaluatingFood] = useState(false);
  const [foodResult, setFoodResult] = useState<FoodEvaluationResult | null>(null);

  const activeMember = members.find(m => m.id === selectedMemberId) || (members.length > 0 ? members[0] : null);

  const handleAddMember = (e: React.FormEvent) => {
    e.preventDefault();
    if (!memName.trim()) return;

    const newMem: Member = {
      id: 'mem-' + Date.now(),
      name: memName.trim(),
      age: memAge,
      gender: memGender,
      height: memHeight,
      weight: memWeight,
      bloodType: memBlood,
      conditions: memConditions || 'Bình thường',
      allergies: memAllergies || 'Không có',
      emergencyContact: memEmergency || '115',
      avgSpO2: 98,
      restBPM: 75,
      bodyTemp: 36.6,
      wristbandId: 'BLE-BAND-0' + (members.length + 1),
      logs: [
        {
          id: 'log-init-' + Date.now(),
          time: new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }),
          type: 'Thiết lập hồ sơ',
          note: 'Khởi tạo hồ sơ sức khỏe thành viên',
        },
      ],
    };

    onAddMember(newMem);
    setSelectedMemberId(newMem.id);
    setShowAddModal(false);
    setMemName('');
  };

  const handleAddLog = () => {
    if (!activeMember) return;
    const newEntry = {
      id: 'log-' + Date.now(),
      time: new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }),
      type: logType,
      note: logNote ? `(${logNote})` : '',
    };
    const updated = {
      ...activeMember,
      logs: [newEntry, ...activeMember.logs],
    };
    onUpdateMember(updated);
    setLogNote('');
  };

  const handleDeleteLog = (logId: string) => {
    if (!activeMember) return;
    const updated = {
      ...activeMember,
      logs: activeMember.logs.filter(l => l.id !== logId),
    };
    onUpdateMember(updated);
  };

  const handleEvaluateFood = async () => {
    if (!foodQuery.trim() || !activeMember || isEvaluatingFood) return;
    setIsEvaluatingFood(true);
    setFoodResult(null);

    try {
      const res = await evaluateFoodWithAI(foodQuery.trim(), activeMember, apiKey);
      setFoodResult(res);
    } catch (e) {
      console.error(e);
    } finally {
      setIsEvaluatingFood(false);
    }
  };

  const handleSaveFoodToLog = () => {
    if (!activeMember || !foodResult) return;
    const statusIcon = foodResult.status === 'safe' ? '✓' : foodResult.status === 'caution' ? '⚠️' : '❌';
    const newEntry = {
      id: 'log-food-' + Date.now(),
      time: new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }),
      type: `🍱 Đánh giá món: ${foodResult.foodName}`,
      note: `(AI chấm: ${foodResult.score}/100 ${statusIcon} - ${foodResult.summary})`,
    };
    const updated = {
      ...activeMember,
      logs: [newEntry, ...activeMember.logs],
    };
    onUpdateMember(updated);
    alert(`Đã lưu đánh giá món "${foodResult.foodName}" vào Nhật ký sinh hoạt của ${activeMember.name}!`);
  };

  // BMI Calculation
  const bmi = activeMember
    ? Math.round((activeMember.weight / Math.pow(activeMember.height / 100, 2)) * 10) / 10
    : 0;

  return (
    <div className="space-y-4">
      {/* HEADER BAR */}
      <div className="glass-panel rounded-2xl p-4 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-base sm:text-lg font-bold text-white flex items-center gap-2">
            <Users className="w-5 h-5 text-emerald-400" /> SỨC KHỎE GIA ĐÌNH
          </h2>
          <p className="text-xs text-slate-400">
            Quản lý sinh hoạt từng thành viên, nhật ký sinh hoạt riêng và AI đánh giá an toàn thực phẩm
          </p>
        </div>

        <button
          onClick={() => setShowAddModal(true)}
          className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center gap-2 shadow-md transition cursor-pointer"
        >
          <UserPlus className="w-4 h-4" /> + Thêm thành viên mới
        </button>
      </div>

      {/* MEMBER SELECTOR TABS (Empty initially unless user adds them) */}
      {members.length === 0 ? (
        <div className="glass-panel rounded-2xl p-8 text-center space-y-3 border border-dashed border-white/10">
          <div className="w-16 h-16 rounded-full bg-emerald-500/10 text-emerald-400 flex items-center justify-center mx-auto text-2xl">
            <Users className="w-8 h-8" />
          </div>
          <h3 className="font-bold text-white text-base">Danh sách thành viên hiện đang trống</h3>
          <p className="text-xs text-slate-400 max-w-md mx-auto">
            Hệ thống không cài đặt sẵn danh sách mặc định để quý người dùng tự do thiết lập. Nhấn nút bên dưới để tạo hồ
            sơ sức khỏe cho người thân trong gia đình.
          </p>
          <button
            onClick={() => setShowAddModal(true)}
            className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-lg transition inline-flex items-center gap-2 cursor-pointer"
          >
            <UserPlus className="w-4 h-4" /> Bắt Đầu Thiết Lập Thành Viên Đầu Tiên
          </button>
        </div>
      ) : (
        <>
          {/* Member Tabs */}
          <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-none">
            {members.map(m => (
              <button
                key={m.id}
                onClick={() => setSelectedMemberId(m.id)}
                className={`px-4 py-2 rounded-xl text-xs font-bold shrink-0 transition flex items-center gap-2 cursor-pointer ${
                  m.id === (activeMember?.id || '')
                    ? 'bg-emerald-600 text-white shadow-md'
                    : 'glass-card text-slate-300 hover:text-white'
                }`}
              >
                <span>{m.name}</span>
                <span className="text-[10px] opacity-75">({m.age}t)</span>
              </button>
            ))}
          </div>

          {activeMember && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
              {/* MEMBER PROFILE CARD */}
              <div className="glass-panel rounded-2xl p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-14 h-14 rounded-2xl gemini-gradient-bg flex items-center justify-center text-xl text-white font-extrabold shadow-md">
                      {activeMember.name.slice(0, 2).toUpperCase()}
                    </div>
                    <div>
                      <h3 className="text-base font-bold text-white">{activeMember.name}</h3>
                      <div className="flex items-center gap-1.5 text-xs text-slate-400">
                        <span>{activeMember.age} Tuổi</span>
                        <span>•</span>
                        <span>{activeMember.gender}</span>
                        <span>•</span>
                        <span className="text-emerald-400 font-bold">Nhóm máu {activeMember.bloodType}</span>
                      </div>
                    </div>
                  </div>

                  <button
                    onClick={() => {
                      if (confirm(`Bạn có chắc muốn xóa hồ sơ ${activeMember.name}?`)) {
                        onDeleteMember(activeMember.id);
                      }
                    }}
                    className="p-1.5 text-slate-500 hover:text-rose-400 transition"
                    title="Xóa hồ sơ"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>

                <div className="grid grid-cols-3 gap-2 text-center pt-2 border-t border-white/5">
                  <div className="glass-card p-2 rounded-xl">
                    <div className="text-[10px] text-slate-400">Chiều cao</div>
                    <div className="font-bold text-xs text-white">{activeMember.height} cm</div>
                  </div>
                  <div className="glass-card p-2 rounded-xl">
                    <div className="text-[10px] text-slate-400">Cân nặng</div>
                    <div className="font-bold text-xs text-white">{activeMember.weight} kg</div>
                  </div>
                  <div className="glass-card p-2 rounded-xl">
                    <div className="text-[10px] text-slate-400">BMI</div>
                    <div
                      className={`font-bold text-xs ${
                        bmi >= 18.5 && bmi <= 24.9 ? 'text-emerald-400' : 'text-amber-400'
                      }`}
                    >
                      {bmi}
                    </div>
                  </div>
                </div>

                <div className="glass-card p-3 rounded-xl text-xs space-y-1.5 border border-white/5">
                  <div className="text-slate-400">
                    Bệnh nền:{' '}
                    <strong className="text-amber-300 font-semibold">{activeMember.conditions}</strong>
                  </div>
                  <div className="text-slate-400">
                    Dị ứng:{' '}
                    <strong className="text-slate-200">{activeMember.allergies || 'Không có'}</strong>
                  </div>
                  <div className="text-slate-400">
                    Liên hệ SOS:{' '}
                    <strong className="text-rose-400 font-bold">{activeMember.emergencyContact}</strong>
                  </div>
                  <div className="text-slate-400">
                    Vòng tay ghép nối:{' '}
                    <strong className="text-purple-300 font-mono text-[11px]">
                      {activeMember.wristbandId || 'Chưa liên kết'}
                    </strong>
                  </div>
                </div>
              </div>

              {/* NHẬT KÝ SINH HOẠT RIÊNG CỦA THÀNH VIÊN */}
              <div className="glass-panel rounded-2xl p-4 space-y-3">
                <div className="flex items-center justify-between pb-2 border-b border-white/10">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-cyan-400 flex items-center gap-1.5">
                    <Clock className="w-4 h-4" /> NHẬT KÝ SINH HOẠT - {activeMember.name}
                  </h4>
                  <span className="text-[10px] text-slate-400">{activeMember.logs.length} bản ghi</span>
                </div>

                {/* Ghi nhanh nhật ký */}
                <div className="space-y-2">
                  <select
                    value={logType}
                    onChange={e => setLogType(e.target.value)}
                    className="w-full glass-input p-2 rounded-xl text-xs"
                  >
                    <option value="🏃 Đi bộ nhẹ nhàng 20 phút">🏃 Đi bộ nhẹ nhàng 20 phút</option>
                    <option value="💧 Uống 1 ly nước ấm 250ml">💧 Uống 1 ly nước ấm 250ml</option>
                    <option value="🩺 Đo huyết áp & sinh hiệu">🩺 Đo huyết áp & sinh hiệu</option>
                    <option value="😴 Giấc ngủ trưa 30 phút">😴 Giấc ngủ trưa 30 phút</option>
                    <option value="🧘 Tập thở 4-7-8 thư giãn">🧘 Tập thở 4-7-8 thư giãn</option>
                    <option value="☕ Uống trà thảo mộc hoa cúc">☕ Uống trà thảo mộc hoa cúc</option>
                  </select>

                  <div className="flex gap-2">
                    <input
                      type="text"
                      placeholder="Ghi chú thêm (cảm giác, huyết áp...)"
                      value={logNote}
                      onChange={e => setLogNote(e.target.value)}
                      onKeyDown={e => e.key === 'Enter' && handleAddLog()}
                      className="flex-1 glass-input p-2 rounded-xl text-xs"
                    />
                    <button
                      onClick={handleAddLog}
                      className="px-3.5 py-2 bg-cyan-600 hover:bg-cyan-500 text-white font-bold text-xs rounded-xl shadow-md transition cursor-pointer"
                    >
                      + Ghi
                    </button>
                  </div>
                </div>

                {/* Danh sách nhật ký */}
                <div className="space-y-1.5 max-h-56 overflow-y-auto pr-1">
                  {activeMember.logs.length === 0 ? (
                    <div className="p-4 rounded-xl glass-card text-center text-xs text-slate-500 border border-dashed border-white/10">
                      Chưa có nhật ký nào cho {activeMember.name}.
                    </div>
                  ) : (
                    activeMember.logs.map(log => (
                      <div
                        key={log.id}
                        className="p-2.5 rounded-xl glass-card text-xs flex items-center justify-between gap-2 border border-white/5"
                      >
                        <div className="space-y-0.5 overflow-hidden">
                          <div className="text-slate-200 font-medium truncate">
                            <span className="text-cyan-300 font-mono text-[10px] mr-1.5">{log.time}</span>
                            {log.type}
                          </div>
                          {log.note && <div className="text-[11px] text-slate-400 pl-4">{log.note}</div>}
                        </div>
                        <button
                          onClick={() => handleDeleteLog(log.id)}
                          className="p-1 text-slate-500 hover:text-rose-400 transition cursor-pointer shrink-0"
                          title="Xóa dòng này"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ))
                  )}
                </div>
              </div>

              {/* TÍCH HỢP AI ĐÁNH GIÁ THỨC ĂN (AI Food & Nutrition Evaluator) */}
              <div className="glass-panel rounded-2xl p-4 space-y-3 flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between pb-2 border-b border-white/10">
                    <h4 className="text-xs font-bold uppercase tracking-wider text-amber-400 flex items-center gap-1.5">
                      <Utensils className="w-4 h-4 text-amber-400" /> AI ĐÁNH GIÁ THỰC PHẨM & BỮA ĂN
                    </h4>
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-purple-500/20 text-purple-300 font-bold">
                      Gemini Y Học
                    </span>
                  </div>

                  <p className="text-[11px] text-slate-300 mt-2">
                    Kiểm tra xem món ăn sắp dùng có phù hợp với{' '}
                    <strong className="text-white">{activeMember.name}</strong> ({activeMember.conditions}) không:
                  </p>

                  <div className="flex gap-2 mt-2">
                    <input
                      type="text"
                      placeholder="Nhập món ăn (ví dụ: Phở bò béo, Dưa chua mặn, Cá lóc kho tộ, Chè ngọt...)"
                      value={foodQuery}
                      onChange={e => setFoodQuery(e.target.value)}
                      onKeyDown={e => e.key === 'Enter' && handleEvaluateFood()}
                      className="flex-1 glass-input p-2 rounded-xl text-xs"
                    />
                    <button
                      onClick={handleEvaluateFood}
                      disabled={isEvaluatingFood || !foodQuery.trim()}
                      className="px-3.5 py-2 gemini-gradient-bg text-white font-bold text-xs rounded-xl shadow-md transition disabled:opacity-50 cursor-pointer flex items-center gap-1"
                    >
                      <Sparkles className="w-3.5 h-3.5" />
                      {isEvaluatingFood ? 'Đang xét...' : 'Đánh giá AI'}
                    </button>
                  </div>
                </div>

                {/* Result Card */}
                {foodResult && (
                  <div className="mt-2 p-3 rounded-xl glass-card border border-white/10 space-y-2 text-xs animate-in fade-in">
                    <div className="flex items-center justify-between">
                      <div className="font-bold text-white text-xs sm:text-sm">{foodResult.foodName}</div>
                      <span
                        className={`px-2 py-0.5 rounded-md font-bold text-[10px] ${
                          foodResult.status === 'safe'
                            ? 'bg-emerald-500/20 text-emerald-400'
                            : foodResult.status === 'caution'
                            ? 'bg-yellow-500/20 text-yellow-400'
                            : 'bg-rose-500/20 text-rose-400'
                        }`}
                      >
                        {foodResult.status === 'safe'
                          ? '✓ An Toàn Phù Hợp'
                          : foodResult.status === 'caution'
                          ? '⚠️ Cần Chú Ý'
                          : '❌ Nguy Hại - Nên Kiêng'}
                      </span>
                    </div>

                    <div className="text-[11px] text-slate-200 leading-relaxed">{foodResult.summary}</div>

                    <div className="p-2 rounded-lg bg-black/30 border border-white/5 space-y-1 text-[11px]">
                      <div className="text-cyan-300 font-semibold">• Lời khuyên cụ thể:</div>
                      <div className="text-slate-300">{foodResult.advice}</div>
                    </div>

                    <div className="flex items-center justify-between text-[10px] text-slate-400 pt-1 border-t border-white/5">
                      <span>Năng lượng ước tính: ~{foodResult.estimatedCalories}</span>
                      <button
                        onClick={handleSaveFoodToLog}
                        className="text-emerald-400 hover:text-emerald-300 font-bold flex items-center gap-1 cursor-pointer"
                      >
                        + Lưu vào Nhật ký
                      </button>
                    </div>
                  </div>
                )}

                {/* Quick suggestions */}
                <div className="flex gap-1 overflow-x-auto pt-2 scrollbar-none text-[10px]">
                  <span className="text-slate-500 self-center">Gợi ý:</span>
                  <button
                    onClick={() => {
                      setFoodQuery('Cá bống kho tiêu mặn');
                    }}
                    className="px-2 py-0.5 rounded-lg glass-card text-slate-300 hover:text-white"
                  >
                    Cá kho mặn
                  </button>
                  <button
                    onClick={() => {
                      setFoodQuery('Chè bưởi nước cốt dừa');
                    }}
                    className="px-2 py-0.5 rounded-lg glass-card text-slate-300 hover:text-white"
                  >
                    Chè bưởi ngọt
                  </button>
                  <button
                    onClick={() => {
                      setFoodQuery('Canh rau ngót nấu thịt nạc');
                    }}
                    className="px-2 py-0.5 rounded-lg glass-card text-slate-300 hover:text-white"
                  >
                    Canh rau ngót
                  </button>
                </div>
              </div>
            </div>
          )}
        </>
      )}

      {/* MODAL: THÊM THÀNH VIÊN MỚI */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="glass-panel rounded-3xl p-5 w-full max-w-md space-y-3 text-xs">
            <div className="flex justify-between items-center pb-2 border-b border-white/10">
              <h3 className="font-bold text-sm text-emerald-400 flex items-center gap-2">
                <UserPlus className="w-4 h-4" /> THÊM HỒ SƠ THÀNH VIÊN MỚI
              </h3>
              <button
                onClick={() => setShowAddModal(false)}
                className="text-slate-400 hover:text-white p-1 cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleAddMember} className="space-y-2.5">
              <div>
                <label className="block text-slate-400 mb-1">Họ và Tên thành viên *</label>
                <input
                  type="text"
                  required
                  placeholder="Ví dụ: Ông Nội, Bà Ngoại, Bác Hải..."
                  value={memName}
                  onChange={e => setMemName(e.target.value)}
                  className="w-full glass-input p-2.5 rounded-xl"
                />
              </div>

              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label className="block text-slate-400 mb-1">Tuổi *</label>
                  <input
                    type="number"
                    required
                    value={memAge}
                    onChange={e => setMemAge(parseInt(e.target.value) || 60)}
                    className="w-full glass-input p-2 rounded-xl"
                  />
                </div>
                <div>
                  <label className="block text-slate-400 mb-1">Giới tính</label>
                  <select
                    value={memGender}
                    onChange={e => setMemGender(e.target.value as any)}
                    className="w-full glass-input p-2 rounded-xl"
                  >
                    <option value="Nam">Nam</option>
                    <option value="Nữ">Nữ</option>
                  </select>
                </div>
                <div>
                  <label className="block text-slate-400 mb-1">Nhóm máu</label>
                  <select
                    value={memBlood}
                    onChange={e => setMemBlood(e.target.value as any)}
                    className="w-full glass-input p-2 rounded-xl"
                  >
                    <option value="O">O</option>
                    <option value="A">A</option>
                    <option value="B">B</option>
                    <option value="AB">AB</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-slate-400 mb-1">Chiều cao (cm)</label>
                  <input
                    type="number"
                    value={memHeight}
                    onChange={e => setMemHeight(parseFloat(e.target.value) || 160)}
                    className="w-full glass-input p-2 rounded-xl"
                  />
                </div>
                <div>
                  <label className="block text-slate-400 mb-1">Cân nặng (kg)</label>
                  <input
                    type="number"
                    value={memWeight}
                    onChange={e => setMemWeight(parseFloat(e.target.value) || 60)}
                    className="w-full glass-input p-2 rounded-xl"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-400 mb-1">Tiền sử bệnh lý / Lưu ý sức khỏe</label>
                <input
                  type="text"
                  placeholder="Ví dụ: Cao huyết áp độ 1, Thoái hóa khớp gối..."
                  value={memConditions}
                  onChange={e => setMemConditions(e.target.value)}
                  className="w-full glass-input p-2.5 rounded-xl"
                />
              </div>

              <div>
                <label className="block text-slate-400 mb-1">Số điện thoại khẩn cấp (Người thân / Bác sĩ)</label>
                <input
                  type="text"
                  placeholder="0988 123 456..."
                  value={memEmergency}
                  onChange={e => setMemEmergency(e.target.value)}
                  className="w-full glass-input p-2.5 rounded-xl text-rose-300 font-bold"
                />
              </div>

              <button
                type="submit"
                className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl shadow-md transition cursor-pointer"
              >
                Lưu Thành Viên & Tạo Hồ Sơ
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
