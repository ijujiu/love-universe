import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, X, MapPin, Camera, Mic, MicOff, Play, Trash2, Loader2, Navigation } from 'lucide-react';
import { useAppStore } from '../store/useAppStore';
import { formatDate } from '../utils/date';
import { VoiceRecorder, playVoice } from '../utils/recorder';
import { getCurrentPosition } from '../utils/geolocation';

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.15,
      delayChildren: 0.1,
    },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 30 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { type: 'spring', stiffness: 200, damping: 20 },
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

const emojiOptions = ['💗', '🌸', '🎬', '🌊', '🏠', '✈️', '🎂', '💍', '🎁', '🌟', '🌙', '☀️', '🌈', '🍰', '🎵', '📸', '💌', '🤝', '👫', '🏖️'];

export default function Timeline() {
  const { milestones, addMilestone, deleteMilestone, currentPartner, couple } = useAppStore();
  const [showModal, setShowModal] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [recordingDuration, setRecordingDuration] = useState(0);
  const [isGettingLocation, setIsGettingLocation] = useState(false);
  const [locationMessage, setLocationMessage] = useState('');
  const [playingVoiceId, setPlayingVoiceId] = useState<string | null>(null);
  const [recorder, setRecorder] = useState<VoiceRecorder | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const recordingTimerRef = useRef<number | null>(null);

  const [form, setForm] = useState({
    title: '',
    date: new Date().toISOString().split('T')[0],
    location: '',
    coordinates: undefined as { lat: number; lng: number } | undefined,
    description: '',
    photoData: '',
    voiceData: undefined as { data: string; duration: number } | undefined,
    emoji: '💗',
  });

  useEffect(() => {
    return () => {
      if (recordingTimerRef.current) {
        clearInterval(recordingTimerRef.current);
      }
      if (recorder && recorder.isRecording()) {
        recorder.cancel();
      }
    };
  }, [recorder]);

  const resetForm = () => {
    setForm({
      title: '',
      date: new Date().toISOString().split('T')[0],
      location: '',
      coordinates: undefined,
      description: '',
      photoData: '',
      voiceData: undefined,
      emoji: '💗',
    });
    setLocationMessage('');
    setIsRecording(false);
    setRecordingDuration(0);
    if (recordingTimerRef.current) {
      clearInterval(recordingTimerRef.current);
      recordingTimerRef.current = null;
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.title.trim() || !form.description.trim()) return;
    addMilestone({
      title: form.title,
      date: form.date,
      location: form.location || undefined,
      coordinates: form.coordinates,
      description: form.description,
      photoData: form.photoData || undefined,
      voiceData: form.voiceData,
      emoji: form.emoji,
      author: currentPartner,
    });
    resetForm();
    setShowModal(false);
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      const base64 = event.target?.result as string;
      setForm(prev => ({ ...prev, photoData: base64 }));
    };
    reader.readAsDataURL(file);
  };

  const startRecording = async () => {
    try {
      const newRecorder = new VoiceRecorder();
      await newRecorder.start();
      setRecorder(newRecorder);
      setIsRecording(true);
      setRecordingDuration(0);
      recordingTimerRef.current = window.setInterval(() => {
        setRecordingDuration(prev => prev + 100);
      }, 100);
    } catch (err) {
      setLocationMessage(err instanceof Error ? err.message : '录音失败');
      setTimeout(() => setLocationMessage(''), 3000);
    }
  };

  const stopRecording = async () => {
    if (!recorder) return;
    try {
      if (recordingTimerRef.current) {
        clearInterval(recordingTimerRef.current);
        recordingTimerRef.current = null;
      }
      const result = await recorder.stop();
      setForm(prev => ({
        ...prev,
        voiceData: { data: result.data, duration: result.duration }
      }));
      setIsRecording(false);
      setRecordingDuration(0);
      setRecorder(null);
    } catch (err) {
      setLocationMessage('录音保存失败');
      setTimeout(() => setLocationMessage(''), 3000);
      setIsRecording(false);
    }
  };

  const cancelRecording = () => {
    if (recorder) {
      recorder.cancel();
      setRecorder(null);
    }
    if (recordingTimerRef.current) {
      clearInterval(recordingTimerRef.current);
      recordingTimerRef.current = null;
    }
    setIsRecording(false);
    setRecordingDuration(0);
  };

  const handleGetLocation = async () => {
    setIsGettingLocation(true);
    setLocationMessage('');
    try {
      const pos = await getCurrentPosition();
      setForm(prev => ({ ...prev, coordinates: { lat: pos.lat, lng: pos.lng } }));
      setLocationMessage('位置获取成功');
    } catch (err) {
      setLocationMessage(err instanceof Error ? err.message : '位置获取失败');
    } finally {
      setIsGettingLocation(false);
      setTimeout(() => setLocationMessage(''), 3000);
    }
  };

  const handlePlayVoice = async (voiceData: { data: string; duration: number }, id: string) => {
    if (playingVoiceId === id) return;
    try {
      setPlayingVoiceId(id);
      await playVoice(voiceData.data);
    } catch {
    } finally {
      setPlayingVoiceId(null);
    }
  };

  const formatDuration = (ms: number) => {
    const seconds = Math.floor(ms / 1000);
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const handleDelete = (id: string) => {
    deleteMilestone(id);
  };

  const getPartnerName = (author?: 'A' | 'B') => {
    if (!couple || !author) return '';
    return author === 'A' ? couple.partnerA.name : couple.partnerB.name;
  };

  const getPartnerAvatar = (author?: 'A' | 'B') => {
    if (!couple || !author) return '👤';
    return author === 'A' ? couple.partnerA.avatar : couple.partnerB.avatar;
  };

  const sortedMilestones = [...milestones].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  return (
    <motion.div
      className="h-full overflow-y-auto overflow-x-hidden scrollbar-hide pb-24"
      variants={containerVariants}
      initial="hidden"
      animate="visible"
    >
      <div className="px-5 pt-6">
        <motion.div variants={itemVariants} className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-display text-gradient-rose">纪念宇宙</h1>
            <p className="text-star-white/50 text-sm mt-1">我们的星光轨迹</p>
          </div>
          <motion.button
            whileHover={{ scale: 1.1, rotate: 90 }}
            whileTap={{ scale: 0.9 }}
            onClick={() => setShowModal(true)}
            className="w-12 h-12 rounded-full bg-gradient-to-r from-rose-gold to-rose-pink flex items-center justify-center shadow-lg shadow-rose-pink/30 glow-rose"
          >
            <Plus size={24} className="text-white" />
          </motion.button>
        </motion.div>

        <div className="relative">
          <div className="absolute left-1/2 top-0 bottom-0 w-0.5 -translate-x-1/2 bg-gradient-to-b from-rose-gold/60 via-rose-pink/40 to-star-purple/30" />
          <div className="absolute left-1/2 top-0 bottom-0 w-4 -translate-x-1/2 bg-gradient-to-b from-rose-gold/10 via-rose-pink/5 to-transparent blur-xl" />

          <div className="space-y-8">
            {sortedMilestones.map((milestone, index) => {
              const isLeft = index % 2 === 0;
              return (
                <motion.div
                  key={milestone.id}
                  variants={itemVariants}
                  className={`relative flex items-center ${isLeft ? 'flex-row' : 'flex-row-reverse'}`}
                >
                  <div className="absolute left-1/2 -translate-x-1/2 z-10">
                    <div className="relative">
                      <div className="w-5 h-5 rounded-full bg-gradient-to-br from-rose-gold to-rose-pink animate-pulse-glow" style={{ boxShadow: '0 0 20px rgba(232,180,184,0.6), 0 0 40px rgba(255,107,157,0.3)' }} />
                      <div className="absolute inset-0 w-5 h-5 rounded-full bg-rose-gold/40 animate-ripple" />
                    </div>
                  </div>

                  <div className={`w-[calc(50%-2rem)] ${isLeft ? 'pr-8 text-right' : 'pl-8 text-left'}`}>
                    <motion.div
                      whileHover={{ scale: 1.02, y: -3 }}
                      className="glass-card p-4 relative overflow-hidden group"
                    >
                      <button
                        onClick={() => handleDelete(milestone.id)}
                        className={`absolute top-2 ${isLeft ? 'left-2' : 'right-2'} w-7 h-7 rounded-full bg-red-500/20 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-500/40 z-10`}
                      >
                        <Trash2 size={14} className="text-red-400" />
                      </button>

                      <div className={`absolute ${isLeft ? '-right-1 top-0 bottom-0 w-1' : '-left-1 top-0 bottom-0 w-1'} bg-gradient-to-b from-rose-gold to-rose-pink opacity-60 group-hover:opacity-100 transition-opacity`} />

                      <div className={`flex items-start gap-3 ${isLeft ? 'flex-row-reverse' : ''}`}>
                        <div className="text-4xl flex-shrink-0">{milestone.emoji}</div>
                        <div className={`flex-1 ${isLeft ? 'text-right' : 'text-left'}`}>
                          <div className={`flex items-center gap-2 mb-1 ${isLeft ? 'justify-end' : ''}`}>
                            <h3 className="font-display text-lg text-star-white">{milestone.title}</h3>
                            {milestone.author && (
                              <span className="text-xs bg-white/10 px-2 py-0.5 rounded-full flex items-center gap-1">
                                <span>{getPartnerAvatar(milestone.author)}</span>
                                <span className="text-star-white/70">{getPartnerName(milestone.author)}</span>
                              </span>
                            )}
                          </div>
                          <p className="font-number text-sm text-rose-gold mb-1">{formatDate(milestone.date)}</p>
                          {milestone.location && (
                            <p className={`flex items-center gap-1 text-xs text-star-white/50 mb-2 ${isLeft ? 'justify-end' : ''}`}>
                              <MapPin size={12} />
                              {milestone.location}
                            </p>
                          )}
                          {milestone.coordinates && (
                            <p className={`mb-2 ${isLeft ? 'text-right' : 'text-left'}`}>
                              <a
                                href={`https://www.openstreetmap.org/?mlat=${milestone.coordinates.lat}&mlon=${milestone.coordinates.lng}#map=17/${milestone.coordinates.lat}/${milestone.coordinates.lng}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className={`inline-flex items-center gap-1 text-xs text-rose-gold hover:text-rose-pink transition-colors ${isLeft ? 'flex-row-reverse' : ''}`}
                              >
                                <Navigation size={12} />
                                {milestone.coordinates.lat.toFixed(4)}, {milestone.coordinates.lng.toFixed(4)}
                              </a>
                            </p>
                          )}
                          <p className="text-sm text-star-white/70 leading-relaxed mb-3">{milestone.description}</p>
                          {milestone.photoData && (
                            <div className={`rounded-xl overflow-hidden mb-3 ${isLeft ? 'ml-auto' : ''}`}>
                              <img
                                src={milestone.photoData}
                                alt={milestone.title}
                                className="w-full h-40 object-cover rounded-xl"
                              />
                            </div>
                          )}
                          {milestone.voiceData && (
                            <div className={`flex items-center gap-2 mb-2 ${isLeft ? 'justify-end' : ''}`}>
                              <button
                                onClick={() => handlePlayVoice(milestone.voiceData!, milestone.id)}
                                className="flex items-center gap-2 px-3 py-2 rounded-full bg-white/10 hover:bg-white/20 transition-colors"
                              >
                                {playingVoiceId === milestone.id ? (
                                  <div className="flex items-center gap-0.5">
                                    {[...Array(4)].map((_, i) => (
                                      <motion.div
                                        key={i}
                                        className="w-1 bg-rose-gold rounded-full"
                                        animate={{ height: [8, 16, 8] }}
                                        transition={{ duration: 0.5, repeat: Infinity, delay: i * 0.1 }}
                                      />
                                    ))}
                                  </div>
                                ) : (
                                  <Play size={14} className="text-rose-gold" />
                                )}
                                <span className="text-xs text-star-white/70 font-number">
                                  {formatDuration(milestone.voiceData.duration)}
                                </span>
                              </button>
                            </div>
                          )}
                        </div>
                      </div>
                    </motion.div>
                  </div>

                  <div className="w-16" />
                </motion.div>
              );
            })}

            {sortedMilestones.length === 0 && (
              <motion.div variants={itemVariants} className="text-center py-20">
                <div className="text-6xl mb-4">✨</div>
                <p className="text-star-white/50">还没有里程碑，点击右上角添加第一个回忆</p>
              </motion.div>
            )}
          </div>
        </div>
      </div>

      <AnimatePresence>
        {showModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
            onClick={() => {
              if (isRecording) cancelRecording();
              setShowModal(false);
              resetForm();
            }}
          >
            <motion.div
              variants={modalVariants}
              initial="hidden"
              animate="visible"
              exit="exit"
              className="glass-card-strong w-full max-w-md p-6 relative max-h-[90vh] overflow-y-auto"
              onClick={(e) => e.stopPropagation()}
            >
              <button
                onClick={() => {
                  if (isRecording) cancelRecording();
                  setShowModal(false);
                  resetForm();
                }}
                className="absolute top-4 right-4 w-8 h-8 rounded-full bg-white/10 flex items-center justify-center hover:bg-white/20 transition-colors"
              >
                <X size={18} className="text-star-white/70" />
              </button>

              <h2 className="text-xl font-display text-gradient-rose mb-6">✨ 添加星光里程碑</h2>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-xs text-star-white/50 mb-1.5">标题</label>
                  <input
                    type="text"
                    value={form.title}
                    onChange={(e) => setForm({ ...form, title: e.target.value })}
                    placeholder="给这个时刻起个名字"
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-star-white placeholder:text-star-white/30 focus:outline-none focus:border-rose-gold/50 focus:bg-white/10 transition-all"
                  />
                </div>

                <div>
                  <label className="block text-xs text-star-white/50 mb-1.5">日期</label>
                  <input
                    type="date"
                    value={form.date}
                    onChange={(e) => setForm({ ...form, date: e.target.value })}
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-star-white focus:outline-none focus:border-rose-gold/50 focus:bg-white/10 transition-all"
                  />
                </div>

                <div>
                  <label className="block text-xs text-star-white/50 mb-1.5">地点 (可选)</label>
                  <input
                    type="text"
                    value={form.location}
                    onChange={(e) => setForm({ ...form, location: e.target.value })}
                    placeholder="在哪里发生的呢？"
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-star-white placeholder:text-star-white/30 focus:outline-none focus:border-rose-gold/50 focus:bg-white/10 transition-all"
                  />
                </div>

                <div>
                  <label className="block text-xs text-star-white/50 mb-1.5">描述</label>
                  <textarea
                    value={form.description}
                    onChange={(e) => setForm({ ...form, description: e.target.value })}
                    placeholder="记录下这个美好的瞬间..."
                    rows={3}
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-star-white placeholder:text-star-white/30 focus:outline-none focus:border-rose-gold/50 focus:bg-white/10 transition-all resize-none"
                  />
                </div>

                <div>
                  <label className="block text-xs text-star-white/50 mb-2">媒体</label>
                  <div className="flex flex-wrap gap-2">
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      onChange={handleImageUpload}
                      className="hidden"
                    />
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className={`flex items-center gap-2 px-3 py-2 rounded-xl transition-all ${
                        form.photoData
                          ? 'bg-rose-gold/30 border border-rose-gold/50 text-rose-gold'
                          : 'bg-white/5 border border-white/10 text-star-white/70 hover:bg-white/10'
                      }`}
                    >
                      <Camera size={16} />
                      {form.photoData ? '已添加照片' : '添加照片'}
                    </button>

                    {!isRecording ? (
                      <button
                        type="button"
                        onClick={startRecording}
                        className={`flex items-center gap-2 px-3 py-2 rounded-xl transition-all ${
                          form.voiceData
                            ? 'bg-rose-gold/30 border border-rose-gold/50 text-rose-gold'
                            : 'bg-white/5 border border-white/10 text-star-white/70 hover:bg-white/10'
                        }`}
                      >
                        <Mic size={16} />
                        {form.voiceData ? `已录音 ${formatDuration(form.voiceData.duration)}` : '录音'}
                      </button>
                    ) : (
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={stopRecording}
                          className="flex items-center gap-2 px-3 py-2 rounded-xl bg-red-500/30 border border-red-500/50 text-red-400"
                        >
                          <div className="w-3 h-3 bg-red-500 rounded-sm" />
                          <span className="font-number text-sm">{formatDuration(recordingDuration)}</span>
                        </button>
                        <div className="flex items-center gap-0.5 px-2 py-2">
                          {[...Array(5)].map((_, i) => (
                            <motion.div
                              key={i}
                              className="w-1 bg-rose-gold rounded-full"
                              animate={{ height: [8, 20 + Math.random() * 12, 8] }}
                              transition={{ duration: 0.4, repeat: Infinity, delay: i * 0.08 }}
                            />
                          ))}
                        </div>
                        <button
                          type="button"
                          onClick={cancelRecording}
                          className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center hover:bg-white/20"
                        >
                          <MicOff size={14} className="text-star-white/70" />
                        </button>
                      </div>
                    )}

                    <button
                      type="button"
                      onClick={handleGetLocation}
                      disabled={isGettingLocation}
                      className={`flex items-center gap-2 px-3 py-2 rounded-xl transition-all ${
                        form.coordinates
                          ? 'bg-rose-gold/30 border border-rose-gold/50 text-rose-gold'
                          : 'bg-white/5 border border-white/10 text-star-white/70 hover:bg-white/10'
                      } disabled:opacity-50`}
                    >
                      {isGettingLocation ? (
                        <Loader2 size={16} className="animate-spin" />
                      ) : (
                        <MapPin size={16} />
                      )}
                      {form.coordinates ? '已获取位置' : '获取位置'}
                    </button>
                  </div>
                  {locationMessage && (
                    <p className={`text-xs mt-2 ${locationMessage.includes('成功') ? 'text-green-400' : 'text-red-400'}`}>
                      {locationMessage}
                    </p>
                  )}
                  {form.photoData && (
                    <div className="mt-2 rounded-xl overflow-hidden">
                      <img src={form.photoData} alt="预览" className="w-full h-32 object-cover rounded-xl" />
                    </div>
                  )}
                  {form.coordinates && (
                    <p className="text-xs text-rose-gold mt-2">
                      📍 {form.coordinates.lat.toFixed(4)}, {form.coordinates.lng.toFixed(4)}
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-xs text-star-white/50 mb-2">选择表情</label>
                  <div className="flex flex-wrap gap-2">
                    {emojiOptions.map((emoji) => (
                      <button
                        key={emoji}
                        type="button"
                        onClick={() => setForm({ ...form, emoji })}
                        className={`w-10 h-10 rounded-xl text-xl flex items-center justify-center transition-all ${
                          form.emoji === emoji
                            ? 'bg-gradient-to-br from-rose-gold/30 to-rose-pink/30 border border-rose-gold/50 scale-110'
                            : 'bg-white/5 border border-white/10 hover:bg-white/10'
                        }`}
                      >
                        {emoji}
                      </button>
                    ))}
                  </div>
                </div>

                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  type="submit"
                  className="w-full btn-primary mt-2"
                >
                  保存星光 ✨
                </motion.button>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
