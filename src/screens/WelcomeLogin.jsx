import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useApp } from '../context/AppContext.jsx'
import { Logo, Wordmark } from '../components/Logo.jsx'
import { IconShield } from '../components/Icons.jsx'
import * as auth from '../lib/auth.js'

// Σύνδεση απευθείας μέσω (προσομοιωμένου) Taxisnet — η διπλή ταυτοποίηση γίνεται
// από την κρατική υπηρεσία (gov.gr), όχι από την εφαρμογή.
export function WelcomeLogin() {
  const { completeLogin, acceptConsent } = useApp()
  const navigate = useNavigate()

  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [consent, setConsent] = useState(false)
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)

  const msg = (reason) => auth.AUTH_ERRORS[reason] || 'Κάτι πήγε στραβά. Δοκιμάστε ξανά.'

  async function handleLogin(e) {
    e.preventDefault()
    setError('')
    if (!consent) return setError('Πρέπει να αποδεχθείτε τους Όρους & την Πολιτική Απορρήτου.')
    setBusy(true)
    const r = await auth.startLogin(username, password, true)
    setBusy(false)
    if (!r.ok) return setError(msg(r.reason))
    acceptConsent()
    completeLogin(r.token, r.account)
    navigate('/app')
  }

  return (
    <div className="flex h-full flex-col overflow-y-auto no-scrollbar bg-gradient-to-b from-brand-700 to-brand-600 text-white">
      <div className="flex flex-col items-center px-6 pt-14 text-center sm:pt-16">
        <Logo className="h-16 w-16" light />
        <Wordmark light className="mt-3 text-3xl" />
        <p className="mt-2 text-sm text-white/80">Η φωνή σου στη δημοκρατία.</p>
      </div>

      <div className="mt-8 flex-1 rounded-t-[2rem] bg-white px-6 pb-8 pt-7 text-ink">
        <h1 className="text-xl font-bold">Σύνδεση μέσω Taxisnet</h1>
        <p className="mt-1 text-sm text-slate-500">
          Η ταυτοποίηση γίνεται μέσω της κρατικής υπηρεσίας (gov.gr) για να είναι κάθε λογαριασμός μοναδικός.
        </p>

        <form onSubmit={handleLogin} className="mt-6 space-y-3">
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-600">Όνομα χρήστη Taxisnet</label>
            <input className="field" value={username} onChange={(e) => setUsername(e.target.value)} placeholder="π.χ. mbelechris" autoComplete="username" />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-600">Κωδικός</label>
            <input type="password" className="field" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" autoComplete="current-password" />
          </div>

          <label className="flex items-start gap-2 text-xs text-slate-600">
            <input type="checkbox" className="mt-0.5" checked={consent} onChange={(e) => setConsent(e.target.checked)} />
            <span>
              Αποδέχομαι τους{' '}
              <Link to="/terms" className="font-semibold text-brand-700 underline">Όρους Χρήσης & την Πολιτική Απορρήτου</Link>.
            </span>
          </label>

          {error && <p className="rounded-lg bg-rose-50 px-3 py-2 text-sm text-rose-700">{error}</p>}

          <button type="submit" className="btn-primary mt-2 w-full" disabled={busy}>
            {busy ? 'Σύνδεση…' : 'Σύνδεση με Taxisnet'}
          </button>
        </form>

        <div className="mt-4 flex items-start gap-2 rounded-xl bg-brand-50 px-3 py-2.5 text-xs text-brand-800">
          <IconShield className="mt-0.5 h-4 w-4 shrink-0" />
          <span>Δοκιμαστικοί χρήστες (προσομοίωση): <strong>mbelechris</strong> / <strong>Demo!2024</strong>. Δες κι άλλους στη σελίδα όρων.</span>
        </div>

        <p className="mt-8 text-center text-[11px] leading-relaxed text-slate-400">
          Διαδραστικό πρωτότυπο — η ταυτοποίηση Taxisnet είναι προσομοίωση.
        </p>
      </div>
    </div>
  )
}
