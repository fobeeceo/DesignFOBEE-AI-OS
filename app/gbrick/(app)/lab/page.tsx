export default function LabPage() {
  return (
    <main className="flex flex-col items-center justify-center min-h-[70svh] pb-24 px-6 text-center"
      style={{ background: "#F7F4F0" }}>
      <div className="w-20 h-20 rounded-full flex items-center justify-center mb-5"
        style={{ background: "linear-gradient(135deg, #1A0E05, #3D2210)" }}>
        <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
          <path d="M9 3H5a2 2 0 00-2 2v4m6-6h10a2 2 0 012 2v4M5 9h14"/>
          <path d="M5 14s1 0 2 1 4 1 4 1 3 0 4-1 2-1 2-1"/>
        </svg>
      </div>
      <p className="text-xs font-bold tracking-widest mb-2" style={{ color: "#C8873A" }}>COMING SOON</p>
      <h1 className="text-xl font-black mb-2" style={{ color: "#1A0E05" }}>지브릭 실험실</h1>
      <p className="text-sm text-stone-500 leading-relaxed">
        새로운 메뉴와 경험을<br />준비하고 있습니다
      </p>
    </main>
  );
}
