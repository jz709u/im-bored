'use client'

import { EventCard } from './EventCard'
import type { AppEvent } from '@/types'

interface Props {
  events: AppEvent[]
  highlightId?: string
}

export function EventList({ events, highlightId }: Props) {
  if (!events.length) {
    return (
      <div className="text-center py-16 text-zinc-400">
        <p className="text-lg">No upcoming events found.</p>
        <p className="text-sm mt-1">Try a larger city or check back soon.</p>
      </div>
    )
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
      {events.map((event) => (
        <EventCard
          key={event.id}
          event={event}
          highlight={event.id === highlightId}
        />
      ))}
    </div>
  )
}
