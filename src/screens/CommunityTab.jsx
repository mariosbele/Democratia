import { useState } from 'react'
import { useApp } from '../context/AppContext.jsx'
import { formatDate } from '../lib/utils.js'
import { IconPlus, IconThumb } from '../components/Icons.jsx'

export function CommunityTab({ voting }) {
  const {
    currentUser,
    people,
    userComments,
    getComments,
    addComment,
    deleteComment,
    likedComments,
    toggleLike,
    following,
    toggleFollow,
  } = useApp()

  const [draft, setDraft] = useState('')
  const comments = getComments(voting.id)
  const mine = userComments[voting.id]
  const hasActiveComment = mine && !mine.deleted
  const blockedFromCommenting = mine?.deletedOnce // διέγραψε σχόλιο → δεν μπορεί ξανά
  const closed = voting.status === 'closed' // μετά τα τελικά αποτελέσματα τα likes κλείνουν

  function submit() {
    addComment(voting.id, draft)
    setDraft('')
  }

  return (
    <div className="space-y-4 px-4 py-4">
      {/* Κανόνες κοινότητας */}
      <div className="rounded-xl bg-amber-50 px-3 py-2.5 text-xs leading-relaxed text-amber-900">
        Τα σχόλια στην κοινότητα είναι <strong>επώνυμα</strong> και συνοδεύονται από το πλήρες όνομά
        σας. Ένα σχόλιο ανά ψήφισμα (έως 1000 χαρακτήρες), χωρίς δυνατότητα επεξεργασίας.
      </div>

      {/* Πεδίο σχολίου */}
      {hasActiveComment ? (
        <div className="rounded-2xl border border-brand-100 bg-brand-50/40 p-4">
          <p className="text-xs font-semibold text-brand-700">Το σχόλιό σας</p>
          <p className="mt-1.5 text-sm leading-relaxed text-ink">{mine.text}</p>
          <button
            onClick={() => deleteComment(voting.id)}
            className="mt-3 text-xs font-semibold text-rose-500 hover:underline"
          >
            Διαγραφή σχολίου
          </button>
          <p className="mt-1 text-[11px] text-slate-400">
            Προσοχή: μετά τη διαγραφή δεν θα μπορείτε να σχολιάσετε ξανά σε αυτό το ψήφισμα.
          </p>
        </div>
      ) : blockedFromCommenting ? (
        <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 text-center text-sm text-slate-500">
          Διαγράψατε το σχόλιό σας. Δεν είναι δυνατή η εκ νέου ανάρτηση σχολίου σε αυτό το ψήφισμα.
        </div>
      ) : (
        <div className="rounded-2xl border border-slate-100 bg-white p-3 shadow-card">
          <p className="mb-2 text-sm font-semibold text-ink">Γράψτε το σχόλιό σας:</p>
          <textarea
            value={draft}
            onChange={(e) => setDraft(e.target.value.slice(0, 1000))}
            rows={4}
            placeholder="Μοιραστείτε την άποψή σας με σεβασμό…"
            className="field resize-none"
          />
          <div className="mt-2 flex items-center justify-between">
            <span className="text-xs text-slate-400">{draft.length}/1000</span>
            <button onClick={submit} disabled={!draft.trim()} className="btn-primary px-5 py-2 text-sm">
              Δημοσίευση
            </button>
          </div>
        </div>
      )}

      {/* Λίστα σχολίων */}
      <div className="space-y-3">
        <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
          {comments.length} σχόλια
        </p>
        {comments.map((c) => {
          const author = people[c.authorId] || { fullName: 'Χρήστης' }
          const isMine = c.authorId === currentUser.id
          const liked = likedComments.includes(c.id)
          const likeCount = (c.likes || 0) + (liked ? 1 : 0)
          const isFollowing = following.includes(c.authorId)
          return (
            <div key={c.id} className="rounded-2xl border border-slate-100 bg-white p-4 shadow-card">
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-center gap-2.5">
                  <span className="flex h-9 w-9 items-center justify-center rounded-full bg-brand-100 text-sm font-bold text-brand-700">
                    {author.fullName.charAt(0)}
                  </span>
                  <div>
                    <div className="flex items-center gap-1.5">
                      <p className="text-sm font-semibold text-ink">{author.fullName}</p>
                      {author.isPolitician && (
                        <span className="chip bg-brand-600 px-1.5 py-0.5 text-[9px] text-white">
                          Πολιτικός
                        </span>
                      )}
                    </div>
                    <p className="text-[11px] text-slate-400">{formatDate(c.createdAt)}</p>
                  </div>
                </div>

                {!isMine && (
                  <button
                    onClick={() => toggleFollow(c.authorId)}
                    className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-semibold transition ${
                      isFollowing
                        ? 'bg-slate-100 text-slate-500'
                        : 'bg-brand-50 text-brand-700 hover:bg-brand-100'
                    }`}
                  >
                    {!isFollowing && <IconPlus className="h-3.5 w-3.5" />}
                    {isFollowing ? 'Ακολουθείτε' : 'Ακολούθησε'}
                  </button>
                )}
              </div>

              <p className="mt-2.5 text-sm leading-relaxed text-slate-700">{c.text}</p>

              <div className="mt-3 flex items-center">
                <button
                  onClick={() => !isMine && !closed && toggleLike(c.id)}
                  disabled={isMine || closed}
                  className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-sm font-semibold transition ${
                    liked ? 'bg-brand-600 text-white' : 'bg-slate-100 text-slate-600'
                  } ${isMine || closed ? 'cursor-not-allowed opacity-60' : 'hover:bg-brand-100 hover:text-brand-700'}`}
                  title={
                    isMine
                      ? 'Δεν μπορείτε να κάνετε like στο δικό σας σχόλιο'
                      : closed
                        ? 'Τα likes έκλεισαν μετά τα τελικά αποτελέσματα'
                        : 'Συμφωνώ'
                  }
                >
                  <IconThumb className="h-4 w-4" filled={liked} />
                  Συμφωνώ
                  <span className="tabular-nums">{likeCount}</span>
                </button>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
