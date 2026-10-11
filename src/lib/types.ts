export type SendMode = 'change' | 'continuous'

/** Lato del sorter a cui una classe è assegnata nella schermata finale. */
export type Side = 'left' | 'right' | 'none'

export interface Settings {
  /** Confidenza minima (0..1) perché una classe venga considerata riconosciuta. */
  threshold: number
  /** Frame consecutivi con la stessa classe prima di accettarla (anti-sfarfallio). */
  stableFrames: number
  /** 'change': invia solo quando la classe cambia. 'continuous': ripete ogni intervalMs. */
  mode: SendMode
  intervalMs: number
  /** Specchia la webcam (Teachable Machine allena con la camera specchiata). */
  mirror: boolean
  /** Terminatore di riga inviato dopo ogni comando. */
  lineEnding: '\n' | ''
  /** Comando per ogni classe, nello stesso ordine delle etichette del modello. */
  commands: string[]
  /** Lato (sinistra/destra/nessuno) per ogni classe. */
  sides: Side[]
  /** Comando quando nessuna classe supera la soglia. Vuoto = non inviare nulla. */
  idleCommand: string
  baudRate: number
}

export const DEFAULT_SETTINGS: Settings = {
  threshold: 0.75,
  stableFrames: 3,
  mode: 'change',
  intervalMs: 500,
  mirror: true,
  lineEnding: '\n',
  commands: [],
  sides: [],
  idleCommand: '',
  baudRate: 9600,
}

/** Valori di default per un modello con `n` classi: prima a sinistra, seconda a destra. */
export function defaultsForLabels(n: number): Pick<Settings, 'commands' | 'sides'> {
  return {
    commands: Array.from({ length: n }, (_, i) => String(i)),
    sides: Array.from({ length: n }, (_, i) => (i === 0 ? 'left' : i === 1 ? 'right' : 'none')),
  }
}

export type LogDir = 'in' | 'out' | 'sys' | 'err'

export interface LogEntry {
  id: number
  t: number
  dir: LogDir
  text: string
}
