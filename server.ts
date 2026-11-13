import express from 'express';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import {
  parseEsp32Telemetry,
  evaluateDeviceHealth,
  evaluateAirQuality,
  evaluateAiQueryScope,
  type Esp32TelemetryPayload,
  type AccessLevel
} from './src/utils/smartDeviceLogic.ts';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
app.use(express.json({ limit: '1mb' }));

// Health check endpoint for control plane
app.get('/healthz', (_req, res) => {
  res.status(200).send('OK');
});

const AI_SCOPE_SYSTEM_INSTRUCTION = `Bạn là Trợ lý Thông Tin Sức Khỏe Smart Healthcare hỗ trợ người cao tuổi và gia đình tại Việt Nam.
PHẠM VI ĐƯỢC PHÉP:
- Giải thích khái niệm y khoa phổ thông, cách đo huyết áp/SpO2 đúng kỹ thuật tại nhà.
- Nhắc nguyên tắc uống thuốc an toàn chung (uống trước/sau ăn, uống đủ 150-200ml nước lọc, không uống cùng nước chè/nước bưởi, nhận biết quy tắc F.A.S.T đột quỵ hoặc quy tắc 15-15 hạ đường huyết).
- Tóm tắt xu hướng từ nhật ký sinh hiệu/cảm nhận mà người dùng đã ghi lại.

GIỚI HẠN NGHIÊM NGẶT (KHÔNG ĐƯỢC VI PHẠM):
- KHÔNG chẩn đoán xác định bệnh lý, KHÔNG đọc kết luận phim X-quang/CT/xét nghiệm thay bác sĩ.
- KHÔNG kê đơn thuốc mới, KHÔNG chỉ định tăng/giảm liều hay tự ý ngưng thuốc.
- Nếu có dấu hiệu cấp cứu (đau ngực dữ dội, khó thở nặng, liệt, méo miệng, HA >= 180/120), yêu cầu gọi ngay 115 và bật SOS.
- Luôn kết thúc bằng nhắc nhở trao đổi trực tiếp với bác sĩ điều trị.`;

// API chat route for Gemini AI medical consultation with strict clinical scope guardrails
app.post('/api/chat', async (req, res) => {
  try {
    const { message, dailyLogSummary } = req.body || {};
    const rawMsg = String(message || '').trim();
    if (!rawMsg) {
      return res.status(400).json({ error: 'Vui lòng nhập câu hỏi cần tư vấn.' });
    }

    const scope = evaluateAiQueryScope(rawMsg);
    if (!scope.allowModelCall && scope.refusalOrBanner) {
      return res.json({
        reply: scope.refusalOrBanner,
        scopeKind: scope.kind,
        citations: ['Phạm vi An toàn Y khoa Smart Healthcare']
      });
    }

    const apiKey = process.env.GEMINI_API_KEY || '';

    // If Gemini API key is available in environment
    if (apiKey) {
      try {
        const { GoogleGenAI } = await import('@google/genai');
        const ai = new GoogleGenAI({
          apiKey,
          httpOptions: { headers: { 'User-Agent': 'aistudio-build' } }
        });
        const contextLine = dailyLogSummary
          ? `\nThông tin nhật ký triệu chứng gần đây do người dùng tự ghi: ${dailyLogSummary}`
          : '';
        const response = await ai.models.generateContent({
          model: 'gemini-4-hydrogen',
          config: {
            systemInstruction: AI_SCOPE_SYSTEM_INSTRUCTION
          },
          contents: [
            {
              role: 'user',
              parts: [
                {
                  text: `Bối cảnh theo dõi tại nhà:${contextLine}\n\nCâu hỏi của người bệnh/người chăm sóc: ${rawMsg}`
                }
              ]
            }
          ]
        });
        return res.json({
          reply: response.text,
          scopeKind: 'in_scope',
          citations: ['Hướng dẫn Chăm sóc Người cao tuổi - Bộ Y Tế & WHO (Tham khảo)']
        });
      } catch (err: any) {
        console.error('Gemini error, fallback to clinical rule-engine:', err?.message || err);
      }
    }

    // Clinical Rule-based RAG/CAG fallback (scoped & safe)
    const lower = rawMsg.toLowerCase();
    let reply = '';
    const citations = [
      'Bộ Y Tế Việt Nam - Hướng dẫn theo dõi sức khỏe người cao tuổi tại cộng đồng',
      'Dược thư Quốc gia Việt Nam - Lưu ý tương tác thuốc & thời điểm uống',
      'WHO ICOPE - Chăm sóc tích hợp cho người cao tuổi'
    ];

    if (lower.includes('step-elderly') || (lower.includes('huyết áp') && lower.includes('lancet'))) {
      reply = `Tham khảo nghiên cứu STEP-Elderly (The Lancet 2024):\n\n1. Điểm chính từ nghiên cứu:\n• Theo dõi trên 8.500 người cao tuổi (65–84 tuổi) cho thấy mức huyết áp mục tiêu được bác sĩ kiểm soát ở 120–130 mmHg giúp giảm 26% biến cố tim mạch chính so với 130–140 mmHg.\n\n2. Cách gia đình hỗ trợ theo dõi an toàn:\n• Đo huyết áp bắp tay đúng tư thế vào buổi sáng và tối.\n• Duy trì ăn nhạt giảm muối, tuyệt đối không tự ý thay đổi liều thuốc khi chưa có chỉ định bác sĩ.`;
    } else if (lower.includes('sglt2') || (lower.includes('tiểu đường') && lower.includes('nejm'))) {
      reply = `Tham khảo hướng dẫn chăm sóc người cao tuổi đái tháo đường:\n\n1. Theo dõi sinh hoạt hằng ngày:\n• Uống đủ 1.5–2 lít nước ấm chia đều trong ngày.\n• Quan sát các dấu hiệu bất thường như run tay, vã mồ hôi lạnh (nghi hạ đường huyết) hoặc mệt lả.\n\n2. Lưu ý giới hạn: Mọi điều chỉnh thuốc điều trị tiểu đường phải do bác sĩ chuyên khoa Nội tiết quyết định.`;
    } else if (lower.includes('beers') || lower.includes('đa thuốc') || lower.includes('polypharmacy')) {
      reply = `Lưu ý an toàn dùng đa thuốc ở người cao tuổi (Tiêu chuẩn AGS Beers):\n\n1. Nguy cơ cần phòng tránh:\n• Không tự ý mua thêm thuốc giảm đau chống viêm (NSAIDs) hoặc thuốc an thần gây buồn ngủ vì làm tăng nguy cơ té ngã và kích ứng dạ dày.\n\n2. Giải pháp quản lý tại nhà: Phân chia khay thuốc rõ 4 buổi và mang danh sách thuốc thực tế đi tái khám mỗi 1–3 tháng để bác sĩ rà soát.`;
    } else if (lower.includes('huyết áp') || lower.includes('tăng huyết áp')) {
      reply = `Thông tin tham khảo theo dõi huyết áp tại nhà (Bộ Y Tế):\n\n1. Ngưỡng tham khảo thường gặp: Nhiều hướng dẫn đặt mục tiêu khoảng 120–130 / 70–80 mmHg cho người >65 tuổi khỏe mạnh (mục tiêu cụ thể từng người do bác sĩ quyết định).\n2. Kỹ thuật đo chuẩn: Ngồi nghỉ yên 5 phút, tựa lưng, vòng bít ngang tim.\n3. Khi nào cần đi khám/cấp cứu: Huyết áp >= 180/120 mmHg kèm đau ngực, khó thở, yếu liệt -> Gọi 115 ngay.`;
    } else if (lower.includes('đường') || lower.includes('tiểu đường') || lower.includes('đái tháo đường')) {
      reply = `Hướng dẫn theo dõi đường huyết & xử trí hạ đường huyết tham khảo:\n\n1. Dấu hiệu hạ đường huyết: Run tay, vã mồ hôi lạnh, chóng mặt, đói cồn cào.\n2. Quy tắc 15–15 khi người bệnh còn tỉnh táo: Dùng ngay 15g đường nhanh (150ml nước ngọt/3 viên kẹo), đo lại sau 15 phút.\n3. Nếu lơ mơ hoặc hôn mê: Không đổ nước vào miệng, gọi ngay 115.`;
    } else if (lower.includes('thuốc') || lower.includes('uống') || lower.includes('liều')) {
      reply = `Nguyên tắc uống thuốc an toàn tại nhà:\n\n1. Tuân thủ đúng cữ thuốc trong khay (Trước ăn 30 phút / Sau ăn sáng / Trưa / Tối).\n2. Không tự ý nghiền bẻ viên nén bao phim hoặc viên phóng thích kéo dài (XR, SR, MR).\n3. Uống với 150–200ml nước lọc ấm; tránh uống chung với nước chè đặc, cà phê hoặc nước bưởi chùm.\n\n*Lưu ý: Trợ lý AI không thay đổi liều lượng trong đơn thuốc của bác sĩ.*`;
    } else {
      reply = `Thông tin tham khảo chăm sóc sức khỏe hằng ngày Smart Healthcare:\n\n- Duy trì đo sinh hiệu (Nhịp tim, SpO2, Thân nhiệt, Huyết áp) và ghi vào Nhật ký sức khỏe mỗi ngày.\n- Giữ phòng ở thông thoáng, máy lọc không khí hoạt động phù hợp mức PM2.5.\n- Xác nhận đúng 2 bước uống thuốc: lấy thuốc khỏi khay và bấm xác nhận đã uống.\n\n⚠️ Giới hạn hỗ trợ: Đây là thông tin tham khảo hỗ trợ sinh hoạt tại nhà, KHÔNG thay thế chẩn đoán hay đơn thuốc của bác sĩ.`;
    }

    return res.json({ reply, scopeKind: 'in_scope', citations });
  } catch (error: any) {
    return res.status(500).json({ error: error.message || 'Lỗi xử lý yêu cầu AI' });
  }
});

// Real-time Family Connection, ESP32 Hardware Telemetry, Obstacle Sensor & Activity History API
interface FamilyContact {
  id: string;
  name: string;
  relation: string;
  phone: string;
  email: string;
  priority: number;
  autoSos: boolean;
  channels: string[];
  accessLevel: AccessLevel;
  note: string;
}

interface FamilyMessage {
  id: string;
  sender: string;
  text: string;
  type: 'checkin' | 'med' | 'sos' | 'sensor' | 'device';
  time: string;
  timestamp: number;
}

interface ActiveSosAlert {
  id: string;
  patientName: string;
  condition: string;
  address: string;
  gpsUrl: string;
  smsRecipients?: { name: string; relation: string; phone: string; priority: number }[];
  smsBody?: string;
  time: string;
  timestamp: number;
}

interface ObstacleSensorEvent {
  id: string;
  trayNumber: number;
  slotKey: string;
  slotLabel: string;
  memberName: string;
  pouchPresent: boolean;
  message: string;
  time: string;
  timestamp: number;
}

interface HealthDailyLog {
  id: string;
  dateKey: string;
  timeOfDay: string;
  mood: number;
  energy: number;
  pain: number;
  symptoms: string[];
  note: string;
  createdAt: number;
}

interface ActivityLogItem {
  id: string;
  category: 'device' | 'med' | 'air' | 'sos' | 'security';
  level: 'info' | 'warning' | 'critical';
  title: string;
  detail: string;
  actor: string;
  time: string;
  timestamp: number;
}

interface Esp32DeviceState {
  deviceId: string;
  source: 'none' | 'http' | 'serial' | 'ble' | 'sim';
  lastTelemetryAt: number | null;
  firmware: string;
  rssi: number | null;
  faultCode: string | null;
  disconnectLoggedForAt: number | null;
  latestTelemetry: Esp32TelemetryPayload | null;
  purifierMode: 'auto' | 'manual';
  purifierLevel: 1 | 2 | 3;
  pendingCommand: {
    id: string;
    purifierMode: 'auto' | 'manual';
    purifierLevel: 1 | 2 | 3;
    dispenseSlot?: string;
    buzzerTest?: boolean;
    issuedAt: number;
  } | null;
}

interface FamilyRoomState {
  contacts: FamilyContact[];
  messages: FamilyMessage[];
  activeSos: ActiveSosAlert | null;
  obstacleEvents: ObstacleSensorEvent[];
  dailyLogs: HealthDailyLog[];
  activityLogs: ActivityLogItem[];
  esp32Device: Esp32DeviceState;
  updatedAt: number;
}

const familyRooms = new Map<string, FamilyRoomState>();

function formatTimeVi(ts: number = Date.now()): string {
  return new Date(ts).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
}

function appendRoomActivity(
  room: FamilyRoomState,
  entry: Omit<ActivityLogItem, 'id' | 'time' | 'timestamp'> & { id?: string; time?: string; timestamp?: number }
) {
  const ts = entry.timestamp || Date.now();
  const item: ActivityLogItem = {
    id: entry.id || `act-${ts}-${Math.floor(Math.random() * 1000)}`,
    category: entry.category,
    level: entry.level,
    title: String(entry.title).slice(0, 120),
    detail: String(entry.detail).slice(0, 320),
    actor: String(entry.actor || 'Hệ thống').slice(0, 80),
    time: entry.time || formatTimeVi(ts),
    timestamp: ts
  };
  room.activityLogs.unshift(item);
  if (room.activityLogs.length > 80) room.activityLogs.length = 80;
  return item;
}

function getOrCreateRoom(rawRoom: string): FamilyRoomState {
  const code = (rawRoom || 'GIA-DINH-01').toUpperCase().replace(/[^A-Z0-9_-]/g, '').slice(0, 32) || 'GIA-DINH-01';
  let room = familyRooms.get(code);
  if (!room) {
    room = {
      contacts: [],
      messages: [],
      activeSos: null,
      obstacleEvents: [],
      dailyLogs: [],
      activityLogs: [],
      esp32Device: {
        deviceId: 'ESP32-SH-01',
        source: 'none',
        lastTelemetryAt: null,
        firmware: '',
        rssi: null,
        faultCode: null,
        disconnectLoggedForAt: null,
        latestTelemetry: null,
        purifierMode: 'auto',
        purifierLevel: 1,
        pendingCommand: null
      },
      updatedAt: Date.now()
    };
    familyRooms.set(code, room);
  }
  return room;
}

function refreshRoomDeviceWatchdog(room: FamilyRoomState) {
  const health = evaluateDeviceHealth({
    source: room.esp32Device.source,
    lastTelemetryAt: room.esp32Device.lastTelemetryAt,
    faultCode: room.esp32Device.faultCode
  });

  if (
    health.status === 'disconnected' &&
    room.esp32Device.lastTelemetryAt &&
    room.esp32Device.disconnectLoggedForAt !== room.esp32Device.lastTelemetryAt
  ) {
    room.esp32Device.disconnectLoggedForAt = room.esp32Device.lastTelemetryAt;
    appendRoomActivity(room, {
      category: 'device',
      level: 'critical',
      title: `Mất kết nối thiết bị ${room.esp32Device.deviceId}`,
      detail: health.alertMessage || 'Không nhận được gói tin heartbeat từ ESP32.',
      actor: 'Giám sát thiết bị ESP32'
    });
    room.messages.unshift({
      id: 'fmsg-disc-' + Date.now(),
      sender: 'Giám sát Phần cứng ESP32',
      text: health.alertMessage || 'Thiết bị ESP32 đã mất kết nối.',
      type: 'device',
      time: formatTimeVi(),
      timestamp: Date.now()
    });
    if (room.messages.length > 40) room.messages.length = 40;
  }

  return health;
}

app.get('/api/family-sync/:room', (req, res) => {
  const room = getOrCreateRoom(req.params.room);
  const deviceHealth = refreshRoomDeviceWatchdog(room);
  res.json({ ...room, deviceHealth });
});

// Real ESP32 Telemetry Ingestion Endpoint (Wi-Fi HTTP POST from ESP32 firmware or local test harness)
app.post('/api/esp32/telemetry', (req, res) => {
  const roomCode = String(req.body?.roomCode || req.body?.room || req.query?.roomCode || req.query?.room || 'GIA-DINH-01');
  const room = getOrCreateRoom(roomCode);
  const parsed = parseEsp32Telemetry(req.body, 'http', Date.now());
  if (!parsed.ok || !parsed.telemetry) {
    appendRoomActivity(room, {
      category: 'device',
      level: 'warning',
      title: 'Gói tin ESP32 lỗi định dạng',
      detail: parsed.error || 'Dữ liệu telemetry từ ESP32 không hợp lệ.',
      actor: 'ESP32 HTTP Bridge'
    });
    return res.status(400).json({ ok: false, error: parsed.error });
  }

  const t = parsed.telemetry;
  const wasDisconnected =
    room.esp32Device.source === 'none' ||
    evaluateDeviceHealth({
      source: room.esp32Device.source,
      lastTelemetryAt: room.esp32Device.lastTelemetryAt,
      faultCode: room.esp32Device.faultCode
    }).status === 'disconnected';

  const prevTraySensors = room.esp32Device.latestTelemetry?.traySensors || {};
  room.esp32Device.deviceId = t.deviceId;
  room.esp32Device.source = t.source;
  room.esp32Device.lastTelemetryAt = t.receivedAt;
  room.esp32Device.disconnectLoggedForAt = null;
  if (t.firmware) room.esp32Device.firmware = t.firmware;
  if (t.rssi !== undefined) room.esp32Device.rssi = t.rssi;
  room.esp32Device.faultCode = t.faultCode || null;
  room.esp32Device.latestTelemetry = {
    ...(room.esp32Device.latestTelemetry || {}),
    ...t
  };

  if (t.pm25 !== undefined && room.esp32Device.purifierMode === 'auto') {
    room.esp32Device.purifierLevel = evaluateAirQuality(t.pm25, t.aqi).recommendedLevel;
  } else if (t.purifierLevel) {
    room.esp32Device.purifierLevel = t.purifierLevel;
  }

  if (wasDisconnected) {
    appendRoomActivity(room, {
      category: 'device',
      level: 'info',
      title: `Kết nối thành công ${t.deviceId} (${t.source.toUpperCase()})`,
      detail: `Đã bắt đầu nhận dữ liệu thực tế${t.firmware ? ' • FW ' + t.firmware : ''}${t.rssi ? ' • Wi-Fi ' + t.rssi + ' dBm' : ''}.`,
      actor: t.deviceId
    });
  }

  if (t.faultCode) {
    appendRoomActivity(room, {
      category: 'device',
      level: 'warning',
      title: `Cảnh báo lỗi cảm biến [${t.faultCode}]`,
      detail: parsed.warnings.join('; ') || `Thiết bị ${t.deviceId} báo mã lỗi phần cứng ${t.faultCode}.`,
      actor: t.deviceId
    });
  }

  // Detect tray obstacle state transitions from hardware IR/ultrasonic sensors (Taken Out ONLY — NOT consumed!)
  if (t.traySensors) {
    const slotLabels: Record<string, string> = {
      morningBefore: 'Buổi Sáng (Trước ăn 30 phút)',
      morningAfter: 'Buổi Sáng (Sau ăn sáng)',
      noonAfternoon: 'Buổi Trưa / Chiều',
      evening: 'Buổi Tối'
    };
    (['morningBefore', 'morningAfter', 'noonAfternoon', 'evening'] as const).forEach((slotKey) => {
      const curr = t.traySensors?.[slotKey];
      const prev = (prevTraySensors as any)?.[slotKey];
      if (curr === false && prev !== false) {
        const timeStr = formatTimeVi(t.receivedAt);
        const slotLabel = slotLabels[slotKey];
        const msg = `CẢM BIẾN KHAY ESP32: Túm thuốc ${slotLabel} vừa được LẤY RA KHỎI KHAY lúc ${timeStr} — Chờ người bệnh xác nhận đã uống.`;
        room.obstacleEvents.unshift({
          id: `obs-hw-${t.receivedAt}-${slotKey}`,
          trayNumber: 1,
          slotKey,
          slotLabel,
          memberName: 'Khay ESP32 #1',
          pouchPresent: false,
          message: msg,
          time: timeStr,
          timestamp: t.receivedAt
        });
        if (room.obstacleEvents.length > 30) room.obstacleEvents.length = 30;
        appendRoomActivity(room, {
          category: 'med',
          level: 'info',
          title: `Đã lấy thuốc khỏi khay (${slotLabel})`,
          detail: 'Cảm biến vật cản ESP32 phát hiện thuốc đã rời khay. Hệ thống đang chờ xác nhận đã uống.',
          actor: t.deviceId,
          timestamp: t.receivedAt
        });
      }
    });
  }

  room.updatedAt = Date.now();
  const deviceHealth = refreshRoomDeviceWatchdog(room);
  const cmdToReturn = room.esp32Device.pendingCommand;
  // Clear one-shot hardware trigger fields after delivery while retaining purifier state
  if (room.esp32Device.pendingCommand) {
    room.esp32Device.pendingCommand = {
      ...room.esp32Device.pendingCommand,
      dispenseSlot: undefined,
      buzzerTest: false
    };
  }

  return res.json({
    ok: true,
    warnings: parsed.warnings,
    telemetry: room.esp32Device.latestTelemetry,
    deviceHealth,
    command: cmdToReturn
  });
});

app.get('/api/esp32/status/:room', (req, res) => {
  const room = getOrCreateRoom(req.params.room);
  const deviceHealth = refreshRoomDeviceWatchdog(room);
  res.json({
    ok: true,
    deviceHealth,
    esp32Device: room.esp32Device,
    activityLogs: room.activityLogs.slice(0, 40)
  });
});

app.post('/api/esp32/command/:room', (req, res) => {
  const room = getOrCreateRoom(req.params.room);
  const mode = req.body?.purifierMode === 'manual' ? 'manual' : 'auto';
  const lvlRaw = Number(req.body?.purifierLevel);
  const level: 1 | 2 | 3 = lvlRaw === 2 || lvlRaw === 3 ? lvlRaw : 1;
  const dispenseSlot = req.body?.dispenseSlot ? String(req.body.dispenseSlot).slice(0, 32) : undefined;
  const buzzerTest = Boolean(req.body?.buzzerTest);
  const actor = String(req.body?.actor || 'Người quản trị').slice(0, 80);

  room.esp32Device.purifierMode = mode;
  room.esp32Device.purifierLevel = level;
  room.esp32Device.pendingCommand = {
    id: 'cmd-' + Date.now(),
    purifierMode: mode,
    purifierLevel: level,
    dispenseSlot,
    buzzerTest,
    issuedAt: Date.now()
  };

  appendRoomActivity(room, {
    category: dispenseSlot ? 'med' : 'air',
    level: 'info',
    title: dispenseSlot ? `Gửi lệnh nhả khay thuốc (${dispenseSlot})` : `Điều chỉnh máy lọc không khí: ${mode === 'auto' ? 'Tự động AI' : 'Thủ công'} Mức ${level}`,
    detail: `Lệnh đã được xếp hàng gửi tới thiết bị ${room.esp32Device.deviceId}.`,
    actor
  });
  room.updatedAt = Date.now();
  res.json({ ok: true, esp32Device: room.esp32Device, activityLogs: room.activityLogs.slice(0, 40) });
});

app.post('/api/family-sync/:room/activity', (req, res) => {
  const room = getOrCreateRoom(req.params.room);
  const cat = req.body?.category;
  const category = (cat === 'device' || cat === 'med' || cat === 'air' || cat === 'sos' || cat === 'security') ? cat : 'device';
  const lvl = req.body?.level;
  const level = (lvl === 'warning' || lvl === 'critical') ? lvl : 'info';
  const title = String(req.body?.title || '').trim();
  if (!title) return res.status(400).json({ error: 'Thiếu tiêu đề nhật ký.' });

  const item = appendRoomActivity(room, {
    category,
    level,
    title,
    detail: String(req.body?.detail || ''),
    actor: String(req.body?.actor || 'Hệ thống')
  });
  room.updatedAt = Date.now();
  res.json({ ok: true, item, activityLogs: room.activityLogs });
});

app.post('/api/family-sync/:room/contacts', (req, res) => {
  const room = getOrCreateRoom(req.params.room);
  const contacts = Array.isArray(req.body?.contacts) ? req.body.contacts : [];
  room.contacts = contacts.slice(0, 20).map((c: any) => {
    const rawAccess = String(c.accessLevel || 'view_only').toLowerCase();
    const accessLevel: AccessLevel =
      rawAccess === 'admin' || rawAccess === 'caregiver' ? rawAccess : 'view_only';
    return {
      id: String(c.id || 'fc-' + Date.now()),
      name: String(c.name || '').trim().slice(0, 80),
      relation: String(c.relation || 'Người thân').trim().slice(0, 40),
      phone: String(c.phone || '').trim().slice(0, 24),
      email: String(c.email || '').trim().slice(0, 100),
      priority: Number(c.priority) >= 1 && Number(c.priority) <= 5 ? Number(c.priority) : 1,
      autoSos: c.autoSos !== false,
      channels: Array.isArray(c.channels) ? c.channels.map((x: any) => String(x).slice(0, 20)) : ['Gọi điện', 'SMS', 'Zalo'],
      accessLevel,
      note: String(c.note || '').trim().slice(0, 140)
    };
  }).filter((c: FamilyContact) => c.name.length > 0);
  room.updatedAt = Date.now();
  res.json(room);
});

app.post('/api/family-sync/:room/message', (req, res) => {
  const room = getOrCreateRoom(req.params.room);
  const text = String(req.body?.text || '').trim();
  if (!text) {
    return res.status(400).json({ error: 'Nội dung tin nhắn trống' });
  }
  const t = req.body?.type;
  const msgType = (t === 'sos' || t === 'med' || t === 'sensor' || t === 'device') ? t : 'checkin';
  const msg: FamilyMessage = {
    id: String(req.body?.id || 'fmsg-' + Date.now()),
    sender: String(req.body?.sender || 'Thành viên gia đình').trim().slice(0, 60),
    text: text.slice(0, 500),
    type: msgType,
    time: String(req.body?.time || new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })),
    timestamp: Date.now()
  };
  room.messages.unshift(msg);
  if (room.messages.length > 40) room.messages.length = 40;
  room.updatedAt = Date.now();
  res.json(room);
});

app.post('/api/family-sync/:room/sensor-obstacle', (req, res) => {
  const room = getOrCreateRoom(req.params.room);
  const trayNumber = Number(req.body?.trayNumber) || 1;
  const slotKey = String(req.body?.slotKey || 'morningBefore').slice(0, 32);
  const slotLabel = String(req.body?.slotLabel || 'Buổi Sáng').slice(0, 80);
  const memberName = String(req.body?.memberName || 'Người cao tuổi').slice(0, 80);
  const pouchPresent = Boolean(req.body?.pouchPresent);
  const time = String(req.body?.time || new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }));
  const message = String(
    req.body?.message ||
    (pouchPresent
      ? `Cảm biến vật cản ghi nhận đã nạp túm thuốc mới vào Khay #${trayNumber} (${slotLabel}).`
      : `CẢM BIẾN VẬT CẢN: Túm thuốc ${slotLabel} (Khay #${trayNumber} - ${memberName}) đã LẤY RA KHỎI KHAY lúc ${time} — Chờ xác nhận người bệnh đã uống.`)
  ).slice(0, 320);

  const ev: ObstacleSensorEvent = {
    id: 'obs-' + Date.now(),
    trayNumber,
    slotKey,
    slotLabel,
    memberName,
    pouchPresent,
    message,
    time,
    timestamp: Date.now()
  };
  room.obstacleEvents.unshift(ev);
  if (room.obstacleEvents.length > 30) room.obstacleEvents.length = 30;
  if (!pouchPresent) {
    room.messages.unshift({
      id: 'fmsg-obs-' + Date.now(),
      sender: 'Cảm biến Vật cản Khay thuốc',
      text: message,
      type: 'sensor',
      time,
      timestamp: Date.now()
    });
    if (room.messages.length > 40) room.messages.length = 40;
    appendRoomActivity(room, {
      category: 'med',
      level: 'info',
      title: `Đã lấy thuốc khỏi Khay #${trayNumber} (${slotLabel})`,
      detail: 'Túm thuốc đã rời khay. Cần xác nhận người bệnh đã uống thuốc thực tế.',
      actor: 'Cảm biến vật cản'
    });
  } else {
    appendRoomActivity(room, {
      category: 'med',
      level: 'info',
      title: `Nạp túm thuốc Khay #${trayNumber} (${slotLabel})`,
      detail: message,
      actor: memberName
    });
  }
  room.updatedAt = Date.now();
  res.json({ ok: true, event: ev, room });
});

app.post('/api/family-sync/:room/sos', (req, res) => {
  const room = getOrCreateRoom(req.params.room);
  const smsRecipients = Array.isArray(req.body?.smsRecipients)
    ? req.body.smsRecipients.slice(0, 10).map((r: any) => ({
        name: String(r.name || '').slice(0, 80),
        relation: String(r.relation || 'Người thân').slice(0, 40),
        phone: String(r.phone || '').slice(0, 24),
        priority: Number(r.priority) || 1
      }))
    : [];
  const smsBody = String(req.body?.smsBody || '').trim().slice(0, 500);
  const alert: ActiveSosAlert = {
    id: String(req.body?.id || 'sos-' + Date.now()),
    patientName: String(req.body?.patientName || 'Người cần hỗ trợ').trim().slice(0, 80),
    condition: String(req.body?.condition || 'Cần hỗ trợ khẩn cấp').trim().slice(0, 180),
    address: String(req.body?.address || '').trim().slice(0, 220),
    gpsUrl: String(req.body?.gpsUrl || '').trim().slice(0, 180),
    smsRecipients,
    smsBody,
    time: String(req.body?.time || new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })),
    timestamp: Date.now()
  };
  room.activeSos = alert;
  const locText = [alert.address ? `Địa chỉ: ${alert.address}` : '', alert.gpsUrl ? `GPS: ${alert.gpsUrl}` : ''].filter(Boolean).join(' | ');
  const smsNote = smsRecipients.length > 0 ? ` • Tự động gửi SMS tới ${smsRecipients.length} SĐT ưu tiên` : '';
  room.messages.unshift({
    id: 'fmsg-sos-' + Date.now(),
    sender: alert.patientName,
    text: `CẢNH BÁO SOS: ${alert.condition}${locText ? ' (' + locText + ')' : ''}${smsNote}`,
    type: 'sos',
    time: alert.time,
    timestamp: Date.now()
  });
  if (room.messages.length > 40) room.messages.length = 40;
  appendRoomActivity(room, {
    category: 'sos',
    level: 'critical',
    title: `Kích hoạt SOS Khẩn Cấp: ${alert.condition}`,
    detail: locText || 'Đã phát tín hiệu SOS đến phòng gia đình.',
    actor: alert.patientName
  });
  room.updatedAt = Date.now();
  res.json(room);
});

app.post('/api/family-sync/:room/sos/resolve', (req, res) => {
  const room = getOrCreateRoom(req.params.room);
  const resolver = String(req.body?.resolver || 'Gia đình').trim().slice(0, 60);
  if (room.activeSos) {
    room.messages.unshift({
      id: 'fmsg-res-' + Date.now(),
      sender: resolver,
      text: `Đã kết nối và xác nhận người bệnh an toàn (${new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}).`,
      type: 'checkin',
      time: new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }),
      timestamp: Date.now()
    });
    appendRoomActivity(room, {
      category: 'sos',
      level: 'info',
      title: 'Xác nhận người bệnh đã an toàn',
      detail: `${resolver} đã đóng cảnh báo SOS.`,
      actor: resolver
    });
  }
  room.activeSos = null;
  room.updatedAt = Date.now();
  res.json(room);
});

app.post('/api/family-sync/:room/daily-log', (req, res) => {
  const room = getOrCreateRoom(req.params.room);
  const raw = req.body?.entry || req.body || {};
  const mood = Math.max(1, Math.min(5, Math.round(Number(raw.mood) || 3)));
  const energy = Math.max(1, Math.min(5, Math.round(Number(raw.energy) || 3)));
  const pain = Math.max(0, Math.min(10, Math.round(Number(raw.pain) || 0)));
  const dateKey = String(raw.dateKey || new Date().toISOString().split('T')[0]).slice(0, 10);
  const entry: HealthDailyLog = {
    id: String(raw.id || 'dlog-' + Date.now()),
    dateKey,
    timeOfDay: String(raw.timeOfDay || 'Hôm nay').slice(0, 24),
    mood,
    energy,
    pain,
    symptoms: Array.isArray(raw.symptoms) ? raw.symptoms.slice(0, 10).map((s: any) => String(s).slice(0, 40)) : [],
    note: String(raw.note || '').trim().slice(0, 400),
    createdAt: Number(raw.createdAt) || Date.now()
  };
  room.dailyLogs = [entry, ...room.dailyLogs.filter(x => x.id !== entry.id)].slice(0, 90);
  room.updatedAt = Date.now();
  res.json({ ok: true, entry, dailyLogs: room.dailyLogs });
});

app.delete('/api/family-sync/:room/daily-log/:id', (req, res) => {
  const room = getOrCreateRoom(req.params.room);
  const targetId = String(req.params.id || '');
  room.dailyLogs = room.dailyLogs.filter(x => x.id !== targetId);
  room.updatedAt = Date.now();
  res.json({ ok: true, dailyLogs: room.dailyLogs });
});

// Setup Vite middleware in dev or serve static files in production
async function startServer() {
  const isProduction = process.env.NODE_ENV === 'production';

  if (!isProduction) {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.join(__dirname, 'dist')));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(__dirname, 'dist', 'index.html'));
    });
  }

  // Bind to port 3000 (primary AI Studio applet port)
  app.listen(3000, '0.0.0.0', () => {
    console.log(`Smart Healthcare server running on http://0.0.0.0:3000`);
  });

  // Also bind to port 8080 if environment expects port 8080
  const envPort = Number(process.env.PORT);
  if (envPort && envPort !== 3000) {
    try {
      app.listen(envPort, '0.0.0.0', () => {
        console.log(`Smart Healthcare server also listening on http://0.0.0.0:${envPort}`);
      });
    } catch {
      console.log(`Port ${envPort} already in use or skipped`);
    }
  }
}

startServer().catch(console.error);
