'use client'

import { Canvas } from '@react-three/fiber'
import { OrbitControls, Text } from '@react-three/drei'
import React, { Component, useMemo, useState, type ReactNode } from 'react'
import * as THREE from 'three'
import { useBookingStore, type Seat, type SeatType } from '@/store/useBookingStore'
import { formatINR } from '@/lib/data'

const ROWS = 12
const COLUMNS = [
  { label: 'A', x: -1.85 },
  { label: 'B', x: -1.25 },
  { label: 'C', x: -0.65 },
  { label: 'D', x: 0.65 },
  { label: 'E', x: 1.25 },
  { label: 'F', x: 1.85 },
]
const ROW_PITCH = 1.05
const FIRST_ROW_Z = 2.6

const SEAT_STYLES: Record<SeatType, { price: number; color: string; legroom: string }> = {
  'Premium Flatbed': { price: 3200, color: '#3b1f2b', legroom: 'Lie-flat, 60in pitch' },
  'Hot Seat': { price: 999, color: '#ed1c24', legroom: 'Extra legroom, 34in pitch' },
  Standard: { price: 350, color: '#4b5563', legroom: 'Standard, 29in pitch' },
}

function seatTypeFor(row: number): SeatType {
  if (row <= 2) return 'Premium Flatbed'
  if (row <= 5) return 'Hot Seat'
  return 'Standard'
}

/** Stable "already sold" seats so the map looks like a real load factor. */
function isOccupied(row: number, column: string): boolean {
  const h = (row * 31 + column.charCodeAt(0) * 17) % 100
  return h < 26
}

interface SeatMeshProps {
  position: [number, number, number]
  id: string
  type: SeatType
  price: number
  occupied: boolean
  onInspect: (seat: (Seat & { occupied: boolean }) | null) => void
}

function SeatMesh({ position, id, type, price, occupied, onInspect }: SeatMeshProps) {
  const [hovered, setHovered] = useState(false)
  const selectedSeats = useBookingStore((s) => s.selectedSeats)
  const addSeat = useBookingStore((s) => s.addSeat)
  const removeSeat = useBookingStore((s) => s.removeSeat)
  const isSelected = selectedSeats.some((s) => s.id === id)

  const color = occupied
    ? '#26282d'
    : isSelected
      ? '#10b981'
      : hovered
        ? '#ff5757'
        : SEAT_STYLES[type].color

  const handleClick = (event: { stopPropagation: () => void }) => {
    event.stopPropagation()
    if (occupied) return
    if (isSelected) {
      removeSeat(id)
    } else {
      addSeat({ id, type, price })
    }
  }

  const enter = (event: { stopPropagation: () => void }) => {
    event.stopPropagation()
    setHovered(true)
    onInspect({ id, type, price, occupied })
    document.body.style.cursor = occupied ? 'not-allowed' : 'pointer'
  }

  const leave = () => {
    setHovered(false)
    onInspect(null)
    document.body.style.cursor = 'auto'
  }

  const lift = hovered && !occupied ? 0.08 : 0

  return (
    <group
      position={[position[0], position[1] + lift, position[2]]}
      onClick={handleClick}
      onPointerOver={enter}
      onPointerOut={leave}
    >
      {/* Seat pan */}
      <mesh castShadow receiveShadow position={[0, 0.06, 0]}>
        <boxGeometry args={[0.46, 0.12, 0.46]} />
        <meshStandardMaterial color={color} roughness={0.55} metalness={0.08} />
      </mesh>
      {/* Backrest */}
      <mesh castShadow position={[0, 0.34, -0.19]}>
        <boxGeometry args={[0.46, 0.46, 0.1]} />
        <meshStandardMaterial color={color} roughness={0.55} metalness={0.08} />
      </mesh>
      {/* Headrest */}
      <mesh castShadow position={[0, 0.62, -0.19]}>
        <boxGeometry args={[0.34, 0.14, 0.12]} />
        <meshStandardMaterial
          color={occupied ? '#1b1d21' : '#d8d8dc'}
          roughness={0.7}
        />
      </mesh>

      <Text
        position={[0, 0.02, 0.32]}
        rotation={[-Math.PI / 2, 0, 0]}
        fontSize={0.17}
        color={isSelected ? '#10b981' : occupied ? '#5b5f66' : '#ffffff'}
        anchorX="center"
        anchorY="middle"
      >
        {id}
      </Text>
    </group>
  )
}

function Fuselage() {
  const length = ROWS * ROW_PITCH + 5

  return (
    <group>
      {/* Cabin shell, rendered from the inside. */}
      <mesh rotation={[Math.PI / 2, 0, 0]} position={[0, 0.6, -length / 2 + FIRST_ROW_Z + 1.5]}>
        <cylinderGeometry args={[3.3, 3.3, length, 40, 1, true]} />
        <meshStandardMaterial color="#1f2126" side={THREE.BackSide} roughness={0.9} />
      </mesh>

      {/* Floor */}
      <mesh
        rotation={[-Math.PI / 2, 0, 0]}
        position={[0, -0.001, -length / 2 + FIRST_ROW_Z + 1.5]}
        receiveShadow
      >
        <planeGeometry args={[5.4, length]} />
        <meshStandardMaterial color="#141519" roughness={1} />
      </mesh>

      {/* Aisle runner */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.002, -length / 2 + FIRST_ROW_Z + 1.5]}>
        <planeGeometry args={[0.9, length]} />
        <meshStandardMaterial color="#2a2c33" roughness={1} />
      </mesh>

      {/* Cabin windows glowing along both walls. */}
      {Array.from({ length: ROWS }).map((_, i) => {
        const z = FIRST_ROW_Z - i * ROW_PITCH - ROW_PITCH / 2
        return (
          <group key={i}>
            {[-2.62, 2.62].map((x) => (
              <mesh key={x} position={[x, 1.15, z]} rotation={[0, 0, x < 0 ? 0.35 : -0.35]}>
                <boxGeometry args={[0.06, 0.34, 0.24]} />
                <meshStandardMaterial
                  color="#bfe3ff"
                  emissive="#8ec5ff"
                  emissiveIntensity={1.4}
                  toneMapped={false}
                />
              </mesh>
            ))}
          </group>
        )
      })}
    </group>
  )
}

interface HoverInfo extends Seat {
  occupied: boolean
}

class CanvasBoundary extends Component<{ children: ReactNode }, { failed: boolean }> {
  state = { failed: false }
  static getDerivedStateFromError() {
    return { failed: true }
  }
  render() {
    if (this.state.failed) {
      return (
        <div className="flex h-full items-center justify-center p-8 text-center">
          <p className="max-w-sm text-sm text-neutral-400">
            The 3D cabin needs WebGL. Turn on hardware acceleration, or use the seat
            list below to pick your seat.
          </p>
        </div>
      )
    }
    return this.props.children
  }
}

export default function CabinScene() {
  const [hover, setHover] = useState<HoverInfo | null>(null)
  const selectedSeats = useBookingStore((s) => s.selectedSeats)
  const removeSeat = useBookingStore((s) => s.removeSeat)

  const seats = useMemo(
    () =>
      Array.from({ length: ROWS }, (_, rIdx) => rIdx + 1).flatMap((row) =>
        COLUMNS.map((col) => {
          const type = seatTypeFor(row)
          return {
            key: `${row}${col.label}`,
            type,
            price: SEAT_STYLES[type].price,
            occupied: isOccupied(row, col.label),
            position: [col.x, 0, FIRST_ROW_Z - (row - 1) * ROW_PITCH] as [number, number, number],
          }
        }),
      ),
    [],
  )

  return (
    <div className="relative h-[420px] overflow-hidden rounded-2xl border border-neutral-800 bg-neutral-950 shadow-2xl sm:h-[520px]">
      {/* Legend */}
      <div className="pointer-events-none absolute top-4 left-4 z-10 space-y-1.5 rounded-lg border border-white/10 bg-black/65 p-3 text-[11px] text-white backdrop-blur-md">
        <p className="font-bold tracking-wider text-neutral-400 uppercase">
          Interactive 3D cabin
        </p>
        <Swatch color="#3b1f2b" label={`Premium Flatbed · ${formatINR(3200)}`} />
        <Swatch color="#ed1c24" label={`Hot Seat · ${formatINR(999)}`} />
        <Swatch color="#4b5563" label={`Standard · ${formatINR(350)}`} />
        <Swatch color="#10b981" label="Your selection" />
        <Swatch color="#26282d" label="Already taken" />
      </div>

      {/* Hover readout */}
      <div className="pointer-events-none absolute top-4 right-4 z-10 min-w-[150px] rounded-lg border border-white/10 bg-black/65 p-3 text-right text-[11px] text-white backdrop-blur-md">
        {hover ? (
          <>
            <p className="text-lg leading-none font-black">{hover.id}</p>
            <p className="mt-1 text-neutral-300">{hover.type}</p>
            <p className="text-neutral-500">{SEAT_STYLES[hover.type].legroom}</p>
            <p className="mt-1 font-bold text-aa-red">
              {hover.occupied ? 'Unavailable' : formatINR(hover.price)}
            </p>
          </>
        ) : (
          <p className="text-neutral-400">
            Drag to orbit · scroll to zoom
            <br />
            Hover a seat for details
          </p>
        )}
      </div>

      {/* Selected seats, also the keyboard-accessible way to deselect. */}
      <div className="absolute right-4 bottom-4 left-4 z-10 flex flex-wrap items-center gap-2">
        {selectedSeats.length === 0 ? (
          <p className="rounded-lg border border-white/10 bg-black/65 px-3 py-2 text-[11px] text-neutral-400 backdrop-blur-md">
            No seat chosen yet — click any lit seat in the cabin.
          </p>
        ) : (
          selectedSeats.map((seat) => (
            <button
              key={seat.id}
              onClick={() => removeSeat(seat.id)}
              className="rounded-lg border border-emerald-500/40 bg-emerald-500/15 px-3 py-2 text-[11px] font-bold text-emerald-300 backdrop-blur-md transition-colors hover:bg-emerald-500/25"
            >
              {seat.id} · {formatINR(seat.price)} <span className="opacity-60">✕</span>
            </button>
          ))
        )}
      </div>

      <CanvasBoundary>
        <Canvas shadows camera={{ position: [0, 5.2, 7.5], fov: 45 }} dpr={[1, 2]}>
          <color attach="background" args={['#08090b']} />
          <fog attach="fog" args={['#08090b', 14, 30]} />

          <ambientLight intensity={0.55} />
          <hemisphereLight args={['#cfe6ff', '#1a1a1a', 0.5]} />
          <directionalLight
            position={[6, 12, 6]}
            intensity={1.3}
            castShadow
            shadow-mapSize={[1024, 1024]}
          />
          <pointLight position={[0, 2.4, -2]} intensity={18} distance={14} color="#ff8f92" />

          <Fuselage />

          {seats.map((seat) => (
            <SeatMesh
              key={seat.key}
              id={seat.key}
              type={seat.type}
              price={seat.price}
              occupied={seat.occupied}
              position={seat.position}
              onInspect={setHover}
            />
          ))}

          <OrbitControls
            makeDefault
            enablePan={false}
            maxPolarAngle={Math.PI / 2.15}
            minPolarAngle={0.2}
            minDistance={3.5}
            maxDistance={14}
            target={[0, 0.3, -2]}
            enableDamping
            dampingFactor={0.08}
          />
        </Canvas>
      </CanvasBoundary>
    </div>
  )
}

function Swatch({ color, label }: { color: string; label: string }) {
  return (
    <div className="flex items-center gap-2">
      <span
        className="h-3 w-3 shrink-0 rounded-sm"
        style={{ backgroundColor: color }}
      />
      <span className="text-neutral-200">{label}</span>
    </div>
  )
}
