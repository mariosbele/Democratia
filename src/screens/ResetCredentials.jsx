import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Logo } from '../components/Logo.jsx'
import { IconBack, IconCheck, IconShield } from '../components/Icons.jsx'

const COUNTRIES = ['Ελλάδα', 'Κύπρος']

// Επαναφορά διαπιστευτηρίων μέσω Ταυτότητας + Taxisnet.
export function ResetCredentials() {
  const navigate = useNavigate()
  const [country, setCountry] = useState('Ελλάδα')
  const [idNumber, setIdNumber] = useState('')
  const [done, setDone] = useState(false)

  function handleReset(e) {
    e.preventDefault()
    setDone(true)
    setTimeout(() => navigate('/'), 2200)
  }

  return (
    <div className="flex h-full flex-col overflow-y-auto no-scrollbar bg-white">
      <div className="flex items-center gap-3 px-4 pb-3 pt-7 sm:pt-9">
        <Link to="/" className="-ml-1 rounded-full p-1 text-slate-600 hover:bg-slate-100">
          <IconBack />
        </Link>
        <h1 className="text-lg font-bold">Επαναφορά διαπιστευτηρίων</h1>
      </div>

      <div className="flex-1 px-6 pt-4">
        <div className="flex flex-col items-center text-center">
          <Logo className="h-14 w-14" />
          <h2 className="mt-4 text-xl font-bold">Επαναφορά</h2>
          <p className="mt-1 text-sm text-slate-500">
            Ταυτοποιηθείτε ξανά μέσω Taxisnet για να επαναφέρετε τα στοιχεία σύνδεσής σας.
          </p>
        </div>

        {done ? (
          <div className="mt-8 flex flex-col items-center gap-3 rounded-xl bg-emerald-50 px-4 py-6 text-center text-emerald-800">
            <IconCheck className="h-8 w-8" />
            <p className="text-sm font-medium">
              Στάλθηκαν οδηγίες επαναφοράς. Ανακατεύθυνση στη σύνδεση…
            </p>
          </div>
        ) : (
          <form onSubmit={handleReset} className="mt-8 space-y-4">
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
              <span>Σύνδεση μέσω Taxisnet για επιβεβαίωση ταυτότητας.</span>
            </div>

            <button type="submit" className="btn-primary w-full">
              Επαναφορά
            </button>
          </form>
        )}
      </div>
    </div>
  )
}
