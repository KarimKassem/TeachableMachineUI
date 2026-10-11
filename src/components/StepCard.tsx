import type { CSSProperties, ReactNode } from 'react'

interface Props {
  number: string
  title: string
  hint: string
  color: string
  done: boolean
  children: ReactNode
}

export function StepCard({ number, title, hint, color, done, children }: Props) {
  return (
    <section className="card" data-done={done} style={{ '--step-color': color } as CSSProperties}>
      <div className="step-head">
        <span className="step-num">{number}</span>
        <h2 className="step-title">{title}</h2>
        {done && (
          <span className="step-check" aria-label="completato">
            ✓
          </span>
        )}
      </div>
      <p className="step-hint">{hint}</p>
      <div className="step-body">{children}</div>
    </section>
  )
}
