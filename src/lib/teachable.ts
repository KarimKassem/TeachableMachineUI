import * as tf from '@tensorflow/tfjs'

/**
 * Caricamento ed esecuzione di un modello immagine esportato da Teachable Machine.
 *
 * Replica la pipeline della libreria ufficiale @teachablemachine/image
 * (ferma a tfjs 1.3.1) usando tfjs 4:
 *   1. crop centrale quadrato del frame
 *   2. resize a metadata.imageSize (224)
 *   3. normalizzazione pixel/127 - 1
 *   4. model.predict -> softmax per classe
 */

export interface TeachableMetadata {
  labels: string[]
  imageSize?: number
  modelName?: string
  tfjsVersion?: string
  tmVersion?: string
}

export interface Prediction {
  label: string
  index: number
  probability: number
}

export interface TeachableModel {
  url: string
  labels: string[]
  imageSize: number
  metadata: TeachableMetadata
  predict(source: HTMLVideoElement | HTMLCanvasElement | HTMLImageElement, flip?: boolean): Prediction[]
  dispose(): void
}

const TM_HOST = 'https://teachablemachine.withgoogle.com/models/'

/** Accetta l'URL completo, l'URL senza slash finale o solo l'ID del modello. */
export function normalizeModelUrl(input: string): string | null {
  const raw = input.trim()
  if (!raw) return null
  if (/^[A-Za-z0-9_-]{6,}$/.test(raw)) return `${TM_HOST}${raw}/`
  let url: URL
  try {
    url = new URL(raw)
  } catch {
    return null
  }
  if (url.protocol !== 'https:' && url.protocol !== 'http:') return null
  let path = url.pathname
  path = path.replace(/(model|metadata)\.json$/, '')
  if (!path.endsWith('/')) path += '/'
  return `${url.origin}${path}`
}

export async function loadTeachableModel(
  input: string,
  onProgress?: (fraction: number) => void,
): Promise<TeachableModel> {
  const url = normalizeModelUrl(input)
  if (!url) throw new Error('Link non valido. Incolla il link che Teachable Machine ti dà dopo "Esporta modello".')

  await tf.ready()

  const metaRes = await fetch(`${url}metadata.json`)
  if (!metaRes.ok) {
    throw new Error(`metadata.json non trovato (${metaRes.status}). Controlla che il modello sia stato caricato su cloud.`)
  }
  const metadata = (await metaRes.json()) as TeachableMetadata
  if (!Array.isArray(metadata.labels) || metadata.labels.length === 0) {
    throw new Error('Il file metadata.json non contiene le classi del modello.')
  }

  const model = await tf.loadLayersModel(`${url}model.json`, { onProgress })
  const imageSize = metadata.imageSize ?? 224

  // Canvas di lavoro riutilizzato per ogni frame
  const canvas = document.createElement('canvas')
  canvas.width = imageSize
  canvas.height = imageSize
  const ctx = canvas.getContext('2d', { willReadFrequently: true })!

  // Warm-up: la prima predict compila gli shader WebGL ed è lenta
  tf.tidy(() => {
    const warm = tf.zeros([1, imageSize, imageSize, 3])
    const out = model.predict(warm)
    const list = Array.isArray(out) ? out : [out]
    list.forEach((t) => t.dispose())
  })

  function cropTo(source: HTMLVideoElement | HTMLCanvasElement | HTMLImageElement, flip: boolean) {
    const sw = source instanceof HTMLVideoElement ? source.videoWidth : source.width
    const sh = source instanceof HTMLVideoElement ? source.videoHeight : source.height
    const side = Math.min(sw, sh)
    const sx = (sw - side) / 2
    const sy = (sh - side) / 2
    ctx.save()
    if (flip) {
      ctx.translate(imageSize, 0)
      ctx.scale(-1, 1)
    }
    ctx.drawImage(source, sx, sy, side, side, 0, 0, imageSize, imageSize)
    ctx.restore()
  }

  return {
    url,
    labels: metadata.labels,
    imageSize,
    metadata,
    predict(source, flip = false) {
      cropTo(source, flip)
      const probs = tf.tidy(() => {
        const pixels = tf.browser.fromPixels(canvas)
        const batched = pixels.expandDims(0).toFloat().div(127).sub(1)
        const out = model.predict(batched) as tf.Tensor
        return out.dataSync()
      })
      return metadata.labels.map((label, index) => ({ label, index, probability: probs[index] ?? 0 }))
    },
    dispose() {
      model.dispose()
    },
  }
}
