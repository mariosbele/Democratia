import { Link } from 'react-router-dom'
import { useApp } from '../context/AppContext.jsx'
import { AppHeader } from '../components/AppHeader.jsx'
import { formatDate } from '../lib/utils.js'
import { IconBell, IconChevron, IconSparkle, IconThumb } from '../components/Icons.jsx'

const typeIcon = {
  results: IconSparkle,
  like: IconThumb,
  new_voting: IconBell,
}

export function Notifications() {
  const { notifications } = useApp()
  const fresh = notifications.filter((n) => n.isNew)
  const older = notifications.filter((n) => !n.isNew)

  return (
    <div className="flex h-full flex-col">
      <AppHeader showSociety />
      <div className="flex-1 space-y-6 bg-slate-50 px-4 py-4">
        <Section title="Νέες Ειδοποιήσεις" items={fresh} empty="Δεν υπάρχουν νέες ειδοποιήσεις." />
        <Section title="Παλαιότερες Ειδοποιήσεις" items={older} />
      </div>
    </div>
  )
}

function Section({ title, items, empty }) {
  return (
    <div>
      <h2 className="mb-2 px-1 text-xs font-semibold uppercase tracking-wide text-slate-400">{title}</h2>
      {items.length === 0 ? (
        empty ? <p className="px-1 text-sm text-slate-400">{empty}</p> : null
      ) : (
        <div className="space-y-2">
          {items.map((n) => {
            const Icon = typeIcon[n.type] || IconBell
            return (
              <Link
                key={n.id}
                to={`/app/voting/${n.votingId}`}
                className="flex items-center gap-3 rounded-2xl border border-slate-100 bg-white p-3.5 shadow-card transition hover:border-brand-200 active:scale-[0.99]"
              >
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-brand-50 text-brand-700">
                  <Icon className="h-5 w-5" />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold text-ink">{n.title}</p>
                  <p className="truncate text-xs text-slate-500">{n.subtitle}</p>
                </div>
                <div className="flex items-center gap-2">
                  {n.isNew && <span className="h-2 w-2 rounded-full bg-rose-500" />}
                  <span className="text-[11px] text-slate-400">{formatDate(n.date)}</span>
                  <IconChevron className="h-4 w-4 text-slate-300" />
                </div>
              </Link>
            )
          })}
        </div>
      )}
    </div>
  )
}
