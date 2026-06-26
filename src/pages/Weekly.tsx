import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, ChevronDown, Calendar, Heart, Target, CheckCircle, Star, RefreshCw, AlertCircle } from 'lucide-react';
import { useAppStore } from '../store/useAppStore';
import { formatDate } from '../utils/date';
import { moodConfig, type WeeklyReport } from '../types';

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.12, delayChildren: 0.1 },
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

function TypewriterText({ text, onComplete }: { text: string; onComplete?: () => void }) {
  const [displayed, setDisplayed] = useState('');
  const [done, setDone] = useState(false);

  useEffect(() => {
    setDisplayed('');
    setDone(false);
    let i = 0;
    const interval = setInterval(() => {
      i++;
      setDisplayed(text.slice(0, i));
      if (i >= text.length) {
        clearInterval(interval);
        setDone(true);
        onComplete?.();
      }
    }, 35);
    return () => clearInterval(interval);
  }, [text, onComplete]);

  return (
    <span>
      {displayed}
      {!done && <span className="inline-block w-0.5 h-4 bg-rose-pink ml-0.5 animate-pulse" style={{ verticalAlign: 'middle' }} />}
    </span>
  );
}

function StatCard({ icon, value, label, gradient }: { icon: React.ReactNode; value: number | string; label: string; gradient: string }) {
  return (
    <motion.div
      whileHover={{ scale: 1.03, y: -2 }}
      className="flex flex-col items-center justify-center p-3 rounded-xl bg-white/5 border border-white/10"
    >
      <div className={`w-9 h-9 rounded-full flex items-center justify-center mb-1.5 ${gradient}`}>
        {icon}
      </div>
      <div className="text-2xl font-number font-bold bg-gradient-to-r from-rose-gold via-rose-light to-rose-pink bg-clip-text text-transparent">
        {value}
      </div>
      <div className="text-[11px] text-star-white/50 mt-0.5">{label}</div>
    </motion.div>
  );
}

function WeeklyCard({ report, isExpanded, onToggle }: { report: WeeklyReport; isExpanded: boolean; onToggle: () => void }) {
  const [showInsight, setShowInsight] = useState(false);

  useEffect(() => {
    if (isExpanded) {
      setShowInsight(false);
      const timer = setTimeout(() => setShowInsight(true), 300);
      return () => clearTimeout(timer);
    }
  }, [isExpanded]);

  return (
    <motion.div layout className="glass-card overflow-hidden">
      <motion.button
        layout
        onClick={onToggle}
        className="w-full p-4 flex items-center justify-between text-left"
      >
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-star-purple/30 to-rose-pink/30 flex items-center justify-center">
            <Calendar size={18} className="text-star-purple" />
          </div>
          <div>
            <div className="font-display text-star-white text-base">
              {formatDate(report.weekStart, 'MM月dd日')} 周报
            </div>
            <div className="text-xs text-star-white/40 flex items-center gap-1 mt-0.5">
              <span>同频{report.stats.moodMatchDays}天</span>
              <span>·</span>
              <span>{report.stats.totalCheckIns}次打卡</span>
            </div>
          </div>
        </div>
        <motion.div animate={{ rotate: isExpanded ? 180 : 0 }} transition={{ duration: 0.2 }}>
          <ChevronDown size={20} className="text-star-white/50" />
        </motion.div>
      </motion.button>

      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.3 }}
            className="overflow-hidden"
          >
            <div className="px-4 pb-4 space-y-4">
              <div className="grid grid-cols-4 gap-2">
                <StatCard
                  icon={<Heart size={14} className="text-rose-pink" />}
                  value={report.stats.togetherDays}
                  label="在一起"
                  gradient="bg-rose-pink/20"
                />
                <StatCard
                  icon={<Sparkles size={14} className="text-star-mint" />}
                  value={report.stats.moodMatchDays}
                  label="同频天"
                  gradient="bg-star-mint/20"
                />
                <StatCard
                  icon={<Target size={14} className="text-star-purple" />}
                  value={report.stats.completedWishes}
                  label="完成愿望"
                  gradient="bg-star-purple/20"
                />
                <StatCard
                  icon={<CheckCircle size={14} className="text-rose-gold" />}
                  value={report.stats.totalCheckIns}
                  label="打卡"
                  gradient="bg-rose-gold/20"
                />
              </div>

              <div>
                <div className="text-xs text-star-white/40 mb-2 flex items-center gap-1">
                  <Star size={12} /> 本周心情趋势
                </div>
                <div className="flex justify-between bg-white/5 rounded-xl p-2.5">
                  {report.moodTrend.map((mood, i) => (
                    <div key={i} className="flex flex-col items-center gap-0.5">
                      <span className="text-lg">{moodConfig[mood]?.emoji ?? '☀️'}</span>
                      <span className="text-[9px] text-star-white/30">
                        {['一','二','三','四','五','六','日'][i]}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {report.highlights.length > 0 && (
                <div>
                  <div className="text-xs text-star-white/40 mb-2">✨ 高光时刻</div>
                  <ul className="space-y-1.5">
                    {report.highlights.map((h, i) => (
                      <motion.li
                        key={i}
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: i * 0.1 }}
                        className="flex items-start gap-2 text-sm text-star-white/70"
                      >
                        <span className="text-rose-gold mt-0.5">💫</span>
                        <span>{h}</span>
                      </motion.li>
                    ))}
                  </ul>
                </div>
              )}

              {showInsight && (
                <div
                  className="relative p-4 rounded-xl"
                  style={{
                    background: 'linear-gradient(135deg, rgba(232,180,184,0.1) 0%, rgba(183,148,246,0.08) 100%)',
                    border: '1px solid rgba(232,180,184,0.2)',
                    backgroundImage: `repeating-linear-gradient(transparent, transparent 27px, rgba(255,255,255,0.05) 28px)`,
                  }}
                >
                  <div className="text-xs text-rose-gold mb-2 flex items-center gap-1">
                    <Sparkles size={12} /> AI 情感洞察
                  </div>
                  <p className="text-sm text-star-white/80 leading-relaxed font-serif">
                    <TypewriterText text={report.aiInsight} />
                  </p>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

function isThisWeek(weekStartStr: string): boolean {
  const weekStart = new Date(weekStartStr);
  const today = new Date();
  const todayWeekStart = new Date(today);
  todayWeekStart.setDate(today.getDate() - 7);
  todayWeekStart.setHours(0, 0, 0, 0);
  return weekStart >= todayWeekStart;
}

export default function Weekly() {
  const { weeklyReports, couple, generateWeeklyReport } = useAppStore();
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [latestTypingDone, setLatestTypingDone] = useState(false);

  const sortedReports = [...weeklyReports].sort(
    (a, b) => new Date(b.weekStart).getTime() - new Date(a.weekStart).getTime()
  );

  const latestReport = sortedReports[0];
  const pastReports = sortedReports.slice(1);
  const hasThisWeekReport = latestReport && isThisWeek(latestReport.weekStart);

  const handleGenerate = useCallback(() => {
    if (!couple) return;
    setIsGenerating(true);
    setLatestTypingDone(false);

    setTimeout(() => {
      generateWeeklyReport();
      setIsGenerating(false);
    }, 2000);
  }, [couple, generateWeeklyReport]);

  useEffect(() => {
    if (latestReport && !isThisWeek(latestReport.weekStart) && !isGenerating) {
    }
  }, [latestReport, isGenerating]);

  const daysTogether = couple
    ? Math.floor((Date.now() - new Date(couple.startDate).getTime()) / 86400000) + 1
    : latestReport?.stats.togetherDays ?? 0;

  return (
    <motion.div
      className="h-full overflow-y-auto overflow-x-hidden scrollbar-hide pb-24"
      variants={containerVariants}
      initial="hidden"
      animate="visible"
    >
      <div className="px-5 pt-6">
        <motion.div variants={itemVariants} className="mb-6 text-center">
          <h1 className="text-2xl font-display text-gradient-rose">AI情感周报</h1>
          <p className="text-star-white/50 text-sm mt-1">专属我们的感情成长记录</p>
        </motion.div>

        {weeklyReports.length === 0 && !isGenerating ? (
          <motion.div variants={itemVariants} className="text-center py-16 mb-6">
            <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-gradient-to-br from-star-purple/20 to-rose-pink/20 flex items-center justify-center">
              <Sparkles size={36} className="text-star-purple" />
            </div>
            <h3 className="text-lg font-display text-star-white mb-2">还没有周报</h3>
            <p className="text-star-white/50 text-sm mb-6">点击下方按钮生成第一份情感周报吧</p>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={handleGenerate}
              className="px-8 py-3 rounded-full font-medium bg-gradient-to-r from-star-purple to-rose-pink text-white shadow-lg shadow-star-purple/20 hover:shadow-star-purple/40 transition-all"
            >
              <span className="flex items-center gap-2">
                <Sparkles size={18} />
                生成第一份情感周报
              </span>
            </motion.button>
          </motion.div>
        ) : (
          <>
            {!hasThisWeekReport && !isGenerating && weeklyReports.length > 0 && (
              <motion.div variants={itemVariants} className="mb-4">
                <div className="glass-card p-4 flex items-center gap-3 border-amber-500/30">
                  <AlertCircle size={20} className="text-amber-500 flex-shrink-0" />
                  <div className="flex-1">
                    <div className="text-sm text-star-white/80">本周周报还没生成</div>
                    <div className="text-xs text-star-white/40">点击下方按钮生成本周的情感周报</div>
                  </div>
                </div>
              </motion.div>
            )}

            {(latestReport || isGenerating) && (
              <motion.div variants={itemVariants} className="mb-6">
                <div className="glass-card p-5 relative overflow-hidden">
                  <div className="absolute top-0 right-0 w-32 h-32 rounded-full opacity-20"
                    style={{
                      background: 'radial-gradient(circle, rgba(255,107,157,0.4) 0%, transparent 70%)',
                      transform: 'translate(30%, -30%)',
                    }}
                  />

                  <div className="flex items-center gap-2 mb-4">
                    <Sparkles size={16} className="text-rose-gold" />
                    <span className="text-xs text-rose-gold/80">
                      {isGenerating ? '正在生成新周报...' : `本周周报 · ${formatDate(latestReport!.weekStart, 'MM月dd日')}`}
                    </span>
                  </div>

                  {isGenerating ? (
                    <div className="flex flex-col items-center py-8">
                      <motion.div
                        animate={{ rotate: 360 }}
                        transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                        className="w-12 h-12 rounded-full border-2 border-rose-pink/30 border-t-rose-pink mb-4"
                      />
                      <p className="text-star-white/50 text-sm">AI正在分析本周数据...</p>
                      <div className="flex gap-1 mt-3">
                        {['💭', '📊', '✨', '💖'].map((emoji, i) => (
                          <motion.span
                            key={i}
                            initial={{ opacity: 0.3, y: 0 }}
                            animate={{ opacity: 1, y: -5 }}
                            transition={{ duration: 0.6, repeat: Infinity, delay: i * 0.15 }}
                            className="text-lg"
                          >
                            {emoji}
                          </motion.span>
                        ))}
                      </div>
                    </div>
                  ) : latestReport ? (
                    <>
                      <div className="grid grid-cols-4 gap-2 mb-5">
                        <StatCard
                          icon={<Heart size={14} className="text-rose-pink" />}
                          value={daysTogether}
                          label="在一起天"
                          gradient="bg-rose-pink/20"
                        />
                        <StatCard
                          icon={<Sparkles size={14} className="text-star-mint" />}
                          value={latestReport.stats.moodMatchDays}
                          label="同频天"
                          gradient="bg-star-mint/20"
                        />
                        <StatCard
                          icon={<Target size={14} className="text-star-purple" />}
                          value={latestReport.stats.completedWishes}
                          label="完成愿望"
                          gradient="bg-star-purple/20"
                        />
                        <StatCard
                          icon={<CheckCircle size={14} className="text-rose-gold" />}
                          value={latestReport.stats.totalCheckIns}
                          label="打卡"
                          gradient="bg-rose-gold/20"
                        />
                      </div>

                      <div className="mb-5">
                        <div className="text-xs text-star-white/40 mb-2">7天心情趋势</div>
                        <div className="flex justify-between bg-white/5 rounded-xl p-3">
                          {latestReport.moodTrend.map((mood, i) => (
                            <motion.div
                              key={i}
                              initial={{ scale: 0, opacity: 0 }}
                              animate={{ scale: 1, opacity: 1 }}
                              transition={{ delay: 0.2 + i * 0.08, type: 'spring' }}
                              className="flex flex-col items-center gap-1"
                            >
                              <span className="text-xl">{moodConfig[mood]?.emoji ?? '☀️'}</span>
                              <span className="text-[9px] text-star-white/30">
                                {['一','二','三','四','五','六','日'][i]}
                              </span>
                            </motion.div>
                          ))}
                        </div>
                      </div>

                      {latestReport.highlights.length > 0 && (
                        <div className="mb-5">
                          <div className="text-xs text-star-white/40 mb-2">✨ 本周高光时刻</div>
                          <ul className="space-y-1.5">
                            {latestReport.highlights.map((h, i) => (
                              <motion.li
                                key={i}
                                initial={{ opacity: 0, x: -10 }}
                                animate={latestTypingDone ? { opacity: 1, x: 0 } : {}}
                                transition={{ delay: i * 0.1 }}
                                className="flex items-start gap-2 text-sm text-star-white/70"
                              >
                                <span className="text-rose-gold mt-0.5">💫</span>
                                <span>{h}</span>
                              </motion.li>
                            ))}
                          </ul>
                        </div>
                      )}

                      <div
                        className="relative p-4 rounded-xl"
                        style={{
                          background: 'linear-gradient(135deg, rgba(232,180,184,0.12) 0%, rgba(183,148,246,0.08) 100%)',
                          border: '1px solid rgba(232,180,184,0.25)',
                          backgroundImage: `repeating-linear-gradient(transparent, transparent 27px, rgba(255,255,255,0.04) 28px)`,
                        }}
                      >
                        <div className="text-xs text-rose-gold mb-2 flex items-center gap-1">
                          <Sparkles size={12} /> AI 情感洞察
                        </div>
                        <p className="text-sm text-star-white/80 leading-relaxed" style={{ fontFamily: '"ZCOOL XiaoWei", serif' }}>
                          <TypewriterText text={latestReport.aiInsight} onComplete={() => setLatestTypingDone(true)} />
                        </p>
                      </div>
                    </>
                  ) : null}
                </div>
              </motion.div>
            )}

            <motion.div variants={itemVariants} className="flex justify-center mb-8">
              <motion.button
                whileHover={{ scale: isGenerating ? 1 : 1.05 }}
                whileTap={{ scale: isGenerating ? 1 : 0.95 }}
                onClick={handleGenerate}
                disabled={isGenerating}
                className={`flex items-center gap-2 px-6 py-2.5 rounded-full text-sm font-medium transition-all ${
                  isGenerating
                    ? 'bg-white/10 text-star-white/30 cursor-not-allowed'
                    : 'bg-gradient-to-r from-star-mint/20 to-star-purple/20 border border-star-mint/30 text-star-mint hover:border-star-mint/60'
                }`}
              >
                <RefreshCw size={14} className={isGenerating ? 'animate-spin' : ''} />
                {isGenerating ? '生成中...' : hasThisWeekReport ? '🔄 重新生成本周周报' : '📊 生成本周周报'}
              </motion.button>
            </motion.div>

            {pastReports.length > 0 && (
              <motion.div variants={itemVariants}>
                <div className="flex items-center gap-2 mb-4">
                  <div className="h-px flex-1 bg-gradient-to-r from-transparent via-white/20 to-transparent" />
                  <span className="text-xs text-star-white/40">历史周报</span>
                  <div className="h-px flex-1 bg-gradient-to-r from-transparent via-white/20 to-transparent" />
                </div>

                <div className="relative space-y-3">
                  <div className="absolute left-5 top-4 bottom-4 w-px bg-gradient-to-b from-rose-gold/30 via-star-purple/20 to-transparent" />

                  {pastReports.map((report, index) => (
                    <div key={report.id} className="relative pl-10">
                      <div
                        className="absolute left-[14px] top-5 w-3 h-3 rounded-full border-2 z-10"
                        style={{
                          borderColor: index === 0 ? '#e8b4b8' : 'rgba(183,148,246,0.5)',
                          background: expandedId === report.id
                            ? (index === 0 ? '#e8b4b8' : 'rgba(183,148,246,0.5)')
                            : 'transparent',
                        }}
                      />
                      <WeeklyCard
                        report={report}
                        isExpanded={expandedId === report.id}
                        onToggle={() => setExpandedId(expandedId === report.id ? null : report.id)}
                      />
                    </div>
                  ))}
                </div>
              </motion.div>
            )}
          </>
        )}
      </div>
    </motion.div>
  );
}
