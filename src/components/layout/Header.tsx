"use client"

import { signOut, useSession } from "next-auth/react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { GavelIcon } from "@/components/icons/GavelIcon"
import { useState } from "react"

export function Header() {
  const { data: session } = useSession()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const role = session?.user?.role
  const isAdmin = role === "ADMIN"
  const isUmpire = role === "UMPIRE"
  const canManage = isAdmin || isUmpire // ADMIN and UMPIRE can create/edit

  const roleBadge = role ? (
    <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-bold ${
      isAdmin ? "bg-red-500/20 text-red-200" :
      isUmpire ? "bg-yellow-500/20 text-yellow-200" :
      "bg-green-500/20 text-green-200"
    }`}>
      {role}
    </span>
  ) : null

  return (
    <header className="border-b bg-gradient-to-r from-green-600 to-blue-600 text-white shadow-lg">
      <div className="container mx-auto px-4">
        <div className="flex h-16 items-center justify-between">
          <Link href="/matches" className="text-xl md:text-2xl font-black flex items-center gap-2 hover:scale-105 transition-transform">
            <span className="text-2xl md:text-3xl">🏸</span>
            <span className="hidden sm:inline">ABL 2026</span>
            <span className="sm:hidden">ABL</span>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center gap-2">
            {session ? (
              <>
                <Link href="/matches">
                  <Button variant="ghost" className="text-white hover:bg-white/20 hover:text-white font-semibold">
                    🎯 Matches
                  </Button>
                </Link>
                <Link href="/tournaments">
                  <Button variant="ghost" className="text-white hover:bg-white/20 hover:text-white font-semibold">
                    🏆 Tournaments
                  </Button>
                </Link>
                <Link href="/auctions">
                  <Button variant="ghost" className="text-white hover:bg-white/20 hover:text-white font-semibold">
                    <GavelIcon size={16} className="inline-block mr-1" /> Auctions
                  </Button>
                </Link>
                <Link href="/players">
                  <Button variant="ghost" className="text-white hover:bg-white/20 hover:text-white font-semibold">
                    👥 Players
                  </Button>
                </Link>
                <div className="flex items-center gap-2 ml-4 pl-4 border-l border-white/30">
                  <div className="hidden lg:flex items-center gap-2 bg-white/10 px-3 py-1 rounded-full">
                    <span className="text-xs">👤</span>
                    <span className="text-sm font-medium">{session.user.email}</span>
                    {roleBadge}
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => signOut()}
                    className="bg-white text-green-700 hover:bg-green-50 border-0 font-semibold"
                  >
                    🚪 Logout
                  </Button>
                </div>
              </>
            ) : (
              <Link href="/login">
                <Button className="bg-white text-green-700 hover:bg-green-50 font-semibold">
                  🔐 Login
                </Button>
              </Link>
            )}
          </nav>

          {/* Mobile Menu Button */}
          {session && (
            <button
              className="md:hidden p-2 hover:bg-white/20 rounded"
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
          <nav className="md:hidden pb-4 space-y-2">
            <Link href="/matches" onClick={() => setMobileMenuOpen(false)}>
              <Button variant="ghost" className="w-full text-white hover:bg-white/20 hover:text-white font-semibold justify-start">
                🎯 Matches
              </Button>
            </Link>
            <Link href="/tournaments" onClick={() => setMobileMenuOpen(false)}>
              <Button variant="ghost" className="w-full text-white hover:bg-white/20 hover:text-white font-semibold justify-start">
                🏆 Tournaments
              </Button>
            </Link>
            <Link href="/auctions" onClick={() => setMobileMenuOpen(false)}>
              <Button variant="ghost" className="w-full text-white hover:bg-white/20 hover:text-white font-semibold justify-start">
                🏏 Auctions
              </Button>
            </Link>
            <Link href="/players" onClick={() => setMobileMenuOpen(false)}>
              <Button variant="ghost" className="w-full text-white hover:bg-white/20 hover:text-white font-semibold justify-start">
                👥 Players
              </Button>
            </Link>
            <div className="pt-2 border-t border-white/30">
              <div className="text-sm font-medium px-4 py-2 bg-white/10 rounded mb-2 flex items-center gap-2">
                👤 {session.user.email} {roleBadge}
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => signOut()}
                className="w-full bg-white text-green-700 hover:bg-green-50 border-0 font-semibold"
              >
                🚪 Logout
              </Button>
            </div>
          </nav>
        )}
      </div>
    </header>
  )
}
