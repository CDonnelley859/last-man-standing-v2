import { C } from '../tokens';

export default function Av({ initials, color = C.teal, size = 38, dim }) {
  return (
    <div style={{
      width: size, height: size, borderRadius: '50%', flexShrink: 0,
      background: dim ? C.g3 : `radial-gradient(circle at 35% 35%, ${color}cc, ${color})`,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontWeight: 800, fontSize: size * 0.36, color: 'white',
      boxShadow: dim ? 'none' : `0 2px 8px ${color}44`,
    }}>
      {initials}
    </div>
  );
}
