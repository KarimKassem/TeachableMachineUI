import { StepCard } from './StepCard'
import type { SerialStatus } from '../lib/serial'

const BAUD_RATES = [9600, 19200, 38400, 57600, 115200]

interface Props {
  status: SerialStatus
  baudRate: number
  portInfo: { usbVendorId?: number; usbProductId?: number } | null
  error: string | null
  onBaudChange: (b: number) => void
  onConnect: () => void
  onDisconnect: () => void
}

export function SerialStep({ status, baudRate, portInfo, error, onBaudChange, onConnect, onDisconnect }: Props) {
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
        <p className="muted">
          Collegato
          {portInfo?.usbVendorId
            ? ` · VID ${portInfo.usbVendorId.toString(16).padStart(4, '0')} PID ${(portInfo.usbProductId ?? 0)
                .toString(16)
                .padStart(4, '0')}`
            : ''}
          {' · '}
          {baudRate} baud
        </p>
      )}
      {!connected && !unsupported && (
        <p className="muted">Lo sketch da caricare sulla scheda è in <code>arduino/sorter</code>.</p>
      )}
    </StepCard>
  )
}
