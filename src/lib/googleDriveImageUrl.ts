/**
 * Google Drive image URLs for <img src>. Files should be shared as
 * "Anyone with the link" (viewer) for anonymous visitors.
 */

export function extractGoogleDriveFileId(url: string): string | null {
  if (!url || typeof url !== "string") return null
  const t = url.trim()
  const fileIdMatch = t.match(/drive\.google\.com\/file\/d\/([^/?]+)/)
  const openIdMatch = t.match(/drive\.google\.com\/open\?id=([^&]+)/)
  const idParam = t.match(/[?&]id=([^&]+)/)
  const fromUrl = fileIdMatch?.[1] || openIdMatch?.[1] || idParam?.[1]
  if (fromUrl) return fromUrl
  if (/^[a-zA-Z0-9_-]{20,}$/.test(t)) return t
  return null
}

export function toGoogleDriveThumbnailUrlByFileId(fileId: string): string {
  return `https://drive.google.com/thumbnail?id=${fileId}&sz=w4000`
}

/** Hotlinked "view" URL — often higher quality than thumbnail; may fail for large / restricted files. */
export function toGoogleDriveViewUrlByFileId(fileId: string): string {
  return `https://drive.google.com/uc?export=view&id=${fileId}`
}

/**
 * Turns Google Drive sharing / export URLs into a thumbnail URL that works in <img src>.
 */
export function toGoogleDriveDisplayUrl(url: string): string {
  const id = extractGoogleDriveFileId(url)
  if (id) return toGoogleDriveThumbnailUrlByFileId(id)
  return url
}

export type DriveImageSrcStrategy = { primary: string; thumbnailFallback?: string }

/**
 * For large previews: try uc?export=view first, then thumbnail. Non-Drive URLs use a single primary.
 */
export function getDriveImageSrcWithThumbnailFallback(
  photoUrl: string
): DriveImageSrcStrategy {
  const id = extractGoogleDriveFileId(photoUrl)
  if (id) {
    return {
      primary: toGoogleDriveViewUrlByFileId(id),
      thumbnailFallback: toGoogleDriveThumbnailUrlByFileId(id),
    }
  }
  return { primary: photoUrl }
}
