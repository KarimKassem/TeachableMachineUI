export type Tone = 'idle' | 'ok' | 'warn' | 'danger'

export function StatusPill({ label, tone }: { label: string; tone: Tone }) {
  return (
    <span className="pill" data-tone={tone}>
      <span className="pill-dot" />
      {label}
    </span>
  )
}
