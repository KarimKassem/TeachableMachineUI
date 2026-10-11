import type { CSSProperties, RefObject } from 'react'
import { classColor } from '../lib/palette'

interface Props {
  videoRef: RefObject<HTMLVideoElement | null>
  running: boolean
  mirror: boolean
  fps: number
  stable: number | null
  labels: string[]
  command: string | null
  hasModel: boolean
}

export function LivePanel({ videoRef, running, mirror, fps, stable, labels, command, hasModel }: Props) {
  const label = stable !== null ? labels[stable] : null
  const color = stable !== null ? classColor(stable) : undefined

  return (
    <section className="card video-card">
      <video ref={videoRef} className={mirror ? 'mirror' : ''} playsInline muted />
      {!running && (
        <div className="video-empty" style={{ position: 'absolute' }}>
          La webcam è spenta.
          <br />
          <span className="muted" style={{ color: 'rgba(255,255,255,0.6)' }}>
            Accendila dal passo 03.
          </span>
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
