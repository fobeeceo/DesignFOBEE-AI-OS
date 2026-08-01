'use client';

import { useEffect, useRef } from 'react';

type RevealProps = {
  children: React.ReactNode;
  className?: string;
  /** 자식 요소 등장 지연 (ms) */
  delay?: number;
};

/** 뷰포트 진입 시 한 번 페이드업되는 스크롤 리빌 래퍼 */
export default function Reveal({ children, className = '', delay = 0 }: RevealProps) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    // threshold를 0으로 둔다. 이전 값(0.12)은 섹션이 뷰포트보다 크면 충족되기 어려웠다
    // — 예: 뷰포트 307px / 섹션 1204px 이면 교차 비율이 최대 0.25까지밖에 오르지 않고,
    // iOS Safari처럼 주소창 때문에 뷰포트가 실시간으로 줄어드는 환경에서는 더 낮아져
    // 콜백이 아예 발화하지 않았다. 0이면 1픽셀이라도 걸치는 순간 발화한다.
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          el.classList.add('is-visible');
          observer.disconnect();
        }
      },
      { threshold: 0, rootMargin: '0px 0px -10% 0px' }
    );

    observer.observe(el);

    // 관찰이 어떤 이유로든 실패해도 애니메이션이 끝난 상태로 정착시키는 안전장치.
    // (콘텐츠 자체는 CSS 기본값으로 이미 보이므로, 이건 위치만 바로잡는 용도다.)
    const fallback = window.setTimeout(() => el.classList.add('is-visible'), 1500);

    return () => {
      observer.disconnect();
      window.clearTimeout(fallback);
    };
  }, []);

  return (
    <div
      ref={ref}
      className={`reveal ${className}`}
      style={delay ? { transitionDelay: `${delay}ms` } : undefined}
    >
      {children}
    </div>
  );
}
