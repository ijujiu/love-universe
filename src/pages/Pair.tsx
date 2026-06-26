import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { Heart, Copy, RefreshCw, Calendar, User, Rocket, Stars, ChevronLeft, Users, UserPlus, Wifi, WifiOff, Loader2, Sparkles } from 'lucide-react';
import { useAppStore } from '../store/useAppStore';
import { syncService } from '../utils/sync';

const avatarEmojis = ['🌟', '🌙', '🌸', '🦋', '🐱', '🐰', '🦊', '🐻', '🌈', '☀️', '🍀', '🌺', '💫', '✨', '🎀', '💖'];

type Mode = 'select' | 'create' | 'join' | 'offline';

export default function Pair() {
  const navigate = useNavigate();
  const { createUniverse, joinUniverse, quickStart, syncStatus, syncError, couple } = useAppStore();
  const [showStartup, setShowStartup] = useState(true);
  const [mode, setMode] = useState<Mode>('select');

  const [myName, setMyName] = useState('');
  const [myAvatar, setMyAvatar] = useState('🌟');
  const [startDate, setStartDate] = useState(new Date().toISOString().split('T')[0]);
  const [generatedCode, setGeneratedCode] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const [joinCode, setJoinCode] = useState('');
  const [joinName, setJoinName] = useState('');
  const [joinAvatar, setJoinAvatar] = useState('🌸');
  const [joinError, setJoinError] = useState('');

  const [offlineMyName, setOfflineMyName] = useState('');
  const [offlineMyAvatar, setOfflineMyAvatar] = useState('🌟');
  const [offlinePartnerName, setOfflinePartnerName] = useState('');
  const [offlinePartnerAvatar, setOfflinePartnerAvatar] = useState('🌙');
  const [offlineStartDate, setOfflineStartDate] = useState(new Date().toISOString().split('T')[0]);

  useEffect(() => { const t = setTimeout(() => setShowStartup(false), 2200); return () => clearTimeout(t); }, []);
  useEffect(() => { if (couple && couple.connectionStatus === 'connected') navigate('/dashboard'); }, [couple, navigate]);
  useEffect(() => { if (syncError && mode === 'join') setJoinError(syncError); }, [syncError, mode]);

  const handleCreate = async () => {
    if (!myName.trim()) return;
    setSubmitting(true);
    try { const code = await createUniverse({ name: myName.trim(), avatar: myAvatar }, startDate); setGeneratedCode(code); }
    catch (e) { console.error(e); } finally { setSubmitting(false); }
  };
  const handleJoin = async () => {
    if (!joinName.trim() || !/^\d{6}$/.test(joinCode)) { setJoinError('请输入6位数字配对码和你的昵称'); return; }
    setJoinError(''); setSubmitting(true);
    try { await joinUniverse(joinCode, { name: joinName.trim(), avatar: joinAvatar }); }
    catch (e: any) { setJoinError(e?.message || '连接失败'); } finally { setSubmitting(false); }
  };
  const handleQuickStart = () => {
    if (!offlineMyName.trim() || !offlinePartnerName.trim()) return;
    quickStart({ name: offlineMyName.trim(), avatar: offlineMyAvatar }, { name: offlinePartnerName.trim(), avatar: offlinePartnerAvatar }, offlineStartDate);
    navigate('/dashboard');
  };
  const copyCode = () => { if (generatedCode && navigator.clipboard) navigator.clipboard.writeText(generatedCode).catch(() => {}); };
  const regenCode = async () => { const code = syncService.generatePairCode(); setGeneratedCode(code); };

  const cv = { hidden: { opacity: 0 }, visible: { opacity: 1, transition: { staggerChildren: 0.08, delayChildren: 0.1 } } };
  const iv = { hidden: { opacity: 0, y: 16 }, visible: { opacity: 1, y: 0, transition: { type: 'spring', stiffness: 260, damping: 24 } } };

  const AvatarPicker = ({ selected, onSelect }: { selected: string; onSelect: (e: string) => void }) => (
    <div className="grid grid-cols-8 gap-2">
      {avatarEmojis.map(e => (
        <button key={e} onClick={() => onSelect(e)}
          className={`aspect-square rounded-xl flex items-center justify-center text-xl transition-all ${selected === e ? 'bg-rose-gold/20 ring-2 ring-rose-gold/50' : 'bg-white/5'}`}>{e}</button>
      ))}
    </div>
  );

  return (
    <div className="h-full overflow-y-auto overflow-x-hidden scrollbar-hide relative z-10 px-5 pt-10 pb-8"
         style={{ paddingBottom: 'calc(env(safe-area-inset-bottom) + 2rem)' }}>
      <AnimatePresence mode="wait">
        {showStartup ? (
          <motion.div key="startup" className="h-full flex flex-col items-center justify-center -mt-10"
            initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 1.1 }}>
            <motion.div animate={{ y: [0,-10,0], rotate: [0,-2,2,-2,0] }} transition={{ duration:2, repeat:Infinity, ease:'easeInOut' }}
              className="text-7xl mb-6">💞</motion.div>
            <h1 className="text-4xl font-display text-gradient-rose mb-2">双栖宇宙</h1>
            <p className="text-star-white/50 text-sm">两个人的专属星空</p>
          </motion.div>
        ) : mode === 'select' ? (
          <motion.div key="select" variants={cv} initial="hidden" animate="visible" className="max-w-sm mx-auto space-y-6">
            <motion.div variants={iv} className="text-center mb-4">
              <div className="text-5xl mb-3">💫</div>
              <h1 className="text-3xl font-display text-gradient-rose">双栖宇宙</h1>
              <p className="text-sm text-star-white/50 mt-2">让两颗星在同一片宇宙中相遇</p>
            </motion.div>
            <motion.button variants={iv} whileHover={{ scale:1.02 }} whileTap={{ scale:0.98 }}
              onClick={() => setMode('create')}
              className="w-full p-5 rounded-2xl bg-gradient-to-r from-rose-gold/20 to-rose-pink/20 border border-rose-gold/30 text-left">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-gradient-to-r from-rose-gold to-rose-pink flex items-center justify-center flex-shrink-0">
                  <Rocket size={20} className="text-white" />
                </div>
                <div>
                  <h3 className="text-star-white font-medium">创建我们的宇宙</h3>
                  <p className="text-xs text-star-white/50">生成配对码，邀请TA加入</p>
                </div>
              </div>
            </motion.button>
            <motion.button variants={iv} whileHover={{ scale:1.02 }} whileTap={{ scale:0.98 }}
              onClick={() => setMode('join')}
              className="w-full p-5 rounded-2xl glass-card text-left">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-gradient-to-r from-star-purple to-rose-pink flex items-center justify-center flex-shrink-0">
                  <UserPlus size={20} className="text-white" />
                </div>
                <div>
                  <h3 className="text-star-white font-medium">加入TA的宇宙</h3>
                  <p className="text-xs text-star-white/50">输入配对码，进入TA的星空</p>
                </div>
              </div>
            </motion.button>
            <motion.button variants={iv} whileHover={{ scale:1.02 }} whileTap={{ scale:0.98 }}
              onClick={() => setMode('offline')}
              className="w-full p-4 rounded-2xl bg-white/5 border border-white/10 text-left">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center flex-shrink-0">
                  <Users size={20} className="text-star-white/70" />
                </div>
                <div>
                  <h3 className="text-star-white/80 text-sm font-medium">快速体验（离线）</h3>
                  <p className="text-xs text-star-white/40">填写双方信息，不上云同步</p>
                </div>
              </div>
            </motion.button>
          </motion.div>
        ) : mode === 'offline' ? (
          <motion.div key="offline" initial={{ opacity:0,x:30 }} animate={{ opacity:1,x:0 }} className="max-w-sm mx-auto">
            <button onClick={() => setMode('select')} className="flex items-center gap-1 text-star-white/50 hover:text-star-white text-sm mb-6">
              <ChevronLeft size={18}/> 返回
            </button>
            <div className="space-y-5">
              <h2 className="text-2xl font-display text-gradient-rose">快速体验</h2>
              <p className="text-sm text-star-white/50 -mt-3">填写双方信息，本地单机体验（不联网同步）</p>
              <div className="glass-card p-4 space-y-4">
                <div className="flex items-center gap-2 text-sm text-rose-gold"><Sparkles size={14}/> 我的信息</div>
                <div>
                  <label className="text-xs text-star-white/50 mb-2 block flex items-center gap-1"><User size={12}/> 昵称</label>
                  <input value={offlineMyName} onChange={e => setOfflineMyName(e.target.value)} placeholder="比如：小明"
                    className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-star-white placeholder:text-star-white/30 focus:outline-none focus:border-rose-gold/50"/>
                </div>
                <div>
                  <label className="text-xs text-star-white/50 mb-2 block">头像</label>
                  <AvatarPicker selected={offlineMyAvatar} onSelect={setOfflineMyAvatar}/>
                </div>
              </div>
              <div className="glass-card p-4 space-y-4">
                <div className="flex items-center gap-2 text-sm text-rose-pink"><Heart size={14}/> TA的信息</div>
                <div>
                  <label className="text-xs text-star-white/50 mb-2 block flex items-center gap-1"><User size={12}/> TA的昵称</label>
                  <input value={offlinePartnerName} onChange={e => setOfflinePartnerName(e.target.value)} placeholder="比如：小红"
                    className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-star-white placeholder:text-star-white/30 focus:outline-none focus:border-rose-pink/50"/>
                </div>
                <div>
                  <label className="text-xs text-star-white/50 mb-2 block">TA的头像</label>
                  <AvatarPicker selected={offlinePartnerAvatar} onSelect={setOfflinePartnerAvatar}/>
                </div>
              </div>
              <div>
                <label className="text-xs text-star-white/50 mb-2 block flex items-center gap-1"><Calendar size={12}/> 在一起的日子</label>
                <input type="date" value={offlineStartDate} onChange={e => setOfflineStartDate(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-star-white focus:outline-none focus:border-rose-gold/50"/>
              </div>
              <motion.button whileHover={{ scale:1.02 }} whileTap={{ scale:0.98 }}
                onClick={handleQuickStart} disabled={!offlineMyName.trim() || !offlinePartnerName.trim()}
                className="w-full py-4 rounded-xl bg-gradient-to-r from-rose-gold to-rose-pink text-white font-medium shadow-lg shadow-rose-pink/20 disabled:opacity-50"
                style={{ minHeight: 50 }}>
                进入宇宙 ✨
              </motion.button>
            </div>
          </motion.div>
        ) : mode === 'create' ? (
          generatedCode ? (
            <motion.div key="waiting" initial={{ opacity:0, scale:0.95 }} animate={{ opacity:1, scale:1 }} className="max-w-sm mx-auto">
              <button onClick={() => { setMode('select'); setGeneratedCode(''); }}
                className="flex items-center gap-1 text-star-white/50 hover:text-star-white text-sm mb-6">
                <ChevronLeft size={18}/> 返回
              </button>
              <div className="glass-card-strong p-8 text-center">
                <div className="text-5xl mb-4">🌌</div>
                <h2 className="text-xl font-display text-gradient-rose mb-2">宇宙已创建</h2>
                <p className="text-sm text-star-white/50 mb-6">把配对码告诉TA，等TA加入</p>
                <motion.div className="text-5xl font-number tracking-[0.3em] text-gradient-rose font-bold mb-4 select-all"
                  animate={{ scale:[1,1.02,1] }} transition={{ duration:2, repeat:Infinity }}>
                  {generatedCode}
                </motion.div>
                <div className="flex items-center justify-center gap-3 mb-6">
                  <button onClick={copyCode}
                    className="flex items-center gap-1.5 px-4 py-2 rounded-full bg-white/10 text-star-white/80 text-sm"
                    style={{ minHeight:40 }}>
                    <Copy size={14}/> 复制
                  </button>
                  <button onClick={regenCode}
                    className="flex items-center gap-1.5 px-4 py-2 rounded-full bg-white/10 text-star-white/80 text-sm"
                    style={{ minHeight:40 }}>
                    <RefreshCw size={14}/> 重新生成
                  </button>
                </div>
                <div className="flex items-center justify-center gap-2 text-sm">
                  {syncStatus === 'waiting' ? (
                    <><Loader2 size={16} className="animate-spin text-star-white/40"/><span className="text-star-white/50">等待TA加入...</span></>
                  ) : syncStatus === 'connected' ? (
                    <><Wifi size={16} className="text-star-mint"/><span className="text-star-mint">已连接！</span></>
                  ) : syncStatus === 'error' ? (
                    <><WifiOff size={16} className="text-rose-pink"/><span className="text-rose-pink/80 text-xs">{syncError || '连接失败'}</span></>
                  ) : (
                    <><Loader2 size={16} className="animate-spin text-star-white/40"/><span className="text-star-white/50">连接中...</span></>
                  )}
                </div>
              </div>
            </motion.div>
          ) : (
            <motion.div key="create-form" initial={{ opacity:0,x:30 }} animate={{ opacity:1,x:0 }} className="max-w-sm mx-auto">
              <button onClick={() => setMode('select')} className="flex items-center gap-1 text-star-white/50 hover:text-star-white text-sm mb-6">
                <ChevronLeft size={18}/> 返回
              </button>
              <div className="space-y-5">
                <h2 className="text-2xl font-display text-gradient-rose">创建宇宙</h2>
                <p className="text-sm text-star-white/50 -mt-3">填写你自己的信息，对方由TA加入时填写</p>
                <div>
                  <label className="text-xs text-star-white/50 mb-2 block flex items-center gap-1"><User size={12}/> 你的昵称</label>
                  <input value={myName} onChange={e => setMyName(e.target.value)} placeholder="比如：小明"
                    className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-star-white placeholder:text-star-white/30 focus:outline-none focus:border-rose-gold/50"/>
                </div>
                <div>
                  <label className="text-xs text-star-white/50 mb-2 block">选择头像</label>
                  <AvatarPicker selected={myAvatar} onSelect={setMyAvatar}/>
                </div>
                <div>
                  <label className="text-xs text-star-white/50 mb-2 block flex items-center gap-1"><Calendar size={12}/> 在一起的日子</label>
                  <input type="date" value={startDate} onChange={e => setStartDate(e.target.value)}
                    className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-star-white focus:outline-none focus:border-rose-gold/50"/>
                </div>
                <motion.button whileHover={{ scale:1.02 }} whileTap={{ scale:0.98 }}
                  onClick={handleCreate} disabled={!myName.trim() || submitting}
                  className="w-full py-4 rounded-xl bg-gradient-to-r from-rose-gold to-rose-pink text-white font-medium shadow-lg shadow-rose-pink/20 disabled:opacity-50 flex items-center justify-center gap-2"
                  style={{ minHeight:50 }}>
                  {submitting ? <Loader2 size={18} className="animate-spin"/> : <Stars size={18}/>}
                  {submitting ? '创建中...' : '创建宇宙，生成配对码'}
                </motion.button>
              </div>
            </motion.div>
          )
        ) : mode === 'join' ? (
          <motion.div key="join-form" initial={{ opacity:0,x:30 }} animate={{ opacity:1,x:0 }} className="max-w-sm mx-auto">
            <button onClick={() => { setMode('select'); setJoinError(''); }}
              className="flex items-center gap-1 text-star-white/50 hover:text-star-white text-sm mb-6">
              <ChevronLeft size={18}/> 返回
            </button>
            <div className="space-y-5">
              <h2 className="text-2xl font-display text-gradient-rose">加入宇宙</h2>
              <p className="text-sm text-star-white/50 -mt-3">输入TA给你的6位配对码，填写你自己的信息</p>
              <div>
                <label className="text-xs text-star-white/50 mb-2 block">配对码</label>
                <input value={joinCode} onChange={e => setJoinCode(e.target.value.replace(/\D/g,'').slice(0,6))}
                  placeholder="6位数字" inputMode="numeric"
                  className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-star-white text-center text-2xl font-number tracking-[0.3em] placeholder:text-star-white/20 placeholder:text-lg placeholder:tracking-normal focus:outline-none focus:border-rose-pink/50"/>
              </div>
              <div>
                <label className="text-xs text-star-white/50 mb-2 block flex items-center gap-1"><User size={12}/> 你的昵称</label>
                <input value={joinName} onChange={e => setJoinName(e.target.value)} placeholder="比如：小红"
                  className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-star-white placeholder:text-star-white/30 focus:outline-none focus:border-rose-pink/50"/>
              </div>
              <div>
                <label className="text-xs text-star-white/50 mb-2 block">选择头像</label>
                <AvatarPicker selected={joinAvatar} onSelect={setJoinAvatar}/>
              </div>
              {joinError && <div className="text-sm text-rose-pink bg-rose-pink/10 border border-rose-pink/20 p-3 rounded-xl">{joinError}</div>}
              <motion.button whileHover={{ scale:1.02 }} whileTap={{ scale:0.98 }}
                onClick={handleJoin} disabled={!joinName.trim() || joinCode.length !== 6 || submitting}
                className="w-full py-4 rounded-xl bg-gradient-to-r from-star-purple to-rose-pink text-white font-medium shadow-lg shadow-rose-pink/20 disabled:opacity-50 flex items-center justify-center gap-2"
                style={{ minHeight:50 }}>
                {submitting ? <Loader2 size={18} className="animate-spin"/> : <Heart size={18}/>}
                {submitting ? '连接中...' : '加入宇宙'}
              </motion.button>
            </div>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </div>
  );
}
