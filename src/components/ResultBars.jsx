import { toPercentages } from '../lib/utils.js'

const config = [
  { key: 'yes', label: 'ΝΑΙ', color: 'bg-emerald-500', text: 'text-emerald-700' },
  { key: 'no', label: 'ΟΧΙ', color: 'bg-rose-500', text: 'text-rose-700' },
  { key: 'present', label: 'ΠΑΡΩΝ', color: 'bg-slate-400', text: 'text-slate-600' },
]

// Οπτικοποίηση αποτελεσμάτων ψηφοφορίας
export function ResultBars({ results, highlight }) {
  const pct = toPercentages(results)
  return (
    <div className="space-y-3">
      {config.map(({ key, label, color, text }) => (
        <div key={key}>
          <div className="mb-1 flex items-center justify-between text-sm">
            <span className={`font-semibold ${text} ${highlight === key ? '' : ''}`}>
              {label}
              {highlight === key && (
                <span className="ml-2 rounded-full bg-brand-50 px-2 py-0.5 text-[10px] font-bold text-brand-700">
                  Η ψήφος σας
                </span>
              )}
            </span>
            <span className="font-bold tabular-nums">{pct[key]}%</span>
          </div>
          <div className="h-2.5 w-full overflow-hidden rounded-full bg-slate-100">
            <div
              className={`h-full origin-left rounded-full ${color} animate-grow-x`}
              style={{ width: `${pct[key]}%` }}
            />
          </div>
        </div>
      ))}
      <p className="pt-1 text-xs text-slate-500">
        Συνολικές ψήφοι: <span className="font-semibold tabular-nums">{pct.total.toLocaleString('el-GR')}</span>
      </p>
    </div>
  )
}
