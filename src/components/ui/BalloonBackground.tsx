'use client';

import { useEffect, useRef, useCallback, useState } from 'react';

// ===== TYPES =====
interface Balloon {
  x: number;
  y: number;
  radius: number;
  color: string;
  velocityX: number;
  velocityY: number;
  rotation: number;
  rotationSpeed: number;
  opacity: number;
  stringLength: number;
  metallic: boolean;
  popPhase: number;
}

interface Particle {
  x: number;
  y: number;
  radius: number;
  color: string;
  velocityX: number;
  velocityY: number;
  life: number;
  maxLife: number;
}

interface TouchPoint {
  x: number;
  y: number;
  time: number;
}

// ===== COLOR PALETTE (Mr Balloon Brand) =====
const BALLOON_COLORS = [
  // Metallic silvers
  { fill: '#C0C0C0', highlight: '#E8E8E8', shadow: '#999999', metallic: true }, // Silver
  { fill: '#848482', highlight: '#A8A8A6', shadow: '#5E5E5C', metallic: true }, // Gunmetal
  { fill: '#E5E4E2', highlight: '#FFFFFF', shadow: '#BDBDBD', metallic: true }, // Platinum
  // Warm accents
  { fill: '#FF6B6B', highlight: '#FF9999', shadow: '#CC3333', metallic: false }, // Coral
  { fill: '#FFD93D', highlight: '#FFEB8A', shadow: '#CCAD00', metallic: false }, // Gold
  { fill: '#6BCB77', highlight: '#9DE5A0', shadow: '#3D9949', metallic: false }, // Mint
  { fill: '#4D96FF', highlight: '#8AB4FF', shadow: '#1A66CC', metallic: false }, // Sky Blue
  { fill: '#FF6B9D', highlight: '#FF99BB', shadow: '#CC3366', metallic: false }, // Rose
  { fill: '#C77DFF', highlight: '#DDB8FF', shadow: '#9944CC', metallic: false }, // Lavender
];

export function BalloonBackground({
  className = '',
  balloonCount = 25,
  enableTouchBurst = true,
  enableFloat = true,
  style,
}: {
  className?: string;
  balloonCount?: number;
  enableTouchBurst?: boolean;
  enableFloat?: boolean;
  style?: React.CSSProperties;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationRef = useRef<number>();
  const balloonsRef = useRef<Balloon[]>([]);
  const particlesRef = useRef<Particle[]>([]);
  const touchHistoryRef = useRef<TouchPoint[]>([]);
  const [dimensions, setDimensions] = useState({ width: 0, height: 0 });
  const [reducedMotion, setReducedMotion] = useState(false);

  // ===== INITIALIZATION =====
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    // Check reduced motion preference
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    setReducedMotion(mediaQuery.matches);
    const handleChange = (e: MediaQueryListEvent) => setReducedMotion(e.matches);
    mediaQuery.addEventListener('change', handleChange);

    // Initialize balloons
    const initBalloons = () => {
      const { width, height } = dimensions;
      if (width === 0 || height === 0) return;

      balloonsRef.current = Array.from({ length: balloonCount }, () => createBalloon(width, height));
    };

    const resize = () => {
      const parent = canvas.parentElement;
      if (!parent) return;
      const rect = parent.getBoundingClientRect();
      const dpr = window.devicePixelRatio || 1;
      canvas.width = rect.width * dpr;
      canvas.height = rect.height * dpr;
      canvas.style.width = `${rect.width}px`;
      canvas.style.height = `${rect.height}px`;
      setDimensions({ width: rect.width, height: rect.height });
      const ctx = canvas.getContext('2d');
      if (ctx) ctx.scale(dpr, dpr);
      initBalloons();
    };

    window.addEventListener('resize', resize);
    resize();

    // Start animation loop
    const animate = () => {
      if (!reducedMotion) {
        updateBalloons();
        updateParticles();
        draw();
      }
      animationRef.current = requestAnimationFrame(animate);
    };
    animate();

    // Touch/Mouse handlers
    const handlePointerDown = (e: PointerEvent) => {
      if (!enableTouchBurst) return;
      const rect = canvas.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      triggerBurst(x, y);
      touchHistoryRef.current.push({ x, y, time: Date.now() });
      // Clean old touches
      touchHistoryRef.current = touchHistoryRef.current.filter((t) => Date.now() - t.time < 500);
    };

    canvas.addEventListener('pointerdown', handlePointerDown);

    return () => {
      window.removeEventListener('resize', resize);
      canvas.removeEventListener('pointerdown', handlePointerDown);
      mediaQuery.removeEventListener('change', handleChange);
      if (animationRef.current) cancelAnimationFrame(animationRef.current);
    };
  }, [balloonCount, enableTouchBurst, reducedMotion]);

  // ===== BALLOON CREATION =====
  const createBalloon = useCallback((width: number, height: number): Balloon => {
    const color = BALLOON_COLORS[Math.floor(Math.random() * BALLOON_COLORS.length)];
    const radius = 25 + Math.random() * 35; // 25-60px
    return {
      x: Math.random() * width,
      y: height + radius + Math.random() * height * 0.5,
      radius,
      color: color.fill,
      velocityX: (Math.random() - 0.5) * 0.3,
      velocityY: -0.15 - Math.random() * 0.25,
      rotation: Math.random() * Math.PI * 2,
      rotationSpeed: (Math.random() - 0.5) * 0.01,
      opacity: 0.6 + Math.random() * 0.3,
      stringLength: 40 + Math.random() * 60,
      metallic: color.metallic,
      popPhase: 0,
    };
  }, []);

  // ===== BURST EFFECT =====
  const triggerBurst = useCallback((x: number, y: number) => {
    const balloons = balloonsRef.current;
    const particles = particlesRef.current;

    balloons.forEach((balloon) => {
      const dx = balloon.x - x;
      const dy = balloon.y - y;
      const distance = Math.sqrt(dx * dx + dy * dy);
      if (distance < balloon.radius + 20) {
        // POP! Create particles
        const particleCount = 12 + Math.floor(Math.random() * 8);
        for (let i = 0; i < particleCount; i++) {
          const angle = (Math.PI * 2 * i) / particleCount + Math.random() * 0.5;
          const speed = 3 + Math.random() * 5;
          particles.push({
            x: balloon.x,
            y: balloon.y,
            radius: 3 + Math.random() * 4,
            color: balloon.color,
            velocityX: Math.cos(angle) * speed,
            velocityY: Math.sin(angle) * speed - 2,
            life: 1,
            maxLife: 0.8 + Math.random() * 0.6,
          });
        }
        // Reset balloon
        Object.assign(balloon, createBalloon(dimensions.width, dimensions.height));
        balloon.y = dimensions.height + balloon.radius;
        balloon.popPhase = 1;
      }
    });

    // Haptic feedback (mobile)
    if (navigator.vibrate) {
      navigator.vibrate(30);
    }
  }, [dimensions.width, dimensions.height, createBalloon]);

  // ===== UPDATE LOOPS =====
  const updateBalloons = useCallback(() => {
    const { width, height } = dimensions;
    balloonsRef.current.forEach((balloon) => {
      if (balloon.popPhase > 0) {
        balloon.popPhase -= 0.02;
        if (balloon.popPhase <= 0) balloon.popPhase = 0;
        return;
      }

      // Float physics
      if (enableFloat) {
        balloon.x += balloon.velocityX + Math.sin(Date.now() * 0.001 + balloon.x * 0.01) * 0.15;
        balloon.y += balloon.velocityY;

        // Gentle horizontal drift
        balloon.velocityX += (Math.random() - 0.5) * 0.005;
        balloon.velocityX = Math.max(-0.5, Math.min(0.5, balloon.velocityX));

        // Rotation
        balloon.rotation += balloon.rotationSpeed;
      }

      // Recycle when off-screen
      if (balloon.y < -balloon.radius - balloon.stringLength) {
        Object.assign(balloon, createBalloon(width, height));
        balloon.y = height + balloon.radius;
      }

      // Boundary wrap (horizontal)
      if (balloon.x < -balloon.radius) balloon.x = width + balloon.radius;
      if (balloon.x > width + balloon.radius) balloon.x = -balloon.radius;
    });
  }, [dimensions, enableFloat, createBalloon]);

  const updateParticles = useCallback(() => {
    particlesRef.current = particlesRef.current
      .map((p) => {
        p.x += p.velocityX;
        p.y += p.velocityY;
        p.velocityY += 0.08; // gravity
        p.life -= 0.015;
        return p;
      })
      .filter((p) => p.life > 0);
  }, []);

  // ===== DRAWING =====
  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const { width, height } = dimensions;
    ctx.clearRect(0, 0, width, height);

    // Draw particles first (behind balloons)
    particlesRef.current.forEach((p) => {
      const alpha = p.life / p.maxLife;
      ctx.globalAlpha = alpha;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.radius * alpha, 0, Math.PI * 2);
      ctx.fillStyle = p.color;
      ctx.fill();
    });

    // Draw balloons
    balloonsRef.current.forEach((balloon) => {
      ctx.save();
      ctx.translate(balloon.x, balloon.y);
      ctx.rotate(balloon.rotation);
      ctx.globalAlpha = balloon.opacity * (1 - balloon.popPhase * 0.5);

      // String
      ctx.beginPath();
      ctx.moveTo(0, balloon.radius);
      ctx.quadraticCurveTo(
        Math.sin(balloon.rotation * 2) * 8,
        balloon.radius + balloon.stringLength * 0.5,
        Math.sin(balloon.rotation * 3) * 5,
        balloon.radius + balloon.stringLength
      );
      ctx.strokeStyle = 'rgba(100, 100, 100, 0.4)';
      ctx.lineWidth = 1.5;
      ctx.lineCap = 'round';
      ctx.stroke();

      // Balloon body
      const gradient = ctx.createRadialGradient(
        -balloon.radius * 0.3,
        -balloon.radius * 0.3,
        0,
        0,
        0,
        balloon.radius
      );

      if (balloon.metallic) {
        // Metallic gradient
        gradient.addColorStop(0, lightenColor(balloon.color, 40));
        gradient.addColorStop(0.3, balloon.color);
        gradient.addColorStop(1, darkenColor(balloon.color, 30));
      } else {
        gradient.addColorStop(0, lightenColor(balloon.color, 30));
        gradient.addColorStop(0.5, balloon.color);
        gradient.addColorStop(1, darkenColor(balloon.color, 20));
      }

      ctx.beginPath();
      // Balloon shape (teardrop)
      ctx.moveTo(0, -balloon.radius);
      ctx.bezierCurveTo(
        balloon.radius * 0.9, -balloon.radius * 0.3,
        balloon.radius * 0.9, balloon.radius * 0.6,
        0, balloon.radius
      );
      ctx.bezierCurveTo(
        -balloon.radius * 0.9, balloon.radius * 0.6,
        -balloon.radius * 0.9, -balloon.radius * 0.3,
        0, -balloon.radius
      );
      ctx.fillStyle = gradient;
      ctx.fill();

      // Highlight for metallic
      if (balloon.metallic) {
        ctx.beginPath();
        ctx.ellipse(
          -balloon.radius * 0.25,
          -balloon.radius * 0.35,
          balloon.radius * 0.25,
          balloon.radius * 0.15,
          -Math.PI / 4,
          0,
          Math.PI * 2
        );
        ctx.fillStyle = 'rgba(255, 255, 255, 0.4)';
        ctx.fill();
      }

      // Knot at bottom
      ctx.beginPath();
      ctx.arc(0, balloon.radius + 3, 4, 0, Math.PI * 2);
      ctx.fillStyle = darkenColor(balloon.color, 30);
      ctx.fill();

      ctx.restore();
    });

    ctx.globalAlpha = 1;
  }, [dimensions]);

  // ===== COLOR HELPERS =====
  function lightenColor(hex: string, percent: number): string {
    const num = parseInt(hex.replace('#', ''), 16);
    const amt = Math.round(2.55 * percent);
    const R = Math.min(255, (num >> 16) + amt);
    const G = Math.min(255, ((num >> 8) & 0x00ff) + amt);
    const B = Math.min(255, (num & 0x0000ff) + amt);
    return `#${(0x1000000 | (R << 16) | (G << 8) | B).toString(16).slice(1)}`;
  }

  function darkenColor(hex: string, percent: number): string {
    const num = parseInt(hex.replace('#', ''), 16);
    const amt = Math.round(2.55 * percent);
    const R = Math.max(0, (num >> 16) - amt);
    const G = Math.max(0, ((num >> 8) & 0x00ff) - amt);
    const B = Math.max(0, (num & 0x0000ff) - amt);
    return `#${(0x1000000 | (R << 16) | (G << 8) | B).toString(16).slice(1)}`;
  }

  // ===== RENDER =====
  return (
    <canvas
      ref={canvasRef}
      className={`fixed inset-0 z-0 pointer-events-none ${className}`}
      style={{
        ...style,
        // Frosted glassmorphism overlay
        background: 'linear-gradient(135deg, rgba(255,255,255,0.05) 0%, rgba(192,192,192,0.03) 100%)',
      }}
      aria-hidden="true"
      role="img"
      aria-label="Floating decorative balloons animation"
    />
  );
}

// ===== TOUCH RIPPLE EFFECT (for buttons) =====
export function useTouchRipple() {
  const createRipple = useCallback((event: React.MouseEvent | React.TouchEvent, color = 'rgba(192,192,192,0.4)') => {
    const target = event.currentTarget;
    const rect = target.getBoundingClientRect();
    const clientX = 'touches' in event ? event.touches[0].clientX : event.clientX;
    const clientY = 'touches' in event ? event.touches[0].clientY : event.clientY;
    const x = clientX - rect.left;
    const y = clientY - rect.top;

    const ripple = document.createElement('span');
    ripple.className = 'touch-ripple';
    ripple.style.cssText = `
      position: absolute;
      border-radius: 50%;
      background: ${color};
      transform: scale(0);
      animation: ripple 0.6s ease-out forwards;
      pointer-events: none;
      left: ${x}px;
      top: ${y}px;
      width: ${Math.max(rect.width, rect.height) * 2}px;
      height: ${Math.max(rect.width, rect.height) * 2}px;
      margin-left: -${Math.max(rect.width, rect.height)}px;
      margin-top: -${Math.max(rect.width, rect.height)}px;
    `;

    const element = target as HTMLElement;
    element.style.position = 'relative';
    element.style.overflow = 'hidden';
    element.appendChild(ripple);

    ripple.addEventListener('animationend', () => ripple.remove());
  }, []);

  return { createRipple };
}