'use client'

import { useState } from 'react'
import { cn } from '@/utils/cn'
import type { BoredPreferences } from '@/types'

const CHIPS = {
  when: [
    { value: 'now', label: '🕐 Right now' },
    { value: 'tonight', label: '🌙 Tonight' },
    { value: 'weekend', label: '📅 Weekend' },
  ],
  budget: [
    { value: 'free', label: '🆓 Free' },
    { value: 'cheap', label: '💵 Cheap' },
    { value: 'any', label: '💳 Any' },
  ],
  groupSize: [
    { value: 'solo', label: '🙋 Solo' },
    { value: 'group', label: '👥 Group' },
  ],
  energy: [
    { value: 'chill', label: '😌 Chill' },
    { value: 'lively', label: '🎉 Lively' },
  ],
} as const

interface ChipGroupProps<T extends string> {
  label: string
  options: readonly { value: T; label: string }[]
  value: T
  onChange: (v: T) => void
}

function ChipGroup<T extends string>({ label, options, value, onChange }: ChipGroupProps<T>) {
  return (
    <div className="space-y-1.5">
      <p className="text-xs font-medium text-zinc-500 uppercase tracking-wide">{label}</p>
      <div className="flex flex-wrap gap-2">
        {options.map((o) => (
          <button
            key={o.value}
            type="button"
            onClick={() => onChange(o.value)}
            className={cn(
              'px-3 py-1.5 rounded-full text-sm border transition-all',
              value === o.value
                ? 'bg-indigo-600 border-indigo-600 text-white'
                : 'bg-white border-zinc-200 text-zinc-600 hover:border-indigo-300'
            )}
          >
            {o.label}
          </button>
        ))}
      </div>
    </div>
  )
}

interface Props {
  onSubmit: (prefs: BoredPreferences) => void
  loading: boolean
}

export function BoredForm({ onSubmit, loading }: Props) {
  const [prefs, setPrefs] = useState<BoredPreferences>({
    when: 'now',
    radius: 25,
    budget: 'any',
    groupSize: 'solo',
    energy: 'chill',
  })

  return (
    <div className="bg-white rounded-2xl border border-zinc-200 p-5 space-y-4">
      <h2 className="font-semibold text-zinc-900">What are you feeling?</h2>

      <ChipGroup
        label="When"
        options={CHIPS.when}
        value={prefs.when}
        onChange={(v) => setPrefs((p) => ({ ...p, when: v }))}
      />
      <ChipGroup
        label="Budget"
        options={CHIPS.budget}
        value={prefs.budget}
        onChange={(v) => setPrefs((p) => ({ ...p, budget: v }))}
      />
      <ChipGroup
        label="Going"
        options={CHIPS.groupSize}
        value={prefs.groupSize}
        onChange={(v) => setPrefs((p) => ({ ...p, groupSize: v }))}
      />
      <ChipGroup
        label="Vibe"
        options={CHIPS.energy}
        value={prefs.energy}
        onChange={(v) => setPrefs((p) => ({ ...p, energy: v }))}
      />

      <button
        onClick={() => onSubmit(prefs)}
        disabled={loading}
        className={cn(
          'w-full py-3 rounded-xl bg-indigo-600 text-white font-semibold text-base hover:bg-indigo-700 transition-colors',
          loading && 'opacity-50 cursor-not-allowed'
        )}
      >
        {loading ? 'Finding something…' : "I'm Bored — Surprise me"}
      </button>
    </div>
  )
}
