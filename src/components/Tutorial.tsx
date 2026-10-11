import type { ReactNode } from 'react'

interface TutorialProps {
  title: string
  steps: ReactNode[]
  tip?: ReactNode
  aside?: ReactNode
}

export function Tutorial({ title, steps, tip, aside }: TutorialProps) {
  return (
    <section className="card tutorial">
      <div className="tutorial-main">
        <h3 className="panel-title">{title}</h3>
        <ol className="tutorial-steps">
          {steps.map((s, i) => (
            <li key={i}>
              <span className="tutorial-num">{i + 1}</span>
              <span>{s}</span>
            </li>
          ))}
        </ol>
        {tip && (
          <div className="tip">
            <span aria-hidden>💡</span>
            <span>{tip}</span>
          </div>
        )}
      </div>
      {aside && <div className="tutorial-aside">{aside}</div>}
    </section>
  )
}

/* ---------- Illustrazioni ---------- */

export function ModelIllustration() {
  return (
    <svg viewBox="0 0 260 180" className="illu" role="img" aria-label="Classi di esempio su Teachable Machine">
      <rect x="10" y="10" width="240" height="160" rx="16" fill="#fff" stroke="#1a1a2e" strokeWidth="3" />
      <rect x="26" y="28" width="68" height="124" rx="10" fill="#ebe5ff" stroke="#6c47ff" strokeWidth="2" />
      <rect x="96" y="28" width="68" height="124" rx="10" fill="#ffe3e9" stroke="#ff5c8a" strokeWidth="2" />
      <rect x="166" y="28" width="68" height="124" rx="10" fill="#f3ede4" stroke="#8a8aa0" strokeWidth="2" />
      <circle cx="60" cy="70" r="16" fill="#6c47ff" />
      <circle cx="130" cy="70" r="16" fill="#ff5c8a" />
      <circle cx="200" cy="70" r="16" fill="none" stroke="#8a8aa0" strokeWidth="3" strokeDasharray="4 4" />
      <text x="60" y="120" textAnchor="middle" fontSize="12" fontWeight="800" fill="#1a1a2e" fontFamily="Nunito, sans-serif">
        M&amp;M&apos;s
      </text>
      <text x="130" y="120" textAnchor="middle" fontSize="12" fontWeight="800" fill="#1a1a2e" fontFamily="Nunito, sans-serif">
        Skittles
      </text>
      <text x="200" y="120" textAnchor="middle" fontSize="12" fontWeight="800" fill="#1a1a2e" fontFamily="Nunito, sans-serif">
        Vuoto
      </text>
      <rect x="40" y="134" width="40" height="8" rx="4" fill="#6c47ff" opacity="0.5" />
      <rect x="110" y="134" width="40" height="8" rx="4" fill="#ff5c8a" opacity="0.5" />
      <rect x="180" y="134" width="40" height="8" rx="4" fill="#8a8aa0" opacity="0.5" />
    </svg>
  )
}

export function ArduinoIllustration() {
  return (
    <svg viewBox="0 0 260 180" className="illu" role="img" aria-label="Collegamento del servo all'Arduino">
      <rect x="20" y="40" width="130" height="100" rx="10" fill="#00b894" stroke="#1a1a2e" strokeWidth="3" />
      <rect x="34" y="52" width="30" height="20" rx="3" fill="#1a1a2e" />
      <rect x="110" y="52" width="26" height="76" rx="4" fill="#1a1a2e" />
      {[0, 1, 2, 3, 4, 5].map((i) => (
        <rect key={i} x="116" y={58 + i * 11} width="14" height="6" rx="1" fill="#ffd23f" />
      ))}
      <text x="36" y="128" fontSize="11" fontWeight="900" fill="#fff" fontFamily="Nunito, sans-serif">
        ARDUINO
      </text>
      <rect x="190" y="70" width="50" height="40" rx="6" fill="#1e90ff" stroke="#1a1a2e" strokeWidth="3" />
      <rect x="205" y="54" width="20" height="16" rx="3" fill="#1a1a2e" />
      <rect x="213" y="36" width="4" height="20" rx="2" fill="#1a1a2e" />
      <rect x="196" y="36" width="38" height="5" rx="2.5" fill="#fff" stroke="#1a1a2e" strokeWidth="2" />
      <text x="215" y="130" textAnchor="middle" fontSize="11" fontWeight="900" fill="#1a1a2e" fontFamily="Nunito, sans-serif">
        SERVO
      </text>
      <path d="M136 61 C 165 61, 165 78, 190 78" stroke="#ffb400" strokeWidth="3" fill="none" />
      <path d="M136 83 C 165 83, 165 90, 190 90" stroke="#ff4d6d" strokeWidth="3" fill="none" />
      <path d="M136 105 C 165 105, 165 102, 190 102" stroke="#1a1a2e" strokeWidth="3" fill="none" />
      <text x="162" y="56" textAnchor="middle" fontSize="9" fontWeight="800" fill="#1a1a2e" fontFamily="JetBrains Mono, monospace">
        pin 9
      </text>
      <text x="162" y="120" textAnchor="middle" fontSize="9" fontWeight="800" fill="#1a1a2e" fontFamily="JetBrains Mono, monospace">
        5V · GND
      </text>
    </svg>
  )
}

export function MountIllustration() {
  return (
    <svg viewBox="0 0 260 180" className="illu" role="img" aria-label="Struttura montata sopra lo schermo del portatile">
      {/* schermo */}
      <rect x="70" y="52" width="120" height="80" rx="6" fill="#1a1a2e" stroke="#1a1a2e" strokeWidth="3" />
      <rect x="76" y="58" width="108" height="68" rx="3" fill="#fbf7f1" />
      <rect x="110" y="70" width="40" height="30" rx="3" fill="#1a1a2e" opacity="0.15" />
      <rect x="80" y="66" width="24" height="40" rx="3" fill="#6c47ff" opacity="0.25" />
      <rect x="156" y="66" width="24" height="40" rx="3" fill="#ff5c8a" opacity="0.25" />
      {/* base portatile */}
      <path d="M40 140 L220 140 L205 152 L55 152 Z" fill="#e6e0d6" stroke="#1a1a2e" strokeWidth="3" />
      {/* struttura di cartone sul bordo superiore, davanti alla webcam */}
      <path d="M112 52 L148 52 L140 22 L120 22 Z" fill="#ffd23f" stroke="#1a1a2e" strokeWidth="3" />
      <rect x="122" y="10" width="16" height="14" rx="2" fill="#fff" stroke="#1a1a2e" strokeWidth="2" />
      <circle cx="130" cy="48" r="3" fill="#ff4d6d" />
      {/* ciotole sinistra e destra */}
      <ellipse cx="42" cy="150" rx="22" ry="8" fill="#ebe5ff" stroke="#6c47ff" strokeWidth="3" />
      <circle cx="36" cy="147" r="3" fill="#6c47ff" />
      <circle cx="46" cy="149" r="3" fill="#6c47ff" />
      <ellipse cx="218" cy="150" rx="22" ry="8" fill="#ffe3e9" stroke="#ff5c8a" strokeWidth="3" />
      <circle cx="212" cy="147" r="3" fill="#ff5c8a" />
      <circle cx="222" cy="149" r="3" fill="#ff5c8a" />
      <text x="42" y="172" textAnchor="middle" fontSize="10" fontWeight="900" fill="#6c47ff" fontFamily="Nunito, sans-serif">
        SINISTRA
      </text>
      <text x="218" y="172" textAnchor="middle" fontSize="10" fontWeight="900" fill="#ff5c8a" fontFamily="Nunito, sans-serif">
        DESTRA
      </text>
    </svg>
  )
}
