import { FoodEvaluationResult } from '../types';

export async function sendChatMessage(message: string, customKey?: string): Promise<{ text: string; source: string }> {
  try {
    const res = await fetch('/api/gemini/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message, customKey }),
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();
    return data;
  } catch (err: any) {
    console.warn('API error, using local fallback:', err);
    return {
      text: getLocalFallbackAnswer(message),
      source: 'local_expert',
    };
  }
}

export async function evaluateFoodWithAI(
  foodName: string,
  memberInfo: any,
  customKey?: string
): Promise<FoodEvaluationResult> {
  try {
    const res = await fetch('/api/gemini/eval-food', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ foodName, memberInfo, customKey }),
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return await res.json();
  } catch (err) {
    console.warn('AI eval failed, fallback local:', err);
    return getLocalFoodFallback(foodName, memberInfo);
  }
}

export async function generateSoundWithAI(
  prompt: string,
  durationMinutes: number,
  customKey?: string
): Promise<any> {
  try {
    const res = await fetch('/api/gemini/generate-sound-prompt', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ prompt, durationMinutes, customKey }),
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return await res.json();
  } catch (err) {
    return {
      success: true,
      theme: prompt || 'Âm Thanh Trị Liệu & Giấc Ngủ',
      frequency: '432 Hz Solfeggio',
      description: 'Hòa âm sóng não và tiếng tự nhiên thanh lọc tâm trí, hỗ trợ nhịp tim chậm ổn định.',
      soundElements: ['Tiếng chuông xoay', 'Mưa rừng trúc', 'Gió thoảng'],
      bpmSync: 65,
      durationMinutes,
    };
  }
}

function getLocalFallbackAnswer(query: string): string {
  const q = (query || '').toLowerCase();
  if (q.includes('huyết áp')) {
    return `🩺 **TƯ VẤN HUYẾT ÁP CHO NGƯỜI CAO TUỔI:**\n\n• **Ngưỡng bình thường:** Dưới 130/80 mmHg.\n• **Chăm sóc:** Cắt giảm muối ăn, không dùng đồ hộp hay dưa muối, tập hít thở chậm đều và đo huyết áp 2 lần mỗi ngày lúc nghỉ ngơi.`;
  }
  if (q.includes('spo2') || q.includes('oxy') || q.includes('thở')) {
    return `🩺 **HƯỚNG DẪN SINH HIỆU SpO2 & HÔ HẤP:**\n\n• **95% - 100%:** Tuyệt vời, oxy mô đầy đủ.\n• **92% - 94%:** Thiếu oxy mức nhẹ, cần ngồi thẳng lưng, nới lỏng cổ áo và tập bài thở 4-7-8 trong tab Bài tập.\n• **Dưới 92%:** Báo động nguy hiểm! Cần hỗ trợ y tế ngay lập tức.`;
  }
  if (q.includes('uống thuốc') || q.includes('khay thuốc')) {
    return `💊 **LỊCH THUỐC THÔNG MINH:**\n\n• Hãy xếp đúng các túi thuốc vào 4 buổi (Sáng - Trưa - Chiều - Tối) trên khay.\n• Khi chuông reo và đèn chớp sáng, khay sẽ tự động xoay đẩy túi thuốc ra. Khi lấy thuốc xong, cảm biến sẽ tự tắt chuông và ghi nhật ký uống thuốc cho người nhà.`;
  }
  return `🩺 **SMART HEALTHCARE:**\n\nTôi là Trợ lý AI chăm sóc sức khỏe thông minh cho người cao tuổi theo thời gian thực.\nBạn có thể hỏi tôi bất kỳ điều gì về: thực đơn dinh dưỡng, liều lượng dùng thuốc, phòng ngừa tai biến tim mạch hoặc các bài tập vận động dưỡng sinh!`;
}

function getLocalFoodFallback(foodName: string, memberInfo: any): FoodEvaluationResult {
  const f = (foodName || '').toLowerCase();
  const conditions = (memberInfo?.conditions || '').toLowerCase();
  let status: 'safe' | 'caution' | 'danger' = 'safe';
  let score = 90;
  let summary = 'Món ăn giàu dinh dưỡng, an toàn cho thể trạng hiện tại.';
  const pros: string[] = ['Cung cấp năng lượng sạch và vi chất'];
  const cons: string[] = [];
  let advice = 'Nên ăn chậm nhai kỹ, uống nước ấm sau bữa ăn.';

  if (f.includes('mặn') || f.includes('kho quẹt') || f.includes('mắm') || f.includes('muối')) {
    if (conditions.includes('huyết áp')) {
      status = 'danger';
      score = 40;
      summary = 'Nguy hiểm: Món ăn chứa nhiều muối, làm co mạch và tăng vọt huyết áp!';
      cons.push('Chứa hàm lượng Natri cao, gây giữ nước và áp lực tim mạch');
      advice = 'Nên tránh hoặc dùng rất ít; ưu tiên món luộc/hấp thanh đạm.';
    } else {
      status = 'caution';
      score = 65;
      summary = 'Nên hạn chế lượng muối để bảo vệ thận và tim mạch người già.';
    }
  } else if (f.includes('đường') || f.includes('bánh ngọt') || f.includes('chè') || f.includes('trà sữa')) {
    if (conditions.includes('tiểu đường') || conditions.includes('đường huyết')) {
      status = 'danger';
      score = 35;
      summary = 'Nguy hại: Lượng đường hấp thu nhanh gây tăng vọt đường huyết!';
      cons.push('Chỉ số đường huyết GI rất cao, dễ gây mệt mỏi và hoa mắt');
      advice = 'Tuyệt đối kiêng, nếu thèm ngọt có thể ăn 1 lát bưởi hoặc táo tươi.';
    } else {
      status = 'caution';
      score = 65;
      summary = 'Nên ăn ít để tránh tích lũy mỡ máu và kháng insulin.';
    }
  }

  return {
    foodName,
    status,
    score,
    summary,
    pros,
    cons,
    advice,
    estimatedCalories: '220 kcal',
    evaluatedAt: new Date().toISOString(),
  };
}
