import type { GeocodedPlace } from '@/types'

export async function geocodeQuery(query: string): Promise<GeocodedPlace | null> {
  const url = new URL('https://nominatim.openstreetmap.org/search')
  url.searchParams.set('q', query)
  url.searchParams.set('format', 'json')
  url.searchParams.set('limit', '1')
  url.searchParams.set('addressdetails', '1')

  const res = await fetch(url.toString(), {
    headers: { 'User-Agent': 'ImBoredApp/1.0 (jay.zisch@zealitconsultants.ai)' },
  })
  if (!res.ok) return null

  const data = await res.json()
  if (!data.length) return null

  const r = data[0]
  const [minLat, maxLat, minLng, maxLng] = (r.boundingbox ?? []).map(Number)

  return {
    displayName: r.display_name,
    lat: parseFloat(r.lat),
    lng: parseFloat(r.lon),
    population: r.extratags?.population ? parseInt(r.extratags.population) : undefined,
    bbox: minLat != null ? { minLat, maxLat, minLng, maxLng } : undefined,
  }
}
