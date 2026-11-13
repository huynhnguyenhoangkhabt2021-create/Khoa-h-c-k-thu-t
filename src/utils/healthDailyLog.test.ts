import test from 'node:test';
import assert from 'node:assert/strict';
import {
  validateDailyLogInput,
  summarizeDailyLogs,
  buildDailyChartSeries,
  removeStaleTestContact,
  type HealthDailyLogEntry,
} from './healthDailyLog';

test('validateDailyLogInput rejects out-of-range scores and normalizes valid entries', () => {
  const badMood = validateDailyLogInput({ mood: 6, energy: 3, pain: 2 });
  assert.equal(badMood.valid, false);

  const badPain = validateDailyLogInput({ mood: 4, energy: 4, pain: 12 });
  assert.equal(badPain.valid, false);

  const good = validateDailyLogInput({
    dateKey: '2026-11-12',
    mood: 4,
    energy: 3,
    pain: 2,
    symptoms: ['Đau khớp'],
    note: 'Ngủ ngon hơn hôm qua',
  });
  assert.equal(good.valid, true);
  assert.equal(good.entry?.mood, 4);
  assert.equal(good.entry?.pain, 2);
  assert.equal(good.entry?.symptoms[0], 'Đau khớp');
});

test('summarizeDailyLogs computes averages and triggers attention alert for severe pain', () => {
  const empty = summarizeDailyLogs([]);
  assert.equal(empty.count, 0);
  assert.equal(empty.needsAttention, false);

  const logs: HealthDailyLogEntry[] = [
    {
      id: '1',
      dateKey: '2026-11-11',
      mood: 4,
      energy: 4,
      pain: 2,
      symptoms: [],
      note: '',
      createdAt: 1000,
    },
    {
      id: '2',
      dateKey: '2026-11-13',
      mood: 2,
      energy: 2,
      pain: 8,
      symptoms: ['Đau khớp', 'Chóng mặt'],
      note: 'Đau nhiều khớp gối',
      createdAt: 2000,
    },
  ];

  const summary = summarizeDailyLogs(logs);
  assert.equal(summary.count, 2);
  assert.equal(summary.avgMood, 3.0);
  assert.equal(summary.avgEnergy, 3.0);
  assert.equal(summary.avgPain, 5.0);
  assert.equal(summary.needsAttention, true);
  assert.match(summary.attentionReason, /8\/10/);
});

test('buildDailyChartSeries averages multiple same-day logs across 7 days', () => {
  const anchor = new Date('2026-11-13T10:00:00Z');
  const logs: HealthDailyLogEntry[] = [
    {
      id: 'a',
      dateKey: '2026-11-13',
      mood: 3,
      energy: 2,
      pain: 4,
      symptoms: [],
      note: '',
      createdAt: 100,
    },
    {
      id: 'b',
      dateKey: '2026-11-13',
      mood: 5,
      energy: 4,
      pain: 2,
      symptoms: [],
      note: '',
      createdAt: 200,
    },
    {
      id: 'c',
      dateKey: '2026-11-10',
      mood: 4,
      energy: 4,
      pain: 1,
      symptoms: [],
      note: '',
      createdAt: 50,
    },
  ];

  const series = buildDailyChartSeries(logs, 7, anchor);
  assert.equal(series.length, 7);
  const todayPt = series[series.length - 1];
  assert.equal(todayPt.dateKey, '2026-11-13');
  assert.equal(todayPt.mood, 4);
  assert.equal(todayPt.energy, 3);
  assert.equal(todayPt.pain, 3);
  assert.equal(todayPt.entryCount, 2);

  const nov10 = series.find((p) => p.dateKey === '2026-11-10');
  assert.equal(nov10?.mood, 4);
  assert.equal(nov10?.pain, 1);
});

test('removeStaleTestContact removes legacy Con gai Lan 655 contact without affecting valid contacts', () => {
  const input = [
    { id: '1', name: 'Con gai Lan', phone: '0901234655' },
    { id: '2', name: 'Con trai Minh', phone: '0988777666' },
  ];
  const cleaned = removeStaleTestContact(input);
  assert.equal(cleaned.length, 1);
  assert.equal(cleaned[0].name, 'Con trai Minh');
});
