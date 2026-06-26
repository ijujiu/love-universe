import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { Plus, X, Lock, Unlock, Clock, Image as ImageIcon, Trash2 } from 'lucide-react';
import { useAppStore } from '../store/useAppStore';
import { formatDate, getTimeUntilUnlock } from '../utils/date';
import type { CapsuleMedia } from '../types';

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
      delayChildren: 0.1,
    },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 20, scale: 0.95 },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: { type: 'spring', stiffness: 260, damping: 24 },
  },
};

const modalVariants = {
  hidden: { opacity: 0, scale: 0.9, y: 20 },
  visible: {
    opacity: 1,
    scale: 1,
    y: 0,
    transition: { type: 'spring', stiffness: 300, damping: 25 },
  },
  exit: { opacity: 0, scale: 0.9, y: 20 },
};

function CountdownTimer({ unlockDate }: { unlockDate: string }) {
  const [time, setTime] = useState(getTimeUntilUnlock(unlockDate));

  useEffect(() => {
    const timer = setInterval(() => {
      setTime(getTimeUntilUnlock(unlockDate));
    }, 1000);
    return () => clearInterval(timer);
  }, [unlockDate]);

  if (time.isUnlocked) {
    return (
      <div className="flex items-center gap-1 text-star-mint text-sm font-number">
        <Unlock size={14} />
        已开启
      </div>
    );
  }

  const pad = (n: number) => n.toString().padStart(2, '0');

  return (
    <div className="flex items-center gap-1">
      <Clock size={12} className="text-star-purple" />
      <div className="font-number text-xs text-star-white/80 flex items-center gap-0.5">
        <span className="bg-white/10 px-1.5 py-0.5 rounded">{time.days}天</span>
        <span className="bg-white/10 px-1.5 py-0.5 rounded">{pad(time.hours)}</span>
        <span>:</span>
        <span className="bg-white/10 px-1.5 py-0.5 rounded">{pad(time.minutes)}</span>
        <span>:</span>
        <span className="bg-white/10 px-1.5 py-0.5 rounded">{pad(time.seconds)}</span>
      </div>
    </div>
  );
}

export default function Capsules() {
  const navigate = useNavigate();
  const { capsules, addCapsule, deleteCapsule, couple, currentPartner } = useAppStore();
  const [showModal, setShowModal] = useState(false);
  const [mediaPreviews, setMediaPreviews] = useState<string[]>([]);
  const [form, setForm] = useState({
    title: '',
    content: '',
    unlockDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    author: currentPartner,
    media: [] as CapsuleMedia[],
  });

  useEffect(() => {
    setForm(prev => ({ ...prev, author: currentPartner }));
  }, [currentPartner]);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;

    Array.from(files).forEach(file => {
      const reader = new FileReader();
      reader.onload = (event) => {
        const base64 = event.target?.result as string;
        setForm(prev => ({
          ...prev,
          media: [...prev.media, { type: 'image', content: base64 }]
        }));
        setMediaPreviews(prev => [...prev, base64]);
      };
      reader.readAsDataURL(file);
    });
    e.target.value = '';
  };

  const removeImage = (index: number) => {
    setForm(prev => ({
      ...prev,
      media: prev.media.filter((_, i) => i !== index)
    }));
    setMediaPreviews(prev => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.title.trim() || !form.content.trim()) return;
    addCapsule({
      title: form.title,
      content: form.content,
      media: form.media,
      author: form.author,
      unlockDate: form.unlockDate,
    });
    resetForm();
    setShowModal(false);
  };

  const resetForm = () => {
    setForm({
      title: '',
      content: '',
      unlockDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      author: currentPartner,
      media: [],
    });
    setMediaPreviews([]);
  };

  const handleDelete = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    if (confirm('确定要删除这个胶囊吗？')) {
      deleteCapsule(id);
    }
  };

  const getAuthorAvatar = (author: 'A' | 'B') => {
    if (!couple) return author === 'A' ? '🌟' : '🌙';
    return author === 'A' ? couple.partnerA.avatar : couple.partnerB.avatar;
  };

  const getAuthorName = (author: 'A' | 'B') => {
    if (!couple) return author === 'A' ? 'A' : 'B';
    return author === 'A' ? couple.partnerA.name : couple.partnerB.name;
  };

  const sortedCapsules = [...capsules].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  return (
    <motion.div
      className="h-full overflow-y-auto overflow-x-hidden scrollbar-hide pb-24"
      variants={containerVariants}
      initial="hidden"
      animate="visible"
    >
      <div className="px-5 pt-6">
        <motion.div variants={itemVariants} className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-display text-gradient-rose">秘密胶囊</h1>
            <p className="text-star-white/50 text-sm mt-1">封存时光，静待开启</p>
          </div>
          <motion.button
            whileHover={{ scale: 1.1, rotate: 90 }}
            whileTap={{ scale: 0.9 }}
            onClick={() => setShowModal(true)}
            className="w-12 h-12 rounded-full bg-gradient-to-r from-star-purple to-rose-pink flex items-center justify-center shadow-lg shadow-star-purple/30"
            style={{ filter: 'drop-shadow(0 0 20px rgba(183,148,246,0.4))' }}
          >
            <Plus size={24} className="text-white" />
          </motion.button>
        </motion.div>

        {sortedCapsules.length === 0 ? (
          <motion.div variants={itemVariants} className="text-center py-20">
            <div className="text-6xl mb-4">💌</div>
            <p className="text-star-white/50 mb-2">还没有秘密胶囊</p>
            <p className="text-star-white/30 text-sm">点击右上角按钮封存第一封时光信吧</p>
          </motion.div>
        ) : (
          <div className="grid grid-cols-2 gap-3">
            {sortedCapsules.map((capsule) => {
              const timeUntil = getTimeUntilUnlock(capsule.unlockDate);
              const isLocked = !capsule.isUnlocked && !timeUntil.isUnlocked;

              return (
                <motion.div
                  key={capsule.id}
                  variants={itemVariants}
                  whileHover={{ scale: 1.03, y: -4 }}
                  whileTap={{ scale: 0.97 }}
                  onClick={() => {
                    if (!isLocked) {
                      navigate(`/capsules/${capsule.id}`);
                    }
                  }}
                  className={`glass-card p-4 relative overflow-hidden group ${isLocked ? '' : 'cursor-pointer'}`}
                >
                  {!isLocked && (
                    <button
                      onClick={(e) => handleDelete(e, capsule.id)}
                      className="absolute top-2 right-2 w-7 h-7 rounded-full bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity z-30 hover:bg-red-500/60"
                    >
                      <Trash2 size={14} className="text-white/80" />
                    </button>
                  )}

                  {isLocked ? (
                    <>
                      <div className="absolute inset-0 bg-gradient-to-br from-cosmos-800/80 to-cosmos-600/60 backdrop-blur-md z-10" />
                      <div className="relative z-20 flex flex-col items-center justify-center py-4 text-center">
                        <div className="w-14 h-14 rounded-full bg-white/10 flex items-center justify-center mb-3 animate-pulse-glow" style={{ boxShadow: '0 0 20px rgba(183,148,246,0.4)' }}>
                          <Lock size={24} className="text-star-purple" />
                        </div>
                        <CountdownTimer unlockDate={capsule.unlockDate} />
                      </div>
                    </>
                  ) : (
                    <div className="flex items-center gap-1 mb-2 text-star-mint">
                      <Unlock size={14} />
                      <span className="text-xs">已开启</span>
                    </div>
                  )}

                  <div className={isLocked ? 'relative z-0 blur-sm' : ''}>
                    <h3 className="font-display text-base text-star-white mb-2 line-clamp-1">{capsule.title}</h3>

                    {capsule.media.some(m => m.type === 'image') && !isLocked && (
                      <div className="mb-2 flex gap-1 overflow-hidden">
                        {capsule.media.filter(m => m.type === 'image').slice(0, 3).map((img, i) => (
                          <div key={i} className="w-12 h-12 rounded-lg overflow-hidden bg-white/5 flex-shrink-0">
                            <img src={img.content} alt="" className="w-full h-full object-cover" />
                          </div>
                        ))}
                        {capsule.media.filter(m => m.type === 'image').length > 3 && (
                          <div className="w-12 h-12 rounded-lg bg-white/10 flex items-center justify-center text-xs text-star-white/50 flex-shrink-0">
                            +{capsule.media.filter(m => m.type === 'image').length - 3}
                          </div>
                        )}
                      </div>
                    )}

                    {!isLocked && (
                      <p className="text-xs text-star-white/60 leading-relaxed mb-3 line-clamp-3">{capsule.content}</p>
                    )}

                    <div className="flex items-center justify-between mt-auto pt-2 border-t border-white/5">
                      {!isLocked && (
                        <div className="flex items-center gap-1.5">
                          <span className="text-lg">{getAuthorAvatar(capsule.author)}</span>
                          <span className="text-xs text-star-white/50">{getAuthorName(capsule.author)}</span>
                        </div>
                      )}
                      {isLocked && <div />}
                      <span className="text-[10px] text-star-white/40 font-number">
                        {formatDate(capsule.createdAt, 'yyyy/MM/dd')}
                      </span>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}
      </div>

      <AnimatePresence>
        {showModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
            onClick={() => { setShowModal(false); resetForm(); }}
          >
            <motion.div
              variants={modalVariants}
              initial="hidden"
              animate="visible"
              exit="exit"
              className="glass-card-strong w-full max-w-md p-6 relative max-h-[90vh] overflow-y-auto scrollbar-hide"
              onClick={(e) => e.stopPropagation()}
            >
              <button
                onClick={() => { setShowModal(false); resetForm(); }}
                className="absolute top-4 right-4 w-8 h-8 rounded-full bg-white/10 flex items-center justify-center hover:bg-white/20 transition-colors"
              >
                <X size={18} className="text-star-white/70" />
              </button>

              <h2 className="text-xl font-display text-gradient-rose mb-6">💌 封存时光胶囊</h2>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-xs text-star-white/50 mb-1.5">标题</label>
                  <input
                    type="text"
                    value={form.title}
                    onChange={(e) => setForm({ ...form, title: e.target.value })}
                    placeholder="给未来的一封信"
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-star-white placeholder:text-star-white/30 focus:outline-none focus:border-star-purple/50 focus:bg-white/10 transition-all"
                  />
                </div>

                <div>
                  <label className="block text-xs text-star-white/50 mb-1.5">内容</label>
                  <textarea
                    value={form.content}
                    onChange={(e) => setForm({ ...form, content: e.target.value })}
                    placeholder="写下想对未来的TA说的话..."
                    rows={5}
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-star-white placeholder:text-star-white/30 focus:outline-none focus:border-star-purple/50 focus:bg-white/10 transition-all resize-none"
                  />
                </div>

                <div>
                  <label className="block text-xs text-star-white/50 mb-1.5">图片</label>
                  <label className="flex items-center justify-center gap-2 w-full py-4 border-2 border-dashed border-white/10 rounded-xl cursor-pointer hover:border-star-purple/30 hover:bg-white/5 transition-all">
                    <ImageIcon size={20} className="text-star-white/40" />
                    <span className="text-sm text-star-white/50">点击上传图片</span>
                    <input
                      type="file"
                      accept="image/*"
                      multiple
                      onChange={handleImageUpload}
                      className="hidden"
                    />
                  </label>
                  {mediaPreviews.length > 0 && (
                    <div className="flex flex-wrap gap-2 mt-3">
                      {mediaPreviews.map((preview, index) => (
                        <div key={index} className="relative w-16 h-16 rounded-lg overflow-hidden">
                          <img src={preview} alt="" className="w-full h-full object-cover" />
                          <button
                            type="button"
                            onClick={() => removeImage(index)}
                            className="absolute top-0.5 right-0.5 w-5 h-5 rounded-full bg-black/60 flex items-center justify-center"
                          >
                            <X size={12} className="text-white" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <div>
                  <label className="block text-xs text-star-white/50 mb-1.5">解锁日期</label>
                  <input
                    type="date"
                    value={form.unlockDate}
                    onChange={(e) => setForm({ ...form, unlockDate: e.target.value })}
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-star-white focus:outline-none focus:border-star-purple/50 focus:bg-white/10 transition-all"
                  />
                </div>

                <div>
                  <label className="block text-xs text-star-white/50 mb-2">作者</label>
                  <div className="flex gap-3">
                    <button
                      type="button"
                      onClick={() => setForm({ ...form, author: 'A' })}
                      className={`flex-1 py-3 rounded-xl flex items-center justify-center gap-2 transition-all ${
                        form.author === 'A'
                          ? 'bg-gradient-to-r from-rose-gold/30 to-rose-pink/30 border border-rose-gold/50'
                          : 'bg-white/5 border border-white/10 hover:bg-white/10'
                      }`}
                    >
                      <span className="text-xl">{couple?.partnerA.avatar ?? '🌟'}</span>
                      <span className="text-sm text-star-white">{couple?.partnerA.name ?? 'A'}</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setForm({ ...form, author: 'B' })}
                      className={`flex-1 py-3 rounded-xl flex items-center justify-center gap-2 transition-all ${
                        form.author === 'B'
                          ? 'bg-gradient-to-r from-star-purple/30 to-rose-pink/30 border border-star-purple/50'
                          : 'bg-white/5 border border-white/10 hover:bg-white/10'
                      }`}
                    >
                      <span className="text-xl">{couple?.partnerB.avatar ?? '🌙'}</span>
                      <span className="text-sm text-star-white">{couple?.partnerB.name ?? 'B'}</span>
                    </button>
                  </div>
                  <p className="text-[10px] text-star-white/30 mt-1.5">当前身份：{getAuthorName(currentPartner)}</p>
                </div>

                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  type="submit"
                  className="w-full mt-2 px-6 py-3 rounded-full bg-gradient-to-r from-star-purple to-rose-pink text-white font-medium shadow-lg shadow-star-purple/20 hover:shadow-star-purple/40 transition-all duration-300 hover:scale-105 active:scale-95"
                >
                  封存胶囊 🔒
                </motion.button>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
