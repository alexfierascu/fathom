/**
 * The 404 seascape, drawn on canvas at 60fps. The water is a sum of
 * sines evaluated every frame; the sloop rides it — heave and pitch
 * come from the surface under the hull, not from a keyframe — and the
 * lighthouse beam rotates for real, brightening the boat as it sweeps
 * past. Colors are read from the design tokens so every theme works,
 * and prefers-reduced-motion gets a single still frame.
 */

interface Tokens {
  text: string;
  muted: string;
  gold: string;
  teal: string;
  panel: string;
}

interface WaveLayer {
  /** Rest height as a fraction of the canvas height. */
  base: number;
  amp: number;
  speed: number;
  alpha: number;
  fill: number;
}

const TAU = Math.PI * 2;

const LAYERS: readonly WaveLayer[] = [
  { base: 0.6, amp: 3.5, speed: 0.5, alpha: 0.22, fill: 0.02 },
  { base: 0.66, amp: 5, speed: 0.7, alpha: 0.38, fill: 0.03 },
  { base: 0.73, amp: 7, speed: 0.9, alpha: 0.6, fill: 0.04 },
  { base: 0.82, amp: 9, speed: 1.15, alpha: 0.85, fill: 0.05 },
];
const BOAT_LAYER = 2;

/** Fractional part of the golden-ratio spiral — cheap stable "random". */
const scatter = (i: number) => (i * 0.6180339887) % 1;

function withAlpha(color: string, alpha: number): string {
  const hex = /^#([0-9a-f]{6})$/i.exec(color)?.[1];
  if (hex) {
    const n = parseInt(hex, 16);
    const r = (n >> 16) & 255;
    const g = (n >> 8) & 255;
    return `rgba(${String(r)}, ${String(g)}, ${String(n & 255)}, ${String(alpha)})`;
  }
  const inner = /^rgba?\(([^)]+)\)$/.exec(color)?.[1];
  if (inner) {
    const parts = inner.split(',').map((part) => part.trim());
    const base = parts.length > 3 ? Number(parts[3]) : 1;
    return `rgba(${parts[0] ?? '255'}, ${parts[1] ?? '255'}, ${parts[2] ?? '255'}, ${String(alpha * base)})`;
  }
  return color;
}

function readTokens(): Tokens {
  const style = getComputedStyle(document.documentElement);
  const pick = (name: string, fallback: string) => style.getPropertyValue(name).trim() || fallback;
  return {
    text: pick('--text', '#f5f1e8'),
    muted: pick('--text-muted', 'rgba(245, 241, 232, 0.6)'),
    gold: pick('--accent-2', '#e7b75f'),
    teal: pick('--teal', '#2faea0'),
    panel: pick('--panel-2', '#123560'),
  };
}

export function runNotFoundScene(canvas: HTMLCanvasElement): () => void {
  const ctx = canvas.getContext('2d');
  if (!ctx) return () => undefined;

  let width = 0;
  let height = 0;
  let tokens = readTokens();
  let raf = 0;
  // The boat's smoothed pose, so it settles onto the water like a hull
  // with momentum instead of snapping to the surface.
  let boatY = Number.NaN;
  let boatAngle = 0;

  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const started = performance.now();

  const surface = (layer: WaveLayer, x: number, t: number): number => {
    const k = 560 / Math.max(width, 1);
    const s = layer.speed;
    const wave =
      0.55 * Math.sin(0.014 * x * k + t * s) +
      0.3 * Math.sin(0.027 * x * k - t * s * 0.8 + 2.1) +
      0.15 * Math.sin(0.006 * x * k + t * s * 1.4 + 4.2);
    return layer.base * height + layer.amp * (width / 560) * wave;
  };

  const slope = (layer: WaveLayer, x: number, t: number): number =>
    (surface(layer, x + 7, t) - surface(layer, x - 7, t)) / 14;

  function drawWave(layer: WaveLayer, t: number) {
    if (!ctx) return;
    ctx.beginPath();
    ctx.moveTo(-4, surface(layer, 0, t));
    for (let x = 0; x <= width + 8; x += 8) ctx.lineTo(x, surface(layer, x, t));
    ctx.lineTo(width + 4, height + 4);
    ctx.lineTo(-4, height + 4);
    ctx.closePath();
    ctx.fillStyle = withAlpha(tokens.teal, layer.fill);
    ctx.fill();
    ctx.beginPath();
    ctx.moveTo(-4, surface(layer, 0, t));
    for (let x = 0; x <= width + 8; x += 8) ctx.lineTo(x, surface(layer, x, t));
    ctx.strokeStyle = withAlpha(tokens.teal, layer.alpha);
    ctx.lineWidth = 1.4;
    ctx.stroke();
  }

  function drawStars(t: number) {
    if (!ctx) return;
    for (let i = 0; i < 16; i += 1) {
      const x = scatter(i + 1) * width;
      const y = scatter(i + 7) * height * 0.42 + 6;
      const twinkle = 0.35 + 0.3 * Math.sin(t * (0.6 + scatter(i + 3)) + i * 2.4);
      ctx.beginPath();
      ctx.arc(x, y, 1 + scatter(i + 5), 0, TAU);
      ctx.fillStyle = withAlpha(tokens.text, Math.max(0.08, twinkle));
      ctx.fill();
    }
    // A shooting star, every eleven seconds or so.
    const cycle = Math.floor(t / 11);
    const p = (t % 11) / 0.7;
    if (p < 1) {
      const sx = (0.15 + scatter(cycle) * 0.5) * width + p * 60;
      const sy = (0.08 + scatter(cycle + 4) * 0.18) * height + p * 26;
      const fade = Math.sin(p * Math.PI);
      ctx.beginPath();
      ctx.moveTo(sx - 26, sy - 11);
      ctx.lineTo(sx, sy);
      ctx.strokeStyle = withAlpha(tokens.text, 0.5 * fade);
      ctx.lineWidth = 1;
      ctx.stroke();
    }
  }

  function drawMoon() {
    if (!ctx) return;
    const x = width * 0.53;
    const y = height * 0.17;
    const r = width * 0.028;
    const glow = ctx.createRadialGradient(x, y, r * 0.4, x, y, r * 4);
    glow.addColorStop(0, withAlpha(tokens.gold, 0.12));
    glow.addColorStop(1, withAlpha(tokens.gold, 0));
    ctx.beginPath();
    ctx.arc(x, y, r * 4, 0, TAU);
    ctx.fillStyle = glow;
    ctx.fill();
    ctx.beginPath();
    ctx.arc(x, y, r, -0.6 * Math.PI, 0.7 * Math.PI);
    ctx.arc(x + r * 0.45, y - r * 0.25, r * 0.8, 0.62 * Math.PI, -0.52 * Math.PI, true);
    ctx.closePath();
    ctx.fillStyle = withAlpha(tokens.gold, 0.75);
    ctx.fill();
  }

  const lampX = () => width * 0.82;
  const lampY = () => height * 0.7 - height * 0.305;

  /**
   * The rotating light, seen side-on: the vertical component of the
   * sweep is flattened so the beam skims the horizon, and it dims as
   * it turns toward (or away from) the viewer — exactly what a real
   * lighthouse looks like from a boat.
   */
  function beamState(t: number) {
    const spin = (t * TAU) / 10;
    const c = Math.cos(spin);
    const flat = Math.sin(spin) * 0.14;
    const angle = Math.atan2(flat, c) + 0.045;
    // Fade to nothing as the beam crosses the viewer's plane — atan2
    // flips through vertical there, and a real light shows a flare at
    // the lamp in that instant, not a beam.
    const strength = Math.max(0, (Math.abs(c) - 0.12) / 0.88);
    // The boat sits just off the horizon to the lamp's left, so the
    // sweep "hits" it when the beam points left at full strength.
    let diff = Math.abs(angle - Math.PI);
    if (diff > Math.PI) diff = TAU - diff;
    const hit = Math.exp(-((diff / 0.14) ** 2)) * strength;
    return { angle, strength, hit };
  }

  function drawBeam(angle: number, strength: number) {
    if (!ctx) return;
    const x = lampX();
    const y = lampY();
    const len = width * (0.25 + 0.62 * strength);
    const spread = 0.05;
    const ex = x + Math.cos(angle) * len;
    const ey = y + Math.sin(angle) * len;
    const grad = ctx.createLinearGradient(x, y, ex, ey);
    grad.addColorStop(0, withAlpha(tokens.gold, 0.06 + 0.2 * strength));
    grad.addColorStop(1, withAlpha(tokens.gold, 0));
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.lineTo(x + Math.cos(angle - spread) * len, y + Math.sin(angle - spread) * len);
    ctx.lineTo(x + Math.cos(angle + spread) * len, y + Math.sin(angle + spread) * len);
    ctx.closePath();
    ctx.fillStyle = grad;
    ctx.fill();
  }

  /** Faint glints riding the crests of the two front layers. */
  function drawSparkles(t: number) {
    if (!ctx) return;
    for (let i = 0; i < 10; i += 1) {
      const layer = LAYERS[i % 2 === 0 ? 2 : 3];
      if (!layer) continue;
      const x = ((scatter(i + 11) + t * (0.006 + scatter(i + 2) * 0.004)) % 1) * width;
      const y = surface(layer, x, t) - 1.5;
      const alpha = 0.16 + 0.22 * Math.sin(t * (1.1 + scatter(i)) * 2 + i * 2.1);
      if (alpha <= 0.03) continue;
      ctx.beginPath();
      ctx.arc(x, y, 0.9, 0, TAU);
      ctx.fillStyle = withAlpha(i % 3 === 0 ? tokens.gold : tokens.teal, alpha);
      ctx.fill();
    }
  }

  function drawLighthouse(t: number, flare: number) {
    if (!ctx) return;
    const s = width / 560;
    const x = lampX();
    const rockY = height * 0.7;
    const top = lampY();
    ctx.save();
    ctx.strokeStyle = withAlpha(tokens.text, 0.62);
    ctx.lineWidth = 1.6;

    // The rock takes the sea; a little spray line breathes against it.
    ctx.beginPath();
    ctx.moveTo(x - 40 * s, rockY + 14 * s);
    ctx.quadraticCurveTo(x - 26 * s, rockY - 12 * s, x, rockY - 10 * s);
    ctx.quadraticCurveTo(x + 28 * s, rockY - 8 * s, x + 40 * s, rockY + 14 * s);
    ctx.closePath();
    ctx.fillStyle = withAlpha(tokens.panel, 0.8);
    ctx.fill();
    ctx.stroke();

    // Tower
    ctx.beginPath();
    ctx.moveTo(x - 12 * s, rockY - 9 * s);
    ctx.lineTo(x - 7 * s, top + 12 * s);
    ctx.lineTo(x + 7 * s, top + 12 * s);
    ctx.lineTo(x + 12 * s, rockY - 9 * s);
    ctx.closePath();
    ctx.fillStyle = withAlpha(tokens.panel, 0.55);
    ctx.fill();
    ctx.stroke();

    // Gallery, lamp room, roof
    ctx.beginPath();
    ctx.moveTo(x - 11 * s, top + 12 * s);
    ctx.lineTo(x + 11 * s, top + 12 * s);
    ctx.moveTo(x - 6 * s, top + 12 * s);
    ctx.lineTo(x - 6 * s, top);
    ctx.lineTo(x + 6 * s, top);
    ctx.lineTo(x + 6 * s, top + 12 * s);
    ctx.moveTo(x - 8 * s, top);
    ctx.lineTo(x, top - 9 * s);
    ctx.lineTo(x + 8 * s, top);
    ctx.stroke();

    // Stripes
    ctx.strokeStyle = withAlpha(tokens.text, 0.28);
    ctx.beginPath();
    ctx.moveTo(x - 10 * s, rockY - 26 * s);
    ctx.lineTo(x + 10 * s, rockY - 26 * s);
    ctx.moveTo(x - 9 * s, rockY - 44 * s);
    ctx.lineTo(x + 9 * s, rockY - 44 * s);
    ctx.stroke();

    // The lamp itself, flaring as the beam faces us.
    const lamp = ctx.createRadialGradient(x, top + 6 * s, 0, x, top + 6 * s, 14 * s);
    lamp.addColorStop(0, withAlpha(tokens.gold, 0.5 + 0.5 * flare));
    lamp.addColorStop(1, withAlpha(tokens.gold, 0));
    ctx.beginPath();
    ctx.arc(x, top + 6 * s, 14 * s, 0, TAU);
    ctx.fillStyle = lamp;
    ctx.fill();
    ctx.beginPath();
    ctx.arc(x, top + 6 * s, 2.4 * s, 0, TAU);
    ctx.fillStyle = withAlpha(tokens.gold, 0.85);
    ctx.fill();

    // Spray at the waterline
    ctx.strokeStyle = withAlpha(tokens.teal, 0.35 + 0.15 * Math.sin(t * 1.7));
    ctx.beginPath();
    ctx.moveTo(x - 46 * s, rockY + 10 * s);
    ctx.quadraticCurveTo(x - 38 * s, rockY + (6 + Math.sin(t * 1.7) * 2) * s, x - 30 * s, rockY + 10 * s);
    ctx.stroke();
    ctx.restore();
  }

  function drawBoat(t: number, lit: number) {
    if (!ctx) return;
    const layer = LAYERS[BOAT_LAYER];
    if (!layer) return;
    const s = width / 560;
    const bx = width * 0.32;
    const targetY = surface(layer, bx, t) - 1 * s;
    const targetAngle = Math.atan(slope(layer, bx, t)) * 0.8;
    if (Number.isNaN(boatY)) boatY = targetY;
    boatY += (targetY - boatY) * 0.06;
    boatAngle += (targetAngle - boatAngle) * 0.05;

    const flutter = Math.sin(t * 2.3) * 2.2;
    const stroke = withAlpha(tokens.text, 0.68 + 0.32 * lit);

    ctx.save();
    ctx.translate(bx, boatY);
    ctx.rotate(boatAngle);
    ctx.scale(s, s);
    ctx.lineWidth = 1.7;
    ctx.lineJoin = 'round';
    ctx.lineCap = 'round';
    ctx.strokeStyle = stroke;

    // Mast
    ctx.beginPath();
    ctx.moveTo(2, -3);
    ctx.lineTo(2, -66);
    ctx.stroke();

    // Main sail, breathing with the wind
    ctx.beginPath();
    ctx.moveTo(5, -62);
    ctx.quadraticCurveTo(30 + flutter, -40, 27 + flutter * 0.6, -9);
    ctx.lineTo(5, -9);
    ctx.closePath();
    ctx.fillStyle = withAlpha(tokens.text, 0.09 + 0.2 * lit);
    ctx.fill();
    ctx.stroke();

    // Jib
    ctx.beginPath();
    ctx.moveTo(-1, -57);
    ctx.quadraticCurveTo(-24 - flutter * 0.5, -34, -21 - flutter * 0.3, -9);
    ctx.lineTo(-1, -9);
    ctx.closePath();
    ctx.fillStyle = withAlpha(tokens.text, 0.06 + 0.14 * lit);
    ctx.fill();
    ctx.stroke();

    // Pennant
    ctx.beginPath();
    ctx.moveTo(2, -66);
    ctx.quadraticCurveTo(8, -65 + flutter * 0.4, 13, -63.5 + flutter * 0.8);
    ctx.quadraticCurveTo(8, -62.5 + flutter * 0.4, 2, -61.5);
    ctx.closePath();
    ctx.fillStyle = withAlpha(tokens.gold, 0.75 + 0.25 * lit);
    ctx.fill();

    // Hull
    ctx.beginPath();
    ctx.moveTo(-34, -3);
    ctx.quadraticCurveTo(-29, 11, -15, 13);
    ctx.lineTo(13, 13);
    ctx.quadraticCurveTo(29, 10, 34, -3);
    ctx.closePath();
    ctx.fillStyle = withAlpha(tokens.panel, 0.85);
    ctx.fill();
    ctx.stroke();
    ctx.restore();

    // A broken gold reflection on the water below the hull.
    ctx.save();
    ctx.strokeStyle = withAlpha(tokens.gold, 0.12 + 0.25 * lit);
    ctx.lineWidth = 1.2;
    for (let i = 0; i < 3; i += 1) {
      const ry = boatY + (10 + i * 7) * s;
      const sway = Math.sin(t * 1.4 + i * 1.8) * 6 * s;
      ctx.beginPath();
      ctx.moveTo(bx - (12 - i * 3) * s + sway, ry);
      ctx.lineTo(bx + (12 - i * 3) * s + sway, ry);
      ctx.stroke();
    }
    ctx.restore();
  }

  function drawCourse(t: number) {
    if (!ctx) return;
    const layer = LAYERS[BOAT_LAYER];
    if (!layer) return;
    const s = width / 560;
    const cx = width * 0.32 - 52 * s;
    const cy = surface(layer, cx, t) + 16 * s;

    ctx.save();
    ctx.strokeStyle = withAlpha(tokens.gold, 0.55);
    ctx.lineWidth = 1.4;
    ctx.setLineDash([3, 7]);
    ctx.lineDashOffset = -t * 9;
    ctx.beginPath();
    ctx.moveTo(width * 0.05, height * 0.96);
    ctx.quadraticCurveTo(width * 0.16, height * 0.88, cx - 8 * s, cy + 6 * s);
    ctx.stroke();
    ctx.setLineDash([]);

    ctx.strokeStyle = withAlpha(tokens.gold, 0.85);
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(cx - 5 * s, cy - 5 * s);
    ctx.lineTo(cx + 5 * s, cy + 5 * s);
    ctx.moveTo(cx + 5 * s, cy - 5 * s);
    ctx.lineTo(cx - 5 * s, cy + 5 * s);
    ctx.stroke();

    ctx.fillStyle = withAlpha(tokens.muted, 0.9);
    ctx.font = `${String(Math.max(8, 9 * s))}px "IBM Plex Mono", monospace`;
    ctx.textBaseline = 'middle';
    ctx.fillText('YOU ARE HERE', cx + 12 * s, cy + 14 * s);
    ctx.restore();
  }

  function drawFrame(t: number) {
    if (!ctx) return;
    ctx.clearRect(0, 0, width, height);
    drawStars(t);
    drawMoon();

    const { angle, strength, hit } = beamState(t);
    drawBeam(angle, strength);

    const back = LAYERS[0];
    const mid = LAYERS[1];
    if (back) drawWave(back, t);
    if (mid) drawWave(mid, t);
    // The lamp flares as the beam turns toward the viewer and dims
    // while it sweeps sideways.
    drawLighthouse(t, 1 - strength);
    const boatLayer = LAYERS[BOAT_LAYER];
    if (boatLayer) drawWave(boatLayer, t);
    drawCourse(t);
    drawBoat(t, hit);
    const front = LAYERS[3];
    if (front) drawWave(front, t);
    drawSparkles(t);
  }

  const resize = () => {
    const rect = canvas.getBoundingClientRect();
    const dpr = window.devicePixelRatio || 1;
    width = rect.width;
    height = rect.height;
    canvas.width = Math.max(1, Math.round(rect.width * dpr));
    canvas.height = Math.max(1, Math.round(rect.height * dpr));
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    if (reduced) drawFrame(2.6);
  };
  const observer = new ResizeObserver(resize);
  observer.observe(canvas);
  resize();

  const themeObserver = new MutationObserver(() => {
    tokens = readTokens();
    if (reduced) drawFrame(2.6);
  });
  themeObserver.observe(document.documentElement, { attributes: true });

  if (reduced) {
    drawFrame(2.6);
  } else {
    const loop = (now: number) => {
      drawFrame((now - started) / 1000);
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
  }

  return () => {
    cancelAnimationFrame(raf);
    observer.disconnect();
    themeObserver.disconnect();
  };
}
