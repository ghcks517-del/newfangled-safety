import { useCallback, useEffect, useRef, useState } from 'react';
import {
  ChevronLeft,
  ChevronRight,
  BookOpen,
  ZoomIn,
  ZoomOut,
  RotateCcw,
} from 'lucide-react';
import {
  BOOK_PAGES,
  CHAPTERS,
  getChapterForPage,
  type BookChapter,
} from '../data/bookData';
import { BookPageSurface } from './BookFrontMatter';
import { ChapterDrawer } from './ChapterDrawer';
import { PaperCurlCanvas, preloadCurlImage } from './PaperCurlCanvas';

interface FlipState {
  direction: 'next' | 'prev';
  fromSpread: number;
  toSpread: number;
  fromPage: number;
  toPage: number;
  key: number;
}

interface PanOffset {
  x: number;
  y: number;
}

const TOTAL_PAGES = BOOK_PAGES.length; // 44 (Cover + TOC + 42 chapter pages)
const TOTAL_SPREADS = TOTAL_PAGES / 2; // 22
const FLIP_DURATION_SPREAD = 920; // safety fallback slightly above 860ms CSS animation
const FLIP_DURATION_SINGLE = 720; // safety fallback slightly above 660ms CSS animation
const MIN_ZOOM = 1;
const MAX_ZOOM = 3;

function clampZoom(val: number): number {
  return Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, val));
}

export function WebBookViewer() {
  const [currentPageIndex, setCurrentPageIndex] = useState(0);
  const [isSpreadMode, setIsSpreadMode] = useState(() =>
    typeof window !== 'undefined' ? window.innerWidth >= 900 : true
  );
  const [flipState, setFlipState] = useState<FlipState | null>(null);
  const [isTocOpen, setIsTocOpen] = useState(false);

  // Zoom & Pan state
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState<PanOffset>({ x: 0, y: 0 });
  const [isDraggingPan, setIsDraggingPan] = useState(false);

  const stageRef = useRef<HTMLElement | null>(null);
  const bookBoxRef = useRef<HTMLDivElement | null>(null);
  const [bookSize, setBookSize] = useState({ width: 0, height: 0 });
  const flipTimerRef = useRef<number | null>(null);
  const flipCounterRef = useRef(0);

  // Refs for smooth gesture tracking without stale closures
  const zoomRef = useRef(1);
  const panRef = useRef<PanOffset>({ x: 0, y: 0 });
  zoomRef.current = zoom;
  panRef.current = pan;

  const touchStartXRef = useRef<number | null>(null);
  const touchStartYRef = useRef<number | null>(null);
  const touchSwipeCancelledRef = useRef(false);

  const pinchRef = useRef<{
    active: boolean;
    startDist: number;
    startZoom: number;
    startPan: PanOffset;
    startMidX: number;
    startMidY: number;
  }>({
    active: false,
    startDist: 0,
    startZoom: 1,
    startPan: { x: 0, y: 0 },
    startMidX: 0,
    startMidY: 0,
  });

  const touchPanRef = useRef<{
    active: boolean;
    startX: number;
    startY: number;
    startPan: PanOffset;
  }>({
    active: false,
    startX: 0,
    startY: 0,
    startPan: { x: 0, y: 0 },
  });

  const mousePanRef = useRef<{
    active: boolean;
    moved: boolean;
    startX: number;
    startY: number;
    startPan: PanOffset;
  }>({
    active: false,
    moved: false,
    startX: 0,
    startY: 0,
    startPan: { x: 0, y: 0 },
  });

  const clampPan = useCallback((nextX: number, nextY: number, targetZoom: number): PanOffset => {
    if (targetZoom <= 1.01) return { x: 0, y: 0 };
    const stage = stageRef.current;
    const width = stage ? stage.clientWidth : 1000;
    const height = stage ? stage.clientHeight : 700;
    const maxX = ((width * (targetZoom - 1)) / 2) + 48;
    const maxY = ((height * (targetZoom - 1)) / 2) + 48;
    return {
      x: Math.min(maxX, Math.max(-maxX, nextX)),
      y: Math.min(maxY, Math.max(-maxY, nextY)),
    };
  }, []);

  const resetZoom = useCallback(() => {
    setZoom(1);
    setPan({ x: 0, y: 0 });
  }, []);

  const stepZoom = useCallback(
    (deltaMultiplier: number) => {
      const currentZ = zoomRef.current;
      const nextZ = clampZoom(currentZ * deltaMultiplier);
      if (nextZ <= 1.02) {
        resetZoom();
        return;
      }
      const ratio = nextZ / currentZ;
      const nextPan = clampPan(panRef.current.x * ratio, panRef.current.y * ratio, nextZ);
      setZoom(nextZ);
      setPan(nextPan);
    },
    [clampPan, resetZoom]
  );

  const prevSpreadModeRef = useRef(isSpreadMode);

  // Responsive breakpoint listener for spread vs single-page readability
  useEffect(() => {
    const updateLayout = () => {
      const nextSpread = window.innerWidth >= 900;
      if (prevSpreadModeRef.current !== nextSpread) {
        prevSpreadModeRef.current = nextSpread;
        if (flipTimerRef.current !== null) {
          window.clearTimeout(flipTimerRef.current);
          flipTimerRef.current = null;
        }
        setFlipState(null);
        setIsSpreadMode(nextSpread);
      }
    };
    updateLayout();
    window.addEventListener('resize', updateLayout);
    return () => window.removeEventListener('resize', updateLayout);
  }, []);

  // Measure physical book box dimensions for crisp DPR-matched canvas curl
  useEffect(() => {
    const el = bookBoxRef.current;
    if (!el) return;
    const measure = () => {
      const rect = el.getBoundingClientRect();
      if (rect.width > 0 && rect.height > 0) {
        setBookSize({ width: rect.width, height: rect.height });
      }
    };
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    return () => ro.disconnect();
  }, [isSpreadMode]);

  // Preload adjacent image pages into browser & canvas curl cache
  useEffect(() => {
    const indicesToPreload = [
      currentPageIndex - 4,
      currentPageIndex - 3,
      currentPageIndex - 2,
      currentPageIndex - 1,
      currentPageIndex,
      currentPageIndex + 1,
      currentPageIndex + 2,
      currentPageIndex + 3,
      currentPageIndex + 4,
      currentPageIndex + 5,
    ];
    indicesToPreload.forEach((idx) => {
      if (idx >= 0 && idx < TOTAL_PAGES) {
        const src = BOOK_PAGES[idx].src;
        if (src) {
          preloadCurlImage(src);
        }
      }
    });
  }, [currentPageIndex]);

  useEffect(() => {
    return () => {
      if (flipTimerRef.current !== null) {
        window.clearTimeout(flipTimerRef.current);
      }
    };
  }, []);

  const currentSpread = Math.floor(currentPageIndex / 2);
  const activePageForDisplay = flipState
    ? isSpreadMode
      ? flipState.toSpread * 2
      : flipState.toPage
    : currentPageIndex;
  const activeSpreadForDisplay = Math.floor(activePageForDisplay / 2);
  const activeChapter = getChapterForPage(activePageForDisplay);

  const canPrev = isSpreadMode ? activeSpreadForDisplay > 0 : activePageForDisplay > 0;
  const canNext = isSpreadMode
    ? activeSpreadForDisplay < TOTAL_SPREADS - 1
    : activePageForDisplay < TOTAL_PAGES - 1;

  const commitFlip = useCallback((targetPage: number, expectedKey?: number) => {
    if (expectedKey !== undefined && expectedKey !== flipCounterRef.current) {
      return;
    }
    if (flipTimerRef.current !== null) {
      window.clearTimeout(flipTimerRef.current);
      flipTimerRef.current = null;
    }
    setCurrentPageIndex(targetPage);
    setFlipState(null);
  }, []);

  const navigateToPage = useCallback(
    (targetPageIndex: number) => {
      resetZoom();
      if (flipTimerRef.current !== null) {
        window.clearTimeout(flipTimerRef.current);
        flipTimerRef.current = null;
      }

      if (bookBoxRef.current) {
        const rect = bookBoxRef.current.getBoundingClientRect();
        if (rect.width > 0 && rect.height > 0) {
          setBookSize({ width: rect.width, height: rect.height });
        }
      }

      const currentPos = flipState
        ? isSpreadMode
          ? flipState.toSpread * 2
          : flipState.toPage
        : currentPageIndex;
      const fromSpread = Math.floor(currentPos / 2);
      const toSpread = Math.floor(targetPageIndex / 2);

      // Immediately preload target spread images for direct TOC / chapter jumps
      [toSpread * 2, toSpread * 2 + 1].forEach((idx) => {
        const src = BOOK_PAGES[idx]?.src;
        if (src) preloadCurlImage(src);
      });

      if (isSpreadMode) {
        if (toSpread === fromSpread) return;
        const direction: 'next' | 'prev' = toSpread > fromSpread ? 'next' : 'prev';
        const finalTarget = toSpread * 2;
        setCurrentPageIndex(fromSpread * 2);
        flipCounterRef.current += 1;
        const nextKey = flipCounterRef.current;
        setFlipState({
          direction,
          fromSpread,
          toSpread,
          fromPage: currentPos,
          toPage: finalTarget,
          key: nextKey,
        });
        flipTimerRef.current = window.setTimeout(
          () => commitFlip(finalTarget, nextKey),
          FLIP_DURATION_SPREAD
        );
      } else {
        if (targetPageIndex === currentPos) return;
        const direction: 'next' | 'prev' = targetPageIndex > currentPos ? 'next' : 'prev';
        setCurrentPageIndex(currentPos);
        flipCounterRef.current += 1;
        const nextKey = flipCounterRef.current;
        setFlipState({
          direction,
          fromSpread,
          toSpread,
          fromPage: currentPos,
          toPage: targetPageIndex,
          key: nextKey,
        });
        flipTimerRef.current = window.setTimeout(
          () => commitFlip(targetPageIndex, nextKey),
          FLIP_DURATION_SINGLE
        );
      }
    },
    [commitFlip, currentPageIndex, flipState, isSpreadMode, resetZoom]
  );

  const goNext = useCallback(() => {
    const basePage = flipState
      ? isSpreadMode
        ? flipState.toSpread * 2
        : flipState.toPage
      : currentPageIndex;
    if (isSpreadMode) {
      const nextSpread = Math.floor(basePage / 2) + 1;
      if (nextSpread >= TOTAL_SPREADS) return;
      navigateToPage(nextSpread * 2);
    } else {
      if (basePage >= TOTAL_PAGES - 1) return;
      navigateToPage(basePage + 1);
    }
  }, [currentPageIndex, flipState, isSpreadMode, navigateToPage]);

  const goPrev = useCallback(() => {
    const basePage = flipState
      ? isSpreadMode
        ? flipState.toSpread * 2
        : flipState.toPage
      : currentPageIndex;
    if (isSpreadMode) {
      const prevSpread = Math.floor(basePage / 2) - 1;
      if (prevSpread < 0) return;
      navigateToPage(prevSpread * 2);
    } else {
      if (basePage <= 0) return;
      navigateToPage(basePage - 1);
    }
  }, [currentPageIndex, flipState, isSpreadMode, navigateToPage]);

  const handleSelectChapter = useCallback(
    (chapter: BookChapter) => {
      navigateToPage(chapter.startPageIndex);
    },
    [navigateToPage]
  );

  const handleSelectFrontMatter = useCallback(() => {
    navigateToPage(0);
  }, [navigateToPage]);

  // Keyboard arrow navigation & zoom reset
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (isTocOpen) return;
      if (e.key === 'ArrowRight') {
        e.preventDefault();
        goNext();
      } else if (e.key === 'ArrowLeft') {
        e.preventDefault();
        goPrev();
      } else if (e.key === '0' && (e.ctrlKey || e.metaKey)) {
        e.preventDefault();
        resetZoom();
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [goNext, goPrev, isTocOpen, resetZoom]);

  // Mouse Wheel Zoom & Two-Finger Pinch Zoom (touch monitor + mobile/tablet)
  useEffect(() => {
    const stage = stageRef.current;
    if (!stage) return;

    const onWheel = (e: WheelEvent) => {
      e.preventDefault();
      const currentZ = zoomRef.current;
      // Smooth normalized wheel delta (handles mouse notch & trackpad precision)
      const factor = Math.exp(-e.deltaY * 0.0018);
      const nextZ = clampZoom(currentZ * factor);

      if (nextZ <= 1.02) {
        setZoom(1);
        setPan({ x: 0, y: 0 });
        return;
      }

      const rect = stage.getBoundingClientRect();
      const centerX = rect.left + rect.width / 2;
      const centerY = rect.top + rect.height / 2;
      const pointerX = e.clientX - centerX;
      const pointerY = e.clientY - centerY;
      const ratio = nextZ / currentZ;

      const rawPanX = pointerX - (pointerX - panRef.current.x) * ratio;
      const rawPanY = pointerY - (pointerY - panRef.current.y) * ratio;

      setZoom(nextZ);
      setPan(clampPan(rawPanX, rawPanY, nextZ));
    };

    const getTouchMetrics = (t1: Touch, t2: Touch) => {
      const dx = t1.clientX - t2.clientX;
      const dy = t1.clientY - t2.clientY;
      const rect = stage.getBoundingClientRect();
      const centerX = rect.left + rect.width / 2;
      const centerY = rect.top + rect.height / 2;
      return {
        dist: Math.hypot(dx, dy),
        midX: (t1.clientX + t2.clientX) / 2 - centerX,
        midY: (t1.clientY + t2.clientY) / 2 - centerY,
      };
    };

    const onTouchStart = (e: TouchEvent) => {
      if (e.touches.length === 2) {
        e.preventDefault();
        const { dist, midX, midY } = getTouchMetrics(e.touches[0], e.touches[1]);
        pinchRef.current = {
          active: true,
          startDist: Math.max(dist, 1),
          startZoom: zoomRef.current,
          startPan: { ...panRef.current },
          startMidX: midX,
          startMidY: midY,
        };
        touchPanRef.current.active = false;
        touchSwipeCancelledRef.current = true;
      } else if (e.touches.length === 1) {
        touchSwipeCancelledRef.current = false;
        touchStartXRef.current = e.touches[0].clientX;
        touchStartYRef.current = e.touches[0].clientY;

        if (zoomRef.current > 1.02) {
          touchPanRef.current = {
            active: true,
            startX: e.touches[0].clientX,
            startY: e.touches[0].clientY,
            startPan: { ...panRef.current },
          };
        }
      }
    };

    const onTouchMove = (e: TouchEvent) => {
      if (e.touches.length === 2 && pinchRef.current.active) {
        e.preventDefault();
        const { dist, midX, midY } = getTouchMetrics(e.touches[0], e.touches[1]);
        const nextZ = clampZoom(
          pinchRef.current.startZoom * (dist / pinchRef.current.startDist)
        );
        if (nextZ <= 1.02) {
          setZoom(1);
          setPan({ x: 0, y: 0 });
          return;
        }
        const ratio = nextZ / pinchRef.current.startZoom;
        const rawPanX =
          midX - (pinchRef.current.startMidX - pinchRef.current.startPan.x) * ratio;
        const rawPanY =
          midY - (pinchRef.current.startMidY - pinchRef.current.startPan.y) * ratio;
        setZoom(nextZ);
        setPan(clampPan(rawPanX, rawPanY, nextZ));
      } else if (
        e.touches.length === 1 &&
        touchPanRef.current.active &&
        zoomRef.current > 1.02
      ) {
        e.preventDefault();
        const dx = e.touches[0].clientX - touchPanRef.current.startX;
        const dy = e.touches[0].clientY - touchPanRef.current.startY;
        setPan(
          clampPan(
            touchPanRef.current.startPan.x + dx,
            touchPanRef.current.startPan.y + dy,
            zoomRef.current
          )
        );
      }
    };

    const onTouchEnd = (e: TouchEvent) => {
      if (pinchRef.current.active && e.touches.length < 2) {
        pinchRef.current.active = false;
        // Re-anchor single touch pan if 1 finger stays down while zoomed
        if (e.touches.length === 1 && zoomRef.current > 1.02) {
          touchPanRef.current = {
            active: true,
            startX: e.touches[0].clientX,
            startY: e.touches[0].clientY,
            startPan: { ...panRef.current },
          };
        }
        return;
      }

      if (e.touches.length === 0) {
        touchPanRef.current.active = false;
        if (
          !touchSwipeCancelledRef.current &&
          zoomRef.current <= 1.02 &&
          touchStartXRef.current !== null &&
          touchStartYRef.current !== null &&
          e.changedTouches.length > 0
        ) {
          const dx = e.changedTouches[0].clientX - touchStartXRef.current;
          const dy = e.changedTouches[0].clientY - touchStartYRef.current;
          if (Math.abs(dx) > 48 && Math.abs(dx) > Math.abs(dy) * 1.2) {
            if (dx < 0) {
              goNext();
            } else {
              goPrev();
            }
          }
        }
        touchStartXRef.current = null;
        touchStartYRef.current = null;
      }
    };

    stage.addEventListener('wheel', onWheel, { passive: false });
    stage.addEventListener('touchstart', onTouchStart, { passive: false });
    stage.addEventListener('touchmove', onTouchMove, { passive: false });
    stage.addEventListener('touchend', onTouchEnd);
    stage.addEventListener('touchcancel', onTouchEnd);

    return () => {
      stage.removeEventListener('wheel', onWheel);
      stage.removeEventListener('touchstart', onTouchStart);
      stage.removeEventListener('touchmove', onTouchMove);
      stage.removeEventListener('touchend', onTouchEnd);
      stage.removeEventListener('touchcancel', onTouchEnd);
    };
  }, [clampPan, goNext, goPrev]);

  // Mouse drag-to-pan when zoomed in
  const handleMouseDown = (e: React.MouseEvent) => {
    if (zoomRef.current <= 1.02 || e.button !== 0) return;
    if ((e.target as HTMLElement).closest('button, a')) return;
    mousePanRef.current = {
      active: true,
      moved: false,
      startX: e.clientX,
      startY: e.clientY,
      startPan: { ...panRef.current },
    };
    setIsDraggingPan(true);
  };

  useEffect(() => {
    const onMouseMove = (e: MouseEvent) => {
      if (!mousePanRef.current.active) return;
      const dx = e.clientX - mousePanRef.current.startX;
      const dy = e.clientY - mousePanRef.current.startY;
      if (Math.abs(dx) > 3 || Math.abs(dy) > 3) {
        mousePanRef.current.moved = true;
      }
      setPan(
        clampPan(
          mousePanRef.current.startPan.x + dx,
          mousePanRef.current.startPan.y + dy,
          zoomRef.current
        )
      );
    };

    const onMouseUp = () => {
      if (!mousePanRef.current.active) return;
      mousePanRef.current.active = false;
      setIsDraggingPan(false);
    };

    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseup', onMouseUp);
    return () => {
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseup', onMouseUp);
    };
  }, [clampPan]);

  const handleDoubleClick = (e: React.MouseEvent) => {
    if ((e.target as HTMLElement).closest('button, a')) return;
    if (zoomRef.current > 1.05) {
      resetZoom();
      return;
    }
    const stage = stageRef.current;
    if (!stage) return;
    const rect = stage.getBoundingClientRect();
    const pointerX = e.clientX - (rect.left + rect.width / 2);
    const pointerY = e.clientY - (rect.top + rect.height / 2);
    const targetZoom = 1.75;
    setZoom(targetZoom);
    setPan(
      clampPan(
        pointerX - pointerX * targetZoom,
        pointerY - pointerY * targetZoom,
        targetZoom
      )
    );
  };

  // Determine spread pages for Desktop 2-page mode
  const spreadToRender = flipState ? flipState.fromSpread : currentSpread;
  const staticLeftPage =
    flipState && flipState.direction === 'prev'
      ? BOOK_PAGES[flipState.toSpread * 2]
      : BOOK_PAGES[spreadToRender * 2];
  const staticRightPage =
    flipState && flipState.direction === 'next'
      ? BOOK_PAGES[flipState.toSpread * 2 + 1]
      : BOOK_PAGES[spreadToRender * 2 + 1];

  const displayStep = isSpreadMode
    ? (flipState ? flipState.toSpread : currentSpread) + 1
    : (flipState ? flipState.toPage : currentPageIndex) + 1;
  const totalSteps = isSpreadMode ? TOTAL_SPREADS : TOTAL_PAGES;
  const isZoomed = zoom > 1.02;

  return (
    <div className="relative flex h-dvh w-full flex-col overflow-hidden bg-[#EAE5DC] text-stone-900 select-none">
      {/* Minimal Top Editorial Bar (3-zone contract) */}
      <header className="z-30 flex h-12 shrink-0 items-center justify-between gap-4 border-b border-orange-600/80 bg-orange-500 px-4 sm:px-6 text-white shadow-xs">
        <a
          href="#top"
          onClick={(e) => {
            e.preventDefault();
            handleSelectFrontMatter();
          }}
          className="font-editorial text-base sm:text-lg font-bold tracking-tight text-white whitespace-nowrap shrink-0"
        >
          알·쓸·신·안
        </a>

        <div className="flex min-w-0 items-center gap-2 text-xs sm:text-sm text-orange-50">
          {activeChapter ? (
            <>
              <span className="font-semibold text-white whitespace-nowrap shrink-0">
                {activeChapter.numberLabel}
              </span>
              <span aria-hidden="true" className="text-orange-200">
                ·
              </span>
              <span className="truncate font-medium text-orange-50">
                {activeChapter.title}
              </span>
            </>
          ) : (
            <span className="truncate font-medium text-white">
              {isSpreadMode
                ? '표지 · 목차'
                : activePageForDisplay === 0
                ? '책 표지'
                : '목차'}
            </span>
          )}
          <span aria-hidden="true" className="hidden sm:inline text-orange-200">
            ·
          </span>
          <span className="hidden sm:inline font-mono text-xs text-orange-100 tabular-nums whitespace-nowrap shrink-0">
            {String(displayStep).padStart(2, '0')} / {totalSteps}
          </span>
        </div>

        <button
          type="button"
          onClick={() => setIsTocOpen(true)}
          className="inline-flex items-center gap-1.5 rounded-lg border border-orange-200/70 bg-white px-3 py-1.5 text-xs font-semibold text-orange-700 shadow-xs transition-colors hover:bg-orange-50 whitespace-nowrap shrink-0 focus-visible:outline-2 focus-visible:outline-white cursor-pointer"
        >
          <BookOpen className="h-3.5 w-3.5 text-orange-600" />
          <span>목차</span>
        </button>
      </header>

      {/* Main 3D Webbook Reading Stage (Supports Wheel Zoom & Two-Finger Pinch Zoom) */}
      <main
        ref={stageRef}
        onMouseDown={handleMouseDown}
        onDoubleClick={handleDoubleClick}
        className={`relative flex flex-1 items-center justify-center overflow-hidden px-3 py-2 sm:px-14 sm:py-4 lg:px-20 touch-none ${
          isZoomed ? (isDraggingPan ? 'cursor-grabbing' : 'cursor-grab') : ''
        }`}
      >
        {/* Left Opaque White Arrow Button (Centered Vertically at Left Screen Edge) */}
        <button
          type="button"
          onClick={goPrev}
          disabled={!canPrev}
          aria-label="이전 페이지"
          className={`fixed left-2.5 sm:left-4 lg:left-7 top-1/2 -translate-y-1/2 z-30 flex h-11 w-11 sm:h-12 sm:w-12 items-center justify-center rounded-full bg-white border border-stone-200 shadow-[0_6px_22px_rgba(28,25,23,0.18)] transition-all duration-150 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-stone-900 ${
            canPrev
              ? 'text-stone-900 hover:scale-105 hover:shadow-[0_10px_28px_rgba(28,25,23,0.24)] active:scale-95 cursor-pointer'
              : 'text-stone-300 cursor-not-allowed'
          }`}
        >
          <ChevronLeft className="h-6 w-6 stroke-[2.25]" />
        </button>

        {/* Right Opaque White Arrow Button (Centered Vertically at Right Screen Edge) */}
        <button
          type="button"
          onClick={goNext}
          disabled={!canNext}
          aria-label="다음 페이지"
          className={`fixed right-2.5 sm:right-4 lg:right-7 top-1/2 -translate-y-1/2 z-30 flex h-11 w-11 sm:h-12 sm:w-12 items-center justify-center rounded-full bg-white border border-stone-200 shadow-[0_6px_22px_rgba(28,25,23,0.18)] transition-all duration-150 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-stone-900 ${
            canNext
              ? 'text-stone-900 hover:scale-105 hover:shadow-[0_10px_28px_rgba(28,25,23,0.24)] active:scale-95 cursor-pointer'
              : 'text-stone-300 cursor-not-allowed'
          }`}
        >
          <ChevronRight className="h-6 w-6 stroke-[2.25]" />
        </button>

        {/* Zoom & Pan Transform Layer */}
        <div
          className="flex items-center justify-center will-change-transform"
          style={{
            transform: `translate3d(${pan.x}px, ${pan.y}px, 0) scale(${zoom})`,
            transition:
              isDraggingPan || pinchRef.current.active
                ? 'none'
                : 'transform 120ms cubic-bezier(0.16, 1, 0.3, 1)',
          }}
        >
          {/* 3D Book Volume Container */}
          {isSpreadMode ? (
            <div
              className="relative flex items-center justify-center"
              style={
                {
                  width: 'min(calc(100vw - 148px), calc((100dvh - 110px) * 1.4131), 1240px)',
                  aspectRatio: '2480 / 1755',
                  '--pu':
                    'calc(min(calc(100vw - 148px), calc((100dvh - 110px) * 1.4131), 1240px) / 200)',
                } as React.CSSProperties
              }
            >
              {/* Outer Physical Book Cover / Page Stack Shadow */}
              <div
                ref={bookBoxRef}
                className="relative h-full w-full rounded-[4px] bg-[#FAF8F4] shadow-[0_22px_50px_-12px_rgba(28,25,23,0.34),0_4px_12px_rgba(28,25,23,0.12)] ring-1 ring-stone-900/10"
              >
                {/* Layered paper edge thickness illusion on left & right */}
                <div
                  aria-hidden="true"
                  className="pointer-events-none absolute -left-1.5 top-1 bottom-1 w-1.5 rounded-l-[2px] bg-gradient-to-r from-stone-400/70 via-stone-200 to-stone-300 shadow-inner"
                />
                <div
                  aria-hidden="true"
                  className="pointer-events-none absolute -right-1.5 top-1 bottom-1 w-1.5 rounded-r-[2px] bg-gradient-to-l from-stone-400/70 via-stone-200 to-stone-300 shadow-inner"
                />

                {/* Static Left Page */}
                <div className="absolute inset-y-0 left-0 w-1/2 overflow-hidden rounded-l-[3px] bg-white">
                  <BookPageSurface
                    page={staticLeftPage}
                    onSelectChapter={handleSelectChapter}
                    interactive={!flipState}
                  />
                  <div
                    aria-hidden="true"
                    className="pointer-events-none absolute inset-y-0 right-0 w-8 bg-gradient-to-l from-stone-950/[0.10] via-stone-950/[0.03] to-transparent"
                  />
                </div>

                {/* Static Right Page */}
                <div className="absolute inset-y-0 right-0 w-1/2 overflow-hidden rounded-r-[3px] bg-white">
                  <BookPageSurface
                    page={staticRightPage}
                    onSelectChapter={handleSelectChapter}
                    interactive={!flipState}
                  />
                  <div
                    aria-hidden="true"
                    className="pointer-events-none absolute inset-y-0 left-0 w-8 bg-gradient-to-r from-stone-950/[0.10] via-stone-950/[0.03] to-transparent"
                  />
                </div>

                {/* Center Book Spine Crease Line */}
                <div
                  aria-hidden="true"
                  className="pointer-events-none absolute inset-y-0 left-1/2 z-10 w-px -translate-x-1/2 bg-stone-900/15"
                />

                {/* Flexible Conical Bottom-to-Top Paper Curl Canvas */}
                {flipState && bookSize.width > 0 && bookSize.height > 0 && (
                  <PaperCurlCanvas
                    key={`spread-curl-${flipState.key}`}
                    isSpreadMode={true}
                    direction={flipState.direction}
                    fromSpread={flipState.fromSpread}
                    toSpread={flipState.toSpread}
                    fromPage={flipState.fromPage}
                    toPage={flipState.toPage}
                    pages={BOOK_PAGES}
                    width={bookSize.width}
                    height={bookSize.height}
                    onComplete={() => commitFlip(flipState.toSpread * 2, flipState.key)}
                  />
                )}
              </div>
            </div>
          ) : (
            /* Mobile / Narrow Viewport: Crisp Single-Page Mode with Flexible Paper Curl */
            <div
              className="relative flex items-center justify-center"
              style={
                {
                  width: 'min(calc(100vw - 24px), calc((100dvh - 104px) * 0.70655), 540px)',
                  aspectRatio: '1240 / 1755',
                  '--pu':
                    'calc(min(calc(100vw - 24px), calc((100dvh - 104px) * 0.70655), 540px) / 100)',
                } as React.CSSProperties
              }
            >
              <div
                ref={bookBoxRef}
                className="relative h-full w-full rounded-[4px] bg-white shadow-[0_18px_40px_-10px_rgba(28,25,23,0.32),0_4px_12px_rgba(28,25,23,0.12)] ring-1 ring-stone-900/10"
              >
                {/* Base Page Layer */}
                <div className="absolute inset-0 overflow-hidden rounded-[4px] bg-white">
                  <BookPageSurface
                    page={
                      flipState && flipState.direction === 'next'
                        ? BOOK_PAGES[flipState.toPage]
                        : BOOK_PAGES[flipState ? flipState.fromPage : currentPageIndex]
                    }
                    onSelectChapter={handleSelectChapter}
                    interactive={!flipState}
                  />
                  <div
                    aria-hidden="true"
                    className="pointer-events-none absolute inset-y-0 left-0 w-5 bg-gradient-to-r from-stone-950/[0.08] to-transparent"
                  />
                </div>

                {/* Flexible Conical Bottom-to-Top Paper Curl Canvas */}
                {flipState && bookSize.width > 0 && bookSize.height > 0 && (
                  <PaperCurlCanvas
                    key={`single-curl-${flipState.key}`}
                    isSpreadMode={false}
                    direction={flipState.direction}
                    fromSpread={flipState.fromSpread}
                    toSpread={flipState.toSpread}
                    fromPage={flipState.fromPage}
                    toPage={flipState.toPage}
                    pages={BOOK_PAGES}
                    width={bookSize.width}
                    height={bookSize.height}
                    onComplete={() => commitFlip(flipState.toPage, flipState.key)}
                  />
                )}
              </div>
            </div>
          )}
        </div>
      </main>

      {/* Clean Bottom Chapter Quick-Step & Zoom Strip */}
      <footer className="z-30 flex h-10 shrink-0 items-center justify-between border-t border-orange-600/80 bg-orange-500 px-3 sm:px-6 text-xs text-white">
        <div className="flex items-center gap-0.5 sm:gap-1 overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden py-1">
          <button
            type="button"
            onClick={handleSelectFrontMatter}
            title="표지 · 목차"
            className={`rounded px-2 py-0.5 font-mono text-xs tabular-nums transition-colors whitespace-nowrap shrink-0 focus-visible:outline-2 focus-visible:outline-white cursor-pointer ${
              activeChapter === null
                ? 'bg-white font-semibold text-orange-700 shadow-xs'
                : 'text-white/90 hover:bg-orange-600/70 hover:text-white'
            }`}
          >
            표지
          </button>
          {CHAPTERS.map((chapter) => {
            const isCurrent = activeChapter?.id === chapter.id;
            return (
              <button
                key={chapter.id}
                type="button"
                onClick={() => handleSelectChapter(chapter)}
                title={`${chapter.numberLabel} ${chapter.title}`}
                className={`rounded px-1.5 sm:px-2 py-0.5 font-mono text-xs tabular-nums transition-colors whitespace-nowrap shrink-0 focus-visible:outline-2 focus-visible:outline-white cursor-pointer ${
                  isCurrent
                    ? 'bg-white font-semibold text-orange-700 shadow-xs'
                    : 'text-white/90 hover:bg-orange-600/70 hover:text-white'
                }`}
              >
                {String(chapter.id).padStart(2, '0')}
              </button>
            );
          })}
        </div>

        <div className="ml-2 flex items-center gap-1.5 sm:gap-2 shrink-0">
          {/* Compact Zoom Controls */}
          <div className="hidden sm:flex items-center gap-0.5 border-r border-orange-400/80 pr-2.5">
            <button
              type="button"
              onClick={() => stepZoom(1 / 1.25)}
              disabled={zoom <= 1.02}
              aria-label="축소"
              title="축소"
              className="flex h-7 w-7 items-center justify-center rounded text-white/90 transition-colors hover:bg-orange-600/70 hover:text-white disabled:text-orange-200/50 disabled:hover:bg-transparent cursor-pointer disabled:cursor-not-allowed"
            >
              <ZoomOut className="h-3.5 w-3.5" />
            </button>
            <button
              type="button"
              onClick={resetZoom}
              disabled={!isZoomed}
              title="원래 크기 (100%)"
              className="min-w-[44px] rounded px-1.5 py-0.5 font-mono text-[11px] tabular-nums text-white transition-colors hover:bg-orange-600/70 disabled:hover:bg-transparent cursor-pointer disabled:cursor-default"
            >
              {Math.round(zoom * 100)}%
            </button>
            <button
              type="button"
              onClick={() => stepZoom(1.25)}
              disabled={zoom >= MAX_ZOOM - 0.01}
              aria-label="확대"
              title="확대"
              className="flex h-7 w-7 items-center justify-center rounded text-white/90 transition-colors hover:bg-orange-600/70 hover:text-white disabled:text-orange-200/50 disabled:hover:bg-transparent cursor-pointer disabled:cursor-not-allowed"
            >
              <ZoomIn className="h-3.5 w-3.5" />
            </button>
          </div>

          {isZoomed && (
            <button
              type="button"
              onClick={resetZoom}
              aria-label="화면 크기 초기화"
              className="sm:hidden inline-flex items-center gap-1 rounded bg-white px-2 py-0.5 font-mono text-[11px] font-semibold tabular-nums text-orange-700 shadow-xs"
            >
              <RotateCcw className="h-3 w-3" />
              <span>{Math.round(zoom * 100)}%</span>
            </button>
          )}

          <span className="font-mono text-xs tabular-nums text-white/95 whitespace-nowrap">
            {displayStep} / {totalSteps}
          </span>
        </div>
      </footer>

      <ChapterDrawer
        isOpen={isTocOpen}
        currentChapterId={activeChapter ? activeChapter.id : 0}
        onClose={() => setIsTocOpen(false)}
        onSelectFrontMatter={handleSelectFrontMatter}
        onSelectChapter={handleSelectChapter}
      />
    </div>
  );
}
