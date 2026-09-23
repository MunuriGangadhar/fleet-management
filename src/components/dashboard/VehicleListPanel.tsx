import { useMemo, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { Search } from 'lucide-react'
import { Card, CardHeader } from '@/components/ui/Card'
import { EmptyState } from '@/components/ui/EmptyState'
import { VehicleListItem } from './VehicleListItem'
import { computeHealthScore } from '@/lib/healthScore'
import type { VehicleStatus } from '@/types/database'
import type { VehicleWithRelations } from '@/types/domain'

type SortKey = 'health' | 'name' | 'recent'

export function VehicleListPanel({
  vehicles,
  statusFilter,
  selectedVehicleId,
  onSelectVehicle,
}: {
  vehicles: VehicleWithRelations[]
  statusFilter: VehicleStatus | null
  selectedVehicleId?: string
  onSelectVehicle: (id: string) => void
}) {
  const [query, setQuery] = useState('')
  const [sortKey, setSortKey] = useState<SortKey>('health')

  const filtered = useMemo(() => {
    let list = vehicles
    if (statusFilter) list = list.filter((v) => v.status === statusFilter)
    if (query.trim()) {
      const q = query.trim().toLowerCase()
      list = list.filter(
        (v) =>
          v.registration_number.toLowerCase().includes(q) ||
          v.name.toLowerCase().includes(q) ||
          Boolean(v.driver?.name.toLowerCase().includes(q)),
      )
    }

    const withHealth = list.map((v) => ({
      v,
      health: computeHealthScore(
        v,
        { count: v.open_alert_count, highestSeverity: v.highest_open_severity },
        null,
      ).score,
    }))

    withHealth.sort((a, b) => {
      if (sortKey === 'health') return a.health - b.health
      if (sortKey === 'name') return a.v.registration_number.localeCompare(b.v.registration_number)
      const at = a.v.last_seen_at ? new Date(a.v.last_seen_at).getTime() : 0
      const bt = b.v.last_seen_at ? new Date(b.v.last_seen_at).getTime() : 0
      return bt - at
    })

    return withHealth.map((x) => x.v)
  }, [vehicles, statusFilter, query, sortKey])

  return (
    <Card className="flex h-full flex-col">
      <CardHeader
        title="Fleet"
        subtitle={`${filtered.length} of ${vehicles.length} vehicles`}
        action={
          <select
            value={sortKey}
            onChange={(e) => setSortKey(e.target.value as SortKey)}
            className="rounded-md border border-[var(--border-default)] bg-[var(--bg-canvas)] px-2 py-1 text-xs text-[var(--text-secondary)]"
          >
            <option value="health">Sort: Health</option>
            <option value="name">Sort: Name</option>
            <option value="recent">Sort: Recent</option>
          </select>
        }
      />

      <div className="px-4 pb-2">
        <div className="relative">
          <Search
            size={14}
            className="absolute left-2.5 top-1/2 -translate-y-1/2 text-[var(--text-tertiary)]"
          />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search registration, driver..."
            className="w-full rounded-lg border border-[var(--border-default)] bg-[var(--bg-canvas)] py-1.5 pl-8 pr-3 text-xs text-[var(--text-primary)] outline-none focus:border-[var(--accent)]"
          />
        </div>
      </div>

      <div className="flex-1 space-y-1 overflow-y-auto px-2 pb-3">
        {filtered.length === 0 ? (
          <EmptyState title="No vehicles match" description="Try a different search or filter." />
        ) : (
          <AnimatePresence initial={false}>
            {filtered.map((vehicle, index) => (
              <motion.div
                key={vehicle.id}
                layout
                initial={{ opacity: 0, x: -8 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -8 }}
                transition={{ duration: 0.25, delay: Math.min(index * 0.025, 0.3) }}
              >
                <VehicleListItem
                  vehicle={vehicle}
                  selected={vehicle.id === selectedVehicleId}
                  onClick={() => onSelectVehicle(vehicle.id)}
                />
              </motion.div>
            ))}
          </AnimatePresence>
        )}
      </div>
    </Card>
  )
}
