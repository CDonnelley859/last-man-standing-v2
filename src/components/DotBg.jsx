export default function DotBg() {
  const dots = [];
  for (let r = 0; r < 28; r++)
    for (let c = 0; c < 14; c++)
      dots.push(<circle key={`${r}-${c}`} cx={c * 32 + 10} cy={r * 32 + 10} r="1.4" fill="rgba(255,255,255,0.11)" />);
  return (
    <svg style={{ position: 'fixed', inset: 0, width: '100%', height: '100%', pointerEvents: 'none', zIndex: 0 }}>
      {dots}
    </svg>
  );
}
