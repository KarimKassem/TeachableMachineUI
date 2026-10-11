import type { CSSProperties, ReactNode } from 'react'

export const WIZARD_STEPS = [
  { number: '01', title: 'Modello', color: '#6c47ff' },
  { number: '02', title: 'Webcam', color: '#ff5c8a' },
  { number: '03', title: 'Arduino', color: '#00b894' },
] as const

interface Props {
  step: number
  done: boolean[]
  canNext: boolean
  skipLabel?: string
  onPrev: () => void
  onNext: () => void
  onSkip?: () => void
  onJump: (step: number) => void
  children: ReactNode
}

export function Wizard({ step, done, canNext, skipLabel, onPrev, onNext, onSkip, onJump, children }: Props) {
  const last = step === WIZARD_STEPS.length - 1
  return (
    <div className="wizard">
      <nav className="wizard-nav" aria-label="Passi">
        {WIZARD_STEPS.map((s, i) => (
          <button
            key={s.number}
            type="button"
            className="wizard-tab"
            aria-current={i === step ? 'step' : undefined}
            data-done={done[i]}
            style={{ '--step-color': s.color } as CSSProperties}
            onClick={() => onJump(i)}
          >
            <span className="wizard-tab-num">{done[i] && i !== step ? '✓' : s.number}</span>
            <span>{s.title}</span>
          </button>
        ))}
      </nav>

      <div className="wizard-body">{children}</div>

      <div className="wizard-actions">
        <button type="button" className="btn btn-ghost" onClick={onPrev} disabled={step === 0}>
          ← Indietro
        </button>
        <div className="row">
          {onSkip && !canNext && (
            <button type="button" className="btn btn-ghost" onClick={onSkip}>
              {skipLabel ?? 'Salta'}
            </button>
          )}
          <button type="button" className={`btn ${last ? 'btn-accent' : 'btn-primary'}`} onClick={onNext} disabled={!canNext}>
            {last ? 'Avvia il sorter 🚀' : 'Avanti →'}
          </button>
        </div>
      </div>
    </div>
  )
}
