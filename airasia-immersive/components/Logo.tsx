import Image from 'next/image'
import roundel from '@/public/airasia-roundel.png'
import wordmark from '@/public/airasia-wordmark.png'

interface LogoProps {
  /**
   * `roundel` is the circular brand mark and the site's identity — use it in
   * chrome (header, footer, checkout). `white` is the bare script wordmark for
   * large display on dark surfaces.
   */
  variant?: 'roundel' | 'white'
  className?: string
  priority?: boolean
}

export default function Logo({
  variant = 'roundel',
  className,
  priority = false,
}: LogoProps) {
  if (variant === 'white') {
    return (
      <Image
        src={wordmark}
        alt="AirAsia"
        priority={priority}
        className={`${className ?? 'h-5 sm:h-6'} w-auto`}
        sizes="(max-width: 640px) 120px, 180px"
      />
    )
  }

  return (
    <Image
      src={roundel}
      alt="AirAsia"
      priority={priority}
      className={`${className ?? 'h-10 sm:h-11'} w-auto`}
      sizes="(max-width: 640px) 40px, 44px"
    />
  )
}
