import { ImageResponse } from 'next/og';

export const OG_SIZE = { width: 1200, height: 630 };

/** A number shown big on the card with a small label under it ("798" / "commits"). */
export interface OgStat {
  label: string;
  value: string;
}

/**
 * Social-preview card (Open Graph / Twitter), generated per route in the site's light
 * theme: the page title as the header and its description underneath. With `stats`,
 * a row of numbers replaces the description (person pages).
 */
export function ogImage({
  title,
  description,
  stats,
}: {
  title: string;
  description?: string;
  stats?: OgStat[];
}) {
  return new ImageResponse(
    <div
      style={{
        width: '100%',
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        padding: '72px 80px',
        background: '#ffffff',
        color: '#0c0a09',
        fontFamily: 'sans-serif',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
        <div style={{ display: 'flex', alignItems: 'flex-end', gap: 5, height: 34 }}>
          {[16, 26, 34, 20].map((h, i) => (
            <div
              key={i}
              style={{ width: 8, height: h, background: '#5ea500', borderRadius: 3 }}
            />
          ))}
        </div>
        <div style={{ fontSize: 28, fontWeight: 700, color: '#44403c' }}>
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
            style={{ fontSize: 32, color: '#57534e', lineHeight: 1.4, maxWidth: 1040 }}
          >
            {description}
          </div>
        )}
        {stats && stats.length > 0 && (
          <div style={{ display: 'flex', gap: 56, marginTop: 8 }}>
            {stats.map((s) => (
              <div key={s.label} style={{ display: 'flex', flexDirection: 'column' }}>
                <div
                  style={{
                    fontSize: 64,
                    fontWeight: 800,
                    lineHeight: 1,
                    letterSpacing: -1,
                    color: '#0c0a09',
                  }}
                >
                  {s.value}
                </div>
                <div style={{ fontSize: 26, color: '#57534e', marginTop: 8 }}>
                  {s.label}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div
        style={{
          display: 'flex',
          height: 8,
          width: 160,
          background: '#5ea500',
          borderRadius: 4,
        }}
      />
    </div>,
    OG_SIZE
  );
}
