
import Link from 'next/link';

export default function Home() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[calc(100vh-5rem)] p-4 text-center bg-neutral-950">
      
      <div className="relative z-10 max-w-3xl space-y-10 flex flex-col items-center">
        
        {/* CSS construction of the Logo provided in prompt */}
        <div className="w-48 h-48 md:w-64 md:h-64 rounded-full bg-brand-yellow flex flex-col items-center justify-center border-[8px] border-black shadow-2xl relative">
            <div className="absolute inset-0 rounded-full border border-dashed border-black/20 m-2"></div>
            <h1 className="text-black font-black text-4xl md:text-5xl leading-none uppercase tracking-tighter transform -rotate-2">
              London<br/>Karaoke<br/>Club
            </h1>
            <div className="mt-2 flex gap-4 text-black text-2xl">
              <span>★</span><span>★</span>
            </div>
        </div>

        <div className="space-y-4 max-w-lg mx-auto">
          <h2 className="text-3xl font-bold text-white tracking-tight">
            The Ultimate Private Karaoke Experience
          </h2>
          <p className="text-neutral-400 leading-relaxed">
            Clean sound. Private rooms. Unforgettable nights.<br/>
            <strong>£19 per person</strong> for 2 hours.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row gap-4 justify-center w-full max-w-md">
          <Link href="/book" className="px-8 py-4 bg-brand-yellow hover:bg-yellow-400 text-black font-black uppercase tracking-wider rounded-lg transition-all transform hover:-translate-y-1 w-full sm:w-auto">
            Book Room
          </Link>
          <Link href="/my-bookings" className="px-8 py-4 bg-neutral-900 hover:bg-neutral-800 text-white font-bold uppercase tracking-wider rounded-lg transition-all border border-neutral-800 w-full sm:w-auto">
            Manage Booking
          </Link>
        </div>
      </div>
    </div>
  )
}
