import { useId, useState, type ReactNode } from 'react'

interface Props {
  /** Spiegazione mostrata nel fumetto. */
  children: ReactNode
  /** Etichetta per lo screen reader, es. "Cos'è la soglia". */
  label?: string
}

/**
 * Pallino (i) con fumetto: compare al passaggio del mouse o al focus da
 * tastiera, e con un tocco/click resta aperto (per touch screen).
 */
export function Info({ children, label = 'Informazioni' }: Props) {
  const [pinned, setPinned] = useState(false)
  const id = useId()
  return (
    <span className="info" data-pinned={pinned}>
      <button
        type="button"
        className="info-btn"
        aria-label={label}
        aria-describedby={id}
        aria-expanded={pinned}
        onClick={() => setPinned((p) => !p)}
        onBlur={() => setPinned(false)}
      >
        i
      </button>
      <span className="info-bubble" role="tooltip" id={id}>
        {children}
      </span>
    </span>
  )
}
