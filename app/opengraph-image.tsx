import { ImageResponse } from 'next/og'

export const runtime = 'edge'
export const alt = 'SenioCare — Meal Companion for Malaysian Seniors'
export const size = { width: 1200, height: 630 }
export const contentType = 'image/png'

export default function OgImage() {
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
          background: 'linear-gradient(135deg, #0F0E17 0%, #1a1830 60%, #0F0E17 100%)',
          fontFamily: 'sans-serif',
        }}
      >
        {/* Glow */}
        <div style={{ position: 'absolute', top: 80, left: 200, width: 400, height: 400, background: 'rgba(99,102,241,0.25)', borderRadius: '50%', filter: 'blur(80px)' }} />
        <div style={{ position: 'absolute', bottom: 80, right: 200, width: 300, height: 300, background: 'rgba(244,63,94,0.12)', borderRadius: '50%', filter: 'blur(80px)' }} />

        {/* Logo */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 40 }}>
          <div style={{ width: 64, height: 64, borderRadius: 16, background: '#6366F1', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <svg width="32" height="32" viewBox="0 0 24 24" fill="white">
              <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
            </svg>
          </div>
          <span style={{ fontSize: 48, fontWeight: 700, color: 'white' }}>SenioCare</span>
        </div>

        {/* Headline */}
        <div style={{ fontSize: 52, fontWeight: 800, color: 'white', textAlign: 'center', lineHeight: 1.2, maxWidth: 900, marginBottom: 24 }}>
          Meal Companion for{' '}
          <span style={{ color: '#818CF8' }}>Malaysian Seniors</span>
        </div>

        {/* Subtext */}
        <div style={{ fontSize: 26, color: 'rgba(255,255,255,0.6)', textAlign: 'center', maxWidth: 700 }}>
          Verified companions who dine with your elderly loved one.
          Warm, safe, and affordable.
        </div>

        {/* Badges */}
        <div style={{ display: 'flex', gap: 16, marginTop: 48 }}>
          {['✓ IC Verified', '✓ Escrow Payment', '✓ PDPA Compliant'].map(b => (
            <div key={b} style={{ background: 'rgba(99,102,241,0.2)', border: '1px solid rgba(99,102,241,0.4)', borderRadius: 100, padding: '10px 24px', color: '#A5B4FC', fontSize: 20 }}>
              {b}
            </div>
          ))}
        </div>
      </div>
    ),
    { ...size }
  )
}
