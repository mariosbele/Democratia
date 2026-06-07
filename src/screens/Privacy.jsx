import { AppHeader } from '../components/AppHeader.jsx'
import { PRIVACY_TEXT } from '../data/mockData.js'
import { IconShield } from '../components/Icons.jsx'

export function Privacy() {
  return (
    <div className="flex h-full flex-col">
      <AppHeader title="Απόρρητο" />
      <div className="flex-1 bg-slate-50 px-4 py-4">
        <div className="rounded-2xl border border-slate-100 bg-white p-5 shadow-card">
          <div className="flex items-center gap-2 text-brand-700">
            <IconShield className="h-6 w-6" />
            <h2 className="text-base font-bold">Πολιτική Απορρήτου & GDPR</h2>
          </div>
          <ul className="mt-4 space-y-3">
            {PRIVACY_TEXT.map((p, i) => (
              <li key={i} className="flex gap-2 text-sm leading-relaxed text-slate-600">
                <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-brand-400" />
                <span>{p}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  )
}
