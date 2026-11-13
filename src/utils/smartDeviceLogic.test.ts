import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  parseEsp32Telemetry,
  evaluateDeviceHealth,
  evaluateAirQuality,
  resolveSlotDoseState,
  getRolePermissions,
  evaluateAiQueryScope,
  normalizeTheme
} from './smartDeviceLogic.ts';

describe('ESP32 Telemetry Parser & Watchdog', () => {
  it('parses valid ESP32 JSON string with vitals, air quality and tray sensors', () => {
    const raw = JSON.stringify({
      deviceId: 'ESP32-ROOM-01',
      bpm: 76,
      spo2: 98,
      bodyTemp: 36.7,
      pm25: 32.4,
      roomTemp: 26.2,
      roomHumid: 58,
      purifierLevel: 2,
      rssi: -54,
      traySensors: { morningBefore: false, morningAfter: true }
    });
    const res = parseEsp32Telemetry(raw, 'serial', 10000);
    assert.equal(res.ok, true);
    assert.equal(res.telemetry?.source, 'serial');
    assert.equal(res.telemetry?.bpm, 76);
    assert.equal(res.telemetry?.aqi, 68);
    assert.equal(res.telemetry?.traySensors?.morningBefore, false);
    assert.equal(res.telemetry?.faultCode, undefined);
  });

  it('rejects malformed JSON strings cleanly', () => {
    const res = parseEsp32Telemetry('{broken json', 'http');
    assert.equal(res.ok, false);
    assert.ok(res.error);
  });

  it('flags out-of-range sensor readings as sensor fault instead of trusting corrupt values', () => {
    const res = parseEsp32Telemetry({ bpm: 72, spo2: 145, pm25: 15 }, 'http', 5000);
    assert.equal(res.ok, true);
    assert.equal(res.telemetry?.spo2, undefined);
    assert.equal(res.telemetry?.faultCode, 'SPO2_RANGE_ERR');
    assert.equal(res.warnings.length, 1);
  });

  it('marks device disconnected when telemetry heartbeat exceeds timeout', () => {
    const now = 60000;
    const health = evaluateDeviceHealth({ source: 'http', lastTelemetryAt: now - 25000 }, now, 15000);
    assert.equal(health.status, 'disconnected');
    assert.equal(health.isLiveHardware, false);
    assert.ok(health.alertMessage?.includes('MẤT KẾT NỐI'));
  });

  it('keeps simulated mode explicitly separated from live hardware', () => {
    const health = evaluateDeviceHealth({ source: 'sim', lastTelemetryAt: Date.now(), simulationEnabled: true });
    assert.equal(health.status, 'simulated');
    assert.equal(health.isLiveHardware, false);
  });
});

describe('Air Quality & 3-Level Purifier Classification', () => {
  it('recommends level 1/2/3 across PM2.5 thresholds', () => {
    assert.equal(evaluateAirQuality(14).recommendedLevel, 1);
    assert.equal(evaluateAirQuality(34).recommendedLevel, 2);
    assert.equal(evaluateAirQuality(68).recommendedLevel, 3);
  });
});

describe('2-Stage Medication Tray State Machine (Taken Out vs Consumed)', () => {
  it('distinguishes removed_unconfirmed from consumed', () => {
    const takenOutOnly = resolveSlotDoseState({
      enabled: true,
      scheduledMinutes: 450,
      currentMinutes: 460,
      pouchPresent: false,
      takenOutAt: '07:31',
      takenOutTimestamp: 1000,
      consumedAt: null,
      nowMs: 1000 + 20 * 60000
    });
    assert.equal(takenOutOnly.status, 'removed_unconfirmed');
    assert.equal(takenOutOnly.needsDrinkWarning, true);
    assert.ok(takenOutOnly.badgeText.includes('ĐÃ LẤY KHỎI KHAY'));

    const consumed = resolveSlotDoseState({
      enabled: true,
      scheduledMinutes: 450,
      currentMinutes: 460,
      pouchPresent: false,
      takenOutAt: '07:31',
      consumedAt: '07:35'
    });
    assert.equal(consumed.status, 'consumed');
    assert.equal(consumed.badgeText, 'ĐÃ UỐNG THUỐC');
  });
});

describe('RBAC Family Permissions & AI Clinical Scope Guardrails', () => {
  it('enforces read-only restrictions on view_only family role', () => {
    const viewer = getRolePermissions('Người Thân Chỉ Xem');
    assert.equal(viewer.level, 'view_only');
    assert.equal(viewer.canEditMedication, false);
    assert.equal(viewer.canControlPurifier, false);
    assert.equal(viewer.canManagePermissions, false);
    assert.equal(viewer.canTriggerSos, true);

    const admin = getRolePermissions('Bác Sĩ Điều Trị / Quản Trị');
    assert.equal(admin.level, 'admin');
    assert.equal(admin.canManagePermissions, true);
    assert.equal(admin.canEditMedication, true);
  });

  it('blocks diagnosis & dosage prescription queries while allowing emergency triage and wellness Q&A', () => {
    assert.equal(evaluateAiQueryScope('Hãy kê đơn tăng liều thuốc huyết áp giúp tôi').kind, 'out_of_scope_prescription');
    assert.equal(evaluateAiQueryScope('Chẩn đoán giúp tôi bị bệnh gì?').kind, 'out_of_scope_diagnosis');
    assert.equal(evaluateAiQueryScope('Bệnh nhân đau ngực dữ dội và méo miệng').kind, 'needs_emergency');
    assert.equal(evaluateAiQueryScope('Huyết áp mục tiêu cho người cao tuổi là bao nhiêu?').kind, 'in_scope');
  });

  it('normalizes theme safely', () => {
    assert.equal(normalizeTheme('dark'), 'dark');
    assert.equal(normalizeTheme('unknown'), 'light');
  });
});
