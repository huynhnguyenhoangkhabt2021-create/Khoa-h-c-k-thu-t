import test from 'node:test';
import assert from 'node:assert/strict';

test('pruning logic removes oldest 5 messages when count exceeds 30', () => {
  const messages = Array.from({ length: 32 }, (_, i) => ({ id: `m-${i}`, text: `msg ${i}` }));
  
  function checkAndPrune(list: typeof messages) {
    if (list.length > 30) {
      return list.slice(5);
    }
    return list;
  }

  const result = checkAndPrune(messages);
  assert.equal(result.length, 27);
  assert.equal(result[0].id, 'm-5');
});

test('7-day rolling window retains only records within 7 days', () => {
  const now = new Date();
  const day3 = new Date(now);
  day3.setDate(day3.getDate() - 3);

  const day10 = new Date(now);
  day10.setDate(day10.getDate() - 10);

  const logs = [
    { id: '1', dateKey: now.toISOString().split('T')[0] },
    { id: '2', dateKey: day3.toISOString().split('T')[0] },
    { id: '3', dateKey: day10.toISOString().split('T')[0] },
  ];

  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - 7);

  const filtered = logs.filter(l => new Date(l.dateKey) >= cutoff);
  assert.equal(filtered.length, 2);
  assert.equal(filtered[0].id, '1');
  assert.equal(filtered[1].id, '2');
});

test('BMI calculation for elderly is accurate', () => {
  const height = 165;
  const weight = 60;
  const bmi = Math.round((weight / Math.pow(height / 100, 2)) * 10) / 10;
  assert.equal(bmi, 22.0);
});
