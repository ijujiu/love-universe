import { useState, useEffect, useMemo } from 'react';
import { motion } from 'framer-motion';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Lock, Unlock, Clock, Calendar, User, Sparkles } from 'lucide-react';
import { useAppStore } from '../store/useAppStore';
import { formatDate, getTimeUntilUnlock } from '../utils/date';

function CountdownDisplay({ unlockDate }: { unlockDate: string }) {
  const [time, setTime] = useState(getTimeUntilUnlock(unlockDate));

  useEffect(() => {
    const timer = setInterval(() => {
      setTime(getTimeUntilUnlock(unlockDate));
    }, 1000);
    return () => clearInterval(timer);
  }, [unlockDate]);

  const pad = (n: number) => n.toString().padStart(2, '0');

  if (time.isUnlocked) {
    return (
      <div className="flex items-center justify-center gap-2 text-star-mint">
        <Unlock size={18} />
        <span className="font-display text-lg">已到解锁时间！</span>
      </div>
    );
  }

  return (
    <div className="flex items-center justify-center gap-2">
      {time.days > 0 && (
        <div className="flex flex-col items-center">
          <div className="text-3xl font-number font-bold bg-gradient-to-r from-rose-gold to-rose-pink bg-clip-text text-transparent">
            {time.days}
          </div>
          <div className="text-[10px] text-star-white/40 mt-0.5">天</div>
        </div>
      )}
      <div className="flex flex-col items-center">
        <div className="text-3xl font-number font-bold bg-gradient-to-r from-rose-gold to-rose-pink bg-clip-text text-transparent">
          {pad(time.hours)}
        </div>
        <div className="text-[10px] text-star-white/40 mt-0.5">时</div>
      </div>
      <span className="text-2xl text-rose-gold/60 mt-[-12px]">:</span>
      <div className="flex flex-col items-center">
        <div className="text-3xl font-number font-bold bg-gradient-to-r from-rose-gold to-rose-pink bg-clip-text text-transparent">
          {pad(time.minutes)}
        </div>
        <div className="text-[10px] text-star-white/40 mt-0.5">分</div>
      </div>
      <span className="text-2xl text-rose-gold/60 mt-[-12px]">:</span>
      <div className="flex flex-col items-center">
        <div className="text-3xl font-number font-bold bg-gradient-to-r from-rose-gold to-rose-pink bg-clip-text text-transparent">
          {pad(time.seconds)}
        </div>
        <div className="text-[10px] text-star-white/40 mt-0.5">秒</div>
      </div>
    </div>
  );
}

function ParticleBurst({ show }: { show: boolean }) {
  const particles = useMemo(() => {
    return Array.from({ length: 20 }, (_, i) => ({
      id: i,
      angle: (i / 20) * 360,
      distance: 60 + Math.random() * 80,
      size: 4 + Math.random() * 6,
      duration: 0.6 + Math.random() * 0.4,
      delay: Math.random() * 0.2,
      color: ['#ff6b9d', '#e8b4b8', '#b794f6', '#64ffda', '#ffb6c1'][Math.floor(Math.random() * 5)],
    }));
  }, []);

  if (!show) return null;

  return (
    <div className="absolute inset-0 pointer-events-none overflow-visible">
      {particles.map((p) => (
        <motion.div
          key={p.id}
          className="absolute rounded-full"
          initial={{
            x: '-50%',
            y: '-50%',
            left: '50%',
            top: '50%',
            scale: 0,
            opacity: 1,
            width: p.size,
            height: p.size,
            backgroundColor: p.color,
            boxShadow: `0 0 ${p.size * 2}px ${p.color}`,
          }}
          animate={{
            x: `calc(-50% + ${Math.cos((p.angle * Math.PI) / 180) * p.distance}px)`,
            y: `calc(-50% + ${Math.sin((p.angle * Math.PI) / 180) * p.distance}px)`,
            scale: [0, 1, 0],
            opacity: [1, 1, 0],
          }}
          transition={{
            duration: p.duration,
            delay: p.delay,
            ease: 'easeOut',
          }}
        />
      ))}
    </div>
  );
}

export default function CapsuleDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { capsules, unlockCapsule, couple } = useAppStore();
  const [showParticles, setShowParticles] = useState(false);
  const [isUnlocking, setIsUnlocking] = useState(false);

  const capsule = capsules.find((c) => c.id === id);

  const timeUntil = capsule ? getTimeUntilUnlock(capsule.unlockDate) : null;
  const isLocked = capsule ? !capsule.isUnlocked && !timeUntil?.isUnlocked : false;
  const canUnlock = capsule && !capsule.isUnlocked && timeUntil?.isUnlocked;

  const getAuthorAvatar = (author: 'A' | 'B') => {
    if (!couple) return author === 'A' ? '🌟' : '🌙';
    return author === 'A' ? couple.partnerA.avatar : couple.partnerB.avatar;
  };

  const getAuthorName = (author: 'A' | 'B') => {
    if (!couple) return author === 'A' ? 'A' : 'B';
    return author === 'A' ? couple.partnerA.name : couple.partnerB.name;
  };

  const handleUnlock = () => {
    if (!capsule || isUnlocking) return;
    setIsUnlocking(true);
    setShowParticles(true);

    setTimeout(() => {
      unlockCapsule(capsule.id);
      setIsUnlocking(false);
    }, 1200);
  };

  useEffect(() => {
    return () => setShowParticles(false);
  }, []);

  if (!capsule) {
    return (
      <div className="h-full flex flex-col items-center justify-center px-5">
        <motion.button
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          onClick={() => navigate(-1)}
          className="absolute top-6 left-5 w-10 h-10 rounded-full bg-white/10 backdrop-blur flex items-center justify-center hover:bg-white/20 transition-colors"
        >
          <ArrowLeft size={20} className="text-star-white" />
        </motion.button>
        <div className="text-5xl mb-4">📭</div>
        <p className="text-star-white/50 text-center">找不到这个时光胶囊</p>
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => navigate('/capsules')}
          className="mt-6 px-6 py-2.5 rounded-full bg-white/10 text-star-white text-sm hover:bg-white/20 transition-colors"
        >
          返回胶囊列表
        </motion.button>
      </div>
    );
  }

  return (
    <motion.div
      className="h-full overflow-y-auto overflow-x-hidden scrollbar-hide pb-12"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3 }}
    >
      <div className="sticky top-0 z-30 px-5 pt-6 pb-4 bg-gradient-to-b from-cosmos-900 via-cosmos-900/95 to-transparent">
        <motion.button
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          onClick={() => navigate(-1)}
          className="w-10 h-10 rounded-full bg-white/10 backdrop-blur flex items-center justify-center hover:bg-white/20 transition-colors"
        >
          <ArrowLeft size={20} className="text-star-white" />
        </motion.button>
      </div>

      <div className="px-5">
        {isLocked ? (
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ type: 'spring', stiffness: 200, damping: 25 }}
            className="flex flex-col items-center pt-8"
          >
            <motion.div
              animate={{
                scale: [1, 1.05, 1],
                rotate: [0, 2, -2, 0],
              }}
              transition={{
                duration: 3,
                repeat: Infinity,
                ease: 'easeInOut',
              }}
              className="w-28 h-28 rounded-full flex items-center justify-center mb-8 relative"
              style={{
                background: 'radial-gradient(circle, rgba(183,148,246,0.3) 0%, rgba(183,148,246,0.1) 100%)',
                boxShadow: '0 0 40px rgba(183,148,246,0.3), inset 0 0 30px rgba(183,148,246,0.1)',
              }}
            >
              <div className="absolute inset-0 rounded-full border border-star-purple/30 animate-pulse" />
              <Lock size={44} className="text-star-purple" />
            </motion.div>

            <h1 className="text-2xl font-display text-gradient-rose mb-2 text-center">{capsule.title}</h1>

            <div className="flex items-center gap-2 text-star-white/40 text-sm mb-8">
              <Calendar size={14} />
              <span>封存于 {formatDate(capsule.createdAt, 'yyyy年MM月dd日')}</span>
            </div>

            <div className="glass-card w-full p-6 text-center mb-8">
              <div className="flex items-center justify-center gap-2 text-star-white/50 text-sm mb-4">
                <Clock size={14} />
                <span>距离解锁还有</span>
              </div>
              <CountdownDisplay unlockDate={capsule.unlockDate} />
              <div className="mt-4 text-xs text-star-white/30">
                解锁日期：{formatDate(capsule.unlockDate, 'yyyy年MM月dd日')}
              </div>
            </div>

            <div className="flex items-center gap-2 text-star-white/30 text-xs">
              <User size={12} />
              <span>来自 {getAuthorAvatar(capsule.author)} {getAuthorName(capsule.author)} 的时光胶囊</span>
            </div>

            {canUnlock && (
              <motion.button
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={handleUnlock}
                disabled={isUnlocking}
                className="relative mt-8 px-8 py-3.5 rounded-full bg-gradient-to-r from-star-purple to-rose-pink text-white font-medium shadow-lg shadow-rose-pink/30 overflow-visible"
              >
                <ParticleBurst show={showParticles} />
                <span className="relative z-10 flex items-center gap-2">
                  <Sparkles size={16} />
                  {isUnlocking ? '开启中...' : '✨ 开启胶囊'}
                </span>
              </motion.button>
            )}
          </motion.div>
        ) : (
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ type: 'spring', stiffness: 200, damping: 25 }}
          >
            <div className="text-center mb-6">
              <motion.div
                initial={{ scale: 0, rotate: -180 }}
                animate={{ scale: 1, rotate: 0 }}
                transition={{ type: 'spring', stiffness: 200, damping: 20, delay: 0.1 }}
                className="w-16 h-16 rounded-full bg-gradient-to-br from-rose-gold/30 to-rose-pink/30 flex items-center justify-center mx-auto mb-4"
                style={{ boxShadow: '0 0 30px rgba(255,107,157,0.3)' }}
              >
                <Unlock size={28} className="text-rose-pink" />
              </motion.div>
              <h1 className="text-2xl font-display text-gradient-rose mb-2">{capsule.title}</h1>
            </div>

            <div className="flex items-center justify-between mb-6 px-2">
              <div className="flex items-center gap-2">
                <div className="w-9 h-9 rounded-full bg-gradient-to-br from-rose-gold/30 to-rose-pink/30 flex items-center justify-center text-lg">
                  {getAuthorAvatar(capsule.author)}
                </div>
                <div>
                  <div className="text-sm text-star-white font-medium">{getAuthorName(capsule.author)}</div>
                  <div className="text-[10px] text-star-white/40 flex items-center gap-1">
                    <Calendar size={10} />
                    {formatDate(capsule.createdAt, 'yyyy/MM/dd')}
                  </div>
                </div>
              </div>
              {capsule.isUnlocked && (
                <div className="flex items-center gap-1 text-star-mint text-xs">
                  <Unlock size={12} />
                  已开启
                </div>
              )}
            </div>

            <div
              className="relative p-6 rounded-2xl mb-6"
              style={{
                background: 'linear-gradient(135deg, rgba(232,180,184,0.08) 0%, rgba(183,148,246,0.06) 100%)',
                border: '1px solid rgba(232,180,184,0.15)',
                backgroundImage: `repeating-linear-gradient(transparent, transparent 31px, rgba(255,255,255,0.03) 32px)`,
              }}
            >
              <div className="absolute top-3 left-4 text-rose-gold/30 text-xs">💌</div>
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.3 }}
                className="pt-4"
              >
                <p
                  className="text-star-white/85 leading-[32px] text-[15px]"
                  style={{ fontFamily: '"ZCOOL XiaoWei", serif' }}
                >
                  {capsule.content}
                </p>
              </motion.div>
            </div>

            {capsule.media && capsule.media.length > 0 && (
              <div className="space-y-3 mb-6">
                {capsule.media.map((m, i) => (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.4 + i * 0.15 }}
                    className="rounded-2xl overflow-hidden"
                  >
                    {m.type === 'image' && (
                      <img
                        src={m.content}
                        alt="capsule media"
                        className="w-full object-cover rounded-2xl"
                        style={{ maxHeight: '300px' }}
                      />
                    )}
                    {m.type === 'text' && (
                      <div className="p-4 bg-white/5 rounded-2xl text-sm text-star-white/70">
                        {m.content}
                      </div>
                    )}
                  </motion.div>
                ))}
              </div>
            )}

            {canUnlock && !capsule.isUnlocked && (
              <div className="flex justify-center">
                <motion.button
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={handleUnlock}
                  disabled={isUnlocking}
                  className="relative px-8 py-3.5 rounded-full bg-gradient-to-r from-star-purple to-rose-pink text-white font-medium shadow-lg shadow-rose-pink/30 overflow-visible"
                >
                  <ParticleBurst show={showParticles} />
                  <span className="relative z-10 flex items-center gap-2">
                    <Sparkles size={16} />
                    {isUnlocking ? '开启中...' : '✨ 开启胶囊'}
                  </span>
                </motion.button>
              </div>
            )}
          </motion.div>
        )}
      </div>
    </motion.div>
  );
}
