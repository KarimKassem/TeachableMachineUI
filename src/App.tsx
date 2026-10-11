import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { CameraStep } from './components/CameraStep'
import { LivePanel } from './components/LivePanel'
import { ModelStep } from './components/ModelStep'
import { PredictionsPanel } from './components/PredictionsPanel'
import { SerialMonitor } from './components/SerialMonitor'
import { SerialStep } from './components/SerialStep'
import { SettingsPanel } from './components/SettingsPanel'
import { StatusPill, type Tone } from './components/StatusPill'
import { useCamera } from './hooks/useCamera'
import { isWebSerialSupported, SerialLink, type SerialStatus } from './lib/serial'
import { loadTeachableModel, type Prediction, type TeachableModel } from './lib/teachable'
import { DEFAULT_SETTINGS, type LogEntry, type Settings } from './lib/types'

const STORAGE_KEY = 'teachable-sorter:v1'
const FRAME_INTERVAL_MS = 80 // ~12 classificazioni al secondo
const MAX_LOG = 300

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

  const connectSerial = async () => {
    setSerialError(null)
    try {
      await serial.connect(settingsRef.current.baudRate)
      pushLog('sys', `Collegato a ${settingsRef.current.baudRate} baud`)
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

  // ----- caricamento modello -----
  const loadModel = async (url: string) => {
    model?.dispose()
    setModel(null)
    setModelStatus('loading')
    setModelProgress(0)
    setModelError(null)
    setModelUrl(url)
    try {
      const m = await loadTeachableModel(url, setModelProgress)
      setModel(m)
      setModelStatus('ready')
      setSettings((s) => {
        const sameShape = s.commands.length === m.labels.length
        return sameShape ? s : { ...s, commands: m.labels.map((_, i) => String(i)) }
      })
      pushLog('sys', `Modello pronto: ${m.labels.join(', ')}`)
    } catch (err) {
      setModelStatus('error')
      setModelError((err as Error).message)
    }
  }
  const unloadModel = () => {
    model?.dispose()
    setModel(null)
    setModelStatus('idle')
    setPredictions(null)
    setStable(null)
  }

  // ----- loop di classificazione -----
  const [predictions, setPredictions] = useState<Prediction[] | null>(null)
  const [stable, setStable] = useState<number | null>(null)
  const [fps, setFps] = useState(0)
  const cameraRunning = camera.status === 'running'

  useEffect(() => {
    if (!model || !cameraRunning) {
      setPredictions(null)
      setStable(null)
      return
    }
    const video = camera.videoRef.current
    if (!video) return

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
      if (t - lastTick < FRAME_INTERVAL_MS || video.readyState < 2) return
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
        if (s.mode === 'change') emit(cand)
      }
      if (s.mode === 'continuous' && d.stable !== -2 && t - d.lastSentAt >= s.intervalMs) {
        emit(d.stable)
      }
    }
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [model, cameraRunning, camera.videoRef, serial, sendRaw])

  // ----- derivati per l'header -----
  const modelTone: Tone = modelStatus === 'ready' ? 'ok' : modelStatus === 'loading' ? 'warn' : modelStatus === 'error' ? 'danger' : 'idle'
  const camTone: Tone = cameraRunning ? 'ok' : camera.status === 'starting' ? 'warn' : camera.status === 'error' ? 'danger' : 'idle'
  const serialTone: Tone =
    serialStatus === 'connected' ? 'ok' : serialStatus === 'connecting' ? 'warn' : serialStatus === 'unsupported' ? 'danger' : 'idle'

  const labels = model?.labels ?? []
  const currentCommand =
    stable !== null ? (settings.commands[stable] ?? String(stable)) : settings.idleCommand || null

  return (
    <div className="page">
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
            <p>Dal modello di Teachable Machine all'Arduino, direttamente dal browser.</p>
          </div>
        </div>
        <div className="pills">
          <StatusPill label="Modello" tone={modelTone} />
          <StatusPill label="Arduino" tone={serialTone} />
          <StatusPill label="Webcam" tone={camTone} />
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

      <div className="steps">
        <ModelStep
          model={model}
          status={modelStatus}
          progress={modelProgress}
          error={modelError}
          initialUrl={modelUrl}
          onLoad={loadModel}
          onUnload={unloadModel}
        />
        <SerialStep
          status={serialStatus}
          baudRate={settings.baudRate}
          portInfo={serial.info}
          error={serialError}
          onBaudChange={(baudRate) => patchSettings({ baudRate })}
          onConnect={connectSerial}
          onDisconnect={disconnectSerial}
        />
        <CameraStep
          status={camera.status}
          error={camera.error}
          devices={camera.devices}
          deviceId={camera.deviceId}
          mirror={settings.mirror}
          onStart={camera.start}
          onStop={camera.stop}
          onMirror={(mirror) => patchSettings({ mirror })}
        />
      </div>

      <div className="live">
        <LivePanel
          videoRef={camera.videoRef}
          running={cameraRunning}
          mirror={settings.mirror}
          fps={fps}
          stable={stable}
          labels={labels}
          command={currentCommand}
          hasModel={!!model}
        />
        <PredictionsPanel predictions={predictions} labels={labels} threshold={settings.threshold} stable={stable} />
      </div>

      <div className="bottom">
        <SettingsPanel settings={settings} labels={labels} onChange={patchSettings} />
        <SerialMonitor
          log={log}
          connected={serialStatus === 'connected'}
          onSend={(t) => void sendRaw(t)}
          onClear={() => setLog([])}
        />
      </div>

      <footer className="footer">
        <span>Tutto gira nel browser: nessun dato lascia il tuo computer.</span>
        <span>
          Modelli da{' '}
          <a href="https://teachablemachine.withgoogle.com/" target="_blank" rel="noreferrer">
            Teachable Machine
          </a>
        </span>
      </footer>
    </div>
  )
}
