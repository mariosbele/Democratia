import { Link, useNavigate } from 'react-router-dom'
import { useApp } from '../context/AppContext.jsx'
import { AppHeader } from '../components/AppHeader.jsx'
import {
  IconChevron,
  IconClock,
  IconLogout,
  IconShield,
  IconUser,
} from '../components/Icons.jsx'

const menu = [
  { to: '/app/following', label: 'Ακολουθείτε', Icon: IconUser, showCount: true },
  { to: '/app/history', label: 'Ιστορικό', Icon: IconClock },
  { to: '/app/settings', label: 'Ρυθμίσεις', Icon: SettingsGlyph },
  { to: '/app/qa', label: 'Ερωτήσεις & Απαντήσεις', Icon: QAGlyph },
  { to: '/app/privacy', label: 'Απόρρητο', Icon: IconShield },
]

function SettingsGlyph({ className = 'h-5 w-5' }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="3" />
      <path d="M19.4 15a1.7 1.7 0 0 0 .3 1.9l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-2.9 1.2 2 2 0 1 1-4 0 1.7 1.7 0 0 0-2.9-1.2l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1A1.7 1.7 0 0 0 4.6 15a1.7 1.7 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1A1.7 1.7 0 0 0 4.6 9a1.7 1.7 0 0 0-.3-1.9l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.9.3H9a1.7 1.7 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.9-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.9V9a1.7 1.7 0 0 0 1.5 1h.1a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1Z" />
    </svg>
  )
}

function QAGlyph({ className = 'h-5 w-5' }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M9.1 9a3 3 0 1 1 4 2.8c-.8.3-1.1 1-1.1 1.7v.5" />
      <path d="M12 17h.01" />
      <circle cx="12" cy="12" r="9" />
    </svg>
  )
}

export function MyAccount() {
  const { currentUser, following, logout, exportMyData, deleteMyAccount } = useApp()
  const navigate = useNavigate()

  function handleLogout() {
    logout()
    navigate('/')
  }

  async function handleExport() {
    try {
      const data = await exportMyData()
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = 'democratia-ta-dedomena-mou.json'
      a.click()
      URL.revokeObjectURL(url)
    } catch {
      alert('Δεν ήταν δυνατή η εξαγωγή των δεδομένων αυτή τη στιγμή.')
    }
  }

  async function handleDelete() {
    if (!confirm('Διαγραφή λογαριασμού και όλων των στοιχείων ταυτότητας; Η ενέργεια είναι μη αναστρέψιμη.')) return
    await deleteMyAccount()
    navigate('/')
  }

  return (
    <div className="flex h-full flex-col">
      <AppHeader showSociety />
      <div className="flex-1 space-y-4 bg-slate-50 px-4 py-4">
        {/* Κάρτα προφίλ */}
        <div className="flex items-center gap-4 rounded-2xl border border-slate-100 bg-white p-4 shadow-card">
          <span className="flex h-14 w-14 items-center justify-center rounded-full bg-brand-100 text-xl font-bold text-brand-700">
            {currentUser.fullName.charAt(0)}
          </span>
          <div className="min-w-0">
            <p className="truncate text-base font-bold text-ink">{currentUser.fullName}</p>
            <p className="text-sm text-slate-500">@{currentUser.username}</p>
            <span className="chip mt-1 bg-brand-50 text-brand-700">Ρόλος: Πολίτης</span>
          </div>
        </div>

        {/* Μενού */}
        <div className="overflow-hidden rounded-2xl border border-slate-100 bg-white shadow-card">
          {menu.map(({ to, label, Icon, showCount }, i) => (
            <Link
              key={to}
              to={to}
              className={`flex items-center gap-3 px-4 py-3.5 transition hover:bg-slate-50 ${
                i !== menu.length - 1 ? 'border-b border-slate-100' : ''
              }`}
            >
              <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-slate-100 text-slate-600">
                <Icon className="h-5 w-5" />
              </span>
              <span className="flex-1 text-sm font-medium text-ink">{label}</span>
              {showCount && (
                <span className="rounded-full bg-brand-50 px-2 py-0.5 text-xs font-bold text-brand-700">
                  {following.length}
                </span>
              )}
              <IconChevron className="h-5 w-5 text-slate-300" />
            </Link>
          ))}
        </div>

        {/* GDPR: τα δεδομένα μου */}
        <div className="overflow-hidden rounded-2xl border border-slate-100 bg-white shadow-card">
          <div className="border-b border-slate-100 px-4 py-2.5">
            <p className="text-sm font-bold text-ink">Τα δεδομένα μου (GDPR)</p>
            <p className="text-[11px] text-slate-500">Δικαίωμα πρόσβασης & διαγραφής</p>
          </div>
          <button onClick={handleExport} className="flex w-full items-center gap-3 border-b border-slate-100 px-4 py-3.5 text-left transition hover:bg-slate-50">
            <span className="flex-1 text-sm font-medium text-ink">Εξαγωγή των δεδομένων μου</span>
            <span className="text-xs text-slate-400">JSON</span>
          </button>
          <button onClick={handleDelete} className="flex w-full items-center gap-3 px-4 py-3.5 text-left text-rose-600 transition hover:bg-rose-50">
            <span className="flex-1 text-sm font-medium">Διαγραφή λογαριασμού & δεδομένων</span>
          </button>
        </div>

        <button
          onClick={handleLogout}
          className="flex w-full items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-3.5 text-sm font-semibold text-rose-600 shadow-card transition hover:bg-rose-50"
        >
          <IconLogout className="h-5 w-5" /> Αποσύνδεση
        </button>
      </div>
    </div>
  )
}
