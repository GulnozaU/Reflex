/** Subtle grid — infrastructure, not decoration. */
export function AnimatedBackground() {
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden="true">
      <div
        className="absolute -inset-8 animate-grid-drift opacity-[0.12]"
        style={{
          backgroundImage:
            'linear-gradient(to right, #303030 1px, transparent 1px), linear-gradient(to bottom, #303030 1px, transparent 1px)',
          backgroundSize: '40px 40px'
        }}
      />
    </div>
  );
}
