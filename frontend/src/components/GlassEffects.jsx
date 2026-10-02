import { useEffect, useRef } from 'react';

// Exact Theme and Palette definitions matching template.html
const THEMES = {
  red: {
    mode: 'dark',
    bg: '#020203',
    line: '255,255,255',
    a: [230, 40, 32],
    b: [255, 240, 230],
    fr: '255,110,90',
    g1: '230,43,30',
    g2: '245,244,242',
    dust: '230,43,30',
    dust2: '245,244,242',
  },
  white: {
    mode: 'light',
    bg: '#f3f3f6',
    line: '0,0,0',
    a: [212, 34, 21],
    b: [40, 40, 52],
    fr: '212,34,21',
    g1: '212,34,21',
    g2: '40,40,52',
    dust: '212,34,21',
    dust2: '30,30,38',
  },
  matrix: {
    mode: 'matrix',
    bg: '#000a04',
    line: '0,255,120',
    a: [0, 200, 90],
    b: [170, 255, 205],
    fr: '80,255,150',
    g1: '0,230,118',
    g2: '200,255,220',
    dust: '0,230,118',
    dust2: '214,255,228',
  },
  marvel: {
    mode: 'marvel',
    bg: '#070b1c',
    line: '255,255,255',
    a: [226, 54, 54],
    b: [245, 197, 66],
    fr: '245,197,66',
    g1: '226,54,54',
    g2: '245,197,66',
    dust: '226,54,54',
    dust2: '245,197,66',
  },
  cyberpunk: {
    mode: 'cyberpunk',
    bg: '#0a0420',
    line: '0,229,255',
    a: [255, 43, 214],
    b: [0, 229, 255],
    fr: '0,229,255',
    g1: '255,43,214',
    g2: '0,229,255',
    dust: '255,43,214',
    dust2: '0,229,255',
  },
  maths: {
    mode: 'maths',
    bg: '#0e231d',
    line: '244,241,232',
    a: [255, 209, 102],
    b: [124, 199, 255],
    fr: '255,209,102',
    g1: '255,209,102',
    g2: '124,199,255',
    dust: '255,209,102',
    dust2: '244,241,232',
  },
  gotham: {
    mode: 'gotham',
    bg: '#05060a',
    line: '255,255,255',
    a: [255, 212, 0],
    b: [142, 162, 189],
    fr: '255,212,0',
    g1: '255,212,0',
    g2: '142,162,189',
    dust: '255,212,0',
    dust2: '142,162,189',
  },
};

const PALS = {
  dark: { base: [3, 3, 4], hot: [95, 3, 3], cool: [38, 90, 88] },
  light: { base: [243, 243, 246], hot: [10, -34, -36], cool: [-16, -12, -4] },
  matrix: { base: [0, 8, 4], hot: [0, 70, 32], cool: [24, 62, 44] },
  marvel: { base: [5, 8, 24], hot: [100, 8, 10], cool: [84, 66, 6] },
  cyberpunk: { base: [8, 3, 22], hot: [112, 6, 92], cool: [0, 82, 98] },
  maths: { base: [12, 32, 26], hot: [56, 46, 6], cool: [10, 44, 66] },
  gotham: { base: [4, 5, 8], hot: [96, 80, 0], cool: [30, 38, 54] },
};

function getThemeConfig() {
  const t = document.documentElement.getAttribute('data-theme') || 'red';
  return THEMES[t] || THEMES.red;
}

export default function GlassEffects() {
  const glassRef = useRef(null);
  const shardRef = useRef(null);
  const fieldRef = useRef(null);
  const fracturesRef = useRef([]);
  const dustRef = useRef([]);
  const mouseRef = useRef({ x: -999, y: -999 });
  const animRef = useRef(null);
  const themeRef = useRef(getThemeConfig());

  useEffect(() => {
    const canvas = glassRef.current;
    const cCanvas = shardRef.current;
    if (!canvas || !cCanvas) return;

    const ctx = canvas.getContext('2d');
    const cCtx = cCanvas.getContext('2d');
    const isTouch = window.matchMedia('(pointer:coarse)').matches;
    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    let width, height, cWidth, cHeight;
    let scrollOffset = 0;
    let smoothVelocity = 0;
    let prevScroll = 0;

    function resize() {
      width = canvas.width = window.innerWidth;
      height = canvas.height = window.innerHeight;
      cWidth = cCanvas.width = window.innerWidth;
      cHeight = cCanvas.height = window.innerHeight;
    }

    resize();
    window.addEventListener('resize', resize, { passive: true });

    // Build low-poly field matching template.html
    function buildField() {
      const cellSize = isTouch ? Math.max(78, width / 5) : 128;
      const cols = Math.ceil(width / cellSize) + 2;
      const rows = Math.ceil(height / cellSize) + 2;
      const jitter = cellSize * 0.42;
      const idOf = (r, c) => r * (cols + 1) + c;
      const pts = [];
      for (let r = 0; r <= rows; r++) {
        for (let c = 0; c <= cols; c++) {
          pts[idOf(r, c)] = {
            x: c * cellSize - cellSize + (Math.random() - 0.5) * jitter,
            y: r * cellSize - cellSize + (Math.random() - 0.5) * jitter,
          };
        }
      }
      const tris = [];
      const edgeMap = new Map();
      const addEdge = (i1, i2) => {
        const key = i1 < i2 ? i1 + '_' + i2 : i2 + '_' + i1;
        if (!edgeMap.has(key)) edgeMap.set(key, [i1, i2]);
      };
      for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
          const a = idOf(r, c),
            b = idOf(r, c + 1),
            cc = idOf(r + 1, c),
            d = idOf(r + 1, c + 1);
          if ((r + c) % 2 === 0) {
            tris.push([a, b, cc]);
            tris.push([b, d, cc]);
            addEdge(a, b);
            addEdge(a, cc);
            addEdge(b, cc);
            addEdge(b, d);
            addEdge(d, cc);
          } else {
            tris.push([a, b, d]);
            tris.push([a, d, cc]);
            addEdge(a, b);
            addEdge(b, d);
            addEdge(a, d);
            addEdge(a, cc);
            addEdge(d, cc);
          }
        }
      }
      fieldRef.current = { pts, tris, edges: Array.from(edgeMap.values()) };
    }
    buildField();

    let rebuildTimer = null;
    const handleRebuild = () => {
      clearTimeout(rebuildTimer);
      rebuildTimer = setTimeout(buildField, 220);
    };
    window.addEventListener('resize', handleRebuild, { passive: true });

    // Listen to theme change events and observe data-theme attribute
    const updateTheme = () => {
      themeRef.current = getThemeConfig();
    };
    window.addEventListener('tedx-theme', updateTheme);
    window.addEventListener('tedx-theme-change', updateTheme);

    const observer = new MutationObserver(() => {
      updateTheme();
    });
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['data-theme', 'class'],
    });

    function drawField(t, stress) {
      const field = fieldRef.current;
      if (!field) return;
      const { pts, tris, edges } = field;
      const curT = themeRef.current || getThemeConfig();
      const PL = PALS[curT.mode] || PALS.dark;

      const lx1 = width * 0.3 + Math.sin(t * 0.11) * width * 0.16;
      const ly1 = height * 0.26 + Math.cos(t * 0.09) * height * 0.14;
      const lx2 = width * 0.74 + Math.cos(t * 0.1) * width * 0.18;
      const ly2 = height * 0.8 + Math.sin(t * 0.08) * height * 0.16;
      const reach = Math.max(width, height) * 0.62;

      ctx.save();
      tris.forEach((tri, ti) => {
        const p0 = pts[tri[0]],
          p1 = pts[tri[1]],
          p2 = pts[tri[2]];
        const mx = (p0.x + p1.x + p2.x) / 3,
          my = (p0.y + p1.y + p2.y) / 3;
        const d1 = Math.hypot(mx - lx1, my - ly1);
        const d2 = Math.hypot(mx - lx2, my - ly2);
        const inf1 = Math.max(0, 1 - d1 / reach);
        const inf2 = Math.max(0, 1 - d2 / reach);
        const flick = 0.9 + 0.1 * Math.sin(ti * 3.71 + t * 2.3);

        const r = Math.max(0, Math.min(255, PL.base[0] + inf2 * PL.hot[0] * flick + inf1 * PL.cool[0] * flick));
        const g = Math.max(0, Math.min(255, PL.base[1] + inf2 * PL.hot[1] * flick + inf1 * PL.cool[1] * flick));
        const b = Math.max(0, Math.min(255, PL.base[2] + inf2 * PL.hot[2] * flick + inf1 * PL.cool[2] * flick));

        ctx.beginPath();
        ctx.moveTo(p0.x, p0.y);
        ctx.lineTo(p1.x, p1.y);
        ctx.lineTo(p2.x, p2.y);
        ctx.closePath();
        ctx.fillStyle = `rgb(${r | 0},${g | 0},${b | 0})`;
        ctx.fill();
      });

      // Dim base hairlines
      ctx.strokeStyle = `rgba(${curT.line}, ${curT.mode === 'light' ? 0.07 : 0.035})`;
      ctx.lineWidth = 1;
      edges.forEach(([i1, i2]) => {
        const p1 = pts[i1],
          p2 = pts[i2];
        ctx.beginPath();
        ctx.moveTo(p1.x, p1.y);
        ctx.lineTo(p2.x, p2.y);
        ctx.stroke();
      });

      // Traveling cracks racing along the fracture lines
      const threshold = 0.86 - stress * 0.1;
      edges.forEach(([i1, i2], idx) => {
        const p1 = pts[i1],
          p2 = pts[i2];
        const mx = (p1.x + p2.x) / 2,
          my = (p1.y + p2.y) / 2;
        const sweep = Math.sin(mx * 0.0072 + my * 0.0048 - t * 2.1 + (idx % 17) * 0.37) * 0.5 + 0.5;
        if (sweep < threshold) return;
        const heat = (sweep - threshold) / (1 - threshold);
        const colorMix = Math.sin(t * 0.35 + idx * 0.9) * 0.5 + 0.5;

        const rr = curT.a[0] + colorMix * (curT.b[0] - curT.a[0]);
        const gg = curT.a[1] + colorMix * (curT.b[1] - curT.a[1]);
        const bb = curT.a[2] + colorMix * (curT.b[2] - curT.a[2]);

        ctx.strokeStyle = `rgba(${rr | 0},${gg | 0},${bb | 0},${0.28 + heat * 0.55 + stress * 0.15})`;
        ctx.lineWidth = 1 + heat * 1.4 + stress * 0.8;
        ctx.shadowBlur = 5 + heat * 14 + stress * 10;
        ctx.shadowColor = `rgba(${colorMix > 0.5 ? curT.g2 : curT.g1}, 0.9)`;
        ctx.beginPath();
        ctx.moveTo(p1.x, p1.y);
        ctx.lineTo(p2.x, p2.y);
        ctx.stroke();
        ctx.shadowBlur = 0;
      });

      // Expanding fracture bursts
      const fracs = fracturesRef.current;
      for (let i = fracs.length - 1; i >= 0; i--) {
        const f = fracs[i];
        f.life -= 0.018;
        if (f.life <= 0) {
          fracs.splice(i, 1);
          continue;
        }
        const radius = (1 - f.life) * 220;
        ctx.beginPath();
        ctx.arc(f.x, f.y, radius, 0, Math.PI * 2);
        ctx.strokeStyle = `rgba(${curT.fr},${f.life * 0.5})`;
        ctx.lineWidth = 1.4;
        ctx.shadowBlur = 16;
        ctx.shadowColor = `rgba(${curT.g1},0.8)`;
        ctx.stroke();
        ctx.shadowBlur = 0;
      }
      ctx.restore();
    }

    function spawnDust(x, y, burst) {
      const curT = themeRef.current || getThemeConfig();
      const count = burst ? 26 : 1;
      for (let i = 0; i < count; i++) {
        const ang = Math.random() * Math.PI * 2;
        const spd = burst ? 1 + Math.random() * 4 : Math.random() * 0.6;
        dustRef.current.push({
          x,
          y,
          vx: Math.cos(ang) * spd,
          vy: Math.sin(ang) * spd,
          life: 1,
          size: burst ? 1 + Math.random() * 2.4 : 0.6 + Math.random() * 1.4,
          r: Math.random() > 0.75 ? curT.dust : curT.dust2,
        });
      }
    }

    let lastDust = 0;
    let glowX = 0,
      glowY = 0,
      ringX = 0,
      ringY = 0;
    const glowEl = document.getElementById('cursor-glow');
    const ringEl = document.getElementById('cursor-ring');

    if (!isTouch) {
      window.addEventListener(
        'mousemove',
        (e) => {
          mouseRef.current = { x: e.clientX, y: e.clientY };
          const now = performance.now();
          if (!reduceMotion && now - lastDust > 40) {
            spawnDust(e.clientX, e.clientY, false);
            lastDust = now;
          }
        },
        { passive: true }
      );

      window.addEventListener('mousedown', (e) => {
        spawnDust(e.clientX, e.clientY, true);
        fracturesRef.current.push({ x: e.clientX, y: e.clientY, life: 1 });
      });

      document.querySelectorAll('a, button, .magnetic').forEach((el) => {
        el.addEventListener('mouseenter', () => ringEl?.classList.add('hover'));
        el.addEventListener('mouseleave', () => ringEl?.classList.remove('hover'));
      });
    }

    // Progress bar
    const progressFill = document.getElementById('progress-fill');
    window.addEventListener(
      'scroll',
      () => {
        scrollOffset = window.scrollY;
        const doc = document.documentElement;
        const scrollable = doc.scrollHeight - doc.clientHeight || 1;
        const pct = Math.min(100, Math.max(0, (scrollOffset / scrollable) * 100));
        if (progressFill) progressFill.style.width = pct + '%';
      },
      { passive: true }
    );

    let isReduced = document.documentElement.classList.contains('reduce-fx') || reduceMotion;
    const onFxChange = (e) => {
      isReduced = !!e.detail;
      if (isReduced) {
        ctx.clearRect(0, 0, width, height);
        cCtx.clearRect(0, 0, cWidth, cHeight);
      }
    };
    window.addEventListener('tedx-fx', onFxChange);

    // Animation loop
    function animate() {
      if (isReduced) {
        animRef.current = requestAnimationFrame(animate);
        return;
      }
      const t = performance.now() * 0.001;
      const rawVel = Math.abs(scrollOffset - prevScroll);
      prevScroll = scrollOffset;
      smoothVelocity += (rawVel - smoothVelocity) * 0.2;
      const stress = Math.min(1, smoothVelocity / 40);

      const curT = themeRef.current || getThemeConfig();
      ctx.clearRect(0, 0, width, height);
      ctx.fillStyle = curT.bg;
      ctx.fillRect(0, 0, width, height);
      drawField(t, stress);

      // Cursor trail
      if (cCtx && !isTouch) {
        cCtx.clearRect(0, 0, cWidth, cHeight);
        const dust = dustRef.current;
        for (let i = dust.length - 1; i >= 0; i--) {
          const d = dust[i];
          d.x += d.vx;
          d.y += d.vy;
          d.vx *= 0.97;
          d.vy *= 0.97;
          d.life -= 0.02;
          if (d.life <= 0) {
            dust.splice(i, 1);
            continue;
          }
          cCtx.beginPath();
          cCtx.fillStyle = `rgba(${d.r},${d.life})`;
          cCtx.arc(d.x, d.y, d.size, 0, Math.PI * 2);
          cCtx.fill();
        }
      }

      // Cursor glow follow
      if (!isTouch) {
        const { x, y } = mouseRef.current;
        glowX += (x - glowX) * 0.18;
        glowY += (y - glowY) * 0.18;
        ringX += (x - ringX) * 0.32;
        ringY += (y - ringY) * 0.32;
        if (glowEl) {
          glowEl.style.left = glowX + 'px';
          glowEl.style.top = glowY + 'px';
        }
        if (ringEl) {
          ringEl.style.left = ringX + 'px';
          ringEl.style.top = ringY + 'px';
        }
      }

      animRef.current = requestAnimationFrame(animate);
    }

    animate();

    return () => {
      cancelAnimationFrame(animRef.current);
      observer.disconnect();
      window.removeEventListener('resize', resize);
      window.removeEventListener('resize', handleRebuild);
      window.removeEventListener('tedx-fx', onFxChange);
      window.removeEventListener('tedx-theme', updateTheme);
      window.removeEventListener('tedx-theme-change', updateTheme);
    };
  }, []);

  return (
    <>
      <canvas id="glass-canvas" ref={glassRef} aria-hidden="true" />
      <canvas id="shard-canvas" ref={shardRef} aria-hidden="true" />
      <div className="grain-overlay" aria-hidden="true" />
      <div className="aurora" aria-hidden="true">
        <span />
        <span />
        <span />
      </div>
      <div id="cursor-glow" aria-hidden="true" />
      <div id="cursor-ring" aria-hidden="true" />
      <div id="progress-track" aria-hidden="true">
        <div id="progress-fill" />
      </div>
    </>
  );
}
