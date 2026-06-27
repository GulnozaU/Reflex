interface StatusIndicatorProps {
  label: string;
  active?: boolean;
}

export function StatusIndicator({ label, active = true }: StatusIndicatorProps) {
  return (
    <span className="inline-flex items-center gap-2 font-mono text-[11px] text-muted">
      <span
        className={`h-1.5 w-1.5 rounded-full ${active ? 'animate-status-pulse bg-sage' : 'bg-line'}`}
        aria-hidden="true"
      />
      {label}
    </span>
  );
}
