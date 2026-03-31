"use client"

import { signOut, useSession } from "next-auth/react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { GavelIcon } from "@/components/icons/GavelIcon"
import { BirdieLogo } from "@/components/icons/BirdieLogo"
import { useState } from "react"

export function Header() {
  const { data: session } = useSession()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const role = session?.user?.role
  const isAdmin = role === "ADMIN"
  const isUmpire = role === "UMPIRE"
  const canManage = isAdmin || isUmpire

  const roleBadge = role ? (
    <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-bold ${
      isAdmin ? "bg-red-500/20 text-red-400" :
      isUmpire ? "bg-amber-500/20 text-amber-400" :
      "bg-emerald-500/20 text-emerald-400"
    }`}>
      {role}
    </span>
  ) : null

  return (
    <header className="border-b border-white/10 bg-[#0a0a0a]/80 backdrop-blur-md text-white sticky top-0 z-50">
      <div className="container mx-auto px-4">
        <div className="flex h-16 items-center justify-between">
          <Link href="/matches" className="text-2xl md:text-3xl font-bold flex items-center gap-1 hover:opacity-80 transition-opacity">
            <BirdieLogo className="w-14 h-14" />
            <span className="text-sky-300">Bird</span><span className="text-amber-400">ie</span>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center gap-1">
            {session ? (
              <>
                <Link href="/matches">
                  <Button variant="ghost" className="text-gray-300 hover:text-white hover:bg-white/10 font-medium">
                    <svg className="w-4 h-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" /></svg>
                    Matches
                  </Button>
                </Link>
                <Link href="/tournaments">
                  <Button variant="ghost" className="text-gray-300 hover:text-white hover:bg-white/10 font-medium">
                    <svg className="w-4 h-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" /></svg>
                    Tournaments
                  </Button>
                </Link>
                <Link href="/auctions">
                  <Button variant="ghost" className="text-gray-300 hover:text-white hover:bg-white/10 font-medium">
                    <GavelIcon size={16} className="inline-block mr-1" /> Auctions
                  </Button>
                </Link>
                <Link href="/players">
                  <Button variant="ghost" className="text-gray-300 hover:text-white hover:bg-white/10 font-medium">
                    <svg className="w-4 h-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                    Players
                  </Button>
                </Link>
                <div className="flex items-center gap-2 ml-4 pl-4 border-l border-white/10">
                  <div className="hidden lg:flex items-center gap-2 bg-white/5 px-3 py-1.5 rounded-full border border-white/10">
                    <span className="text-sm text-gray-400">{session.user.email}</span>
                    {roleBadge}
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => signOut()}
                    className="text-gray-400 hover:text-white hover:bg-white/10"
                  >
                    Logout
                  </Button>
                </div>
              </>
            ) : (
              <Link href="/login">
                <Button className="bg-gradient-to-r from-emerald-500 to-cyan-500 text-black font-semibold hover:from-emerald-400 hover:to-cyan-400">
                  Login
                </Button>
              </Link>
            )}
          </nav>

          {/* Mobile Menu Button */}
          {session && (
            <button
              className="md:hidden p-2 hover:bg-white/10 rounded-lg transition-colors"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                {mobileMenuOpen ? (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                ) : (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                )}
              </svg>
            </button>
          )}
        </div>

        {/* Mobile Navigation */}
        {mobileMenuOpen && session && (
          <nav className="md:hidden pb-4 space-y-1 border-t border-white/10 pt-3">
            <Link href="/matches" onClick={() => setMobileMenuOpen(false)}>
              <Button variant="ghost" className="w-full text-gray-300 hover:text-white hover:bg-white/10 font-medium justify-start">
                Matches
              </Button>
            </Link>
            <Link href="/tournaments" onClick={() => setMobileMenuOpen(false)}>
              <Button variant="ghost" className="w-full text-gray-300 hover:text-white hover:bg-white/10 font-medium justify-start">
                Tournaments
              </Button>
            </Link>
            <Link href="/auctions" onClick={() => setMobileMenuOpen(false)}>
              <Button variant="ghost" className="w-full text-gray-300 hover:text-white hover:bg-white/10 font-medium justify-start">
                Auctions
              </Button>
            </Link>
            <Link href="/players" onClick={() => setMobileMenuOpen(false)}>
              <Button variant="ghost" className="w-full text-gray-300 hover:text-white hover:bg-white/10 font-medium justify-start">
                Players
              </Button>
            </Link>
            <div className="pt-2 border-t border-white/10">
              <div className="text-sm px-4 py-2 bg-white/5 rounded-lg mb-2 flex items-center gap-2 text-gray-400">
                {session.user.email} {roleBadge}
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => signOut()}
                className="w-full text-gray-400 hover:text-white hover:bg-white/10 justify-start"
              >
                Logout
              </Button>
            </div>
          </nav>
        )}
      </div>
    </header>
  )
}
