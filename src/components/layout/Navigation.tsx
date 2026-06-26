import { motion } from 'framer-motion';
import { Home, Clock, Lock, Target, Cloud, Bluetooth, FileText, Settings } from 'lucide-react';
import { useLocation, useNavigate } from 'react-router-dom';

const navItems = [
  { path: '/home', icon: Home, label: '首页' },
  { path: '/timeline', icon: Clock, label: '纪念' },
  { path: '/capsules', icon: Lock, label: '胶囊' },
  { path: '/wishes', icon: Target, label: '许愿' },
  { path: '/mood', icon: Cloud, label: '情绪' },
  { path: '/proximity', icon: Bluetooth, label: '感应' },
  { path: '/weekly', icon: FileText, label: '周报' },
  { path: '/settings', icon: Settings, label: '设置' },
];

export default function Navigation() {
  const location = useLocation();
  const navigate = useNavigate();

  return (
    <motion.nav
      initial={{ y: 100, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ type: 'spring', stiffness: 260, damping: 20 }}
      className="fixed bottom-0 left-0 right-0 z-50 px-3"
      style={{ paddingBottom: 'calc(env(safe-area-inset-bottom, 0px) + 12px)' }}
    >
      <div className="glass-card-strong px-1 py-2 flex justify-around items-center max-w-2xl mx-auto">
        {navItems.map((item) => {
          const isActive = location.pathname === item.path;
          const Icon = item.icon;

          return (
            <motion.button
              key={item.path}
              onClick={() => navigate(item.path)}
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              className="relative flex flex-col items-center justify-center p-1.5 rounded-xl"
            >
              {isActive && (
                <motion.div
                  layoutId="nav-glow"
                  className="absolute inset-0 rounded-xl bg-gradient-to-r from-rose-gold/30 to-rose-pink/30"
                  transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                  style={{
                    boxShadow: '0 0 20px rgba(255, 107, 157, 0.4), 0 0 40px rgba(232, 180, 184, 0.2)',
                  }}
                />
              )}
              <motion.div
                animate={isActive ? { scale: 1.2 } : { scale: 1 }}
                transition={{ type: 'spring', stiffness: 400, damping: 17 }}
              >
                <Icon
                  size={20}
                  className={isActive ? 'text-rose-pink' : 'text-star-white/60'}
                  style={isActive ? { filter: 'drop-shadow(0 0 8px rgba(255, 107, 157, 0.6))' } : {}}
                />
              </motion.div>
              <motion.span
                className={`text-[9px] mt-0.5 font-medium ${isActive ? 'text-rose-pink' : 'text-star-white/50'}`}
                animate={isActive ? { opacity: 1, y: 0 } : { opacity: 0.7, y: 0 }}
              >
                {item.label}
              </motion.span>
            </motion.button>
          );
        })}
      </div>
    </motion.nav>
  );
}
