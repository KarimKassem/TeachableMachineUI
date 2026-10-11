import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { CameraStep } from './components/CameraStep'
import { LivePanel } from './components/LivePanel'
import { ModelStep } from './components/ModelStep'
import { PredictionsPanel } from './components/PredictionsPanel'
import { SerialMonitor } from './components/SerialMonitor'
import { SerialStep } from './components/SerialStep'
import { SettingsPanel } from './components/SettingsPanel'
import { Stage } from './components/Stage'
import { StatusPill, type Tone } from './components/StatusPill'
import { ArduinoIllustration, ModelIllustration, MountIllustration, Tutorial } from './components/Tutorial'
import { Wizard } from './components/Wizard'
import { useCamera } from './hooks/useCamera'
import { isWebSerialSupported, SerialLink, type SerialStatus } from './lib/serial'
import { loadTeachableModel, type Prediction, type TeachableModel } from './lib/teachable'
import { DEFAULT_SETTINGS, defaultsForLabels, type LogEntry, type Settings } from './lib/types'

const STORAGE_KEY = 'teachable-sorter:v1'
const FRAME_INTERVAL_MS = 80 // ~12 classificazioni al secondo
const MAX_LOG = 300

type Phase = 'setup' | 'run'

interface Persisted {
  modelUrl: string
  settings: Settings
}

function readPersisted(): Persisted {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (raw) {
      const p = JSON.parse(raw) as Partial<Persisted>
      return { modelUrl: p.modelUrl ?? '', settings: { ...DEFAULT_SETTINGS, ...(p.settings ?? {}) } }
    }
  } catch {
    /* storage non disponibile */
  }
  return { modelUrl: '', settings: DEFAULT_SETTINGS }
}

export default function App() {
  const persisted = useMemo(readPersisted, [])

  // ----- navigazione -----
  const [phase, setPhase] = useState<Phase>('setup')
  const [step, setStep] = useState(0)
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [arduinoSkipped, setArduinoSkipped] = useState(false)

  // ----- modello -----
  const [modelUrl, setModelUrl] = useState(persisted.modelUrl)
  const [model, setModel] = useState<TeachableModel | null>(null)
  const [modelStatus, setModelStatus] = useState<'idle' | 'loading' | 'ready' | 'error'>('idle')
  const [modelProgress, setModelProgress] = useState(0)
  const [modelError, setModelError] = useState<string | null>(null)

  // ----- impostazioni -----
  const [settings, setSettings] = useState<Settings>(persisted.settings)
  const settingsRef = useRef(settings)
  settingsRef.current = settings
  const patchSettings = useCallback((patch: Partial<Settings>) => setSettings((s) => ({ ...s, ...patch })), [])

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({ modelUrl, settings } satisfies Persisted))
    } catch {
      /* ignorato */
    }
  }, [modelUrl, settings])

  // ----- log seriale -----
  const [log, setLog] = useState<LogEntry[]>([])
  const logId = useRef(0)
  const pushLog = useCallback((dir: LogEntry['dir'], text: string) => {
    setLog((l) => {
      const next = [...l, { id: logId.current++, t: Date.now(), dir, text }]
      return next.length > MAX_LOG ? next.slice(next.length - MAX_LOG) : next
    })
  }, [])

  // ----- seriale -----
  const [serialStatus, setSerialStatus] = useState<SerialStatus>(isWebSerialSupported() ? 'disconnected' : 'unsupported')
  const [serialError, setSerialError] = useState<string | null>(null)
  const serialRef = useRef<SerialLink | null>(null)
  if (!serialRef.current) {
    serialRef.current = new SerialLink({
      onStatus: setSerialStatus,
      onLine: (line) => pushLog('in', line),
      onError: (msg) => pushLog('err', msg),
    })
  }
  const serial = serialRef.current

  const stableRef = useRef<number | null>(null)
  const connectSerial = async () => {
    setSerialError(null)
    try {
      await serial.connect(settingsRef.current.baudRate)
      pushLog('sys', `Collegato a ${settingsRef.current.baudRate} baud. La scheda si riavvia, attendo READY…`)
      // Aprendo la porta la maggior parte delle schede si resetta e perde ~2 s:
      // dopo l'avvio rimando il comando della classe attualmente riconosciuta.
      window.setTimeout(() => {
        const idx = stableRef.current
        if (idx === null || serial.status !== 'connected') return
        const cmd = settingsRef.current.commands[idx] ?? String(idx)
        if (cmd) void sendRaw(cmd)
      }, 2500)
    } catch (err) {
      setSerialError((err as Error).message)
    }
  }
  const disconnectSerial = async () => {
    await serial.disconnect()
    pushLog('sys', 'Scollegato')
  }

  const sendRaw = useCallback(
    async (text: string, withEnding = true) => {
      const payload = withEnding ? text + settingsRef.current.lineEnding : text
      try {
        await serial.send(payload)
        pushLog('out', text)
      } catch (err) {
        pushLog('err', (err as Error).message)
      }
    },
    [serial, pushLog],
  )

  // ----- webcam -----
  const camera = useCamera()
  const cameraRunning = camera.status === 'running'

  // ----- caricamento modello -----
  const loadModel = useCallback(
    async (url: string) => {
      setModel((m) => {
        m?.dispose()
        return null
      })
      setModelStatus('loading')
      setModelProgress(0)
      setModelError(null)
      setModelUrl(url)
      try {
        const m = await loadTeachableModel(url, setModelProgress)
        setModel(m)
        setModelStatus('ready')
        setSettings((s) =>
          s.commands.length === m.labels.length && s.sides.length === m.labels.length
            ? s
            : { ...s, ...defaultsForLabels(m.labels.length) },
        )
        pushLog('sys', `Modello pronto: ${m.labels.join(', ')}`)
      } catch (err) {
        setModelStatus('error')
        setModelError((err as Error).message)
      }
    },
    [pushLog],
  )
  const unloadModel = () => {
    model?.dispose()
    setModel(null)
    setModelStatus('idle')
    setPredictions(null)
    setStable(null)
  }

  // Ricarica automaticamente l'ultimo modello usato
  const autoLoaded = useRef(false)
  useEffect(() => {
    if (autoLoaded.current) return
    autoLoaded.current = true
    if (persisted.modelUrl) void loadModel(persisted.modelUrl)
  }, [persisted.modelUrl, loadModel])

  // ----- loop di classificazione -----
  const [predictions, setPredictions] = useState<Prediction[] | null>(null)
  const [stable, setStable] = useState<number | null>(null)
  const [fps, setFps] = useState(0)

  useEffect(() => {
    if (!model || !cameraRunning) {
      setPredictions(null)
      setStable(null)
      return
    }

    const d = { candidate: -2, count: 0, stable: -2, lastSentAt: 0 }
    let lastTick = 0
    let frames = 0
    let fpsStart = performance.now()
    let raf = 0

    const commandFor = (idx: number) => {
      const s = settingsRef.current
      return idx >= 0 ? (s.commands[idx] ?? String(idx)) : s.idleCommand
    }
    const emit = (idx: number) => {
      const cmd = commandFor(idx)
      if (cmd === '' || serial.status !== 'connected') return
      void sendRaw(cmd)
      d.lastSentAt = performance.now()
    }

    const tick = (t: number) => {
      raf = requestAnimationFrame(tick)
      const video = camera.videoElRef.current
      if (!video || t - lastTick < FRAME_INTERVAL_MS || video.readyState < 2) return
      lastTick = t
      const s = settingsRef.current

      const preds = model.predict(video, s.mirror)
      setPredictions(preds)

      frames++
      if (t - fpsStart >= 1000) {
        setFps((frames * 1000) / (t - fpsStart))
        frames = 0
        fpsStart = t
      }

      // Decisione: argmax sopra soglia, accettata dopo N frame stabili
      let top = 0
      for (let i = 1; i < preds.length; i++) if (preds[i].probability > preds[top].probability) top = i
      const cand = preds[top].probability >= s.threshold ? top : -1
      if (cand === d.candidate) d.count++
      else {
        d.candidate = cand
        d.count = 1
      }
      if (d.count >= s.stableFrames && d.stable !== cand) {
        d.stable = cand
        setStable(cand >= 0 ? cand : null)
        stableRef.current = cand >= 0 ? cand : null
        if (s.mode === 'change') emit(cand)
      }
      if (s.mode === 'continuous' && d.stable !== -2 && t - d.lastSentAt >= s.intervalMs) {
        emit(d.stable)
      }
    }
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [model, cameraRunning, camera.videoElRef, serial, sendRaw])

  // ----- derivati -----
  const modelReady = modelStatus === 'ready'
  const serialConnected = serialStatus === 'connected'
  const modelTone: Tone = modelReady ? 'ok' : modelStatus === 'loading' ? 'warn' : modelStatus === 'error' ? 'danger' : 'idle'
  const camTone: Tone = cameraRunning ? 'ok' : camera.status === 'starting' ? 'warn' : camera.status === 'error' ? 'danger' : 'idle'
  const serialTone: Tone = serialConnected ? 'ok' : serialStatus === 'connecting' ? 'warn' : serialStatus === 'unsupported' ? 'danger' : 'idle'

  const labels = model?.labels ?? []
  const currentCommand = stable !== null ? (settings.commands[stable] ?? String(stable)) : settings.idleCommand || null

  const stepDone = [modelReady, serialConnected || arduinoSkipped, cameraRunning]
  const canNext = stepDone[step]

  const livePanel = (compact: boolean) => (
    <LivePanel
      attachVideo={camera.attachVideo}
      running={cameraRunning}
      mirror={settings.mirror}
      fps={fps}
      stable={stable}
      labels={labels}
      command={currentCommand}
      hasModel={!!model}
      compact={compact}
    />
  )

  const stepCards = [
    <ModelStep
      key="model"
      model={model}
      status={modelStatus}
      progress={modelProgress}
      error={modelError}
      initialUrl={modelUrl}
      onLoad={loadModel}
      onUnload={unloadModel}
    />,
    <SerialStep
      key="serial"
      status={serialStatus}
      baudRate={settings.baudRate}
      portInfo={serial.info}
      error={serialError}
      onBaudChange={(baudRate) => patchSettings({ baudRate })}
      onConnect={connectSerial}
      onDisconnect={disconnectSerial}
      lastReceived={[...log].reverse().find((e) => e.dir === 'in')?.text ?? null}
      testCommands={
        labels.length > 0
          ? labels.map((label, i) => ({ label, cmd: settings.commands[i] ?? String(i) }))
          : [
              { label: 'classe 0', cmd: '0' },
              { label: 'classe 1', cmd: '1' },
            ]
      }
      onTest={(cmd) => void sendRaw(cmd)}
    />,
    <CameraStep
      key="camera"
      status={camera.status}
      error={camera.error}
      devices={camera.devices}
      deviceId={camera.deviceId}
      mirror={settings.mirror}
      onStart={camera.start}
      onStop={camera.stop}
      onMirror={(mirror) => patchSettings({ mirror })}
    />,
  ]

  const tutorials = [
    <Tutorial
      key="t0"
      title="Come preparare il modello"
      aside={<ModelIllustration />}
      steps={[
        <>
          Vai su{' '}
          <a href="https://teachablemachine.withgoogle.com/train/image" target="_blank" rel="noreferrer">
            Teachable Machine → Progetto immagine
          </a>{' '}
          e crea una classe per ogni tipo di oggetto da smistare, più una classe <strong>Vuoto</strong> con lo scivolo
          senza niente sopra.
        </>,
        <>Registra le foto con la webcam, con l'oggetto nella stessa posizione in cui cadrà nel sorter. Poi premi <strong>Addestra</strong>.</>,
        <>
          Premi <strong>Esporta modello</strong>, scheda <strong>Tensorflow.js</strong>, <strong>Carica il mio modello</strong>:
          copia il link che compare e incollalo qui sopra.
        </>,
      ]}
      tip="Scatta le foto nelle stesse condizioni di luce in cui userai il sorter: il modello impara anche lo sfondo."
    />,
    <Tutorial
      key="t1"
      title="Come collegare l'Arduino"
      aside={<ArduinoIllustration />}
      steps={[
        <>
          Collega il servo: filo <strong>segnale</strong> al <code>pin 9</code>, <strong>rosso</strong> a <code>5V</code>,{' '}
          <strong>marrone/nero</strong> a <code>GND</code>.
        </>,
        <>
          Apri <code>arduino/sorter/sorter.ino</code> con Arduino IDE, scegli la scheda e la porta e premi <strong>Carica</strong>.
          Lo sketch originale di Tiny Sorter usa WebUSB e <em>non</em> funziona con questa app: serve questo.
        </>,
        <>
          <strong>Chiudi il Monitor seriale di Arduino IDE</strong>: la porta può essere usata da un programma alla volta. Poi premi{' '}
          <em>Collega Arduino</em> qui sopra e scegli la porta.
        </>,
        <>
          All'accensione il servo fa un movimento di prova, poi vibra da fermo. Quando colleghi la porta la scheda risponde{' '}
          <code>READY</code> (su Uno e Nano prima si riavvia, circa 2 secondi). Poi usa i bottoni <strong>Prova</strong> per
          muovere il servo senza il modello.
        </>,
      ]}
      tip={
        <>
          Se il servo non si muove nemmeno con i bottoni Prova ma vedi <code>OK</code> nelle risposte, il problema è
          l'alimentazione o il cablaggio del servo, non il software. Non hai la scheda sotto mano? Puoi saltare il passo.
        </>
      }
    />,
    <Tutorial
      key="t2"
      title="Come montare il sorter"
      aside={<MountIllustration />}
      steps={[
        <>Appoggia la struttura di cartone sul bordo superiore dello schermo, con lo scivolo davanti alla webcam.</>,
        <>Metti le due ciotole sulla tastiera, una a <strong>sinistra</strong> e una a <strong>destra</strong>: nella schermata finale lo schermo lascia libere quelle due zone.</>,
        <>
          Accendi la webcam e controlla l'anteprima: lo scivolo deve stare dentro le <strong>linee tratteggiate</strong>, che
          mostrano il quadrato analizzato dal modello.
        </>,
      ]}
      tip="Lascia lo specchio attivo: Teachable Machine allena con la camera specchiata, quindi il modello si aspetta la stessa vista."
    />,
  ]

  return (
    <div className="page" data-phase={phase}>
      <header className="header">
        <div className="brand">
          <div className="brand-mark" aria-hidden>
            <svg width="26" height="26" viewBox="0 0 100 100">
              <circle cx="50" cy="50" r="38" fill="#FFD23F" />
              <circle cx="50" cy="50" r="15" fill="#1A1A2E" />
            </svg>
          </div>
          <div>
            <h1>Teachable Sorter</h1>
            {phase === 'setup' && <p>Dal modello di Teachable Machine all'Arduino, direttamente dal browser.</p>}
          </div>
        </div>
        <div className="pills">
          <StatusPill label="Modello" tone={modelTone} />
          <StatusPill label="Arduino" tone={serialTone} />
          <StatusPill label="Webcam" tone={camTone} />
          {phase === 'run' && (
            <>
              <button
                type="button"
                className="btn btn-sm"
                aria-expanded={drawerOpen}
                onClick={() => setDrawerOpen((o) => !o)}
              >
                ⚙︎ {drawerOpen ? 'Nascondi' : 'Impostazioni'}
              </button>
              <button type="button" className="btn btn-sm btn-ghost" onClick={() => setPhase('setup')}>
                ← Setup
              </button>
            </>
          )}
        </div>
      </header>

      {serialStatus === 'unsupported' && (
        <div className="banner" data-tone="danger">
          <span>⚠️</span>
          <span>
            <strong>Web Serial non disponibile.</strong> Per parlare con l'Arduino serve Chrome, Edge o Opera su
            computer. Il riconoscimento funziona comunque.
          </span>
        </div>
      )}
      {!window.isSecureContext && (
        <div className="banner">
          <span>🔒</span>
          <span>
            <strong>Pagina non sicura.</strong> Webcam e Web Serial funzionano solo su HTTPS o localhost.
          </span>
        </div>
      )}

      {phase === 'setup' ? (
        <Wizard
          step={step}
          done={stepDone}
          canNext={canNext}
          skipLabel="Continua senza Arduino"
          onPrev={() => setStep((s) => Math.max(0, s - 1))}
          onNext={() => {
            if (step < 2) setStep(step + 1)
            else setPhase('run')
          }}
          onSkip={step === 1 ? () => setArduinoSkipped(true) : undefined}
          onJump={setStep}
        >
          <div className="wizard-grid" data-step={step}>
            {stepCards[step]}
            {step === 2 && livePanel(true)}
          </div>
          {tutorials[step]}
        </Wizard>
      ) : (
        <>
          <Stage labels={labels} sides={settings.sides} stable={stable}>
            {livePanel(false)}
            <PredictionsPanel predictions={predictions} labels={labels} threshold={settings.threshold} stable={stable} />
          </Stage>

          {drawerOpen && (
            <div className="drawer">
              <SettingsPanel settings={settings} labels={labels} onChange={patchSettings} />
              <SerialMonitor
                log={log}
                connected={serialConnected}
                onSend={(t) => void sendRaw(t)}
                onClear={() => setLog([])}
              />
            </div>
          )}
        </>
      )}

      {phase === 'setup' && (
        <footer className="footer">
          <span>Tutto gira nel browser: nessun dato lascia il tuo computer.</span>
          <span>
            Modelli da{' '}
            <a href="https://teachablemachine.withgoogle.com/" target="_blank" rel="noreferrer">
              Teachable Machine
            </a>
          </span>
        </footer>
      )}
    </div>
  )
}
