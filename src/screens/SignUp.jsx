import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Logo } from '../components/Logo.jsx'
import { IconBack, IconShield } from '../components/Icons.jsx'

const COUNTRIES = ['Ελλάδα', 'Κύπρος']

// Εγγραφή νέου χρήστη: Χώρα + Αριθμός Ταυτότητας → ταυτοποίηση μέσω Taxisnet (KYC).
export function SignUp() {
  const navigate = useNavigate()
  const [country, setCountry] = useState('Ελλάδα')
  const [idNumber, setIdNumber] = useState('')
  const [connecting, setConnecting] = useState(false)

  function handleContinue(e) {
    e.preventDefault()
    setConnecting(true)
    // Προσομοίωση ταυτοποίησης μέσω Taxisnet (στην πραγματική εφαρμογή απαιτεί
    // συνεργασία με την επίσημη βάση δεδομένων του κράτους).
    setTimeout(() => {
      navigate('/create-credentials')
    }, 1400)
  }

  return (
    <div className="flex h-full flex-col overflow-y-auto no-scrollbar bg-white">
      <div className="flex items-center gap-3 px-4 pb-3 pt-7 sm:pt-9">
        <Link to="/" className="-ml-1 rounded-full p-1 text-slate-600 hover:bg-slate-100">
          <IconBack />
        </Link>
        <h1 className="text-lg font-bold">Εγγραφή</h1>
      </div>

      <div className="flex-1 px-6 pt-4">
        <div className="flex flex-col items-center text-center">
          <Logo className="h-14 w-14" />
          <h2 className="mt-4 text-xl font-bold">Νέος χρήστης</h2>
          <p className="mt-1 text-sm text-slate-500">
            Η ταυτοποίηση γίνεται μέσω της επίσημης κρατικής βάσης για να διασφαλιστεί ότι κάθε
            λογαριασμός είναι μοναδικός.
          </p>
        </div>

        <form onSubmit={handleContinue} className="mt-8 space-y-4">
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-600">Χώρα</label>
            <select className="field" value={country} onChange={(e) => setCountry(e.target.value)}>
              {COUNTRIES.map((c) => (
                <option key={c}>{c}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-600">Αριθμός Ταυτότητας</label>
            <input
              className="field"
              value={idNumber}
              onChange={(e) => setIdNumber(e.target.value)}
              placeholder="π.χ. ΑΒ123456"
              required
            />
          </div>

          <div className="flex items-start gap-2 rounded-xl bg-brand-50 px-3 py-2.5 text-xs text-brand-800">
            <IconShield className="mt-0.5 h-4 w-4 shrink-0" />
            <span>Θα συνδεθείτε μέσω <strong>Taxisnet</strong>. Θα λάβετε κωδικό επιβεβαίωσης στο email ή το κινητό σας.</span>
          </div>

          <button type="submit" className="btn-primary w-full" disabled={connecting}>
            {connecting ? (
              <>
                <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white" />
                Σύνδεση μέσω Taxisnet…
              </>
            ) : (
              'Σύνδεση μέσω Taxisnet'
            )}
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-slate-500">
          Έχετε ήδη λογαριασμό;{' '}
          <Link to="/" className="font-semibold text-brand-700 hover:underline">
            Σύνδεση
          </Link>
        </p>
      </div>
    </div>
  )
}
