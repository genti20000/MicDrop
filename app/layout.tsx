
import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import Link from 'next/link'
import React from 'react';

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'MicDrop | Premium Karaoke',
  description: 'Book your private karaoke room in London.',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className={`${inter.className} bg-slate-950 text-slate-100 min-h-screen flex flex-col`}>
        <nav className="border-b border-slate-800 bg-slate-950/80 backdrop-blur sticky top-0 z-50">
          <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
            <Link href="/" className="text-2xl font-black tracking-tighter text-transparent bg-clip-text bg-gradient-to-r from-fuchsia-500 to-cyan-500">
              MICDROP
            </Link>
            <div className="flex gap-4 text-sm font-medium">
              <Link href="/book" className="hover:text-fuchsia-400 transition">Book Now</Link>
              <Link href="/my-bookings" className="hover:text-cyan-400 transition">My Bookings</Link>
            </div>
          </div>
        </nav>
        <main className="flex-1">
          {children}
        </main>
        <footer className="py-8 text-center text-slate-600 text-sm border-t border-slate-900">
          <div className="flex flex-col gap-2">
            <p>© {new Date().getFullYear()} MicDrop Karaoke. All rights reserved.</p>
            <Link href="/admin" className="text-slate-800 hover:text-slate-500 transition-colors text-xs">
              Admin Portal
            </Link>
          </div>
        </footer>
      </body>
    </html>
  )
}
