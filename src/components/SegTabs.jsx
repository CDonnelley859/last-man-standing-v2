import { C } from '../tokens';

export default function SegTabs({ tabs, active, onChange }) {
  return (
    <div style={{ display: 'flex', background: 'rgb(15,158,131)', borderRadius: 10, padding: 3, gap: 2 }}>
      {tabs.map(t => (
        <button
          key={t}
          onClick={() => onChange(t)}
          style={{
            flex: 1, height: 34, borderRadius: 8, border: 'none', cursor: 'pointer',
            background: active === t ? C.white : 'transparent',
            color: active === t ? C.teal : 'rgba(255,255,255,0.8)',
            fontFamily: 'Inter, sans-serif', fontWeight: active === t ? 700 : 500,
            fontSize: 11, letterSpacing: '0.01em',
            boxShadow: active === t ? '0 2px 8px rgba(0,0,0,0.15)' : 'none',
            transition: 'all 0.18s',
          }}
        >
          {t}
        </button>
      ))}
    </div>
  );
}
