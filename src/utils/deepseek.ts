import type { MoodEntry, Wish, Milestone } from '../types';

const API_KEY = 'sk-92baf64806d4417584f1e5fdc155c1ab';
const API_URL = 'https://api.deepseek.com/v1/chat/completions';

export interface AIAnalysisResult {
  insight: string;
  highlights: string[];
  moodSummary: string;
  suggestions: string[];
}

export async function generateWeeklyInsight(
  partnerA: string,
  partnerB: string,
  togetherDays: number,
  moodHistory: MoodEntry[],
  wishes: Wish[],
  milestones: Milestone[]
): Promise<AIAnalysisResult> {
  const weekAgo = new Date();
  weekAgo.setDate(weekAgo.getDate() - 7);

  const recentMoods = moodHistory.filter(m => new Date(m.date) >= weekAgo);
  const newMilestones = milestones.filter(m => new Date(m.createdAt) >= weekAgo);
  const completedWishes = wishes.filter(w => w.completed && w.completedAt && new Date(w.completedAt) >= weekAgo);
  const recentCheckIns = wishes.reduce((acc, w) => {
    return acc + w.checkIns.filter(c => new Date(c.time) >= weekAgo).length;
  }, 0);

  const moodStats = recentMoods.reduce((acc, m) => {
    acc[m.moodA] = (acc[m.moodA] || 0) + 1;
    acc[m.moodB] = (acc[m.moodB] || 0) + 1;
    if (m.moodA === m.moodB) acc.match = (acc.match || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const moodLabels: Record<string, string> = {
    sunny: '晴天☀️',
    cloudy: '多云⛅',
    overcast: '阴天☁️',
    rainy: '小雨🌧️',
    stormy: '雷雨⛈️'
  };

  const prompt = `你是一个温柔浪漫的情感AI助手，正在为一对情侣生成周度情感报告。请用温暖、治愈、甜蜜的语气回复。

情侣信息：
- ${partnerA} 和 ${partnerB}
- 在一起${togetherDays}天了
- 本周心情同步天数：${moodStats.match || 0}天
- 本周打卡次数：${recentCheckIns}次
- 本周新里程碑：${newMilestones.length}个（${newMilestones.map(m => m.title).join('、') || '无'}）
- 本周完成愿望：${completedWishes.length}个（${completedWishes.map(w => w.title).join('、') || '无'}）
- 最近心情记录：${recentMoods.slice(-7).map(m => `${m.date} ${partnerA}:${moodLabels[m.moodA]} ${partnerB}:${moodLabels[m.moodB]}`).join('；')}

请以JSON格式返回分析结果，包含以下字段：
1. insight：一段200字以内的温暖周度总结，语气像朋友一样亲切，多用emoji，最后加上一句浪漫的话
2. highlights：3条以内本周高光时刻（根据数据自动提炼，用甜蜜的语言描述）
3. moodSummary：一句话概括本周心情状态
4. suggestions：2条增进感情的小建议（具体可行，浪漫有趣）

只返回JSON，不要其他文字。`;

  try {
    const response = await fetch(API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${API_KEY}`,
      },
      body: JSON.stringify({
        model: 'deepseek-chat',
        messages: [
          {
            role: 'system',
            content: '你是一个温柔浪漫的情感顾问，擅长为情侣提供温暖的情感分析和建议。回复要简短甜蜜，适当使用emoji。始终返回合法JSON格式。'
          },
          { role: 'user', content: prompt }
        ],
        temperature: 0.8,
        max_tokens: 1000,
      }),
    });

    if (!response.ok) {
      throw new Error('AI API request failed');
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content || '';
    
    const jsonMatch = content.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      const result = JSON.parse(jsonMatch[0]);
      return {
        insight: result.insight || '本周你们一起度过了美好的时光，继续保持这份温暖吧💕',
        highlights: result.highlights || ['一起度过了平凡又幸福的一周'],
        moodSummary: result.moodSummary || '整体心情不错',
        suggestions: result.suggestions || ['多抱抱对方', '记得说晚安'],
      };
    }

    throw new Error('Invalid AI response format');
  } catch (err) {
    console.error('DeepSeek AI error:', err);
    return {
      insight: `亲爱的${partnerA}和${partnerB}，这一周你们又一起走过了${togetherDays}天旅程中的一段。${moodStats.match >= 4 ? '你们有很多天心有灵犀，真是让人羡慕的一对呀！' : '偶尔的不同步也是爱情的调味料呢。'}${completedWishes.length > 0 ? `恭喜完成了${completedWishes.length}个小目标！` : '慢慢来，我们的愿望会一个个实现。'}陪伴是最长情的告白，下周也要继续幸福哦💕`,
      highlights: newMilestones.length > 0 
        ? [`创造了新的回忆：${newMilestones.map(m => m.title).join('、')}`]
        : ['平平淡淡也是真，陪伴就是最好的礼物'],
      moodSummary: moodStats.match >= 4 ? '心有灵犀的一周✨' : '彼此陪伴的一周💑',
      suggestions: ['今晚一起窝在沙发上看部电影吧🎬', '给对方一个突如其来的拥抱🤗'],
    };
  }
}

export async function generateComfortMessage(
  partnerA: string,
  partnerB: string,
  reason: string
): Promise<string> {
  try {
    const response = await fetch(API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${API_KEY}`,
      },
      body: JSON.stringify({
        model: 'deepseek-chat',
        messages: [
          {
            role: 'system',
            content: '你是一个超温柔的情感小助手，当情侣双方都心情不好的时候，写一句简短温暖的治愈话语，50字以内，用emoji，语气可爱治愈。'
          },
          {
            role: 'user',
            content: `${partnerA}和${partnerB}今天心情都不太好（${reason}），写一句治愈他们的话吧。`
          }
        ],
        temperature: 0.9,
        max_tokens: 200,
      }),
    });

    if (!response.ok) throw new Error('API failed');
    const data = await response.json();
    return data.choices?.[0]?.message?.content || '没关系，抱抱就好了呀 💗 你们还有彼此呢～';
  } catch {
    return '没关系，抱抱就好了呀 💗 雨天总会过去，你们还有彼此呢～';
  }
}

export function isAIEnabled(): boolean {
  return !!API_KEY && API_KEY.startsWith('sk-');
}
