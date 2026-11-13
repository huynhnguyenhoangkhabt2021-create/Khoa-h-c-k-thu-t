export type Esp32ConnectionSource = 'none' | 'http' | 'serial' | 'ble' | 'sim';

export interface Esp32TelemetryPayload {
  deviceId: string;
  source: Esp32ConnectionSource;
  bpm?: number;
  spo2?: number;
  bodyTemp?: number;
  pm25?: number;
  aqi?: number;
  roomTemp?: number;
  roomHumid?: number;
  purifierLevel?: 1 | 2 | 3;
  rssi?: number;
  firmware?: string;
  faultCode?: string;
  traySensors?: {
    morningBefore?: boolean;
    morningAfter?: boolean;
    noonAfternoon?: boolean;
    evening?: boolean;
  };
  receivedAt: number;
}

export interface Esp32ParseResult {
  ok: boolean;
  telemetry?: Esp32TelemetryPayload;
  warnings: string[];
  error?: string;
}

export function parseEsp32Telemetry(
  raw: unknown,
  defaultSource: Esp32ConnectionSource = 'http',
  nowMs: number = Date.now()
): Esp32ParseResult {
  let obj: any = raw;
  if (typeof raw === 'string') {
    const trimmed = raw.trim();
    if (!trimmed) {
      return { ok: false, warnings: [], error: 'Chuỗi dữ liệu ESP32 rỗng.' };
    }
    try {
      obj = JSON.parse(trimmed);
    } catch {
      return { ok: false, warnings: [], error: 'Gói tin ESP32 không đúng định dạng JSON.' };
    }
  }

  if (!obj || typeof obj !== 'object' || Array.isArray(obj)) {
    return { ok: false, warnings: [], error: 'Dữ liệu ESP32 phải là một JSON object.' };
  }

  const warnings: string[] = [];
  const srcRaw = String(obj.source || defaultSource || 'http').toLowerCase();
  const source: Esp32ConnectionSource =
    srcRaw === 'serial' || srcRaw === 'ble' || srcRaw === 'sim' || srcRaw === 'http'
      ? srcRaw
      : defaultSource;

  const deviceId = String(obj.deviceId || obj.id || 'ESP32-SH-01').trim().slice(0, 48) || 'ESP32-SH-01';
  let faultCode = obj.faultCode ? String(obj.faultCode).trim().slice(0, 48) : '';

  const numInRange = (val: unknown, min: number, max: number, label: string, faultTag: string): number | undefined => {
    if (val === undefined || val === null || val === '') return undefined;
    const n = Number(val);
    if (!Number.isFinite(n) || n < min || n > max) {
      warnings.push(`${label} ngoài ngưỡng hợp lệ (${String(val)})`);
      if (!faultCode) faultCode = faultTag;
      return undefined;
    }
    return n;
  };

  const bpm = numInRange(obj.bpm, 30, 220, 'Nhịp tim (BPM)', 'PPG_RANGE_ERR');
  const spo2 = numInRange(obj.spo2, 50, 100, 'SpO2 (%)', 'SPO2_RANGE_ERR');
  const bodyTemp = numInRange(obj.bodyTemp, 32, 43, 'Thân nhiệt (°C)', 'TEMP_RANGE_ERR');
  const pm25 = numInRange(obj.pm25, 0, 999, 'Bụi mịn PM2.5', 'PMS_RANGE_ERR');
  let aqi = numInRange(obj.aqi, 0, 500, 'Chỉ số AQI', 'AQI_RANGE_ERR');
  if (aqi === undefined && pm25 !== undefined) {
    aqi = Math.min(500, Math.max(0, Math.round(pm25 * 2.1)));
  }
  const roomTemp = numInRange(obj.roomTemp, -10, 60, 'Nhiệt độ phòng', 'DHT_TEMP_ERR');
  const roomHumid = numInRange(obj.roomHumid, 5, 100, 'Độ ẩm phòng', 'DHT_HUMID_ERR');
  const rssi = numInRange(obj.rssi, -120, 0, 'Tín hiệu Wi-Fi RSSI', 'RSSI_ERR');

  let purifierLevel: 1 | 2 | 3 | undefined;
  if (obj.purifierLevel !== undefined && obj.purifierLevel !== null) {
    const lvl = Number(obj.purifierLevel);
    if (lvl === 1 || lvl === 2 || lvl === 3) purifierLevel = lvl;
  }

  const tsRaw = obj.traySensors && typeof obj.traySensors === 'object' ? obj.traySensors : undefined;
  const traySensors = tsRaw
    ? {
        morningBefore: typeof tsRaw.morningBefore === 'boolean' ? tsRaw.morningBefore : undefined,
        morningAfter: typeof tsRaw.morningAfter === 'boolean' ? tsRaw.morningAfter : undefined,
        noonAfternoon: typeof tsRaw.noonAfternoon === 'boolean' ? tsRaw.noonAfternoon : undefined,
        evening: typeof tsRaw.evening === 'boolean' ? tsRaw.evening : undefined,
      }
    : undefined;

  const hasAnyMetric =
    bpm !== undefined ||
    spo2 !== undefined ||
    bodyTemp !== undefined ||
    pm25 !== undefined ||
    aqi !== undefined ||
    roomTemp !== undefined ||
    roomHumid !== undefined ||
    Boolean(traySensors) ||
    Boolean(faultCode);

  if (!hasAnyMetric) {
    return {
      ok: false,
      warnings,
      error: 'Gói tin ESP32 không chứa thông số cảm biến nào hợp lệ.'
    };
  }

  return {
    ok: true,
    warnings,
    telemetry: {
      deviceId,
      source,
      bpm: bpm !== undefined ? Math.round(bpm) : undefined,
      spo2: spo2 !== undefined ? Math.round(spo2) : undefined,
      bodyTemp: bodyTemp !== undefined ? Number(bodyTemp.toFixed(1)) : undefined,
      pm25: pm25 !== undefined ? Number(pm25.toFixed(1)) : undefined,
      aqi: aqi !== undefined ? Math.round(aqi) : undefined,
      roomTemp: roomTemp !== undefined ? Number(roomTemp.toFixed(1)) : undefined,
      roomHumid: roomHumid !== undefined ? Math.round(roomHumid) : undefined,
      purifierLevel,
      rssi: rssi !== undefined ? Math.round(rssi) : undefined,
      firmware: obj.firmware ? String(obj.firmware).trim().slice(0, 32) : undefined,
      faultCode: faultCode || undefined,
      traySensors,
      receivedAt: nowMs
    }
  };
}

export type DeviceHealthStatus =
  | 'unpaired'
  | 'simulated'
  | 'connected'
  | 'stale'
  | 'disconnected'
  | 'sensor_fault';

export interface DeviceHealthResult {
  status: DeviceHealthStatus;
  isLiveHardware: boolean;
  label: string;
  ageSeconds: number | null;
  alertMessage: string | null;
}

export function evaluateDeviceHealth(
  device: {
    source: Esp32ConnectionSource;
    lastTelemetryAt: number | null;
    faultCode?: string | null;
    simulationEnabled?: boolean;
  },
  nowMs: number = Date.now(),
  timeoutMs: number = 15000
): DeviceHealthResult {
  if (device.simulationEnabled || device.source === 'sim') {
    return {
      status: 'simulated',
      isLiveHardware: false,
      label: 'Chế độ Mô phỏng Kiểm thử (Không phải phần cứng thật)',
      ageSeconds: device.lastTelemetryAt ? Math.max(0, Math.round((nowMs - device.lastTelemetryAt) / 1000)) : null,
      alertMessage: null
    };
  }

  if (!device.lastTelemetryAt || device.source === 'none') {
    return {
      status: 'unpaired',
      isLiveHardware: false,
      label: 'Chưa kết nối ESP32 thật',
      ageSeconds: null,
      alertMessage: 'Chưa nhận được gói tin trực tiếp từ ESP32. Hãy kết nối qua Wi-Fi HTTP, USB Serial hoặc BLE.'
    };
  }

  const ageMs = Math.max(0, nowMs - device.lastTelemetryAt);
  const ageSeconds = Math.round(ageMs / 1000);

  if (ageMs > timeoutMs) {
    return {
      status: 'disconnected',
      isLiveHardware: false,
      label: `Mất kết nối ESP32 (${ageSeconds}s không phản hồi)`,
      ageSeconds,
      alertMessage: `CẢNH BÁO MẤT KẾT NỐI: Không nhận được dữ liệu từ ESP32 quá ${Math.round(timeoutMs / 1000)} giây (lần cuối cách đây ${ageSeconds}s). Vui lòng kiểm tra nguồn điện và Wi-Fi thiết bị.`
    };
  }

  if (device.faultCode) {
    return {
      status: 'sensor_fault',
      isLiveHardware: true,
      label: `Lỗi cảm biến ESP32 (${device.faultCode})`,
      ageSeconds,
      alertMessage: `CẢNH BÁO LỖI PHẦN CỨNG [${device.faultCode}]: Cảm biến trên ESP32 gửi giá trị lỗi hoặc mất tín hiệu đo. Cần kiểm tra dây nối cảm biến.`
    };
  }

  if (ageMs > Math.max(6000, Math.floor(timeoutMs * 0.55))) {
    return {
      status: 'stale',
      isLiveHardware: true,
      label: `Tín hiệu ESP32 chậm (${ageSeconds}s trước)`,
      ageSeconds,
      alertMessage: null
    };
  }

  const srcText =
    device.source === 'serial'
      ? 'USB Serial'
      : device.source === 'ble'
      ? 'Bluetooth BLE'
      : 'Wi-Fi HTTP';

  return {
    status: 'connected',
    isLiveHardware: true,
    label: `Đang nhận dữ liệu thật ESP32 (${srcText})`,
    ageSeconds,
    alertMessage: null
  };
}

export interface AirQualityEvaluation {
  aqi: number;
  pm25: number;
  tier: 'good' | 'moderate' | 'poor';
  label: string;
  recommendedLevel: 1 | 2 | 3;
  recommendedLabel: string;
}

export function evaluateAirQuality(pm25Raw: number, aqiRaw?: number): AirQualityEvaluation {
  const pm25 = Number.isFinite(Number(pm25Raw)) ? Math.max(0, Number(pm25Raw)) : 0;
  const aqi =
    aqiRaw !== undefined && Number.isFinite(Number(aqiRaw))
      ? Math.max(0, Math.round(Number(aqiRaw)))
      : Math.round(pm25 * 2.1);

  if (pm25 >= 50 || aqi > 100) {
    return {
      aqi,
      pm25: Number(pm25.toFixed(1)),
      tier: 'poor',
      label: 'Ô nhiễm — Cần lọc Mức 3',
      recommendedLevel: 3,
      recommendedLabel: 'Mức 3: Cao / Tăng cường (Turbo)'
    };
  }
  if (pm25 >= 25 || aqi > 50) {
    return {
      aqi,
      pm25: Number(pm25.toFixed(1)),
      tier: 'moderate',
      label: 'Trung bình — Nên lọc Mức 2',
      recommendedLevel: 2,
      recommendedLabel: 'Mức 2: Trung bình (Medium)'
    };
  }
  return {
    aqi,
    pm25: Number(pm25.toFixed(1)),
    tier: 'good',
    label: 'Không khí tốt',
    recommendedLevel: 1,
    recommendedLabel: 'Mức 1: Thấp / Chế độ Ngủ (< 25 dB)'
  };
}

export type SlotDoseStatus =
  | 'disabled'
  | 'pending'
  | 'removed_unconfirmed'
  | 'consumed'
  | 'overdue';

export interface SlotDoseResolution {
  status: SlotDoseStatus;
  badgeText: string;
  needsDrinkWarning: boolean;
  takenOutAt: string | null;
  consumedAt: string | null;
}

export function resolveSlotDoseState(params: {
  enabled: boolean;
  scheduledMinutes: number;
  currentMinutes: number;
  pouchPresent?: boolean;
  takenOutAt?: string | null;
  takenOutTimestamp?: number | null;
  consumedAt?: string | null;
  nowMs?: number;
}): SlotDoseResolution {
  if (!params.enabled) {
    return {
      status: 'disabled',
      badgeText: 'TẮT CỮ NÀY',
      needsDrinkWarning: false,
      takenOutAt: null,
      consumedAt: null
    };
  }

  if (params.consumedAt) {
    return {
      status: 'consumed',
      badgeText: 'ĐÃ UỐNG THUỐC',
      needsDrinkWarning: false,
      takenOutAt: params.takenOutAt || null,
      consumedAt: params.consumedAt
    };
  }

  if (params.takenOutAt || params.pouchPresent === false) {
    const nowMs = params.nowMs ?? Date.now();
    const elapsedMin =
      params.takenOutTimestamp && params.takenOutTimestamp > 0
        ? Math.floor((nowMs - params.takenOutTimestamp) / 60000)
        : 0;
    return {
      status: 'removed_unconfirmed',
      badgeText: 'ĐÃ LẤY KHỎI KHAY · CHỜ XÁC NHẬN UỐNG',
      needsDrinkWarning: elapsedMin >= 15,
      takenOutAt: params.takenOutAt || 'Đã lấy ra khỏi khay',
      consumedAt: null
    };
  }

  if (params.currentMinutes > params.scheduledMinutes + 30) {
    return {
      status: 'overdue',
      badgeText: 'QUÁ GIỜ CHƯA UỐNG',
      needsDrinkWarning: false,
      takenOutAt: null,
      consumedAt: null
    };
  }

  return {
    status: 'pending',
    badgeText: 'CHỜ ĐẾN GIỜ',
    needsDrinkWarning: false,
    takenOutAt: null,
    consumedAt: null
  };
}

export type AccessLevel = 'admin' | 'caregiver' | 'elder' | 'view_only';

export interface RolePermissions {
  level: AccessLevel;
  roleLabel: string;
  canViewSensitive: boolean;
  canEditMedication: boolean;
  canControlPurifier: boolean;
  canManageDevices: boolean;
  canManagePermissions: boolean;
  canEditPatientProfile: boolean;
  canConfirmOwnDose: boolean;
  canTriggerSos: boolean;
}

export function getRolePermissions(roleOrLevel?: string | null): RolePermissions {
  const raw = String(roleOrLevel || '').trim().toLowerCase();

  if (
    raw === 'admin' ||
    raw.includes('bác sĩ') ||
    raw.includes('quản trị')
  ) {
    return {
      level: 'admin',
      roleLabel: 'Bác Sĩ / Quản Trị Toàn Quyền',
      canViewSensitive: true,
      canEditMedication: true,
      canControlPurifier: true,
      canManageDevices: true,
      canManagePermissions: true,
      canEditPatientProfile: true,
      canConfirmOwnDose: true,
      canTriggerSos: true
    };
  }

  if (
    raw === 'caregiver' ||
    raw.includes('chăm sóc') ||
    raw.includes('giám hộ')
  ) {
    return {
      level: 'caregiver',
      roleLabel: 'Người Chăm Sóc Chính',
      canViewSensitive: true,
      canEditMedication: true,
      canControlPurifier: true,
      canManageDevices: true,
      canManagePermissions: false,
      canEditPatientProfile: true,
      canConfirmOwnDose: true,
      canTriggerSos: true
    };
  }

  if (
    raw === 'view_only' ||
    raw.includes('chỉ xem') ||
    raw.includes('thành viên gia đình') ||
    raw.includes('người thân')
  ) {
    return {
      level: 'view_only',
      roleLabel: 'Người Thân Chỉ Xem & Nhận SOS',
      canViewSensitive: false,
      canEditMedication: false,
      canControlPurifier: false,
      canManageDevices: false,
      canManagePermissions: false,
      canEditPatientProfile: false,
      canConfirmOwnDose: false,
      canTriggerSos: true
    };
  }

  // Default / Elder patient role: safe for seniors (can confirm own dose, log daily symptoms, trigger SOS; cannot accidentally alter prescription schedules or delete family permissions)
  return {
    level: 'elder',
    roleLabel: 'Người Bệnh / Người Cao Tuổi',
    canViewSensitive: true,
    canEditMedication: false,
    canControlPurifier: true,
    canManageDevices: false,
    canManagePermissions: false,
    canEditPatientProfile: false,
    canConfirmOwnDose: true,
    canTriggerSos: true
  };
}

export type AiScopeKind =
  | 'in_scope'
  | 'needs_emergency'
  | 'out_of_scope_diagnosis'
  | 'out_of_scope_prescription';

export interface AiScopeEvaluation {
  kind: AiScopeKind;
  allowModelCall: boolean;
  refusalOrBanner?: string;
}

export function evaluateAiQueryScope(query: string): AiScopeEvaluation {
  const q = String(query || '').trim().toLowerCase();
  if (!q) {
    return { kind: 'in_scope', allowModelCall: true };
  }

  const emergencyPatterns = [
    'đau ngực dữ dội',
    'khó thở nặng',
    'ngất',
    'bất tỉnh',
    'hôn mê',
    'liệt nửa người',
    'méo miệng',
    'co giật',
    'nôn ra máu',
    '180/120'
  ];
  if (emergencyPatterns.some(p => q.includes(p))) {
    return {
      kind: 'needs_emergency',
      allowModelCall: false,
      refusalOrBanner:
        '🚨 CẢNH BÁO TÌNH HUỐNG CẦN CẤP CỨU NGAY!\n\nCác dấu hiệu bạn mô tả vượt quá phạm vi tư vấn của trợ lý phần mềm và có thể là tình huống y khoa khẩn cấp.\n\n1. Hành động ngay lập tức:\n• Gọi ngay Tổng đài Cấp Cứu 115 hoặc nhấn nút đỏ "CẤP CỨU SOS" ở góc màn hình để gửi vị trí cho người thân.\n• Không tự ý cho người bệnh uống thuốc hạ áp nhanh hoặc đổ nước khi đang lơ mơ.\n• Giữ người bệnh nằm nghiêng an toàn, nới lỏng cổ áo và chờ nhân viên y tế.'
    };
  }

  const prescriptionPatterns = [
    'kê đơn',
    'kê toa',
    'cho tôi toa thuốc',
    'tăng liều',
    'giảm liều',
    'đổi thuốc',
    'ngưng thuốc',
    'bỏ thuốc',
    'nên uống thuốc gì trị',
    'uống bao nhiêu mg',
    'uống mấy viên để chữa'
  ];
  if (prescriptionPatterns.some(p => q.includes(p))) {
    return {
      kind: 'out_of_scope_prescription',
      allowModelCall: false,
      refusalOrBanner:
        '⚠️ GIỚI HẠN CHUYÊN MÔN: KHÔNG KÊ ĐƠN HOẶC THAY ĐỔI LIỀU THUỐC\n\nTrợ lý AI Smart Healthcare chỉ hỗ trợ nhắc giờ uống thuốc đúng toa, giải thích lưu ý uống trước/sau ăn và theo dõi tuân thủ. Hệ thống KHÔNG được phép kê đơn thuốc mới, tăng/giảm liều hoặc chỉ định ngưng thuốc thay bác sĩ.\n\n• Khuyến nghị an toàn: Tuyệt đối giữ nguyên phác đồ hiện tại và liên hệ Bác sĩ điều trị chính (hoặc xuất file PDF từ tab "Hồ Sơ Sức Khỏe" mang đi tái khám) để được chỉnh liều chính xác.'
    };
  }

  const diagnosisPatterns = [
    'chẩn đoán giúp',
    'tôi bị bệnh gì',
    'bác sĩ kết luận giúp',
    'kết luận bệnh',
    'có phải tôi bị ung thư',
    'có bị suy tim không',
    'đọc phim x-quang',
    'đọc kết quả xét nghiệm máu khẳng định'
  ];
  if (diagnosisPatterns.some(p => q.includes(p))) {
    return {
      kind: 'out_of_scope_diagnosis',
      allowModelCall: false,
      refusalOrBanner:
        '⚠️ GIỚI HẠN CHUYÊN MÔN: KHÔNG THAY THẾ BÁC SĨ CHẨN ĐOÁN BỆNH\n\nTrợ lý AI Smart Healthcare giúp tổng hợp sinh hiệu, nhật ký triệu chứng và cung cấp kiến thức chăm sóc người cao tuổi theo tài liệu y khoa. Hệ thống KHÔNG đủ thẩm quyền và dữ liệu cận lâm sàng để đưa ra kết luận chẩn đoán xác định bệnh lý.\n\n• Khuyến nghị an toàn: Hãy nhấn "Xuất Báo Cáo Sức Khỏe (PDF)" trong Hồ Sơ Sức Khỏe để mang đầy đủ sinh hiệu & nhật ký triệu chứng đến bác sĩ chuyên khoa thăm khám trực tiếp.'
    };
  }

  return { kind: 'in_scope', allowModelCall: true };
}

export function normalizeTheme(raw: unknown): 'light' | 'dark' {
  return String(raw || '').toLowerCase() === 'dark' ? 'dark' : 'light';
}
