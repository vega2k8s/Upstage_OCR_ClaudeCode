import { NavLink } from 'react-router-dom'

const links = [
  { to: '/', label: '홈', end: true },
  { to: '/history', label: '지출 내역' },
  { to: '/stats', label: '통계' },
]

export default function Navbar() {
  return (
    <nav className="bg-white shadow-[0_1px_0_0_#f1f5f9] sticky top-0 z-40">
      <div className="max-w-4xl mx-auto px-4 flex items-center gap-1 h-14">
        <div className="flex items-center gap-2 mr-6">
          <span className="text-lg">🧾</span>
          <span className="font-semibold text-slate-800 text-sm tracking-tight">
            <span className="text-indigo-600">지출</span>관리
          </span>
        </div>
        {links.map(({ to, label, end }) => (
          <NavLink
            key={to}
            to={to}
            end={end}
            className={({ isActive }) =>
              `px-4 py-1.5 rounded-lg text-sm font-medium transition-all ${
                isActive
                  ? 'bg-indigo-50 text-indigo-600'
                  : 'text-slate-500 hover:text-slate-700 hover:bg-slate-50'
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
