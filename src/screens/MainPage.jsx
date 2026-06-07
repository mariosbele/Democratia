import { useMemo, useState } from 'react'
import { useApp } from '../context/AppContext.jsx'
import { AppHeader } from '../components/AppHeader.jsx'
import { VotingCard } from '../components/VotingCard.jsx'
import { CATEGORIES } from '../data/mockData.js'

export function MainPage() {
  const { votingsForSociety } = useApp()
  const [category, setCategory] = useState('Όλα')
  const [tab, setTab] = useState('open') // open | results

  const filtered = useMemo(() => {
    let list = votingsForSociety
    if (tab === 'open') list = list.filter((v) => v.status === 'open')
    else list = list.filter((v) => v.status === 'closed')
    if (category !== 'Όλα') list = list.filter((v) => v.category === category)
    // Ταξινόμηση κατά ημερομηνία (αύξουσα), όπως ορίζουν οι προδιαγραφές
    return [...list].sort((a, b) => a.uploadedAt.localeCompare(b.uploadedAt))
  }, [votingsForSociety, category, tab])

  return (
    <div className="flex h-full flex-col">
      <AppHeader showSociety />

      {/* Tabs: Ανοιχτά / Αποτελέσματα */}
      <div className="shrink-0 border-b border-slate-100 bg-white px-4">
        <div className="flex gap-6">
          {[
            { id: 'open', label: 'Ανοιχτά ψηφίσματα' },
            { id: 'results', label: 'Αποτελέσματα' },
          ].map((t) => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={`relative py-3 text-sm font-semibold transition ${
                tab === t.id ? 'text-brand-700' : 'text-slate-400'
              }`}
            >
              {t.label}
              {tab === t.id && (
                <span className="absolute inset-x-0 -bottom-px h-0.5 rounded-full bg-brand-600" />
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Φίλτρα κατηγοριών */}
      <div className="no-scrollbar flex shrink-0 gap-2 overflow-x-auto bg-white px-4 py-3">
        {CATEGORIES.map((c) => (
          <button
            key={c}
            onClick={() => setCategory(c)}
            className={`chip shrink-0 border transition ${
              category === c
                ? 'border-brand-600 bg-brand-600 text-white'
                : 'border-slate-200 bg-white text-slate-600 hover:border-brand-300'
            }`}
          >
            {c}
          </button>
        ))}
      </div>

      {/* Λίστα ψηφισμάτων */}
      <div className="flex-1 space-y-3 bg-slate-50 px-4 py-4">
        {filtered.length === 0 ? (
          <div className="mt-16 text-center text-sm text-slate-400">
            Δεν υπάρχουν {tab === 'open' ? 'ανοιχτά ψηφίσματα' : 'αποτελέσματα'} σε αυτή την κατηγορία.
          </div>
        ) : (
          filtered.map((v) => <VotingCard key={v.id} voting={v} />)
        )}
      </div>
    </div>
  )
}
