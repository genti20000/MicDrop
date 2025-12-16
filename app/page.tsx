
import Link from 'next/link';

export default function Home() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[calc(100vh-5rem)] p-4 text-center bg-neutral-950">
      
      <div className="relative z-10 max-w-3xl space-y-10 flex flex-col items-center">
        
        {/* Real Logo */}
        <div className="relative group">
            <div className="absolute -inset-4 bg-brand-yellow/10 rounded-full blur-2xl opacity-50 group-hover:opacity-75 transition duration-1000"></div>
            <img 
                src="https://assets.zyrosite.com/cdn-cgi/image/format=auto,w=375,fit=crop,q=95/m7V3XokxQ0Hbg2KE/new-YNq2gqz36OInJMrE.png" 
                alt="London Karaoke Club" 
                className="w-64 h-64 md:w-80 md:h-80 object-contain relative z-10 drop-shadow-2xl hover:scale-105 transition-transform duration-500" 
            />
        </div>

        <div className="space-y-4 max-w-lg mx-auto">
          <h1 className="text-4xl md:text-5xl font-black text-white tracking-tighter uppercase leading-none">
            London Karaoke Club
          </h1>
          <p className="text-neutral-400 leading-relaxed text-lg">
            The ultimate private karaoke experience.<br/>
            <strong className="text-brand-yellow">£19 per person</strong> for the first 2 hours.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row gap-4 justify-center w-full max-w-md">
          <Link href="/book" className="px-8 py-4 bg-brand-yellow hover:bg-yellow-400 text-black font-black uppercase tracking-wider rounded-lg transition-all transform hover:-translate-y-1 w-full sm:w-auto shadow-[0_0_20px_rgba(255,215,0,0.3)] hover:shadow-[0_0_30px_rgba(255,215,0,0.5)]">
            Book Room
          </Link>
          <Link href="/my-bookings" className="px-8 py-4 bg-neutral-900 hover:bg-neutral-800 text-white font-bold uppercase tracking-wider rounded-lg transition-all border border-neutral-800 w-full sm:w-auto hover:border-neutral-600">
            Manage Booking
          </Link>
        </div>
      </div>
    </div>
  )
}
