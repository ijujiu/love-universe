import type { MoodEntry, MoodType, Wish, Milestone, CheckIn } from '../types';
import { formatDate } from './date';

const moodScore: Record<MoodType, number> = {
  sunny: 5,
  cloudy: 4,
  overcast: 3,
  rainy: 2,
  stormy: 1,
};

const moodEmoji: Record<MoodType, string> = {
  sunny: '☀️',
  cloudy: '⛅',
  overcast: '☁️',
  rainy: '🌧️',
  stormy: '⛈️',
};

interface WeeklyStats {
  togetherDays: number;
  moodMatchDays: number;
  avgMoodA: number;
  avgMoodB: number;
  completedWishes: number;
  totalCheckIns: number;
  newMilestones: number;
  moodTrend: MoodType[];
}

export function analyzeWeeklyData(
  moodHistory: MoodEntry[],
  wishes: Wish[],
  milestones: Milestone[],
  togetherDays: number,
  daysBack: number = 7
): WeeklyStats {
  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - daysBack);

  const recentMoods = moodHistory
    .filter(m => new Date(m.date) >= cutoff)
    .sort((a, b) => a.date.localeCompare(b.date));

  const recentWishes = wishes.filter(w => {
    if (w.completed && w.completedAt) {
      return new Date(w.completedAt) >= cutoff;
    }
    return w.checkIns.some(c => new Date(c.time) >= cutoff);
  });

  const newMilestones = milestones.filter(m => new Date(m.createdAt) >= cutoff);

  const completedWishes = wishes.filter(w => w.completed && w.completedAt && new Date(w.completedAt) >= cutoff).length;

  let totalCheckIns = 0;
  recentWishes.forEach(w => {
    totalCheckIns += w.checkIns.filter(c => new Date(c.time) >= cutoff).length;
  });

  let moodMatchDays = 0;
  let totalMoodA = 0;
  let totalMoodB = 0;

  recentMoods.forEach(m => {
    if (m.moodA === m.moodB) moodMatchDays++;
    totalMoodA += moodScore[m.moodA];
    totalMoodB += moodScore[m.moodB];
  });

  const moodTrend = recentMoods.slice(-7).map(m => {
    const avgScore = (moodScore[m.moodA] + moodScore[m.moodB]) / 2;
    if (avgScore >= 4.5) return 'sunny';
    if (avgScore >= 3.5) return 'cloudy';
    if (avgScore >= 2.5) return 'overcast';
    if (avgScore >= 1.5) return 'rainy';
    return 'stormy';
  });

  return {
    togetherDays,
    moodMatchDays,
    avgMoodA: recentMoods.length ? totalMoodA / recentMoods.length : 4,
    avgMoodB: recentMoods.length ? totalMoodB / recentMoods.length : 4,
    completedWishes,
    totalCheckIns,
    newMilestones: newMilestones.length,
    moodTrend,
  };
}

export function generateAIInsight(stats: WeeklyStats, partnerAName: string, partnerBName: string): string {
  const sentences: string[] = [];

  const avgMood = (stats.avgMoodA + stats.avgMoodB) / 2;

  if (avgMood >= 4.2) {
    sentences.push(`这一周你们的心情都超级棒呀！${stats.moodMatchDays}天心有灵犀，${partnerAName}和${partnerBName}真是天生一对呢 ✨`);
  } else if (avgMood >= 3.2) {
    sentences.push(`这一周你们有${stats.moodMatchDays}天心情同步，整体情绪平稳，是温暖踏实的一周呢。`);
  } else {
    sentences.push(`这一周似乎有些小乌云，不过没关系，两个人一起扛，雨天也会变晴天的 ☔`);
  }

  if (stats.completedWishes > 0) {
    sentences.push(`恭喜你们一起完成了${stats.completedWishes}个愿望！每一个共同达成的目标，都是我们宇宙里最闪亮的星 🎉`);
  }

  if (stats.totalCheckIns >= 5) {
    sentences.push(`这周一共打卡了${stats.totalCheckIns}次，坚持的样子超有魅力！继续加油，我们的小目标会一个个实现的。`);
  } else if (stats.totalCheckIns > 0) {
    sentences.push(`这周有${stats.totalCheckIns}次打卡记录，节奏可以慢但不要停哦，一起慢慢往前走。`);
  }

  if (stats.newMilestones > 0) {
    sentences.push(`还创造了${stats.newMilestones}个新的里程碑！这些瞬间都会被我们的宇宙好好收藏 💫`);
  }

  const badDays = 7 - stats.moodMatchDays;
  if (badDays >= 3) {
    sentences.push(`小提示：这周有几天心情不太同步呢，记得多抱抱对方，说说今天发生的小事，好好沟通会让我们更懂彼此呀。`);
  }

  if (stats.avgMoodA < 2.5 || stats.avgMoodB < 2.5) {
    const lowPartner = stats.avgMoodA < stats.avgMoodB ? partnerAName : partnerBName;
    sentences.push(`感觉${lowPartner}这周有点累呢，要多给Ta一些关心和抱抱呀，一起泡杯热奶茶，看部喜欢的电影，好好休息一下。`);
  }

  const endings = [
    '能遇到你，是我这辈子最幸运的事。我爱你 💕',
    '我们的小宇宙，因为有彼此而越来越璀璨，继续一起走下去吧 🌌',
    '一周又一周，和你一起的每一天都值得珍藏，下周也要继续幸福哦 💗',
    '慢慢来，比较快。和你在一起，就是最好的时光 ✨',
    '明天也要记得说早安和晚安，这是我们的小约定呀 🌙'
  ];

  sentences.push(endings[Math.floor(Math.random() * endings.length)]);

  return sentences.join(' ');
}

export function generateHighlights(
  moodHistory: MoodEntry[],
  wishes: Wish[],
  milestones: Milestone[]
): string[] {
  const highlights: string[] = [];
  const weekAgo = new Date();
  weekAgo.setDate(weekAgo.getDate() - 7);

  const newMilestones = milestones.filter(m => new Date(m.createdAt) >= weekAgo);
  newMilestones.forEach(m => {
    highlights.push(`创造了新的里程碑：${m.emoji} ${m.title}`);
  });

  const completedWishes = wishes.filter(w => w.completed && w.completedAt && new Date(w.completedAt) >= weekAgo);
  completedWishes.forEach(w => {
    highlights.push(`达成愿望：${w.icon} ${w.title} ${w.badge}`);
  });

  const sunnyDays = moodHistory.filter(m => new Date(m.date) >= weekAgo && m.moodA === 'sunny' && m.moodB === 'sunny');
  if (sunnyDays.length >= 3) {
    highlights.push(`${sunnyDays.length}天双方都是大晴天，心晴的时候连风都是甜的 ☀️`);
  }

  if (highlights.length === 0) {
    highlights.push('平平淡淡也是真，陪伴就是最长情的告白 💑');
  }

  return highlights;
}

export function getMoodEmoji(mood: MoodType): string {
  return moodEmoji[mood];
}

export function getMoodTrendEmojis(trend: MoodType[]): string {
  return trend.map(m => moodEmoji[m]).join(' → ');
}
