import { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Radar, Volume2, VolumeX, Vibrate, VibrateOff, Bluetooth, BluetoothOff, Smartphone } from 'lucide-react';
import { useAppStore } from '../store/useAppStore';
import type { Couple } from '../types';
import { BluetoothScanner, type ScannedDevice } from '../utils/bluetooth';

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.15, delayChildren: 0.1 },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { type: 'spring', stiffness: 260, damping: 24 },
  },
};

type ScanStatus = 'idle' | 'scanning' | 'detected' | 'not-supported';

function RippleRing({ delay, detected }: { delay: number; detected: boolean }) {
  return (
    <motion.div
      className="absolute inset-0 rounded-full border-2"
      style={{
        borderColor: detected ? 'rgba(255,107,157,0.5)' : 'rgba(255,255,255,0.15)',
        boxShadow: detected ? '0 0 20px rgba(255,107,157,0.3)' : 'none',
      }}
      animate={{
        scale: detected ? [0.8, 2.5] : [0.8, 2],
        opacity: detected ? [0.7, 0] : [0.5, 0],
      }}
      transition={{
        duration: detected ? 1.2 : 2.5,
        delay: delay,
        repeat: Infinity,
        ease: 'easeOut',
      }}
    />
  );
}

function LockScreenDemo({ detected, couple }: { detected: boolean; couple: Couple | null }) {
  const [time, setTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const pad = (n: number) => n.toString().padStart(2, '0');

  return (
    <motion.div
      layout
      className="relative mx-auto w-56 rounded-3xl overflow-hidden border-2 border-white/20 shadow-2xl"
      style={{
        background: 'linear-gradient(160deg, #1a1642 0%, #302b63 50%, #24243e 100%)',
        aspectRatio: '9/19',
      }}
    >
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-20 h-5 bg-black rounded-b-2xl z-20" />

      <div className="pt-10 px-4 flex flex-col items-center">
        <div className="text-white/70 text-xs font-medium">
          {time.toLocaleDateString('zh-CN', { month: 'long', day: 'numeric', weekday: 'long' })}
        </div>
        <div className="text-white text-5xl font-number mt-1" style={{ fontWeight: 300 }}>
          {pad(time.getHours())}:{pad(time.getMinutes())}
        </div>
      </div>

      <AnimatePresence>
        {detected && (
          <motion.div
            initial={{ opacity: 0, y: 40, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 40, scale: 0.9 }}
            transition={{ type: 'spring', stiffness: 300, damping: 25, delay: 0.3 }}
            className="absolute bottom-16 left-3 right-3 rounded-2xl p-3 backdrop-blur-xl"
            style={{
              background: 'rgba(255,255,255,0.15)',
              border: '1px solid rgba(255,255,255,0.2)',
            }}
          >
            <div className="flex items-start gap-2.5">
              <div className="flex -space-x-2 mt-0.5">
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-rose-gold/40 to-rose-pink/40 flex items-center justify-center text-base border-2 border-white/30 relative z-10">
                  {couple?.partnerA.avatar ?? '🌟'}
                </div>
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-star-purple/40 to-cosmos-500/40 flex items-center justify-center text-base border-2 border-white/30">
                  {couple?.partnerB.avatar ?? '🌙'}
                </div>
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <span className="text-white/80 text-[10px] font-medium">双栖宇宙</span>
                  <span className="text-white/50 text-[9px]">刚刚</span>
                </div>
                <div className="text-white text-xs font-semibold mt-0.5">TA在附近哦 💗</div>
                <div className="text-white/70 text-[10px] mt-0.5 leading-tight">
                  你们的距离很近，快去打个招呼吧～
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="absolute bottom-3 left-1/2 -translate-x-1/2 w-28 h-1 bg-white/30 rounded-full" />
    </motion.div>
  );
}

export default function Proximity() {
  const { proximityDetected, setProximityDetected, couple } = useAppStore();
  const [sensorOn, setSensorOn] = useState(true);
  const [soundOn, setSoundOn] = useState(true);
  const [isVibrating, setIsVibrating] = useState(false);
  const [scanStatus, setScanStatus] = useState<ScanStatus>('idle');
  const [detectedDevice, setDetectedDevice] = useState<ScannedDevice | null>(null);
  const [bluetoothSupported, setBluetoothSupported] = useState(false);
  const audioCtxRef = useRef<AudioContext | null>(null);
  const scannerRef = useRef<BluetoothScanner | null>(null);

  useEffect(() => {
    setBluetoothSupported(BluetoothScanner.isSupported());
    if (!BluetoothScanner.isSupported()) {
      setScanStatus('not-supported');
    }
    return () => {
      if (scannerRef.current) {
        scannerRef.current.destroy();
      }
    };
  }, []);

  const playTone = useCallback(() => {
    if (!soundOn) return;
    try {
      if (!audioCtxRef.current) {
        audioCtxRef.current = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();
      }
      const ctx = audioCtxRef.current;
      if (ctx.state === 'suspended') ctx.resume();

      const oscillator = ctx.createOscillator();
      const gainNode = ctx.createGain();

      oscillator.connect(gainNode);
      gainNode.connect(ctx.destination);

      oscillator.frequency.setValueAtTime(523.25, ctx.currentTime);
      oscillator.frequency.setValueAtTime(659.25, ctx.currentTime + 0.15);
      oscillator.frequency.setValueAtTime(783.99, ctx.currentTime + 0.3);

      gainNode.gain.setValueAtTime(0.3, ctx.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.8);

      oscillator.start(ctx.currentTime);
      oscillator.stop(ctx.currentTime + 0.8);
    } catch {
      // Audio not supported
    }
  }, [soundOn]);

  const triggerVibrate = useCallback(() => {
    if ('vibrate' in navigator) {
      navigator.vibrate([100, 50, 100, 50, 200]);
    }
    setIsVibrating(true);
    setTimeout(() => setIsVibrating(false), 1000);
  }, []);

  const triggerProximity = useCallback(() => {
    if (!sensorOn) return;
    setProximityDetected(true);
    triggerVibrate();
    playTone();

    setTimeout(() => {
      setProximityDetected(false);
      setDetectedDevice(null);
      setScanStatus('idle');
    }, 5000);
  }, [sensorOn, setProximityDetected, triggerVibrate, playTone]);

  const handleDemo = useCallback(() => {
    triggerProximity();
  }, [triggerProximity]);

  const handleStartScan = useCallback(async () => {
    if (!sensorOn || !bluetoothSupported) return;

    setScanStatus('scanning');
    setDetectedDevice(null);

    if (!scannerRef.current) {
      scannerRef.current = new BluetoothScanner();
    }

    try {
      await scannerRef.current.startScan((device) => {
        setDetectedDevice(device);
        setScanStatus('detected');
        triggerProximity();
      }, { timeoutMs: 30000 });
    } catch (err) {
      console.error('蓝牙扫描失败:', err);
      setScanStatus('idle');
    }
  }, [sensorOn, bluetoothSupported, triggerProximity]);

  const handleStopScan = useCallback(() => {
    if (scannerRef.current) {
      scannerRef.current.stopScan();
    }
    setScanStatus('idle');
  }, []);

  useEffect(() => {
    return () => {
      setProximityDetected(false);
      if (audioCtxRef.current) {
        audioCtxRef.current.close().catch(() => {});
      }
      if (scannerRef.current) {
        scannerRef.current.destroy();
      }
    };
  }, [setProximityDetected]);

  const getStatusText = () => {
    if (scanStatus === 'not-supported') return '浏览器不支持蓝牙';
    if (scanStatus === 'scanning') return '扫描中...';
    if (proximityDetected) return '已检测到设备';
    return '等待扫描';
  };

  return (
    <motion.div
      className="h-full overflow-y-auto overflow-x-hidden scrollbar-hide pb-24"
      variants={containerVariants}
      initial="hidden"
      animate="visible"
    >
      <div className="px-5 pt-6">
        <motion.div variants={itemVariants} className="mb-6 text-center">
          <h1 className="text-2xl font-display text-gradient-rose">近距离感应</h1>
          <p className="text-star-white/50 text-sm mt-1">当我们靠近，宇宙会回应</p>
        </motion.div>

        <motion.div variants={itemVariants} className="flex justify-center gap-4 mb-6">
          <button
            onClick={() => setSensorOn(!sensorOn)}
            className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm transition-all ${
              sensorOn
                ? 'bg-gradient-to-r from-star-mint/20 to-star-purple/20 border border-star-mint/40 text-star-mint'
                : 'bg-white/5 border border-white/10 text-star-white/50'
            }`}
          >
            <Radar size={16} className={sensorOn ? 'animate-pulse' : ''} />
            感应{sensorOn ? '开' : '关'}
          </button>
          <button
            onClick={() => setSoundOn(!soundOn)}
            className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm transition-all ${
              soundOn
                ? 'bg-gradient-to-r from-rose-gold/20 to-rose-pink/20 border border-rose-gold/40 text-rose-gold'
                : 'bg-white/5 border border-white/10 text-star-white/50'
            }`}
          >
            {soundOn ? <Volume2 size={16} /> : <VolumeX size={16} />}
            音效{soundOn ? '开' : '关'}
          </button>
        </motion.div>

        <motion.div variants={itemVariants} className="mb-6">
          <div className={`glass-card p-4 flex items-center gap-3 ${
            bluetoothSupported ? 'border-star-mint/30' : 'border-amber-500/30'
          }`}>
            {bluetoothSupported ? (
              <Bluetooth size={20} className="text-star-mint" />
            ) : (
              <BluetoothOff size={20} className="text-amber-500" />
            )}
            <div className="flex-1">
              <div className="text-sm text-star-white/80">
                {bluetoothSupported ? '蓝牙已就绪' : '蓝牙不可用'}
              </div>
              <div className="text-xs text-star-white/40">
                {bluetoothSupported
                  ? '使用Chrome/Edge浏览器，在HTTPS环境下可扫描附近蓝牙设备'
                  : '请使用Chrome或Edge浏览器，并在HTTPS或localhost环境下访问'}
              </div>
            </div>
          </div>
        </motion.div>

        <motion.div variants={itemVariants} className="relative flex items-center justify-center mb-6">
          <div className="relative w-64 h-64 flex items-center justify-center">
            <div className="absolute inset-0 rounded-full" style={{
              background: proximityDetected
                ? 'radial-gradient(circle, rgba(255,107,157,0.15) 0%, rgba(232,180,184,0.05) 50%, transparent 70%)'
                : 'radial-gradient(circle, rgba(183,148,246,0.1) 0%, transparent 60%)',
            }} />

            {sensorOn && (
              <>
                <RippleRing delay={0} detected={proximityDetected} />
                <RippleRing delay={proximityDetected ? 0.3 : 0.6} detected={proximityDetected} />
                <RippleRing delay={proximityDetected ? 0.6 : 1.2} detected={proximityDetected} />
                <RippleRing delay={proximityDetected ? 0.9 : 1.8} detected={proximityDetected} />
              </>
            )}

            <motion.div
              className={`relative z-10 w-24 h-24 rounded-full flex items-center justify-center ${
                proximityDetected ? 'heart-beat' : ''
              }`}
              animate={{
                scale: proximityDetected ? [1, 1.15, 1] : 1,
              }}
              transition={{
                duration: proximityDetected ? 0.6 : 2,
                repeat: proximityDetected ? Infinity : Infinity,
                ease: 'easeInOut',
              }}
              style={{
                background: proximityDetected
                  ? 'radial-gradient(circle, rgba(255,107,157,0.4) 0%, rgba(232,180,184,0.2) 100%)'
                  : 'radial-gradient(circle, rgba(255,255,255,0.1) 0%, rgba(255,255,255,0.03) 100%)',
                boxShadow: proximityDetected
                  ? '0 0 40px rgba(255,107,157,0.5), inset 0 0 20px rgba(255,182,193,0.2)'
                  : '0 0 20px rgba(183,148,246,0.2)',
              }}
            >
              <span className="text-4xl" style={{ filter: proximityDetected ? 'drop-shadow(0 0 10px rgba(255,107,157,0.8))' : 'none' }}>
                {proximityDetected ? '💗' : scanStatus === 'scanning' ? '📡' : '💜'}
              </span>
            </motion.div>
          </div>
        </motion.div>

        <motion.div variants={itemVariants} className="text-center mb-6">
          <AnimatePresence mode="wait">
            {proximityDetected ? (
              <motion.div
                key="detected"
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.8 }}
                transition={{ type: 'spring', stiffness: 300, damping: 20 }}
              >
                <div className="text-3xl font-display text-gradient-rose mb-1">💫 TA在附近！</div>
                {detectedDevice && (
                  <div className="flex items-center justify-center gap-2 text-star-mint text-sm mt-2">
                    <Smartphone size={14} />
                    <span>检测到设备：{detectedDevice.name}</span>
                  </div>
                )}
                <div className="flex items-center justify-center gap-2 text-star-mint text-sm mt-2">
                  {isVibrating && (
                    <motion.span
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      className="flex items-center gap-1"
                    >
                      <Vibrate size={14} className="animate-pulse" />
                      振动提示中
                    </motion.span>
                  )}
                  {!isVibrating && (
                    <span className="flex items-center gap-1">
                      <VibrateOff size={14} />
                      快去寻找彼此吧
                    </span>
                  )}
                </div>
              </motion.div>
            ) : (
              <motion.div
                key="searching"
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.8 }}
                className="text-2xl font-display text-star-white/70"
              >
                {sensorOn ? (
                  <span className="flex items-center justify-center gap-2">
                    <Radar size={24} className={scanStatus === 'scanning' ? 'text-star-purple animate-spin' : 'text-star-white/40'} style={{ animationDuration: '3s' }} />
                    {getStatusText()}
                  </span>
                ) : (
                  '感应已关闭'
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>

        <motion.div variants={itemVariants} className="flex flex-col items-center gap-3 mb-8">
          {bluetoothSupported && sensorOn && !proximityDetected && (
            scanStatus === 'scanning' ? (
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={handleStopScan}
                className="px-8 py-3 rounded-full font-medium bg-white/10 text-star-white/70 border border-white/20 transition-all"
              >
                ⏹️ 停止扫描
              </motion.button>
            ) : (
              <motion.button
                whileHover={{ scale: sensorOn ? 1.05 : 1 }}
                whileTap={{ scale: sensorOn ? 0.95 : 1 }}
                onClick={handleStartScan}
                disabled={!sensorOn}
                className={`px-8 py-3 rounded-full font-medium transition-all ${
                  sensorOn
                    ? 'bg-gradient-to-r from-star-purple to-rose-pink text-white shadow-lg shadow-rose-pink/20 hover:shadow-rose-pink/40'
                    : 'bg-white/10 text-star-white/30 cursor-not-allowed'
                }`}
              >
                <span className="flex items-center gap-2">
                  <Bluetooth size={18} />
                  扫描蓝牙设备
                </span>
              </motion.button>
            )
          )}

          {(!bluetoothSupported || !sensorOn) && (
            <motion.button
              whileHover={{ scale: sensorOn ? 1.05 : 1 }}
              whileTap={{ scale: sensorOn ? 0.95 : 1 }}
              onClick={handleDemo}
              disabled={!sensorOn}
              className={`px-8 py-3 rounded-full font-medium transition-all ${
                sensorOn
                  ? 'bg-gradient-to-r from-star-mint/20 to-star-purple/20 border border-star-mint/30 text-star-mint'
                  : 'bg-white/10 text-star-white/30 cursor-not-allowed'
              }`}
            >
              📱 演示靠近效果
            </motion.button>
          )}

          {bluetoothSupported && sensorOn && !proximityDetected && scanStatus === 'idle' && (
            <p className="text-xs text-star-white/40 text-center max-w-xs">
              点击扫描按钮，选择对方的设备来触发靠近提示
            </p>
          )}
        </motion.div>

        <motion.div variants={itemVariants}>
          <div className="text-center text-star-white/40 text-xs mb-3 flex items-center justify-center gap-2">
            <span>🔒</span> 锁屏通知预览
          </div>
          <LockScreenDemo detected={proximityDetected} couple={couple} />
        </motion.div>
      </div>
    </motion.div>
  );
}
