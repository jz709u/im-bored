import { createClient } from '@/lib/supabase/server'
import { geocodeQuery } from '@/lib/geocode'
import { fetchTicketmasterEvents } from '@/lib/api/ticketmaster'
import type { AppEvent, Place } from '@/types'

export interface PipelineResult {
  place: Place
  eventsUpserted: number
  cached: boolean
}

const CACHE_TTL_HOURS = 6

export async function runPipeline(locationQuery: string): Promise<PipelineResult> {
  const supabase = await createClient()

  // 1. Geocode
  const geo = await geocodeQuery(locationQuery)
  if (!geo) throw new Error(`Could not geocode: ${locationQuery}`)

  // 2. Find or create place
  const { data: existing } = await supabase
    .from('places')
    .select('*')
    .ilike('canonical_name', geo.displayName)
    .maybeSingle()

  let place: Place
  const staleCutoff = new Date(Date.now() - CACHE_TTL_HOURS * 3600 * 1000).toISOString()

  if (existing) {
    place = existing
    // Return cached if fresh and has linked events
    if (existing.sources_discovered_at && existing.sources_discovered_at > staleCutoff) {
      const { count } = await supabase
        .from('event_places')
        .select('*', { count: 'exact', head: true })
        .eq('place_id', existing.id)
      if ((count ?? 0) > 0) {
        return { place, eventsUpserted: 0, cached: true }
      }
    }
  } else {
    const { data: created, error } = await supabase
      .from('places')
      .insert({
        canonical_name: geo.displayName,
        lat: geo.lat,
        lng: geo.lng,
        bbox: geo.bbox ?? null,
        population: geo.population ?? null,
      })
      .select()
      .single()
    if (error || !created) throw new Error(`Failed to create place: ${error?.message}`)
    place = created
  }

  // 3. Fetch Tier 1 (Ticketmaster)
  const { events, venues } = await fetchTicketmasterEvents(geo.lat, geo.lng)

  // 4. Upsert venues, build name→id map
  const venueMap = new Map<string, string>()
  for (const v of venues) {
    const { data: upserted } = await supabase
      .from('venues')
      .upsert({ name: v.name, address: v.address, lat: v.lat, lng: v.lng }, { onConflict: 'name' })
      .select('id, name')
      .single()
    if (upserted) venueMap.set(upserted.name, upserted.id)
  }

  type EventRow = Omit<AppEvent, 'id' | 'created_at'> & { venue_id: string | null }

  // 5. Upsert events
  let eventsUpserted = 0
  const eventRows: EventRow[] = events.map((e) => {
    const ev = e as Omit<AppEvent, 'id' | 'created_at'> & { _venueKey?: string | null }
    const venue_id = ev._venueKey ? (venueMap.get(ev._venueKey) ?? null) : null
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { _venueKey, ...rest } = ev
    return { ...rest, venue_id }
  })

  if (eventRows.length) {
    const { error } = await supabase
      .from('events')
      .upsert(eventRows, { onConflict: 'dedup_hash', ignoreDuplicates: false })
    if (!error) eventsUpserted = eventRows.length
  }

  // 6. Link events to place
  if (eventRows.length) {
    const { data: insertedEvents } = await supabase
      .from('events')
      .select('id, dedup_hash')
      .in('dedup_hash', eventRows.map((e) => e.dedup_hash).filter(Boolean))

    if (insertedEvents?.length) {
      await supabase
        .from('event_places')
        .upsert(
          insertedEvents.map((e) => ({ event_id: e.id, place_id: place.id })),
          { onConflict: 'event_id,place_id', ignoreDuplicates: true }
        )
    }
  }

  // 7. Mark place as refreshed
  await supabase
    .from('places')
    .update({ sources_discovered_at: new Date().toISOString(), tier_reached: 1 })
    .eq('id', place.id)

  return { place, eventsUpserted, cached: false }
}

export async function getEventsForPlace(
  placeId: string,
  limit = 50
): Promise<Record<string, unknown>[]> {
  const supabase = await createClient()
  const { data } = await supabase
    .from('events_with_venue')
    .select(`
      id, title, description, starts_at, ends_at, category,
      price_min, source, source_url, image_url,
      venue_name, venue_address
    `)
    .eq('id', supabase.from('event_places').select('event_id').eq('place_id', placeId) as unknown as string)
    .gte('starts_at', new Date().toISOString())
    .order('starts_at', { ascending: true })
    .limit(limit)

  return (data as Record<string, unknown>[]) ?? []
}
