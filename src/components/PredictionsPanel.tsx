import { classColor } from '../lib/palette'
import type { Prediction } from '../lib/teachable'

interface Props {
  predictions: Prediction[] | null
  labels: string[]
  threshold: number
  stable: number | null
}

export function PredictionsPanel({ predictions, labels, threshold, stable }: Props) {
  return (
    <section className="card">
      <h3 className="panel-title">
        Riconoscimento
        <span className="muted">soglia {Math.round(threshold * 100)}%</span>
      </h3>
      {labels.length === 0 ? (
        <div className="empty-state">Le classi del modello appariranno qui.</div>
      ) : (
        <div className="bars">
          {labels.map((label, i) => {
            const p = predictions?.[i]?.probability ?? 0
            const color = classColor(i)
            return (
              <div className="bar" key={label + i} data-active={stable === i}>
                <div className="bar-label">
                  <span className="chip-dot" style={{ background: color, flexShrink: 0 }} />
                  <span>{label}</span>
                </div>
                <span className="bar-value">{(p * 100).toFixed(0)}%</span>
                <div className="bar-track">
                  <div className="bar-fill" style={{ width: `${p * 100}%`, background: color }} />
                  <div className="bar-threshold" style={{ left: `${threshold * 100}%` }} />
                </div>
              </div>
            )
          })}
        </div>
      )}
    </section>
  )
}
