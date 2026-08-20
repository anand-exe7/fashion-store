export default function Loading() {
  return (
    <div className="fixed inset-0 z-[9999] pointer-events-none flex overflow-hidden font-sans">
      {/* Left Curtain */}
      <div className="w-1/2 h-full bg-[#E5E0D5] relative overflow-hidden origin-left animate-[slideLeft_1.2s_cubic-bezier(0.8,0,0.2,1)_0.8s_forwards]">
        <h1 className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-1/2 text-2xl sm:text-4xl md:text-6xl tracking-[0.12em] sm:tracking-[0.3em] font-bold uppercase text-black whitespace-nowrap">
          SHALISTONE
        </h1>
      </div>

      {/* Right Curtain */}
      <div className="w-1/2 h-full bg-[#E5E0D5] relative overflow-hidden origin-right animate-[slideRight_1.2s_cubic-bezier(0.8,0,0.2,1)_0.8s_forwards]">
        <h1 className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-1/2 text-2xl sm:text-4xl md:text-6xl tracking-[0.12em] sm:tracking-[0.3em] font-bold uppercase text-black whitespace-nowrap">
          SHALISTONE
        </h1>
      </div>

      <style>{`
        @keyframes slideLeft {
          0% { transform: scaleX(1); }
          100% { transform: scaleX(0); }
        }
        @keyframes slideRight {
          0% { transform: scaleX(1); }
          100% { transform: scaleX(0); }
        }
      `}</style>
    </div>
  );
}
