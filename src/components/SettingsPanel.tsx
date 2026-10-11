import { classColor } from '../lib/palette'
import type { Settings } from '../lib/types'

interface Props {
  settings: Settings
  labels: string[]
  onChange: (patch: Partial<Settings>) => void
}

export function SettingsPanel({ settings, labels, onChange }: Props) {
  const setCommand = (i: number, value: string) => {
    const commands = [...settings.commands]
    commands[i] = value
    onChange({ commands })
  }

  return (
    <section className="card">
      <h3 className="panel-title">Regole di invio</h3>
      <div className="settings-grid">
        <div className="field">
          <label>
            Soglia di confidenza <output>{Math.round(settings.threshold * 100)}%</output>
          </label>
          <input
            type="range"
            min={0.3}
            max={0.99}
            step={0.01}
            value={settings.threshold}
            onChange={(e) => onChange({ threshold: Number(e.target.value) })}
          />
          <small>Sotto questa confidenza la classe viene ignorata.</small>
        </div>

        <div className="field">
          <label>
            Stabilità <output>{settings.stableFrames} frame</output>
          </label>
          <input
            type="range"
            min={1}
            max={15}
            step={1}
            value={settings.stableFrames}
            onChange={(e) => onChange({ stableFrames: Number(e.target.value) })}
          />
          <small>Frame consecutivi uguali prima di accettare la classe. Più alto = meno sfarfallio.</small>
        </div>

        <div className="field">
          <label>Quando inviare</label>
          <div className="segmented" role="group">
            <button
              type="button"
              aria-pressed={settings.mode === 'change'}
              onClick={() => onChange({ mode: 'change' })}
            >
              Al cambio di classe
            </button>
            <button
              type="button"
              aria-pressed={settings.mode === 'continuous'}
              onClick={() => onChange({ mode: 'continuous' })}
            >
              In continuo
            </button>
          </div>
          <small>
            {settings.mode === 'change'
              ? 'Un solo comando ogni volta che la classe riconosciuta cambia.'
              : 'Ripete il comando della classe corrente a intervalli regolari.'}
          </small>
        </div>

        <div className="field">
          <label>
            Intervallo <output>{settings.intervalMs} ms</output>
          </label>
          <input
            type="range"
            min={100}
            max={2000}
            step={50}
            value={settings.intervalMs}
            onChange={(e) => onChange({ intervalMs: Number(e.target.value) })}
            disabled={settings.mode !== 'continuous'}
          />
          <small>Solo in modalità continua.</small>
        </div>

        <div className="field">
          <label>Fine riga</label>
          <div className="segmented" role="group">
            <button
              type="button"
              aria-pressed={settings.lineEnding === '\n'}
              onClick={() => onChange({ lineEnding: '\n' })}
            >
              Newline (\n)
            </button>
            <button
              type="button"
              aria-pressed={settings.lineEnding === ''}
              onClick={() => onChange({ lineEnding: '' })}
            >
              Nessuno
            </button>
          </div>
          <small>Con newline su Arduino usi <code>Serial.parseInt()</code> o <code>readStringUntil('\n')</code>.</small>
        </div>

        <div className="field">
          <label>Nessuna classe riconosciuta</label>
          <input
            className="input mono"
            placeholder="(non inviare nulla)"
            value={settings.idleCommand}
            onChange={(e) => onChange({ idleCommand: e.target.value })}
          />
          <small>Comando opzionale quando nessuna classe supera la soglia.</small>
        </div>
      </div>

      {labels.length > 0 && (
        <table className="cmd-table">
          <thead>
            <tr>
              <th>Classe</th>
              <th>Comando inviato</th>
            </tr>
          </thead>
          <tbody>
            {labels.map((label, i) => (
              <tr key={label + i}>
                <td>
                  <span className="bar-label">
                    <span className="chip-dot" style={{ background: classColor(i), flexShrink: 0 }} />
                    <span>{label}</span>
                  </span>
                </td>
                <td>
                  <input
                    className="input mono"
                    value={settings.commands[i] ?? String(i)}
                    onChange={(e) => setCommand(i, e.target.value)}
                  />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </section>
  )
}
