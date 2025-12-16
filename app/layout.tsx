
import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import Link from 'next/link'
import React from 'react';

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'London Karaoke Club',
  description: 'Book your private karaoke experience in London.',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className={`${inter.className} bg-neutral-950 text-white min-h-screen flex flex-col relative`}>
        
        {/* Disco Ball */}
        <div className="disco-ball-container" aria-hidden="true">
          <div className="disco-string"></div>
          <div className="disco-ball"></div>
        </div>

        {/* Mirror Sparkles Animation Layers */}
        <div className="mirror-sparkles-container" aria-hidden="true">
          {Array.from({ length: 40 }).map((_, i) => (
            <div 
              key={`sparkle-${i}`}
              className="sparkle"
              style={{
                '--x': `${Math.random() * 100}%`,
                '--y': `${Math.random() * 100}%`,
                '--size': `${Math.random() * 4 + 2}px`,
                '--duration': `${Math.random() * 4 + 3}s`,
                '--delay': `${Math.random() * 5}s`
              } as React.CSSProperties}
            />
          ))}
        </div>

        {/* Musical Notes Animation Layers */}
        <div className="musical-notes-container" aria-hidden="true">
          {Array.from({ length: 20 }).map((_, i) => (
            <span 
              key={`note-${i}`}
              className="note"
              style={{
                '--x': `${Math.random() * 100}%`,
                '--duration': `${Math.random() * 8 + 5}s`,
                '--delay': `${Math.random() * 10}s`
              } as React.CSSProperties}
            >
              {['♪', '♫', '♬', '♩'][Math.floor(Math.random() * 4)]}
            </span>
          ))}
        </div>

        <nav className="border-b border-neutral-800 bg-neutral-950/90 backdrop-blur sticky top-0 z-50">
          <div className="max-w-6xl mx-auto px-4 h-20 flex items-center justify-between">
            <Link href="/" className="flex items-center gap-3 group">
              <img 
                src="https://assets.zyrosite.com/cdn-cgi/image/format=auto,w=375,fit=crop,q=95/m7V3XokxQ0Hbg2KE/new-YNq2gqz36OInJMrE.png" 
                alt="LKC Logo" 
                className="w-12 h-12 object-contain group-hover:scale-105 transition-transform" 
              />
              <span className="text-lg font-black tracking-tighter text-white group-hover:text-brand-yellow transition-colors uppercase hidden sm:block">
                London Karaoke Club
              </span>
            </Link>
            <div className="flex gap-6 text-sm font-bold uppercase tracking-wide">
              <Link href="/book" className="text-neutral-400 hover:text-brand-yellow transition-colors">Book Now</Link>
              <Link href="/my-bookings" className="text-neutral-400 hover:text-brand-yellow transition-colors">My Bookings</Link>
            </div>
          </div>
        </nav>
        <main className="flex-1 relative z-10">
          {children}
        </main>
        <footer className="py-12 text-center text-neutral-500 text-sm border-t border-neutral-900 bg-black relative z-10">
          <div className="flex flex-col gap-4">
            <h4 className="font-bold text-white uppercase tracking-widest">London Karaoke Club</h4>
            <p>© {new Date().getFullYear()} All rights reserved.</p>
            <Link href="/admin" className="text-neutral-700 hover:text-neutral-500 transition-colors text-xs">
              Staff Access
            </Link>
          </div>
        </footer>
      </body>
    </html>
  )
}
