'use client'

import { useState, useRef, FormEvent } from 'react'
import { Search, Loader2, MapPin } from 'lucide-react'
import { cn } from '@/utils/cn'

interface Props {
  onResults: (data: { place: Record<string, unknown>; events: Record<string, unknown>[] }) => void
  loading: boolean
  setLoading: (v: boolean) => void
  setError: (v: string | null) => void
}

export function LocationSearch({ onResults, loading, setLoading, setError }: Props) {
  const [query, setQuery] = useState('')
  const inputRef = useRef<HTMLInputElement>(null)

  async function handleGeolocate() {
    if (!navigator.geolocation) return
    setLoading(true)
    setError(null)
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const { latitude: lat, longitude: lng } = pos.coords
        const q = `${lat},${lng}`
        await submit(q)
      },
      () => {
        setError('Could not get your location.')
        setLoading(false)
      }
    )
  }

  async function submit(q: string) {
    if (!q.trim()) return
    setLoading(true)
    setError(null)
    try {
      const res = await fetch('/api/ingest', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ location: q.trim() }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? 'Request failed')
      onResults(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong')
    } finally {
      setLoading(false)
    }
  }

  function handleSubmit(e: FormEvent) {
    e.preventDefault()
    submit(query)
  }

  return (
    <form onSubmit={handleSubmit} className="flex gap-2">
      <div className="relative flex-1">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400 pointer-events-none" />
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="City, town, or zip code…"
          className="w-full pl-9 pr-3 py-3 rounded-xl border border-zinc-200 bg-white text-zinc-900 placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:border-transparent"
          disabled={loading}
        />
      </div>
      <button
        type="button"
        onClick={handleGeolocate}
        disabled={loading}
        title="Use my location"
        className={cn(
          'px-3 py-3 rounded-xl border border-zinc-200 bg-white text-zinc-500 hover:text-indigo-600 hover:border-indigo-300 transition-colors',
          loading && 'opacity-50 cursor-not-allowed'
        )}
      >
        <MapPin className="w-4 h-4" />
      </button>
      <button
        type="submit"
        disabled={loading || !query.trim()}
        className={cn(
          'px-5 py-3 rounded-xl bg-indigo-600 text-white font-medium hover:bg-indigo-700 transition-colors',
          (loading || !query.trim()) && 'opacity-50 cursor-not-allowed'
        )}
      >
        {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Go'}
      </button>
    </form>
  )
}
