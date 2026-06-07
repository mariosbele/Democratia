// Πλαίσιο "κινητού" ώστε η web εφαρμογή να μοιάζει με smartphone app στο desktop.
// Σε μικρές οθόνες (κινητό) γεμίζει όλη την οθόνη.
export function MobileFrame({ children }) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-slate-200 via-slate-100 to-brand-50 p-0 sm:p-6">
      <div className="relative h-screen w-full max-w-[420px] overflow-hidden bg-white shadow-phone sm:h-[860px] sm:max-h-[92vh] sm:rounded-[2.5rem] sm:ring-[10px] sm:ring-ink/90">
        {/* notch (μόνο σε desktop preview) */}
        <div className="pointer-events-none absolute left-1/2 top-0 z-30 hidden h-6 w-36 -translate-x-1/2 rounded-b-2xl bg-ink/90 sm:block" />
        <div className="flex h-full flex-col overflow-hidden">{children}</div>
      </div>
    </div>
  )
}
