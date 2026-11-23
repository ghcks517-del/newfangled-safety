export interface BookChapter {
  id: number;
  numberLabel: string;
  title: string;
  subtitle: string;
  startPageIndex: number; // 0-based index in BOOK_PAGES (0=Cover, 1=TOC, 2..41=Chapters)
  pageCount: number;
}

export type BookPageKind = 'cover' | 'toc' | 'image';

export interface BookPage {
  index: number; // 0 to 41
  pageNumber: number; // 1 to 42
  kind: BookPageKind;
  chapterId: number; // 0 for front matter (cover/toc), 1..10 for chapters
  src?: string;
  alt: string;
  label: string;
}

export const CHAPTERS: BookChapter[] = [
  {
    id: 1,
    numberLabel: '01편',
    title: '안전난간',
    subtitle: '한 번의 실수가 추락으로 이어지지 않도록',
    startPageIndex: 2,
    pageCount: 4,
  },
  {
    id: 2,
    numberLabel: '02편',
    title: '밀폐공간(질식)',
    subtitle: '들어가기 전, 공기부터 확인하세요',
    startPageIndex: 6,
    pageCount: 4,
  },
  {
    id: 3,
    numberLabel: '03편',
    title: '핸드그라인더',
    subtitle: '작은 불꽃 뒤에 숨은 큰 위험',
    startPageIndex: 10,
    pageCount: 4,
  },
  {
    id: 4,
    numberLabel: '04편',
    title: '이동식 사다리',
    subtitle: '익숙한 사다리, 익숙해서 더 위험합니다',
    startPageIndex: 14,
    pageCount: 4,
  },
  {
    id: 5,
    numberLabel: '05편',
    title: '자동전격방지기',
    subtitle: '불티보다 무서운, 보이지 않는 전기',
    startPageIndex: 18,
    pageCount: 4,
  },
  {
    id: 6,
    numberLabel: '06편',
    title: '전체식 안전대',
    subtitle: '안전대, 입었다고 끝일까?',
    startPageIndex: 22,
    pageCount: 4,
  },
  {
    id: 7,
    numberLabel: '07편',
    title: 'LOTO (에너지 차단)',
    subtitle: 'OFF 했다고, 안전한 것은 아닙니다',
    startPageIndex: 26,
    pageCount: 4,
  },
  {
    id: 8,
    numberLabel: '08편',
    title: '줄걸이 작업',
    subtitle: '매달린 중량물, 그 아래 위험구역',
    startPageIndex: 30,
    pageCount: 4,
  },
  {
    id: 9,
    numberLabel: '09편',
    title: '지게차',
    subtitle: '지게차의 위험 사각지대',
    startPageIndex: 34,
    pageCount: 4,
  },
  {
    id: 10,
    numberLabel: '10편',
    title: '화학물질·MSDS',
    subtitle: '화학물질, 알고 사용하시나요?',
    startPageIndex: 38,
    pageCount: 6,
  },
];

export const TOTAL_CONTENT_PAGES = CHAPTERS.reduce((sum, ch) => sum + ch.pageCount, 0);

const PAGE_LABELS = ['표지', '1페이지', '2페이지', '핵심 안전기준', '작성 샘플 1', '작성 샘플 2'];
const ASSET_VERSION = '3';

export const BOOK_PAGES: BookPage[] = [
  {
    index: 0,
    pageNumber: 1,
    kind: 'cover',
    chapterId: 0,
    alt: '알쓸신안 책 표지',
    label: '책 표지',
  },
  {
    index: 1,
    pageNumber: 2,
    kind: 'toc',
    chapterId: 0,
    alt: '알쓸신안 목차',
    label: '목차',
  },
  ...CHAPTERS.flatMap((chapter) =>
    Array.from({ length: chapter.pageCount }, (_, offset) => {
      const index = chapter.startPageIndex + offset;
      const pageNumber = index + 1;
      const assetPadded = String(index - 1).padStart(2, '0');
      return {
        index,
        pageNumber,
        kind: 'image' as const,
        chapterId: chapter.id,
        src: `/book/page_${assetPadded}.webp?v=${ASSET_VERSION}`,
        alt: `알쓸신안 ${chapter.numberLabel} ${chapter.title} - ${PAGE_LABELS[offset] ?? `${offset + 1}페이지`}`,
        label: PAGE_LABELS[offset] ?? `${offset + 1}페이지`,
      };
    })
  ),
];

export function getChapterForPage(pageIndex: number): BookChapter | null {
  return (
    CHAPTERS.find(
      (ch) => pageIndex >= ch.startPageIndex && pageIndex < ch.startPageIndex + ch.pageCount
    ) ?? null
  );
}
