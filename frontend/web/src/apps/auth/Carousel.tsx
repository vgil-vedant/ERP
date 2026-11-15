import { useEffect, useRef, useState } from 'react';

export interface Slide { title: string; text: string }

export function Carousel({ slides }: { slides: Slide[] }) {
  const [i, setI] = useState(0);
  const paused = useRef(false);
  const touchX = useRef<number | null>(null);
  const n = slides.length;
  const show = (k: number) => setI(((k % n) + n) % n);

  useEffect(() => {
    const reduce = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
    const t = window.setInterval(() => { if (!paused.current) setI((c) => (c + 1) % n); }, reduce ? 8000 : 5000);
    return () => window.clearInterval(t);
  }, [n]);

  return (
    <div
      className="lg-carousel relative mx-auto mb-[18px] h-32 w-full max-w-[640px] flex-none rounded-xl px-6 text-center outline-offset-4"
      tabIndex={0} aria-roledescription="carousel" aria-label="Highlights"
      onMouseEnter={() => { paused.current = true; }} onMouseLeave={() => { paused.current = false; }}
      onFocus={() => { paused.current = true; }} onBlur={() => { paused.current = false; }}
      onKeyDown={(e) => { if (e.key === 'ArrowRight') show(i + 1); else if (e.key === 'ArrowLeft') show(i - 1); }}
      onTouchStart={(e) => { paused.current = true; touchX.current = e.touches[0].clientX; }}
      onTouchEnd={(e) => {
        paused.current = false;
        if (touchX.current === null) return;
        const dx = e.changedTouches[0].clientX - touchX.current; touchX.current = null;
        if (Math.abs(dx) > 40) show(i + (dx < 0 ? 1 : -1));
      }}
    >
      {slides.map((s, k) => (
        <div key={s.title} className={`lg-slide absolute inset-x-0 bottom-[30px] top-0 flex flex-col items-center justify-end transition-[opacity,visibility] duration-[600ms] ${k === i ? 'visible opacity-100' : 'invisible opacity-0'}`}>
          <h2 className="m-0 mb-[6px] text-[19px] font-normal capitalize tracking-[-.02em] text-[#111]">{s.title}</h2>
          <p className="m-0 max-w-[500px] text-[13px] leading-[1.5] text-[#111]">{s.text}</p>
        </div>
      ))}
      <div className="lg-dots absolute inset-x-0 bottom-[6px] flex justify-center gap-2" role="tablist" aria-label="Choose a highlight">
        {slides.map((s, k) => (
          <button
            key={s.title} type="button" role="tab" aria-label={`Highlight ${k + 1}`} aria-selected={k === i}
            onClick={() => show(k)}
            className={`relative h-2 cursor-pointer rounded-lg border-0 p-0 transition-[width,background] duration-[350ms] ${k === i ? 'w-6 bg-[#111]' : 'w-2 bg-[rgba(17,17,17,.30)] hover:bg-[rgba(17,17,17,.55)]'}`}
          />
        ))}
      </div>
    </div>
  );
}
