import { C } from '../tokens';

const ICONS = { home: '⌂', pick: '✦', stats: '▦', admin: '⚙' };

export default function BottomNav({ active, onNav, isHost }) {
  const tabs = [
    { id: 'home', label: 'Home' },
    { id: 'pick', label: 'Pick' },
    { id: 'stats', label: 'Stats' },
  ];
  if (isHost) tabs.push({ id: 'admin', label: 'Admin' });

  return (
    <div style={{
      position: 'fixed', bottom: 16, left: 16, right: 16, height: 64,
      borderRadius: 20,
      background: 'linear-gradient(180deg, #1e1e1e 0%, #111 100%)',
      boxShadow: '0 -1px 0 rgba(255,255,255,0.05), 0 8px 32px rgba(0,0,0,0.5)',
      display: 'flex', alignItems: 'center', justifyContent: 'space-around',
      padding: '0 4px', zIndex: 100,
    }}>
      {tabs.map(t => (
        <div
          key={t.id}
          onClick={() => onNav(t.id)}
          style={{
            flex: 1, display: 'flex', flexDirection: 'column',
            alignItems: 'center', justifyContent: 'center',
            height: 48, borderRadius: 12, cursor: 'pointer',
            background: active === t.id ? C.lime : 'transparent',
            transition: 'background 0.2s', gap: 2,
          }}
        >
          <span style={{ fontSize: 15, color: active === t.id ? C.dark : C.g4, lineHeight: 1 }}>
            {ICONS[t.id]}
          </span>
          <span style={{ fontSize: 9, fontWeight: active === t.id ? 700 : 400, color: active === t.id ? C.dark : C.g4, lineHeight: 1 }}>
            {t.label}
          </span>
        </div>
      ))}
    </div>
  );
}
