import { useState } from 'react';
import { motion } from 'framer-motion';
import { ArrowLeft, Heart, RotateCcw, Bell, Volume2, Vibrate, Shield, Info, Sparkles, Trash2, Download, User, Calendar, FileText, ChevronRight, Bot } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAppStore } from '../store/useAppStore';
import { isAIEnabled } from '../utils/deepseek';

function ToggleSwitch({ enabled, onToggle }: { enabled: boolean; onToggle: () => void }) {
  return (
    <button
      onClick={onToggle}
      className={`w-12 h-7 rounded-full p-1 transition-all ${
        enabled ? 'bg-gradient-to-r from-rose-gold to-rose-pink' : 'bg-white/20'
      }`}
    >
      <motion.div
        animate={{ x: enabled ? 20 : 0 }}
        transition={{ type: 'spring', stiffness: 500, damping: 30 }}
        className="w-5 h-5 rounded-full bg-white shadow-md"
      />
    </button>
  );
}

function SettingRow({ 
  icon: Icon, 
  label, 
  sublabel, 
  right,
  onClick,
  danger = false,
}: { 
  icon: any; 
  label: string; 
  sublabel?: string; 
  right?: React.ReactNode;
  onClick?: () => void;
  danger?: boolean;
}) {
  return (
    <button
      onClick={onClick}
      className={`w-full flex items-center gap-3 p-3 rounded-xl transition-colors ${
        onClick ? 'hover:bg-white/10 cursor-pointer' : 'cursor-default'
      } ${danger ? 'text-red-400' : ''}`}
    >
      <Icon size={20} className={danger ? 'text-red-400' : 'text-rose-gold flex-shrink-0'} />
      <div className="flex-1 text-left">
        <div className={`text-sm ${danger ? '' : 'text-star-white'}`}>{label}</div>
        {sublabel && <div className="text-xs text-star-white/50 mt-0.5">{sublabel}</div>}
      </div>
      {right || (onClick && <ChevronRight size={18} className="text-star-white/40" />)}
    </button>
  );
}

const avatarOptions = ['🌟', '🌙', '🐱', '🐰', '🦊', '🐻', '🌸', '🍓', '☀️', '⭐', '🌈', '💫', '🦋', '🍀', '🎀'];

export default function Settings() {
  const navigate = useNavigate();
  const {
    couple,
    resetPair,
    settings,
    updateSettings,
    capsules,
    milestones,
    wishes,
    moodHistory,
    weeklyReports,
    updateCouple,
  } = useAppStore();
  const [showResetConfirm, setShowResetConfirm] = useState(false);
  const [showAvatarPicker, setShowAvatarPicker] = useState<'A' | 'B' | null>(null);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [tempDate, setTempDate] = useState('');

  const handleReset = () => {
    resetPair();
    navigate('/');
  };

  const handleExportData = () => {
    const data = {
      couple,
      milestones,
      capsules,
      wishes,
      moodHistory,
      weeklyReports,
      exportDate: new Date().toISOString(),
    };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `双栖宇宙-数据备份-${new Date().toLocaleDateString('zh-CN')}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleAvatarSelect = (avatar: string) => {
    if (!couple || !showAvatarPicker) return;
    if (showAvatarPicker === 'A') {
      updateCouple({ partnerA: { ...couple.partnerA, avatar } });
    } else {
      updateCouple({ partnerB: { ...couple.partnerB, avatar } });
    }
    setShowAvatarPicker(null);
  };

  const handleDateSave = () => {
    if (!tempDate || !couple) return;
    updateCouple({ startDate: tempDate });
    setShowDatePicker(false);
  };

  const container = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: { staggerChildren: 0.06 }
    }
  };

  const item = {
    hidden: { opacity: 0, y: 15 },
    show: { opacity: 1, y: 0 }
  };

  const totalMediaCount = capsules.reduce((acc, c) => acc + c.media.length, 0);
  const totalCheckIns = wishes.reduce((acc, w) => acc + w.checkIns.length, 0);
  const completedWishes = wishes.filter(w => w.completed).length;
  const unlockedCapsules = capsules.filter(c => c.isUnlocked).length;

  return (
    <div className="h-full overflow-y-auto scrollbar-hide pb-28">
      <div className="max-w-2xl mx-auto px-4 py-6">
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          className="flex items-center gap-4 mb-6"
        >
          <button
            onClick={() => navigate(-1)}
            className="p-2 rounded-full glass-card hover:bg-white/10 transition-colors"
          >
            <ArrowLeft size={24} className="text-star-white" />
          </button>
          <div>
            <h1 className="text-2xl font-display text-gradient-rose">设置</h1>
            <p className="text-star-white/60 text-sm">管理我们的小宇宙</p>
          </div>
        </motion.div>

        <motion.div variants={container} initial="hidden" animate="show" className="space-y-4">
          {couple && (
            <motion.div variants={item} className="glass-card p-5">
              <div className="text-center mb-4">
                <div className="flex items-center justify-center gap-6 mb-4">
                  <button
                    onClick={() => setShowAvatarPicker('A')}
                    className="relative group"
                  >
                    <div className="text-5xl transition-transform group-hover:scale-110">{couple.partnerA.avatar || '🌟'}</div>
                    <div className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-rose-gold flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                      <span className="text-[10px]">✏️</span>
                    </div>
                  </button>
                  <motion.div
                    animate={{ scale: [1, 1.2, 1] }}
                    transition={{ duration: 1.5, repeat: Infinity }}
                  >
                    <Heart className="text-rose-pink fill-rose-pink heart-beat" size={28} />
                  </motion.div>
                  <button
                    onClick={() => setShowAvatarPicker('B')}
                    className="relative group"
                  >
                    <div className="text-5xl transition-transform group-hover:scale-110">{couple.partnerB.avatar || '🌙'}</div>
                    <div className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-rose-pink flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                      <span className="text-[10px]">✏️</span>
                    </div>
                  </button>
                </div>
                <div className="flex items-center justify-center gap-2 text-lg font-display">
                  <span className="text-rose-gold">{couple.partnerA.name}</span>
                  <span className="text-star-white/40">&</span>
                  <span className="text-rose-pink">{couple.partnerB.name}</span>
                </div>
              </div>

              <div className="border-t border-white/10 pt-4 space-y-1">
                <SettingRow
                  icon={Calendar}
                  label="在一起的日子"
                  sublabel={new Date(couple.startDate).toLocaleDateString('zh-CN')}
                  onClick={() => {
                    setTempDate(couple.startDate);
                    setShowDatePicker(true);
                  }}
                />
                <div className="px-3 py-2 flex items-center justify-between text-sm">
                  <span className="text-star-white/50">配对码</span>
                  <span className="font-number text-rose-gold">{couple.pairCode}</span>
                </div>
                <div className="px-3 py-2 flex items-center justify-between text-xs text-star-white/40">
                  <span>创建时间</span>
                  <span>{new Date(couple.createdAt).toLocaleString('zh-CN')}</span>
                </div>
              </div>
            </motion.div>
          )}

          <motion.div variants={item} className="glass-card p-4">
            <div className="flex items-center gap-2 text-star-mint mb-3 px-3">
              <Sparkles size={18} />
              <span className="text-sm font-medium">数据统计</span>
            </div>
            <div className="grid grid-cols-4 gap-2 text-center">
              <div className="p-2 rounded-xl bg-white/5">
                <div className="text-xl font-number text-gradient-rose">{milestones.length}</div>
                <div className="text-[10px] text-star-white/50">里程碑</div>
              </div>
              <div className="p-2 rounded-xl bg-white/5">
                <div className="text-xl font-number text-gradient-rose">{capsules.length}</div>
                <div className="text-[10px] text-star-white/50">胶囊</div>
              </div>
              <div className="p-2 rounded-xl bg-white/5">
                <div className="text-xl font-number text-gradient-mint">{wishes.length}</div>
                <div className="text-[10px] text-star-white/50">愿望</div>
              </div>
              <div className="p-2 rounded-xl bg-white/5">
                <div className="text-xl font-number text-gradient-mint">{moodHistory.length}</div>
                <div className="text-[10px] text-star-white/50">心情</div>
              </div>
            </div>
            <div className="grid grid-cols-3 gap-2 text-center mt-2">
              <div className="p-2 rounded-xl bg-white/5">
                <div className="text-lg font-number text-rose-gold">{completedWishes}</div>
                <div className="text-[10px] text-star-white/50">已完成愿望</div>
              </div>
              <div className="p-2 rounded-xl bg-white/5">
                <div className="text-lg font-number text-star-purple">{totalCheckIns}</div>
                <div className="text-[10px] text-star-white/50">总打卡</div>
              </div>
              <div className="p-2 rounded-xl bg-white/5">
                <div className="text-lg font-number text-star-mint">{unlockedCapsules}/{capsules.length}</div>
                <div className="text-[10px] text-star-white/50">已解锁胶囊</div>
              </div>
            </div>
          </motion.div>

          <motion.div variants={item} className="glass-card overflow-hidden">
            <div className="p-4 border-b border-white/10 flex items-center gap-3">
              <Bell size={20} className="text-rose-gold" />
              <span className="font-medium">通知与感应</span>
            </div>
            <div className="divide-y divide-white/5">
              <div className="px-4 py-3 flex items-center justify-between">
                <div>
                  <div className="text-sm">近距离感应</div>
                  <div className="text-xs text-star-white/50">TA靠近时自动提示</div>
                </div>
                <ToggleSwitch
                  enabled={settings.proximityEnabled}
                  onToggle={() => updateSettings({ proximityEnabled: !settings.proximityEnabled })}
                />
              </div>
            </div>
          </motion.div>

          <motion.div variants={item} className="glass-card overflow-hidden">
            <div className="p-4 border-b border-white/10 flex items-center gap-3">
              <Volume2 size={20} className="text-star-mint" />
              <span className="font-medium">音效与振动</span>
            </div>
            <div className="divide-y divide-white/5">
              <div className="px-4 py-3 flex items-center justify-between">
                <div>
                  <div className="text-sm flex items-center gap-2">
                    <Volume2 size={14} /> 音效
                  </div>
                  <div className="text-xs text-star-white/50">操作反馈、成就庆祝等</div>
                </div>
                <ToggleSwitch
                  enabled={settings.soundEnabled}
                  onToggle={() => updateSettings({ soundEnabled: !settings.soundEnabled })}
                />
              </div>
              <div className="px-4 py-3 flex items-center justify-between">
                <div>
                  <div className="text-sm flex items-center gap-2">
                    <Vibrate size={14} /> 振动
                  </div>
                  <div className="text-xs text-star-white/50">重要时刻振动反馈</div>
                </div>
                <ToggleSwitch
                  enabled={settings.vibrationEnabled}
                  onToggle={() => updateSettings({ vibrationEnabled: !settings.vibrationEnabled })}
                />
              </div>
            </div>
          </motion.div>

          <motion.div variants={item} className="glass-card overflow-hidden">
            <div className="p-4 border-b border-white/10 flex items-center gap-3">
              <Bot size={20} className="text-star-purple" />
              <span className="font-medium">AI 助手</span>
            </div>
            <div className="divide-y divide-white/5">
              <div className="px-4 py-3 flex items-center justify-between">
                <div>
                  <div className="text-sm">自动生成情感周报</div>
                  <div className="text-xs text-star-white/50">每周自动分析你们的感情状态</div>
                </div>
                <ToggleSwitch
                  enabled={settings.autoGenerateReport}
                  onToggle={() => updateSettings({ autoGenerateReport: !settings.autoGenerateReport })}
                />
              </div>
              <div className="px-4 py-3">
                <div className="flex items-center gap-2 text-xs">
                  <span className={`w-2 h-2 rounded-full ${isAIEnabled() ? 'bg-star-mint' : 'bg-red-400'}`} />
                  <span className={isAIEnabled() ? 'text-star-mint' : 'text-red-400'}>
                    DeepSeek AI {isAIEnabled() ? '已连接' : '未配置'}
                  </span>
                </div>
              </div>
            </div>
          </motion.div>

          <motion.div variants={item} className="glass-card overflow-hidden">
            <div className="p-4 border-b border-white/10 flex items-center gap-3">
              <Shield size={20} className="text-star-purple" />
              <span className="font-medium">隐私与数据</span>
            </div>
            <div className="divide-y divide-white/5">
              <div className="p-4">
                <div className="flex items-center gap-3 p-3 rounded-xl bg-star-mint/10 border border-star-mint/20">
                  <Shield size={22} className="text-star-mint flex-shrink-0" />
                  <div>
                    <div className="text-sm font-medium text-star-mint">端到端加密已启用</div>
                    <div className="text-xs text-star-white/50">AES-256加密存储于本地设备</div>
                  </div>
                </div>
              </div>
              <SettingRow
                icon={Download}
                label="导出所有数据"
                sublabel={`${totalMediaCount + milestones.length + capsules.length + wishes.length + moodHistory.length} 条记录，备份到本地`}
                onClick={handleExportData}
              />
            </div>
          </motion.div>

          <motion.div variants={item} className="glass-card overflow-hidden">
            <div className="p-4 border-b border-white/10 flex items-center gap-3">
              <Info size={20} className="text-star-white/60" />
              <span className="font-medium">关于</span>
            </div>
            <div className="p-5 text-center">
              <div className="text-5xl mb-3">💑</div>
              <div className="font-display text-2xl text-gradient-rose mb-1">双栖宇宙</div>
              <div className="text-star-white/50 text-sm">版本 1.1.0</div>
              <div className="text-star-white/40 text-xs mt-2 mb-3">
                专属于两个人的数字小家
              </div>
              <div className="flex items-center justify-center gap-2 text-[10px] text-star-white/30">
                <Sparkles size={12} />
                <span>DeepSeek AI 驱动情感分析</span>
              </div>
              <div className="mt-4 pt-4 border-t border-white/5 text-[10px] text-star-white/25 leading-relaxed">
                所有数据仅存储在您的设备本地<br/>
                不会上传至任何服务器<br/>
                你们的秘密，只属于你们 💕
              </div>
            </div>
          </motion.div>

          <motion.div variants={item} className="pt-2">
            {!showResetConfirm ? (
              <button
                onClick={() => setShowResetConfirm(true)}
                className="w-full glass-card p-4 flex items-center justify-center gap-2 hover:bg-red-500/20 transition-colors text-red-400"
              >
                <Trash2 size={18} />
                <span>重置所有数据</span>
              </button>
            ) : (
              <div className="glass-card p-4 border border-red-500/30 bg-red-500/5">
                <p className="text-red-300 text-sm text-center mb-4">
                  ⚠️ 确定要重置吗？这将永久清除所有回忆，且无法恢复...
                </p>
                <div className="flex gap-3">
                  <button
                    onClick={() => setShowResetConfirm(false)}
                    className="flex-1 py-2.5 rounded-xl bg-white/10 text-star-white/70 text-sm hover:bg-white/15 transition-colors"
                  >
                    我再想想
                  </button>
                  <button
                    onClick={handleReset}
                    className="flex-1 py-2.5 rounded-xl bg-red-500/80 text-white text-sm hover:bg-red-500 transition-colors"
                  >
                    确认重置
                  </button>
                </div>
              </div>
            )}
          </motion.div>
        </motion.div>
      </div>

      {showAvatarPicker && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-sm"
          onClick={() => setShowAvatarPicker(null)}
        >
          <motion.div
            initial={{ y: 100, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 100, opacity: 0 }}
            className="glass-card-strong p-6 w-full max-w-sm m-4"
            onClick={e => e.stopPropagation()}
          >
            <h3 className="text-center font-display text-lg mb-4 text-gradient-rose">选择头像</h3>
            <div className="grid grid-cols-5 gap-3">
              {avatarOptions.map(avatar => (
                <button
                  key={avatar}
                  onClick={() => handleAvatarSelect(avatar)}
                  className="text-3xl p-2 rounded-xl hover:bg-white/15 transition-all hover:scale-110 active:scale-95"
                >
                  {avatar}
                </button>
              ))}
            </div>
            <button
              onClick={() => setShowAvatarPicker(null)}
              className="w-full mt-4 py-2.5 rounded-xl bg-white/10 text-sm text-star-white/70"
            >
              取消
            </button>
          </motion.div>
        </motion.div>
      )}

      {showDatePicker && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-sm"
          onClick={() => setShowDatePicker(false)}
        >
          <motion.div
            initial={{ y: 100, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 100, opacity: 0 }}
            className="glass-card-strong p-6 w-full max-w-sm m-4"
            onClick={e => e.stopPropagation()}
          >
            <h3 className="text-center font-display text-lg mb-4 text-gradient-rose">在一起的日子</h3>
            <input
              type="date"
              value={tempDate}
              onChange={e => setTempDate(e.target.value)}
              className="w-full p-3 rounded-xl bg-white/10 border border-white/20 text-star-white mb-4 focus:outline-none focus:border-rose-gold"
            />
            <div className="flex gap-3">
              <button
                onClick={() => setShowDatePicker(false)}
                className="flex-1 py-2.5 rounded-xl bg-white/10 text-sm text-star-white/70"
              >
                取消
              </button>
              <button
                onClick={handleDateSave}
                className="flex-1 py-2.5 rounded-xl bg-gradient-to-r from-rose-gold to-rose-pink text-white text-sm"
              >
                保存
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </div>
  );
}
