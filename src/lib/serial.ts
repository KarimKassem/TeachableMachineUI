/**
 * Wrapper minimale sulla Web Serial API.
 * Funziona su Chrome, Edge e Opera (desktop) su HTTPS o localhost.
 */

export type SerialStatus = 'unsupported' | 'disconnected' | 'connecting' | 'connected'

export interface SerialEvents {
  onStatus?: (status: SerialStatus) => void
  onLine?: (line: string) => void
  onError?: (message: string) => void
}

export function isWebSerialSupported(): boolean {
  return typeof navigator !== 'undefined' && 'serial' in navigator
}

export class SerialLink {
  private port: SerialPort | null = null
  private writer: WritableStreamDefaultWriter<Uint8Array> | null = null
  private reader: ReadableStreamDefaultReader<Uint8Array> | null = null
  private readLoop: Promise<void> | null = null
  private closing = false
  status: SerialStatus = isWebSerialSupported() ? 'disconnected' : 'unsupported'

  constructor(private events: SerialEvents = {}) {}

  private setStatus(s: SerialStatus) {
    this.status = s
    this.events.onStatus?.(s)
  }

  get info(): { usbVendorId?: number; usbProductId?: number } | null {
    return this.port?.getInfo() ?? null
  }

  async connect(baudRate = 9600): Promise<void> {
    if (!isWebSerialSupported()) {
      throw new Error('Web Serial non è supportata da questo browser. Usa Chrome o Edge.')
    }
    if (this.port) await this.disconnect()
    this.setStatus('connecting')
    try {
      // Il browser mostra la lista delle porte: l'utente sceglie l'Arduino.
      const port = await navigator.serial.requestPort()
      await port.open({ baudRate })
      this.port = port
      this.closing = false
      this.writer = port.writable!.getWriter()
      this.readLoop = this.startReading()
      port.addEventListener('disconnect', () => {
        this.events.onError?.('Arduino scollegato.')
        void this.disconnect()
      })
      this.setStatus('connected')
    } catch (err) {
      this.setStatus('disconnected')
      this.port = null
      if (err instanceof DOMException && err.name === 'NotFoundError') {
        throw new Error('Nessuna porta selezionata.')
      }
      throw err
    }
  }

  private async startReading(): Promise<void> {
    if (!this.port?.readable) return
    const decoder = new TextDecoder()
    let buffer = ''
    while (this.port.readable && !this.closing) {
      this.reader = this.port.readable.getReader()
      try {
        for (;;) {
          const { value, done } = await this.reader.read()
          if (done) break
          buffer += decoder.decode(value, { stream: true })
          let nl: number
          while ((nl = buffer.indexOf('\n')) >= 0) {
            const line = buffer.slice(0, nl).replace(/\r$/, '')
            buffer = buffer.slice(nl + 1)
            if (line) this.events.onLine?.(line)
          }
        }
      } catch (err) {
        if (!this.closing) this.events.onError?.(`Errore di lettura: ${(err as Error).message}`)
      } finally {
        this.reader.releaseLock()
        this.reader = null
      }
    }
  }

  async send(text: string): Promise<void> {
    if (!this.writer) throw new Error('Arduino non collegato.')
    await this.writer.write(new TextEncoder().encode(text))
  }

  async disconnect(): Promise<void> {
    this.closing = true
    try {
      await this.reader?.cancel()
      await this.readLoop
      if (this.writer) {
        await this.writer.close().catch(() => undefined)
        this.writer.releaseLock()
      }
      await this.port?.close()
    } catch {
      // già chiusa
    } finally {
      this.writer = null
      this.reader = null
      this.port = null
      this.readLoop = null
      this.setStatus('disconnected')
    }
  }
}
