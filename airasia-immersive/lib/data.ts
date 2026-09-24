export interface Airport {
  code: string
  city: string
  name: string
  country: string
}

export const AIRPORTS: Airport[] = [
  { code: 'KUL', city: 'Kuala Lumpur', name: 'KL International', country: 'Malaysia' },
  { code: 'DMK', city: 'Bangkok', name: 'Don Mueang', country: 'Thailand' },
  { code: 'DPS', city: 'Bali', name: 'Ngurah Rai', country: 'Indonesia' },
  { code: 'SIN', city: 'Singapore', name: 'Changi', country: 'Singapore' },
  { code: 'BLR', city: 'Bengaluru', name: 'Kempegowda', country: 'India' },
  { code: 'DEL', city: 'New Delhi', name: 'Indira Gandhi', country: 'India' },
  { code: 'NRT', city: 'Tokyo', name: 'Narita', country: 'Japan' },
  { code: 'CGK', city: 'Jakarta', name: 'Soekarno-Hatta', country: 'Indonesia' },
  { code: 'MNL', city: 'Manila', name: 'Ninoy Aquino', country: 'Philippines' },
  { code: 'HKT', city: 'Phuket', name: 'Phuket International', country: 'Thailand' },
]

export type CabinClass = 'Economy' | 'Premium Flex' | 'Business Flatbed'

export const CABIN_CLASSES: { id: CabinClass; label: string; multiplier: number; blurb: string }[] = [
  { id: 'Economy', label: 'Economy', multiplier: 1, blurb: 'Low fare, carry-on only' },
  { id: 'Premium Flex', label: 'Premium Flex', multiplier: 1.85, blurb: 'Free changes + 20kg' },
  { id: 'Business Flatbed', label: 'Business Flatbed', multiplier: 3.4, blurb: 'Lie-flat + lounge' },
]

export interface FlightOption {
  id: string
  flightNo: string
  depart: string
  arrive: string
  durationMins: number
  aircraft: string
  baseFare: number
  seatsLeft: number
  onTimeRate: number
}

/**
 * Deterministic pseudo-random generator keyed on the route and date, so the
 * fare matrix stays stable between renders and matches on the server and client.
 */
function seeded(key: string): () => number {
  let h = 2166136261
  for (let i = 0; i < key.length; i += 1) {
    h ^= key.charCodeAt(i)
    h = Math.imul(h, 16777619)
  }
  return () => {
    h += 0x6d2b79f5
    let t = h
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

const AIRCRAFT = ['Airbus A320neo', 'Airbus A321neo', 'Airbus A330-900neo']

export function buildFareMatrix(
  origin: string,
  destination: string,
  date: string,
  cabin: CabinClass,
): FlightOption[] {
  if (origin === destination) {
    return []
  }
  const rand = seeded(`${origin}-${destination}-${date}-${cabin}`)
  const multiplier = CABIN_CLASSES.find((c) => c.id === cabin)?.multiplier ?? 1
  const departures = [6.25, 9.75, 13.5, 17.25, 21.0]

  return departures.map((hour, index) => {
    const durationMins = Math.round(115 + rand() * 210)
    const fare = Math.round((1800 + rand() * 3600) * multiplier)
    return {
      id: `${origin}${destination}-${index}`,
      flightNo: `AK ${Math.floor(rand() * 800 + 100)}`,
      depart: formatClock(hour),
      arrive: formatClock(hour + durationMins / 60),
      durationMins,
      aircraft: AIRCRAFT[Math.floor(rand() * AIRCRAFT.length)],
      baseFare: fare,
      seatsLeft: Math.floor(rand() * 28) + 2,
      onTimeRate: Math.round(72 + rand() * 26),
    }
  })
}

function formatClock(hour: number): string {
  const total = Math.round(hour * 60) % (24 * 60)
  const h = Math.floor(total / 60)
  const m = total % 60
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`
}

export interface Meal {
  name: string
  price: number
  tag: string
  description: string
}

export const SANTAN_MENU: Meal[] = [
  {
    name: "Pak Nasser's Nasi Lemak",
    price: 250,
    tag: 'Bestseller',
    description: 'Coconut rice, sambal, anchovies, egg and rendang chicken.',
  },
  {
    name: "Uncle Chin's Chicken Rice",
    price: 250,
    tag: 'Classic',
    description: 'Hainanese poached chicken with ginger rice and chilli sauce.',
  },
  {
    name: 'Santan Roasted Chicken Sandwich',
    price: 180,
    tag: 'Light bite',
    description: 'Herb-roasted chicken, slaw and aioli on a soft brioche roll.',
  },
  {
    name: 'Crispy Tofu Rice Bowl',
    price: 210,
    tag: 'Plant based',
    description: 'Turmeric rice, sambal tofu, pickled cucumber and peanuts.',
  },
  {
    name: 'Hot Cup Noodles & Kopi',
    price: 140,
    tag: 'Combo',
    description: 'Spicy prawn noodles paired with traditional Malaysian kopi.',
  },
  {
    name: 'Chocolate Lava Pudding',
    price: 120,
    tag: 'Dessert',
    description: 'Warm molten chocolate pudding served with vanilla cream.',
  },
]

export interface BaggageOption {
  id: string
  label: string
  weightKg: number
  price: number
}

export const BAGGAGE_OPTIONS: BaggageOption[] = [
  { id: 'bag-20', label: 'Checked bag', weightKg: 20, price: 1450 },
  { id: 'bag-25', label: 'Checked bag', weightKg: 25, price: 1890 },
  { id: 'bag-32', label: 'Checked bag', weightKg: 32, price: 2650 },
]

export interface InsuranceOption {
  id: string
  label: string
  price: number
  cover: string
}

export const INSURANCE_OPTIONS: InsuranceOption[] = [
  { id: 'ins-basic', label: 'Travel Essential', price: 499, cover: 'Delay, loss and medical up to ₹2L' },
  { id: 'ins-plus', label: 'Travel Plus', price: 1099, cover: 'Everything in Essential, cover up to ₹10L' },
]

export type BundleId = 'value_pack' | 'red_carpet' | 'extra_baggage'

export interface AncillaryBundle {
  id: BundleId
  name: string
  price: number
  description: string
}

export const ANCILLARY_BUNDLES: AncillaryBundle[] = [
  {
    id: 'value_pack',
    name: 'Value Pack',
    price: 1499,
    description: 'Standard seat, 20kg checked bag and one Santan meal, bundled at a saver price.',
  },
  {
    id: 'red_carpet',
    name: 'Red Carpet',
    price: 2999,
    description: 'Priority check-in and boarding, lounge access and express baggage on arrival.',
  },
  {
    id: 'extra_baggage',
    name: 'Extra Baggage',
    price: 1899,
    description: 'A flat-rate 25kg of extra hold weight on top of whatever you already carry.',
  },
]

export interface DutyFreeItem {
  id: string
  name: string
  category: string
  price: number
}

export const DUTY_FREE_ITEMS: DutyFreeItem[] = [
  { id: 'df-choc', name: 'Ferrero Rocher T24', category: 'Chocolates', price: 899 },
  { id: 'df-tea', name: 'TWG Singapore Breakfast Tea', category: 'Gourmet', price: 1150 },
  { id: 'df-model', name: 'AirAsia A320neo Diecast Model', category: 'Collectibles', price: 1299 },
  { id: 'df-whisky', name: 'Jim Beam Black 1L', category: 'Spirits', price: 2450 },
  { id: 'df-shades', name: 'Ray-Ban Aviator Classic', category: 'Accessories', price: 6499 },
  { id: 'df-perfume', name: 'Chanel N°5 EDP 50ml', category: 'Fragrance', price: 7999 },
]

/** Flat hotel add-on bundled into a SNAP (flight + hotel) booking. */
export const SNAP_HOTEL_PRICE = 6500

export type TierId = 'Red' | 'Gold' | 'Platinum' | 'Black'

export interface Tier {
  id: TierId
  threshold: number
  earnRate: number
  perks: string[]
  accent: string
}

export const TIERS: Tier[] = [
  {
    id: 'Red',
    threshold: 0,
    earnRate: 1,
    perks: ['1x points on every fare', 'Member-only seat sales'],
    accent: 'bg-aa-red text-white',
  },
  {
    id: 'Gold',
    threshold: 20000,
    earnRate: 3,
    perks: ['3x points', 'Priority boarding', '1 free seat change'],
    accent: 'bg-yellow-400 text-neutral-900',
  },
  {
    id: 'Platinum',
    threshold: 60000,
    earnRate: 6,
    perks: ['6x points', 'Lounge access', 'Free 20kg baggage'],
    accent: 'bg-slate-200 text-neutral-900',
  },
  {
    id: 'Black',
    threshold: 120000,
    earnRate: 10,
    perks: ['10x points', 'Guaranteed upgrades', 'Dedicated Allstar concierge'],
    accent: 'bg-neutral-900 text-white ring-1 ring-white/30',
  },
]

export function tierFor(points: number): Tier {
  return [...TIERS].reverse().find((t) => points >= t.threshold) ?? TIERS[0]
}

export function nextTierFor(points: number): Tier | null {
  return TIERS.find((t) => t.threshold > points) ?? null
}

export interface Job {
  id: string
  title: string
  team: 'Flight Operations' | 'Digital & MOVE' | 'In-Flight Services' | 'Ground Operations' | 'Commercial'
  location: string
  type: 'Full time' | 'Contract'
  summary: string
}

export const JOBS: Job[] = [
  {
    id: 'job-1',
    title: 'A320 First Officer',
    team: 'Flight Operations',
    location: 'Kuala Lumpur, MY',
    type: 'Full time',
    summary: 'Operate narrow-body sectors across the ASEAN network with 900+ hours jet time.',
  },
  {
    id: 'job-2',
    title: 'Full Stack WebGL Engineer',
    team: 'Digital & MOVE',
    location: 'Bengaluru, IN · Remote',
    type: 'Full time',
    summary: 'Build the 3D seat picker and real-time fare surfaces powering airasia MOVE.',
  },
  {
    id: 'job-3',
    title: 'Cabin Crew Executive',
    team: 'In-Flight Services',
    location: 'Bangkok, TH',
    type: 'Full time',
    summary: 'Deliver the Allstars service standard and lead Santan onboard retail.',
  },
  {
    id: 'job-4',
    title: 'Ramp Operations Supervisor',
    team: 'Ground Operations',
    location: 'Denpasar, ID',
    type: 'Full time',
    summary: 'Own turnaround times, loading accuracy and airside safety compliance.',
  },
  {
    id: 'job-5',
    title: 'Revenue Management Analyst',
    team: 'Commercial',
    location: 'Kuala Lumpur, MY',
    type: 'Full time',
    summary: 'Model demand curves and set dynamic fare ladders across 130+ routes.',
  },
  {
    id: 'job-6',
    title: 'Design Systems Engineer',
    team: 'Digital & MOVE',
    location: 'Singapore, SG · Hybrid',
    type: 'Contract',
    summary: 'Scale the shared component library across web, iOS and Android surfaces.',
  },
  {
    id: 'job-7',
    title: 'Line Maintenance Technician',
    team: 'Ground Operations',
    location: 'Manila, PH',
    type: 'Full time',
    summary: 'Certify A320neo line checks and manage AOG response within the hub.',
  },
]

export const JOB_TEAMS = [
  'All teams',
  'Flight Operations',
  'Digital & MOVE',
  'In-Flight Services',
  'Ground Operations',
  'Commercial',
] as const

export function formatINR(value: number): string {
  return `₹${Math.round(value).toLocaleString('en-IN')}`
}
