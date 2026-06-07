import { useState } from 'react'
import { AppHeader } from '../components/AppHeader.jsx'
import { QA } from '../data/mockData.js'
import { IconChevronDown } from '../components/Icons.jsx'

export function QAScreen() {
  const [open, setOpen] = useState(0)

  return (
    <div className="flex h-full flex-col">
      <AppHeader title="Ερωτήσεις & Απαντήσεις" />
      <div className="flex-1 space-y-3 bg-slate-50 px-4 py-4">
        {QA.map((item, i) => {
          const isOpen = open === i
          return (
            <div
              key={i}
              className="overflow-hidden rounded-2xl border border-slate-100 bg-white shadow-card"
            >
              <button
                onClick={() => setOpen(isOpen ? -1 : i)}
                className="flex w-full items-center justify-between gap-3 px-4 py-3.5 text-left"
              >
                <span className="text-sm font-semibold text-ink">{item.q}</span>
                <IconChevronDown
                  className={`h-5 w-5 shrink-0 text-slate-400 transition ${isOpen ? 'rotate-180' : ''}`}
                />
              </button>
              {isOpen && (
                <p className="border-t border-slate-100 px-4 py-3 text-sm leading-relaxed text-slate-600 animate-slide-up">
                  {item.a}
                </p>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
