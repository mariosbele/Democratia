import { Link } from 'react-router-dom'
import { useApp } from '../context/AppContext.jsx'
import { CATEGORY_COLORS, formatDate } from '../lib/utils.js'
import { IconChevron, IconClock, IconSparkle } from './Icons.jsx'

// Κάρτα ψηφίσματος στη λίστα της αρχικής σελίδας
export function VotingCard({ voting }) {
  const { votes } = useApp()
  const voted = !!votes[voting.id]
  const closed = voting.status === 'closed'

  return (
    <Link
      to={`/app/voting/${voting.id}`}
      className="block rounded-2xl border border-slate-100 bg-white p-4 shadow-card transition hover:border-brand-200 hover:shadow-md active:scale-[0.99]"
    >
      <div className="flex items-center justify-between gap-2">
        <span className={`chip ${CATEGORY_COLORS[voting.category] || 'bg-slate-100 text-slate-700'}`}>
          {voting.category}
        </span>
        <div className="flex items-center gap-1.5">
          {closed ? (
            <span className="chip bg-slate-100 text-slate-500">Ολοκληρώθηκε</span>
          ) : (
            <span className="chip bg-emerald-100 text-emerald-700">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
              Ανοιχτό
            </span>
          )}
        </div>
      </div>

      <h3 className="mt-2.5 text-base font-bold leading-snug text-ink">{voting.title}</h3>

      <p className="mt-1.5 line-clamp-2 text-sm leading-relaxed text-slate-500">
        {voting.aiSummary?.tldr}
      </p>

      <div className="mt-3 flex items-center justify-between">
        <div className="flex items-center gap-3 text-xs text-slate-400">
          <span className="inline-flex items-center gap-1 font-medium text-brand-600">
            <IconSparkle className="h-3.5 w-3.5" /> Σύνοψη AI
          </span>
          <span className="inline-flex items-center gap-1">
            <IconClock className="h-3.5 w-3.5" />
            {closed ? formatDate(voting.parliamentDate) : `έως ${formatDate(voting.voteDeadline)}`}
          </span>
        </div>
        <div className="flex items-center gap-1">
          {voted && <span className="chip bg-brand-50 text-brand-700">Ψηφίσατε</span>}
          <IconChevron className="h-5 w-5 text-slate-300" />
        </div>
      </div>
    </Link>
  )
}
