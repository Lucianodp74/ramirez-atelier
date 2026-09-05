import { ImageResponse } from 'next/og';

export const runtime = 'edge';
export const alt = 'RAMIREZ ATELIER — Arredi su misura';
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

export default function OpenGraphImage() {
  return new ImageResponse(
    <div style={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'center', padding: '72px 86px', background: '#F6F1EA', color: '#2A2622', fontFamily: 'sans-serif' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '26px', marginBottom: '48px' }}>
        <div style={{ width: '116px', height: '116px', borderRadius: '24px', border: '2px solid #D8CEC2', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '54px', fontWeight: 700, letterSpacing: '-0.08em' }}>RA</div>
        <div style={{ display: 'flex', flexDirection: 'column' }}>
          <div style={{ fontSize: '31px', letterSpacing: '0.16em', fontWeight: 600 }}>RAMIREZ ATELIER</div>
          <div style={{ marginTop: '10px', fontSize: '18px', letterSpacing: '0.12em', color: '#7B7067' }}>FALEGNAMERIA ARTIGIANA · DAL 1987</div>
        </div>
      </div>
      <div style={{ width: '78px', height: '3px', background: '#A6532B', marginBottom: '30px' }} />
      <div style={{ fontSize: '54px', lineHeight: 1.08, fontWeight: 400, maxWidth: '900px', letterSpacing: '-0.025em' }}>Arredi su misura, progettati per durare.</div>
    </div>,
    size,
  );
}
