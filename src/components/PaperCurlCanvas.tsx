import { useEffect, useRef } from 'react';
import { CHAPTERS, type BookPage } from '../data/bookData';

interface PaperCurlCanvasProps {
  isSpreadMode: boolean;
  direction: 'next' | 'prev';
  fromSpread: number;
  toSpread: number;
  fromPage: number;
  toPage: number;
  pages: BookPage[];
  width: number;
  height: number;
  onComplete: () => void;
}

const BLEED = 36;
const DURATION_SPREAD = 820;
const DURATION_SINGLE = 620;

// Smooth paper-turn easing: crisp bottom lift, fluid wave sweep, soft air-cushion settle
function easePaperTurn(raw: number): number {
  const t = Math.min(1, Math.max(0, raw));
  return t < 0.5
    ? 4 * t * t * t
    : 1 - Math.pow(-2 * t + 2, 3) / 2;
}

// Cache loaded WebP images & rendered Cover/TOC offscreen canvases
const drawableCache = new Map<string, HTMLImageElement | HTMLCanvasElement>();

if (typeof document !== 'undefined' && 'fonts' in document) {
  document.fonts.ready.then(() => {
    drawableCache.delete('__cover__');
    drawableCache.delete('__toc__');
  });
}

export function preloadCurlImage(src: string): void {
  if (!src || drawableCache.has(src)) return;
  const img = new Image();
  img.decoding = 'sync';
  img.src = src;
  drawableCache.set(src, img);
}

function getCoverCanvas(): HTMLCanvasElement {
  const cached = drawableCache.get('__cover__');
  if (cached instanceof HTMLCanvasElement) return cached;

  const w = 1240;
  const h = 1756;
  const canvas = document.createElement('canvas');
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext('2d')!;
  ctx.scale(2, 2);

  const bw = 620;
  const bh = 878;

  const grad = ctx.createLinearGradient(0, 0, 0, bh);
  grad.addColorStop(0, '#F5F3EB');
  grad.addColorStop(0.55, '#E6ECE3');
  grad.addColorStop(1, '#D6E2D5');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, bw, bh);

  // Horizon hills
  ctx.fillStyle = 'rgba(197, 214, 197, 0.65)';
  ctx.beginPath();
  ctx.moveTo(0, 630);
  ctx.quadraticCurveTo(180, 570, 360, 620);
  ctx.quadraticCurveTo(490, 650, 620, 595);
  ctx.lineTo(620, 878);
  ctx.lineTo(0, 878);
  ctx.closePath();
  ctx.fill();

  ctx.fillStyle = 'rgba(175, 197, 177, 0.55)';
  ctx.beginPath();
  ctx.moveTo(0, 700);
  ctx.quadraticCurveTo(210, 655, 430, 710);
  ctx.quadraticCurveTo(530, 730, 620, 685);
  ctx.lineTo(620, 878);
  ctx.lineTo(0, 878);
  ctx.closePath();
  ctx.fill();

  // Frame
  ctx.strokeStyle = 'rgba(28, 36, 30, 0.16)';
  ctx.lineWidth = 1.2;
  ctx.strokeRect(28, 28, 564, 822);

  // Top header
  ctx.fillStyle = '#3D4B41';
  ctx.font = '500 14px "Noto Sans KR", sans-serif';
  ctx.fillText('현장 안전 실무 모음집', 50, 62);
  ctx.textAlign = 'right';
  ctx.fillStyle = '#556459';
  ctx.fillText('제1편 — 제10편', 570, 62);
  ctx.textAlign = 'left';

  ctx.strokeStyle = 'rgba(28, 36, 30, 0.15)';
  ctx.beginPath();
  ctx.moveTo(50, 76);
  ctx.lineTo(570, 76);
  ctx.stroke();

  // Emblem
  ctx.fillStyle = '#F7F5EE';
  ctx.strokeStyle = 'rgba(28, 36, 30, 0.22)';
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.arc(310, 275, 58, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();

  ctx.fillStyle = '#2B4C3B';
  ctx.beginPath();
  ctx.arc(310, 279, 30, Math.PI, 0);
  ctx.fill();
  ctx.fillStyle = '#1C241E';
  ctx.fillRect(272, 278, 76, 7);

  ctx.strokeStyle = '#B45309';
  ctx.lineWidth = 3.5;
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  ctx.beginPath();
  ctx.moveTo(295, 297);
  ctx.lineTo(305, 306);
  ctx.lineTo(327, 290);
  ctx.stroke();

  // Titles
  ctx.textAlign = 'center';
  ctx.fillStyle = '#9A3412';
  ctx.font = '600 15px "Noto Sans KR", sans-serif';
  ctx.fillText('ILLUSTRATED SAFETY BOOK', 310, 382);

  ctx.fillStyle = '#151D17';
  ctx.font = '700 76px "Noto Serif KR", serif';
  ctx.fillText('알·쓸·신·안', 310, 468);

  ctx.strokeStyle = 'rgba(28, 36, 30, 0.25)';
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.moveTo(260, 495);
  ctx.lineTo(360, 495);
  ctx.stroke();

  ctx.fillStyle = '#2E3A32';
  ctx.font = '500 25px "Noto Serif KR", serif';
  ctx.fillText('알고보면 쓸모있는 신기한 안전', 310, 538);

  ctx.fillStyle = '#4F5D53';
  ctx.font = '400 16px "Noto Sans KR", sans-serif';
  ctx.fillText('작업 전 꼭 확인해야 할 10가지 핵심 안전수칙', 310, 574);

  // Bottom colophon box
  ctx.fillStyle = 'rgba(247, 245, 238, 0.85)';
  ctx.fillRect(50, 742, 520, 92);
  ctx.strokeStyle = 'rgba(28, 36, 30, 0.18)';
  ctx.beginPath();
  ctx.moveTo(50, 742);
  ctx.lineTo(570, 742);
  ctx.stroke();

  ctx.fillStyle = '#2E3A32';
  ctx.font = '500 13px "Noto Sans KR", sans-serif';
  ctx.fillText(
    '안전난간 · 밀폐공간 · 핸드그라인더 · 이동식 사다리 · 자동전격방지기',
    310,
    770
  );
  ctx.fillText(
    '전체식 안전대 · LOTO · 줄걸이 작업 · 지게차 · 화학물질·MSDS',
    310,
    792
  );
  ctx.fillStyle = '#5B685F';
  ctx.font = '400 12.5px "Noto Sans KR", sans-serif';
  ctx.fillText('창원안전환경팀 · 안전보건 웹북', 310, 818);

  drawableCache.set('__cover__', canvas);
  return canvas;
}

function getTocCanvas(): HTMLCanvasElement {
  const cached = drawableCache.get('__toc__');
  if (cached instanceof HTMLCanvasElement) return cached;

  const w = 1240;
  const h = 1756;
  const canvas = document.createElement('canvas');
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext('2d')!;
  ctx.scale(2, 2);

  const bw = 620;
  const bh = 878;

  ctx.fillStyle = '#FAF8F4';
  ctx.fillRect(0, 0, bw, bh);

  ctx.fillStyle = '#78716C';
  ctx.font = '500 12px monospace';
  ctx.fillText('TABLE OF CONTENTS', 40, 52);

  ctx.fillStyle = '#1C1917';
  ctx.font = '700 40px "Noto Serif KR", serif';
  ctx.fillText('목 차', 40, 96);

  ctx.textAlign = 'right';
  ctx.fillStyle = '#78716C';
  ctx.font = '500 14px monospace';
  ctx.fillText('총 10편 · 40쪽', 580, 94);
  ctx.textAlign = 'left';

  ctx.strokeStyle = '#1C1917';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(40, 114);
  ctx.lineTo(580, 114);
  ctx.stroke();

  const startY = 148;
  const rowH = 66;
  CHAPTERS.forEach((ch, idx) => {
    const y = startY + idx * rowH;
    ctx.fillStyle = '#9A3412';
    ctx.font = '600 18px monospace';
    ctx.fillText(String(ch.id).padStart(2, '0'), 44, y + 18);

    ctx.fillStyle = '#1C1917';
    ctx.font = '700 20px "Noto Sans KR", sans-serif';
    ctx.fillText(ch.title, 86, y + 18);

    ctx.fillStyle = '#78716C';
    ctx.font = '400 13px "Noto Sans KR", sans-serif';
    ctx.fillText(ch.subtitle, 86, y + 39);

    ctx.textAlign = 'right';
    ctx.fillStyle = '#A8A29E';
    ctx.font = '500 13px monospace';
    ctx.fillText(`p.${String((ch.id - 1) * 4 + 1).padStart(2, '0')}`, 576, y + 24);
    ctx.textAlign = 'left';

    if (idx < CHAPTERS.length - 1) {
      ctx.strokeStyle = 'rgba(214, 211, 209, 0.8)';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(40, y + 52);
      ctx.lineTo(580, y + 52);
      ctx.stroke();
    }
  });

  ctx.strokeStyle = '#D6D3D1';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(40, 815);
  ctx.lineTo(580, 815);
  ctx.stroke();

  ctx.fillStyle = '#78716C';
  ctx.font = '400 13px "Noto Sans KR", sans-serif';
  ctx.fillText('편 제목을 누르면 해당 장으로 바로 이동합니다.', 40, 840);
  ctx.textAlign = 'right';
  ctx.fillText('알·쓸·신·안', 580, 840);

  drawableCache.set('__toc__', canvas);
  return canvas;
}

function getPaperBackCanvas(): HTMLCanvasElement {
  const cached = drawableCache.get('__paper_back__');
  if (cached instanceof HTMLCanvasElement) return cached;

  const canvas = document.createElement('canvas');
  canvas.width = 620;
  canvas.height = 878;
  const ctx = canvas.getContext('2d')!;
  ctx.fillStyle = '#F7F5EE';
  ctx.fillRect(0, 0, 620, 878);
  drawableCache.set('__paper_back__', canvas);
  return canvas;
}

function getPageDrawable(page: BookPage | undefined): HTMLImageElement | HTMLCanvasElement | null {
  if (!page) return getPaperBackCanvas();
  if (page.kind === 'cover') return getCoverCanvas();
  if (page.kind === 'toc') return getTocCanvas();
  if (!page.src) return getPaperBackCanvas();

  const existing = drawableCache.get(page.src);
  if (existing) {
    if (existing instanceof HTMLImageElement) {
      return existing.complete && existing.naturalWidth > 0 ? existing : null;
    }
    return existing;
  }

  const img = new Image();
  img.decoding = 'sync';
  img.src = page.src;
  drawableCache.set(page.src, img);
  return img.complete && img.naturalWidth > 0 ? img : null;
}

/**
 * Renders one frame of a physical conical bottom-to-top paper curl.
 * `side === 'right'` curls the right sheet leftward (Forward);
 * `side === 'left'` curls the left sheet rightward (Backward).
 */
function drawConicalCurl(
  ctx: CanvasRenderingContext2D,
  frontImg: CanvasImageSource,
  backImg: CanvasImageSource,
  pageW: number,
  pageH: number,
  t: number,
  side: 'right' | 'left',
  isSpread: boolean
) {
  const spineX = isSpread ? pageW : 0;
  // Angle tilts fold line so bottom corner lifts & curls BEFORE top corner (bottom-to-top wave)
  const alpha = 0.52 * Math.pow(1 - t, 1.45);
  const cosA = Math.cos(alpha);
  const sinA = Math.sin(alpha);
  const dMax = pageW * cosA + pageH * sinA;
  const dFold = dMax * (1 - t);
  const R = pageW * 0.135 * Math.sin(Math.PI * Math.pow(t, 0.72));

  // Fold anchor inside the page
  const u0 = dFold * cosA;
  const v0 = dFold * sinA;
  const dRemaining = Math.max(0, dMax - dFold);

  // Helper to orient canvas into fold coordinate frame:
  // For 'right' (Next): +s points right-down along (+cosA, +sinA) from (spineX + u0, v0)
  // For 'left' (Prev):  +s points left-down along (-cosA, +sinA) from (spineX - u0, v0)
  const enterFoldSpace = () => {
    if (side === 'right') {
      ctx.translate(spineX + u0, v0);
      ctx.rotate(alpha);
    } else {
      ctx.translate(spineX - u0, v0);
      ctx.rotate(-alpha);
    }
  };

  const exitToPageSpace = () => {
    if (side === 'right') {
      ctx.rotate(-alpha);
      ctx.translate(-u0, -v0);
    } else {
      ctx.rotate(alpha);
      ctx.translate(-(pageW - u0), -v0);
    }
  };

  const sSign = side === 'right' ? 1 : -1;

  // 1) Draw flat uncurled portion of the turning sheet (d <= 0)
  if (dFold > 0.5) {
    ctx.save();
    enterFoldSpace();
    ctx.beginPath();
    if (side === 'right') {
      ctx.rect(-dMax * 2, -dMax * 2, dMax * 2, dMax * 4);
    } else {
      ctx.rect(0, -dMax * 2, dMax * 2, dMax * 4);
    }
    ctx.clip();
    exitToPageSpace();
    ctx.drawImage(frontImg, 0, 0, pageW, pageH);
    ctx.restore();
  }

  // 2) Drop shadow cast onto underlying static right/left page beneath front curl
  if (R > 1 && t > 0.01 && t < 0.98) {
    ctx.save();
    ctx.beginPath();
    ctx.rect(side === 'right' ? spineX : 0, 0, pageW, pageH);
    ctx.clip();
    enterFoldSpace();
    const shW = R * 1.6;
    const grad =
      side === 'right'
        ? ctx.createLinearGradient(0, 0, shW, 0)
        : ctx.createLinearGradient(0, 0, -shW, 0);
    const shAlpha = 0.22 * Math.sin(Math.PI * t);
    grad.addColorStop(0, `rgba(28, 25, 23, ${shAlpha})`);
    grad.addColorStop(1, 'rgba(28, 25, 23, 0)');
    ctx.fillStyle = grad;
    if (side === 'right') {
      ctx.fillRect(0, -dMax * 2, shW, dMax * 4);
    } else {
      ctx.fillRect(-shW, -dMax * 2, shW, dMax * 4);
    }
    ctx.restore();
  }

  // 3) Front rising curve (0 <= phi <= pi/2)
  const frontEnd = R > 0.5 ? Math.min(dRemaining, Math.PI * 0.5 * R) : 0;
  if (frontEnd > 0.5) {
    const steps = 15;
    const stepD = frontEnd / steps;
    for (let i = 0; i < steps; i++) {
      const d0 = i * stepD;
      const d1 = (i + 1) * stepD;
      const dm = (d0 + d1) * 0.5;
      const phi = dm / R;
      const s0 = sSign * R * Math.sin(d0 / R);
      const s1 = sSign * R * Math.sin(d1 / R);
      const sMin = Math.min(s0, s1);
      const sSpan = Math.abs(s1 - s0);
      const z = R * (1 - Math.cos(phi));
      const scaleD = Math.max(sSpan / stepD, 0.02);
      const scaleP = 1 + z / (pageW * 15);

      ctx.save();
      enterFoldSpace();
      ctx.beginPath();
      ctx.rect(sMin - 0.5, -dMax * 2, sSpan + 1.0, dMax * 4);
      ctx.clip();

      ctx.translate(s0, -z * 0.10);
      ctx.scale(scaleD, scaleP);
      ctx.translate(-sSign * d0, 0);
      exitToPageSpace();

      ctx.drawImage(frontImg, 0, 0, pageW, pageH);
      const shade = 0.25 * Math.sin(phi);
      if (shade > 0.01) {
        ctx.fillStyle = `rgba(28, 25, 23, ${shade})`;
        ctx.fillRect(0, 0, pageW, pageH);
      }
      ctx.restore();
    }
  }

  // 4) Cast shadow beneath the overturned back flap
  if (dRemaining > frontEnd && t > 0.02 && t < 0.98) {
    ctx.save();
    ctx.beginPath();
    ctx.rect(0, 0, isSpread ? pageW * 2 : pageW, pageH);
    ctx.clip();
    enterFoldSpace();
    const shadowSpan = Math.min(dRemaining - frontEnd + R, pageW * 0.48);
    const shAlpha = 0.20 * Math.sin(Math.PI * t);
    const grad =
      side === 'right'
        ? ctx.createLinearGradient(R, 0, R - shadowSpan, 0)
        : ctx.createLinearGradient(-R, 0, -R + shadowSpan, 0);
    grad.addColorStop(0, `rgba(28, 25, 23, ${shAlpha})`);
    grad.addColorStop(0.55, `rgba(28, 25, 23, ${shAlpha * 0.45})`);
    grad.addColorStop(1, 'rgba(28, 25, 23, 0)');
    ctx.fillStyle = grad;
    if (side === 'right') {
      ctx.fillRect(R - shadowSpan, -dMax * 2, shadowSpan, dMax * 4);
    } else {
      ctx.fillRect(-R, -dMax * 2, shadowSpan, dMax * 4);
    }
    ctx.restore();
  }

  // 5) Overturned curved crest & unrolled back flap (phi >= pi/2)
  if (dRemaining > frontEnd + 0.5) {
    const backSpan = dRemaining - frontEnd;
    const crestEnd = R > 0.5 ? Math.min(dRemaining, Math.PI * R) : frontEnd;
    const totalSteps = 28;

    // Build non-uniform d samples: dense along curved crest, lighter on flat tail
    const samples: number[] = [frontEnd];
    if (crestEnd > frontEnd + 0.5) {
      const crestSteps = 18;
      for (let i = 1; i <= crestSteps; i++) {
        samples.push(frontEnd + ((crestEnd - frontEnd) * i) / crestSteps);
      }
    }
    if (dRemaining > crestEnd + 0.5) {
      const tailSteps = totalSteps - (samples.length - 1);
      for (let i = 1; i <= tailSteps; i++) {
        samples.push(crestEnd + ((dRemaining - crestEnd) * i) / tailSteps);
      }
    } else if (backSpan <= 1) {
      samples.push(dRemaining);
    }

    const sOfD = (dVal: number) => {
      if (R > 0.5 && dVal <= Math.PI * R) {
        return sSign * R * Math.sin(dVal / R);
      }
      return -sSign * (dVal - Math.PI * R);
    };

    const zOfD = (dVal: number) => {
      if (R > 0.5 && dVal <= Math.PI * R) {
        return R * (1 - Math.cos(dVal / R));
      }
      const distPast = dVal - Math.PI * R;
      return 2 * R * Math.exp(-distPast / (R * 1.5 + 1));
    };

    for (let i = 0; i < samples.length - 1; i++) {
      const d0 = samples[i];
      const d1 = samples[i + 1];
      const dd = d1 - d0;
      if (dd <= 0.05) continue;

      const s0 = sOfD(d0);
      const s1 = sOfD(d1);
      const sMin = Math.min(s0, s1);
      const sSpan = Math.abs(s1 - s0);
      if (sSpan < 0.05) continue;

      // In single-page mode, smoothly fade out any tail extending off the left edge
      let stripAlpha = 1;
      if (!isSpread) {
        const midXBook = u0 + ((s0 + s1) * 0.5) * cosA;
        if (midXBook < -BLEED) continue;
        if (midXBook < -2) {
          stripAlpha = Math.max(0, 1 - (-2 - midXBook) / (BLEED - 4));
          if (stripAlpha <= 0.01) continue;
        }
      }

      const dm = (d0 + d1) * 0.5;
      const z = zOfD(dm);
      const scaleD = Math.max(sSpan / dd, 0.02);
      const scaleP = 1 + z / (pageW * 15);

      ctx.save();
      if (stripAlpha < 1) {
        ctx.globalAlpha = stripAlpha;
      }
      enterFoldSpace();
      ctx.beginPath();
      ctx.rect(sMin - 0.6, -dMax * 2, sSpan + 1.2, dMax * 4);
      ctx.clip();

      ctx.translate(s0, -z * 0.10);
      ctx.scale(-scaleD, scaleP); // reflect across fold line
      ctx.translate(-sSign * d0, 0);
      exitToPageSpace();

      // Draw back image mirrored internally so double-reflection renders normal text
      ctx.translate(pageW, 0);
      ctx.scale(-1, 1);
      ctx.drawImage(backImg, 0, 0, pageW, pageH);

      // Subtle paper edge contour so white-on-white pages clearly show paper edge
      ctx.strokeStyle = 'rgba(28, 25, 23, 0.10)';
      ctx.lineWidth = 1.5;
      ctx.strokeRect(0, 0, pageW, pageH);

      // Curved paper highlight & hollow shadow along the roll
      if (R > 0.5) {
        const phi = dm / R;
        if (phi < Math.PI) {
          if (phi < Math.PI * 0.66) {
            ctx.fillStyle = `rgba(28, 25, 23, ${0.14 * (1 - (phi - Math.PI * 0.5) / (Math.PI * 0.16))})`;
            ctx.fillRect(0, 0, pageW, pageH);
          } else {
            const crestGlow = Math.sin(((phi - Math.PI * 0.66) / (Math.PI * 0.34)) * Math.PI);
            ctx.fillStyle = `rgba(255, 255, 255, ${0.28 * crestGlow})`;
            ctx.fillRect(0, 0, pageW, pageH);
          }
        }
      }
      ctx.restore();
    }
  }
}

export function PaperCurlCanvas({
  isSpreadMode,
  direction,
  fromSpread,
  toSpread,
  fromPage,
  toPage,
  pages,
  width,
  height,
  onComplete,
}: PaperCurlCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const onCompleteRef = useRef(onComplete);
  onCompleteRef.current = onComplete;

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || width <= 0 || height <= 0) return;

    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const totalW = width + BLEED * 2;
    const totalH = height + BLEED * 2;
    canvas.width = Math.round(totalW * dpr);
    canvas.height = Math.round(totalH * dpr);

    const ctx = canvas.getContext('2d');
    if (!ctx) {
      onCompleteRef.current();
      return;
    }

    const duration = isSpreadMode ? DURATION_SPREAD : DURATION_SINGLE;
    const prefersReduced =
      typeof window !== 'undefined' &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    if (prefersReduced) {
      onCompleteRef.current();
      return;
    }

    const pageW = isSpreadMode ? width / 2 : width;
    const pageH = height;
    const paperBack = getPaperBackCanvas();

    let rafId = 0;
    const startTime = performance.now();

    const renderFrame = (now: number) => {
      const elapsed = now - startTime;
      const raw = Math.min(1, elapsed / duration);
      const t = easePaperTurn(raw);

      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, totalW, totalH);
      ctx.save();
      ctx.translate(BLEED, BLEED);

      if (isSpreadMode) {
        const fromLeft = getPageDrawable(pages[fromSpread * 2]) ?? paperBack;
        const fromRight = getPageDrawable(pages[fromSpread * 2 + 1]) ?? paperBack;
        const toLeft = getPageDrawable(pages[toSpread * 2]) ?? paperBack;
        const toRight = getPageDrawable(pages[toSpread * 2 + 1]) ?? paperBack;

        if (direction === 'next') {
          ctx.drawImage(fromLeft, 0, 0, pageW, pageH);
          ctx.drawImage(toRight, pageW, 0, pageW, pageH);

          const spGrad = ctx.createLinearGradient(pageW - 14, 0, pageW + 14, 0);
          spGrad.addColorStop(0, 'rgba(28, 25, 23, 0)');
          spGrad.addColorStop(0.5, 'rgba(28, 25, 23, 0.11)');
          spGrad.addColorStop(1, 'rgba(28, 25, 23, 0)');
          ctx.fillStyle = spGrad;
          ctx.fillRect(pageW - 14, 0, 28, pageH);

          drawConicalCurl(ctx, fromRight, toLeft, pageW, pageH, t, 'right', true);
        } else {
          ctx.drawImage(toLeft, 0, 0, pageW, pageH);
          ctx.drawImage(fromRight, pageW, 0, pageW, pageH);

          const spGrad = ctx.createLinearGradient(pageW - 14, 0, pageW + 14, 0);
          spGrad.addColorStop(0, 'rgba(28, 25, 23, 0)');
          spGrad.addColorStop(0.5, 'rgba(28, 25, 23, 0.11)');
          spGrad.addColorStop(1, 'rgba(28, 25, 23, 0)');
          ctx.fillStyle = spGrad;
          ctx.fillRect(pageW - 14, 0, 28, pageH);

          drawConicalCurl(ctx, fromLeft, toRight, pageW, pageH, t, 'left', true);
        }
      } else {
        const singleFrom = getPageDrawable(pages[fromPage]) ?? paperBack;
        const singleTo = getPageDrawable(pages[toPage]) ?? paperBack;

        if (direction === 'next') {
          ctx.drawImage(singleTo, 0, 0, pageW, pageH);
          drawConicalCurl(ctx, singleFrom, paperBack, pageW, pageH, t, 'right', false);
        } else {
          ctx.drawImage(singleFrom, 0, 0, pageW, pageH);
          drawConicalCurl(ctx, singleTo, paperBack, pageW, pageH, 1 - t, 'right', false);
        }
      }

      ctx.restore();

      if (raw < 1) {
        rafId = requestAnimationFrame(renderFrame);
      } else {
        onCompleteRef.current();
      }
    };

    rafId = requestAnimationFrame(renderFrame);
    return () => cancelAnimationFrame(rafId);
  }, [direction, fromPage, fromSpread, height, isSpreadMode, pages, toPage, toSpread, width]);

  return (
    <canvas
      ref={canvasRef}
      aria-hidden="true"
      className="pointer-events-none absolute z-30"
      style={{
        left: -BLEED,
        top: -BLEED,
        width: width + BLEED * 2,
        height: height + BLEED * 2,
      }}
    />
  );
}
