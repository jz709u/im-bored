'use client'

import { useState } from 'react'
import { LocationSearch } from '@/components/LocationSearch'
import { EventList } from '@/components/EventList'
import { BoredForm } from '@/components/BoredForm'
import { EventCard } from '@/components/EventCard'
import type { AppEvent, BoredPreferences } from '@/types'

interface Place {
  id: string
  canonical_name: string
  lat: number
  lng: number
}

export default function Home() {
  const [loading, setLoading] = useState(false)
  const [boredLoading, setBoredLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [place, setPlace] = useState<Place | null>(null)
  const [events, setEvents] = useState<AppEvent[]>([])
  const [pick, setPick] = useState<{ event: AppEvent; reason: string } | null>(null)

  function handleResults(data: { place: Record<string, unknown>; events: Record<string, unknown>[] }) {
    setPlace(data.place as unknown as Place)
    setEvents(data.events as unknown as AppEvent[])
    setPick(null)
  }

  async function handleBored(prefs: BoredPreferences) {
    if (!events.length) return
    setBoredLoading(true)
    setPick(null)
    try {
      const res = await fetch('/api/recommend', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ events, prefs }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? 'Failed to get recommendation')
      setPick(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong')
    } finally {
      setBoredLoading(false)
    }
  }

  return (
    <main className="min-h-screen bg-zinc-50">
      <div className="max-w-4xl mx-auto px-4 py-12 space-y-8">
        <div className="text-center space-y-2">
          <h1 className="text-4xl font-bold text-zinc-900">I&apos;m Bored</h1>
          <p className="text-zinc-500 text-lg">One good thing to do, wherever you are.</p>
        </div>

        <LocationSearch
          onResults={handleResults}
          loading={loading}
          setLoading={setLoading}
          setError={setError}
        />

        {error && (
          <div className="rounded-xl bg-red-50 border border-red-200 text-red-700 px-4 py-3 text-sm">
            {error}
          </div>
        )}

        {place && (
          <p className="text-sm text-zinc-400 text-center">
            Showing events near{' '}
            <span className="text-zinc-600 font-medium">{place.canonical_name}</span>
          </p>
        )}

        {events.length > 0 && (
          <BoredForm onSubmit={handleBored} loading={boredLoading} />
        )}

        {pick && (
          <div className="space-y-3">
            <h2 className="font-semibold text-zinc-900 text-lg">Your pick</h2>
            <EventCard event={pick.event} highlight />
            <div className="px-4 py-3 bg-indigo-50 rounded-xl text-sm text-indigo-800">
              {pick.reason}
            </div>
          </div>
        )}

        {events.length > 0 && (
          <div className="space-y-4">
            <h2 className="font-semibold text-zinc-700">
              {events.length} upcoming event{events.length !== 1 ? 's' : ''}
            </h2>
            <EventList events={events} highlightId={pick?.event.id} />
          </div>
        )}

        {!events.length && !loading && !place && (
          <div className="text-center py-16">
            <p className="text-6xl mb-4">🗺️</p>
            <p className="text-zinc-400">Enter a location to discover events</p>
          </div>
        )}
      </div>
    </main>
  )
}
