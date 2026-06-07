import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useApp } from '../context/AppContext.jsx'
import { Logo } from '../components/Logo.jsx'
import { IconBack, IconCheck } from '../components/Icons.jsx'

// Δημιουργία διαπιστευτηρίων μετά την επιτυχή ταυτοποίηση.
export function CreateCredentials() {
  const { login } = useApp()
  const navigate = useNavigate()
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [error, setError] = useState('')

  const mismatch = confirm.length > 0 && password !== confirm

  function handleSubmit(e) {
    e.preventDefault()
    if (password !== confirm) {
      setError('Οι κωδικοί δεν ταιριάζουν.')
      return
    }
    login()
    navigate('/app')
  }

  return (
    <div className="flex h-full flex-col overflow-y-auto no-scrollbar bg-white">
      <div className="flex items-center gap-3 px-4 pb-3 pt-7 sm:pt-9">
        <Link to="/signup" className="-ml-1 rounded-full p-1 text-slate-600 hover:bg-slate-100">
          <IconBack />
        </Link>
        <h1 className="text-lg font-bold">Δημιουργία διαπιστευτηρίων</h1>
      </div>

      <div className="flex-1 px-6 pt-4">
        <div className="flex items-center gap-3 rounded-xl bg-emerald-50 px-4 py-3 text-emerald-800">
          <IconCheck className="h-5 w-5" />
          <p className="text-sm font-medium">Η ταυτότητά σας επιβεβαιώθηκε επιτυχώς!</p>
        </div>

        <div className="mt-6 flex flex-col items-center text-center">
          <Logo className="h-12 w-12" />
          <h2 className="mt-3 text-lg font-bold">Νέα διαπιστευτήρια</h2>
          <p className="mt-1 text-sm text-slate-500">Επιλέξτε όνομα χρήστη και κωδικό για τον λογαριασμό σας.</p>
        </div>

        <form onSubmit={handleSubmit} className="mt-6 space-y-4">
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-600">Όνομα χρήστη</label>
            <input className="field" value={username} onChange={(e) => setUsername(e.target.value)} required />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-600">Κωδικός</label>
            <input
              type="password"
              className="field"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-600">Επιβεβαίωση κωδικού</label>
            <input
              type="password"
              className={`field ${mismatch ? 'border-rose-400 focus:border-rose-400 focus:ring-rose-100' : ''}`}
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              required
            />
            {mismatch && <p className="mt-1 text-xs text-rose-500">Οι κωδικοί δεν ταιριάζουν.</p>}
          </div>

          {error && !mismatch && <p className="text-sm text-rose-500">{error}</p>}

          <button type="submit" className="btn-primary w-full" disabled={mismatch || !password}>
            Δημιουργία λογαριασμού
          </button>
        </form>
      </div>
    </div>
  )
}
