import { NextRequest, NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'
import type { AppEvent, BoredPreferences } from '@/types'

const client = new Anthropic()

export async function POST(req: NextRequest) {
  try {
    const { events, prefs }: { events: AppEvent[]; prefs: BoredPreferences } = await req.json()
    if (!events?.length) return NextResponse.json({ error: 'No events provided' }, { status: 400 })

    const apiKey = process.env.ANTHROPIC_API_KEY
    if (!apiKey) return NextResponse.json({ error: 'ANTHROPIC_API_KEY not set' }, { status: 500 })

    const eventSummary = events
      .slice(0, 30)
      .map((e, i) => {
        const date = new Date(e.starts_at).toLocaleDateString('en-US', {
          weekday: 'short', month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit',
        })
        const price = e.price_min == null ? 'unknown price' : e.price_min === 0 ? 'free' : `$${e.price_min}+`
        return `${i}: ${e.title} | ${date} | ${e.category ?? 'misc'} | ${price} | ${e.venue_name ?? 'venue TBD'}`
      })
      .join('\n')

    const prefsText = [
      `When: ${prefs.when}`,
      `Budget: ${prefs.budget}`,
      `Going: ${prefs.groupSize}`,
      `Vibe: ${prefs.energy}`,
    ].join(', ')

    const message = await client.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 256,
      messages: [
        {
          role: 'user',
          content: `You are a local friend recommending one thing to do. Pick the SINGLE best event from this list given the user's preferences. Reply with ONLY valid JSON: {"index": <number>, "reason": "<one casual sentence why>"}

User preferences: ${prefsText}

Events (index: title | date | category | price | venue):
${eventSummary}`,
        },
      ],
    })

    const text = message.content[0].type === 'text' ? message.content[0].text : ''
    const parsed = JSON.parse(text.match(/\{[\s\S]*\}/)?.[0] ?? '{}')
    const idx = parsed.index ?? 0
    const event = events[idx] ?? events[0]

    return NextResponse.json({ event, reason: parsed.reason ?? 'Looks like a great pick!' })
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Unknown error'
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
