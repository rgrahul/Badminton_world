import { redirect } from "next/navigation"
import { auth } from "@/lib/auth"
import Link from "next/link"
import { Button } from "@/components/ui/button"

function BirdieLogo({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 120 100" fill="none" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="featherGrad" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#e2e8f0" />
          <stop offset="100%" stopColor="#94a3b8" />
        </linearGradient>
        <linearGradient id="wingGrad" x1="0" y1="0" x2="1" y2="0.5">
          <stop offset="0%" stopColor="#7dd3fc" />
          <stop offset="100%" stopColor="#bae6fd" />
        </linearGradient>
        <linearGradient id="corkGrad" x1="0.5" y1="0" x2="0.5" y2="1">
          <stop offset="0%" stopColor="#fbbf24" />
          <stop offset="100%" stopColor="#d97706" />
        </linearGradient>
      </defs>
      {/* Cork base */}
      <ellipse cx="60" cy="82" rx="10" ry="11" fill="url(#corkGrad)" />
      <ellipse cx="60" cy="78" rx="8" ry="3" fill="#fde68a" opacity="0.5" />
      {/* Cork ring */}
      <ellipse cx="60" cy="72" rx="9" ry="3" fill="none" stroke="#d97706" strokeWidth="1.5" opacity="0.6" />
      {/* Feathers - center */}
      <path d="M60 70 C58 55, 55 35, 55 15 C55 10, 58 8, 60 8 C62 8, 65 10, 65 15 C65 35, 62 55, 60 70Z" fill="url(#featherGrad)" opacity="0.9" />
      {/* Feathers - inner left */}
      <path d="M57 70 C53 55, 46 35, 43 18 C42 13, 45 10, 48 12 C52 18, 55 45, 57 70Z" fill="url(#featherGrad)" opacity="0.8" />
      {/* Feathers - inner right */}
      <path d="M63 70 C67 55, 74 35, 77 18 C78 13, 75 10, 72 12 C68 18, 65 45, 63 70Z" fill="url(#featherGrad)" opacity="0.8" />
      {/* Feathers - outer left */}
      <path d="M54 70 C48 57, 38 40, 33 25 C31 20, 34 17, 37 19 C42 26, 50 50, 54 70Z" fill="url(#featherGrad)" opacity="0.65" />
      {/* Feathers - outer right */}
      <path d="M66 70 C72 57, 82 40, 87 25 C89 20, 86 17, 83 19 C78 26, 70 50, 66 70Z" fill="url(#featherGrad)" opacity="0.65" />
      {/* Left wing */}
      <path d="M45 58 C35 50, 18 48, 5 52 C3 53, 3 55, 5 55 C15 54, 30 56, 42 62Z" fill="url(#wingGrad)" opacity="0.85" />
      <path d="M43 54 C33 44, 15 38, 2 40 C0 40, 0 42, 2 43 C12 44, 28 48, 40 56Z" fill="url(#wingGrad)" opacity="0.6" />
      <path d="M44 62 C36 56, 22 55, 10 58 C8 59, 8 61, 10 61 C20 60, 34 61, 44 65Z" fill="url(#wingGrad)" opacity="0.5" />
      {/* Right wing */}
      <path d="M75 58 C85 50, 102 48, 115 52 C117 53, 117 55, 115 55 C105 54, 90 56, 78 62Z" fill="url(#wingGrad)" opacity="0.85" />
      <path d="M77 54 C87 44, 105 38, 118 40 C120 40, 120 42, 118 43 C108 44, 92 48, 80 56Z" fill="url(#wingGrad)" opacity="0.6" />
      <path d="M76 62 C84 56, 98 55, 110 58 C112 59, 112 61, 110 61 C100 60, 86 61, 76 65Z" fill="url(#wingGrad)" opacity="0.5" />
    </svg>
  )
}


function RacketIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 100 140" fill="none" xmlns="http://www.w3.org/2000/svg">
      <ellipse cx="50" cy="40" rx="30" ry="38" stroke="currentColor" strokeWidth="3" fill="none" opacity="0.7" />
      <line x1="50" y1="2" x2="50" y2="78" stroke="currentColor" strokeWidth="1.5" opacity="0.3" />
      <line x1="20" y1="40" x2="80" y2="40" stroke="currentColor" strokeWidth="1.5" opacity="0.3" />
      <line x1="24" y1="25" x2="76" y2="25" stroke="currentColor" strokeWidth="1" opacity="0.2" />
      <line x1="24" y1="55" x2="76" y2="55" stroke="currentColor" strokeWidth="1" opacity="0.2" />
      <line x1="35" y1="3" x2="35" y2="77" stroke="currentColor" strokeWidth="1" opacity="0.2" />
      <line x1="65" y1="3" x2="65" y2="77" stroke="currentColor" strokeWidth="1" opacity="0.2" />
      <rect x="46" y="78" width="8" height="40" rx="4" fill="currentColor" opacity="0.5" />
      <rect x="43" y="112" width="14" height="10" rx="3" fill="currentColor" opacity="0.4" />
    </svg>
  )
}

function CourtSVG({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 400 200" fill="none" xmlns="http://www.w3.org/2000/svg">
      {/* Court outline */}
      <rect x="10" y="10" width="380" height="180" stroke="currentColor" strokeWidth="1.5" opacity="0.3" rx="2" />
      {/* Center line */}
      <line x1="200" y1="10" x2="200" y2="190" stroke="currentColor" strokeWidth="1.5" opacity="0.4" />
      {/* Net */}
      <line x1="200" y1="5" x2="200" y2="195" stroke="currentColor" strokeWidth="2" opacity="0.6" strokeDasharray="4 3" />
      {/* Service lines */}
      <line x1="80" y1="10" x2="80" y2="190" stroke="currentColor" strokeWidth="1" opacity="0.2" />
      <line x1="320" y1="10" x2="320" y2="190" stroke="currentColor" strokeWidth="1" opacity="0.2" />
      {/* Center service lines */}
      <line x1="80" y1="100" x2="200" y2="100" stroke="currentColor" strokeWidth="1" opacity="0.2" />
      <line x1="200" y1="100" x2="320" y2="100" stroke="currentColor" strokeWidth="1" opacity="0.2" />
      {/* Doubles sidelines */}
      <rect x="25" y="25" width="350" height="150" stroke="currentColor" strokeWidth="1" opacity="0.15" rx="1" />
    </svg>
  )
}

export default async function Home() {
  const session = await auth()

  if (session) {
    redirect("/matches")
  }

  return (
    <main className="min-h-screen bg-[#0a0a0a] text-white overflow-hidden">
      {/* Watermark shuttlecocks & rackets */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden opacity-[0.03]">
        <BirdieLogo className="absolute top-[3%] left-[5%] w-40 h-40 rotate-[-18deg]" />
        <RacketIcon className="absolute top-[8%] left-[60%] w-36 h-48 rotate-[28deg]" />
        <BirdieLogo className="absolute top-[20%] right-[8%] w-44 h-44 rotate-[12deg]" />
        <RacketIcon className="absolute top-[30%] left-[15%] w-36 h-48 rotate-[-25deg]" />
        <BirdieLogo className="absolute top-[45%] left-[55%] w-40 h-40 rotate-[22deg]" />
        <RacketIcon className="absolute top-[50%] right-[5%] w-32 h-44 rotate-[-15deg]" />
        <BirdieLogo className="absolute top-[65%] left-[3%] w-44 h-44 rotate-[30deg]" />
        <RacketIcon className="absolute top-[70%] left-[45%] w-36 h-48 rotate-[-35deg]" />
        <BirdieLogo className="absolute top-[85%] right-[10%] w-40 h-40 rotate-[8deg]" />
        <RacketIcon className="absolute top-[90%] left-[20%] w-32 h-44 rotate-[20deg]" />
      </div>

      {/* Navigation */}
      <nav className="relative z-20 px-6 md:px-12 pt-6 pb-4 max-w-7xl mx-auto">
        <div className="flex items-center justify-end gap-3">
          <Link href="/login">
            <Button variant="ghost" className="text-gray-300 hover:text-white hover:bg-white/10 rounded-full px-5">
              Log in
            </Button>
          </Link>
          <Link href="/register">
            <Button className="bg-white text-black hover:bg-gray-200 rounded-full px-5 font-medium">
              Sign up
            </Button>
          </Link>
        </div>
        <div className="flex items-center justify-center gap-3 mt-2">
          <BirdieLogo className="w-28 h-28 md:w-36 md:h-36" />
          <span className="text-6xl md:text-8xl font-bold tracking-tight">
            <span className="text-sky-300">Bird</span><span className="text-amber-400">ie</span>
          </span>
        </div>
      </nav>

      {/* Hero */}
      <section className="relative z-10 flex flex-col items-center justify-center text-center px-6 pt-12 md:pt-20 pb-8">
        <h1 className="text-5xl md:text-7xl lg:text-8xl font-bold tracking-tight max-w-4xl leading-[1.05]">
          Score matches
          <span className="block bg-gradient-to-r from-emerald-400 via-cyan-400 to-emerald-300 bg-clip-text text-transparent">
            like a pro
          </span>
        </h1>

        <p className="mt-6 text-lg md:text-xl text-gray-400 max-w-2xl leading-relaxed">
          Professional badminton match scoring, tournament management, and player analytics — all in one place.
        </p>

        <div className="flex flex-col sm:flex-row gap-4 mt-10">
          <Link href="/register">
            <Button size="lg" className="bg-gradient-to-r from-emerald-500 to-cyan-500 hover:from-emerald-400 hover:to-cyan-400 text-black font-semibold rounded-full px-8 py-6 text-base shadow-[0_0_30px_rgba(16,185,129,0.3)] hover:shadow-[0_0_40px_rgba(16,185,129,0.4)] transition-all">
              Get Started Free
            </Button>
          </Link>
          <Link href="/login">
            <Button size="lg" className="bg-transparent border border-white/20 !text-white hover:bg-white/10 rounded-full px-8 py-6 text-base backdrop-blur-sm transition-all">
              Log in
            </Button>
          </Link>
        </div>

        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/5 border border-white/10 text-sm text-gray-400 mt-10 backdrop-blur-sm">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          Official BWF Rules & Regulations
        </div>
      </section>

      {/* Court illustration section */}
      <section className="relative z-10 max-w-4xl mx-auto px-6 py-12">
        <div className="relative rounded-3xl border border-white/10 bg-white/[0.02] backdrop-blur-sm p-8 md:p-12 overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-b from-emerald-500/5 to-transparent pointer-events-none" />
          <CourtSVG className="w-full h-auto text-emerald-400 relative z-10" />
          {/* Scoreboard overlay */}
          <div className="absolute top-6 left-1/2 -translate-x-1/2 flex items-center gap-4 bg-black/60 backdrop-blur-md rounded-2xl px-6 py-3 border border-white/10 z-20">
            <div className="text-2xl md:text-3xl font-bold text-emerald-400">21</div>
            <div className="text-gray-500 text-sm font-medium px-2">-</div>
            <div className="text-2xl md:text-3xl font-bold text-cyan-400">19</div>
          </div>
          {/* Shuttlecock on court */}
          <BirdieLogo className="absolute bottom-10 left-1/2 -translate-x-1/2 w-8 h-8 text-yellow-300/60 z-10" />
        </div>
      </section>

      {/* Feature cards */}
      <section className="relative z-10 max-w-6xl mx-auto px-6 py-16">
        <h2 className="text-3xl md:text-4xl font-bold text-center mb-4">
          Everything you need for
          <span className="bg-gradient-to-r from-emerald-400 to-cyan-400 bg-clip-text text-transparent"> match day</span>
        </h2>
        <p className="text-gray-400 text-center mb-12 max-w-xl mx-auto">
          From casual club games to competitive tournaments, our tools keep every rally counted.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {/* Live Scoring */}
          <div className="group relative rounded-2xl border border-white/10 bg-white/[0.03] backdrop-blur-sm p-8 hover:border-emerald-500/30 hover:bg-white/[0.06] transition-all duration-300">
            <div className="w-12 h-12 rounded-xl bg-emerald-500/10 flex items-center justify-center mb-5">
              <BirdieLogo className="w-7 h-7 text-emerald-400" />
            </div>
            <h3 className="text-lg font-semibold mb-2">Live Scoring</h3>
            <p className="text-sm text-gray-400 leading-relaxed">
              Real-time match scoring with automatic BWF rule enforcement. Track every rally, game, and set with precision.
            </p>
            <div className="mt-5 flex items-baseline gap-3 text-emerald-400/60 text-xs font-mono">
              <span className="px-2 py-1 rounded bg-emerald-500/10">21 - 19</span>
              <span className="px-2 py-1 rounded bg-emerald-500/10">Game 2</span>
            </div>
          </div>

          {/* Tournaments */}
          <div className="group relative rounded-2xl border border-white/10 bg-white/[0.03] backdrop-blur-sm p-8 hover:border-cyan-500/30 hover:bg-white/[0.06] transition-all duration-300">
            <div className="w-12 h-12 rounded-xl bg-cyan-500/10 flex items-center justify-center mb-5">
              <svg className="w-6 h-6 text-cyan-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
              </svg>
            </div>
            <h3 className="text-lg font-semibold mb-2">Tournaments</h3>
            <p className="text-sm text-gray-400 leading-relaxed">
              Create full tournaments with group stages, knockout brackets, and team matches. Manage draws and advance teams automatically.
            </p>
            <div className="mt-5 flex items-center gap-2 text-cyan-400/60 text-xs font-mono">
              <span className="px-2 py-1 rounded bg-cyan-500/10">Groups</span>
              <span className="text-gray-600">&rarr;</span>
              <span className="px-2 py-1 rounded bg-cyan-500/10">Knockouts</span>
              <span className="text-gray-600">&rarr;</span>
              <span className="px-2 py-1 rounded bg-cyan-500/10">Final</span>
            </div>
          </div>

          {/* Player Auction */}
          <div className="group relative rounded-2xl border border-white/10 bg-white/[0.03] backdrop-blur-sm p-8 hover:border-amber-500/30 hover:bg-white/[0.06] transition-all duration-300">
            <div className="w-12 h-12 rounded-xl bg-amber-500/10 flex items-center justify-center mb-5">
              <svg className="w-6 h-6 text-amber-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h3 className="text-lg font-semibold mb-2">Player Auction</h3>
            <p className="text-sm text-gray-400 leading-relaxed">
              Run live player auctions for team-based tournaments. Set budgets, place bids, and build your dream team in real-time.
            </p>
            <div className="mt-5 flex items-center gap-2 text-amber-400/60 text-xs font-mono">
              <span className="px-2 py-1 rounded bg-amber-500/10">Budget: 100k</span>
              <span className="px-2 py-1 rounded bg-amber-500/10">Live Bids</span>
            </div>
          </div>
        </div>

        {/* Second row */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mt-5">
          {/* Player Analytics */}
          <div className="group relative rounded-2xl border border-white/10 bg-white/[0.03] backdrop-blur-sm p-8 hover:border-emerald-500/30 hover:bg-white/[0.06] transition-all duration-300">
            <div className="w-12 h-12 rounded-xl bg-emerald-500/10 flex items-center justify-center mb-5">
              <svg className="w-6 h-6 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
            </div>
            <h3 className="text-lg font-semibold mb-2">Player Management</h3>
            <p className="text-sm text-gray-400 leading-relaxed">
              Maintain a full player database with profiles, skill ratings, match history, and performance analytics. Bulk import players via CSV.
            </p>
            <div className="mt-5 flex items-center gap-1 text-emerald-400/60">
              {[40, 65, 45, 80, 55, 90, 70].map((h, i) => (
                <div key={i} className="w-3 rounded-sm bg-emerald-500/20" style={{ height: `${h * 0.3}px` }} />
              ))}
            </div>
          </div>

          {/* Team Matches */}
          <div className="group relative rounded-2xl border border-white/10 bg-white/[0.03] backdrop-blur-sm p-8 hover:border-purple-500/30 hover:bg-white/[0.06] transition-all duration-300">
            <div className="w-12 h-12 rounded-xl bg-purple-500/10 flex items-center justify-center mb-5">
              <svg className="w-6 h-6 text-purple-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
              </svg>
            </div>
            <h3 className="text-lg font-semibold mb-2">Team Matches</h3>
            <p className="text-sm text-gray-400 leading-relaxed">
              Set up team-vs-team fixtures with multiple individual matches per tie. Assign players to fixtures and track team standings.
            </p>
            <div className="mt-5 flex items-center gap-2 text-purple-400/60 text-xs font-mono">
              <span className="px-2 py-1 rounded bg-purple-500/10">Team A</span>
              <span className="text-gray-600">vs</span>
              <span className="px-2 py-1 rounded bg-purple-500/10">Team B</span>
              <span className="px-2 py-1 rounded bg-purple-500/10">5 fixtures</span>
            </div>
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="relative z-10 max-w-5xl mx-auto px-6 py-16">
        <h2 className="text-3xl md:text-4xl font-bold text-center mb-16">
          From first serve to
          <span className="bg-gradient-to-r from-emerald-400 to-cyan-400 bg-clip-text text-transparent"> match point</span>
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 relative">
          {/* Connecting line */}
          <div className="hidden md:block absolute top-10 left-[20%] right-[20%] h-px bg-gradient-to-r from-emerald-500/30 via-cyan-500/30 to-emerald-500/30" />

          <div className="text-center">
            <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-emerald-500/20 to-emerald-500/5 border border-emerald-500/20 flex items-center justify-center mx-auto mb-5 relative">
              <RacketIcon className="w-10 h-14 text-emerald-400" />
              <span className="absolute -top-2 -right-2 w-6 h-6 rounded-full bg-emerald-500 text-black text-xs font-bold flex items-center justify-center">1</span>
            </div>
            <h3 className="font-semibold text-lg mb-2">Set Up Match</h3>
            <p className="text-sm text-gray-400">Add players, choose singles or doubles, and select match format.</p>
          </div>

          <div className="text-center">
            <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-cyan-500/20 to-cyan-500/5 border border-cyan-500/20 flex items-center justify-center mx-auto mb-5 relative">
              <BirdieLogo className="w-10 h-10 text-cyan-400" />
              <span className="absolute -top-2 -right-2 w-6 h-6 rounded-full bg-cyan-500 text-black text-xs font-bold flex items-center justify-center">2</span>
            </div>
            <h3 className="font-semibold text-lg mb-2">Score Live</h3>
            <p className="text-sm text-gray-400">Tap to score each rally. Rules, service, and sides are handled automatically.</p>
          </div>

          <div className="text-center">
            <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-emerald-500/20 to-emerald-500/5 border border-emerald-500/20 flex items-center justify-center mx-auto mb-5 relative">
              <svg className="w-8 h-8 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
              <span className="absolute -top-2 -right-2 w-6 h-6 rounded-full bg-emerald-500 text-black text-xs font-bold flex items-center justify-center">3</span>
            </div>
            <h3 className="font-semibold text-lg mb-2">Review Stats</h3>
            <p className="text-sm text-gray-400">Get detailed match summaries, player stats, and performance trends.</p>
          </div>
        </div>
      </section>


      {/* CTA Section */}
      <section className="relative z-10 max-w-4xl mx-auto px-6 py-16 text-center">
        <div className="relative rounded-3xl border border-white/10 bg-gradient-to-br from-emerald-500/10 via-transparent to-cyan-500/10 p-12 md:p-16 overflow-hidden">
          <div className="absolute top-4 right-8 opacity-10">
            <RacketIcon className="w-32 h-44 text-white rotate-[20deg]" />
          </div>
          <div className="absolute bottom-4 left-8 opacity-10">
            <BirdieLogo className="w-20 h-20 text-white rotate-[-15deg]" />
          </div>

          <h2 className="text-3xl md:text-5xl font-bold mb-4 relative z-10">Ready to play?</h2>
          <p className="text-gray-400 text-lg mb-8 max-w-lg mx-auto relative z-10">
            Join and start scoring your matches with professional-grade tools.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center relative z-10">
            <Link href="/register">
              <Button size="lg" className="bg-gradient-to-r from-emerald-500 to-cyan-500 hover:from-emerald-400 hover:to-cyan-400 text-black font-semibold rounded-full px-10 py-6 text-base shadow-[0_0_30px_rgba(16,185,129,0.3)] hover:shadow-[0_0_40px_rgba(16,185,129,0.4)] transition-all">
                Create Free Account
              </Button>
            </Link>
            <Link href="/login">
              <Button size="lg" className="bg-transparent border border-white/20 !text-white hover:bg-white/10 rounded-full px-10 py-6 text-base backdrop-blur-sm transition-all">
                Log in
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="relative z-10 border-t border-white/5 py-8">
        <div className="max-w-7xl mx-auto px-6 flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2 text-sm">
            <BirdieLogo className="w-6 h-6" />
            <span><span className="text-sky-300">Bird</span><span className="text-amber-400">ie</span></span>
            <span className="text-gray-500">— Built for the sport we love.</span>
          </div>
          <div className="flex items-center gap-6 text-sm text-gray-600">
            <span>BWF Compliant</span>
            <span className="w-1 h-1 rounded-full bg-gray-700" />
            <span>Singles & Doubles</span>
            <span className="w-1 h-1 rounded-full bg-gray-700" />
            <span>Free to Use</span>
          </div>
        </div>
      </footer>
    </main>
  )
}
