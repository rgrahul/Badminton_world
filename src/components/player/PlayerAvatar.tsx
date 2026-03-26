"use client"

import { useState } from "react"
import { Dialog, DialogContent } from "@/components/ui/dialog"

interface PlayerAvatarProps {
  name: string
  photoUrl?: string | null
  size?: "sm" | "md" | "lg" | "xl" | "2xl"
}

const sizeClasses = {
  sm: "w-6 h-6 text-xs",
  md: "w-10 h-10 text-sm",
  lg: "w-24 h-24 text-3xl",
  xl: "w-16 h-16 sm:w-20 sm:h-20 text-2xl sm:text-3xl",
  "2xl": "w-44 h-44 sm:w-56 sm:h-56 text-5xl sm:text-6xl",
}

export function PlayerAvatar({ name, photoUrl, size = "md" }: PlayerAvatarProps) {
  const [open, setOpen] = useState(false)
  const [imgError, setImgError] = useState(false)

  const showImage = photoUrl && !imgError

  return (
    <>
      <div
        className={`${sizeClasses[size]} rounded-full bg-gradient-to-br from-blue-400 to-purple-500 flex items-center justify-center text-white font-bold flex-shrink-0 overflow-hidden ${showImage ? "cursor-pointer" : ""}`}
        onClick={showImage ? (e) => { e.preventDefault(); e.stopPropagation(); setOpen(true) } : undefined}
      >
        {showImage ? (
          <img src={photoUrl} alt="" className="w-full h-full object-cover" referrerPolicy="no-referrer" onError={() => setImgError(true)} />
        ) : (
          name.charAt(0).toUpperCase()
        )}
      </div>

      {showImage && (
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogContent className="max-w-sm p-2 border-2 border-blue-500 bg-gray-950 [&>button]:bg-black/70 [&>button]:text-white [&>button]:rounded-full [&>button]:p-1 [&>button]:top-2 [&>button]:right-2 [&>button]:hover:bg-black/90">
            <div className="flex flex-col items-center">
              <img
                src={photoUrl}
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
