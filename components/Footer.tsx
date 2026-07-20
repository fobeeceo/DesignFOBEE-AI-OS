export default function Footer() {
  return (
    <footer className="w-full border-t border-line">
      <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-4 px-6 py-10 text-xs text-ink-faint md:flex-row">
        <div className="flex items-baseline gap-2">
          <span className="font-display text-sm font-bold text-ink">
            DesignFOBEE<span className="text-clay"> AI</span>
          </span>
          <span>© 2026 DesignFOBEE. All rights reserved.</span>
        </div>
        <div className="flex items-center gap-4">
          <span>이미지 1장 원가 약 70원 · Nano Banana 2 기준</span>
          <a
            href="https://aistudio.google.com/apikey"
            target="_blank"
            rel="noopener noreferrer"
            className="font-semibold text-ink-soft transition-colors hover:text-clay"
          >
            무료 API 키 발급
          </a>
        </div>
      </div>
    </footer>
  );
}
