
import Link from 'next/link';

export default function Home() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[calc(100vh-4rem)] p-4 text-center bg-[url('/bg-noise.png')]">
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-slate-950/50 to-slate-950 pointer-events-none" />
      
      <div className="relative z-10 max-w-2xl space-y-8">
        <h1 className="text-5xl md:text-7xl font-black tracking-tighter text-white drop-shadow-[0_0_15px_rgba(236,72,153,0.5)]">
          SING LIKE A <br/>
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-fuchsia-500 to-cyan-500">LEGEND</span>
        </h1>
        <p className="text-xl text-slate-400">
          London's premier private karaoke experience. <br/>
          High-fidelity audio. Soundproof luxury. Neon vibes.
        </p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link href="/book" className="px-8 py-4 bg-fuchsia-600 hover:bg-fuchsia-500 text-white font-bold rounded-full transition-all shadow-[0_0_20px_rgba(192,38,211,0.4)] hover:shadow-[0_0_30px_rgba(192,38,211,0.6)]">
            Book a Room
          </Link>
          <Link href="/my-bookings" className="px-8 py-4 border border-slate-700 hover:border-cyan-500 hover:text-cyan-400 text-slate-300 font-bold rounded-full transition-all">
            Manage Booking
          </Link>
        </div>
      </div>
    </div>
  )
}
