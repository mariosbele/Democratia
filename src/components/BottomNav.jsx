import { NavLink } from 'react-router-dom'
import { useApp } from '../context/AppContext.jsx'
import { IconBell, IconHome, IconUser } from './Icons.jsx'

const items = [
  { to: '/app', label: 'Αρχική', Icon: IconHome, end: true },
  { to: '/app/notifications', label: 'Ειδοποιήσεις', Icon: IconBell },
  { to: '/app/account', label: 'Λογαριασμός', Icon: IconUser },
]

export function BottomNav() {
  const { notifications } = useApp()
  const unread = notifications.filter((n) => n.isNew).length

  return (
    <nav className="z-20 shrink-0 border-t border-slate-200 bg-white/95 px-2 pb-2 pt-1.5 backdrop-blur">
      <div className="flex items-stretch justify-around">
        {items.map(({ to, label, Icon, end }) => (
          <NavLink
            key={to}
            to={to}
            end={end}
            className={({ isActive }) =>
              `relative flex flex-1 flex-col items-center gap-0.5 rounded-xl py-1.5 text-[11px] font-medium transition ${
                isActive ? 'text-brand-700' : 'text-slate-400 hover:text-slate-600'
              }`
            }
          >
            <span className="relative">
              <Icon className="h-6 w-6" />
              {to === '/app/notifications' && unread > 0 && (
                <span className="absolute -right-1.5 -top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-rose-500 px-1 text-[9px] font-bold text-white">
                  {unread}
                </span>
              )}
            </span>
            {label}
          </NavLink>
        ))}
      </div>
    </nav>
  )
}
