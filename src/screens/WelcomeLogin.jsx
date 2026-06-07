import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useApp } from '../context/AppContext.jsx'
import { Logo, Wordmark } from '../components/Logo.jsx'

export function WelcomeLogin() {
  const { login } = useApp()
  const navigate = useNavigate()
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')

  function handleSubmit(e) {
    e.preventDefault()
    // Πρωτότυπο: οποιαδήποτε στοιχεία γίνονται δεκτά
    login()
    navigate('/app')
  }

  return (
    <div className="flex h-full flex-col overflow-y-auto no-scrollbar bg-gradient-to-b from-brand-700 to-brand-600 text-white">
      {/* Καλωσόρισμα */}
      <div className="flex flex-col items-center px-6 pt-16 text-center sm:pt-20">
        <Logo className="h-20 w-20" light />
        <Wordmark light className="mt-4 text-3xl" />
        <p className="mt-2 text-sm text-white/80">Η φωνή σου στη δημοκρατία.</p>
      </div>

      {/* Φόρμα εισόδου */}
      <div className="mt-10 flex-1 rounded-t-[2rem] bg-white px-6 pb-8 pt-7 text-ink">
        <h1 className="text-xl font-bold">Σύνδεση</h1>
        <p className="mt-1 text-sm text-slate-500">Καλώς ήρθατε ξανά.</p>

        <form onSubmit={handleSubmit} className="mt-6 space-y-3">
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-600">Όνομα χρήστη</label>
            <input
              className="field"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="π.χ. mbelechris"
              autoComplete="username"
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-600">Κωδικός</label>
            <input
              type="password"
              className="field"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              autoComplete="current-password"
            />
          </div>

          <button type="submit" className="btn-primary mt-2 w-full">
            Σύνδεση
          </button>
        </form>

        <div className="mt-5 space-y-2 text-center text-sm">
          <p className="text-slate-500">
            Νέος χρήστης;{' '}
            <Link to="/signup" className="font-semibold text-brand-700 hover:underline">
              Εγγραφή!
            </Link>
          </p>
          <p>
            <Link to="/reset" className="text-slate-400 hover:text-slate-600 hover:underline">
              Ξεχάσατε όνομα χρήστη / κωδικό; Επαναφορά εδώ.
            </Link>
          </p>
        </div>

        <p className="mt-8 text-center text-[11px] leading-relaxed text-slate-400">
          Διαδραστικό πρωτότυπο. Συμπληρώστε οποιαδήποτε στοιχεία για να συνδεθείτε.
        </p>
      </div>
    </div>
  )
}
