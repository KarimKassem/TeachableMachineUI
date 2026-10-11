import { StepCard } from './StepCard'
import type { CameraStatus } from '../hooks/useCamera'

interface Props {
  status: CameraStatus
  error: string | null
  devices: MediaDeviceInfo[]
  deviceId: string
  mirror: boolean
  onStart: (deviceId?: string) => void
  onStop: () => void
  onMirror: (m: boolean) => void
}

export function CameraStep({ status, error, devices, deviceId, mirror, onStart, onStop, onMirror }: Props) {
  const running = status === 'running'

  return (
    <StepCard
      number="03"
      title="Webcam"
      hint="Accendi la camera: il riconoscimento parte da solo quando il modello è pronto."
      color="#ff5c8a"
      done={running}
    >
      <div className="row">
        {devices.length > 1 && (
          <select
            className="select grow"
            value={deviceId}
            onChange={(e) => onStart(e.target.value)}
            aria-label="Webcam"
          >
            {devices.map((d, i) => (
              <option key={d.deviceId} value={d.deviceId}>
                {d.label || `Camera ${i + 1}`}
              </option>
            ))}
          </select>
        )}
        {running ? (
          <button type="button" className="btn btn-ghost btn-wide" onClick={onStop}>
            Spegni
          </button>
        ) : (
          <button
            type="button"
            className="btn btn-primary btn-wide"
            onClick={() => onStart(deviceId || undefined)}
            disabled={status === 'starting'}
          >
            {status === 'starting' ? 'Avvio…' : 'Accendi webcam'}
          </button>
        )}
      </div>
      {error && <p className="error">{error}</p>}
      <label className="switch">
        <input type="checkbox" checked={mirror} onChange={(e) => onMirror(e.target.checked)} />
        Specchia (come su Teachable Machine)
      </label>
    </StepCard>
  )
}
