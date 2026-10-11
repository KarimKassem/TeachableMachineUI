import type { CSSProperties, ReactNode } from 'react'
import { classColor } from '../lib/palette'
import type { Side } from '../lib/types'

interface ZoneProps {
  side: Exclude<Side, 'none'>
  labels: string[]
  sides: Side[]
  stable: number | null
}

function Zone({ side, labels, sides, stable }: ZoneProps) {
  const members = labels.map((l, i) => ({ l, i })).filter(({ i }) => (sides[i] ?? 'none') === side)
  const hot = stable !== null && (sides[stable] ?? 'none') === side
  const color = hot ? classColor(stable) : undefined
  const title = side === 'left' ? 'Sinistra' : 'Destra'
  const arrow = side === 'left' ? '←' : '→'

  return (
    <aside className="zone" data-side={side} data-hot={hot} style={{ '--zone-color': color } as CSSProperties}>
      <header className="zone-head">
        <span className="zone-arrow" aria-hidden>
          {arrow}
        </span>
        <span>{title}</span>
      </header>

      <div className="zone-main">
        {hot ? (
          <span className="zone-active">{labels[stable]}</span>
        ) : members.length === 0 ? (
          <span className="zone-empty">Nessuna classe assegnata</span>
        ) : (
          <div className="zone-chips">
            {members.map(({ l, i }) => (
              <span className="chip" key={l + i}>
                <span className="chip-dot" style={{ background: classColor(i) }} />
                {l}
              </span>
            ))}
          </div>
        )}
      </div>

      <footer className="zone-foot">
        <span className="bowl" aria-hidden>
          <svg viewBox="0 0 64 28" width="64" height="28">
            <path d="M4 6 Q32 40 60 6 Z" fill="currentColor" opacity="0.9" />
            <ellipse cx="32" cy="6" rx="28" ry="5" fill="currentColor" opacity="0.5" />
          </svg>
        </span>
        <span>Ciotola qui</span>
      </footer>
    </aside>
  )
}

interface StageProps {
  labels: string[]
  sides: Side[]
  stable: number | null
  children: ReactNode
}

/** Schermata finale: camera al centro, zone libere a sinistra e destra per le ciotole. */
export function Stage({ labels, sides, stable, children }: StageProps) {
  return (
    <div className="stage">
      <Zone side="left" labels={labels} sides={sides} stable={stable} />
      <div className="stage-center">{children}</div>
      <Zone side="right" labels={labels} sides={sides} stable={stable} />
    </div>
  )
}
