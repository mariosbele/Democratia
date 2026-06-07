import { Link } from 'react-router-dom'
import { useApp } from '../context/AppContext.jsx'
import { AppHeader } from '../components/AppHeader.jsx'
import { CATEGORY_COLORS, formatDate } from '../lib/utils.js'
import { IconChevron, IconClock } from '../components/Icons.jsx'

export function History() {
  const { history } = useApp()

  return (
    <div className="flex h-full flex-col">
      <AppHeader title="Ιστορικό" />
      <div className="flex-1 space-y-3 bg-slate-50 px-4 py-4">
        {history.length === 0 ? (
          <div className="mt-16 flex flex-col items-center gap-3 text-center text-slate-400">
            <IconClock className="h-10 w-10" />
            <p className="text-sm">
              Δεν έχετε ακόμη συμμετοχές.
              <br />
              Ψηφίστε ή σχολιάστε σε ένα ψήφισμα για να εμφανιστεί εδώ.
            </p>
            <Link to="/app" className="btn-ghost mt-2">
              Δείτε ψηφίσματα
            </Link>
          </div>
        ) : (
          history.map(({ voting, action, date }) => (
            <Link
              key={voting.id}
              to={`/app/voting/${voting.id}`}
              className="flex items-center gap-3 rounded-2xl border border-slate-100 bg-white p-4 shadow-card transition hover:border-brand-200 active:scale-[0.99]"
            >
              <div className="min-w-0 flex-1">
                <span
                  className={`chip ${CATEGORY_COLORS[voting.category] || 'bg-slate-100 text-slate-700'}`}
                >
                  {voting.category}
                </span>
                <p className="mt-1.5 truncate text-sm font-bold text-ink">{voting.title}</p>
                <p className="text-xs text-slate-500">
                  {action} · {formatDate(date)}
                </p>
              </div>
              <IconChevron className="h-5 w-5 text-slate-300" />
            </Link>
          ))
        )}
      </div>
    </div>
  )
}
