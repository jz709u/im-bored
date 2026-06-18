export interface Place {
  id: string
  canonical_name: string
  lat: number
  lng: number
  bbox: Record<string, number> | null
  population: number | null
  tier_reached: number
  sources_discovered_at: string | null
  created_at: string
}

export interface Venue {
  id: string
  name: string
  address: string | null
  lat: number | null
  lng: number | null
}

export interface AppEvent {
  id: string
  title: string
  description: string | null
  starts_at: string
  ends_at: string | null
  venue_id: string | null
  category: string | null
  price_min: number | null
  source: string
  source_url: string | null
  image_url: string | null
  dedup_hash: string | null
  created_at: string
  // from events_with_venue view
  venue_name?: string | null
  venue_address?: string | null
  venue_lat?: number | null
  venue_lng?: number | null
}

export interface BoredPreferences {
  when: 'now' | 'tonight' | 'weekend'
  radius: number
  budget: 'free' | 'cheap' | 'any'
  groupSize: 'solo' | 'group'
  energy: 'chill' | 'lively'
}

export interface GeocodedPlace {
  displayName: string
  lat: number
  lng: number
  population?: number
  bbox?: { minLat: number; maxLat: number; minLng: number; maxLng: number }
}
