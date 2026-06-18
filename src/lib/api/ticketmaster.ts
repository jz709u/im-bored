import type { AppEvent, Venue } from '@/types'

const BASE = 'https://app.ticketmaster.com/discovery/v2'

interface TmEvent {
  id: string
  name: string
  info?: string
  description?: string
  url?: string
  images?: { url: string; width: number; height: number }[]
  dates?: { start?: { dateTime?: string; localDate?: string; localTime?: string } }
  priceRanges?: { type: string; min: number; max: number }[]
  classifications?: { segment?: { name?: string }; genre?: { name?: string } }[]
  _embedded?: {
    venues?: {
      name?: string
      address?: { line1?: string }
      city?: { name?: string }
      state?: { stateCode?: string }
      location?: { latitude?: string; longitude?: string }
    }[]
  }
}

export interface TmResult {
  events: Omit<AppEvent, 'id' | 'created_at'>[]
  venues: Omit<Venue, 'id' | 'created_at'>[]
}

export async function fetchTicketmasterEvents(
  lat: number,
  lng: number,
  radiusMiles = 25,
  pageSize = 50
): Promise<TmResult> {
  const key = process.env.TICKETMASTER_API_KEY
  if (!key) throw new Error('TICKETMASTER_API_KEY not set')

  const url = new URL(`${BASE}/events.json`)
  url.searchParams.set('apikey', key)
  url.searchParams.set('latlong', `${lat},${lng}`)
  url.searchParams.set('radius', String(radiusMiles))
  url.searchParams.set('unit', 'miles')
  url.searchParams.set('size', String(pageSize))
  url.searchParams.set('sort', 'date,asc')

  const res = await fetch(url.toString(), { next: { revalidate: 3600 } })
  if (!res.ok) {
    const text = await res.text()
    throw new Error(`Ticketmaster ${res.status}: ${text}`)
  }

  const data = await res.json()
  const raw: TmEvent[] = data._embedded?.events ?? []

  const events: Omit<AppEvent, 'id' | 'created_at'>[] = []
  const venues: Omit<Venue, 'id' | 'created_at'>[] = []

  for (const e of raw) {
    const tmVenue = e._embedded?.venues?.[0]
    let venueKey: string | null = null

    if (tmVenue?.name) {
      const venueLat = tmVenue.location?.latitude ? parseFloat(tmVenue.location.latitude) : null
      const venueLng = tmVenue.location?.longitude ? parseFloat(tmVenue.location.longitude) : null
      const address = [
        tmVenue.address?.line1,
        tmVenue.city?.name,
        tmVenue.state?.stateCode,
      ]
        .filter(Boolean)
        .join(', ')

      venueKey = tmVenue.name
      venues.push({ name: tmVenue.name, address: address || null, lat: venueLat, lng: venueLng })
    }

    const category =
      e.classifications?.[0]?.segment?.name ??
      e.classifications?.[0]?.genre?.name ??
      null

    const startsAt = e.dates?.start?.dateTime ?? e.dates?.start?.localDate ?? null
    if (!startsAt) continue

    const bestImage = e.images?.sort((a, b) => b.width - a.width)[0]?.url ?? null

    const dedup = Buffer.from(`tm:${e.id}`).toString('base64')

    let sourceUrl = e.url ?? null
    if (sourceUrl) {
      try {
        const u = new URL(sourceUrl).searchParams.get('u')
        if (u) sourceUrl = decodeURIComponent(u)
      } catch {
        // keep original if parsing fails
      }
    }

    events.push({
      title: e.name,
      description: e.description ?? e.info ?? null,
      starts_at: startsAt,
      ends_at: null,
      venue_id: null, // resolved after venue upsert
      category,
      price_min: e.priceRanges?.[0]?.min ?? null,
      source: 'ticketmaster',
      source_url: sourceUrl,
      image_url: bestImage,
      dedup_hash: dedup,
      _venueKey: venueKey,
    } as Omit<AppEvent, 'id' | 'created_at'> & { _venueKey: string | null })
  }

  return { events, venues }
}
