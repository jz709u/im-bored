import { NextRequest, NextResponse } from 'next/server'
import { runPipeline } from '@/lib/pipeline'
import { createClient } from '@/lib/supabase/server'

export async function POST(req: NextRequest) {
  try {
    const { location } = await req.json()
    if (!location || typeof location !== 'string') {
      return NextResponse.json({ error: 'location required' }, { status: 400 })
    }

    const result = await runPipeline(location)
    const supabase = await createClient()

    // Get event IDs for this place
    const { data: links } = await supabase
      .from('event_places')
      .select('event_id')
      .eq('place_id', result.place.id)

    const eventIds = (links ?? []).map((l) => l.event_id)

    let events: Record<string, unknown>[] = []
    if (eventIds.length) {
      const { data } = await supabase
        .from('events_with_venue')
        .select('id, title, description, starts_at, ends_at, category, price_min, source, source_url, image_url, venue_name, venue_address')
        .in('id', eventIds)
        .gte('starts_at', new Date().toISOString())
        .order('starts_at', { ascending: true })
        .limit(50)
      events = (data as Record<string, unknown>[]) ?? []
    }

    return NextResponse.json({
      place: result.place,
      events,
      eventsUpserted: result.eventsUpserted,
      cached: result.cached,
    })
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Unknown error'
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
