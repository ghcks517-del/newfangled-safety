import { CHAPTERS, TOTAL_CONTENT_PAGES, type BookChapter, type BookPage } from '../data/bookData';

// Uses CSS custom property --pu (1% of single page width) inherited from the book container.

export function BookCoverPage() {
  return (
    <div className="relative flex h-full w-full flex-col justify-between overflow-hidden bg-[#EBEFE7] text-[#1C241E]">
      <svg
        viewBox="0 0 620 878"
        preserveAspectRatio="none"
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 h-full w-full"
      >
        <defs>
          <linearGradient id="coverSky" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#F5F3EB" />
            <stop offset="55%" stopColor="#E6ECE3" />
            <stop offset="100%" stopColor="#D6E2D5" />
          </linearGradient>
        </defs>
        <rect width="620" height="878" fill="url(#coverSky)" />
        <path
          d="M0 630 Q180 570 360 620 T620 595 L620 878 L0 878 Z"
          fill="#C5D6C5"
          opacity="0.65"
        />
        <path
          d="M0 700 Q210 655 430 710 T620 685 L620 878 L0 878 Z"
          fill="#AFC5B1"
          opacity="0.55"
        />
        <rect
          x="28"
          y="28"
          width="564"
          height="822"
          fill="none"
          stroke="#1C241E"
          strokeOpacity="0.16"
          strokeWidth="1.2"
        />
      </svg>

      <div
        className="relative z-10 flex items-center justify-between border-b border-[#1C241E]/15"
        style={{
          marginInline: 'calc(8 * var(--pu))',
          marginTop: 'calc(7 * var(--pu))',
          paddingBottom: 'calc(2.5 * var(--pu))',
          fontSize: 'calc(2.3 * var(--pu))',
        }}
      >
        <span className="font-medium tracking-widest text-[#3D4B41]">
          현장 안전 실무 모음집
        </span>
        <span className="font-mono tabular-nums tracking-wider text-[#556459]">
          제1편 — 제10편
        </span>
      </div>

      <div
        className="relative z-10 flex flex-1 flex-col items-center justify-center text-center"
        style={{ paddingInline: 'calc(9 * var(--pu))' }}
      >
        <div
          style={{
            width: 'calc(21 * var(--pu))',
            height: 'calc(21 * var(--pu))',
            marginBottom: 'calc(5 * var(--pu))',
          }}
        >
          <svg
            viewBox="0 0 120 120"
            fill="none"
            aria-hidden="true"
            className="h-full w-full"
          >
            <circle
              cx="60"
              cy="60"
              r="54"
              fill="#F7F5EE"
              stroke="#1C241E"
              strokeOpacity="0.22"
              strokeWidth="1.5"
            />
            <circle
              cx="60"
              cy="60"
              r="46"
              stroke="#B45309"
              strokeOpacity="0.35"
              strokeWidth="1"
              strokeDasharray="3 3"
            />
            <path
              d="M32 64 C32 45 44 34 60 34 C76 34 88 45 88 64 Z"
              fill="#2B4C3B"
            />
            <path
              d="M55 34 L55 48 M65 34 L65 48"
              stroke="#F7F5EE"
              strokeWidth="2"
              strokeLinecap="round"
            />
            <rect
              x="25"
              y="63"
              width="70"
              height="6.5"
              rx="3.25"
              fill="#1C241E"
            />
            <path
              d="M60 44 V54 M55 49 H65"
              stroke="#F7F5EE"
              strokeWidth="2.6"
              strokeLinecap="round"
            />
            <path
              d="M46 80 L55 88 L75 73"
              stroke="#B45309"
              strokeWidth="3.2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </div>

        <p
          className="font-medium tracking-[0.22em] text-[#9A3412]"
          style={{
            fontSize: 'calc(2.5 * var(--pu))',
            marginBottom: 'calc(2.2 * var(--pu))',
          }}
        >
          ILLUSTRATED SAFETY BOOK
        </p>

        <h1
          className="font-editorial font-bold tracking-[0.14em] text-[#151D17]"
          style={{ fontSize: 'calc(12.5 * var(--pu))', lineHeight: 1.15 }}
        >
          알·쓸·신·안
        </h1>

        <div
          className="bg-[#1C241E]/25"
          style={{
            width: 'calc(16 * var(--pu))',
            height: '1.5px',
            marginBlock: 'calc(3.6 * var(--pu))',
          }}
        />

        <p
          className="font-editorial font-medium text-[#2E3A32]"
          style={{ fontSize: 'calc(4.1 * var(--pu))', lineHeight: 1.45 }}
        >
          알고보면 쓸모있는 신기한 안전
        </p>

        <p
          className="text-[#4F5D53]"
          style={{
            fontSize: 'calc(2.55 * var(--pu))',
            marginTop: 'calc(2.6 * var(--pu))',
            lineHeight: 1.6,
          }}
        >
          작업 전 꼭 확인해야 할 10가지 핵심 안전수칙
        </p>
      </div>

      <div
        className="relative z-10 border-t border-[#1C241E]/18 bg-[#F7F5EE]/85"
        style={{
          marginInline: 'calc(8 * var(--pu))',
          marginBottom: 'calc(7 * var(--pu))',
          paddingTop: 'calc(3 * var(--pu))',
          paddingBottom: 'calc(2.6 * var(--pu))',
          paddingInline: 'calc(3 * var(--pu))',
        }}
      >
        <p
          className="text-center font-medium text-[#2E3A32]"
          style={{ fontSize: 'calc(2.15 * var(--pu))', lineHeight: 1.75 }}
        >
          안전난간 · 밀폐공간 · 핸드그라인더 · 이동식 사다리 · 자동전격방지기
          <br />
          전체식 안전대 · LOTO · 줄걸이 작업 · 지게차 · 화학물질·MSDS
        </p>
        <p
          className="text-center tracking-wider text-[#5B685F]"
          style={{
            fontSize: 'calc(2.1 * var(--pu))',
            marginTop: 'calc(2 * var(--pu))',
          }}
        >
          창원안전환경팀 · 안전보건 웹북
        </p>
      </div>
    </div>
  );
}

interface BookTocPageProps {
  onSelectChapter?: (chapter: BookChapter) => void;
  interactive?: boolean;
}

export function BookTocPage({ onSelectChapter, interactive = true }: BookTocPageProps) {
  return (
    <div
      className="relative flex h-full w-full flex-col justify-between overflow-hidden bg-[#FAF8F4] text-stone-900"
      style={{ padding: 'calc(5.8 * var(--pu)) calc(6.5 * var(--pu))' }}
    >
      {/* Balanced Editorial TOC Header */}
      <div
        className="border-b-2 border-stone-900"
        style={{ paddingBottom: 'calc(2.2 * var(--pu))' }}
      >
        <p
          className="font-mono uppercase tracking-[0.22em] text-stone-500"
          style={{
            fontSize: 'calc(2.0 * var(--pu))',
            marginBottom: 'calc(0.6 * var(--pu))',
          }}
        >
          Table of Contents
        </p>
        <div className="flex items-baseline justify-between">
          <h2
            className="font-editorial font-bold tracking-wider text-stone-900"
            style={{ fontSize: 'calc(6.6 * var(--pu))', lineHeight: 1.1 }}
          >
            목 차
          </h2>
          <span
            className="font-mono font-medium tabular-nums text-stone-500"
            style={{ fontSize: 'calc(2.3 * var(--pu))' }}
          >
            총 {CHAPTERS.length}편 · {TOTAL_CONTENT_PAGES}쪽
          </span>
        </div>
      </div>

      {/* 10 Chapters List (Refined, Comfortable Text Scale) */}
      <ol
        className="flex flex-1 flex-col justify-between divide-y divide-stone-200/95"
        style={{ marginBlock: 'calc(1.8 * var(--pu))' }}
      >
        {CHAPTERS.map((chapter) => {
          const contentPageStart = chapter.startPageIndex - 1;
          const rowInner = (
            <div
              className="flex w-full items-center justify-between"
              style={{
                gap: 'calc(2.2 * var(--pu))',
                paddingBlock: 'calc(1.15 * var(--pu))',
              }}
            >
              <div
                className="flex min-w-0 items-center"
                style={{ gap: 'calc(2.4 * var(--pu))' }}
              >
                <span
                  className="shrink-0 font-mono font-semibold tabular-nums text-[#9A3412]"
                  style={{
                    fontSize: 'calc(2.9 * var(--pu))',
                    width: 'calc(4.6 * var(--pu))',
                  }}
                >
                  {String(chapter.id).padStart(2, '0')}
                </span>
                <div className="min-w-0">
                  <div className="flex items-baseline">
                    <span
                      className="truncate font-bold text-stone-900 group-hover:text-[#9A3412] transition-colors"
                      style={{
                        fontSize: 'calc(3.4 * var(--pu))',
                        lineHeight: 1.25,
                      }}
                    >
                      {chapter.title}
                    </span>
                  </div>
                  <p
                    className="truncate text-stone-500"
                    style={{
                      fontSize: 'calc(2.15 * var(--pu))',
                      marginTop: 'calc(0.35 * var(--pu))',
                      lineHeight: 1.25,
                    }}
                  >
                    {chapter.subtitle}
                  </p>
                </div>
              </div>

              <span
                className="shrink-0 font-mono tabular-nums text-stone-400 group-hover:text-stone-700"
                style={{ fontSize: 'calc(2.2 * var(--pu))' }}
              >
                p.{String(contentPageStart).padStart(2, '0')}
              </span>
            </div>
          );

          return (
            <li key={chapter.id} className="flex flex-1 items-center">
              {interactive && onSelectChapter ? (
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    onSelectChapter(chapter);
                  }}
                  style={{ paddingInline: 'calc(1.6 * var(--pu))' }}
                  className="group w-full rounded-md text-left transition-colors hover:bg-stone-200/65 focus-visible:outline-2 focus-visible:outline-stone-900 cursor-pointer"
                >
                  {rowInner}
                </button>
              ) : (
                <div
                  className="w-full"
                  style={{ paddingInline: 'calc(1.6 * var(--pu))' }}
                >
                  {rowInner}
                </div>
              )}
            </li>
          );
        })}
      </ol>

      {/* Footer note */}
      <div
        className="flex items-center justify-between border-t border-stone-300 text-stone-500"
        style={{
          paddingTop: 'calc(1.8 * var(--pu))',
          fontSize: 'calc(2.1 * var(--pu))',
        }}
      >
        <span>편 제목을 누르면 해당 장으로 바로 이동합니다.</span>
        <span className="font-mono font-medium tabular-nums">알·쓸·신·안</span>
      </div>
    </div>
  );
}

interface BookPageSurfaceProps {
  page: BookPage;
  onSelectChapter?: (chapter: BookChapter) => void;
  interactive?: boolean;
}

export function BookPageSurface({
  page,
  onSelectChapter,
  interactive = true,
}: BookPageSurfaceProps) {
  if (page.kind === 'cover') {
    return <BookCoverPage />;
  }
  if (page.kind === 'toc') {
    return <BookTocPage onSelectChapter={onSelectChapter} interactive={interactive} />;
  }
  return (
    <img
      src={page.src}
      alt={interactive ? page.alt : ''}
      referrerPolicy="no-referrer"
      draggable={false}
      decoding="sync"
      className="h-full w-full object-fill"
    />
  );
}
