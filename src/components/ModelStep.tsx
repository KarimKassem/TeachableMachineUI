import { useState } from 'react'
import { StepCard } from './StepCard'
import { classColor } from '../lib/palette'
import type { TeachableModel } from '../lib/teachable'

interface Props {
  model: TeachableModel | null
  status: 'idle' | 'loading' | 'ready' | 'error'
  progress: number
  error: string | null
  initialUrl: string
  onLoad: (url: string) => void
  onUnload: () => void
}

export function ModelStep({ model, status, progress, error, initialUrl, onLoad, onUnload }: Props) {
  const [url, setUrl] = useState(initialUrl)
  const loading = status === 'loading'

  return (
    <StepCard
      number="01"
      title="Modello"
      hint="Su Teachable Machine: Esporta modello → Carica il modello → copia il link."
      color="#6c47ff"
      done={status === 'ready'}
    >
      <form
        className="row"
        onSubmit={(e) => {
          e.preventDefault()
          onLoad(url)
        }}
      >
        <input
          className="input mono grow"
          placeholder="https://teachablemachine.withgoogle.com/models/XXXXXX/"
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          disabled={loading}
          spellCheck={false}
        />
        {status === 'ready' ? (
          <button type="button" className="btn btn-ghost" onClick={onUnload}>
            Cambia
          </button>
        ) : (
          <button type="submit" className="btn btn-primary" disabled={loading || !url.trim()}>
            {loading ? 'Carico…' : 'Carica'}
          </button>
        )}
      </form>

      {loading && (
        <div className="progress" aria-label="caricamento">
          <div style={{ width: `${Math.round(progress * 100)}%` }} />
        </div>
      )}

      {error && <p className="error">{error}</p>}

      {model && (
        <>
          <div className="chips">
            {model.labels.map((label, i) => (
              <span className="chip" key={label + i}>
                <span className="chip-dot" style={{ background: classColor(i) }} />
                {label}
              </span>
            ))}
          </div>
          <p className="muted">
            {model.labels.length} classi · input {model.imageSize}px
            {model.metadata.tmVersion ? ` · TM ${model.metadata.tmVersion}` : ''}
          </p>
        </>
      )}
    </StepCard>
  )
}
