import { Info } from './Info'
import { classColor } from '../lib/palette'
import type { Settings, Side } from '../lib/types'

interface Props {
  settings: Settings
  labels: string[]
  onChange: (patch: Partial<Settings>) => void
}

const SIDES: { value: Side; label: string }[] = [
  { value: 'left', label: '← Sx' },
  { value: 'none', label: '–' },
  { value: 'right', label: 'Dx →' },
]

export function SettingsPanel({ settings, labels, onChange }: Props) {
  const setCommand = (i: number, value: string) => {
    const commands = [...settings.commands]
    commands[i] = value
    onChange({ commands })
  }
  const setSide = (i: number, value: Side) => {
    const sides = [...settings.sides]
    sides[i] = value
    onChange({ sides })
  }

  return (
    <section className="card">
      <h3 className="panel-title">
        Regole di invio
        <span className="muted">passa sulle (i) per capire ogni voce</span>
      </h3>
      <div className="settings-grid">
        <div className="field">
          <label>
            <span className="field-name">
              Soglia di confidenza
              <Info label="Cos'è la soglia di confidenza">
                Quanto deve essere sicuro il modello prima di dire «è questo!». Alta = meno errori ma più oggetti
                ignorati. Bassa = più reattivo ma rischia di confondersi. 75% è un buon punto di partenza.
              </Info>
            </span>
            <output>{Math.round(settings.threshold * 100)}%</output>
          </label>
          <input
            type="range"
            min={0.3}
            max={0.99}
            step={0.01}
            value={settings.threshold}
            onChange={(e) => onChange({ threshold: Number(e.target.value) })}
          />
        </div>

        <div className="field">
          <label>
            <span className="field-name">
              Stabilità
              <Info label="Cos'è la stabilità">
                Per quanti fotogrammi di fila la stessa classe deve vincere prima che il sorter agisca. Evita che il
                servo scatti per un attimo di indecisione mentre l'oggetto sta ancora scendendo.
              </Info>
            </span>
            <output>{settings.stableFrames} frame</output>
          </label>
          <input
            type="range"
            min={1}
            max={15}
            step={1}
            value={settings.stableFrames}
            onChange={(e) => onChange({ stableFrames: Number(e.target.value) })}
          />
        </div>

        <div className="field">
          <label>
            <span className="field-name">
              Quando inviare
              <Info label="Quando viene inviato il comando">
                «Al cambio»: un solo comando ogni volta che la classe riconosciuta cambia, il più pulito per il
                sorter. «In continuo»: ripete il comando della classe corrente a intervalli regolari, utile se
                l'Arduino può perdersi un messaggio.
              </Info>
            </span>
          </label>
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
        </div>

        <div className="field" data-disabled={settings.mode !== 'continuous'}>
          <label>
            <span className="field-name">
              Intervallo
              <Info label="Cos'è l'intervallo">
                Ogni quanti millisecondi ripetere il comando in modalità «in continuo». Nella modalità «al cambio»
                non serve e resta spento.
              </Info>
            </span>
            <output>{settings.intervalMs} ms</output>
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
        </div>

        <div className="field settings-span">
          <label>
            <span className="field-name">
              Nessuna classe riconosciuta
              <Info label="Comando quando non riconosce nulla">
                Cosa mandare all'Arduino quando nessuna classe supera la soglia, per esempio con lo scivolo vuoto.
                Lascialo vuoto per non mandare nulla: lo sketch continua a vibrare per far scendere l'oggetto
                successivo.
              </Info>
            </span>
          </label>
          <input
            className="input mono"
            placeholder="(non inviare nulla)"
            value={settings.idleCommand}
            onChange={(e) => onChange({ idleCommand: e.target.value })}
          />
        </div>
      </div>

      {labels.length > 0 && (
        <div className="cmd-table-wrap">
          <table className="cmd-table">
            <thead>
              <tr>
                <th>Classe</th>
                <th>
                  <span className="field-name">
                    Lato
                    <Info label="Cos'è il lato">
                      In quale ciotola finisce questa classe. Nella schermata del sorter si accende la zona
                      corrispondente. «–» per le classi che non vanno smistate, come «vuoto».
                    </Info>
                  </span>
                </th>
                <th>
                  <span className="field-name">
                    Comando
                    <Info label="Cos'è il comando">
                      Il testo che il browser manda all'Arduino quando riconosce questa classe. Lo sketch in
                      dotazione capisce 0 = scatto a sinistra, 1 = scatto a destra, tutto il resto viene ignorato.
                    </Info>
                  </span>
                </th>
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
                    <div className="segmented segmented-sm" role="group" aria-label={`Lato per ${label}`}>
                      {SIDES.map((s) => (
                        <button
                          key={s.value}
                          type="button"
                          aria-pressed={(settings.sides[i] ?? 'none') === s.value}
                          onClick={() => setSide(i, s.value)}
                        >
                          {s.label}
                        </button>
                      ))}
                    </div>
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
        </div>
      )}
    </section>
  )
}
