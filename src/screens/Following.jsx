import { Link } from 'react-router-dom'
import { useApp } from '../context/AppContext.jsx'
import { AppHeader } from '../components/AppHeader.jsx'
import { IconUser } from '../components/Icons.jsx'

export function Following() {
  const { following, people, toggleFollow } = useApp()
  const list = following.map((id) => people[id]).filter(Boolean)

  return (
    <div className="flex h-full flex-col">
      <AppHeader title="Ακολουθείτε" />
      <div className="flex-1 space-y-3 bg-slate-50 px-4 py-4">
        {list.length === 0 ? (
          <div className="mt-16 flex flex-col items-center gap-3 text-center text-slate-400">
            <IconUser className="h-10 w-10" />
            <p className="text-sm">
              Δεν ακολουθείτε ακόμη κανέναν.
              <br />
              Ακολουθήστε πολίτες ή πολιτικούς από την κοινότητα ενός ψηφίσματος.
            </p>
            <Link to="/app" className="btn-ghost mt-2">
              Δείτε ψηφίσματα
            </Link>
          </div>
        ) : (
          list.map((person) => (
            <div
              key={person.id}
              className="flex items-center gap-3 rounded-2xl border border-slate-100 bg-white p-3.5 shadow-card"
            >
              <span className="flex h-11 w-11 items-center justify-center rounded-full bg-brand-100 text-base font-bold text-brand-700">
                {person.fullName.charAt(0)}
              </span>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-1.5">
                  <p className="truncate text-sm font-semibold text-ink">{person.fullName}</p>
                  {person.isPolitician && (
                    <span className="chip bg-brand-600 px-1.5 py-0.5 text-[9px] text-white">Πολιτικός</span>
                  )}
                </div>
                <p className="text-xs text-slate-400">{person.isPolitician ? 'Πολιτικό πρόσωπο' : 'Πολίτης'}</p>
              </div>
              <button
                onClick={() => toggleFollow(person.id)}
                className="rounded-full bg-slate-100 px-3 py-1.5 text-xs font-semibold text-slate-500 transition hover:bg-rose-50 hover:text-rose-600"
              >
                Διαγραφή
              </button>
            </div>
          ))
        )}
      </div>
    </div>
  )
}
