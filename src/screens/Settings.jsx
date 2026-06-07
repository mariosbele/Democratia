import { useApp } from '../context/AppContext.jsx'
import { AppHeader } from '../components/AppHeader.jsx'

function Toggle({ checked, onChange }) {
  return (
    <button
      onClick={() => onChange(!checked)}
      className={`relative h-6 w-11 shrink-0 rounded-full transition ${
        checked ? 'bg-brand-600' : 'bg-slate-300'
      }`}
      role="switch"
      aria-checked={checked}
    >
      <span
        className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition ${
          checked ? 'left-[22px]' : 'left-0.5'
        }`}
      />
    </button>
  )
}

export function Settings() {
  const { settings, updateSetting } = useApp()

  const notifRows = [
    { key: 'notifNewVoting', label: 'Νέο ψήφισμα διαθέσιμο' },
    { key: 'notifResults', label: 'Ανακοίνωση τελικών αποτελεσμάτων' },
    { key: 'notifLikes', label: 'Κάποιος συμφωνεί με το σχόλιό σας' },
  ]

  return (
    <div className="flex h-full flex-col">
      <AppHeader title="Ρυθμίσεις" />
      <div className="flex-1 space-y-5 bg-slate-50 px-4 py-4">
        {/* Ειδοποιήσεις */}
        <Group title="Ειδοποιήσεις">
          {notifRows.map((r, i) => (
            <Row key={r.key} label={r.label} last={i === notifRows.length - 1}>
              <Toggle checked={settings[r.key]} onChange={(v) => updateSetting(r.key, v)} />
            </Row>
          ))}
        </Group>

        {/* Διαπιστευτήρια */}
        <Group title="Διαπιστευτήρια">
          <Row label="Αλλαγή ονόματος χρήστη ή κωδικού" last>
            <button className="text-sm font-semibold text-brand-700 hover:underline">Αλλαγή</button>
          </Row>
        </Group>

        {/* Newsletter */}
        <Group title="Newsletter">
          <Row label="Εγγραφή στο newsletter της Democratia" last>
            <Toggle checked={settings.newsletter} onChange={(v) => updateSetting('newsletter', v)} />
          </Row>
        </Group>

        <p className="px-1 text-[11px] text-slate-400">
          Οι ρυθμίσεις αποθηκεύονται τοπικά σε αυτό το διαδραστικό πρωτότυπο.
        </p>
      </div>
    </div>
  )
}

function Group({ title, children }) {
  return (
    <div>
      <h2 className="mb-2 px-1 text-xs font-semibold uppercase tracking-wide text-slate-400">{title}</h2>
      <div className="overflow-hidden rounded-2xl border border-slate-100 bg-white shadow-card">
        {children}
      </div>
    </div>
  )
}

function Row({ label, children, last }) {
  return (
    <div
      className={`flex items-center justify-between gap-3 px-4 py-3.5 ${
        last ? '' : 'border-b border-slate-100'
      }`}
    >
      <span className="text-sm text-ink">{label}</span>
      {children}
    </div>
  )
}
