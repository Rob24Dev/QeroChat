import { useMemo } from 'react';

export default function Particles({ count = 45 }: { count?: number }) {
  const parts = useMemo(() =>
    Array.from({ length: count }, (_, i) => ({
      id: i,
      left: Math.random() * 100,
      top: 20 + Math.random() * 100,
      size: 2 + Math.random() * 4,
      dur: 9 + Math.random() * 14,
      delay: -Math.random() * 20,
      op: 0.2 + Math.random() * 0.5,
    })), [count]);

  return (
    <div className="particles" aria-hidden="true">
      {parts.map(p => (
        <span
          key={p.id}
          style={{
            left: p.left + '%',
            top: p.top + '%',
            width: p.size,
            height: p.size,
            opacity: p.op,
            animationDuration: p.dur + 's',
            animationDelay: p.delay + 's',
          }}
        />
      ))}
    </div>
  );
}
