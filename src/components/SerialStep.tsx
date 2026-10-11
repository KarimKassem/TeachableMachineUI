import { StepCard } from './StepCard'
import { classColor } from '../lib/palette'
import type { SerialStatus } from '../lib/serial'

const BAUD_RATES = [9600, 19200, 38400, 57600, 115200]

interface Props {
  status: SerialStatus
  baudRate: number
  portInfo: { usbVendorId?: number; usbProductId?: number } | null
  error: string | null
  /** Ultima riga ricevuta dalla scheda (es. READY, OK 1). */
  lastReceived: string | null
  /** Comandi da provare a mano, uno per classe. */
  testCommands: { label: string; cmd: string }[]
  onBaudChange: (b: number) => void
  onConnect: () => void
  onDisconnect: () => void
  onTest: (cmd: string) => void
}

export function SerialStep({
  status,
  baudRate,
  portInfo,
  error,
  lastReceived,
  testCommands,
  onBaudChange,
  onConnect,
  onDisconnect,
  onTest,
}: Props) {
  const unsupported = status === 'unsupported'
  const connected = status === 'connected'

  return (
    <StepCard
      number="02"
      title="Arduino"
      hint="Collega la scheda via USB. Il browser ti chiederà quale porta usare."
      color="#00b894"
      done={connected}
    >
      {unsupported ? (
        <p className="error">
          Questo browser non supporta Web Serial. Apri la pagina con Chrome, Edge o Opera.
        </p>
      ) : (
        <div className="row">
          <select
            className="select"
            value={baudRate}
            onChange={(e) => onBaudChange(Number(e.target.value))}
            disabled={connected || status === 'connecting'}
            aria-label="Baud rate"
          >
            {BAUD_RATES.map((b) => (
              <option key={b} value={b}>
                {b} baud
              </option>
            ))}
          </select>
          {connected ? (
            <button type="button" className="btn btn-ghost btn-wide" onClick={onDisconnect}>
              Scollega
            </button>
          ) : (
            <button
              type="button"
              className="btn btn-primary btn-wide"
              onClick={onConnect}
              disabled={status === 'connecting'}
            >
              {status === 'connecting' ? 'Collego…' : 'Collega Arduino'}
            </button>
          )}
        </div>
      )}

      {error && <p className="error">{error}</p>}

      {connected && (
        <>
          <div className="rx" data-ok={lastReceived !== null}>
            <span className="rx-label">Risposta della scheda</span>
            <span className="rx-value">{lastReceived ?? 'nessuna ancora… (attendi ~2 s dopo il collegamento)'}</span>
          </div>

          <div className="test">
            <span className="muted">Prova il servo senza il modello:</span>
            <div className="chips">
              {testCommands.map((t, i) => (
                <button
                  key={t.cmd + i}
                  type="button"
                  className="btn btn-sm"
                  onClick={() => onTest(t.cmd)}
                  title={`Invia "${t.cmd}"`}
                >
                  <span className="chip-dot" style={{ background: classColor(i) }} />
                  {t.label} <code>{t.cmd}</code>
                </button>
              ))}
            </div>
          </div>

          <p className="muted">
            {portInfo?.usbVendorId
              ? `VID ${portInfo.usbVendorId.toString(16).padStart(4, '0')} PID ${(portInfo.usbProductId ?? 0)
                  .toString(16)
                  .padStart(4, '0')} · `
              : ''}
            {baudRate} baud
          </p>
        </>
      )}
      {!connected && !unsupported && (
        <p className="muted">
          Lo sketch da caricare sulla scheda è in <code>arduino/sorter</code>.
        </p>
      )}
    </StepCard>
  )
}
