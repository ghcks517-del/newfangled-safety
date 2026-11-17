import { useEffect } from 'react';
import { X } from 'lucide-react';
import { CHAPTERS, type BookChapter } from '../data/bookData';

interface ChapterDrawerProps {
  isOpen: boolean;
  currentChapterId: number; // 0 = Cover/TOC, 1..10 = Chapters
  onClose: () => void;
  onSelectFrontMatter: () => void;
  onSelectChapter: (chapter: BookChapter) => void;
}

export function ChapterDrawer({
  isOpen,
  currentChapterId,
  onClose,
  onSelectFrontMatter,
  onSelectChapter,
}: ChapterDrawerProps) {
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex justify-end"
      role="dialog"
      aria-modal="true"
      aria-label="목차"
    >
      <div
        className="fixed inset-0 bg-stone-950/35 backdrop-blur-[2px] transition-opacity"
        onClick={onClose}
        aria-hidden="true"
      />

      <aside className="relative z-10 flex h-full w-full max-w-sm flex-col bg-[#FBF9F5] text-stone-900 shadow-2xl border-l border-stone-200">
        <div className="flex items-center justify-between border-b border-stone-200 px-6 py-4">
          <div>
            <p className="text-xs tracking-wider text-stone-500">목차</p>
            <h2 className="font-editorial text-lg font-bold text-stone-900">
              알·쓸·신·안 전체 편성
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="목차 닫기"
            className="flex h-10 w-10 items-center justify-center rounded-full text-stone-600 transition-colors hover:bg-stone-200/70 hover:text-stone-900 focus-visible:outline-2 focus-visible:outline-stone-900 cursor-pointer"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <nav className="flex-1 overflow-y-auto px-4 py-2.5" aria-label="챕터 목록">
          <ul className="divide-y divide-stone-200/80">
            <li>
              <button
                type="button"
                onClick={() => {
                  onSelectFrontMatter();
                  onClose();
                }}
                className={`group flex w-full items-start gap-3 rounded-lg px-3 py-2.5 text-left transition-colors focus-visible:outline-2 focus-visible:outline-stone-900 cursor-pointer ${
                  currentChapterId === 0
                    ? 'bg-stone-900 text-stone-50'
                    : 'hover:bg-stone-200/60 text-stone-900'
                }`}
              >
                <span
                  className={`mt-0.5 shrink-0 font-mono text-xs font-semibold tabular-nums ${
                    currentChapterId === 0 ? 'text-stone-300' : 'text-stone-500'
                  }`}
                >
                  00
                </span>
                <div className="min-w-0 flex-1">
                  <div className="flex items-baseline justify-between gap-2">
                    <span className="truncate text-sm font-semibold">
                      표지 · 목차
                    </span>
                  </div>
                  <p
                    className={`mt-0.5 truncate text-xs ${
                      currentChapterId === 0 ? 'text-stone-300' : 'text-stone-500'
                    }`}
                  >
                    알고보면 쓸모있는 신기한 안전
                  </p>
                </div>
              </button>
            </li>

            {CHAPTERS.map((chapter) => {
              const isActive = chapter.id === currentChapterId;
              return (
                <li key={chapter.id}>
                  <button
                    type="button"
                    onClick={() => {
                      onSelectChapter(chapter);
                      onClose();
                    }}
                    className={`group flex w-full items-start gap-3 rounded-lg px-3 py-2.5 text-left transition-colors focus-visible:outline-2 focus-visible:outline-stone-900 cursor-pointer ${
                      isActive
                        ? 'bg-stone-900 text-stone-50'
                        : 'hover:bg-stone-200/60 text-stone-900'
                    }`}
                  >
                    <span
                      className={`mt-0.5 shrink-0 font-mono text-xs font-semibold tabular-nums ${
                        isActive ? 'text-stone-300' : 'text-stone-500'
                      }`}
                    >
                      {String(chapter.id).padStart(2, '0')}
                    </span>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-baseline justify-between gap-2">
                        <span className="truncate text-sm font-semibold">
                          {chapter.title}
                        </span>
                        <span
                          className={`shrink-0 text-[11px] tabular-nums ${
                            isActive ? 'text-stone-300' : 'text-stone-400'
                          }`}
                        >
                          {chapter.numberLabel}
                        </span>
                      </div>
                      <p
                        className={`mt-0.5 truncate text-xs ${
                          isActive ? 'text-stone-300' : 'text-stone-500'
                        }`}
                      >
                        {chapter.subtitle}
                      </p>
                    </div>
                  </button>
                </li>
              );
            })}
          </ul>
        </nav>

        <div className="border-t border-stone-200 px-6 py-3.5 text-xs text-stone-500">
          마우스 휠 또는 두 손가락 터치로 화면을 확대·축소할 수 있습니다.
        </div>
      </aside>
    </div>
  );
}
