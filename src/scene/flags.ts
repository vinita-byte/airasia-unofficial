/**
 * Country flags drawn on canvas, used as tail-fin textures on the apron
 * and as small badges in the hover card and window label.
 */
export type FlagId = 'sg' | 'ae' | 'jp' | 'gr' | 'my' | 'th' | 'id' | 'mv'

const W = 300
const H = 200

type Ctx = CanvasRenderingContext2D

function star(
  ctx: Ctx,
  cx: number,
  cy: number,
  spikes: number,
  outer: number,
  inner: number,
  color: string,
) {
  ctx.fillStyle = color
  ctx.beginPath()
  for (let i = 0; i < spikes * 2; i += 1) {
    const r = i % 2 === 0 ? outer : inner
    const a = (Math.PI * i) / spikes - Math.PI / 2
    const x = cx + Math.cos(a) * r
    const y = cy + Math.sin(a) * r
    if (i === 0) {
      ctx.moveTo(x, y)
    } else {
      ctx.lineTo(x, y)
    }
  }
  ctx.closePath()
  ctx.fill()
}

/** A crescent: a disc with a second disc of the field colour biting into it. */
function crescent(
  ctx: Ctx,
  cx: number,
  cy: number,
  r: number,
  bite: number,
  color: string,
  field: string,
) {
  ctx.fillStyle = color
  ctx.beginPath()
  ctx.arc(cx, cy, r, 0, Math.PI * 2)
  ctx.fill()
  ctx.fillStyle = field
  ctx.beginPath()
  ctx.arc(cx + bite, cy, r * 0.86, 0, Math.PI * 2)
  ctx.fill()
}

const PAINTERS: Record<FlagId, (ctx: Ctx) => void> = {
  jp(ctx) {
    ctx.fillStyle = '#ffffff'
    ctx.fillRect(0, 0, W, H)
    ctx.fillStyle = '#bc002d'
    ctx.beginPath()
    ctx.arc(W / 2, H / 2, H * 0.3, 0, Math.PI * 2)
    ctx.fill()
  },
  id(ctx) {
    ctx.fillStyle = '#d0342c'
    ctx.fillRect(0, 0, W, H / 2)
    ctx.fillStyle = '#ffffff'
    ctx.fillRect(0, H / 2, W, H / 2)
  },
  th(ctx) {
    const s = H / 6
    ctx.fillStyle = '#a51931'
    ctx.fillRect(0, 0, W, H)
    ctx.fillStyle = '#f4f5f8'
    ctx.fillRect(0, s, W, s)
    ctx.fillRect(0, s * 4, W, s)
    ctx.fillStyle = '#2d2a4a'
    ctx.fillRect(0, s * 2, W, s * 2)
  },
  ae(ctx) {
    const band = W / 4
    ctx.fillStyle = '#00843d'
    ctx.fillRect(band, 0, W - band, H / 3)
    ctx.fillStyle = '#ffffff'
    ctx.fillRect(band, H / 3, W - band, H / 3)
    ctx.fillStyle = '#1a1a1a'
    ctx.fillRect(band, (H / 3) * 2, W - band, H / 3)
    ctx.fillStyle = '#ce1126'
    ctx.fillRect(0, 0, band, H)
  },
  sg(ctx) {
    ctx.fillStyle = '#ee2536'
    ctx.fillRect(0, 0, W, H / 2)
    ctx.fillStyle = '#ffffff'
    ctx.fillRect(0, H / 2, W, H / 2)
    crescent(ctx, 66, 50, 34, 13, '#ffffff', '#ee2536')
    const ring: Array<[number, number]> = [
      [104, 30],
      [88, 44],
      [120, 44],
      [94, 62],
      [114, 62],
    ]
    for (const [x, y] of ring) {
      star(ctx, x, y, 5, 7.5, 3.2, '#ffffff')
    }
  },
  my(ctx) {
    const s = H / 14
    for (let i = 0; i < 14; i += 1) {
      ctx.fillStyle = i % 2 === 0 ? '#cc0001' : '#ffffff'
      ctx.fillRect(0, i * s, W, s + 0.5)
    }
    ctx.fillStyle = '#010066'
    ctx.fillRect(0, 0, W / 2, s * 8)
    crescent(ctx, 52, 57, 30, 12, '#ffcc00', '#010066')
    star(ctx, 100, 57, 14, 28, 15, '#ffcc00')
  },
  mv(ctx) {
    ctx.fillStyle = '#d21034'
    ctx.fillRect(0, 0, W, H)
    ctx.fillStyle = '#007e3a'
    ctx.fillRect(W * 0.25, H * 0.25, W * 0.5, H * 0.5)
    crescent(ctx, W * 0.52, H * 0.5, H * 0.19, H * 0.07, '#ffffff', '#007e3a')
  },
  gr(ctx) {
    const s = H / 9
    for (let i = 0; i < 9; i += 1) {
      ctx.fillStyle = i % 2 === 0 ? '#0d5eaf' : '#ffffff'
      ctx.fillRect(0, i * s, W, s + 0.5)
    }
    const c = s * 5
    ctx.fillStyle = '#0d5eaf'
    ctx.fillRect(0, 0, c, c)
    ctx.fillStyle = '#ffffff'
    ctx.fillRect(0, c / 2 - s / 2, c, s)
    ctx.fillRect(c / 2 - s / 2, 0, s, c)
  },
}

export function flagCanvas(id: FlagId, scale = 1): HTMLCanvasElement {
  const canvas = document.createElement('canvas')
  canvas.width = W * scale
  canvas.height = H * scale
  const ctx = canvas.getContext('2d')
  if (!ctx) {
    throw new Error('Could not create a 2D canvas for the flag.')
  }
  ctx.scale(scale, scale)
  PAINTERS[id](ctx)
  return canvas
}

const urlCache = new Map<FlagId, string>()

export function flagDataUrl(id: FlagId): string {
  let url = urlCache.get(id)
  if (!url) {
    url = flagCanvas(id).toDataURL('image/png')
    urlCache.set(id, url)
  }
  return url
}
