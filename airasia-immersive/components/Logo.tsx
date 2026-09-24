import Image from 'next/image'
import wordmark from '@/public/airasia-wordmark.png'

interface LogoProps {
  /**
   * `lockup` sets the white wordmark on the brand red tile, for light surfaces.
   * `white` is the bare wordmark, for dark surfaces.
   */
  variant?: 'lockup' | 'white'
  className?: string
  priority?: boolean
}

export default function Logo({
  variant = 'lockup',
  className = 'h-5 sm:h-6',
  priority = false,
}: LogoProps) {
  const mark = (
    <Image
      src={wordmark}
      alt="AirAsia"
      priority={priority}
      className={`${className} w-auto`}
      sizes="(max-width: 640px) 120px, 180px"
    />
  )

  if (variant === 'white') {
    return mark
  }

  return (
    <span className="inline-flex items-center rounded-md bg-aa-red px-2.5 py-1.5">
      {mark}
    </span>
  )
}
