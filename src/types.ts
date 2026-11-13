export interface Member {
  id: string;
  name: string;
  age: number;
  gender: 'Nam' | 'Nữ' | 'Khác';
  height: number; // cm
  weight: number; // kg
  bloodType: 'A' | 'B' | 'AB' | 'O';
  conditions: string; // e.g. Cao huyết áp, Tiểu đường tuýp 2, Tim mạch...
  allergies: string;
  emergencyContact: string;
  avatarText?: string;
  isCurrentWearer?: boolean;
  wristbandId?: string;
  avgSpO2: number;
  restBPM: number;
  bodyTemp: number;
  logs: MemberLog[];
  record?: HealthRecordData;
}

export interface HealthRecordData {
  // 1. Phần Thông tin hành chính
  personalId?: string; // Mã định danh cá nhân duy nhất (CCCD/Định danh quốc gia)
  dob?: string; // Ngày sinh
  permanentAddress?: string; // Địa chỉ thường trú/tạm trú
  phoneNumber?: string; // Số điện thoại liên lạc
  relativeInfo?: string; // Thông tin người thân liên hệ khi cần thiết
  insuranceNumber?: string; // Mã số bảo hiểm y tế (BHYT)

  // 2. Phần Tiền sử sức khỏe và các yếu tố liên quan
  personalHistory?: string; // Tiền sử bệnh bản thân
  surgicalHistory?: string; // Tiền sử phẫu thuật
  drugAllergies?: string; // Dị ứng thuốc
  weatherFoodAllergies?: string; // Dị ứng thời tiết / thực phẩm
  familyHistory?: string; // Tiền sử gia đình
  lifestyleRisks?: string; // Yếu tố nguy cơ (thuốc lá, rượu bia, vận động)

  // 3. Phần Tiêm chủng
  vaccinationHistory?: {
    id: string;
    vaccineName: string; // uốn ván, viêm gan B, lao, sởi, bạch hầu, cúm, COVID-19...
    date: string;
    dose: string;
    facility: string;
  }[];

  // 4. Phần Thông tin khám lâm sàng, cận lâm sàng và điều trị
  clinicalExam?: {
    bp?: string; // Huyết áp
    bpm?: number; // Nhịp tim
    generalInternal?: string; // Nội tổng quát
    surgery?: string; // Ngoại khoa
    eye?: string; // Mắt
    ent?: string; // Tai - Mũi - Họng
    dental?: string; // Răng - Hàm - Mặt
    dermatology?: string; // Da liễu
    gynecology?: string; // Sản - Phụ khoa (đối với nữ)
  };
  paraclinical?: {
    bloodTest?: string; // Xét nghiệm máu
    urineTest?: string; // Xét nghiệm nước tiểu
    ecg?: string; // Điện tâm đồ
    ultrasound?: string; // Siêu âm
    xray?: string; // X-quang tim phổi
    otherScans?: string; // Chẩn đoán hình ảnh khác
  };
  treatmentProcess?: {
    dischargePaper?: string; // Giấy ra viện
    prescription?: string; // Đơn thuốc
    sickLeave?: string; // Giấy nghỉ ốm
    hospitalizationSummary?: string; // Tóm tắt các đợt điều trị tại viện/cơ sở y tế
  };
}

export interface MemberLog {
  id: string;
  time: string;
  type: string;
  note: string;
}

export interface FoodEvaluationResult {
  foodName: string;
  status: 'safe' | 'caution' | 'danger';
  score: number;
  summary: string;
  pros: string[];
  cons: string[];
  advice: string;
  estimatedCalories: string;
  evaluatedAt: string;
}

export interface AbnormalHealthLog {
  id: string;
  timestamp: string;
  memberName: string;
  type: 'SpO2 Thấp' | 'Nhịp Tim Nhanh' | 'Nhịp Tim Chậm' | 'Thân Nhiệt Cao' | 'Cảnh Báo Té Ngã' | 'Huyết Áp Bất Thường';
  value: string;
  severity: 'warning' | 'critical';
  resolved: boolean;
}

export interface AirPollutionLog {
  id: string;
  timestamp: string;
  aqi: number;
  pm25: number;
  description: string;
  actionTaken: string;
}

export interface MedicationDose {
  time: string; // e.g. "07:30"
  enabled: boolean;
  medicines: string; // Tên thuốc & liều lượng
  pouchPrepared: boolean; // Túm thuốc đã nạp vào khay
}

export interface MedicationTray {
  id: string;
  trayNumber: number;
  assignedMemberId: string;
  assignedMemberName: string;
  activeDoseSession: 'morning' | 'noon' | 'afternoon' | 'evening' | null;
  isDispensing: boolean;
  dispensedWaitingPickup: boolean; // Thuốc đã đẩy ra, đang đợi người lấy
  alarmActive: boolean; // Đèn nháy & chuông báo đang kêu
  voiceReminderText: string; // "Bố ơi đã đến giờ uống thuốc, bố uống thuốc đi nha"
  schedule: {
    morning: MedicationDose;
    noon: MedicationDose;
    afternoon: MedicationDose;
    evening: MedicationDose;
  };
  daysOfWeek: string[]; // e.g. ["T2", "T3", "T4", "T5", "T6", "T7", "CN"]
}

export interface MedicationTakeLog {
  id: string;
  timestamp: string;
  dateKey: string; // YYYY-MM-DD
  memberName: string;
  trayNumber: number;
  session: 'Sáng' | 'Trưa' | 'Chiều' | 'Tối';
  medicines: string;
  takenAt: string;
}

export interface SoundTrack {
  id: string;
  title: string;
  category: 'sleep' | 'relax' | 'focus' | 'custom' | 'ai';
  subtitle: string;
  frequency: string;
  icon: string;
  synthType: 'rain' | 'waves' | 'delta' | 'stream' | 'bowl528' | 'piano' | 'ai_ambient';
  durationPreset?: number; // minutes or 0 for unlimited
  customUrl?: string;
  isCustom?: boolean;
}

export interface WorkoutVideo {
  id: string;
  title: string;
  category: 'physical' | 'mental';
  duration: string;
  level: 'Nhẹ nhàng' | 'Vừa sức' | 'Dưỡng sinh';
  target: string;
  description: string;
  steps: string[];
  videoUrl?: string;
  isCustom?: boolean;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
  generatedAssets?: {
    type: 'image' | 'chart' | 'file';
    title: string;
    url?: string;
    data?: any;
  }[];
}

export interface AILibraryItem {
  id: string;
  title: string;
  type: 'image' | 'video' | 'file' | 'report';
  createdAt: string;
  description: string;
  content: string;
  previewUrl?: string;
  mediaUrl?: string;
}

