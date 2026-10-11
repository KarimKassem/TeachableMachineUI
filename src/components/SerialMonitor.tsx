import { useEffect, useRef, useState } from 'react'
import type { LogEntry } from '../lib/types'

interface Props {
  log: LogEntry[]
  connected: boolean
  onSend: (text: string) => void
  onClear: () => void
}

function fmt(t: number) {
  const d = new Date(t)
  return `${d.getHours().toString().padStart(2, '0')}:${d.getMinutes().toString().padStart(2, '0')}:${d
    .getSeconds()
    .toString()
    .padStart(2, '0')}`
}

const PREFIX: Record<LogEntry['dir'], string> = { out: '→', in: '←', sys: '·', err: '!' }

export function SerialMonitor({ log, connected, onSend, onClear }: Props) {
  const [text, setText] = useState('')
  const boxRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const el = boxRef.current
    if (el) el.scrollTop = el.scrollHeight
  }, [log])

  return (
    <section className="card monitor">
      <h3 className="panel-title">
        Monitor seriale
        <button type="button" className="btn btn-ghost btn-sm" onClick={onClear}>
          Pulisci
        </button>
      </h3>
      <div className="log" ref={boxRef}>
        {log.length === 0 && <span className="log-line" data-dir="sys"><span className="log-text">In attesa…</span></span>}
        {log.map((e) => (
          <div className="log-line" key={e.id} data-dir={e.dir}>
            <span className="log-time">{fmt(e.t)}</span>
            <span className="log-text">
              {PREFIX[e.dir]} {e.text}
            </span>
          </div>
        ))}
      </div>
      <form
        className="row"
        onSubmit={(e) => {
          e.preventDefault()
          if (!text) return
          onSend(text)
          setText('')
        }}
      >
        <input
          className="input mono grow"
          placeholder={connected ? 'Invia un comando manuale…' : 'Collega Arduino per inviare'}
          value={text}
          onChange={(e) => setText(e.target.value)}
          disabled={!connected}
        />
        <button type="submit" className="btn btn-accent" disabled={!connected || !text}>
          Invia
        </button>
      </form>
    </section>
  )
}
