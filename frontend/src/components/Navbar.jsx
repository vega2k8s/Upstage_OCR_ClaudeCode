import { NavLink } from 'react-router-dom'

const links = [
  { to: '/', label: '🏠 홈', end: true },
  { to: '/history', label: '📋 지출 내역' },
  { to: '/stats', label: '📊 통계' },
]

export default function Navbar() {
  return (
    <nav className="bg-white border-b border-slate-200 sticky top-0 z-40">
      <div className="max-w-4xl mx-auto px-4 flex items-center gap-1 h-14">
        <span className="font-bold text-slate-800 mr-4 text-base">🧾 지출 관리</span>
        {links.map(({ to, label, end }) => (
          <NavLink
            key={to}
            to={to}
            end={end}
            className={({ isActive }) =>
              `px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                isActive
                  ? 'bg-blue-50 text-blue-600'
                  : 'text-slate-500 hover:text-slate-700 hover:bg-slate-100'
              }`
            }
          >
            {label}
          </NavLink>
        ))}
      </div>
    </nav>
  )
}
