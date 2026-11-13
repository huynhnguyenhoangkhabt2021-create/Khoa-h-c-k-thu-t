export interface HealthDailyLogEntry {
  id: string;
  dateKey: string; // YYYY-MM-DD
  timeOfDay?: string; // 'Sáng' | 'Trưa' | 'Tối' | HH:MM
  mood: number; // 1..5
  energy: number; // 1..5
  pain: number; // 0..10
  symptoms: string[];
  note: string;
  createdAt: number;
}

export interface DailyLogSummary {
  count: number;
  avgMood: number;
  avgEnergy: number;
  avgPain: number;
  latestEntry: HealthDailyLogEntry | null;
  needsAttention: boolean;
  attentionReason: string;
}

export interface ChartDayPoint {
  dateKey: string;
  shortLabel: string;
  mood: number | null;
  energy: number | null;
  pain: number | null;
  entryCount: number;
}

export function clampScore(val: number, min: number, max: number): number {
  if (!Number.isFinite(val)) return min;
  return Math.max(min, Math.min(max, Math.round(val)));
}

export function validateDailyLogInput(input: {
  dateKey?: string;
  mood: number;
  energy: number;
  pain: number;
  symptoms?: string[];
  note?: string;
  timeOfDay?: string;
}): { valid: boolean; error?: string; entry?: HealthDailyLogEntry } {
  const dateKey = (input.dateKey || '').trim() || new Date().toISOString().split('T')[0];
  if (!/^\d{4}-\d{2}-\d{2}$/.test(dateKey)) {
    return { valid: false, error: 'Ngày ghi nhận không hợp lệ (YYYY-MM-DD).' };
  }
  if (!Number.isFinite(input.mood) || input.mood < 1 || input.mood > 5) {
    return { valid: false, error: 'Điểm tâm trạng phải từ 1 đến 5.' };
  }
  if (!Number.isFinite(input.energy) || input.energy < 1 || input.energy > 5) {
    return { valid: false, error: 'Mức năng lượng phải từ 1 đến 5.' };
  }
  if (!Number.isFinite(input.pain) || input.pain < 0 || input.pain > 10) {
    return { valid: false, error: 'Mức độ đau phải từ 0 đến 10.' };
  }

  return {
    valid: true,
    entry: {
      id: `dlog-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      dateKey,
      timeOfDay: (input.timeOfDay || 'Hôm nay').trim(),
      mood: Math.round(input.mood),
      energy: Math.round(input.energy),
      pain: Math.round(input.pain),
      symptoms: Array.isArray(input.symptoms) ? input.symptoms.filter(Boolean).slice(0, 10) : [],
      note: (input.note || '').trim().slice(0, 400),
      createdAt: Date.now(),
    },
  };
}

export function summarizeDailyLogs(logs: HealthDailyLogEntry[]): DailyLogSummary {
  if (!Array.isArray(logs) || logs.length === 0) {
    return {
      count: 0,
      avgMood: 0,
      avgEnergy: 0,
      avgPain: 0,
      latestEntry: null,
      needsAttention: false,
      attentionReason: '',
    };
  }

  const sorted = [...logs].sort((a, b) => {
    if (b.dateKey !== a.dateKey) return b.dateKey.localeCompare(a.dateKey);
    return (b.createdAt || 0) - (a.createdAt || 0);
  });

  const sumMood = sorted.reduce((acc, x) => acc + clampScore(x.mood, 1, 5), 0);
  const sumEnergy = sorted.reduce((acc, x) => acc + clampScore(x.energy, 1, 5), 0);
  const sumPain = sorted.reduce((acc, x) => acc + clampScore(x.pain, 0, 10), 0);

  const latest = sorted[0];
  let needsAttention = false;
  let attentionReason = '';

  if (latest.pain >= 7) {
    needsAttention = true;
    attentionReason = `Mức độ đau gần nhất cao (${latest.pain}/10). Nên liên hệ người thân hoặc bác sĩ kiểm tra.`;
  } else if (latest.mood <= 1 && latest.energy <= 2) {
    needsAttention = true;
    attentionReason = 'Tâm trạng và năng lượng xuống thấp. Gia đình nên gọi hỏi thăm và theo dõi thêm.';
  }

  return {
    count: sorted.length,
    avgMood: Number((sumMood / sorted.length).toFixed(1)),
    avgEnergy: Number((sumEnergy / sorted.length).toFixed(1)),
    avgPain: Number((sumPain / sorted.length).toFixed(1)),
    latestEntry: latest,
    needsAttention,
    attentionReason,
  };
}

export function buildDailyChartSeries(
  logs: HealthDailyLogEntry[],
  daysCount: number = 7,
  anchorDate: Date = new Date()
): ChartDayPoint[] {
  const days = clampScore(daysCount, 3, 30);
  const byDate = new Map<string, HealthDailyLogEntry[]>();

  for (const item of logs || []) {
    if (!item || !item.dateKey) continue;
    const arr = byDate.get(item.dateKey) || [];
    arr.push(item);
    byDate.set(item.dateKey, arr);
  }

  const series: ChartDayPoint[] = [];
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date(anchorDate);
    d.setDate(d.getDate() - i);
    const key = d.toISOString().split('T')[0];
    const shortLabel = `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}`;
    const list = byDate.get(key) || [];

    if (list.length === 0) {
      series.push({
        dateKey: key,
        shortLabel,
        mood: null,
        energy: null,
        pain: null,
        entryCount: 0,
      });
    } else {
      const m = list.reduce((s, e) => s + clampScore(e.mood, 1, 5), 0) / list.length;
      const en = list.reduce((s, e) => s + clampScore(e.energy, 1, 5), 0) / list.length;
      const p = list.reduce((s, e) => s + clampScore(e.pain, 0, 10), 0) / list.length;
      series.push({
        dateKey: key,
        shortLabel,
        mood: Number(m.toFixed(1)),
        energy: Number(en.toFixed(1)),
        pain: Number(p.toFixed(1)),
        entryCount: list.length,
      });
    }
  }

  return series;
}

export function removeStaleTestContact<T extends { name?: string; phone?: string }>(contacts: T[]): T[] {
  if (!Array.isArray(contacts)) return [];
  return contacts.filter((c) => {
    const n = (c.name || '').trim().toLowerCase();
    const p = (c.phone || '').replace(/\D/g, '');
    if ((n === 'con gai lan' || n === 'con gái lan') && p.endsWith('655')) {
      return false;
    }
    return true;
  });
}
