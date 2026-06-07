import { useMemo, useState } from 'react'
import { useParams } from 'react-router-dom'
import { useApp } from '../context/AppContext.jsx'
import { VOTINGS } from '../data/mockData.js'
import { AppHeader } from '../components/AppHeader.jsx'
import { AiSummary } from '../components/AiSummary.jsx'
import { ResultBars } from '../components/ResultBars.jsx'
import { CommunityTab } from './CommunityTab.jsx'
import { CATEGORY_COLORS, CHOICE_LABELS, formatDate, latestAnnouncedPhase } from '../lib/utils.js'
import { IconClock, IconShare } from '../components/Icons.jsx'

export function VotingPage() {
  const { id } = useParams()
  const { votes, castVote } = useApp()
  const [tab, setTab] = useState('voting')
  const [shared, setShared] = useState(false)

  const voting = useMemo(() => VOTINGS.find((v) => v.id === id), [id])
  if (!voting) {
    return (
      <div className="flex h-full flex-col">
        <AppHeader title="Ψήφισμα" />
        <p className="p-6 text-sm text-slate-500">Το ψήφισμα δεν βρέθηκε.</p>
      </div>
    )
  }

  const myVote = votes[voting.id]
  const closed = voting.status === 'closed'
  const phase = latestAnnouncedPhase(voting)

  function handleShare() {
    setShared(true)
    setTimeout(() => setShared(false), 2200)
  }

  return (
    <div className="flex h-full flex-col">
      <AppHeader title="Ψήφισμα" />

      {/* Tabs: Ψηφοφορία / Κοινότητα */}
      <div className="shrink-0 border-b border-slate-100 bg-white px-4">
        <div className="flex gap-6">
          {[
            { id: 'voting', label: 'Ψηφοφορία' },
            { id: 'community', label: 'Κοινότητα' },
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

      <div className="flex-1 overflow-y-auto no-scrollbar bg-slate-50">
        {tab === 'voting' ? (
          <div className="space-y-4 px-4 py-4">
            {/* Επικεφαλίδα ψηφίσματος */}
            <div>
              <div className="flex items-center justify-between">
                <span
                  className={`chip ${CATEGORY_COLORS[voting.category] || 'bg-slate-100 text-slate-700'}`}
                >
                  {voting.category}
                </span>
                <button
                  onClick={handleShare}
                  className="inline-flex items-center gap-1.5 rounded-full bg-white px-3 py-1.5 text-xs font-semibold text-brand-700 shadow-card transition hover:bg-brand-50"
                >
                  <IconShare className="h-4 w-4" /> Κοινοποίηση
                </button>
              </div>
              <h2 className="mt-2 text-xl font-bold leading-snug">{voting.title}</h2>
              <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-500">
                <span className="inline-flex items-center gap-1">
                  <IconClock className="h-3.5 w-3.5" /> Δημοσιεύθηκε {formatDate(voting.uploadedAt)}
                </span>
                {!closed && (
                  <span className="inline-flex items-center gap-1 font-medium text-brand-600">
                    Ψηφίστε έως {formatDate(voting.voteDeadline)}
                  </span>
                )}
              </div>
            </div>

            {/* Σύνοψη AI */}
            <AiSummary summary={voting.aiSummary} />

            {/* Ψηφοφορία / Αποτελέσματα */}
            <div className="rounded-2xl border border-slate-100 bg-white p-4 shadow-card">
              {!myVote && !closed ? (
                <>
                  <p className="mb-3 text-sm font-semibold text-ink">Ποια είναι η ψήφος σας;</p>
                  <div className="grid grid-cols-3 gap-2">
                    <VoteButton onClick={() => castVote(voting.id, 'yes')} variant="yes">
                      ΝΑΙ
                    </VoteButton>
                    <VoteButton onClick={() => castVote(voting.id, 'no')} variant="no">
                      ΟΧΙ
                    </VoteButton>
                    <VoteButton onClick={() => castVote(voting.id, 'present')} variant="present">
                      ΠΑΡΩΝ
                    </VoteButton>
                  </div>
                  <p className="mt-3 text-[11px] text-slate-400">
                    Η ψήφος σας είναι ανώνυμη και αμετάκλητη — δεν μπορεί να αλλάξει ή να διαγραφεί.
                  </p>
                </>
              ) : (
                <>
                  <div className="mb-3 flex items-center justify-between">
                    <p className="text-sm font-semibold text-ink">
                      {closed ? 'Τελικά αποτελέσματα' : phase ? phase.label : 'Αποτελέσματα'}
                    </p>
                    {myVote && (
                      <span className="chip bg-brand-50 text-brand-700">
                        Ψηφίσατε: {CHOICE_LABELS[myVote]}
                      </span>
                    )}
                  </div>
                  {phase ? (
                    <ResultBars results={phase.results} highlight={myVote} />
                  ) : (
                    <p className="text-sm text-slate-500">
                      Έχετε ψηφίσει. Τα αποτελέσματα θα ανακοινωθούν σε επόμενη φάση.
                    </p>
                  )}
                </>
              )}
            </div>

            {/* Χρονοδιάγραμμα ανακοινώσεων (έως 3 φάσεις) */}
            <PhaseTimeline voting={voting} />
          </div>
        ) : (
          <CommunityTab voting={voting} />
        )}
      </div>

      {/* Μήνυμα κοινοποίησης */}
      {shared && (
        <div className="pointer-events-none absolute inset-x-0 bottom-6 z-40 flex justify-center px-6">
          <div className="rounded-full bg-ink/90 px-4 py-2 text-sm text-white shadow-lg animate-slide-up">
            Ο σύνδεσμος αντιγράφηκε — μοιραστείτε το ψήφισμα!
          </div>
        </div>
      )}
    </div>
  )
}

function VoteButton({ children, onClick, variant }) {
  const styles = {
    yes: 'border-emerald-200 text-emerald-700 hover:bg-emerald-500 hover:text-white hover:border-emerald-500',
    no: 'border-rose-200 text-rose-700 hover:bg-rose-500 hover:text-white hover:border-rose-500',
    present: 'border-slate-200 text-slate-600 hover:bg-slate-500 hover:text-white hover:border-slate-500',
  }
  return (
    <button
      onClick={onClick}
      className={`rounded-xl border-2 py-3.5 text-sm font-bold transition active:scale-95 ${styles[variant]}`}
    >
      {children}
    </button>
  )
}

function PhaseTimeline({ voting }) {
  if (!voting.phases?.length) return null
  return (
    <div className="rounded-2xl border border-slate-100 bg-white p-4 shadow-card">
      <p className="mb-3 text-sm font-semibold text-ink">Ανακοινώσεις αποτελεσμάτων</p>
      <ol className="relative space-y-4 border-l border-slate-200 pl-5">
        {voting.phases.map((p, i) => (
          <li key={i} className="relative">
            <span
              className={`absolute -left-[27px] top-0.5 h-3.5 w-3.5 rounded-full border-2 border-white ${
                p.announced ? 'bg-brand-600' : 'bg-slate-300'
              }`}
            />
            <div className="flex items-center justify-between">
              <span className={`text-sm font-medium ${p.announced ? 'text-ink' : 'text-slate-400'}`}>
                {p.label}
              </span>
              <span className="text-xs text-slate-400">{formatDate(p.date)}</span>
            </div>
            <p className="text-xs text-slate-400">
              {p.announced ? 'Ανακοινώθηκε' : 'Σε αναμονή'}
            </p>
          </li>
        ))}
      </ol>
    </div>
  )
}
