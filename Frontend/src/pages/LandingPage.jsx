import { useState, useEffect, useRef } from "react";
import { Link, useNavigate } from 'react-router-dom';
import { prefetchRoute } from '@/lib/routePrefetch';

// ─── CSS INJECTION ────────────────────────────────────────────────────────────
const GLOBAL_CSS = `
  @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&family=Space+Grotesk:wght@400;500;600;700&family=Space+Mono:ital,wght@0,400;0,700;1,400&display=swap');

  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

  :root {
    --mg: #2563eb;
    --mg2: #60a5fa;
    --mg-glow: rgba(37,99,235,0.18);
    --bg0: #0a0a0a;
    --bg1: #101010;
    --bg2: #141414;
    --bg3: #181818;
    --border: rgba(255,255,255,0.04);
    --border-mg: rgba(37,99,235,0.18);
    --t0: #f2f2f0;
    --t1: #b5b5b2;
    --t2: #8e8e89;
    --t3: #71716d;
    --ff-head: 'Space Grotesk', sans-serif;
    --ff-body: 'Inter', sans-serif;
    --ff-mono: 'Space Mono', monospace;
    --ease-spring: cubic-bezier(0.16, 1, 0.3, 1);
  }

  html { scroll-behavior: smooth; }
  body { background: var(--bg0); }

  .tp-root {
    background: var(--bg0);
    color: var(--t0);
    font-family: var(--ff-body);
    overflow-x: hidden;
    position: relative;
  }

  /* Noise overlay */
  .tp-root::before {
    content: '';
    position: fixed; inset: 0; z-index: 0;
    background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='300' height='300'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.75' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='300' height='300' filter='url(%23n)' opacity='0.038'/%3E%3C/svg%3E");
    pointer-events: none;
    opacity: 1;
  }

  /* ── Keyframes ── */
  @keyframes tp-slider-zoom {
    from { transform: scale(1); }
    to   { transform: scale(1.04); }
  }
  @keyframes tp-shimmer {
    0%   { background-position: -300% center; }
    100% { background-position: 300% center; }
  }
  @keyframes tp-pulse-ring {
    0%   { transform: scale(1); opacity: 0.8; }
    100% { transform: scale(2.6); opacity: 0; }
  }
  @keyframes tp-reveal-up {
    from { opacity: 0; transform: translateY(36px); }
    to   { opacity: 1; transform: translateY(0); }
  }
  @keyframes tp-reveal-left {
    from { opacity: 0; transform: translateX(-40px); }
    to   { opacity: 1; transform: translateX(0); }
  }
  @keyframes tp-reveal-right {
    from { opacity: 0; transform: translateX(40px); }
    to   { opacity: 1; transform: translateX(0); }
  }
  @keyframes tp-blink-cursor {
    0%,100% { opacity: 1; }
    50%      { opacity: 0; }
  }
  @keyframes tp-slide-row {
    from { opacity: 0; transform: translateX(10px); }
    to   { opacity: 1; transform: translateX(0); }
  }
  @keyframes tp-nav-in {
    from { opacity: 0; transform: translateY(-16px); }
    to   { opacity: 1; transform: translateY(0); }
  }
  @keyframes tp-phone-idle {
    0%   { transform: translateY(0) rotateX(0deg) rotateY(0deg); }
    50%  { transform: translateY(-6px) rotateX(-0.6deg) rotateY(1.4deg); }
    100% { transform: translateY(0) rotateX(0deg) rotateY(0deg); }
  }
  @keyframes tp-orbit {
    from { transform: rotate(0deg) translateX(26px) rotate(0deg); }
    to   { transform: rotate(360deg) translateX(26px) rotate(-360deg); }
  }

  /* ── Reveal classes ── */
  .tp-reveal { opacity: 0; }
  .tp-reveal.tp-visible {
    animation: tp-reveal-up 0.75s var(--ease-spring) forwards;
  }
  .tp-reveal-l { opacity: 0; }
  .tp-reveal-l.tp-visible {
    animation: tp-reveal-left 0.85s var(--ease-spring) forwards;
  }
  .tp-reveal-r { opacity: 0; }
  .tp-reveal-r.tp-visible {
    animation: tp-reveal-right 0.85s var(--ease-spring) forwards;
  }

  /* ── Accent text (plain, no shimmer) ── */
  .tp-shimmer {
    color: var(--mg);
  }

  /* ── Navbar ── */
  .tp-nav {
    position: fixed; top: 0; left: 0; right: 0; z-index: 200;
    height: 58px;
    display: flex; align-items: center; justify-content: space-between;
    padding: 0 48px;
    background: rgba(20,20,20,0.82);
    backdrop-filter: blur(24px) saturate(1.4);
    border-bottom: 1px solid var(--border);
    animation: tp-nav-in 0.6s var(--ease-spring) 0.1s both;
  }
  .tp-nav-link {
    font-family: var(--ff-body);
    font-size: 13.5px;
    color: var(--t2);
    text-decoration: none;
    position: relative;
    transition: color 0.22s ease;
    letter-spacing: 0.01em;
  }
  .tp-nav-link::after {
    content: '';
    position: absolute; bottom: -3px; left: 0;
    width: 0; height: 1px;
    background: var(--mg);
    transition: width 0.28s var(--ease-spring);
  }
  .tp-nav-link:hover { color: var(--t0); }
  .tp-nav-link:hover::after { width: 100%; }

  /* ── Buttons ── */
  .tp-btn {
    position: relative;
    border: none; cursor: pointer;
    font-family: var(--ff-body);
    font-weight: 600;
    transition: transform 0.18s ease, opacity 0.2s ease;
  }
  .tp-btn:hover { transform: translateY(-1px); opacity: 0.97; }
  .tp-btn:active { transform: translateY(0); opacity: 0.92; }
  .tp-btn-primary {
    background: var(--mg);
    color: #fff;
  }
  .tp-btn-primary:hover {
    background: #2b68eb;
  }
  .tp-btn-ghost {
    background: transparent;
    color: var(--t1);
    border: 1px solid var(--border);
    transition: color 0.2s ease, border-color 0.2s ease, transform 0.18s ease;
  }
  .tp-btn-ghost:hover {
    color: var(--t0);
    border-color: var(--border-mg);
    transform: translateY(-1px);
  }

  /* ── Cards ── */
  .tp-card {
    background: rgba(255,255,255,0.015);
    backdrop-filter: blur(12px);
    border: 1px solid var(--border);
    transition: transform 0.18s ease, border-color 0.2s ease;
  }
  .tp-card:hover {
    transform: translateY(-2px);
    border-color: var(--border-mg);
  }

  /* ── Hero iPhone 3D ── */
  .tp-phone3d-stage {
    width: 292px;
    user-select: none;
  }

  .tp-phone3d-idle {
    transform-style: preserve-3d;
    animation: tp-phone-idle 7s ease-in-out infinite;
  }

  .tp-phone3d-idle.tp-pause {
    animation-play-state: paused;
  }

  .tp-phone3d-wrap {
    perspective: 1600px;
    perspective-origin: center center;
    width: 100%;
    display: grid;
    place-items: center;
    touch-action: none;
    cursor: grab;
  }

  .tp-phone3d-wrap:active {
    cursor: grabbing;
  }

  .tp-phone3d-shadow {
    position: absolute;
    width: 206px;
    height: 58px;
    background: radial-gradient(ellipse at center, rgba(0,0,0,0.6) 0%, rgba(0,0,0,0) 70%);
    filter: blur(8px);
    transform: translateY(252px) rotateX(90deg);
    pointer-events: none;
  }

  .tp-phone3d-device {
    position: relative;
    width: 252px;
    height: 516px;
    transform-style: preserve-3d;
    transition: transform 180ms var(--ease-spring);
  }

  .tp-phone3d-device.tp-dragging {
    transition: none;
  }

  .tp-phone3d-face {
    position: absolute;
    inset: 0;
    border-radius: 46px;
    overflow: hidden;
  }

  .tp-phone3d-front {
    transform: translateZ(10px);
    background: linear-gradient(165deg, #57595d 0%, #34363a 20%, #1e2023 58%, #404246 84%, #64666a 100%);
    box-shadow:
      inset 0 0 0 1px rgba(255,255,255,0.2),
      inset 0 2px 3px rgba(255,255,255,0.08),
      0 28px 62px rgba(0,0,0,0.55);
  }

  .tp-phone3d-back {
    transform: rotateY(180deg) translateZ(10px);
    background: radial-gradient(circle at 22% 14%, rgba(255,255,255,0.2) 0%, rgba(168,170,174,0.35) 30%, rgba(60,62,66,1) 74%, rgba(24,25,28,1) 100%);
    box-shadow: inset 0 0 0 1px rgba(255,255,255,0.16);
  }

  .tp-phone3d-screen-wrap {
    position: absolute;
    inset: 8px;
    border-radius: 38px;
    overflow: hidden;
    border: 1px solid rgba(255,255,255,0.09);
    background: #020203;
  }

  .tp-phone3d-screen {
    position: absolute;
    inset: 0;
    background: radial-gradient(circle at 50% 15%, rgba(255,255,255,0.045) 0%, rgba(8,8,10,1) 40%, #000 100%);
  }

  .tp-phone3d-glass {
    position: absolute;
    inset: 0;
    background: linear-gradient(120deg, rgba(255,255,255,0.2) 0%, rgba(255,255,255,0.05) 16%, rgba(255,255,255,0) 34%);
    pointer-events: none;
  }

  .tp-phone3d-island {
    position: absolute;
    top: 13px;
    left: 50%;
    transform: translateX(-50%);
    width: 106px;
    height: 30px;
    border-radius: 20px;
    background: #010102;
    border: 1px solid rgba(255,255,255,0.08);
    box-shadow: inset 0 0 6px rgba(255,255,255,0.05);
    z-index: 2;
  }

  .tp-phone3d-island::before {
    content: '';
    position: absolute;
    width: 7px;
    height: 7px;
    border-radius: 50%;
    right: 16px;
    top: 10px;
    background: rgba(115,168,255,0.35);
    box-shadow: 0 0 4px rgba(115,168,255,0.55);
  }

  .tp-phone3d-island::after {
    content: '';
    position: absolute;
    width: 36px;
    height: 6px;
    border-radius: 99px;
    left: 18px;
    top: 12px;
    background: rgba(255,255,255,0.08);
  }

  .tp-phone3d-camera-bump {
    position: absolute;
    top: 18px;
    left: 16px;
    width: 112px;
    height: 112px;
    border-radius: 30px;
    background: linear-gradient(145deg, rgba(84,86,91,0.95), rgba(32,33,36,0.95));
    border: 1px solid rgba(255,255,255,0.14);
    box-shadow: inset 0 2px 2px rgba(255,255,255,0.08), 0 10px 20px rgba(0,0,0,0.35);
  }

  .tp-phone3d-lens {
    position: absolute;
    width: 38px;
    height: 38px;
    border-radius: 50%;
    border: 1px solid rgba(255,255,255,0.15);
    background: radial-gradient(circle at 38% 30%, rgba(115,187,255,0.35) 0%, rgba(20,28,36,0.95) 35%, #050608 100%);
    box-shadow: inset 0 0 10px rgba(0,0,0,0.8), 0 2px 4px rgba(0,0,0,0.5);
  }

  .tp-phone3d-lens.l1 { top: 12px; left: 12px; }
  .tp-phone3d-lens.l2 { top: 12px; right: 12px; }
  .tp-phone3d-lens.l3 { bottom: 12px; left: 37px; }

  .tp-phone3d-flash {
    position: absolute;
    right: 18px;
    bottom: 18px;
    width: 14px;
    height: 14px;
    border-radius: 50%;
    background: radial-gradient(circle at 40% 40%, #fff, #d9d9d9 68%, #b9b9b9 100%);
    box-shadow: 0 0 8px rgba(255,255,255,0.65);
  }

  .tp-phone3d-logo {
    position: absolute;
    left: 50%;
    top: 56%;
    transform: translate(-50%, -50%);
    font-family: var(--ff-head);
    font-weight: 600;
    font-size: 24px;
    letter-spacing: 0.08em;
    color: rgba(255,255,255,0.34);
    text-transform: lowercase;
  }


  .tp-phone3d-button {
    position: absolute;
    z-index: 5;
    border-radius: 10px;
    background: linear-gradient(180deg, #87898d 0%, #5e6065 40%, #36383c 100%);
    box-shadow: inset 0 0 0 1px rgba(255,255,255,0.12), 0 2px 4px rgba(0,0,0,0.35);
  }

  .tp-phone3d-btn-action {
    width: 4px;
    height: 42px;
    left: -3px;
    top: 116px;
  }

  .tp-phone3d-btn-vol-up,
  .tp-phone3d-btn-vol-down {
    width: 4px;
    height: 58px;
    left: -3px;
  }

  .tp-phone3d-btn-vol-up { top: 184px; }
  .tp-phone3d-btn-vol-down { top: 252px; }

  .tp-phone3d-btn-power {
    width: 4px;
    height: 82px;
    right: -3px;
    top: 196px;
  }

  .tp-phone3d-btn-camera {
    width: 4px;
    height: 44px;
    right: -3px;
    top: 296px;
  }

  .tp-phone3d-port {
    position: absolute;
    bottom: 4px;
    left: 50%;
    transform: translateX(-50%);
    width: 42px;
    height: 6px;
    border-radius: 4px;
    background: rgba(12,12,14,0.95);
    box-shadow: inset 0 0 1px rgba(255,255,255,0.12);
    z-index: 6;
  }

  .tp-phone3d-grille {
    position: absolute;
    bottom: 5px;
    width: 26px;
    height: 6px;
    z-index: 6;
    background-image: radial-gradient(circle, rgba(12,12,14,0.95) 1px, transparent 1px);
    background-size: 5px 5px;
    background-repeat: repeat-x;
  }

  .tp-phone3d-grille.left { left: 74px; }
  .tp-phone3d-grille.right { right: 74px; }

  /* ── Hero responsive ── */
  .tp-hero-wrap {
    display: flex;
    align-items: center;
    gap: 64px;
    justify-content: space-between;
  }

  @media (max-width: 1080px) {
    .tp-hero-wrap {
      gap: 38px;
    }
    .tp-phone3d-stage {
      width: 264px;
    }
    .tp-phone3d-device {
      width: 230px;
      height: 472px;
    }
  }

  @media (max-width: 920px) {
    .tp-hero-wrap {
      flex-direction: column;
      align-items: flex-start;
      gap: 28px;
    }
    .tp-hero-right {
      width: 100%;
      display: flex;
      justify-content: center;
    }
    .tp-phone3d-stage {
      width: 250px;
    }
    .tp-phone3d-device {
      width: 216px;
      height: 444px;
    }
  }

  @media (max-width: 640px) {
    .tp-phone3d-stage {
      width: 228px;
    }
    .tp-phone3d-device {
      width: 196px;
      height: 404px;
    }
  }

  /* ── Dot live ── */
  .tp-live-dot {
    position: relative;
    width: 7px; height: 7px;
    border-radius: 50%;
    background: #22c55e;
  }
  .tp-live-dot::before {
    content: '';
    position: absolute; inset: 0;
    border-radius: 50%;
    background: #22c55e;
    animation: tp-pulse-ring 1.8s ease-out infinite;
  }

  /* ── Gradient line ── */
  .tp-step-connector {
    position: absolute;
    top: 0; bottom: 0; left: 38px;
    width: 1px;
    background: linear-gradient(to bottom, var(--mg), rgba(37,99,235,0.08));
  }

  /* ── Scrollbar ── */
  ::-webkit-scrollbar { width: 4px; }
  ::-webkit-scrollbar-track { background: var(--bg0); }
  ::-webkit-scrollbar-thumb { background: var(--bg3); border-radius: 2px; }
  ::-webkit-scrollbar-thumb:hover { background: rgba(37,99,235,0.4); }

  /* ── Section label ── */
  .tp-label {
    display: inline-block;
    font-family: var(--ff-body);
    font-size: 10.5px;
    font-weight: 600;
    letter-spacing: 0.18em;
    text-transform: uppercase;
    color: var(--mg);
    margin-bottom: 18px;
  }

  /* ── Decorative grid ── */
  .tp-grid-bg {
    background-image:
      linear-gradient(rgba(255,255,255,0.022) 1px, transparent 1px),
      linear-gradient(90deg, rgba(255,255,255,0.022) 1px, transparent 1px);
    background-size: 44px 44px;
  }

  /* ── Number accent ── */
  .tp-num-accent {
    font-family: var(--ff-mono);
    font-size: 80px;
    font-weight: 700;
    color: rgba(37,99,235,0.06);
    letter-spacing: -4px;
    line-height: 1;
    position: absolute;
    top: -10px; left: -6px;
    pointer-events: none;
    user-select: none;
  }

  /* ── Pricing gradient border ── */
  .tp-price-featured {
    position: relative;
    background: linear-gradient(var(--bg2), var(--bg2)) padding-box,
                linear-gradient(135deg, var(--mg), rgba(37,99,235,0.3), var(--mg2)) border-box;
    border: 1px solid transparent;
  }

  /* ── Row animation delay util ── */
  .tp-d0 { animation-delay: 0ms; }
  .tp-d1 { animation-delay: 90ms; }
  .tp-d2 { animation-delay: 180ms; }
  .tp-d3 { animation-delay: 270ms; }
  .tp-d4 { animation-delay: 360ms; }

  /* ── Ambient orb ── */
  .tp-orb {
    position: absolute;
    border-radius: 50%;
    pointer-events: none;
    filter: blur(80px);
    opacity: 0.55;
  }

  /* ── Visually hidden (accesibilidad & SEO) ── */
  .tp-visually-hidden {
    position: absolute;
    width: 1px; height: 1px;
    padding: 0; margin: -1px;
    overflow: hidden;
    clip: rect(0,0,0,0);
    white-space: nowrap;
    border: 0;
  }

  /* ═══════════════════════════════════════════════════════════
     RESPONSIVE MOBILE — breakpoints 960 / 620
  ═══════════════════════════════════════════════════════════ */

  /* ── Nav hamburger ── */
  .tp-nav-links  { display: flex; gap: 34px; }
  .tp-nav-actions { display: flex; gap: 12px; align-items: center; }
  .tp-nav-ham {
    display: none;
    background: none; border: none; cursor: pointer;
    color: var(--t0); align-items: center; justify-content: center;
    padding: 6px; border-radius: 8px; transition: color 0.2s;
  }
  .tp-nav-ham:hover { color: var(--mg); }

  /* ── Mobile overlay menu ── */
  .tp-mob-overlay {
    position: fixed; inset: 0; z-index: 190;
    background: rgba(8,8,10,0.97);
    backdrop-filter: blur(24px) saturate(1.4);
    display: flex; flex-direction: column;
    align-items: center; justify-content: center;
    gap: 6px;
    transform: translateY(-110%);
    transition: transform 0.34s cubic-bezier(0.16,1,0.3,1);
    pointer-events: none;
  }
  .tp-mob-overlay.tp-mob-open {
    transform: translateY(0);
    pointer-events: auto;
  }
  .tp-mob-nav-link {
    font-family: var(--ff-head);
    font-size: 28px; font-weight: 600;
    color: var(--t0); text-decoration: none;
    padding: 10px 28px; border-radius: 12px;
    transition: color 0.2s, background 0.2s;
    background: none; border: none; cursor: pointer;
    display: block; text-align: center; letter-spacing: -0.3px;
  }
  .tp-mob-nav-link:hover { color: var(--mg); background: rgba(37,99,235,0.07); }
  .tp-mob-nav-close {
    position: absolute; top: 18px; right: 20px;
    background: none; border: none; color: var(--t1); cursor: pointer;
    padding: 8px; border-radius: 8px;
    transition: color 0.2s; display: flex; align-items: center;
  }
  .tp-mob-nav-close:hover { color: var(--t0); }
  .tp-mob-nav-actions {
    display: flex; flex-direction: column;
    gap: 10px; margin-top: 18px; width: 220px;
  }

  /* ── Responsive grids ── */
  .tp-grid-5 { display: grid; grid-template-columns: repeat(5, 1fr); gap: 16px; }
  .tp-grid-4 { display: grid; grid-template-columns: repeat(4, 1fr); gap: 14px; }
  .tp-grid-3 { display: grid; grid-template-columns: repeat(3, 1fr); gap: 16px; }
  .tp-grid-2 { display: grid; grid-template-columns: 1fr 1fr; gap: 14px; }
  .tp-compare-row { display: grid; grid-template-columns: 240px 1fr; }

  /* ── ≤960px (tablets y móviles grandes) ── */
  @media (max-width: 960px) {
    .tp-nav { padding: 0 20px; }
    .tp-nav-links, .tp-nav-actions { display: none !important; }
    .tp-nav-ham { display: flex !important; }
    .tp-grid-5 { grid-template-columns: repeat(2, 1fr); }
    .tp-grid-4 { grid-template-columns: repeat(2, 1fr); }
    .tp-grid-3 { grid-template-columns: repeat(2, 1fr); }
  }

  /* ── ≤620px (móviles estándar) ── */
  @media (max-width: 620px) {
    .tp-nav { padding: 0 16px; }
    .tp-grid-5 { grid-template-columns: 1fr; gap: 12px; }
    .tp-grid-4 { grid-template-columns: repeat(2, 1fr); gap: 12px; }
    .tp-grid-3 { grid-template-columns: 1fr; gap: 12px; }
    .tp-grid-2 { grid-template-columns: 1fr; gap: 12px; }
    .tp-compare-row { grid-template-columns: 1fr; }

    .tp-hero-wrap { gap: 24px; }
    .tp-hero-right { display: flex; justify-content: center; }
  }
`;

// ─── HOOKS ────────────────────────────────────────────────────────────────────

function useReveal(threshold = 0.12) {
  const ref = useRef(null);
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(([e]) => {
      if (e.isIntersecting) { setVisible(true); obs.disconnect(); }
    }, { threshold });
    obs.observe(el);
    return () => obs.disconnect();
  }, [threshold]);
  return [ref, visible];
}

function useCounter(target, duration = 2200, active = false) {
  const [val, setVal] = useState(0);
  useEffect(() => {
    if (!active) return;
    let start = null;
    const tick = (ts) => {
      if (!start) start = ts;
      const p = Math.min((ts - start) / duration, 1);
      const eased = 1 - Math.pow(1 - p, 4);
      setVal(Math.round(eased * target));
      if (p < 1) requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  }, [target, duration, active]);
  return val;
}

// ─── ICONS ───────────────────────────────────────────────────────────────────

const Icon = {
  Clock: () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10"/>
      <polyline points="12 6 12 12 16 14"/>
    </svg>
  ),
  Shield: () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
    </svg>
  ),
  Mobile: () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="5" y="2" width="14" height="20" rx="2" ry="2"/>
      <line x1="12" y1="18" x2="12.01" y2="18"/>
    </svg>
  ),
  Chart: () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21.21 15.89A10 10 0 1 1 8 2.83"/>
      <path d="M22 12A10 10 0 0 0 12 2v10z"/>
    </svg>
  ),
  Users: () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
      <circle cx="9" cy="7" r="4"/>
      <path d="M23 21v-2a4 4 0 0 0-3-3.87"/>
      <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
    </svg>
  ),
  Check: () => (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="20 6 9 17 4 12"/>
    </svg>
  ),
  ArrowRight: () => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <line x1="5" y1="12" x2="19" y2="12"/>
      <polyline points="12 5 19 12 12 19"/>
    </svg>
  ),
  Legal: () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
      <polyline points="14 2 14 8 20 8"/>
      <line x1="16" y1="13" x2="8" y2="13"/>
      <line x1="16" y1="17" x2="8" y2="17"/>
      <polyline points="10 9 9 9 8 9"/>
    </svg>
  ),
  Wifi: () => (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M5 12.55a11 11 0 0 1 14.08 0"/>
      <path d="M1.42 9a16 16 0 0 1 21.16 0"/>
      <path d="M8.53 16.11a6 6 0 0 1 6.95 0"/>
      <line x1="12" y1="20" x2="12.01" y2="20"/>
    </svg>
  ),
  Zap: () => (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/>
    </svg>
  ),
  MapPin: () => (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/>
      <circle cx="12" cy="10" r="3"/>
    </svg>
  ),
  Edit: () => (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
      <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
    </svg>
  ),
  Bell: () => (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/>
      <path d="M13.73 21a2 2 0 0 1-3.46 0"/>
    </svg>
  ),
  Report: () => (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/>
    </svg>
  ),
};

// ─── HERO SLIDER COMPONENT ───────────────────────────────────────────────────

function HeroImageSlider() {
  const [rotation, setRotation] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const dragRef = useRef(null);

  const clamp = (value, min, max) => Math.max(min, Math.min(max, value));

  const onPointerDown = (event) => {
    event.preventDefault();
    setIsDragging(true);
    dragRef.current = {
      id: event.pointerId,
      startX: event.clientX,
      startY: event.clientY,
      baseX: rotation.x,
      baseY: rotation.y,
    };
    event.currentTarget.setPointerCapture(event.pointerId);
  };

  const onPointerMove = (event) => {
    if (!isDragging || !dragRef.current || dragRef.current.id !== event.pointerId) return;
    const deltaX = event.clientX - dragRef.current.startX;
    const deltaY = event.clientY - dragRef.current.startY;

    const nextY = clamp(dragRef.current.baseY + deltaX * 0.22, -44, 44);
    const nextX = clamp(dragRef.current.baseX - deltaY * 0.2, -30, 30);
    setRotation({ x: nextX, y: nextY });
  };

  const onPointerUp = () => {
    setIsDragging(false);
    dragRef.current = null;
  };

  const onDoubleClick = () => {
    setRotation({ x: 0, y: 0 });
  };

  return (
    <div className="tp-phone3d-stage" aria-label="Modelo 3D de smartphone premium con interacción">
      <div
        className="tp-phone3d-wrap"
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerUp}
        onDoubleClick={onDoubleClick}
      >
        <div className="tp-phone3d-shadow" />

        <div className={`tp-phone3d-idle ${isDragging ? 'tp-pause' : ''}`}>
          <div
            className={`tp-phone3d-device ${isDragging ? 'tp-dragging' : ''}`}
            style={{ transform: `rotateX(${rotation.x}deg) rotateY(${rotation.y}deg)` }}
          >
          <div className="tp-phone3d-face tp-phone3d-back">
            <div className="tp-phone3d-camera-bump">
              <div className="tp-phone3d-lens l1" />
              <div className="tp-phone3d-lens l2" />
              <div className="tp-phone3d-lens l3" />
              <div className="tp-phone3d-flash" />
            </div>
            <div className="tp-phone3d-logo">iPhone</div>
          </div>

          <div className="tp-phone3d-face tp-phone3d-front">
            <div className="tp-phone3d-screen-wrap" aria-hidden="true">
              <div className="tp-phone3d-island" />
              <div className="tp-phone3d-screen" />
              <div className="tp-phone3d-glass" />
            </div>
          </div>

          <div className="tp-phone3d-button tp-phone3d-btn-action" />
          <div className="tp-phone3d-button tp-phone3d-btn-vol-up" />
          <div className="tp-phone3d-button tp-phone3d-btn-vol-down" />
          <div className="tp-phone3d-button tp-phone3d-btn-power" />
          <div className="tp-phone3d-button tp-phone3d-btn-camera" />

          <div className="tp-phone3d-port" />
          <div className="tp-phone3d-grille left" />
          <div className="tp-phone3d-grille right" />
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── MAIN COMPONENT ───────────────────────────────────────────────────────────

export default function LandingPage() {
  const navigate = useNavigate();

  const bindPrefetch = (path) => ({
    onMouseEnter: () => prefetchRoute(path),
    onFocus: () => prefetchRoute(path),
    onTouchStart: () => prefetchRoute(path),
  });

  // Reveal refs
  const [heroRef, heroVis]         = useReveal(0.05);
  const [benefitsRef, benefitsVis] = useReveal(0.1);
  const [showcaseRef, showcaseVis] = useReveal(0.08);
  const [stepsRef, stepsVis]       = useReveal(0.1);
  const [pricingRef, pricingVis]   = useReveal(0.08);

  const benefits = [
    { Icon: Icon.Shield, title: 'Cumplimiento legal real', desc: 'Registro de jornada conforme al marco legal en España. Historial trazable y documentación lista para una inspección.' },
    { Icon: Icon.Clock,  title: 'Control de horas y extras',  desc: 'Cálculo automático de horas ordinarias, extra y descansos para evitar errores manuales y discusiones internas.' },
    { Icon: Icon.Mobile, title: 'Fichaje flexible', desc: 'Tus empleados fichan por móvil, web, QR o punto de oficina según su puesto y forma de trabajo.' },
    { Icon: Icon.Chart,  title: 'Informes accionables',   desc: 'Exporta datos en PDF y Excel para RRHH, gestoría y dirección con visibilidad clara de jornada y ausencias.' },
  ];

  const modules = [
    {
      title: 'Intranet de empresa',
      desc: 'Alta de empleados, configuración de horarios, validación de registros y control de incidencias desde un panel único.',
      cta: 'Ideal para responsables de RRHH y gerencia.',
    },
    {
      title: 'App para empleados',
      desc: 'Fichaje inmediato, consulta de jornada, solicitud de vacaciones y comunicación de ausencias desde el móvil.',
      cta: 'Menos fricción para el equipo, más datos fiables para la empresa.',
    },
    {
      title: 'Punto de fichaje en oficina',
      desc: 'Activa un punto fijo en tablet o móvil para equipos presenciales. Registro rápido, visual y sin complejidad técnica.',
      cta: 'Perfecto para centros con entrada común o turnos rotativos.',
    },
  ];

  const targetProfiles = [
    {
      title: 'Autónomos',
      desc: 'Registra tu jornada sin papeleo y mantén toda la documentación preparada para cualquier requerimiento legal.',
    },
    {
      title: 'Pymes',
      desc: 'Coordina equipos con distintos turnos, vacaciones y ausencias desde una única plataforma fácil de mantener.',
    },
    {
      title: 'Equipos en movilidad',
      desc: 'Valida fichajes fuera de oficina con geolocalización y reglas por ubicación para mantener trazabilidad.',
    },
  ];

  const showcase = [
    {
      img: '/landing_workstation.jpg',
      label: 'Panel de gestión',
      title: 'Control de jornada desde el panel de empresa',
      desc: 'El responsable de RRHH o gerencia tiene visión completa de fichajes, ausencias e incidencias desde un único panel web, sin necesidad de exportar datos manualmente.',
      alt: 'Responsable de equipo gestionando jornadas con Tempos en su ordenador',
    },
    {
      img: '/landing_analytics.jpg',
      label: 'Informes y analítica',
      title: 'Datos de jornada listos para gestoría e inspección',
      desc: 'Genera informes detallados de horas, extras y ausencias exportables en PDF y Excel. Documentación preparada en segundos para auditorías o requerimientos de Inspección de Trabajo.',
      alt: 'Vista de informes y analítica de control horario en Tempos',
    },
    {
      img: '/landing_team_collab.jpg',
      label: 'Coordinación de equipo',
      title: 'Organiza turnos, vacaciones y permisos sin fricciones',
      desc: 'Los empleados solicitan vacaciones o permisos desde la app y el responsable aprueba o gestiona la incidencia al instante. Menos correos, menos errores, más control.',
      alt: 'Equipo colaborando con gestión de turnos y vacaciones en Tempos',
    },
    {
      img: '/landing_legal_desk.jpg',
      label: 'Cumplimiento legal',
      title: 'Documenta la jornada con trazabilidad real',
      desc: 'Cada fichaje queda registrado con sello de tiempo y contexto verificable. Historial auditable para cumplir la obligación legal de registro horario en España.',
      alt: 'Documentación de cumplimiento legal de control horario para inspección',
    },
  ];

  const faqs = [
    {
      q: '¿Tempos cumple la normativa de registro horario en España?',
      a: 'Sí. Tempos está diseñado para registrar jornada diaria, conservar histórico y facilitar documentación verificable para auditorías e inspecciones.',
    },
    {
      q: '¿Cómo fichan los empleados?',
      a: 'Pueden fichar desde app móvil, navegador, código QR o punto fijo en oficina. La empresa decide qué método habilitar por perfil o sede.',
    },
    {
      q: '¿Se pueden gestionar vacaciones, permisos y bajas?',
      a: 'Sí. El equipo puede enviar solicitudes y RRHH validarlas desde la intranet, manteniendo trazabilidad y calendario actualizado.',
    },
    {
      q: '¿Qué pasa si un empleado olvida fichar?',
      a: 'El sistema permite gestionar incidencias y correcciones con control de cambios, evitando pérdidas de información y mejorando la calidad del dato.',
    },
    {
      q: '¿Puedo descargar informes para gestoría o inspección?',
      a: 'Sí. Puedes exportar informes en PDF y Excel con el detalle de jornada, ausencias y horas para compartir con gestoría o auditoría.',
    },
    {
      q: '¿Tiene permanencia o costes de alta?',
      a: 'No. Puedes empezar con prueba y cancelar cuando quieras, sin compromisos de permanencia ni costes de implantación complejos.',
    },
  ];

  const proofItems = [
    { value: '14 días', label: 'de prueba para validar la operativa antes de implantarla' },
    { value: '0€', label: 'de cuota de alta para empezar sin costes iniciales' },
    { value: '1 panel', label: 'para controlar jornada, ausencias e incidencias del equipo' },
  ];

  const useCases = [
    {
      name: 'Empresas con personal administrativo y operativo',
      quote: 'Centraliza fichajes, ausencias e incidencias en un único entorno y reduce la revisión manual de registros.',
    },
    {
      name: 'Pymes con turnos o varios centros',
      quote: 'Combina fichaje en oficina, móvil o punto fijo según cada equipo, con control unificado desde la intranet.',
    },
    {
      name: 'Asesorías y responsables de RRHH',
      quote: 'Accede a información ordenada y exportable para revisar jornada, horas extra y documentación ante inspecciones.',
    },
  ];

  const compareRows = [
    ['Registro en papel o Excel', 'Procesos manuales, errores frecuentes y poca trazabilidad'],
    ['Tempos', 'Registro digital centralizado, histórico ordenado y control inmediato del equipo'],
  ];

  const steps = [
    { n: '01', title: 'Crea tu cuenta', desc: 'Registro en 30 segundos. Sin tarjeta de crédito. Configura tu empresa o perfil de autónomo de forma inmediata.' },
    { n: '02', title: 'Invita a tu equipo', desc: 'Añade empleados por correo electrónico. Cada usuario accede con sus propias credenciales de forma segura.' },
    { n: '03', title: 'Control desde el primer minuto', desc: 'Visualiza fichajes, horas y alertas en tiempo real. Exporta cuando lo necesites, sin complicaciones.' },
  ];

  return (
    <div className="tp-root">
      <style>{GLOBAL_CSS}</style>

      <main id="contenido-principal">

      {/* ── Hero ── */}
      <section ref={heroRef} id="inicio" aria-label="Software de control horario legal para empresas y autónomos en España" style={{
        minHeight: '100vh',
        display: 'flex', alignItems: 'center',
        paddingTop: 58, position: 'relative', overflow: 'hidden',
      }}>
        {/* Ambient orbs */}
        <div className="tp-orb" style={{ width: 700, height: 700, top: '-15%', left: '-18%', background: 'radial-gradient(circle, rgba(37,99,235,0.11) 0%, transparent 70%)' }}/>
        <div className="tp-orb" style={{ width: 500, height: 500, bottom: '-10%', right: '-12%', background: 'radial-gradient(circle, rgba(37,99,235,0.07) 0%, transparent 70%)' }}/>

        <div style={{ maxWidth: 1180, margin: '0 auto', padding: 'clamp(32px,4vw,60px) clamp(18px,4vw,48px)', width: '100%', position: 'relative', zIndex: 1 }}>
          <div className="tp-hero-wrap">

            {/* Left copy */}
            <div className={`tp-reveal-l ${heroVis ? 'tp-visible' : ''}`} style={{ flex: 1, maxWidth: 560 }}>
              <div style={{ display: 'inline-flex', alignItems: 'center', gap: 9, borderRadius: 100, border: '1px solid var(--border-mg)', background: 'rgba(37,99,235,0.06)', padding: '5px 16px', marginBottom: 36 }}>
                <div style={{ width: 7, height: 7, borderRadius: '50%', background: 'var(--mg)', boxShadow: '0 0 10px var(--mg)' }}/>
                <span style={{ fontSize: 11.5, color: 'var(--mg)', letterSpacing: 0.4, fontWeight: 600 }}>Normativa 2026 · Datos alojados en España</span>
              </div>

              <h1 style={{ fontFamily: 'var(--ff-head)', fontSize: 'clamp(34px,5.5vw,68px)', fontWeight: 600, lineHeight: 1.05, letterSpacing: 0.5, marginBottom: 26, color: 'var(--t0)' }}>
                Controla las horas <i style={{ fontWeight: 400, color: 'rgba(255,255,255,0.7)' }}>de tu equipo.</i>
                <br />
                <span className="tp-shimmer">Cumple la ley. Sin papeleo.</span>
              </h1>

              <div style={{ marginBottom: 32 }}>
                <p style={{ fontSize: 17, color: 'var(--t1)', lineHeight: 1.65, maxWidth: 480, fontWeight: 300 }}>
                  Software de control horario para empresas, autónomos y pymes: fichaje por móvil o QR, gestión de vacaciones y bajas, e informes listos para Inspección de Trabajo.
                </p>
              </div>

              <div style={{ display: 'flex', gap: 12, marginBottom: 44 }}>
                <button onClick={() => navigate('/trial')} className="tp-btn tp-btn-primary" style={{ borderRadius: 13, padding: '15px 30px', fontSize: 15, display: 'flex', alignItems: 'center', gap: 9 }}>
                  Solicitar prueba 14 días <Icon.ArrowRight />
                </button>
                <button onClick={() => { document.getElementById('precios').scrollIntoView({ behavior: 'smooth' }); }} className="tp-btn tp-btn-ghost" style={{ borderRadius: 13, padding: '15px 28px', fontSize: 15 }}>
                  Ver planes
                </button>
              </div>

              <div style={{ display: 'flex', gap: 28, flexWrap: 'wrap' }}>
                {['Sin tarjeta de crédito', 'Cancelación inmediata', 'Soporte en español'].map(f => (
                  <div key={f} style={{ display: 'flex', alignItems: 'center', gap: 7, fontSize: 12.5, color: 'var(--t2)' }}>
                    <span style={{ color: 'var(--mg)' }}><Icon.Check /></span>
                    {f}
                  </div>
                ))}
              </div>
            </div>

            {/* Right — Slider */}
            <div className={`tp-reveal-r tp-hero-right ${heroVis ? 'tp-visible' : ''}`} style={{ flexShrink: 0 }}>
              <HeroImageSlider />
            </div>

          </div>
        </div>
      </section>

      {/* (Stats strip removed for MVP) */}

      {/* ── Feature Grid ── */}
      <section aria-label="Características principales de Tempos" style={{ padding: '40px 48px 100px', borderBottom: '1px solid var(--border)' }}>
        <div style={{ maxWidth: 1180, margin: '0 auto' }}>
          <h2 className="tp-visually-hidden">Características principales de Tempos</h2>
          <div className="tp-grid-5">
            {[
              { ic: Icon.Zap, t: 'Automatización', d: 'Configura horarios y avisos para reducir olvidos y tareas repetitivas.' },
              { ic: Icon.MapPin, t: 'Geolocalización', d: 'Valida fichajes remotos o en movilidad con contexto de ubicación.' },
              { ic: Icon.Edit, t: 'Gestión de incidencias', d: 'Corrige olvidos y revisa cambios con trazabilidad.' },
              { ic: Icon.Bell, t: 'Comunicación', d: 'Gestiona ausencias, solicitudes y avisos desde un único canal.' },
              { ic: Icon.Report, t: 'Informes', d: 'Exporta información clara para dirección, gestoría o inspección.' },
            ].map(f => (
              <div key={f.t} className="tp-card" style={{ padding: 24, borderRadius: 20, textAlign: 'center' }}>
                <div style={{ color: 'var(--mg)', marginBottom: 16, display: 'flex', justifyContent: 'center' }}><f.ic /></div>
                <h3 style={{ fontSize: 15, fontWeight: 700, color: 'var(--t0)', marginBottom: 8 }}>{f.t}</h3>
                <div style={{ fontSize: 12.5, color: 'var(--t2)', lineHeight: 1.5 }}>{f.d}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Benefits ── */}
      <section id="producto" ref={benefitsRef} aria-label="Beneficios del software de control horario Tempos" style={{ padding: 'clamp(60px,8vw,110px) clamp(18px,4vw,48px)', position: 'relative', zIndex: 1 }}>
        <div style={{ maxWidth: 1180, margin: '0 auto' }}>
          <div className={`tp-reveal ${benefitsVis ? 'tp-visible' : ''}`} style={{ textAlign: 'center', marginBottom: 64 }}>
            <span className="tp-label">Control y cumplimiento</span>
            <h2 style={{ fontFamily: 'var(--ff-head)', fontSize: 48, fontWeight: 600, letterSpacing: 0.5, color: 'var(--t0)', marginBottom: 14 }}>
              Un sistema de registro horario<br/>útil para la gestión diaria.
            </h2>
            <p style={{ fontSize: 15.5, color: 'var(--t1)', maxWidth: 500, margin: '0 auto', lineHeight: 1.65, fontWeight: 300 }}>
              Tempos cubre el registro de jornada laboral exigido por ley y ayuda a ordenar la operativa diaria de equipos, turnos y ausencias.
            </p>
          </div>

          <div className="tp-grid-4">
            {benefits.map(({ Icon: Ic, title, desc }, i) => (
              <div
                key={title}
                className={`tp-card tp-reveal ${benefitsVis ? 'tp-visible' : ''} tp-d${i}`}
                style={{ borderRadius: 20, padding: '32px 28px' }}
              >
                <div style={{
                  width: 46, height: 46, borderRadius: 13, marginBottom: 22,
                  background: 'rgba(37,99,235,0.09)',
                  border: '1px solid rgba(37,99,235,0.18)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  color: 'var(--mg)',
                  transition: 'background 0.3s ease',
                }}>
                  <Ic />
                </div>
                <h3 style={{ fontFamily: 'var(--ff-head)', fontSize: 15.5, fontWeight: 700, color: 'var(--t0)', marginBottom: 10, letterSpacing: -0.3, lineHeight: 1.3 }}>{title}</h3>
                <p style={{ fontSize: 13, color: 'var(--t1)', lineHeight: 1.65, fontWeight: 300 }}>{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Feature Showcase ── */}
      <section ref={showcaseRef} aria-label="Imágenes del software de control horario Tempos en uso" style={{ padding: '0 clamp(18px,4vw,48px) clamp(56px,7vw,96px)', position: 'relative', zIndex: 1, borderTop: '1px solid var(--border)' }}>
        <div style={{ maxWidth: 1180, margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: 72 }}>
            <span className="tp-label">Software en acción</span>
            <h2 style={{ fontFamily: 'var(--ff-head)', fontSize: 44, fontWeight: 600, color: 'var(--t0)', marginBottom: 14, lineHeight: 1.12 }}>
              Diseñado para el trabajo real
            </h2>
            <p style={{ fontSize: 15.5, color: 'var(--t1)', maxWidth: 520, margin: '0 auto', lineHeight: 1.65, fontWeight: 300 }}>
              Desde el fichaje diario hasta los informes de fin de mes: Tempos cubre cada punto del ciclo de gestión horaria.
            </p>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 'clamp(52px,7vw,88px)' }}>
            {showcase.map((item, i) => (
              <div
                key={item.title}
                className={`tp-reveal ${showcaseVis ? 'tp-visible' : ''} tp-d${i}`}
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
                  gap: 'clamp(28px,5vw,64px)',
                  alignItems: 'center',
                }}
              >
                {/* Image side */}
                <div
                  style={{
                    order: i % 2 === 0 ? 0 : 1,
                    borderRadius: 20, overflow: 'hidden',
                    border: '1px solid var(--border)',
                    position: 'relative', flexShrink: 0,
                  }}
                >
                  <img
                    src={item.img}
                    alt={item.alt}
                    style={{ width: '100%', height: 'clamp(220px,28vw,360px)', objectFit: 'cover', display: 'block' }}
                    loading="lazy"
                  />
                  <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top, rgba(10,10,10,0.32) 0%, transparent 55%)' }} aria-hidden="true" />
                </div>
                {/* Text side */}
                <div style={{ order: i % 2 === 0 ? 1 : 0 }}>
                  <span className="tp-label" style={{ marginBottom: 16, display: 'inline-block' }}>{item.label}</span>
                  <h3 style={{ fontFamily: 'var(--ff-head)', fontSize: 'clamp(22px,3vw,30px)', fontWeight: 600, color: 'var(--t0)', marginBottom: 16, lineHeight: 1.22, letterSpacing: -0.4 }}>{item.title}</h3>
                  <p style={{ fontSize: 15, color: 'var(--t1)', lineHeight: 1.72, fontWeight: 300 }}>{item.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Core modules ── */}
      <section aria-label="Funcionalidades clave del software de control horario" style={{ padding: '0 clamp(18px,4vw,48px) clamp(56px,7vw,100px)', position: 'relative', zIndex: 1, overflow: 'hidden' }}>
        <div style={{ maxWidth: 1180, margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: 34 }}>
            <span className="tp-label">Funcionalidades clave</span>
            <h2 style={{ fontFamily: 'var(--ff-head)', fontSize: 42, fontWeight: 600, color: 'var(--t0)', marginBottom: 14, lineHeight: 1.15 }}>
              Todo lo necesario para controlar la jornada
            </h2>
            <p style={{ fontSize: 15.5, color: 'var(--t1)', lineHeight: 1.7, maxWidth: 760, margin: '0 auto', fontWeight: 300 }}>
              Tempos combina software de control horario, gestión de equipo y cumplimiento legal en tres módulos conectados para que no dependas de hojas de cálculo ni procesos manuales.
            </p>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16 }}>
            {modules.map((item) => (
              <div key={item.title} className="tp-card" style={{ borderRadius: 22, padding: '30px 28px' }}>
                <h3 style={{ fontFamily: 'var(--ff-head)', fontSize: 19, color: 'var(--t0)', marginBottom: 10 }}>{item.title}</h3>
                <p style={{ fontSize: 13.5, color: 'var(--t1)', lineHeight: 1.65, marginBottom: 16 }}>{item.desc}</p>
                <p style={{ fontSize: 12.5, color: 'var(--mg)', lineHeight: 1.5, fontWeight: 600 }}>{item.cta}</p>
              </div>
            ))}
          </div>

          <div style={{ marginTop: 22, border: '1px solid var(--border)', borderRadius: 20, padding: '18px 20px', background: 'rgba(255,255,255,0.015)' }}>
            <p style={{ fontSize: 13.5, color: 'var(--t1)', lineHeight: 1.7 }}>
              Además, puedes activar reglas de geolocalización, validación por IP y modo offline para adaptarte a entornos presenciales, remotos o mixtos.
            </p>
          </div>
        </div>
      </section>

      {/* ── Target profiles ── */}
      <section aria-label="Para quién es Tempos" style={{ padding: '0 48px 96px', position: 'relative', zIndex: 1 }}>
        <div style={{ maxWidth: 1180, margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: 34 }}>
            <span className="tp-label">Tipos de empresa</span>
            <h2 style={{ fontFamily: 'var(--ff-head)', fontSize: 40, fontWeight: 600, color: 'var(--t0)', marginBottom: 12 }}>
              Adaptado a distintas formas de trabajo
            </h2>
            <p style={{ fontSize: 15, color: 'var(--t1)', lineHeight: 1.7, maxWidth: 760, margin: '0 auto', fontWeight: 300 }}>
              Desde autónomos hasta pymes con varios turnos o centros: Tempos se adapta a la operativa real y reduce el tiempo dedicado al control de jornada.
            </p>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16 }}>
            {targetProfiles.map((item) => (
              <div key={item.title} className="tp-card" style={{ borderRadius: 20, padding: '26px 24px' }}>
                <h3 style={{ fontFamily: 'var(--ff-head)', fontSize: 18, fontWeight: 600, color: 'var(--t0)', marginBottom: 9 }}>{item.title}</h3>
                <p style={{ fontSize: 13.5, color: 'var(--t1)', lineHeight: 1.65 }}>{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── How it works ── */}
      <section id="proceso" ref={stepsRef} aria-label="Cómo usar Tempos — 3 pasos para empezar" style={{
        padding: 'clamp(56px,7vw,100px) clamp(18px,4vw,48px)',
        background: 'rgba(255,255,255,0.012)',
        borderTop: '1px solid var(--border)',
        borderBottom: '1px solid var(--border)',
        position: 'relative', zIndex: 1,
      }}>
        <div style={{ maxWidth: 860, margin: '0 auto' }}>
          <div className={`tp-reveal ${stepsVis ? 'tp-visible' : ''}`} style={{ textAlign: 'center', marginBottom: 72 }}>
            <span className="tp-label">Despliegue instantáneo</span>
            <h2 style={{ fontFamily: 'var(--ff-head)', fontSize: 48, fontWeight: 600, letterSpacing: 0.5, color: 'var(--t0)' }}>
              100% operativo hoy mismo
            </h2>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
            {steps.map(({ n, title, desc }, i) => (
              <div
                key={n}
                className={`tp-reveal ${stepsVis ? 'tp-visible' : ''} tp-d${i}`}
                style={{
                  display: 'flex', gap: 36, alignItems: 'flex-start',
                  padding: '36px 0',
                  borderBottom: i < steps.length - 1 ? '1px solid var(--border)' : 'none',
                }}
              >
                <div style={{ position: 'relative', flexShrink: 0 }}>
                  <div style={{
                    width: 52, height: 52, borderRadius: 16,
                    background: 'rgba(37,99,235,0.1)',
                    border: '1px solid rgba(37,99,235,0.22)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontFamily: 'var(--ff-mono)', fontSize: 16, fontWeight: 700, color: 'var(--mg)',
                    letterSpacing: -0.5,
                  }}>
                    {n}
                  </div>
                </div>
                <div style={{ paddingTop: 12 }}>
                  <h3 style={{ fontFamily: 'var(--ff-head)', fontSize: 20, fontWeight: 700, color: 'var(--t0)', marginBottom: 10, letterSpacing: -0.5 }}>{title}</h3>
                  <p style={{ fontSize: 14, color: 'var(--t1)', lineHeight: 1.7, maxWidth: 540, fontWeight: 300 }}>{desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Use cases ── */}
      <section aria-label="Razones operativas y casos de uso de Tempos" style={{ padding: 'clamp(52px,6vw,88px) clamp(18px,4vw,48px)', position: 'relative', zIndex: 1 }}>
        <div style={{ maxWidth: 1180, margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: 36 }}>
            <span className="tp-label">Casos de uso</span>
            <h2 style={{ fontFamily: 'var(--ff-head)', fontSize: 42, fontWeight: 600, color: 'var(--t0)', marginBottom: 14 }}>
              Cuándo tiene sentido implantar Tempos
            </h2>
            <p style={{ fontSize: 15.5, color: 'var(--t1)', lineHeight: 1.7, maxWidth: 760, margin: '0 auto', fontWeight: 300 }}>
              El valor no está solo en fichar. Está en reducir tiempo administrativo, ordenar incidencias y disponer de información fiable cuando la empresa la necesita.
            </p>
          </div>

          <div className="tp-grid-3" style={{ marginBottom: 18 }}>
            {proofItems.map((item) => (
              <div key={item.value} className="tp-card" style={{ borderRadius: 20, padding: '26px 22px', textAlign: 'center' }}>
                <div style={{ fontFamily: 'var(--ff-head)', fontSize: 32, fontWeight: 600, color: 'var(--mg)', marginBottom: 8 }}>{item.value}</div>
                <p style={{ fontSize: 13.5, color: 'var(--t1)', lineHeight: 1.65 }}>{item.label}</p>
              </div>
            ))}
          </div>

          <div className="tp-grid-3">
            {useCases.map((item) => (
              <div key={item.name} className="tp-card" style={{ borderRadius: 20, padding: '24px 22px' }}>
                <p style={{ fontSize: 14, color: 'var(--t0)', lineHeight: 1.75, marginBottom: 14 }}>
                  {item.quote}
                </p>
                <div style={{ fontSize: 12.5, color: 'var(--mg)', fontWeight: 600 }}>{item.name}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── FAQs ── */}
      <section aria-label="Preguntas frecuentes sobre el software de control horario" style={{ padding: '0 clamp(18px,4vw,48px) clamp(56px,7vw,100px)', position: 'relative', zIndex: 1 }}>
        <div style={{ maxWidth: 980, margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: 34 }}>
            <span className="tp-label">FAQs</span>
            <h2 style={{ fontFamily: 'var(--ff-head)', fontSize: 40, fontWeight: 600, color: 'var(--t0)', marginBottom: 12 }}>
              Respuestas claras antes de empezar
            </h2>
            <p style={{ fontSize: 15, color: 'var(--t1)', lineHeight: 1.7, maxWidth: 740, margin: '0 auto', fontWeight: 300 }}>
              Todo lo que suele preguntar una empresa antes de implantar un software de control horario y registro de jornada laboral.
            </p>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {faqs.map((item) => (
              <div key={item.q} className="tp-card" style={{ borderRadius: 16, padding: '18px 20px' }}>
                <h3 style={{ fontSize: 15.5, color: 'var(--t0)', marginBottom: 8 }}>{item.q}</h3>
                <p style={{ fontSize: 13.5, color: 'var(--t1)', lineHeight: 1.65 }}>{item.a}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Comparison ── */}
      <section aria-label="Comparativa entre control manual y control horario digital" style={{ padding: '0 48px 88px', position: 'relative', zIndex: 1 }}>
        <div style={{ maxWidth: 980, margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: 30 }}>
            <span className="tp-label">Comparativa</span>
            <h2 style={{ fontFamily: 'var(--ff-head)', fontSize: 40, fontWeight: 600, color: 'var(--t0)', marginBottom: 12 }}>
              Seguir con papel cuesta más de lo que parece
            </h2>
            <p style={{ fontSize: 15, color: 'var(--t1)', lineHeight: 1.7, maxWidth: 720, margin: '0 auto', fontWeight: 300 }}>
              Si el control horario depende de procesos manuales, la empresa pierde tiempo, consistencia y capacidad de respuesta ante incidencias o requerimientos de documentación.
            </p>
          </div>

          <div className="tp-card" style={{ borderRadius: 22, overflow: 'hidden' }}>
            {compareRows.map((row, index) => (
              <div key={row[0]} className="tp-compare-row" style={{ borderBottom: index < compareRows.length - 1 ? '1px solid var(--border)' : 'none' }}>
                <div style={{ padding: '18px 20px', background: index === 1 ? 'rgba(37,99,235,0.08)' : 'rgba(255,255,255,0.02)', fontSize: 14, fontWeight: 700, color: index === 1 ? 'var(--mg)' : 'var(--t0)' }}>
                  {row[0]}
                </div>
                <div style={{ padding: '18px 20px', fontSize: 13.5, color: 'var(--t1)', lineHeight: 1.65 }}>
                  {row[1]}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Mid CTA ── */}
      <section aria-label="Llamada a la acción antes de precios" style={{ padding: '0 clamp(18px,4vw,48px) clamp(52px,6vw,88px)', position: 'relative', zIndex: 1 }}>
        <div style={{ maxWidth: 980, margin: '0 auto', border: '1px solid rgba(37,99,235,0.24)', background: 'linear-gradient(180deg, rgba(37,99,235,0.09), rgba(255,255,255,0.015))', borderRadius: 24, padding: '30px 30px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 20, flexWrap: 'wrap' }}>
          <div>
            <h2 style={{ fontFamily: 'var(--ff-head)', fontSize: 28, fontWeight: 600, color: 'var(--t0)', marginBottom: 8 }}>
              Empieza a digitalizar el control horario sin complicarte
            </h2>
            <p style={{ fontSize: 14.5, color: 'var(--t1)', lineHeight: 1.7, maxWidth: 620 }}>
              Prueba Tempos con tu operativa real y evalúa en pocos días cómo mejora el control del equipo, la gestión de incidencias y la preparación de documentación.
            </p>
          </div>
          <button onClick={() => navigate('/trial')} className="tp-btn tp-btn-primary" style={{ borderRadius: 13, padding: '15px 24px', fontSize: 14.5, flexShrink: 0 }}>
            Solicitar prueba
          </button>
        </div>
      </section>

      {/* ── Pricing ── */}
      <section id="precios" ref={pricingRef} aria-label="Precios de Tempos — Planes para autónomos y empresas" style={{
        padding: 'clamp(60px,8vw,120px) clamp(18px,4vw,48px) clamp(70px,9vw,140px)', borderTop: '1px solid var(--border)', overflow: 'hidden',
        background: 'rgba(255,255,255,0.012)',
        position: 'relative', zIndex: 1,
      }}>
        <div style={{ maxWidth: 920, margin: '0 auto' }}>
          <div className={`tp-reveal ${pricingVis ? 'tp-visible' : ''}`} style={{ textAlign: 'center', marginBottom: 64 }}>
            <span className="tp-label">Precios</span>
            <h2 style={{ fontFamily: 'var(--ff-head)', fontSize: 48, fontWeight: 600, letterSpacing: 0.5, color: 'var(--t0)', marginBottom: 12 }}>
              Transparente, sin sorpresas
            </h2>
            <p style={{ fontSize: 15, color: 'var(--t1)', fontWeight: 300 }}>14 días de prueba gratuita. Sin tarjeta de crédito. Sin permanencia.</p>
          </div>

          <div className="tp-grid-2">

            {/* Autónomos */}
            <div className={`tp-card tp-reveal ${pricingVis ? 'tp-visible' : ''}`} style={{ borderRadius: 24, padding: 44 }}>
              <div style={{ fontSize: 10.5, letterSpacing: 2.5, textTransform: 'uppercase', color: 'var(--t2)', marginBottom: 22, fontWeight: 600 }}>Autónomos</div>
              <div style={{ display: 'flex', alignItems: 'flex-end', gap: 6, marginBottom: 8 }}>
                <span style={{ fontFamily: 'var(--ff-head)', fontSize: 52, fontWeight: 600, letterSpacing: 0, color: 'var(--t0)', lineHeight: 1 }}>9€</span>
                <span style={{ fontSize: 13, color: 'var(--t2)', marginBottom: 8, fontWeight: 300 }}>/mes</span>
              </div>
              <p style={{ fontSize: 13, color: 'var(--t1)', marginBottom: 32, lineHeight: 1.6, fontWeight: 300 }}>Para trabajadores por cuenta propia que necesitan registrar su jornada con precisión.</p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 13, marginBottom: 36 }}>
                {['1 usuario', 'Registro de jornada ilimitado', 'Exportación PDF y Excel', 'Acceso web y móvil', 'Soporte por correo'].map(f => (
                  <div key={f} style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: 13.5, color: 'var(--t1)' }}>
                    <span style={{ color: 'var(--mg)', flexShrink: 0 }}><Icon.Check /></span> {f}
                  </div>
                ))}
              </div>
              <button className="tp-btn" style={{
                width: '100%', padding: '14px', borderRadius: 13,
                background: 'rgba(37,99,235,0.1)',
                border: '1px solid rgba(37,99,235,0.25)',
                color: 'var(--mg)', fontSize: 14.5, cursor: 'pointer',
              }}>
                Empezar ahora
              </button>
            </div>

            {/* Empresas */}
            <div className={`tp-price-featured tp-reveal tp-d1 ${pricingVis ? 'tp-visible' : ''}`} style={{ borderRadius: 24, padding: 44, background: 'var(--bg2)', position: 'relative', overflow: 'hidden' }}>
              <div style={{ position: 'absolute', top: -1, right: 32 }}>
                <div style={{ background: 'var(--mg)', color: '#fff', fontSize: 10, fontWeight: 700, padding: '5px 14px', borderRadius: '0 0 10px 10px', letterSpacing: 1, textTransform: 'uppercase' }}>
                  Más popular
                </div>
              </div>
              {/* Ambient */}
              <div style={{ position: 'absolute', top: -80, right: -80, width: 260, height: 260, borderRadius: '50%', background: 'radial-gradient(circle, rgba(37,99,235,0.09) 0%, transparent 70%)', pointerEvents: 'none' }}/>
              <div style={{ fontSize: 10.5, letterSpacing: 2.5, textTransform: 'uppercase', color: 'rgba(37,99,235,0.65)', marginBottom: 22, fontWeight: 600, position: 'relative' }}>Empresas</div>
              <div style={{ display: 'flex', alignItems: 'flex-end', gap: 6, marginBottom: 8, position: 'relative' }}>
                <span style={{ fontFamily: 'var(--ff-head)', fontSize: 52, fontWeight: 600, letterSpacing: 0, color: 'var(--t0)', lineHeight: 1 }}>4€</span>
                <span style={{ fontSize: 13, color: 'var(--t2)', marginBottom: 8, fontWeight: 300 }}>/empleado/mes</span>
              </div>
              <p style={{ fontSize: 13, color: 'var(--t1)', marginBottom: 32, lineHeight: 1.6, fontWeight: 300, position: 'relative' }}>Para equipos de cualquier tamaño. Gestión completa sin límite de empleados ni sedes.</p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 13, marginBottom: 36, position: 'relative' }}>
                {['Empleados ilimitados', 'Panel de administración completo', 'Gestión de turnos y ausencias', 'Informes para Inspección de Trabajo', 'Soporte prioritario', 'API e integraciones con nóminas'].map(f => (
                  <div key={f} style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: 13.5, color: 'var(--t1)' }}>
                    <span style={{ color: 'var(--mg)', flexShrink: 0 }}><Icon.Check /></span> {f}
                  </div>
                ))}
              </div>
              <button className="tp-btn tp-btn-primary" style={{ width: '100%', padding: '14px', borderRadius: 13, fontSize: 14.5, position: 'relative', cursor: 'pointer' }}>
                Empezar ahora
              </button>
            </div>
          </div>

          <p style={{ textAlign: 'center', marginTop: 24, fontSize: 12.5, color: 'var(--t3)' }}>
            ¿Más de 100 empleados?{' '}
            <Link to="/contacto" style={{ color: 'var(--mg)', textDecoration: 'none', fontWeight: 600 }}>Contáctanos para un plan personalizado</Link>
          </p>
        </div>
      </section>

      {/* ── Final CTA ── */}
      <section aria-label="Empieza a usar Tempos hoy" style={{ padding: 'clamp(60px,8vw,120px) clamp(18px,4vw,48px)', textAlign: 'center', position: 'relative', zIndex: 1, overflow: 'hidden' }}>
        <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%,-50%)', width: 800, height: 400, background: 'radial-gradient(ellipse, rgba(37,99,235,0.1) 0%, transparent 65%)', pointerEvents: 'none' }}/>
        <div style={{ maxWidth: 640, margin: '0 auto', position: 'relative' }}>
          <span className="tp-label">Transformación inmediata</span>
          <h2 style={{ fontFamily: 'var(--ff-head)', fontSize: 56, fontWeight: 600, letterSpacing: 0.5, color: 'var(--t0)', marginBottom: 18, lineHeight: 1.08 }}>
            Es hora de liderar<br/>con mejores datos.
          </h2>
          <p style={{ fontSize: 16, color: 'var(--t1)', marginBottom: 44, lineHeight: 1.7, fontWeight: 300 }}>
            Únete a cientos de empresas líderes que ya protegen sus márgenes y blindan su cumplimiento legal con Tempos.
          </p>
            <button onClick={() => navigate('/register')} className="tp-btn tp-btn-primary" style={{
              borderRadius: 14, padding: '18px 40px', fontSize: 16.5, display: 'inline-flex', alignItems: 'center', gap: 10,
            }}>
              Empezar ahora <Icon.ArrowRight />
            </button>
        </div>
      </section>

      </main>

      {/* ── Footer ── */}
      <footer role="contentinfo" style={{
        borderTop: '1px solid var(--border)',
        padding: '36px 48px',
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        flexWrap: 'wrap', gap: 20, position: 'relative', zIndex: 1,
        background: 'rgba(255,255,255,0.008)',
      }}>
        <span style={{ fontFamily: 'var(--ff-head)', fontSize: 24, fontWeight: 600, letterSpacing: 1.5, color: 'var(--t0)' }}>
          Tem<span style={{ color: 'var(--mg)' }}>pos</span>
        </span>
        <div style={{ display: 'flex', gap: 30 }}>
          <a href="#" onClick={(e) => e.preventDefault()} style={{ fontSize: 12.5, color: 'var(--t3)', textDecoration: 'none', transition: 'color 0.2s' }} onMouseEnter={e => e.target.style.color = 'var(--t0)'} onMouseLeave={e => e.target.style.color = 'var(--t3)'}>Legal</a>
          <a href="#" onClick={(e) => e.preventDefault()} style={{ fontSize: 12.5, color: 'var(--t3)', textDecoration: 'none', transition: 'color 0.2s' }} onMouseEnter={e => e.target.style.color = 'var(--t0)'} onMouseLeave={e => e.target.style.color = 'var(--t3)'}>Privacidad</a>
          <a href="#" onClick={(e) => e.preventDefault()} style={{ fontSize: 12.5, color: 'var(--t3)', textDecoration: 'none', transition: 'color 0.2s' }} onMouseEnter={e => e.target.style.color = 'var(--t0)'} onMouseLeave={e => e.target.style.color = 'var(--t3)'}>Cookies</a>
          <Link to="/contacto" style={{ fontSize: 12.5, color: 'var(--t3)', textDecoration: 'none', transition: 'color 0.2s' }} onMouseEnter={e => e.target.style.color = 'var(--t0)'} onMouseLeave={e => e.target.style.color = 'var(--t3)'}>Contacto</Link>
        </div>
        <p style={{ fontSize: 11.5, color: 'var(--t3)' }}>© 2026 Tempos. Todos los derechos reservados.</p>
      </footer>
    </div>
  );
}
