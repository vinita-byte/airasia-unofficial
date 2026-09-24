import {
  motion,
  useSpring,
  useTransform,
  type MotionValue,
} from 'framer-motion'
import { useEffect, type RefObject } from 'react'
import { MorphText } from './MorphText.tsx'

export interface AirplaneWindowProps {
  /** Smoothed blind position: 0 closed, 1 fully open. */
  open: MotionValue<number>
  canvasRef: RefObject<HTMLCanvasElement | null>
  title: string
  caption: string
  webglFailed: boolean
}

export function AirplaneWindow({
  open,
  canvasRef,
  title,
  caption,
  webglFailed,
}: AirplaneWindowProps) {
  const shadeY = useTransform(open, (v) => `${-v * 104}%`)
  const textOpacity = useTransform(open, [0.25, 0.6], [0, 1])

  // Subtle parallax: the scene leans a little against the mouse.
  const parallaxX = useSpring(0, { stiffness: 60, damping: 18 })
  const parallaxY = useSpring(0, { stiffness: 60, damping: 18 })

  useEffect(() => {
    const onMove = (event: MouseEvent) => {
      parallaxX.set((event.clientX / window.innerWidth - 0.5) * -10)
      parallaxY.set((event.clientY / window.innerHeight - 0.5) * -7)
    }
    window.addEventListener('mousemove', onMove)
    return () => window.removeEventListener('mousemove', onMove)
  }, [parallaxX, parallaxY])

  return (
    // Mobile is height-driven in dynamic viewport units (capped at 55dvh and
    // by its flex row, so browser chrome never clips it); md+ is width-driven.
    <div
      className="relative h-[min(55dvh,116vw)] max-h-full max-w-full md:h-auto md:w-[min(50dvh,80vw)]"
      style={{ aspectRatio: '0.69' }}
    >
      {/* Recessed bezel: the cut-out the window sits down inside, lit from
          the glass outward so the floor of the recess brightens inward. */}
      <div
        className="absolute -inset-[5.5%] rounded-[50%]"
        style={{
          background:
            'radial-gradient(closest-side, #e2ded7 58%, #c6c1b8 82%, #a8a39a 100%)',
          boxShadow: [
            'inset 0 11px 20px rgba(28,25,20,0.42)',
            'inset 0 -7px 16px rgba(28,25,20,0.28)',
            'inset 5px 0 14px rgba(28,25,20,0.18)',
            'inset -5px 0 14px rgba(28,25,20,0.18)',
            '0 1px 0 rgba(255,255,255,0.4)',
            '0 18px 38px rgba(0,0,0,0.4)',
          ].join(', '),
        }}
      />

      {/* Padded surround, bevelled in toward the glass. */}
      <div
        className="absolute inset-0 rounded-[50%] bg-[#efede6]"
        style={{
          boxShadow:
            'inset 0 8px 16px rgba(255,255,255,0.75), inset 0 -12px 22px rgba(148,142,128,0.55), 0 2px 5px rgba(34,30,24,0.4), 0 10px 26px rgba(0,0,0,0.42)',
        }}
      />

      {/* Breather hole, bottom of the frame. */}
      <div className="absolute inset-x-0 bottom-[2.4%] flex justify-center">
        <div
          className="h-[7px] w-[7px] rounded-full"
          style={{
            background:
              'radial-gradient(circle at 50% 32%, #2b2723 0%, #0c0b0a 70%)',
            boxShadow:
              'inset 0 1px 2px rgba(0,0,0,0.9), 0 1px 0 rgba(255,255,255,0.55)',
          }}
        />
      </div>

      {/* Window mask: everything outside is clipped. */}
      <div className="absolute inset-[9%] overflow-hidden rounded-[50%] bg-[#0c1622]">
        <motion.div
          className="absolute -inset-[4%]"
          style={{ x: parallaxX, y: parallaxY }}
        >
          <canvas ref={canvasRef} className="block h-full w-full" />
        </motion.div>

        {webglFailed && (
          <div className="absolute inset-0 grid place-items-center bg-[#0c1622] p-6 text-center">
            <p className="text-xs uppercase tracking-[0.14em] text-[#d7d4cc]">
              This view needs WebGL — try a browser with hardware acceleration
              turned on.
            </p>
          </div>
        )}

        {/* Through-the-glass typography, dissolves as the blind closes. */}
        <motion.div
          className="pointer-events-none absolute inset-x-0 bottom-[12%] px-[12%] text-center"
          style={{ opacity: textOpacity }}
        >
          <p className="font-display text-[clamp(1.4rem,4.6vh,2.6rem)] font-light leading-tight text-white [text-shadow:0_2px_18px_rgba(0,0,0,0.55)]">
            <MorphText text={title} />
          </p>
          <p className="mt-1 text-[10px] font-medium uppercase tracking-[0.22em] text-white/70">
            <MorphText text={caption} />
          </p>
        </motion.div>

        {/* The sliding blind. */}
        <motion.div className="absolute inset-0" style={{ y: shadeY }}>
          <div
            className="absolute inset-0"
            style={{
              background:
                'repeating-linear-gradient(180deg, #d3ccbd 0px, #d3ccbd 14px, #c6bfb0 15px, #cdc6b7 16px)',
              boxShadow:
                'inset 0 10px 18px rgba(255,255,255,0.4), inset 0 -6px 12px rgba(96,88,72,0.45)',
            }}
          />
          {/* Drop shadow cast onto the scene from the blind's bottom edge. */}
          <div
            className="absolute inset-x-0 top-full h-10"
            style={{
              background:
                'linear-gradient(180deg, rgba(20,16,8,0.5), rgba(20,16,8,0))',
            }}
          />
          {/* Pull handle. */}
          <div className="absolute inset-x-0 bottom-[4.5%] flex justify-center">
            <div
              className="h-[10px] w-[34%] rounded-full bg-[#a49c8a]"
              style={{
                boxShadow:
                  'inset 0 2px 2px rgba(255,255,255,0.5), inset 0 -2px 3px rgba(70,63,50,0.6), 0 2px 6px rgba(0,0,0,0.35)',
              }}
            >
              <div className="mx-auto mt-[3px] h-[4px] w-[26%] rounded-full bg-[#7c745f]" />
            </div>
          </div>
        </motion.div>

        {/* Glass glare + deep bevel, always on top inside the mask. */}
        <div
          className="pointer-events-none absolute inset-0 rounded-[50%]"
          style={{
            background:
              'linear-gradient(115deg, rgba(255,255,255,0.26) 0%, rgba(255,255,255,0.06) 24%, rgba(255,255,255,0) 38%, rgba(255,255,255,0) 58%, rgba(255,255,255,0.1) 72%, rgba(255,255,255,0) 86%)',
            boxShadow:
              'inset 0 14px 34px rgba(6,10,16,0.6), inset 0 -10px 26px rgba(6,10,16,0.45), inset 6px 0 18px rgba(6,10,16,0.3), inset -6px 0 18px rgba(6,10,16,0.3)',
          }}
        />
      </div>
    </div>
  )
}
