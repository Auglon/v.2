import { useRef, useEffect } from "react"

export function useAudio(url: string) {
  const audio = useRef<HTMLAudioElement | null>(null)

  useEffect(() => {
    audio.current = new Audio(url)
  }, [url])

  const play = () => {
    if (audio.current) {
      audio.current.play()
    }
  }

  const pause = () => {
    if (audio.current) {
      audio.current.pause()
    }
  }

  return { play, pause }
}

