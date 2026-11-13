/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import {
  HeartPulse,
  Sparkles,
  Activity,
  Dumbbell,
  Users,
  Pill,
  FileText,
  Music,
  Download,
  Moon,
  Sun,
  AlertTriangle,
  Wind,
  Volume2,
  VolumeX,
  CheckCircle,
  Wifi,
  Lock,
  LogOut,
  UserCheck,
  ShieldCheck
} from 'lucide-react';

import {
  Member,
  MedicationTray,
  MedicationTakeLog,
  AbnormalHealthLog,
  AirPollutionLog,
  AILibraryItem,
  SoundTrack,
  WorkoutVideo
} from './types';

import { GeminiWorkspace } from './components/GeminiWorkspace';
import { HealthDashboard } from './components/HealthDashboard';
import { FamilyHealthTab } from './components/FamilyHealthTab';
import { MedicationTab } from './components/MedicationTab';
import { HealthProfileTab } from './components/HealthProfileTab';
import { AuthGate, AuthUser } from './components/AuthGate';
import { EmergencySOSButton } from './components/EmergencySOSButton';

export default function App() {
  // Navigation active tab (Exercises tab removed per user request)
  const [activeTab, setActiveTab] = useState<
    'gemini' | 'dashboard' | 'family' | 'medication' | 'profile'
  >('gemini');

  // Privacy Masking Mode (che ẩn thông tin cá nhân ở nơi công cộng)
  const [privacyMask, setPrivacyMask] = useState(false);

  // Dark/Light Theme state
  const [theme, setTheme] = useState<'dark' | 'light'>(
    (localStorage.getItem('smart_health_theme') as 'dark' | 'light') || 'dark'
  );

  useEffect(() => {
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
      document.documentElement.classList.remove('light');
    } else {
      document.documentElement.classList.remove('dark');
      document.documentElement.classList.add('light');
    }
    localStorage.setItem('smart_health_theme', theme);
  }, [theme]);

  // Real-time Clock
  const [currentTime, setCurrentTime] = useState(new Date());
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  // API Key stored in localStorage
  const [apiKey, setApiKey] = useState<string>(
    localStorage.getItem('smart_health_gemini_key') || ''
  );
  const handleSaveApiKey = (key: string) => {
    setApiKey(key);
    localStorage.setItem('smart_health_gemini_key', key);
  };

  // Authentication state for protected records & medication schedule
  const [currentUser, setCurrentUser] = useState<AuthUser | null>(() => {
    const saved = localStorage.getItem('smart_health_current_user');
    return saved ? JSON.parse(saved) : null;
  });

  const handleLogin = (user: AuthUser) => {
    setCurrentUser(user);
    localStorage.setItem('smart_health_current_user', JSON.stringify(user));
  };

  const handleLogout = () => {
    setCurrentUser(null);
    localStorage.removeItem('smart_health_current_user');
  };

  // 1. MEMBERS STATE (Empty by default per prompt instruction: "cứ để trống không cần ghi Bố Hải, Mẹ Mai, Bạn Nam gì hết cái này để người sử dụng tự thiết lập")
  const [members, setMembers] = useState<Member[]>(() => {
    const saved = localStorage.getItem('smart_health_members');
    return saved ? JSON.parse(saved) : [];
  });

  useEffect(() => {
    localStorage.setItem('smart_health_members', JSON.stringify(members));
  }, [members]);

  const handleAddMember = (m: Member) => {
    setMembers(prev => [...prev, m]);
  };

  const handleUpdateMember = (updated: Member) => {
    setMembers(prev => prev.map(m => (m.id === updated.id ? updated : m)));
  };

  const handleDeleteMember = (id: string) => {
    setMembers(prev => prev.filter(m => m.id !== id));
  };

  // 2. MEDICATION TRAYS STATE
  const [trays, setTrays] = useState<MedicationTray[]>(() => {
    const saved = localStorage.getItem('smart_health_trays');
    return saved ? JSON.parse(saved) : [];
  });

  useEffect(() => {
    localStorage.setItem('smart_health_trays', JSON.stringify(trays));
  }, [trays]);

  const handleAddTray = (t: MedicationTray) => setTrays(prev => [...prev, t]);
  const handleUpdateTray = (updated: MedicationTray) =>
    setTrays(prev => prev.map(t => (t.id === updated.id ? updated : t)));
  const handleDeleteTray = (id: string) => setTrays(prev => prev.filter(t => t.id !== id));

  // 3. MEDICATION TAKE LOGS (Rolling 7-day automatic cleanup)
  const [takeLogs, setTakeLogs] = useState<MedicationTakeLog[]>(() => {
    const saved = localStorage.getItem('smart_health_take_logs');
    return saved ? JSON.parse(saved) : [];
  });

  useEffect(() => {
    // 7-day rolling pruning: delete days older than 7 days automatically
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - 7);
    const validLogs = takeLogs.filter(l => new Date(l.dateKey) >= cutoffDate);
    if (validLogs.length !== takeLogs.length) {
      setTakeLogs(validLogs);
    }
    localStorage.setItem('smart_health_take_logs', JSON.stringify(validLogs));
  }, [takeLogs]);

  const handleAddTakeLog = (log: MedicationTakeLog) => setTakeLogs(prev => [log, ...prev]);

  // 4. ABNORMAL HEALTH LOGS (Deletable by user)
  const [abnormalLogs, setAbnormalLogs] = useState<AbnormalHealthLog[]>(() => {
    const saved = localStorage.getItem('smart_health_abnormal_logs');
    return saved
      ? JSON.parse(saved)
      : [
          {
            id: 'ab-1',
            timestamp: '08:15 Hôm nay',
            memberName: 'Người đeo vòng tay 1',
            type: 'SpO2 Thấp',
            value: 'SpO2 91% (< 94%)',
            severity: 'critical',
            resolved: true,
          },
          {
            id: 'ab-2',
            timestamp: '14:30 Hôm qua',
            memberName: 'Người đeo vòng tay 1',
            type: 'Nhịp Tim Nhanh',
            value: '112 BPM',
            severity: 'warning',
            resolved: true,
          },
        ];
  });

  useEffect(() => {
    localStorage.setItem('smart_health_abnormal_logs', JSON.stringify(abnormalLogs));
  }, [abnormalLogs]);

  const handleDeleteAbnormalLog = (id: string) =>
    setAbnormalLogs(prev => prev.filter(l => l.id !== id));
  const handleClearAbnormalLogs = () => setAbnormalLogs([]);

  // 5. AIR POLLUTION LOGS (Deletable by user)
  const [pollutionLogs, setPollutionLogs] = useState<AirPollutionLog[]>(() => {
    const saved = localStorage.getItem('smart_health_pollution_logs');
    return saved
      ? JSON.parse(saved)
      : [
          {
            id: 'poll-1',
            timestamp: '09:00 Sáng nay',
            aqi: 142,
            pm25: 64.2,
            description: 'Phát hiện khói xe và bụi mịn cửa sổ phòng khách',
            actionTaken: 'Đã kích hoạt lọc khí tuần hoàn về mức an toàn AQI 32',
          },
          {
            id: 'poll-2',
            timestamp: '18:20 Hôm qua',
            aqi: 118,
            pm25: 48.0,
            description: 'Khói bếp đun nấu phát sinh vi hạt PM2.5',
            actionTaken: 'Thanh lọc ion âm và đẩy khí sạch 30 phút',
          },
        ];
  });

  useEffect(() => {
    localStorage.setItem('smart_health_pollution_logs', JSON.stringify(pollutionLogs));
  }, [pollutionLogs]);

  const handleDeletePollutionLog = (id: string) =>
    setPollutionLogs(prev => prev.filter(l => l.id !== id));
  const handleClearPollutionLogs = () => setPollutionLogs([]);

  // 6. AI LIBRARY ITEMS (Saved files/images from AI)
  const [libraryItems, setLibraryItems] = useState<AILibraryItem[]>(() => {
    const saved = localStorage.getItem('smart_health_ai_library');
    return saved
      ? JSON.parse(saved)
      : [
          {
            id: 'lib-init',
            title: 'Thực đơn mẫu 7 ngày giảm muối & ổn định huyết áp',
            type: 'report',
            createdAt: 'Hôm nay',
            description: 'Khuyến nghị bởi trợ lý y khoa Gemini cho người cao tuổi',
            content:
              'THỰC ĐƠN GIẢM MUỐI:\n• Sáng: Cháo yến mạch hạt sen + 1 ly sữa hạt ít đường\n• Trưa: Cá chép hấp gừng, canh bí đao nấu thịt nạc, 1 chén cơm gạo lứt\n• Chiều: 1 quả táo tươi\n• Tối: Canh rau ngót, đậu phụ sốt cà chua nhạt, nửa chén cơm lứt.',
          },
        ];
  });

  useEffect(() => {
    localStorage.setItem('smart_health_ai_library', JSON.stringify(libraryItems));
  }, [libraryItems]);

  const handleAddLibraryItem = (item: AILibraryItem) => setLibraryItems(prev => [item, ...prev]);
  const handleDeleteLibraryItem = (id: string) =>
    setLibraryItems(prev => prev.filter(i => i.id !== id));

  // 7. WORKOUT VIDEOS (No measurement boxes, many physical & mental workouts)
  const [workoutList, setWorkoutList] = useState<WorkoutVideo[]>([
    {
      id: 'w-1',
      title: 'Dưỡng sinh 12 động tác xoa bóp kinh lạc ngũ tạng',
      category: 'physical',
      duration: '15 phút',
      level: 'Dưỡng sinh',
      target: 'Khai thông khí huyết, ấm tạng phủ',
      description: 'Bài tập truyền thống giúp kích thích các huyệt đạo quan trọng, chống tê bì tay chân.',
      steps: [
        'Xoa nóng 2 lòng bàn tay và úp lên mắt 5 lần',
        'Vỗ nhẹ vùng vai gáy và kinh lạc hai cánh tay',
        'Xoa bụng quanh rốn theo chiều kim đồng hồ 36 vòng',
        'Xoa bóp 2 khớp gối và huyệt Dũng Tuyền lòng bàn chân',
      ],
      videoUrl: 'https://www.youtube-nocookie.com/embed/dQw4w9WgXcQ',
    },
    {
      id: 'w-2',
      title: 'Thái Cực Quyền (Tai Chi) nhẹ nhàng dưỡng tâm',
      category: 'physical',
      duration: '20 phút',
      level: 'Nhẹ nhàng',
      target: 'Cân bằng thăng bằng, phòng ngừa té ngã',
      description: 'Chuyển động uyển chuyển, trọng tâm vững vàng giúp người cao tuổi đi lại tự tin.',
      steps: [
        'Khởi thức: Chân rộng bằng vai, từ từ nâng hạ hai cánh tay',
        'Bạch hạc lượng dực: Vươn mở lồng ngực đón khí trong lành',
        'Thủ huy tỳ bà: Bước tới nhẹ nhàng như lướt trên mặt đất',
        'Thu thức: Hít thở sâu và lắng đọng năng lượng tại đan điền',
      ],
      videoUrl: 'https://www.youtube-nocookie.com/embed/cIOSU62Q4b4',
    },
    {
      id: 'w-3',
      title: 'Yoga trên ghế (Chair Yoga) an toàn cột sống',
      category: 'physical',
      duration: '12 phút',
      level: 'Nhẹ nhàng',
      target: 'Giảm đau mỏi thắt lưng và thoái hóa khớp',
      description: 'Tập hoàn toàn trên ghế tựa, an toàn tuyệt đối cho người có khớp gối yếu.',
      steps: [
        'Ngồi thẳng lưng, xoay khớp cổ nhẹ nhàng 5 nhịp',
        'Vươn tay nghiêng lườn sang trái, sang phải',
        'Nâng từng đầu gối gập nhẹ vào bụng để kích thích tiêu hóa',
        'Thả lỏng 2 vai và hít thở sâu',
      ],
      videoUrl: 'https://www.youtube-nocookie.com/embed/k4J5jF5y3qg',
    },
    {
      id: 'w-4',
      title: 'Thiền chánh niệm buông thư trước giờ ngủ',
      category: 'mental',
      duration: '15 phút',
      level: 'Dưỡng sinh',
      target: 'An thần, xua tan muộn phiền, ngủ sâu',
      description: 'Kỹ thuật quét cơ thể (Body scan) giúp hệ thần kinh chuyển sang trạng thái thư giãn tối đa.',
      steps: [
        'Nằm ngửa hoặc ngồi tựa thoải mái trong không gian yên tĩnh',
        'Hướng sự chú ý vào từng hơi thở nhẹ nhàng',
        'Cảm nhận và thả lỏng trán, mắt, quai hàm và 2 bờ vai',
        'Cho phép tâm trí buông bỏ mọi suy nghĩ bận rộn trong ngày',
      ],
      videoUrl: 'https://www.youtube-nocookie.com/embed/inpok4MKVLM',
    },
    {
      id: 'w-5',
      title: 'Bài tập tuần hoàn máu não chống chóng mặt',
      category: 'mental',
      duration: '10 phút',
      level: 'Nhẹ nhàng',
      target: 'Cải thiện oxy lên não, giảm hoa mắt',
      description: 'Các chuyển động mắt và đầu có kiểm soát giúp thích nghi tiền đình và tăng cường minh mẫn.',
      steps: [
        'Nhìn tập trung vào ngón tay cái và từ từ xoay đầu trái - phải',
        'Nhắm mở mắt theo nhịp thở êm',
        'Day ấn huyệt Phong Trì sau gáy và Thái Dương',
      ],
      videoUrl: 'https://www.youtube-nocookie.com/embed/7f48v2Yw_e8',
    },
    {
      id: 'w-6',
      title: 'Đi bộ tại chỗ kết hợp vung tay trợ tim',
      category: 'physical',
      duration: '15 phút',
      level: 'Vừa sức',
      target: 'Tăng cường sức bền cơ tim và thông khí phổi',
      description: 'Động tác đi bộ có nhịp điệu kích hoạt tĩnh mạch chi dưới đẩy máu về tim tốt hơn.',
      steps: [
        'Khởi động nhẹ nhàng xoay cổ tay cổ chân 2 phút',
        'Dậm chân tại chỗ nhẹ nhàng, đánh tay theo nhịp thở tự nhiên',
        'Giảm dần tốc độ trong 3 phút cuối và hít thở sâu',
      ],
      videoUrl: 'https://www.youtube-nocookie.com/embed/enYITYwvPAQ',
    },
    {
      id: 'w-7',
      title: 'Khởi động liên hoàn khớp chống cứng cơ buổi sáng',
      category: 'physical',
      duration: '10 phút',
      level: 'Nhẹ nhàng',
      target: 'Bôi trơn ổ khớp, làm ấm dịch khớp buổi sớm',
      description: 'Đánh thức cơ thể nhẹ nhàng ngay sau khi thức dậy, ngăn ngừa cứng khớp và đau mỏi.',
      steps: [
        'Xoay tròn các khớp ngón tay và cổ tay theo chiều kim đồng hồ 10 lần',
        'Xoay tròn khớp vai từ trước ra sau, mở rộng biên độ vừa sức',
        'Xoay khớp cổ chân nhẹ nhàng từ trái qua phải, sau đó đổi chiều',
        'Hít sâu vươn 2 tay lên cao qua đầu, thở ra hạ tay chậm rãi',
      ],
      videoUrl: 'https://www.youtube-nocookie.com/embed/3pL_428F10A',
    },
    {
      id: 'w-8',
      title: 'Bài tập nhón gót chân (Calf Raises) trợ tim & lưu thông tĩnh mạch',
      category: 'physical',
      duration: '8 phút',
      level: 'Nhẹ nhàng',
      target: 'Kích hoạt bơm tĩnh mạch bắp chân đẩy máu về tim',
      description: 'Được mệnh danh là "trái tim thứ hai", nhón gót giúp ngăn ngừa suy giãn tĩnh mạch và phù nề chân.',
      steps: [
        'Đứng thẳng người, hai tay vịn nhẹ vào lưng ghế tựa vững chắc',
        'Từ từ nhón gót chân lên cao, giữ trọng tâm dồn lên ức bàn chân trong 2 giây',
        'Hạ gót chân chạm đất nhẹ nhàng và lặp lại 15 - 20 nhịp mỗi đợt',
        'Thư giãn lắc nhẹ 2 bắp chân sau khi hoàn thành 3 đợt tập',
      ],
      videoUrl: 'https://www.youtube-nocookie.com/embed/k4J5jF5y3qg',
    },
    {
      id: 'w-9',
      title: 'Vung tay Dịch Cân Kinh (100 - 300 nhịp) thải độc thông khí',
      category: 'physical',
      duration: '15 phút',
      level: 'Dưỡng sinh',
      target: 'Khai mở phế khí, xoa dịu thần kinh, hỗ trợ tiêu hóa',
      description: 'Phương pháp dưỡng sinh cổ truyền trứ danh giúp điều hòa huyết áp và tăng tuần hoàn máu toàn thân.',
      steps: [
        'Đứng thẳng, chân mở rộng bằng vai, các ngón chân bám nhẹ xuống sàn',
        'Hai cánh tay buông xuôi tự nhiên, đưa tay ra trước một góc 30 độ',
        'Vung mạnh hai tay ra phía sau góc 60 độ, buông lỏng tự nhiên khi tay quay về trước',
        'Duy trì nhịp vung đều đặn từ 100 đến 300 nhịp kết hợp thở tự nhiên',
      ],
      videoUrl: 'https://www.youtube-nocookie.com/embed/cIOSU62Q4b4',
    },
    {
      id: 'w-10',
      title: 'Ngồi đứng tựa ghế (Chair Squats) tăng lực cơ đùi chống ngã',
      category: 'physical',
      duration: '12 phút',
      level: 'Vừa sức',
      target: 'Củng cố cơ tứ đầu đùi và xương chậu người cao tuổi',
      description: 'Giúp người cao tuổi đứng lên ngồi xuống vững vàng, leo cầu thang không bị hụt chân.',
      steps: [
        'Ngồi thẳng lưng trên ghế vững, hai bàn chân đặt phẳng trên mặt sàn',
        'Đưa hai tay ra trước ngực để giữ thăng bằng',
        'Dồn lực vào gót chân và đùi để đứng thẳng dậy từ từ',
        'Từ từ hạ hông ngồi trở lại ghế nhẹ nhàng, thực hiện 8 - 10 lần',
      ],
      videoUrl: 'https://www.youtube-nocookie.com/embed/k4J5jF5y3qg',
    },
    {
      id: 'w-11',
      title: 'Kéo giãn cổ gáy và khớp vai chống thoái hóa đốt sống cổ',
      category: 'physical',
      duration: '10 phút',
      level: 'Nhẹ nhàng',
      target: 'Giải phóng chèn ép dây thần kinh cổ, giảm tê tay',
      description: 'Giảm co thắt cơ thang và cơ ức đòn chũm do ngồi cúi nhiều hoặc gối đầu cao.',
      steps: [
        'Ngồi thẳng lưng, từ từ nghiêng đầu sang bên phải, giữ 5 giây',
        'Đổi bên nghiêng sang trái, cảm nhận cơ cổ được kéo giãn êm ái',
        'Gập cằm sát ức trong 5 giây, sau đó từ từ ngửa nhẹ cổ nhìn lên trần',
        'Đan 2 tay sau gáy và khép mở 2 cùi chỏ để kéo giãn lồng ngực',
      ],
      videoUrl: 'https://www.youtube-nocookie.com/embed/3pL_428F10A',
    },
    {
      id: 'w-12',
      title: 'Tư thế con mèo - con bò (Cat-Cow) mềm mại cột sống thắt lưng',
      category: 'physical',
      duration: '10 phút',
      level: 'Dưỡng sinh',
      target: 'Tăng khoảng cách giữa các đốt sống, giảm đau thắt lưng',
      description: 'Bài tập kéo giãn nhịp nhàng theo hơi thở, thích hợp tập trên thảm hoặc nệm cứng.',
      steps: [
        'Quỳ chống 2 tay và 2 đầu gối trên thảm (tư thế bò 4 điểm)',
        'Hít vào: Võng lưng xuống nhẹ nhàng, ngẩng mặt lên (Tư thế con bò)',
        'Thở ra: Cong tròn lưng lên cao, cúi đầu nhìn về rốn (Tư thế con mèo)',
        'Lặp lại chuyển động chậm rãi 8 - 10 vòng kết hợp nhịp thở êm',
      ],
      videoUrl: 'https://www.youtube-nocookie.com/embed/k4J5jF5y3qg',
    },
    {
      id: 'w-13',
      title: 'Thăng bằng một chân vịn ghế (Single Leg Balance) chống ngã',
      category: 'physical',
      duration: '8 phút',
      level: 'Nhẹ nhàng',
      target: 'Rèn luyện phản xạ thăng bằng của tiểu não và cổ chân',
      description: 'Chỉ với 8 phút mỗi ngày giúp giảm tới 40% nguy cơ trượt ngã ở người trên 60 tuổi.',
      steps: [
        'Đứng bên cạnh ghế vững, một tay đặt nhẹ lên lưng ghế',
        'Từ từ nâng chân trái co nhẹ lên khỏi mặt đất khoảng 5-10 cm',
        'Giữ thăng bằng trên chân phải trong 10 - 15 giây, mắt nhìn một điểm cố định',
        'Hạ chân xuống nghỉ 5 giây rồi đổi sang đứng trên chân trái',
      ],
      videoUrl: 'https://www.youtube-nocookie.com/embed/3pL_428F10A',
    },
    {
      id: 'w-14',
      title: 'Xoay hông và mở rộng khớp háng giúp bước đi linh hoạt',
      category: 'physical',
      duration: '10 phút',
      level: 'Nhẹ nhàng',
      target: 'Giải phóng căng cứng vùng chậu và bẹn, ngừa thoái hóa háng',
      description: 'Giúp khớp háng được bôi trơn dịch khớp, bước đi dài và tự nhiên hơn.',
      steps: [
        'Đứng thẳng, 2 tay chống nhẹ vào hông, 2 chân mở rộng hơn vai một chút',
        'Xoay tròn hông theo vòng tròn rộng và chậm rãi 10 vòng sang trái',
        'Đổi chiều xoay 10 vòng sang phải, giữ đầu và vai tương đối cố định',
        'Lắc nhẹ 2 chân và hít thở sâu để thả lỏng',
      ],
      videoUrl: 'https://www.youtube-nocookie.com/embed/cIOSU62Q4b4',
    },
  ]);

  const handleAddWorkout = (w: WorkoutVideo) => setWorkoutList(prev => [w, ...prev]);

  // 8. SOUND TRACKS (Without wind/HEPA sound, at least 5 tracks for sleep/relax/focus)
  const [tracks, setTracks] = useState<SoundTrack[]>([
    {
      id: 'st-1',
      title: 'Sóng Não Delta Sâu (4.5 Hz)',
      subtitle: 'Tái tạo tế bào sinh học & Kích thích ngủ sâu',
      category: 'sleep',
      frequency: '4.5 Hz Delta',
      icon: '🧠',
      synthType: 'delta',
    },
    {
      id: 'st-2',
      title: 'Mưa Rào Rừng Trúc Êm Dịu',
      subtitle: 'White Noise thiên nhiên che lấp tạp âm, thư giãn',
      category: 'sleep',
      frequency: 'Pink Noise',
      icon: '🌧️',
      synthType: 'rain',
    },
    {
      id: 'st-3',
      title: 'Sóng Biển Hoàng Hôn Vỗ Bờ',
      subtitle: 'Nhịp sóng êm đềm điều hòa nhịp tim và huyết áp',
      category: 'relax',
      frequency: '0.12 Hz Swell',
      icon: '🌊',
      synthType: 'waves',
    },
    {
      id: 'st-4',
      title: 'Suối Róc Rách & Tiếng Chim Rừng',
      subtitle: 'Tĩnh tâm, thanh lọc tâm trí và tập trung học tập',
      category: 'focus',
      frequency: 'Tự nhiên 432 Hz',
      icon: '🌲',
      synthType: 'stream',
    },
    {
      id: 'st-5',
      title: 'Nhạc Thiền Chuông Tây Tạng (528 Hz)',
      subtitle: 'Tần số Solfeggio chữa lành năng lượng và giảm stress',
      category: 'relax',
      frequency: '528 Hz Love',
      icon: '🔔',
      synthType: 'bowl528',
    },
    {
      id: 'st-6',
      title: 'Giai Điệu Piano Mộc Ru Ngủ',
      subtitle: 'Hòa âm êm ái xoa dịu lo âu trước giờ ngủ',
      category: 'sleep',
      frequency: 'Acoustic Warm',
      icon: '🎹',
      synthType: 'piano',
    },
  ]);

  const handleAddTrack = (track: SoundTrack) => setTracks(prev => [track, ...prev]);
  const handleDeleteTrack = (id: string) => setTracks(prev => prev.filter(t => t.id !== id));

  // Environmental Telemetry simulation
  const [telemetry, setTelemetry] = useState({
    aqi: 32,
    pm25: 14.2,
    temp: 26.5,
    humidity: 62,
  });

  useEffect(() => {
    const timer = setInterval(() => {
      setTelemetry(prev => {
        const delta = (Math.random() - 0.49) * 0.6;
        const newPm = Math.round(Math.max(8, Math.min(45, prev.pm25 + delta)) * 10) / 10;
        return {
          ...prev,
          pm25: newPm,
          aqi: Math.round(newPm * 2.2),
        };
      });
    }, 2000);
    return () => clearInterval(timer);
  }, []);

  // SOS Banner state
  const [sosActive, setSosActive] = useState(false);
  const [aqiAlertActive, setAqiAlertActive] = useState(false);

  return (
    <div className="min-h-screen flex flex-col justify-between p-3 md:p-6 text-slate-100 max-w-7xl mx-auto">
      {/* HEADER WITH REQUIRED TITLE & SUBTITLE */}
      <header className="glass-panel rounded-2xl p-4 mb-4 flex flex-wrap justify-between items-center gap-4 sticky top-2 z-40">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-2xl gemini-gradient-bg flex items-center justify-center text-white shadow-lg shadow-indigo-500/30">
            <HeartPulse className="w-6 h-6 animate-pulse" />
          </div>
          <div>
            <h1 className="font-extrabold text-lg md:text-xl tracking-wide flex items-center gap-2 text-white">
              Smart Healthcare
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 font-bold uppercase">
                IoT Real-time
              </span>
            </h1>
            <p className="text-xs text-slate-300 font-medium">
              Thiết bị chăm sóc sức khỏe thông minh cho người cao tuổi theo thời gian thực
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2.5 flex-wrap">
          {/* User Authentication Badge */}
          {currentUser ? (
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-indigo-500/20 border border-indigo-500/30 text-indigo-300 text-xs font-semibold">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
              <span className="truncate max-w-[130px] sm:max-w-none">{currentUser.fullName}</span>
              <button
                onClick={handleLogout}
                title="Đăng xuất (Khóa hồ sơ & lịch thuốc)"
                className="text-slate-400 hover:text-rose-400 p-0.5 transition cursor-pointer"
              >
                <LogOut className="w-3.5 h-3.5" />
              </button>
            </div>
          ) : (
            <button
              onClick={() => setActiveTab('profile')}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-indigo-600/20 hover:bg-indigo-600/35 border border-indigo-500/30 text-indigo-300 text-xs font-semibold transition cursor-pointer"
            >
              <Lock className="w-3.5 h-3.5" />
              <span>Đăng nhập hồ sơ</span>
            </button>
          )}

          {/* Privacy Mask Mode Toggle for Extra Medical Confidentiality */}
          <button
            onClick={() => setPrivacyMask(!privacyMask)}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition flex items-center gap-1.5 cursor-pointer shadow-md ${
              privacyMask
                ? 'bg-emerald-600/30 border-emerald-500 text-emerald-300 ring-2 ring-emerald-500/40'
                : 'glass-card border-white/10 text-slate-300 hover:text-white'
            }`}
            title="Bật/Tắt che giấu số CCCD, BHYT và SĐT để bảo mật thông tin y khoa nơi công cộng"
          >
            <ShieldCheck className={`w-3.5 h-3.5 ${privacyMask ? 'text-emerald-400' : 'text-slate-400'}`} />
            <span>{privacyMask ? 'Đang Ẩn Danh Tính (BẬT)' : 'Bảo Mật Y Khoa (TẮT)'}</span>
          </button>

          {/* Clock */}
          <div className="text-right font-mono text-xs">
            <div className="font-bold text-indigo-400 text-sm">
              {currentTime.toLocaleTimeString('vi-VN')}
            </div>
            <div className="text-[10px] text-slate-400">{currentTime.toLocaleDateString('vi-VN')}</div>
          </div>
        </div>
      </header>

      {/* PRIVACY MASK ALERT BANNER (High Visibility Indicator) */}
      {privacyMask && (
        <div className="mb-4 p-3 rounded-2xl bg-emerald-950/80 border border-emerald-500/50 text-emerald-200 text-xs flex flex-wrap items-center justify-between gap-3 shadow-xl">
          <div className="flex items-center gap-2.5">
            <ShieldCheck className="w-5 h-5 text-emerald-400 shrink-0" />
            <div>
              <strong className="text-white block font-bold">Chế độ Bảo Mật Y Khoa & Ẩn Danh Tính: ĐANG BẬT</strong>
              <span className="text-[11px] text-emerald-300">
                Toàn bộ dữ liệu số định danh CCCD, mã BHYT, số điện thoại liên lạc và số nhà đang được che tự động (•••• / ***) để bảo mật thông tin cá nhân.
              </span>
            </div>
          </div>
          <button
            onClick={() => setPrivacyMask(false)}
            className="px-3 py-1.5 rounded-xl bg-emerald-600/40 hover:bg-emerald-600 text-white font-bold text-xs transition cursor-pointer shrink-0"
          >
            Tắt Ẩn Danh
          </button>
        </div>
      )}
      {sosActive && (
        <div className="mb-4 p-4 rounded-2xl bg-rose-950/90 border-2 border-rose-500 text-white flex flex-wrap items-center justify-between gap-4 shadow-2xl animate-pulse">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-rose-600 flex items-center justify-center text-xl shrink-0 shadow-lg">
              <AlertTriangle className="w-5 h-5 text-white" />
            </div>
            <div>
              <h3 className="font-bold text-sm md:text-base text-rose-200">
                CẢNH BÁO SOS KHẨN CẤP: CHỈ SỐ BẤT THƯỜNG!
              </h3>
              <p className="text-xs text-rose-300">
                Phát hiện SpO2 tụt dưới ngưỡng an toàn hoặc nhịp tim tăng đột biến.
              </p>
            </div>
          </div>
          <button
            onClick={() => setSosActive(false)}
            className="px-4 py-2 bg-rose-600 hover:bg-rose-500 rounded-xl text-xs font-bold transition shadow-md cursor-pointer"
          >
            Đã Xử Lý Xong ✓
          </button>
        </div>
      )}

      {/* MAIN NAVIGATION TABS */}
      <nav className="flex gap-2 mb-4 overflow-x-auto pb-2 scrollbar-none">
        <button
          onClick={() => setActiveTab('gemini')}
          className={`px-4 py-2.5 rounded-2xl font-bold text-xs sm:text-sm flex items-center gap-2 transition shrink-0 cursor-pointer ${
            activeTab === 'gemini'
              ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-lg'
              : 'glass-panel text-slate-300 opacity-80 hover:opacity-100'
          }`}
        >
          <Sparkles className="w-4 h-4 text-purple-300" /> Gemini AI API Workspace
        </button>

        <button
          onClick={() => setActiveTab('dashboard')}
          className={`px-4 py-2.5 rounded-2xl font-bold text-xs sm:text-sm flex items-center gap-2 transition shrink-0 cursor-pointer ${
            activeTab === 'dashboard'
              ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-lg'
              : 'glass-panel text-slate-300 opacity-80 hover:opacity-100'
          }`}
        >
          <Activity className="w-4 h-4 text-cyan-300" /> Hệ thống sức khỏe
        </button>

        <button
          onClick={() => setActiveTab('family')}
          className={`px-4 py-2.5 rounded-2xl font-bold text-xs sm:text-sm flex items-center gap-2 transition shrink-0 cursor-pointer ${
            activeTab === 'family'
              ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-lg'
              : 'glass-panel text-slate-300 opacity-80 hover:opacity-100'
          }`}
        >
          <Users className="w-4 h-4 text-amber-300" /> Sức Khỏe Gia Đình
        </button>

        <button
          onClick={() => setActiveTab('medication')}
          className={`px-4 py-2.5 rounded-2xl font-bold text-xs sm:text-sm flex items-center gap-2 transition shrink-0 cursor-pointer ${
            activeTab === 'medication'
              ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-lg'
              : 'glass-panel text-slate-300 opacity-80 hover:opacity-100'
          }`}
        >
          <Pill className="w-4 h-4 text-blue-300" />
          <span>Lịch Thuốc</span>
          {!currentUser && <Lock className="w-3 h-3 text-amber-400 shrink-0" />}
        </button>

        <button
          onClick={() => setActiveTab('profile')}
          className={`px-4 py-2.5 rounded-2xl font-bold text-xs sm:text-sm flex items-center gap-2 transition shrink-0 cursor-pointer ${
            activeTab === 'profile'
              ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-lg'
              : 'glass-panel text-slate-300 opacity-80 hover:opacity-100'
          }`}
        >
          <FileText className="w-4 h-4 text-teal-300" />
          <span>Hồ Sơ Sức Khỏe</span>
          {!currentUser && <Lock className="w-3 h-3 text-amber-400 shrink-0" />}
        </button>
      </nav>

      {/* MAIN VIEW CONTENT */}
      <main className="flex-grow space-y-4">
        {activeTab === 'gemini' && (
          <GeminiWorkspace currentUser={currentUser} />
        )}

        {activeTab === 'dashboard' && (
          <HealthDashboard
            members={members}
            onAddMember={handleAddMember}
            abnormalLogs={abnormalLogs}
            onDeleteAbnormalLog={handleDeleteAbnormalLog}
            onClearAbnormalLogs={handleClearAbnormalLogs}
            pollutionLogs={pollutionLogs}
            onDeletePollutionLog={handleDeletePollutionLog}
            onClearPollutionLogs={handleClearPollutionLogs}
            telemetry={telemetry}
            trays={trays}
            onAddTakeLog={handleAddTakeLog}
          />
        )}

        {activeTab === 'family' && (
          <FamilyHealthTab
            members={members}
            onAddMember={handleAddMember}
            onUpdateMember={handleUpdateMember}
            onDeleteMember={handleDeleteMember}
            apiKey={apiKey}
          />
        )}

        {activeTab === 'medication' && (
          <AuthGate
            title="XÁC THỰC BẢO MẬT LỊCH THUỐC"
            description="Vui lòng đăng nhập hoặc đăng ký tài khoản để quản lý liều dùng, cấu hình khay thuốc thông minh và theo dõi lịch sử uống thuốc của người cao tuổi."
            currentUser={currentUser}
            onLogin={handleLogin}
          >
            <div className="space-y-3">
              <div className="flex flex-wrap items-center justify-between gap-2 p-2.5 rounded-2xl bg-blue-950/40 border border-blue-500/30 text-xs">
                <span className="text-slate-300 flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-emerald-400" />
                  Đang đăng nhập bảo mật bởi: <strong className="text-white">{currentUser?.fullName}</strong> ({currentUser?.role})
                </span>
                <button
                  onClick={handleLogout}
                  className="px-2.5 py-1 rounded-xl bg-rose-600/30 hover:bg-rose-600 border border-rose-500/40 text-rose-200 text-[11px] font-bold transition cursor-pointer flex items-center gap-1 shadow-sm"
                >
                  <LogOut className="w-3 h-3" /> Đăng xuất (Khóa)
                </button>
              </div>
              <MedicationTab
                trays={trays}
                onAddTray={handleAddTray}
                onUpdateTray={handleUpdateTray}
                onDeleteTray={handleDeleteTray}
                takeLogs={takeLogs}
                onAddTakeLog={handleAddTakeLog}
                onClearOldLogs={() => {}}
                members={members}
                privacyMask={privacyMask}
              />
            </div>
          </AuthGate>
        )}

        {activeTab === 'profile' && (
          <AuthGate
            title="XÁC THỰC BẢO MẬT HỒ SƠ SỨC KHỎE ĐIỆN TỬ"
            description="Hồ sơ y bạ cá nhân và tiền sử bệnh án được bảo mật. Nhập đúng tên người dùng và mật khẩu để xem hoặc chỉnh sửa nội dung hồ sơ y tế."
            currentUser={currentUser}
            onLogin={handleLogin}
          >
            <div className="space-y-3">
              <div className="flex flex-wrap items-center justify-between gap-2 p-2.5 rounded-2xl bg-teal-950/40 border border-teal-500/30 text-xs">
                <span className="text-slate-300 flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-emerald-400" />
                  Đang truy cập hồ sơ bởi: <strong className="text-white">{currentUser?.fullName}</strong> ({currentUser?.role})
                </span>
                <button
                  onClick={handleLogout}
                  className="px-2.5 py-1 rounded-xl bg-rose-600/30 hover:bg-rose-600 border border-rose-500/40 text-rose-200 text-[11px] font-bold transition cursor-pointer flex items-center gap-1 shadow-sm"
                >
                  <LogOut className="w-3 h-3" /> Đăng xuất (Khóa)
                </button>
              </div>
              <HealthProfileTab
                members={members}
                onAddMember={handleAddMember}
                onUpdateMember={handleUpdateMember}
                onDeleteMember={handleDeleteMember}
                privacyMask={privacyMask}
              />
            </div>
          </AuthGate>
        )}
      </main>

      {/* FLOATING EMERGENCY SOS BUTTON WITH LIVE WEB BROADCAST ALERT */}
      <EmergencySOSButton
        currentUser={currentUser}
        onNavigateToAuth={() => setActiveTab('profile')}
        onNavigateToProfile={() => setActiveTab('profile')}
        members={members}
        currentMember={members[0] || null}
      />
    </div>
  );
}
