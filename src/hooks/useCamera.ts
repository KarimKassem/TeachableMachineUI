import { useCallback, useEffect, useRef, useState } from 'react'

export type CameraStatus = 'idle' | 'starting' | 'running' | 'error'

export function useCamera() {
  const videoRef = useRef<HTMLVideoElement>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const [status, setStatus] = useState<CameraStatus>('idle')
  const [error, setError] = useState<string | null>(null)
  const [devices, setDevices] = useState<MediaDeviceInfo[]>([])
  const [deviceId, setDeviceId] = useState<string>('')

  const refreshDevices = useCallback(async () => {
    try {
      const all = await navigator.mediaDevices.enumerateDevices()
      setDevices(all.filter((d) => d.kind === 'videoinput'))
    } catch {
      /* ignorato */
    }
  }, [])

  const stop = useCallback(() => {
    streamRef.current?.getTracks().forEach((t) => t.stop())
    streamRef.current = null
    if (videoRef.current) videoRef.current.srcObject = null
    setStatus('idle')
  }, [])

  const start = useCallback(
    async (id?: string) => {
      stop()
      setStatus('starting')
      setError(null)
      try {
        const video: MediaTrackConstraints = id
          ? { deviceId: { exact: id }, width: { ideal: 640 }, height: { ideal: 480 } }
          : { facingMode: 'user', width: { ideal: 640 }, height: { ideal: 480 } }
        const stream = await navigator.mediaDevices.getUserMedia({ video, audio: false })
        streamRef.current = stream
        const el = videoRef.current
        if (!el) throw new Error('Elemento video non pronto')
        el.srcObject = stream
        await el.play()
        setStatus('running')
        await refreshDevices()
        const settings = stream.getVideoTracks()[0]?.getSettings()
        if (settings?.deviceId) setDeviceId(settings.deviceId)
      } catch (err) {
        setStatus('error')
        const e = err as Error
        setError(
          e.name === 'NotAllowedError'
            ? 'Permesso webcam negato. Consentilo dalla barra degli indirizzi.'
            : e.name === 'NotFoundError'
              ? 'Nessuna webcam trovata.'
              : e.message,
        )
      }
    },
    [stop, refreshDevices],
  )

  useEffect(() => () => stop(), [stop])

  return { videoRef, status, error, devices, deviceId, start, stop, setDeviceId }
}
