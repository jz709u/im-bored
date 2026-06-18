'use client'

import { MapPin, Clock, DollarSign, ExternalLink } from 'lucide-react'
import { cn } from '@/utils/cn'
import type { AppEvent } from '@/types'

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  })
}

interface Props {
  event: AppEvent
  highlight?: boolean
}

export function EventCard({ event, highlight = false }: Props) {
  return (
    <div
      className={cn(
        'rounded-2xl overflow-hidden border transition-shadow hover:shadow-lg',
        highlight
          ? 'border-indigo-400 ring-2 ring-indigo-300 bg-white'
          : 'border-zinc-200 bg-white'
      )}
    >
      {event.image_url && (
        <img
          src={event.image_url}
          alt={event.title}
          className="w-full h-40 object-cover"
        />
      )}
      <div className="p-4 space-y-2">
        {event.category && (
          <span className="text-xs font-medium uppercase tracking-wide text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-full">
            {event.category}
          </span>
        )}
        <h3 className="font-semibold text-zinc-900 leading-tight line-clamp-2">{event.title}</h3>

        <div className="flex items-center gap-1 text-sm text-zinc-500">
          <Clock className="w-3.5 h-3.5 shrink-0" />
          <span>{formatDate(event.starts_at)}</span>
        </div>

        {event.venue_name && (
          <div className="flex items-center gap-1 text-sm text-zinc-500">
            <MapPin className="w-3.5 h-3.5 shrink-0" />
            <span className="truncate">{event.venue_name}</span>
          </div>
        )}

        {event.price_min != null && (
          <div className="flex items-center gap-1 text-sm text-zinc-500">
            <DollarSign className="w-3.5 h-3.5 shrink-0" />
            <span>{event.price_min === 0 ? 'Free' : `From $${event.price_min}`}</span>
          </div>
        )}

        {event.source_url && (
          <a
            href={event.source_url}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 text-sm font-medium text-indigo-600 hover:text-indigo-800 mt-1"
          >
            Get tickets <ExternalLink className="w-3.5 h-3.5" />
          </a>
        )}
      </div>
    </div>
  )
}
