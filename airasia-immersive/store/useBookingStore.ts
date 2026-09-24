import { create } from 'zustand'
import {
  type AncillaryBundle,
  type CabinClass,
  type DutyFreeItem,
  type FlightOption,
  SNAP_HOTEL_PRICE,
  TIERS,
  tierFor,
} from '@/lib/data'

export type { AncillaryBundle, DutyFreeItem }

export type ProductTab = 'flights' | 'snap' | 'hotels' | 'dutyfree' | 'transfers'
export type TripType = 'round' | 'one-way'

export type SeatType = 'Standard' | 'Hot Seat' | 'Premium Flatbed'

export interface Seat {
  id: string
  type: SeatType
  price: number
}

export interface MealSelection {
  name: string
  price: number
}

export interface BaggageSelection {
  id: string
  weightKg: number
  price: number
}

export interface InsuranceSelection {
  id: string
  label: string
  price: number
}

export interface BookingState {
  /** Which product surface is active. SNAP bundles a hotel into the trip. */
  activeTab: ProductTab
  tripType: TripType

  origin: string
  destination: string
  date: string
  cabin: CabinClass
  passengers: number

  selectedFlight: FlightOption | null
  selectedSeats: Seat[]
  selectedMeals: MealSelection[]
  baggage: BaggageSelection | null
  insurance: InsuranceSelection | null
  selectedBundle: AncillaryBundle | null
  dutyFreeCart: DutyFreeItem[]

  /** Lifetime points on the demo member account. */
  memberPoints: number
  /** Points the member has chosen to burn against this booking. */
  pointsToRedeem: number

  setActiveTab: (tab: ProductTab) => void
  setTripType: (type: TripType) => void
  setRoute: (patch: Partial<Pick<BookingState, 'origin' | 'destination' | 'date' | 'cabin' | 'passengers'>>) => void
  swapRoute: () => void
  selectFlight: (flight: FlightOption | null) => void
  addSeat: (seat: Seat) => void
  removeSeat: (seatId: string) => void
  toggleMeal: (meal: MealSelection) => void
  setBaggage: (baggage: BaggageSelection | null) => void
  setInsurance: (insurance: InsuranceSelection | null) => void
  setBundle: (bundle: AncillaryBundle | null) => void
  addDutyFreeItem: (item: DutyFreeItem) => void
  removeDutyFreeItem: (itemId: string) => void
  setPointsToRedeem: (points: number) => void
  reset: () => void

  getFlightPrice: () => number
  getTotalAmount: () => number
}

/** 1 point burns for ₹0.25 against the fare. */
export const POINT_VALUE = 0.25

export const useBookingStore = create<BookingState>((set, get) => ({
  activeTab: 'flights',
  tripType: 'round',

  origin: 'KUL',
  destination: 'DMK',
  date: '2026-10-15',
  cabin: 'Economy',
  passengers: 1,

  selectedFlight: null,
  selectedSeats: [],
  selectedMeals: [],
  baggage: null,
  insurance: null,
  selectedBundle: null,
  dutyFreeCart: [],

  memberPoints: 12450,
  pointsToRedeem: 0,

  setActiveTab: (tab) => set({ activeTab: tab }),

  setTripType: (tripType) => set({ tripType }),

  setRoute: (patch) =>
    set((s) => {
      const next = { ...s, ...patch }
      // Changing the route invalidates the fare and anything priced against it.
      const routeChanged =
        next.origin !== s.origin ||
        next.destination !== s.destination ||
        next.date !== s.date ||
        next.cabin !== s.cabin
      return routeChanged
        ? { ...patch, selectedFlight: null, selectedSeats: [] }
        : patch
    }),

  swapRoute: () => set((s) => ({
    origin: s.destination,
    destination: s.origin,
    selectedFlight: null,
    selectedSeats: [],
  })),

  selectFlight: (flight) => set({ selectedFlight: flight }),

  addSeat: (seat) =>
    set((s) =>
      s.selectedSeats.some((item) => item.id === seat.id)
        ? s
        : { selectedSeats: [...s.selectedSeats, seat] },
    ),

  removeSeat: (seatId) =>
    set((s) => ({ selectedSeats: s.selectedSeats.filter((item) => item.id !== seatId) })),

  toggleMeal: (meal) =>
    set((s) => {
      const exists = s.selectedMeals.some((m) => m.name === meal.name)
      return {
        selectedMeals: exists
          ? s.selectedMeals.filter((m) => m.name !== meal.name)
          : [...s.selectedMeals, meal],
      }
    }),

  setBaggage: (baggage) =>
    set((s) => ({ baggage: s.baggage?.id === baggage?.id ? null : baggage })),

  setInsurance: (insurance) =>
    set((s) => ({ insurance: s.insurance?.id === insurance?.id ? null : insurance })),

  setBundle: (bundle) =>
    set((s) => ({ selectedBundle: s.selectedBundle?.id === bundle?.id ? null : bundle })),

  addDutyFreeItem: (item) =>
    set((s) =>
      s.dutyFreeCart.some((i) => i.id === item.id)
        ? s
        : { dutyFreeCart: [...s.dutyFreeCart, item] },
    ),

  removeDutyFreeItem: (itemId) =>
    set((s) => ({ dutyFreeCart: s.dutyFreeCart.filter((i) => i.id !== itemId) })),

  setPointsToRedeem: (points) =>
    set((s) => ({
      pointsToRedeem: Math.max(0, Math.min(Math.round(points), s.memberPoints)),
    })),

  reset: () =>
    set({
      selectedFlight: null,
      selectedSeats: [],
      selectedMeals: [],
      baggage: null,
      insurance: null,
      selectedBundle: null,
      dutyFreeCart: [],
      pointsToRedeem: 0,
    }),

  getFlightPrice: () => selectFlightTotal(get()),

  getTotalAmount: () => selectTotal(get()),
}))

/** Fare across all guests; a round trip prices both legs. */
export function selectFlightTotal(s: BookingState): number {
  const legs = s.tripType === 'round' ? 2 : 1
  return (s.selectedFlight?.baseFare ?? 0) * s.passengers * legs
}

/** Booking on the SNAP tab bundles a hotel into the trip. */
export function selectHotelAddon(s: BookingState): number {
  return s.activeTab === 'snap' ? SNAP_HOTEL_PRICE : 0
}

export function selectSubtotal(s: BookingState): number {
  const seatTotal = s.selectedSeats.reduce((acc, seat) => acc + seat.price, 0)
  const mealTotal = s.selectedMeals.reduce((acc, meal) => acc + meal.price, 0)
  const dutyFreeTotal = s.dutyFreeCart.reduce((acc, item) => acc + item.price, 0)
  return (
    selectFlightTotal(s) +
    seatTotal +
    mealTotal +
    dutyFreeTotal +
    (s.baggage?.price ?? 0) +
    (s.insurance?.price ?? 0) +
    (s.selectedBundle?.price ?? 0) +
    selectHotelAddon(s)
  )
}

export function selectPointsDiscount(s: BookingState): number {
  // Points can never take the bill below zero.
  return Math.min(s.pointsToRedeem * POINT_VALUE, selectSubtotal(s))
}

export function selectTotal(s: BookingState): number {
  return Math.max(0, Math.round(selectSubtotal(s) - selectPointsDiscount(s)))
}

/** Points earned on this booking, at the member's current tier rate. */
export function selectPointsEarned(s: BookingState): number {
  const rate = tierFor(s.memberPoints).earnRate
  return Math.round((selectTotal(s) / 100) * rate * 10)
}

export function selectTierProgress(points: number): {
  current: (typeof TIERS)[number]
  next: (typeof TIERS)[number] | null
  progress: number
} {
  const current = tierFor(points)
  const next = TIERS.find((t) => t.threshold > points) ?? null
  const span = next ? next.threshold - current.threshold : 1
  const progress = next ? Math.min(1, (points - current.threshold) / span) : 1
  return { current, next, progress }
}
