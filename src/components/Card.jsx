import { C } from '../tokens';

const CLIP = 'polygon(0 0, 100% 0, 100% 100%, 18px 100%, 0 calc(100% - 18px))';

export default function Card({ children, style, accent, onClick, selected, dim, flat }) {
  const bg = dim ? C.g2 : C.white;
  const shadow = flat || dim ? 'none'
    : selected
      ? `0 0 0 2.5px ${C.lime}, 0 10px 28px rgba(0,0,0,0.2), 0 2px 6px rgba(0,0,0,0.1)`
      : '0 8px 24px rgba(0,0,0,0.18), 0 2px 6px rgba(0,0,0,0.08)';

  return (
    <div
      onClick={onClick}
      style={{
        position: 'relative',
        background: bg,
        clipPath: CLIP,
        boxShadow: shadow,
        cursor: onClick ? 'pointer' : 'default',
        transition: 'box-shadow 0.15s, transform 0.15s',
        transform: selected ? 'scale(1.015)' : 'scale(1)',
        ...style,
      }}
    >
      {accent && (
        <div style={{
          position: 'absolute', left: 0, top: 0, width: 4, bottom: 0,
          background: accent === 'lime' ? C.lime : C.teal,
          borderRadius: '4px 0 0 0',
        }} />
      )}
      {!dim && !flat && (
        <div style={{
          position: 'absolute', inset: 0, pointerEvents: 'none',
          background: 'linear-gradient(180deg, rgba(255,255,255,0.5) 0%, rgba(255,255,255,0) 38%)',
        }} />
      )}
      {children}
    </div>
  );
}
