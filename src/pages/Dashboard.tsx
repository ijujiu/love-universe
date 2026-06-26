import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { Clock, Lock, Target, CloudRain, Bluetooth, Sparkles } from 'lucide-react';
import { differenceInDays } from 'date-fns';
import { useAppStore } from '../store/useAppStore';
import { getDaysTogether, getNextAnniversary, getTodayString } from '../utils/date';
import { moodConfig } from '../types';

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.12,
      delayChildren: 0.1,
    },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { type: 'spring', stiffness: 260, damping: 24 },
  },
};

function getGreeting(): string {
  const hour = new Date().getHours();
  if (hour >= 5 && hour < 11) return '早安';
  if (hour >= 11 && hour < 18) return '午安';
  return '晚安';
}

const quickEntries = [
  { icon: Clock, label: '纪念宇宙', desc: '时光印记', route: '/timeline', color: 'from-rose-gold/30 to-rose-pink/20' },
  { icon: Lock, label: '秘密胶囊', desc: '时光信件', route: '/capsules', color: 'from-star-purple/30 to-rose-pink/20' },
  { icon: Target, label: '许愿池', desc: '共同目标', route: '/wishes', color: 'from-star-mint/30 to-rose-gold/20' },
  { icon: CloudRain, label: '情绪站', desc: '心情天气', route: '/mood', color: 'from-blue-400/30 to-star-purple/20' },
  { icon: Bluetooth, label: '近距离', desc: '靠近感应', route: '/proximity', color: 'from-cyan-400/30 to-star-mint/20' },
  { icon: Sparkles, label: '每周星报', desc: '本周亮点', route: '/weekly', color: 'from-yellow-300/30 to-rose-gold/20' },
];

export default function Dashboard() {
  const navigate = useNavigate();
  const { couple, moodHistory, weeklyReports, wishes } = useAppStore();
  const [daysTogether, setDaysTogether] = useState(0);

  useEffect(() => {
    if (!couple) return;
    const update = () => setDaysTogether(getDaysTogether(couple.startDate));
    update();
    const timer = setInterval(update, 1000);
    return () => clearInterval(timer);
  }, [couple]);

  if (!couple) {
    return (
      <div className="flex items-center justify-center h-full text-star-white/50">
        还未配对，快去邀请TA吧～
      </div>
    );
  }

  const today = getTodayString();
  const todayMood = moodHistory.find(m => m.date === today);
  const moodA = todayMood?.moodA ?? 'sunny';
  const moodB = todayMood?.moodB ?? 'sunny';
  const bothStormy = moodA === 'stormy' && moodB === 'stormy';

  const upcomingAnniversaries = getNextAnniversary(couple.anniversaries, couple.startDate)
    .slice(0, 3)
    .map(a => ({
      ...a,
      daysLeft: differenceInDays(a.nextDate, new Date(new Date().setHours(0, 0, 0, 0))),
    }));

  const latestWeekly = weeklyReports[0];
  const completedWishesThisWeek = latestWeekly?.stats.completedWishes ?? wishes.filter(w => w.completed).length;
  const moodMatchDays = latestWeekly?.stats.moodMatchDays ?? 0;

  const greeting = getGreeting();

  return (
    <motion.div
      className="h-full overflow-y-auto overflow-x-hidden scrollbar-hide pb-24"
      variants={containerVariants}
      initial="hidden"
      animate="visible"
    >
      <div className="px-5 pt-6 space-y-5">
        {/* 1. 顶部问候语 */}
        <motion.div variants={itemVariants} className="pt-2">
          <p className="text-star-white/50 text-sm mb-1">{greeting}，我的宇宙</p>
          <h1 className="text-2xl font-display">
            <span className="text-gradient-rose">{couple.partnerA.name}</span>
            <span className="text-star-white/40 mx-2">&</span>
            <span className="text-gradient-rose">{couple.partnerB.name}</span>
          </h1>
        </motion.div>

        {/* 2. 核心天数显示 */}
        <motion.div variants={itemVariants} className="relative flex items-center justify-center py-6">
          {/* 星轨装饰 - 外环 */}
          <div className="absolute w-64 h-64 rounded-full border border-rose-gold/10 animate-spin-slow" style={{ animationDuration: '30s' }}>
            {[0, 60, 120, 180, 240, 300].map((deg) => (
              <div
                key={deg}
                className="absolute w-1.5 h-1.5 rounded-full bg-rose-gold/60 animate-twinkle"
                style={{
                  top: '50%',
                  left: '50%',
                  transform: `rotate(${deg}deg) translateY(-128px) translateX(-50%)`,
                  animationDelay: `${deg / 60}s`,
                }}
              />
            ))}
          </div>
          {/* 星轨装饰 - 内环 */}
          <div className="absolute w-52 h-52 rounded-full border border-rose-pink/10" style={{ animation: 'spin 20s linear infinite reverse' }}>
            {[30, 150, 270].map((deg) => (
              <div
                key={deg}
                className="absolute w-1 h-1 rounded-full bg-rose-pink/70 animate-twinkle"
                style={{
                  top: '50%',
                  left: '50%',
                  transform: `rotate(${deg}deg) translateY(-104px) translateX(-50%)`,
                  animationDelay: `${deg / 60}s`,
                }}
              />
            ))}
          </div>
          {/* 最内光点环 */}
          <div className="absolute w-72 h-72 rounded-full border border-star-mint/5" style={{ animation: 'spin 40s linear infinite' }}>
            {[0, 90, 180, 270].map((deg) => (
              <div
                key={deg}
                className="absolute w-0.5 h-0.5 rounded-full bg-star-mint/50"
                style={{
                  top: '50%',
                  left: '50%',
                  transform: `rotate(${deg}deg) translateY(-144px) translateX(-50%)`,
                }}
              />
            ))}
          </div>

          <div className="relative z-10 text-center">
            <motion.div
              className="font-number text-7xl font-bold text-gradient-rose animate-breathe"
              style={{
                textShadow: '0 0 40px rgba(232,180,184,0.4), 0 0 80px rgba(255,107,157,0.2)',
              }}
              animate={{
                textShadow: [
                  '0 0 30px rgba(232,180,184,0.3), 0 0 60px rgba(255,107,157,0.15)',
                  '0 0 50px rgba(232,180,184,0.5), 0 0 100px rgba(255,107,157,0.3)',
                  '0 0 30px rgba(232,180,184,0.3), 0 0 60px rgba(255,107,157,0.15)',
                ],
              }}
              transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
            >
              {daysTogether}
            </motion.div>
            <p className="text-star-white/60 text-sm mt-2 tracking-widest">在 一 起 的 天</p>
          </div>
        </motion.div>

        {/* 3. 纪念日倒计时卡片 */}
        <motion.div variants={itemVariants}>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-medium text-star-white/70 flex items-center gap-1.5">
              <span>📅</span> 即将到来
            </h2>
          </div>
          <div className="flex gap-3 overflow-x-auto scrollbar-hide -mx-5 px-5 pb-1">
            {upcomingAnniversaries.map((ann) => (
              <motion.button
                key={ann.id}
                whileHover={{ scale: 1.04, y: -2 }}
                whileTap={{ scale: 0.97 }}
                onClick={() => navigate('/timeline')}
                className="glass-card flex-shrink-0 w-36 p-4 text-center"
              >
                <div className="text-3xl mb-2">{ann.emoji}</div>
                <p className="text-xs text-star-white/70 truncate mb-1">{ann.title}</p>
                <p className="font-number text-2xl font-bold text-gradient-rose">
                  {ann.daysLeft === 0 ? '今天' : `${ann.daysLeft}天`}
                </p>
              </motion.button>
            ))}
          </div>
        </motion.div>

        {/* 4. 今日心情卡片 */}
        <motion.div variants={itemVariants}>
          <motion.button
            whileHover={{ scale: 1.01 }}
            whileTap={{ scale: 0.99 }}
            onClick={() => navigate('/mood')}
            className="glass-card w-full p-4 text-left"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-star-white/50 mb-1">今日心情天气</p>
                <div className="flex items-center gap-3">
                  <div className="text-center">
                    <span className="text-3xl">{moodConfig[moodA].emoji}</span>
                    <p className="text-[10px] text-star-white/40 mt-0.5">{couple.partnerA.name}</p>
                  </div>
                  <span className="text-star-white/20 text-lg">♥</span>
                  <div className="text-center">
                    <span className="text-3xl">{moodConfig[moodB].emoji}</span>
                    <p className="text-[10px] text-star-white/40 mt-0.5">{couple.partnerB.name}</p>
                  </div>
                </div>
              </div>
              {bothStormy ? (
                <div className="text-right">
                  <p className="text-rose-pink text-sm font-medium">🤗 抱抱彼此</p>
                  <p className="text-[10px] text-star-white/40 mt-1">需要一个温暖的拥抱</p>
                </div>
              ) : (
                <div className="text-right">
                  <p className="text-star-white/60 text-sm">去记录 →</p>
                  <p className="text-[10px] text-star-white/30 mt-1">点击进入情绪站</p>
                </div>
              )}
            </div>
          </motion.button>
        </motion.div>

        {/* 5. 六大功能快捷入口 */}
        <motion.div variants={itemVariants}>
          <h2 className="text-sm font-medium text-star-white/70 mb-3 flex items-center gap-1.5">
            <span>✨</span> 探索宇宙
          </h2>
          <div className="grid grid-cols-3 gap-3">
            {quickEntries.map((entry) => {
              const Icon = entry.icon;
              return (
                <motion.button
                  key={entry.route}
                  whileHover={{ scale: 1.05, y: -3 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => navigate(entry.route)}
                  className="glass-card p-3 flex flex-col items-center text-center relative overflow-hidden group"
                >
                  <div className={`absolute inset-0 bg-gradient-to-br ${entry.color} opacity-0 group-hover:opacity-100 transition-opacity duration-300`} />
                  <div className="relative z-10">
                    <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center mb-2 group-hover:glow-rose transition-all">
                      <Icon size={20} className="text-star-white/80 group-hover:text-rose-gold transition-colors" />
                    </div>
                    <p className="text-xs font-medium text-star-white/90">{entry.label}</p>
                    <p className="text-[10px] text-star-white/40 mt-0.5">{entry.desc}</p>
                  </div>
                </motion.button>
              );
            })}
          </div>
        </motion.div>

        {/* 6. 本周数据小卡片 */}
        <motion.div variants={itemVariants} className="pb-4">
          <h2 className="text-sm font-medium text-star-white/70 mb-3 flex items-center gap-1.5">
            <span>📊</span> 本周数据
          </h2>
          <div className="grid grid-cols-2 gap-3">
            <div className="glass-card p-4">
              <div className="flex items-center gap-2 mb-2">
                <span className="text-lg">🎯</span>
                <span className="text-xs text-star-white/50">完成目标</span>
              </div>
              <p className="font-number text-3xl font-bold text-gradient-mint">{completedWishesThisWeek}</p>
              <p className="text-[10px] text-star-white/40 mt-1">个共同心愿达成</p>
            </div>
            <div className="glass-card p-4">
              <div className="flex items-center gap-2 mb-2">
                <span className="text-lg">💞</span>
                <span className="text-xs text-star-white/50">同频天数</span>
              </div>
              <p className="font-number text-3xl font-bold text-gradient-rose">{moodMatchDays}</p>
              <p className="text-[10px] text-star-white/40 mt-1">天心有灵犀</p>
            </div>
          </div>
        </motion.div>
      </div>
    </motion.div>
  );
}
