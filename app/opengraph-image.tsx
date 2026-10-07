import { ImageResponse } from 'next/og';
import { SITE_NAME, SITE_TAGLINE } from '@/lib/seo';

// Dynamic, branded social-share image for the whole site (and the Twitter card
// fallback). Rendered by next/og — no design asset needed. Uses next/og's
// built-in font, flexbox only (Satori doesn't support grid).
export const alt = `${SITE_NAME} — ${SITE_TAGLINE}`;
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

export default function OpengraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          background: '#F5F2EB',
          color: '#111111',
          fontFamily: 'sans-serif',
        }}
      >
        <div
          style={{
            fontSize: 140,
            fontWeight: 800,
            letterSpacing: '-0.03em',
            textTransform: 'uppercase',
          }}
        >
          {SITE_NAME}
        </div>
        <div
          style={{
            marginTop: 16,
            fontSize: 40,
            letterSpacing: '0.35em',
            textTransform: 'uppercase',
            color: '#6b6b6b',
          }}
        >
          {SITE_TAGLINE}
        </div>
        <div
          style={{
            marginTop: 48,
            fontSize: 28,
            color: '#8a6d3b',
          }}
        >
          Adorable outfits for kids aged 0–16
        </div>
      </div>
    ),
    { ...size },
  );
}
