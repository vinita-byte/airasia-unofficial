import { useEffect, useRef, useState } from 'react'

const SCRAMBLE_CHARS = 'ABEHKMNORSTX#·0123456789'
const FRAMES = 26
const FRAME_MS = 38

/**
 * Letter-by-letter scramble/dissolve: when `text` changes, characters flicker
 * through glyph noise and resolve left to right into the new title.
 */
export function MorphText({
  text,
  className,
}: {
  text: string
  className?: string
}) {
  const [display, setDisplay] = useState(text)
  const previousRef = useRef(text)

  useEffect(() => {
    const from = previousRef.current
    if (from === text) {
      return
    }
    previousRef.current = text

    const length = Math.max(from.length, text.length)
    let frame = 0

    const timer = window.setInterval(() => {
      frame += 1
      const progress = frame / FRAMES

      let out = ''
      for (let i = 0; i < length; i += 1) {
        const revealPoint = (i / length) * 0.75 + 0.2
        if (progress >= revealPoint) {
          out += text[i] ?? ''
        } else if (Math.random() < 0.3) {
          out += SCRAMBLE_CHARS[Math.floor(Math.random() * SCRAMBLE_CHARS.length)]
        } else {
          out += from[i] ?? text[i] ?? ''
        }
      }
      setDisplay(out)

      if (frame >= FRAMES) {
        window.clearInterval(timer)
        setDisplay(text)
      }
    }, FRAME_MS)

    return () => window.clearInterval(timer)
  }, [text])

  return <span className={className}>{display}</span>
}
