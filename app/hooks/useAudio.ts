import { useRef, useEffect } from "react"

export function useAudio(src: string) {
  const audioRef = useRef<HTMLAudioElement | null>(null)

  useEffect(() => {
    audioRef.current = new Audio(src)
    audioRef.current.loop = true
    return () => {
      if (audioRef.current) {
        audioRef.current.pause()
        audioRef.current = null
      }
    }
  }, [src])

  const play = () => {
    if (audioRef.current && audioRef.current.paused) {
      audioRef.current.play().catch(() => {
        // Handle autoplay restrictions
        console.warn('Audio playback was prevented by the browser')
      })
    }
  }

  const stop = () => {
    if (audioRef.current && !audioRef.current.paused) {
      audioRef.current.pause()
      audioRef.current.currentTime = 0
    }
  }

  return { play, stop }
}

