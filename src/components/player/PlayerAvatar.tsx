"use client"

import { useEffect, useMemo, useState } from "react"
import { Dialog, DialogContent } from "@/components/ui/dialog"
import { getDriveImageSrcWithThumbnailFallback } from "@/lib/googleDriveImageUrl"

type AvatarSize = "sm" | "md" | "lg" | "xl" | "2xl"

interface PlayerAvatarProps {
  name: string
  photoUrl?: string | null
  size?: AvatarSize
  /**
   * For Google Drive photos: load `uc?export=view` first, then fall back to thumbnail on error.
   * Use on spotlight / profile; keep false for small list avatars.
   */
  preferDriveFullImage?: boolean
  /**
   * `circle` — crop to round avatar (object-cover). `rounded` — fixed box matching `size`, image uses object-contain (natural aspect).
   */
  frame?: "circle" | "rounded"
}

/** Outer box: same max width/height as before; `rounded` keeps rectangular frame for spotlight-style layouts */
const frameBoxClasses: Record<"circle" | "rounded", Record<AvatarSize, string>> = {
  circle: {
    sm: "w-6 h-6 rounded-full",
    md: "w-10 h-10 rounded-full",
    lg: "w-24 h-24 rounded-full",
    xl: "w-16 h-16 sm:w-20 sm:h-20 rounded-full",
    "2xl": "w-44 h-44 sm:w-56 sm:h-56 rounded-full",
  },
  rounded: {
    sm: "w-6 h-6 rounded-md",
    md: "w-10 h-10 rounded-md",
    lg: "w-24 h-24 rounded-lg",
    xl: "w-16 h-16 sm:w-20 sm:h-20 rounded-lg",
    "2xl": "w-44 h-44 sm:w-56 sm:h-56 rounded-xl",
  },
}

const initialsTextClasses: Record<AvatarSize, string> = {
  sm: "text-xs",
  md: "text-sm",
  lg: "text-3xl",
  xl: "text-2xl sm:text-3xl",
  "2xl": "text-5xl sm:text-6xl",
}

export function PlayerAvatar({
  name,
  photoUrl,
  size = "md",
  preferDriveFullImage = false,
  frame = "circle",
}: PlayerAvatarProps) {
  const [open, setOpen] = useState(false)

  const strategy = useMemo(() => {
    if (!photoUrl) return null
    if (preferDriveFullImage) return getDriveImageSrcWithThumbnailFallback(photoUrl)
    return { primary: photoUrl as string }
  }, [photoUrl, preferDriveFullImage])

  type LoadStage = "primary" | "fallback" | "failed"
  const [loadStage, setLoadStage] = useState<LoadStage>("primary")

  useEffect(() => {
    setLoadStage("primary")
  }, [strategy])

  const resolvedSrc =
    !strategy ? null
    : loadStage === "primary" ? strategy.primary
    : loadStage === "fallback" ? (strategy.thumbnailFallback ?? null)
    : null

  const handleImgError = () => {
    if (loadStage === "primary" && strategy?.thumbnailFallback) {
      setLoadStage("fallback")
      return
    }
    setLoadStage("failed")
  }

  const showImage = Boolean(photoUrl && loadStage !== "failed" && resolvedSrc)
  const isRoundedFrame = frame === "rounded"
  const shellClass = `${frameBoxClasses[frame][size]} ${initialsTextClasses[size]} bg-gradient-to-br from-blue-400 to-purple-500 flex items-center justify-center text-white font-bold flex-shrink-0 overflow-hidden ${showImage ? "cursor-pointer" : ""}`

  return (
    <>
      <div
        className={shellClass}
        onClick={showImage ? (e) => { e.preventDefault(); e.stopPropagation(); setOpen(true) } : undefined}
      >
        {showImage ? (
          <img
            src={resolvedSrc!}
            alt=""
            className={
              isRoundedFrame
                ? "max-h-full max-w-full h-auto w-auto object-contain"
                : "h-full w-full object-cover"
            }
            referrerPolicy="no-referrer"
            onError={handleImgError}
          />
        ) : (
          name.charAt(0).toUpperCase()
        )}
      </div>

      {showImage && resolvedSrc && (
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogContent className="max-w-sm p-2 border-2 border-blue-500 bg-gray-950 [&>button]:bg-black/70 [&>button]:text-white [&>button]:rounded-full [&>button]:p-1 [&>button]:top-2 [&>button]:right-2 [&>button]:hover:bg-black/90">
            <div className="flex flex-col items-center">
              <img
                src={resolvedSrc}
                alt={name}
                className="w-full max-h-[70vh] object-contain rounded-lg"
                referrerPolicy="no-referrer"
              />
              <p className="text-center font-semibold mt-2 text-white">{name}</p>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </>
  )
}
