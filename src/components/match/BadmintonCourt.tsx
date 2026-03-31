"use client"

interface CourtPositions {
  sideA: { rightCourt: string; leftCourt: string }
  sideB: { rightCourt: string; leftCourt: string }
}

interface BadmintonCourtProps {
  sideAPlayer1: string
  sideAPlayer2?: string | null
  sideBPlayer1: string
  sideBPlayer2?: string | null
  servingSide: string
  serverName: string
  scoreA: number
  scoreB: number
  matchType: string
  positions?: CourtPositions | null
  courtSwapped?: boolean
}

function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/)
  if (parts.length === 1) return parts[0].charAt(0).toUpperCase()
  return (parts[0].charAt(0) + parts[parts.length - 1].charAt(0)).toUpperCase()
}

export function BadmintonCourt({
  sideAPlayer1,
  sideAPlayer2,
  sideBPlayer1,
  sideBPlayer2,
  servingSide,
  serverName,
  scoreA,
  scoreB,
  matchType,
  positions,
  courtSwapped = false,
}: BadmintonCourtProps) {
  const serverScore = servingSide === "A" ? scoreA : scoreB
  // BWF rule: even score = right court, odd score = left court
  const serverCourt: "right" | "left" = serverScore % 2 === 0 ? "right" : "left"

  const isSingles = matchType === "SINGLES"

  // Horizontal layout: Side A on LEFT, Side B on RIGHT
  // Each side has a top half and bottom half (viewer perspective)
  // "Right court" = top half, "Left court" = bottom half (from player's perspective facing the net)
  //
  // Visual layout:
  //   Side A           |  NET  |          Side B
  //  ┌────────────────┐|       |┌────────────────┐
  //  │  A Right (top) │|       |│  B Right (top) │  ← "Right court" for both
  //  │────────────────│|       |│────────────────│
  //  │  A Left  (bot) │|       |│  B Left  (bot) │  ← "Left court" for both
  //  └────────────────┘|       |└────────────────┘

  type Position = { name: string; isServer: boolean } | null

  let sideARight: Position = null
  let sideALeft: Position = null
  let sideBRight: Position = null
  let sideBLeft: Position = null

  if (isSingles) {
    const sideAPlayer = sideAPlayer1
    const sideBPlayer = sideBPlayer1

    if (servingSide === "A") {
      if (serverCourt === "right") {
        sideARight = { name: sideAPlayer, isServer: true }
        // Diagonal: same-named court on other side (visually opposite)
        sideBRight = { name: sideBPlayer, isServer: false }
      } else {
        sideALeft = { name: sideAPlayer, isServer: true }
        sideBLeft = { name: sideBPlayer, isServer: false }
      }
    } else {
      if (serverCourt === "right") {
        sideBRight = { name: sideBPlayer, isServer: true }
        sideARight = { name: sideAPlayer, isServer: false }
      } else {
        sideBLeft = { name: sideBPlayer, isServer: true }
        sideALeft = { name: sideAPlayer, isServer: false }
      }
    }
  } else {
    // DOUBLES - use backend positions (computed by ServerTracker with BWF rules)
    const pos = positions ?? {
      sideA: { rightCourt: sideAPlayer1, leftCourt: sideAPlayer2 || "Partner" },
      sideB: { rightCourt: sideBPlayer1, leftCourt: sideBPlayer2 || "Partner" },
    }

    sideARight = {
      name: pos.sideA.rightCourt,
      isServer: servingSide === "A" && serverName === pos.sideA.rightCourt,
    }
    sideALeft = {
      name: pos.sideA.leftCourt,
      isServer: servingSide === "A" && serverName === pos.sideA.leftCourt,
    }
    sideBRight = {
      name: pos.sideB.rightCourt,
      isServer: servingSide === "B" && serverName === pos.sideB.rightCourt,
    }
    sideBLeft = {
      name: pos.sideB.leftCourt,
      isServer: servingSide === "B" && serverName === pos.sideB.leftCourt,
    }
  }

  const PlayerBubble = ({ player, side }: { player: Position; side: "A" | "B" }) => {
    if (!player) return null
    const bgColor = side === "A"
      ? "bg-gradient-to-br from-emerald-500 to-emerald-700"
      : "bg-gradient-to-br from-cyan-500 to-cyan-700"

    return (
      <div className="flex flex-col items-center gap-1">
        <div className="relative">
          <div
            className={`w-14 h-14 sm:w-16 sm:h-16 rounded-full ${bgColor} flex items-center justify-center text-white font-bold text-base sm:text-xl shadow-md ${
              player.isServer ? "ring-4 ring-yellow-400 ring-offset-2 ring-offset-[#1a2a1a]" : ""
            }`}
          >
            {getInitials(player.name)}
          </div>
          {player.isServer && (
            <span className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full bg-yellow-400 flex items-center justify-center text-[10px] font-bold text-black">S</span>
          )}
        </div>
        <span className="text-xs sm:text-sm font-medium text-white/90 max-w-[100px] sm:max-w-[120px] truncate text-center">
          {player.name}
        </span>
      </div>
    )
  }

  const CourtQuadrant = ({
    player,
    side,
    label,
  }: {
    player: Position
    side: "A" | "B"
    label: string
  }) => (
    <div className="flex-1 flex flex-col items-center justify-center relative min-h-[120px] sm:min-h-[150px]">
      <span className="absolute top-1.5 left-2.5 text-[10px] sm:text-xs font-medium text-white/30 uppercase">
        {label}
      </span>
      {player && <PlayerBubble player={player} side={side} />}
    </div>
  )

  // When courtSwapped, Side A goes right and Side B goes left
  const leftSide = courtSwapped ? "B" : "A"
  const rightSide = courtSwapped ? "A" : "B"
  const leftRight = courtSwapped ? sideBRight : sideARight
  const leftLeft = courtSwapped ? sideBLeft : sideALeft
  const rightRight = courtSwapped ? sideARight : sideBRight
  const rightLeft = courtSwapped ? sideALeft : sideBLeft

  const leftLabel = `Side ${leftSide}`
  const rightLabel = `Side ${rightSide}`
  const leftLabelClass = leftSide === "A"
    ? "text-emerald-300 bg-emerald-500/20"
    : "text-cyan-300 bg-cyan-500/20"
  const rightLabelClass = rightSide === "A"
    ? "text-emerald-300 bg-emerald-500/20"
    : "text-cyan-300 bg-cyan-500/20"

  return (
    <div className="w-full max-w-4xl mx-auto">
      {/* Horizontal court */}
      <div className="flex items-center gap-2">
        {/* Left side label */}
        <div className="flex-shrink-0">
          <span className={`text-xs font-semibold ${leftLabelClass} px-2 py-0.5 rounded-full writing-mode-vertical hidden sm:inline-block sm:writing-mode-horizontal`}>
            {leftLabel}
          </span>
        </div>

        {/* Court */}
        <div className="flex-1 flex rounded-lg overflow-hidden border-2 border-emerald-800/60 bg-[#0f1f15] shadow-lg">
          {/* Left half */}
          <div className="flex-1 flex flex-col">
            <CourtQuadrant player={leftLeft} side={leftSide as "A" | "B"} label="L" />
            <div className="h-px bg-white/20" />
            <CourtQuadrant player={leftRight} side={leftSide as "A" | "B"} label="R" />
          </div>

          {/* Net (vertical) */}
          <div className="relative w-4 sm:w-5 bg-white/5 flex items-center justify-center">
            <div className="absolute inset-y-0 left-1/2 border-l-2 border-dashed border-white/30" />
            <span className="relative z-10 text-[8px] sm:text-[9px] font-bold text-white/40 bg-[#0a1a10] px-0.5 py-1 rounded [writing-mode:vertical-lr]">
              NET
            </span>
          </div>

          {/* Right half */}
          <div className="flex-1 flex flex-col">
            <CourtQuadrant player={rightRight} side={rightSide as "A" | "B"} label="R" />
            <div className="h-px bg-white/20" />
            <CourtQuadrant player={rightLeft} side={rightSide as "A" | "B"} label="L" />
          </div>
        </div>

        {/* Right side label */}
        <div className="flex-shrink-0">
          <span className={`text-xs font-semibold ${rightLabelClass} px-2 py-0.5 rounded-full hidden sm:inline-block`}>
            {rightLabel}
          </span>
        </div>
      </div>

      {/* Mobile side labels below court */}
      <div className="flex justify-between px-4 mt-1.5 sm:hidden">
        <span className={`text-xs font-semibold ${leftLabelClass} px-2 py-0.5 rounded-full`}>
          {leftLabel}
        </span>
        <span className={`text-xs font-semibold ${rightLabelClass} px-2 py-0.5 rounded-full`}>
          {rightLabel}
        </span>
      </div>
    </div>
  )
}
