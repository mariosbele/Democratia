import { IconCheck, IconSparkle } from './Icons.jsx'

// Κάρτα "Σύνοψη AI": αντί για το πλήρες νομικό κείμενο του ψηφίσματος,
// εμφανίζει τα βασικά σημεία που έχει εξάγει εργαλείο τεχνητής νοημοσύνης.
export function AiSummary({ summary }) {
  if (!summary) return null
  return (
    <div className="overflow-hidden rounded-2xl border border-brand-100 bg-gradient-to-b from-brand-50/80 to-white">
      <div className="flex items-center gap-2 border-b border-brand-100 bg-brand-50/60 px-4 py-2.5">
        <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-brand-600 text-white">
          <IconSparkle className="h-4 w-4" />
        </span>
        <div>
          <p className="text-sm font-bold text-brand-800">Σύνοψη AI</p>
          <p className="text-[11px] text-brand-600/80">{summary.readingTime}</p>
        </div>
      </div>

      <div className="space-y-4 px-4 py-4">
        <p className="text-[15px] font-medium leading-relaxed text-ink">{summary.tldr}</p>

        <div>
          <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500">
            Τι πρέπει να γνωρίζετε
          </p>
          <ul className="space-y-2">
            {summary.keyPoints.map((point, i) => (
              <li key={i} className="flex gap-2 text-sm leading-relaxed text-slate-700">
                <IconCheck className="mt-0.5 h-4 w-4 shrink-0 text-brand-600" />
                <span>{point}</span>
              </li>
            ))}
          </ul>
        </div>

        <div className="rounded-xl bg-amber-50 px-3 py-2.5">
          <p className="text-xs font-semibold uppercase tracking-wide text-amber-700">Τι σημαίνει για εσάς</p>
          <p className="mt-1 text-sm leading-relaxed text-amber-900">{summary.impact}</p>
        </div>

        <p className="text-[11px] italic text-slate-400">
          Η σύνοψη δημιουργήθηκε αυτόματα από AI για γρήγορη ενημέρωση και δεν αντικαθιστά το επίσημο
          κείμενο του νομοσχεδίου.
        </p>
      </div>
    </div>
  )
}
