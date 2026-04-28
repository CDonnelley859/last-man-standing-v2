import { C } from '../tokens';

export default function Pill({ label, bg = C.lime, color = C.dark, style }) {
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', padding: '2px 8px',
      borderRadius: 7, background: bg, color, fontWeight: 700, fontSize: 9,
      letterSpacing: '0.03em', ...style,
    }}>
      {label}
    </span>
  );
}
