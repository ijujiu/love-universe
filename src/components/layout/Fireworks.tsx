import { useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  color: string;
  size: number;
  life: number;
  maxLife: number;
  type: 'circle' | 'heart' | 'star';
}

export default function Fireworks({ active }: { active: boolean }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const particlesRef = useRef<Particle[]>([]);
  const animationRef = useRef<number>();

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    resize();
    window.addEventListener('resize', resize);

    const colors = ['#ff6b9d', '#e8b4b8', '#64ffda', '#b794f6', '#ffd93d', '#ff9ff3', '#54a0ff'];

    const createFirework = (x?: number, y?: number) => {
      const startX = x ?? Math.random() * canvas.width * 0.6 + canvas.width * 0.2;
      const startY = y ?? Math.random() * canvas.height * 0.4 + canvas.height * 0.1;
      const types: ('circle' | 'heart' | 'star')[] = ['circle', 'circle', 'circle', 'heart', 'star'];
      const type = types[Math.floor(Math.random() * types.length)];
      const color = colors[Math.floor(Math.random() * colors.length)];
      const particleCount = type === 'heart' ? 80 : 60;

      for (let i = 0; i < particleCount; i++) {
        let angle, speed;
        if (type === 'circle') {
          angle = (Math.PI * 2 / particleCount) * i;
          speed = Math.random() * 4 + 3;
        } else if (type === 'heart') {
          const t = (Math.PI * 2 / particleCount) * i;
          const hx = 16 * Math.pow(Math.sin(t), 3);
          const hy = -(13 * Math.cos(t) - 5 * Math.cos(2 * t) - 2 * Math.cos(3 * t) - Math.cos(4 * t));
          angle = Math.atan2(hy, hx);
          speed = Math.sqrt(hx * hx + hy * hy) * 0.2 + Math.random() * 2;
        } else {
          angle = (Math.PI * 2 / particleCount) * i;
          speed = (i % 5 === 0 ? 6 : Math.random() * 3 + 2);
        }

        particlesRef.current.push({
          x: startX,
          y: startY,
          vx: Math.cos(angle) * speed,
          vy: Math.sin(angle) * speed,
          color,
          size: Math.random() * 3 + 2,
          life: 1,
          maxLife: Math.random() * 0.5 + 0.8,
          type,
        });
      }
    };

    if (active) {
      for (let i = 0; i < 3; i++) {
        setTimeout(() => createFirework(), i * 400);
      }
      const interval = setInterval(() => createFirework(), 600);
      setTimeout(() => clearInterval(interval), 4000);
    }

    const animate = () => {
      ctx.fillStyle = 'rgba(15, 12, 41, 0.1)';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      particlesRef.current = particlesRef.current.filter((p) => {
        p.x += p.vx;
        p.y += p.vy;
        p.vy += 0.06;
        p.vx *= 0.99;
        p.vy *= 0.99;
        p.life -= 0.012;

        if (p.life <= 0) return false;

        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size * p.life, 0, Math.PI * 2);
        ctx.fillStyle = p.color;
        ctx.globalAlpha = p.life;
        ctx.fill();

        const gradient = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, p.size * 4 * p.life);
        gradient.addColorStop(0, p.color + '80');
        gradient.addColorStop(1, p.color + '00');
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size * 4 * p.life, 0, Math.PI * 2);
        ctx.fillStyle = gradient;
        ctx.fill();
        ctx.globalAlpha = 1;

        return true;
      });

      animationRef.current = requestAnimationFrame(animate);
    };

    animationRef.current = requestAnimationFrame(animate);

    return () => {
      window.removeEventListener('resize', resize);
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
      particlesRef.current = [];
    };
  }, [active]);

  return (
    <AnimatePresence>
      {active && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 pointer-events-none"
        >
          <canvas ref={canvasRef} className="w-full h-full" />
          <div className="absolute inset-0 flex items-center justify-center">
            <motion.div
              initial={{ scale: 0, rotate: -180 }}
              animate={{ scale: 1, rotate: 0 }}
              transition={{ type: 'spring', duration: 1, bounce: 0.5 }}
              className="text-center"
            >
              <div className="text-8xl mb-4">🎉</div>
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="text-3xl font-display text-gradient-rose glow-rose"
              >
                愿望达成！
              </motion.div>
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.6 }}
                className="text-star-white/70 mt-2 text-lg"
              >
                又一个共同的回忆被点亮 ✨
              </motion.div>
            </motion.div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
