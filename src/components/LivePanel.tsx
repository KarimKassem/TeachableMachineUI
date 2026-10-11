import type { CSSProperties } from 'react'
import { classColor } from '../lib/palette'

interface Props {
  attachVideo: (el: HTMLVideoElement | null) => void
  running: boolean
  mirror: boolean
  fps: number
  stable: number | null
  labels: string[]
  command: string | null
  hasModel: boolean
  compact?: boolean
}

export function LivePanel({ attachVideo, running, mirror, fps, stable, labels, command, hasModel, compact }: Props) {
  const label = stable !== null ? labels[stable] : null
  const color = stable !== null ? classColor(stable) : undefined

  return (
    <section className="card video-card" data-compact={compact ? 'true' : undefined}>
      <video ref={attachVideo} className={mirror ? 'mirror' : ''} playsInline muted />
      {!running && (
        <div className="video-empty" style={{ position: 'absolute' }}>
          La webcam è spenta.
        </div>
      )}
      {running && (
        <div className="video-overlay">
          <div className="crop-guide" aria-hidden />
          <span className="live-badge">LIVE</span>
          {hasModel && <span className="fps">{fps.toFixed(0)} fps</span>}
          <div
            className="winner"
            data-empty={label === null}
            style={{ '--winner-color': color } as CSSProperties}
          >
            {label === null ? (
              <span>{hasModel ? 'Nessuna classe sopra la soglia' : 'Carica un modello per iniziare'}</span>
            ) : (
              <>
                <span>{label}</span>
                {command !== null && command !== '' && <span className="cmd">→ {command}</span>}
              </>
            )}
          </div>
        </div>
      )}
    </section>
  )
}
