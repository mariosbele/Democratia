import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useApp } from '../context/AppContext.jsx'
import { Logo, Wordmark } from './Logo.jsx'
import { IconBack, IconChevronDown } from './Icons.jsx'

// Κεφαλίδα: λογότυπο + drop-down κοινωνίας (γεωγραφικής περιοχής).
// Αν δοθεί `title`, εμφανίζει τίτλο σελίδας με κουμπί επιστροφής.
export function AppHeader({ title, showSociety = false }) {
  const { societies, activeSociety, setActiveSociety } = useApp()
  const [open, setOpen] = useState(false)
  const navigate = useNavigate()
  const society = societies.find((s) => s.id === activeSociety)

  return (
    <header className="z-20 shrink-0 bg-gradient-to-br from-brand-700 to-brand-600 px-4 pb-3 pt-7 text-white shadow-md sm:pt-8">
      <div className="flex items-center gap-3">
        {title ? (
          <>
            <button
              onClick={() => navigate(-1)}
              className="-ml-1 rounded-full p-1 transition hover:bg-white/10"
              aria-label="Επιστροφή"
            >
              <IconBack />
            </button>
            <h1 className="text-lg font-bold">{title}</h1>
          </>
        ) : (
          <>
            <Logo className="h-8 w-8" light />
            <Wordmark light className="text-xl" />
          </>
        )}
      </div>

      {showSociety && (
        <div className="relative mt-3">
          <button
            onClick={() => setOpen((o) => !o)}
            className="inline-flex items-center gap-1.5 rounded-full bg-white/15 px-3 py-1.5 text-sm font-semibold backdrop-blur transition hover:bg-white/25"
          >
            {society?.name}
            <IconChevronDown className={`h-4 w-4 transition ${open ? 'rotate-180' : ''}`} />
          </button>
          {open && (
            <div className="absolute left-0 top-full z-30 mt-2 w-48 overflow-hidden rounded-xl bg-white text-ink shadow-card animate-slide-up">
              {societies.map((s) => (
                <button
                  key={s.id}
                  onClick={() => {
                    setActiveSociety(s.id)
                    setOpen(false)
                  }}
                  className={`flex w-full items-center justify-between px-4 py-2.5 text-sm transition hover:bg-brand-50 ${
                    s.id === activeSociety ? 'font-semibold text-brand-700' : ''
                  }`}
                >
                  <span className="flex flex-col items-start">
                    <span>{s.name}</span>
                    {s.level && <span className="text-[11px] font-normal text-slate-400">{s.level}</span>}
                  </span>
                  {s.id === activeSociety && <span className="h-2 w-2 rounded-full bg-brand-600" />}
                </button>
              ))}
            </div>
          )}
        </div>
      )}
    </header>
  )
                  }
