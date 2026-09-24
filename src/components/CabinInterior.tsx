/**
 * The cabin around the window: a moulded plastic sidewall lit by the window
 * itself, with the overhead bin above and the seat and armrest below. Purely
 * decorative, and deliberately behind every interactive layer.
 */
export function CabinInterior() {
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden">
      {/* Moulded panel, brightest at the glass and falling away to the edges. */}
      <div
        className="absolute inset-0"
        style={{
          background:
            'radial-gradient(64% 54% at 50% 50%, #eae7e1 0%, #ddd9d2 30%, #c3bfb7 54%, #918d86 76%, #4a4843 100%)',
        }}
      />

      {/* Panel seams every 60px: a shallow groove with a lift on either side. */}
      <div
        className="absolute inset-0"
        style={{
          background:
            'repeating-linear-gradient(90deg, rgba(255,255,255,0) 0px, rgba(255,255,255,0) 53px, rgba(255,255,255,0.07) 56px, rgba(35,30,24,0.17) 58px, rgba(35,30,24,0.17) 59px, rgba(255,255,255,0.06) 60px)',
        }}
      />

      {/* Overhead bin, curving away above the window. */}
      <div
        className="absolute -top-[46%] left-1/2 h-[66%] w-[200%] -translate-x-1/2 rounded-b-[50%]"
        style={{
          background:
            'linear-gradient(180deg, #b7b2a9 0%, #d9d5cd 58%, #cdc8bf 82%, #a19c93 94%, #7e7a72 100%)',
          boxShadow:
            '0 16px 34px rgba(24,21,17,0.38), inset 0 -2px 0 rgba(255,255,255,0.35)',
        }}
      />
      {/* The bin door's shut line. */}
      <div
        className="absolute -top-[44%] left-1/2 h-[66%] w-[196%] -translate-x-1/2 rounded-b-[50%]"
        style={{ boxShadow: 'inset 0 -2px 0 rgba(48,42,34,0.22)' }}
      />

      {/* Seat back and armrest, thrown out of focus for depth. */}
      <div
        className="absolute inset-x-0 bottom-0 h-[34%]"
        style={{ filter: 'blur(9px)' }}
      >
        <div
          className="absolute -bottom-[14%] -left-[6%] h-[132%] w-[44%] rounded-t-[64px]"
          style={{
            background:
              'linear-gradient(105deg, #2f3742 0%, #3c4552 44%, #262d37 100%)',
          }}
        />
        <div
          className="absolute -right-[8%] bottom-[6%] h-[22%] w-[52%] rounded-full"
          style={{
            background:
              'linear-gradient(180deg, #6a7280 0%, #444b56 52%, #232830 100%)',
          }}
        />
      </div>

      {/* Reading lights, off-screen to the left. */}
      <div
        className="absolute inset-0"
        style={{
          background:
            'radial-gradient(48% 64% at -10% 26%, rgba(255,193,124,0.32) 0%, rgba(255,178,102,0.13) 42%, rgba(255,170,90,0) 74%)',
        }}
      />

      <div
        className="absolute inset-0"
        style={{
          background:
            'radial-gradient(78% 72% at 50% 50%, rgba(0,0,0,0) 56%, rgba(0,0,0,0.46) 100%)',
        }}
      />
    </div>
  )
}
