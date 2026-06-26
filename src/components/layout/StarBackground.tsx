import { useEffect, useRef } from 'react';

interface Star {
  x: number;
  y: number;
  size: number;
  opacity: number;
  speed: number;
  twinkleSpeed: number;
  twinklePhase: number;
}

interface Meteor {
  x: number;
  y: number;
  length: number;
  speed: number;
  angle: number;
  opacity: number;
  active: boolean;
}

export default function StarBackground() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const mouseRef = useRef({ x: 0, y: 0 });
  const starsRef = useRef<Star[]>([]);
  const meteorsRef = useRef<Meteor[]>([]);
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

    const isMobile = 'ontouchstart' in window;
    const starCount = Math.min(
      isMobile ? 80 : 200,
      Math.floor((window.innerWidth * window.innerHeight) / (isMobile ? 15000 : 8000))
    );
    starsRef.current = Array.from({ length: starCount }, () => ({
      x: Math.random() * canvas.width,
      y: Math.random() * canvas.height,
      size: Math.random() * 2 + 0.5,
      opacity: Math.random() * 0.8 + 0.2,
      speed: Math.random() * 0.02 + 0.01,
      twinkleSpeed: Math.random() * 0.02 + 0.01,
      twinklePhase: Math.random() * Math.PI * 2,
    }));

    const createMeteor = (): Meteor => ({
      x: Math.random() * canvas.width * 1.5,
      y: Math.random() * canvas.height * 0.3 - 100,
      length: Math.random() * 80 + 40,
      speed: Math.random() * 8 + 6,
      angle: Math.PI / 4 + (Math.random() - 0.5) * 0.2,
      opacity: 1,
      active: true,
    });

    const handleMouseMove = (e: MouseEvent) => {
      if (isMobile) return;
      mouseRef.current = { x: e.clientX, y: e.clientY };
    };
    window.addEventListener('mousemove', handleMouseMove);

    let lastMeteor = 0;
    const meteorInterval = isMobile ? 8000 : 4000;
    const maxMeteors = isMobile ? 1 : 3;
    const meteorSpeedBase = isMobile ? 5 : 6;

    const animate = (time: number) => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      starsRef.current.forEach((star) => {
        star.twinklePhase += star.twinkleSpeed;
        const twinkle = (Math.sin(star.twinklePhase) + 1) / 2;
        const currentOpacity = star.opacity * (0.4 + twinkle * 0.6);

        const dx = mouseRef.current.x - star.x;
        const dy = mouseRef.current.y - star.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        let offsetX = 0, offsetY = 0;
        if (!isMobile && dist < 150) {
          const force = (150 - dist) / 150 * 2;
          offsetX = dx * force * 0.02;
          offsetY = dy * force * 0.02;
        }

        ctx.beginPath();
        ctx.arc(star.x - offsetX, star.y - offsetY, star.size, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(255, 255, 255, ${currentOpacity})`;
        ctx.fill();

        if (star.size > 1.5) {
          const gradient = ctx.createRadialGradient(
            star.x - offsetX, star.y - offsetY, 0,
            star.x - offsetX, star.y - offsetY, star.size * 3
          );
          gradient.addColorStop(0, `rgba(255, 230, 255, ${currentOpacity * 0.3})`);
          gradient.addColorStop(1, 'rgba(255, 230, 255, 0)');
          ctx.beginPath();
          ctx.arc(star.x - offsetX, star.y - offsetY, star.size * 3, 0, Math.PI * 2);
          ctx.fillStyle = gradient;
          ctx.fill();
        }
      });

      if (time - lastMeteor > meteorInterval + Math.random() * 3000) {
        if (meteorsRef.current.length < maxMeteors) {
          const m = createMeteor();
          m.speed = Math.random() * 8 + meteorSpeedBase;
          meteorsRef.current.push(m);
        }
        lastMeteor = time;
      }

      meteorsRef.current = meteorsRef.current.filter((meteor) => {
        if (!meteor.active) return false;
        
        meteor.x += Math.cos(meteor.angle) * meteor.speed;
        meteor.y += Math.sin(meteor.angle) * meteor.speed;
        
        if (meteor.x > canvas.width + 200 || meteor.y > canvas.height + 200) {
          return false;
        }

        const tailX = meteor.x - Math.cos(meteor.angle) * meteor.length;
        const tailY = meteor.y - Math.sin(meteor.angle) * meteor.length;
        
        const gradient = ctx.createLinearGradient(tailX, tailY, meteor.x, meteor.y);
        gradient.addColorStop(0, 'rgba(255, 255, 255, 0)');
        gradient.addColorStop(0.7, `rgba(255, 220, 255, ${meteor.opacity * 0.6})`);
        gradient.addColorStop(1, `rgba(255, 255, 255, ${meteor.opacity})`);
        
        ctx.beginPath();
        ctx.moveTo(tailX, tailY);
        ctx.lineTo(meteor.x, meteor.y);
        ctx.strokeStyle = gradient;
        ctx.lineWidth = 2;
        ctx.lineCap = 'round';
        ctx.stroke();

        return true;
      });

      animationRef.current = requestAnimationFrame(animate);
    };

    animationRef.current = requestAnimationFrame(animate);

    return () => {
      window.removeEventListener('resize', resize);
      window.removeEventListener('mousemove', handleMouseMove);
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 pointer-events-none z-0"
      style={{ background: 'transparent', transform: 'translateZ(0)', willChange: 'transform' }}
    />
  );
}
