// Product photos are uploaded as full-resolution PNGs/JPEGs (often 1–2 MB each)
// to Supabase storage. Rendering them raw made catalogue pages download tens of
// MB. Routing remote photos through Next's image optimizer serves a resized,
// compressed WebP/AVIF instead (cached after the first hit).
//
// `width` must be one of Next's configured sizes (default imageSizes +
// deviceSizes: 32, 48, 64, 96, 128, 256, 384, 640, 750, 828, 1080, 1200, ...).
export function optimizedSrc(url: string | null | undefined, width: number): string {
  if (!url) return '';
  // Only remote http(s) photos go through the optimizer; local /public files,
  // data: and blob: URLs are returned untouched.
  if (!/^https?:\/\//i.test(url)) return url;
  return `/_next/image?url=${encodeURIComponent(url)}&w=${width}&q=75`;
}

// Shrinks a photo in the browser before upload: caps the long edge at 1600px and
// re-encodes as WebP, so new product uploads are ~100–300 KB instead of multi-MB.
// Falls back to the original file if anything goes wrong (or it isn't a raster
// image), so an upload is never blocked by compression.
export async function compressImage(file: File, maxEdge = 1600, quality = 0.85): Promise<File> {
  if (typeof document === 'undefined' || !file.type.startsWith('image/') || file.type === 'image/gif') return file;
  try {
    const bitmap = await createImageBitmap(file);
    const scale = Math.min(1, maxEdge / Math.max(bitmap.width, bitmap.height));
    const canvas = document.createElement('canvas');
    canvas.width = Math.round(bitmap.width * scale);
    canvas.height = Math.round(bitmap.height * scale);
    canvas.getContext('2d')!.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
    bitmap.close();
    const blob = await new Promise<Blob | null>((res) => canvas.toBlob(res, 'image/webp', quality));
    if (!blob || blob.size >= file.size) return file;
    return new File([blob], file.name.replace(/\.[^.]+$/, '') + '.webp', { type: 'image/webp' });
  } catch {
    return file;
  }
}
