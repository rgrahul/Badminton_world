/**
 * Turns Google Drive sharing / export URLs into a thumbnail URL that works in <img src>.
 * Files must be shared as "Anyone with the link" (viewer) for anonymous site visitors.
 */
export function toGoogleDriveDisplayUrl(url: string): string {
  if (!url) return url
  const fileIdMatch = url.match(/drive\.google\.com\/file\/d\/([^/?]+)/)
  const openIdMatch = url.match(/drive\.google\.com\/open\?id=([^&]+)/)
  const idParam = url.match(/[?&]id=([^&]+)/)
  const fileId = fileIdMatch?.[1] || openIdMatch?.[1] || idParam?.[1]
  if (fileId) return `https://drive.google.com/thumbnail?id=${fileId}&sz=w4000`
  if (/^[a-zA-Z0-9_-]{20,}$/.test(url.trim()))
    return `https://drive.google.com/thumbnail?id=${url.trim()}&sz=w4000`
  return url
}
