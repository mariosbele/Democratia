import { Navigate, Outlet } from 'react-router-dom'
import { useApp } from '../context/AppContext.jsx'
import { BottomNav } from '../components/BottomNav.jsx'

// Κέλυφος εφαρμογής για συνδεδεμένους χρήστες: περιεχόμενο + κάτω μπάρα πλοήγησης.
// Προστατεύει τις σελίδες (redirect στη σύνδεση αν δεν υπάρχει authentication).
export function AppLayout() {
  const { isAuthenticated } = useApp()
  if (!isAuthenticated) return <Navigate to="/" replace />

  return (
    <div className="flex h-full flex-col overflow-hidden">
      <div className="flex-1 overflow-y-auto no-scrollbar">
        <Outlet />
      </div>
      <BottomNav />
    </div>
  )
}
