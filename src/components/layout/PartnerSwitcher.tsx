import { motion } from 'framer-motion';
import { useAppStore } from '../../store/useAppStore';

export default function PartnerSwitcher() {
  const { couple, currentPartner, setCurrentPartner } = useAppStore();
  if (!couple) return null;
  const isRoleA = couple.myRole === 'A';
  const me = isRoleA ? couple.partnerA : (couple.partnerB || couple.partnerA);
  const partner = isRoleA ? (couple.partnerB || null) : couple.partnerA;
  const myKey: 'A' | 'B' = couple.myRole;
  const partnerKey: 'A' | 'B' = isRoleA ? 'B' : 'A';
  const isMe = currentPartner === myKey;

  return (
    <div className="flex items-center justify-center gap-3 mb-4">
      <div className="glass-card p-1 flex gap-1">
        <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
          onClick={() => setCurrentPartner(myKey)}
          className={`relative px-4 py-2 rounded-xl flex items-center gap-2 transition-all ${isMe ? 'bg-gradient-to-r from-rose-gold/30 to-rose-pink/30 text-white' : 'text-star-white/60 hover:text-star-white/80'}`}
          style={{ minHeight: 44 }}>
          {isMe && (
            <motion.div layoutId="p-indicator" className="absolute inset-0 rounded-xl border border-rose-gold/50"
              style={{ boxShadow: '0 0 15px rgba(232,180,184,0.3)' }}
              transition={{ type: 'spring', stiffness: 300, damping: 30 }}/>
          )}
          <span className="text-xl relative z-10">{me.avatar}</span>
          <span className="text-sm font-medium relative z-10">{me.name}（我）</span>
        </motion.button>
        <div className="flex items-center text-rose-pink/50 px-1"><span className="text-lg">💕</span></div>
        <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
          onClick={() => setCurrentPartner(partnerKey)}
          className={`relative px-4 py-2 rounded-xl flex items-center gap-2 transition-all ${!isMe ? 'bg-gradient-to-r from-star-purple/30 to-cosmos-500/30 text-white' : 'text-star-white/60 hover:text-star-white/80'}`}
          style={{ minHeight: 44 }}>
          {!isMe && (
            <motion.div layoutId="p-indicator" className="absolute inset-0 rounded-xl border border-star-purple/50"
              style={{ boxShadow: '0 0 15px rgba(183,148,246,0.3)' }}
              transition={{ type: 'spring', stiffness: 300, damping: 30 }}/>
          )}
          <span className="text-xl relative z-10">{partner?.avatar || '🌙'}</span>
          <span className="text-sm font-medium relative z-10">{partner?.name || 'TA'}</span>
        </motion.button>
      </div>
    </div>
  );
}
