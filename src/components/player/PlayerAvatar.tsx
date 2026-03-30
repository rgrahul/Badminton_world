"use client"

import { useEffect, useMemo, useState } from "react"
import { Dialog, DialogContent } from "@/components/ui/dialog"
import { getDriveImageSrcWithThumbnailFallback } from "@/lib/googleDriveImageUrl"

interface PlayerAvatarProps {
  name: string
  photoUrl?: string | null
  size?: "sm" | "md" | "lg" | "xl" | "2xl"
  /**
   * For Google Drive photos: load `uc?export=view` first, then fall back to thumbnail on error.
   * Use on spotlight / profile; keep false for small list avatars.
   */
  preferDriveFullImage?: boolean
}

const sizeClasses = {
  sm: "w-6 h-6 text-xs",
  md: "w-10 h-10 text-sm",
  lg: "w-24 h-24 text-3xl",
  xl: "w-16 h-16 sm:w-20 sm:h-20 text-2xl sm:text-3xl",
  "2xl": "w-44 h-44 sm:w-56 sm:h-56 text-5xl sm:text-6xl",
}

export function PlayerAvatar({
  name,
  photoUrl,
  size = "md",
  preferDriveFullImage = false,
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

  return (
    <>
      <div
        className={`${sizeClasses[size]} rounded-full bg-gradient-to-br from-blue-400 to-purple-500 flex items-center justify-center text-white font-bold flex-shrink-0 overflow-hidden ${showImage ? "cursor-pointer" : ""}`}
        onClick={showImage ? (e) => { e.preventDefault(); e.stopPropagation(); setOpen(true) } : undefined}
      >
        {showImage ? (
          <img
            src={resolvedSrc!}
            alt=""
            className="w-full h-full object-cover"
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
