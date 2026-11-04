import { ImageResponse } from 'next/og';

export const OG_SIZE = { width: 1200, height: 630 };

/**
 * Social-preview card (Open Graph / Twitter), generated per route in the site's dark
 * theme: the page title as the header and its description underneath.
 */
export function ogImage({ title, description }: { title: string; description?: string }) {
  return new ImageResponse(
    <div
      style={{
        width: '100%',
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        padding: '72px 80px',
        background: '#0c0a09',
        color: '#fafaf9',
        fontFamily: 'sans-serif',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
        <div style={{ display: 'flex', alignItems: 'flex-end', gap: 5, height: 34 }}>
          {[16, 26, 34, 20].map((h, i) => (
            <div
              key={i}
              style={{ width: 8, height: h, background: '#bbf451', borderRadius: 3 }}
            />
          ))}
        </div>
        <div style={{ fontSize: 28, fontWeight: 700, color: '#d6d3d1' }}>
          UBCO COSC 499 Capstone Stats
        </div>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
        <div
          style={{ fontSize: 84, fontWeight: 800, lineHeight: 1.05, letterSpacing: -2 }}
        >
          {title}
        </div>
        {description && (
          <div
            style={{ fontSize: 32, color: '#a8a29e', lineHeight: 1.4, maxWidth: 1040 }}
          >
            {description}
          </div>
        )}
      </div>

      <div
        style={{
          display: 'flex',
          height: 8,
          width: 160,
          background: '#bbf451',
          borderRadius: 4,
        }}
      />
    </div>,
    OG_SIZE
  );
}
