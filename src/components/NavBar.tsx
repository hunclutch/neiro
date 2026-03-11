'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import type { User } from '@supabase/supabase-js'

export default function NavBar() {
  const [user, setUser] = useState<User | null>(null)
  const [menuOpen, setMenuOpen] = useState(false)
  const router = useRouter()
  const pathname = usePathname()
  const supabase = createClient()

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => setUser(data.user))
    const { data: listener } = supabase.auth.onAuthStateChange((_, session) => {
      setUser(session?.user ?? null)
    })
    return () => listener.subscription.unsubscribe()
  }, [])

  const handleSignOut = async () => {
    await supabase.auth.signOut()
    router.push('/')
    router.refresh()
  }

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-[#0a0a0f]/80 backdrop-blur-md border-b border-white/10">
      <div className="max-w-6xl mx-auto px-4 h-14 flex items-center justify-between">
        <Link href="/" className="text-xl font-bold text-blue-400 tracking-tight">
          🎵 Neiro
        </Link>

        {/* Desktop nav */}
        <div className="hidden md:flex items-center gap-4">
          <Link
            href="/"
            className={`text-sm px-3 py-1.5 rounded-full transition-colors ${pathname === '/' ? 'bg-blue-600 text-white' : 'text-gray-300 hover:text-white'}`}
          >
            Feed
          </Link>
          {user && (
            <>
              <Link
                href="/upload"
                className="text-sm px-3 py-1.5 rounded-full bg-blue-600 hover:bg-blue-500 transition-colors text-white"
              >
                + Upload
              </Link>
              <Link
                href={`/profile/${user.id}`}
                className="text-sm px-3 py-1.5 rounded-full text-gray-300 hover:text-white transition-colors"
              >
                Profile
              </Link>
              <button
                onClick={handleSignOut}
                className="text-sm px-3 py-1.5 rounded-full text-gray-400 hover:text-white transition-colors"
              >
                Sign Out
              </button>
            </>
          )}
          {!user && (
            <>
              <Link href="/login" className="text-sm text-gray-300 hover:text-white transition-colors">
                Log In
              </Link>
              <Link href="/signup" className="text-sm px-4 py-1.5 rounded-full bg-blue-600 hover:bg-blue-500 transition-colors text-white">
                Sign Up
              </Link>
            </>
          )}
        </div>

        {/* Mobile hamburger */}
        <button
          className="md:hidden text-gray-300 hover:text-white"
          onClick={() => setMenuOpen(!menuOpen)}
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            {menuOpen
              ? <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              : <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />}
          </svg>
        </button>
      </div>

      {/* Mobile menu */}
      {menuOpen && (
        <div className="md:hidden bg-[#0d0d1a] border-t border-white/10 px-4 py-3 flex flex-col gap-3">
          <Link href="/" onClick={() => setMenuOpen(false)} className="text-sm text-gray-300 hover:text-white">Feed</Link>
          {user ? (
            <>
              <Link href="/upload" onClick={() => setMenuOpen(false)} className="text-sm text-blue-400 hover:text-blue-300">+ Upload</Link>
              <Link href={`/profile/${user.id}`} onClick={() => setMenuOpen(false)} className="text-sm text-gray-300 hover:text-white">Profile</Link>
              <button onClick={() => { handleSignOut(); setMenuOpen(false) }} className="text-sm text-left text-gray-400 hover:text-white">Sign Out</button>
            </>
          ) : (
            <>
              <Link href="/login" onClick={() => setMenuOpen(false)} className="text-sm text-gray-300 hover:text-white">Log In</Link>
              <Link href="/signup" onClick={() => setMenuOpen(false)} className="text-sm text-blue-400 hover:text-blue-300">Sign Up</Link>
            </>
          )}
        </div>
      )}
    </nav>
  )
}
