# AirAsia Unofficial

A fan-built concept of the modern AirAsia / AirAsia MOVE booking flow, built as a
single scrolling page: search live fares (round trip or one way), walk the cabin
in 3D and pick a seat, add Santan meals, baggage, travel protection, add-on
bundles and duty free, bundle a hotel with SNAP, burn reward points, then pay.

Not affiliated with or endorsed by AirAsia or Capital A. Fares, schedules, seat
availability and job postings are generated for demonstration only.

## Running locally

```bash
npm install
npm run dev
```

The dev server listens on <http://localhost:43591>.

```bash
npm run build && npm start   # production build
npm run lint                 # eslint
```

## What is in here

| Area | Where | Notes |
| --- | --- | --- |
| Product tabs | `components/ProductTabs.tsx` | Flights, SNAP (flight + hotel, adds a flat ₹6,500 to the trip), Hotels, Duty Free and Transfers surfaces |
| Flight & route engine | `components/FlightSearch.tsx`, `lib/data.ts` | 10 airports, 3 cabin classes, round trip / one way, deterministic fare matrix keyed on route + date so prices stay stable between renders |
| 3D cabin & seat picker | `components/CabinScene.tsx` | React Three Fiber: 12 rows, aisle, lit windows, hover readout, pre-sold seats |
| Ancillaries | `components/Ancillaries.tsx` | Santan menu, checked baggage tiers, travel protection, and Value Pack / Red Carpet / Extra Baggage bundles |
| Duty free | `components/DutyFreeShop.tsx` | Pre-order cart that settles in the same checkout as the fare |
| Rewards | `components/RewardsHub.tsx` | Red/Gold/Platinum/Black ladder plus an earn-and-burn calculator |
| Careers | `components/CareersPortal.tsx` | Filterable board with search, team filters and an empty state |
| Checkout | `components/PaymentModal.tsx`, `app/api/razorpay/` | Razorpay order creation and HMAC signature verification |
| State | `store/useBookingStore.ts` | Zustand store plus derived selectors for subtotal, discount and total |

## Payments

The checkout runs in **demo mode** out of the box: with no Razorpay keys set, the
API returns a mock order and the client simulates a successful confirmation, so
the whole flow is clickable without credentials.

To use a real Razorpay test account, create `.env.local`:

```bash
RAZORPAY_KEY_ID=rzp_test_xxxxxxxx
RAZORPAY_KEY_SECRET=xxxxxxxxxxxxxxxx
NEXT_PUBLIC_RAZORPAY_KEY_ID=rzp_test_xxxxxxxx
```

`app/api/razorpay/verify/route.ts` recomputes the HMAC over `order_id|payment_id`
and compares it in constant time — the client-side handler is never trusted on
its own.

## Notes

- Tailwind v4 is configured in CSS (`app/globals.css`), not a `tailwind.config.ts`.
  Brand colours are exposed as `aa-red`, `aa-crimson`, `aa-asphalt` and `aa-grey`.
- Zustand v5 requires `useShallow` for selectors that build a new object, or the
  store re-renders forever. `FlightSearch` shows the pattern.
- The 3D canvas is wrapped in an error boundary so browsers without WebGL get a
  readable message instead of a blank panel.
