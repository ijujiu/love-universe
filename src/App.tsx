import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { useEffect, Component, type ReactNode } from 'react';
import StarBackground from './components/layout/StarBackground';
import Navigation from './components/layout/Navigation';
import PartnerSwitcher from './components/layout/PartnerSwitcher';
import Fireworks from './components/layout/Fireworks';
import HugModal from './components/features/HugModal';
import Pair from './pages/Pair';
import Dashboard from './pages/Dashboard';
import Timeline from './pages/Timeline';
import Capsules from './pages/Capsules';
import CapsuleDetail from './pages/CapsuleDetail';
import Wishes from './pages/Wishes';
import Mood from './pages/Mood';
import Proximity from './pages/Proximity';
import Weekly from './pages/Weekly';
import Settings from './pages/Settings';
import { useAppStore } from './store/useAppStore';

const MIGRATION_KEY = 'love-universe-v3-migrated';

function runMigration() {
  try {
    if (typeof window === 'undefined' || typeof window.localStorage === 'undefined') return;
    if (window.localStorage.getItem(MIGRATION_KEY) === '3') return;
    try {
      const raw = window.localStorage.getItem('shuangqi-universe-storage');
      if (raw) {
        const parsed = JSON.parse(raw);
        const state = parsed?.state;
        if (state && state.couple && state.couple.pairCode) {
          if (String(state.couple.pairCode) !== '000000' && state.couple.connectionStatus !== 'offline') {
            window.localStorage.removeItem('shuangqi-universe-storage');
          }
        }
      }
    } catch {}
    window.localStorage.setItem(MIGRATION_KEY, '3');
  } catch {}
}

function ErrorFallback() {
  return (
    <div className="h-full w-full flex items-center justify-center bg-gradient-to-b from-[#0f0c29] via-[#302b63] to-[#24243e] text-white p-6 text-center">
      <div>
        <div className="text-6xl mb-4">💫</div>
        <p className="text-lg mb-2">宇宙加载中遇到了小问题</p>
        <button
          onClick={() => window.location.reload()}
          className="px-6 py-3 mt-3 rounded-full bg-gradient-to-r from-pink-500 to-purple-500 text-white"
          style={{ minHeight: 44 }}
        >
          重新加载
        </button>
      </div>
    </div>
  );
}

interface EBProps { children: ReactNode }
interface EBState { hasError: boolean }
class AppErrorBoundary extends Component<EBProps, EBState> {
  state: EBState = { hasError: false };
  static getDerivedStateFromError(): EBState { return { hasError: true }; }
  componentDidCatch(error: Error) { console.error('[App] error:', error); }
  render() {
    if (this.state.hasError) return <ErrorFallback />;
    return this.props.children;
  }
}

function PageTransition({ children }: { children: ReactNode }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20, scale: 0.98 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: -20, scale: 1.02 }}
      transition={{ duration: 0.4, ease: 'easeOut' }}
      className="h-full"
    >
      {children}
    </motion.div>
  );
}

function AppRoutes() {
  const location = useLocation();
  const { isPaired, showFireworks, initSync } = useAppStore();
  const isPairPage = location.pathname === '/';

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [location.pathname]);

  useEffect(() => {
    runMigration();
    initSync();
  }, []);

  return (
    <div className="h-full w-full relative">
      <StarBackground />

      <main className={`relative z-10 h-full ${isPairPage ? '' : 'pt-4 pb-2'}`}>
        {!isPairPage && isPaired && <PartnerSwitcher />}
        <AnimatePresence mode="wait">
          <Routes location={location} key={location.pathname}>
            <Route path="/" element={<PageTransition><Pair /></PageTransition>} />
            <Route path="/dashboard" element={
              <RequirePair><PageTransition><Dashboard /></PageTransition></RequirePair>
            } />
            <Route path="/timeline" element={
              <RequirePair><PageTransition><Timeline /></PageTransition></RequirePair>
            } />
            <Route path="/capsules" element={
              <RequirePair><PageTransition><Capsules /></PageTransition></RequirePair>
            } />
            <Route path="/capsule/:id" element={
              <RequirePair><PageTransition><CapsuleDetail /></PageTransition></RequirePair>
            } />
            <Route path="/wishes" element={
              <RequirePair><PageTransition><Wishes /></PageTransition></RequirePair>
            } />
            <Route path="/mood" element={
              <RequirePair><PageTransition><Mood /></PageTransition></RequirePair>
            } />
            <Route path="/proximity" element={
              <RequirePair><PageTransition><Proximity /></PageTransition></RequirePair>
            } />
            <Route path="/weekly" element={
              <RequirePair><PageTransition><Weekly /></PageTransition></RequirePair>
            } />
            <Route path="/settings" element={
              <RequirePair><PageTransition><Settings /></PageTransition></RequirePair>
            } />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </AnimatePresence>
      </main>

      {!isPairPage && isPaired && <Navigation />}
      <Fireworks active={showFireworks} />
      <HugModal />
    </div>
  );
}

function RequirePair({ children }: { children: ReactNode }) {
  const { isPaired } = useAppStore();
  if (!isPaired) return <Navigate to="/" replace />;
  return <>{children}</>;
}

export default function App() {
  const basename = import.meta.env.BASE_URL.replace(/\/$/, '');
  return (
    <AppErrorBoundary>
      <Router basename={basename}>
        <AppRoutes />
      </Router>
    </AppErrorBoundary>
  );
}
