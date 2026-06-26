import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Heart, Calendar as CalendarIcon, Film, Users, User } from 'lucide-react';
import { format, subDays, addDays, isSameDay } from 'date-fns';
import { zhCN } from 'date-fns/locale';
import { useAppStore } from '../store/useAppStore';
import { moodConfig, MoodType } from '../types';
import { getTodayString } from '../utils/date';

const moodTypes: MoodType[] = ['sunny', 'cloudy', 'overcast', 'rainy', 'stormy'];

const healingMovies = [
  { emoji: '🎬', title: '龙猫', desc: '治愈系经典' },
  { emoji: '🍜', title: '小森林', desc: '温暖美食' },
  { emoji: '✨', title: '心灵奇旅', desc: '点亮生活' },
];

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.08, delayChildren: 0.1 },
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

const heartBurstVariants = {
  hidden: { scale: 0, opacity: 0 },
  visible: (i: number) => ({
    scale: [0, 1.2, 1],
    opacity: [0, 1, 1],
    x: Math.cos((i * Math.PI * 2) / 8) * 80,
    y: Math.sin((i * Math.PI * 2) / 8) * 80,
    transition: { duration: 0.6, ease: 'easeOut' },
  }),
  exit: { opacity: 0, scale: 0, transition: { duration: 0.3 } },
};

const hugModalVariants = {
  hidden: { opacity: 0, scale: 0.8 },
  visible: {
    opacity: 1,
    scale: 1,
    transition: { type: 'spring', stiffness: 300, damping: 25 },
  },
  exit: { opacity: 0, scale: 0.8 },
};

export default function Mood() {
  const { couple, moodHistory, currentPartner, setCurrentPartner, setTodayMood, hugModalOpen, setHugModalOpen, triggerFireworks } = useAppStore();
  const [note, setNote] = useState('');
  const [showHearts, setShowHearts] = useState(false);
  const [selectedMood, setSelectedMood] = useState<MoodType | null>(null);

  const today = getTodayString();
  const todayEntry = moodHistory.find(m => m.date === today);

  const todayMoodA = todayEntry?.moodA ?? null;
  const todayMoodB = todayEntry?.moodB ?? null;

  const bothStormy = todayMoodA === 'stormy' && todayMoodB === 'stormy';

  const calendarDays = useMemo(() => {
    const days = [];
    for (let i = 29; i >= 0; i--) {
      const date = subDays(new Date(), i);
      const dateStr = format(date, 'yyyy-MM-dd');
      const entry = moodHistory.find(m => m.date === dateStr);
      days.push({ date, dateStr, entry });
    }
    return days;
  }, [moodHistory]);

  const handleSelectMood = (mood: MoodType) => {
    setSelectedMood(mood);
    setTodayMood(currentPartner, mood, note || undefined);
  };

  const handleGiveHug = () => {
    setShowHearts(true);
    triggerFireworks();
    setTimeout(() => {
      setShowHearts(false);
      setHugModalOpen(false);
    }, 2000);
  };

  const getMoodStyle = (mood: MoodType, isSelected: boolean) => {
    const config = moodConfig[mood];
    return {
      borderColor: isSelected ? config.color : 'rgba(255,255,255,0.1)',
      backgroundColor: isSelected ? `${config.color}20` : 'rgba(255,255,255,0.03)',
      boxShadow: isSelected ? `0 0 30px ${config.color}40, 0 0 60px ${config.color}20` : 'none',
    };
  };

  if (!couple) {
    return (
      <div className="flex items-center justify-center h-full text-star-white/50">
        还未配对，快去邀请TA吧～
      </div>
    );
  }

  const currentPartnerData = currentPartner === 'A' ? couple.partnerA : couple.partnerB;

  return (
    <motion.div
      className="h-full overflow-y-auto overflow-x-hidden scrollbar-hide pb-24"
      variants={containerVariants}
      initial="hidden"
      animate="visible"
    >
      <div className="px-5 pt-6 space-y-5">
        <motion.div variants={itemVariants}>
          <h1 className="text-2xl font-display text-gradient-rose">情绪气象站</h1>
          <p className="text-sm text-star-white/50 mt-1">今天的心情，想要告诉TA</p>
        </motion.div>

        <motion.div variants={itemVariants} className="glass-card p-3 flex gap-2">
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => setCurrentPartner('A')}
            className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl transition-all ${
              currentPartner === 'A'
                ? 'bg-gradient-to-r from-rose-gold/30 to-rose-light/20 text-star-white'
                : 'text-star-white/50 hover:text-star-white/70'
            }`}
          >
            <User size={16} />
            <span className="text-sm">{couple.partnerA.name}</span>
            <span className="text-lg">{couple.partnerA.avatar}</span>
          </motion.button>
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => setCurrentPartner('B')}
            className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl transition-all ${
              currentPartner === 'B'
                ? 'bg-gradient-to-r from-rose-pink/30 to-rose-soft/20 text-star-white'
                : 'text-star-white/50 hover:text-star-white/70'
            }`}
          >
            <Users size={16} />
            <span className="text-sm">{couple.partnerB.name}</span>
            <span className="text-lg">{couple.partnerB.avatar}</span>
          </motion.button>
        </motion.div>

        <motion.div variants={itemVariants}>
          <p className="text-xs text-star-white/50 mb-3 px-1">
            正在记录 <span className="text-gradient-rose font-medium">{currentPartnerData.name}</span> 的心情
          </p>
          <div className="flex justify-center gap-3">
            {moodTypes.map((mood) => {
              const config = moodConfig[mood];
              const isSelected = selectedMood === mood || 
                (currentPartner === 'A' ? todayMoodA === mood : todayMoodB === mood);
              return (
                <motion.button
                  key={mood}
                  whileHover={{ scale: 1.15, y: -4 }}
                  whileTap={{ scale: 0.9 }}
                  animate={isSelected ? {
                    scale: [1, 1.1, 1.08],
                    y: [0, -6, -4],
                    transition: { duration: 0.4, ease: 'easeOut' },
                  } : {}}
                  onClick={() => handleSelectMood(mood)}
                  className="w-14 h-14 sm:w-16 sm:h-16 rounded-full flex flex-col items-center justify-center border-2 transition-all duration-300"
                  style={getMoodStyle(mood, isSelected)}
                >
                  <span className="text-2xl sm:text-3xl">{config.emoji}</span>
                </motion.button>
              );
            })}
          </div>
          <div className="flex justify-center gap-3 mt-2">
            {moodTypes.map((mood) => (
              <div key={mood} className="w-14 sm:w-16 text-center">
                <span className="text-[10px] text-star-white/40">{moodConfig[mood].label}</span>
              </div>
            ))}
          </div>
        </motion.div>

        <motion.div variants={itemVariants}>
          <label className="text-xs text-star-white/50 mb-2 block px-1">想说点什么？（可选）</label>
          <textarea
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="今天发生了什么让你有这样的心情..."
            rows={2}
            className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-star-white placeholder:text-star-white/30 focus:outline-none focus:border-rose-gold/50 focus:ring-1 focus:ring-rose-gold/30 transition-all resize-none text-sm"
          />
        </motion.div>

        {bothStormy && (
          <motion.div
            variants={itemVariants}
            className="glass-card p-5 text-center relative overflow-hidden"
            style={{
              background: 'linear-gradient(135deg, rgba(108,92,231,0.15) 0%, rgba(116,185,255,0.1) 100%)',
              borderColor: 'rgba(108,92,231,0.3)',
            }}
          >
            <motion.div
              animate={{
                scale: [1, 1.05, 1],
              }}
              transition={{ duration: 2, repeat: Infinity }}
            >
              <div className="text-5xl mb-3">🤗</div>
              <h3 className="text-lg font-display text-star-white mb-1">两个人都在雷雨天呢</h3>
              <p className="text-sm text-star-white/60 mb-4">没关系，抱抱就会好起来的</p>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setHugModalOpen(true)}
                className="px-6 py-2.5 rounded-full bg-gradient-to-r from-star-purple to-rose-pink text-white text-sm font-medium shadow-lg shadow-star-purple/30"
              >
                给TA一个抱抱 💝
              </motion.button>
            </motion.div>
          </motion.div>
        )}

        {bothStormy && (
          <motion.div variants={itemVariants} className="space-y-3">
            <h2 className="text-sm font-medium text-star-white/70 flex items-center gap-1.5">
              <Film size={16} />
              一起看部治愈电影吧
            </h2>
            <div className="grid grid-cols-3 gap-3">
              {healingMovies.map((movie) => (
                <motion.div
                  key={movie.title}
                  whileHover={{ scale: 1.05, y: -2 }}
                  className="glass-card p-3 text-center"
                >
                  <div className="text-3xl mb-2">{movie.emoji}</div>
                  <p className="text-sm font-medium text-star-white/90">{movie.title}</p>
                  <p className="text-[10px] text-star-white/40 mt-0.5">{movie.desc}</p>
                </motion.div>
              ))}
            </div>
          </motion.div>
        )}

        <motion.div variants={itemVariants} className="space-y-3 pb-4">
          <h2 className="text-sm font-medium text-star-white/70 flex items-center gap-1.5">
            <CalendarIcon size={16} />
            心情日历（最近30天）
          </h2>
          <div className="glass-card p-4">
            <div className="grid grid-cols-7 gap-1.5">
              {['日', '一', '二', '三', '四', '五', '六'].map(d => (
                <div key={d} className="text-center text-[10px] text-star-white/30 py-1">
                  {d}
                </div>
              ))}
              {calendarDays.map(({ date, dateStr, entry }) => {
                const isToday = dateStr === today;
                const moodA = entry?.moodA;
                const moodB = entry?.moodB;
                const isMatch = moodA && moodB && moodA === moodB;

                return (
                  <motion.div
                    key={dateStr}
                    whileHover={{ scale: 1.1 }}
                    className={`aspect-square rounded-lg flex flex-col items-center justify-center relative ${
                      isToday ? 'ring-2 ring-rose-gold/50' : ''
                    } ${isMatch ? 'bg-white/10' : 'bg-white/5'}`}
                    style={isMatch && moodA ? {
                      backgroundColor: `${moodConfig[moodA].color}15`,
                    } : {}}
                  >
                    <span className="text-[10px] text-star-white/40 absolute top-0.5">
                      {format(date, 'd')}
                    </span>
                    <div className="flex items-center gap-0.5 mt-1">
                      {moodA ? (
                        <span className="text-xs">{moodConfig[moodA].emoji}</span>
                      ) : (
                        <span className="w-3 h-3 rounded-full bg-white/5" />
                      )}
                      {moodB ? (
                        <span className="text-xs">{moodConfig[moodB].emoji}</span>
                      ) : (
                        <span className="w-3 h-3 rounded-full bg-white/5" />
                      )}
                    </div>
                    {isMatch && moodA && (
                      <motion.div
                        className="absolute -bottom-0.5 w-1 h-1 rounded-full"
                        style={{ backgroundColor: moodConfig[moodA].color }}
                        animate={{ scale: [1, 1.3, 1], opacity: [0.5, 1, 0.5] }}
                        transition={{ duration: 2, repeat: Infinity }}
                      />
                    )}
                  </motion.div>
                );
              })}
            </div>
            <div className="flex items-center justify-center gap-4 mt-3">
              <div className="flex items-center gap-1">
                <span className="text-xs">{couple.partnerA.avatar}</span>
                <span className="text-[10px] text-star-white/40">{couple.partnerA.name}</span>
              </div>
              <div className="w-px h-3 bg-white/10" />
              <div className="flex items-center gap-1">
                <span className="text-xs">{couple.partnerB.avatar}</span>
                <span className="text-[10px] text-star-white/40">{couple.partnerB.name}</span>
              </div>
              <div className="w-px h-3 bg-white/10" />
              <div className="flex items-center gap-1">
                <div className="w-1.5 h-1.5 rounded-full bg-rose-gold animate-pulse" />
                <span className="text-[10px] text-star-white/40">心情同步</span>
              </div>
            </div>
          </div>
        </motion.div>
      </div>

      <AnimatePresence>
        {hugModalOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/70 backdrop-blur-md z-40"
              onClick={() => !showHearts && setHugModalOpen(false)}
            />
            <motion.div
              variants={hugModalVariants}
              initial="hidden"
              animate="visible"
              exit="exit"
              className="fixed left-5 right-5 top-1/2 -translate-y-1/2 z-50"
            >
              <div className="glass-card-strong p-8 text-center relative overflow-hidden">
                <AnimatePresence>
                  {showHearts && (
                    <>
                      {Array.from({ length: 8 }).map((_, i) => (
                        <motion.div
                          key={i}
                          custom={i}
                          variants={heartBurstVariants}
                          initial="hidden"
                          animate="visible"
                          exit="exit"
                          className="absolute left-1/2 top-1/2 text-2xl"
                          style={{ marginLeft: -12, marginTop: -12 }}
                        >
                          {['💝', '💕', '💗', '💖', '💓', '🤍', '💘', '✨'][i]}
                        </motion.div>
                      ))}
                    </>
                  )}
                </AnimatePresence>

                <motion.div
                  animate={showHearts ? {
                    scale: [1, 1.2, 1.1],
                  } : {
                    scale: [1, 1.05, 1],
                  }}
                  transition={{ duration: 1.5, repeat: Infinity }}
                >
                  <div className="text-7xl mb-4">🫂</div>
                </motion.div>
                <h2 className="text-xl font-display text-gradient-rose mb-2">给你一个大大的拥抱</h2>
                <p className="text-sm text-star-white/60 mb-6">
                  不管今天有多难，我们都在一起<br />
                  一切都会好起来的 💕
                </p>
                {!showHearts && (
                  <div className="flex gap-3 justify-center">
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => setHugModalOpen(false)}
                      className="px-5 py-2.5 rounded-full bg-white/10 text-star-white/70 text-sm"
                    >
                      稍后再说
                    </motion.button>
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={handleGiveHug}
                      className="px-6 py-2.5 rounded-full bg-gradient-to-r from-rose-gold to-rose-pink text-white text-sm font-medium shadow-lg shadow-rose-pink/30 flex items-center gap-2 heart-beat"
                    >
                      <Heart size={16} fill="currentColor" />
                      紧紧抱住
                    </motion.button>
                  </div>
                )}
                {showHearts && (
                  <motion.p
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="text-star-mint text-sm"
                  >
                    抱抱已送达 💌
                  </motion.p>
                )}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
