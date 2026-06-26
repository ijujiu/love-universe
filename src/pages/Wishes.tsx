import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, X, Calendar, Check, Target } from 'lucide-react';
import { useAppStore } from '../store/useAppStore';
import { formatDate } from '../utils/date';

const iconOptions = ['🎯','✈️','🏠','💍','🎂','🌅','🎁','💝','🌸','⭐','🎬','🍜','🏔️','🎵','📚','🚗'];

const cv = { hidden: { opacity: 0 }, visible: { opacity: 1, transition: { staggerChildren: 0.08, delayChildren: 0.1 } } };
const iv = { hidden: { opacity: 0, y: 20 }, visible: { opacity: 1, y: 0, transition: { type: 'spring', stiffness: 260, damping: 24 } } };
const mv = { hidden: { opacity: 0, scale: 0.92, y: 20 }, visible: { opacity: 1, scale: 1, y: 0, transition: { type: 'spring', stiffness: 300, damping: 28 } }, exit: { opacity: 0, scale: 0.92, y: 20 } };
const ov = { hidden: { opacity: 0 }, visible: { opacity: 1 }, exit: { opacity: 0 } };

export default function Wishes() {
  const { couple, wishes, addWish, checkInWish, currentPartner } = useAppStore();
  const [modalOpen, setModalOpen] = useState(false);
  const [form, setForm] = useState({ title: '', description: '', target: 10, icon: '🎯', deadline: '' });
  const active = wishes.filter(w => !w.completed);
  const done = wishes.filter(w => w.completed);

  const submit = () => {
    if (!form.title.trim()) return;
    addWish({ title: form.title, description: form.description, target: form.target, icon: form.icon, deadline: form.deadline || undefined, progressA: 0, progressB: 0 });
    setForm({ title: '', description: '', target: 10, icon: '🎯', deadline: '' });
    setModalOpen(false);
  };
  const pct = (a: number, b: number, t: number) => Math.min(((a + b) / (t * 2)) * 100, 100);
  const pBar = (p: number, t: number) => Math.min((p / t) * 50, 50);
  const isMyRoleA = (couple?.myRole ?? 'A') === 'A';
  const myAvatar = isMyRoleA ? couple?.partnerA.avatar : (couple?.partnerB?.avatar ?? '🌙');
  const partnerAvatar = isMyRoleA ? (couple?.partnerB?.avatar ?? '🌟') : couple?.partnerA.avatar;

  if (!couple) {
    return <div className="flex items-center justify-center h-full text-star-white/50">还未配对，快去邀请TA吧～</div>;
  }

  return (
    <motion.div className="h-full overflow-y-auto overflow-x-hidden scrollbar-hide pb-24"
      variants={cv} initial="hidden" animate="visible">
      <div className="px-5 pt-6 space-y-5">
        <motion.div variants={iv} className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-display text-gradient-rose">共同许愿池</h1>
            <p className="text-sm text-star-white/50 mt-1">一起点亮每一个愿望</p>
          </div>
          <motion.button whileHover={{ scale: 1.1, rotate: 90 }} whileTap={{ scale: 0.9 }}
            onClick={() => setModalOpen(true)}
            className="w-12 h-12 rounded-full bg-gradient-to-r from-rose-gold to-rose-pink flex items-center justify-center shadow-lg shadow-rose-pink/30 glow-rose"
            style={{ minWidth: 44, minHeight: 44 }}>
            <Plus size={24} className="text-white" />
          </motion.button>
        </motion.div>

        {active.length > 0 && (
          <motion.div variants={iv} className="space-y-4">
            <h2 className="text-sm font-medium text-star-white/70 flex items-center gap-1.5"><Target size={16}/>进行中</h2>
            <div className="space-y-3">
              {active.map(w => {
                const today = new Date().toISOString().slice(0,10);
                const mine = isMyRoleA ? w.progressA : w.progressB;
                const partnerProgress = isMyRoleA ? w.progressB : w.progressA;
                const aChecked = w.checkIns.some(c => c.partner === 'A' && c.time.startsWith(today));
                const bChecked = w.checkIns.some(c => c.partner === 'B' && c.time.startsWith(today));
                const myChecked = isMyRoleA ? aChecked : bChecked;
                const pChecked = isMyRoleA ? bChecked : aChecked;
                const aPct = pBar(w.progressA, w.target);
                const bPct = pBar(w.progressB, w.target);
                return (
                  <motion.div key={w.id} variants={iv} whileHover={{ scale: 1.01 }} className="glass-card p-4">
                    <div className="flex items-start gap-3">
                      <div className="text-3xl flex-shrink-0">{w.icon}</div>
                      <div className="flex-1 min-w-0">
                        <h3 className="font-medium text-star-white/90 truncate">{w.title}</h3>
                        {w.description && <p className="text-xs text-star-white/50 mt-0.5 line-clamp-2">{w.description}</p>}
                        <div className="mt-3">
                          <div className="h-3 rounded-full bg-white/5 overflow-hidden flex">
                            <motion.div className="h-full bg-gradient-to-r from-rose-gold to-rose-light rounded-l-full"
                              initial={{ width:0 }} animate={{ width: `${aPct}%` }} transition={{ duration:0.6, ease:'easeOut' }}/>
                            <motion.div className="h-full bg-gradient-to-r from-rose-pink/80 to-rose-pink rounded-r-full"
                              initial={{ width:0 }} animate={{ width: `${bPct}%` }} transition={{ duration:0.6, ease:'easeOut', delay:0.1 }}/>
                          </div>
                          <div className="flex items-center justify-between mt-1.5">
                            <span className="text-xs text-star-white/40 font-number">{w.progressA+w.progressB}/{w.target*2}</span>
                            <span className="text-xs text-gradient-rose font-number font-bold">{Math.round(pct(w.progressA,w.progressB,w.target))}%</span>
                          </div>
                        </div>
                        <div className="flex items-center gap-2 mt-3">
                          {w.deadline && <div className="flex items-center gap-1 text-xs text-star-white/40"><Calendar size={12}/><span>{formatDate(w.deadline,'MM/dd')}</span></div>}
                          <div className="flex-1"/>
                          <motion.button whileHover={{ scale: myChecked ? 1 : 1.1 }} whileTap={{ scale: 0.9 }}
                            onClick={() => !myChecked && checkInWish(w.id, isMyRoleA ? 'A' : 'B')}
                            disabled={myChecked}
                            className={`w-9 h-9 rounded-full flex items-center justify-center text-lg transition-all ${myChecked ? 'bg-rose-gold/30 ring-2 ring-rose-gold/50' : 'bg-white/10 hover:bg-rose-gold/20'}`}
                            style={{ minWidth: 36, minHeight: 36 }}>
                            {myChecked ? <Check size={16} className="text-rose-gold"/> : myAvatar}
                          </motion.button>
                          <motion.button whileHover={{ scale: pChecked ? 1 : 1.1 }} whileTap={{ scale: 0.9 }}
                            onClick={() => !pChecked && checkInWish(w.id, isMyRoleA ? 'B' : 'A')}
                            disabled={pChecked}
                            className={`w-9 h-9 rounded-full flex items-center justify-center text-lg transition-all ${pChecked ? 'bg-rose-pink/30 ring-2 ring-rose-pink/50' : 'bg-white/10 hover:bg-rose-pink/20'}`}
                            style={{ minWidth: 36, minHeight: 36 }}>
                            {pChecked ? <Check size={16} className="text-rose-pink"/> : partnerAvatar}
                          </motion.button>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </motion.div>
        )}

        {done.length > 0 && (
          <motion.div variants={iv} className="space-y-4 pb-4">
            <h2 className="text-sm font-medium text-star-white/70 flex items-center gap-1.5"><Check size={16} className="text-star-mint"/>已达成 ({done.length})</h2>
            <div className="space-y-3">
              {done.map(w => (
                <motion.div key={w.id} variants={iv} className="glass-card p-4 relative overflow-hidden"
                  style={{ boxShadow: '0 0 30px rgba(100,255,218,0.15), inset 0 0 20px rgba(100,255,218,0.05)', borderColor: 'rgba(100,255,218,0.3)' }}
                  animate={{ boxShadow: ['0 0 20px rgba(100,255,218,0.1)','0 0 40px rgba(100,255,218,0.2)','0 0 20px rgba(100,255,218,0.1)'] }}
                  transition={{ duration:3, repeat:Infinity, ease:'easeInOut' }}>
                  <div className="absolute top-2 right-2 text-2xl">{w.badge}</div>
                  <div className="flex items-start gap-3">
                    <div className="text-3xl flex-shrink-0">{w.icon}</div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-medium text-star-white/90 line-through decoration-star-mint/50">{w.title}</h3>
                      {w.description && <p className="text-xs text-star-white/40 mt-0.5 line-clamp-1">{w.description}</p>}
                      <div className="mt-2 h-2 rounded-full bg-star-mint/10 overflow-hidden">
                        <motion.div className="h-full bg-gradient-to-r from-star-mint to-star-purple rounded-full"
                          initial={{ width:0 }} animate={{ width:'100%' }} transition={{ duration:0.8,ease:'easeOut' }}/>
                      </div>
                      {w.completedAt && <p className="text-xs text-star-mint/70 mt-2 flex items-center gap-1"><Check size={12}/>完成于 {formatDate(w.completedAt,'yyyy年MM月dd日')}</p>}
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.div>
        )}

        {wishes.length === 0 && (
          <motion.div variants={iv} className="glass-card p-8 text-center">
            <div className="text-5xl mb-3">💫</div>
            <p className="text-star-white/60 text-sm">还没有愿望呢</p>
            <p className="text-star-white/40 text-xs mt-1">点击右上角 + 号，一起许下第一个愿望吧</p>
          </motion.div>
        )}
      </div>

      <AnimatePresence>
        {modalOpen && (
          <>
            <motion.div variants={ov} initial="hidden" animate="visible" exit="exit"
              className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40" onClick={() => setModalOpen(false)}/>
            <motion.div variants={mv} initial="hidden" animate="visible" exit="exit"
              className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-50 w-[calc(100%-2.5rem)] max-w-md max-h-[85vh] flex flex-col"
              style={{ paddingBottom:'env(safe-area-inset-bottom)' }}>
              <div className="glass-card-strong flex flex-col max-h-[85vh] overflow-hidden">
                <div className="flex items-center justify-between p-5 pb-3 flex-shrink-0">
                  <h2 className="text-lg font-display text-gradient-rose">许下新愿望</h2>
                  <button onClick={() => setModalOpen(false)}
                    className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center hover:bg-white/20 transition-colors flex-shrink-0"
                    style={{ minWidth:32, minHeight:32 }}>
                    <X size={18} className="text-star-white/70"/>
                  </button>
                </div>
                <div className="flex-1 overflow-y-auto px-5 pb-5 space-y-4 overscroll-contain" style={{ WebkitOverflowScrolling:'touch' }}>
                  <div>
                    <label className="text-xs text-star-white/50 mb-1.5 block">愿望标题</label>
                    <input type="text" value={form.title} onChange={e => setForm({...form,title:e.target.value})}
                      placeholder="比如：一起去看海"
                      className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-star-white placeholder:text-star-white/30 focus:outline-none focus:border-rose-gold/50 focus:ring-1 focus:ring-rose-gold/30"/>
                  </div>
                  <div>
                    <label className="text-xs text-star-white/50 mb-1.5 block">描述（可选）</label>
                    <textarea value={form.description} onChange={e => setForm({...form,description:e.target.value})}
                      placeholder="写下你们对这个愿望的期待..." rows={2}
                      className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-star-white placeholder:text-star-white/30 focus:outline-none focus:border-rose-gold/50 focus:ring-1 focus:ring-rose-gold/30 resize-none"/>
                  </div>
                  <div>
                    <label className="text-xs text-star-white/50 mb-1.5 block">目标打卡次数（每人）</label>
                    <div className="flex flex-wrap gap-2">
                      {[5,10,20,30,50,100].map(n => (
                        <motion.button key={n} whileHover={{ scale:1.05 }} whileTap={{ scale:0.95 }}
                          onClick={() => setForm({...form,target:n})}
                          className="px-4 py-2 rounded-lg text-sm font-number transition-all flex-shrink-0"
                          style={{ minHeight:40,
                            background: form.target===n ? 'linear-gradient(to right,#e8b4a0,#e8909b)' : 'rgba(255,255,255,0.05)',
                            color: form.target===n ? '#fff' : 'rgba(255,255,255,0.7)',
                            boxShadow: form.target===n ? '0 4px 15px rgba(232,144,155,0.25)' : 'none'
                          }}>{n}</motion.button>
                      ))}
                    </div>
                  </div>
                  <div>
                    <label className="text-xs text-star-white/50 mb-1.5 block">选择图标</label>
                    <div className="grid grid-cols-8 gap-2">
                      {iconOptions.map(ic => (
                        <motion.button key={ic} whileHover={{ scale:1.2 }} whileTap={{ scale:0.9 }}
                          onClick={() => setForm({...form,icon:ic})}
                          className={`w-10 h-10 rounded-xl flex items-center justify-center text-xl transition-all ${form.icon===ic ? 'bg-rose-gold/20 ring-2 ring-rose-gold/50' : 'bg-white/5 hover:bg-white/10'}`}
                          style={{ minWidth:40, minHeight:40 }}>{ic}</motion.button>
                      ))}
                    </div>
                  </div>
                  <div>
                    <label className="text-xs text-star-white/50 mb-1.5 block">截止日期（可选）</label>
                    <input type="date" value={form.deadline} onChange={e => setForm({...form,deadline:e.target.value})}
                      className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-star-white focus:outline-none focus:border-rose-gold/50 focus:ring-1 focus:ring-rose-gold/30"/>
                  </div>
                  <motion.button whileHover={{ scale:1.02 }} whileTap={{ scale:0.98 }}
                    onClick={submit} disabled={!form.title.trim()}
                    className="w-full py-3.5 rounded-xl bg-gradient-to-r from-rose-gold to-rose-pink text-white font-medium shadow-lg shadow-rose-pink/20 disabled:opacity-50 transition-all"
                    style={{ minHeight:48 }}>
                    点亮愿望 ✨
                  </motion.button>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
