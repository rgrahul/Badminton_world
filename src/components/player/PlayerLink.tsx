"use client"

import { useState } from "react"
import Link from "next/link"

interface PlayerLinkProps {
  name: string
  playerId?: string
  playerMap?: Record<string, string>  // name -> id
  className?: string
  profilePhoto?: string | null
  showAvatar?: boolean
  avatarSize?: "sm" | "md" | "lg"
}

function PlayerAvatar({ name, profilePhoto, size = "sm" }: { name: string; profilePhoto?: string | null; size?: "sm" | "md" | "lg" }) {
  const [imgError, setImgError] = useState(false)
  const sizeClasses = size === "sm" ? "w-6 h-6 text-[10px]" : size === "md" ? "w-8 h-8 text-xs" : "w-10 h-10 text-sm"

  if (profilePhoto && !imgError) {
    return (
      <img
        src={profilePhoto}
        alt={name}
        onError={() => setImgError(true)}
        className={`${sizeClasses} rounded-full object-cover flex-shrink-0`}
      />
    )
  }

  return (
    <div className={`${sizeClasses} rounded-full bg-gradient-to-br from-blue-400 to-green-400 flex items-center justify-center text-white font-bold flex-shrink-0`}>
      {name.charAt(0).toUpperCase()}
    </div>
  )
}

export function PlayerLink({ name, playerId, playerMap, className = "", profilePhoto, showAvatar = false, avatarSize = "sm" }: PlayerLinkProps) {
  const id = playerId || playerMap?.[name]

  const content = showAvatar ? (
    <span className="inline-flex items-center gap-1.5">
      <PlayerAvatar name={name} profilePhoto={profilePhoto} size={avatarSize} />
      <span>{name}</span>
    </span>
  ) : (
    <>{name}</>
  )

  if (id) {
    return (
      <Link
        href={`/players/${id}`}
        className={`hover:underline hover:text-blue-600 transition-colors ${className}`}
      >
        {content}
      </Link>
    )
  }

  return <span className={className}>{content}</span>
}

export { PlayerAvatar }
