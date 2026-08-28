export default function Loading() {
  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-[#EFE9DD] overflow-hidden font-sans animate-[curtainFadeOut_0.8s_cubic-bezier(0.76,0,0.24,1)_2.2s_forwards]">
      {/* Logo + brand */}
      <div className="flex flex-col items-center gap-5 animate-[logoEnter_0.8s_ease-out_0.2s_both]">
        <img
          src="/logo.jpeg"
          alt="Shalistone"
          className="h-20 w-20 rounded-2xl object-cover shadow-xl sm:h-24 sm:w-24"
        />
        <h1
          className="text-xl font-black tracking-[0.2em] text-neutral-900 sm:text-2xl"
          style={{ fontFamily: "'Arial Black', 'Helvetica Neue', sans-serif" }}
        >
          SHALISTONE
        </h1>
        <div className="flex items-center gap-2 mt-1">
          <div className="h-1 w-1 rounded-full bg-neutral-400 animate-[dotPulse_1.2s_ease-in-out_infinite_0s]" />
          <div className="h-1 w-1 rounded-full bg-neutral-400 animate-[dotPulse_1.2s_ease-in-out_infinite_0.2s]" />
          <div className="h-1 w-1 rounded-full bg-neutral-400 animate-[dotPulse_1.2s_ease-in-out_infinite_0.4s]" />
        </div>
      </div>

      <style>{`
        @keyframes logoEnter {
          0% { opacity: 0; transform: scale(0.85) translateY(20px); }
          100% { opacity: 1; transform: scale(1) translateY(0); }
        }
        @keyframes curtainFadeOut {
          0% { opacity: 1; }
          100% { opacity: 0; pointer-events: none; visibility: hidden; }
        }
        @keyframes dotPulse {
          0%, 100% { opacity: 0.3; transform: scale(0.8); }
          50% { opacity: 1; transform: scale(1.3); }
        }
      `}</style>
    </div>
  );
}
