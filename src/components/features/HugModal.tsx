import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Heart, X, Film } from 'lucide-react';
import { useAppStore } from '../../store/useAppStore';

const healingMovies = [
  { emoji: '🐱', title: '龙猫', desc: '在龙猫的肚子上，一切都会好起来' },
  { emoji: '🍜', title: '小森林', desc: '四季的美食，治愈一切不开心' },
  { emoji: '🎈', title: '飞屋环游记', desc: '和你一起，冒险到世界尽头' },
  { emoji: '🌙', title: '岁月的童话', desc: '回忆里总有温柔的答案' },
  { emoji: '🌸', title: '海街日记', desc: '四姐妹的温暖日常' },
];

export default function HugModal() {
  const { hugModalOpen, setHugModalOpen, couple, comfortMessage } = useAppStore();
  const [hugged, setHugged] = useState(false);
  const [hearts, setHearts] = useState<{ id: number; x: number; y: number }[]>([]);
  const [displayMessage, setDisplayMessage] = useState('');

  useEffect(() => {
    if (hugModalOpen) {
      setDisplayMessage(comfortMessage || '没关系，抱抱就好了呀 💗 雨天总会过去，你们还有彼此呢～');
    }
  }, [hugModalOpen, comfortMessage]);

  const handleHug = () => {
    setHugged(true);
    const newHearts = Array.from({ length: 15 }, (_, i) => ({
      id: Date.now() + i,
      x: (Math.random() - 0.5) * 300,
      y: -(Math.random() * 250 + 80),
    }));
    setHearts(newHearts);
    if (navigator.vibrate) navigator.vibrate([100, 50, 100, 50, 200]);
    setTimeout(() => {
      setHugged(false);
      setHearts([]);
    }, 3000);
  };

  const shuffledMovies = [...healingMovies].sort(() => Math.random() - 0.5).slice(0, 3);

  return (
    <AnimatePresence>
      {hugModalOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-cosmos-900/85 backdrop-blur-md"
          onClick={() => setHugModalOpen(false)}
        >
          <motion.div
            initial={{ scale: 0.8, opacity: 0, y: 50 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.8, opacity: 0, y: 50 }}
            transition={{ type: 'spring', bounce: 0.5 }}
            className="glass-card-strong p-8 max-w-md w-full relative overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={() => setHugModalOpen(false)}
              className="absolute top-4 right-4 p-2 rounded-full hover:bg-white/10 transition-colors text-star-white/60"
            >
              <X size={20} />
            </button>

            <div className="text-center relative">
              <motion.div
                animate={{
                  scale: [1, 1.1, 1],
                }}
                transition={{
                  duration: 2,
                  repeat: Infinity,
                  ease: 'easeInOut',
                }}
                className="text-6xl mb-4"
              >
                ⛈️→💕
              </motion.div>
              <h2 className="text-2xl font-display text-gradient-rose mb-2">
                今天我们都有点难过呢
              </h2>
              <p className="text-star-white/70 mb-4 leading-relaxed">
                {displayMessage}
                {couple && (
                  <span className="block mt-2 text-sm text-star-white/50">
                    {couple.partnerA.name} 和 {couple.partnerB.name}，要一起加油哦
                  </span>
                )}
              </p>

              <div className="relative h-36 flex items-center justify-center mb-6">
                <AnimatePresence>
                  {hearts.map((heart) => (
                    <motion.div
                      key={heart.id}
                      initial={{ scale: 0, x: 0, y: 0, opacity: 1, rotate: 0 }}
                      animate={{
                        scale: [0, 1.8, 0.6],
                        x: heart.x,
                        y: heart.y,
                        opacity: [1, 1, 0],
                        rotate: heart.x > 0 ? 30 : -30,
                      }}
                      transition={{ duration: 2.5, ease: 'easeOut' }}
                      className="absolute text-4xl"
                    >
                      {['💗', '💖', '💕', '💓', '❤️', '💝', '🤗'][Math.floor(Math.random() * 7)]}
                    </motion.div>
                  ))}
                </AnimatePresence>

                <motion.button
                  onClick={handleHug}
                  animate={hugged ? { scale: [1, 1.4, 1] } : { scale: 1 }}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className="relative z-10 px-8 py-4 rounded-full bg-gradient-to-r from-rose-gold to-rose-pink text-white font-medium shadow-lg shadow-rose-pink/30 flex items-center gap-2 text-lg"
                >
                  <Heart className={hugged ? 'fill-white' : ''} size={24} />
                  <span>{hugged ? '紧紧抱住了 💗' : '给TA一个抱抱'}</span>
                </motion.button>
              </div>

              <div className="border-t border-white/10 pt-6">
                <p className="text-star-white/50 text-sm mb-4 flex items-center justify-center gap-2">
                  <Film size={16} />
                  今晚一起看部治愈的电影吧
                </p>
                <div className="space-y-3">
                  {shuffledMovies.map((movie, i) => (
                    <motion.div
                      key={movie.title}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.3 + i * 0.15 }}
                      className="flex items-center gap-4 p-3 rounded-xl bg-white/5 hover:bg-white/10 transition-colors cursor-pointer"
                    >
                      <div className="text-3xl">{movie.emoji}</div>
                      <div className="text-left flex-1">
                        <div className="font-medium">{movie.title}</div>
                        <div className="text-xs text-star-white/50">{movie.desc}</div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
