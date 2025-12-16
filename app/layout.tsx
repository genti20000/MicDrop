
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
      <body className={`${inter.className} bg-neutral-950 text-white min-h-screen flex flex-col`}>
        <nav className="border-b border-neutral-800 bg-neutral-950/90 backdrop-blur sticky top-0 z-50">
          <div className="max-w-6xl mx-auto px-4 h-20 flex items-center justify-between">
            <Link href="/" className="flex items-center gap-3 group">
              {/* CSS Representation of the Logo */}
              <div className="w-10 h-10 rounded-full bg-brand-yellow flex items-center justify-center border-2 border-black group-hover:scale-105 transition-transform">
                <div className="text-black text-[10px] font-black leading-tight text-center">
                  LKC
                </div>
              </div>
              <span className="text-lg font-black tracking-tighter text-white group-hover:text-brand-yellow transition-colors uppercase">
                London Karaoke Club
              </span>
            </Link>
            <div className="flex gap-6 text-sm font-bold uppercase tracking-wide">
              <Link href="/book" className="text-neutral-400 hover:text-brand-yellow transition-colors">Book Now</Link>
              <Link href="/my-bookings" className="text-neutral-400 hover:text-brand-yellow transition-colors">My Bookings</Link>
            </div>
          </div>
        </nav>
        <main className="flex-1">
          {children}
        </main>
        <footer className="py-12 text-center text-neutral-500 text-sm border-t border-neutral-900 bg-black">
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
