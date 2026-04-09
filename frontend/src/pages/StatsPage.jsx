import { useState, useEffect } from 'react'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend,
} from 'recharts'
import { getStats } from '../api/receiptApi'

const PIE_COLORS = [
  '#6366f1', '#f59e0b', '#10b981', '#f43f5e', '#8b5cf6',
  '#ec4899', '#14b8a6', '#f97316', '#94a3b8',
]

const CATEGORY_COLORS = {
  '식비': 'bg-orange-50 text-orange-600 ring-1 ring-orange-200',
  '카페/음료': 'bg-amber-50 text-amber-600 ring-1 ring-amber-200',
  '편의점/마트': 'bg-emerald-50 text-emerald-600 ring-1 ring-emerald-200',
  '교통': 'bg-blue-50 text-blue-600 ring-1 ring-blue-200',
  '의류/패션': 'bg-pink-50 text-pink-600 ring-1 ring-pink-200',
  '생활용품': 'bg-teal-50 text-teal-600 ring-1 ring-teal-200',
  '의료/건강': 'bg-red-50 text-red-600 ring-1 ring-red-200',
  '문화/여가': 'bg-purple-50 text-purple-600 ring-1 ring-purple-200',
  '기타': 'bg-slate-50 text-slate-500 ring-1 ring-slate-200',
}

const inputCls = 'border border-slate-200 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-400 bg-white transition-colors'

function formatAmount(v) {
  if (v >= 10000) return `${(v / 10000).toFixed(1)}만`
  return `${v.toLocaleString()}`
}

const CustomBarTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null
  return (
    <div className="bg-white border border-slate-100 rounded-xl shadow-lg px-4 py-3 text-sm">
      <p className="text-slate-400 text-xs mb-1">{label}</p>
      <p className="font-semibold text-slate-800">{payload[0].value.toLocaleString()}원</p>
    </div>
  )
}

const CustomPieTooltip = ({ active, payload }) => {
  if (!active || !payload?.length) return null
  return (
    <div className="bg-white border border-slate-100 rounded-xl shadow-lg px-4 py-3 text-sm">
      <p className="font-medium text-slate-700">{payload[0].name}</p>
      <p className="text-slate-800">{payload[0].value.toLocaleString()}원</p>
      <p className="text-slate-400 text-xs">{payload[0].payload.ratio}%</p>
    </div>
  )
}

const NULL_MONTH = 0

export default function StatsPage() {
  const now = new Date()
  const [year, setYear] = useState(now.getFullYear())
  const [month, setMonth] = useState(now.getMonth() + 1)
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  const isYearly = month === NULL_MONTH

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true)
      setError(null)
      try {
        const res = await getStats(year, isYearly ? null : month)
        setData(res.data)
      } catch {
        setError('통계를 불러오지 못했습니다.')
      } finally {
        setLoading(false)
      }
    }
    fetchData()
  }, [year, month, isYearly])

  const diff = data ? data.total_amount - data.prev_amount : 0
  const diffPercent = data?.prev_amount > 0
    ? Math.round((diff / data.prev_amount) * 100)
    : null

  const years = Array.from({ length: 5 }, (_, i) => now.getFullYear() - i)
  const months = Array.from({ length: 12 }, (_, i) => i + 1)

  const compareLabel = isYearly ? '전년 대비' : '전월 대비'
  const periodLabel = isYearly ? `${year}년 연간` : `${year}년 ${month}월`
  const trendTitle = isYearly ? `${year}년 월별 지출 추이` : '최근 12개월 지출 추이'

  return (
    <div className="max-w-4xl mx-auto px-4 py-8 space-y-6">
      {/* 헤더 + 기간 선택 */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-xl font-bold text-slate-800 tracking-tight">통계 대시보드</h1>
          <p className="text-xs text-slate-400 mt-0.5">{periodLabel} 지출 현황</p>
        </div>
        <div className="flex gap-2 items-center">
          <select
            value={year}
            onChange={(e) => setYear(Number(e.target.value))}
            className={inputCls}
          >
            {years.map((y) => <option key={y} value={y}>{y}년</option>)}
          </select>
          <select
            value={month}
            onChange={(e) => setMonth(Number(e.target.value))}
            className={inputCls}
          >
            <option value={NULL_MONTH}>전체 (연간)</option>
            {months.map((m) => <option key={m} value={m}>{m}월</option>)}
          </select>
        </div>
      </div>

      {loading && (
        <div className="flex justify-center items-center py-24">
          <div className="w-6 h-6 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
        </div>
      )}
      {error && (
        <div className="text-center py-20 text-rose-400 text-sm">{error}</div>
      )}

      {data && !loading && (
        <>
          {/* 요약 카드 */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="bg-white border border-slate-100 border-l-4 border-l-indigo-500 rounded-xl shadow-sm p-5">
              <p className="text-xs text-slate-400 font-medium uppercase tracking-wide mb-2">
                {isYearly ? `${year}년 총 지출` : `${month}월 총 지출`}
              </p>
              <p className="text-2xl font-bold text-slate-800">
                {data.total_amount.toLocaleString()}원
              </p>
            </div>

            <div className={`bg-white border border-slate-100 rounded-xl shadow-sm p-5 ${
              diff > 0 ? 'border-l-4 border-l-rose-400' : diff < 0 ? 'border-l-4 border-l-emerald-400' : 'border-l-4 border-l-slate-200'
            }`}>
              <p className="text-xs text-slate-400 font-medium uppercase tracking-wide mb-2">{compareLabel}</p>
              {data.prev_amount === 0 && diff === 0 ? (
                <p className="text-2xl font-bold text-slate-300">데이터 없음</p>
              ) : (
                <>
                  <p className={`text-2xl font-bold ${diff > 0 ? 'text-rose-500' : diff < 0 ? 'text-emerald-500' : 'text-slate-800'}`}>
                    {diff === 0 ? '변동 없음' : `${diff > 0 ? '+' : ''}${diff.toLocaleString()}원`}
                  </p>
                  {diffPercent !== null && (
                    <p className="text-xs text-slate-400 mt-1">
                      {diff > 0 ? '▲' : '▼'} {Math.abs(diffPercent)}%
                    </p>
                  )}
                </>
              )}
            </div>

            <div className="bg-white border border-slate-100 border-l-4 border-l-violet-400 rounded-xl shadow-sm p-5">
              <p className="text-xs text-slate-400 font-medium uppercase tracking-wide mb-2">지출 카테고리</p>
              <p className="text-2xl font-bold text-slate-800">{data.by_category.length}개</p>
              {data.by_category[0] && (
                <p className="text-xs text-slate-400 mt-1">
                  최다 {data.by_category[0].category}
                </p>
              )}
            </div>
          </div>

          {/* 추이 막대 차트 */}
          {(!isYearly && data.total_amount === 0) ? null : (
            <div className="bg-white border border-slate-100 rounded-2xl shadow-sm p-5">
              <h2 className="text-sm font-semibold text-slate-600 uppercase tracking-wider mb-5">{trendTitle}</h2>
              {data.monthly_trend.filter(t => t.amount > 0).length === 0 ? (
                <p className="text-center text-slate-300 py-10 text-sm">데이터가 없습니다.</p>
              ) : (
                <ResponsiveContainer width="100%" height={240}>
                  <BarChart data={data.monthly_trend} margin={{ top: 4, right: 8, left: 0, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f8fafc" />
                    <XAxis
                      dataKey="month"
                      tick={{ fontSize: 11, fill: '#94a3b8' }}
                      tickFormatter={(v) => {
                        const [y, m] = v.split('-')
                        const multiYear = new Set(data.monthly_trend.map(t => t.month.slice(0, 4))).size > 1
                        return multiYear ? `${y.slice(2)}.${m}` : `${parseInt(m)}월`
                      }}
                    />
                    <YAxis
                      tick={{ fontSize: 11, fill: '#94a3b8' }}
                      tickFormatter={formatAmount}
                      width={52}
                    />
                    <Tooltip content={<CustomBarTooltip />} />
                    <Bar dataKey="amount" radius={[6, 6, 0, 0]}>
                      {data.monthly_trend.map((entry, i) => (
                        <Cell
                          key={i}
                          fill={!isYearly && entry.month === `${year}-${String(month).padStart(2, '0')}` ? '#4338ca' : '#6366f1'}
                          fillOpacity={entry.amount === 0 ? 0.25 : 1}
                        />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              )}
            </div>
          )}

          {/* 카테고리 파이 차트 + 목록 */}
          {data.by_category.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-white border border-slate-100 rounded-2xl shadow-sm p-5">
                <h2 className="text-sm font-semibold text-slate-600 uppercase tracking-wider mb-4">카테고리별 비율</h2>
                <ResponsiveContainer width="100%" height={260}>
                  <PieChart>
                    <Pie
                      data={data.by_category}
                      dataKey="amount"
                      nameKey="category"
                      cx="50%"
                      cy="50%"
                      outerRadius={90}
                      innerRadius={52}
                      paddingAngle={2}
                    >
                      {data.by_category.map((_, i) => (
                        <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip content={<CustomPieTooltip />} />
                    <Legend formatter={(v) => <span style={{ fontSize: 12, color: '#64748b' }}>{v}</span>} />
                  </PieChart>
                </ResponsiveContainer>
              </div>

              <div className="bg-white border border-slate-100 rounded-2xl shadow-sm p-5">
                <h2 className="text-sm font-semibold text-slate-600 uppercase tracking-wider mb-5">카테고리별 지출</h2>
                <div className="space-y-4">
                  {data.by_category.map((item, i) => (
                    <div key={item.category}>
                      <div className="flex items-center justify-between mb-1.5">
                        <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${CATEGORY_COLORS[item.category] ?? CATEGORY_COLORS['기타']}`}>
                          {item.category}
                        </span>
                        <span className="text-sm font-semibold text-slate-700">
                          {item.amount.toLocaleString()}원
                          <span className="text-xs text-slate-400 font-normal ml-1">({item.ratio}%)</span>
                        </span>
                      </div>
                      <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
                        <div
                          className="h-full rounded-full transition-all duration-700"
                          style={{ width: `${item.ratio}%`, backgroundColor: PIE_COLORS[i % PIE_COLORS.length] }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-white border border-slate-100 rounded-2xl shadow-sm p-16 text-center">
              <div className="w-12 h-12 bg-slate-50 rounded-2xl flex items-center justify-center mx-auto mb-3">
                <svg className="w-6 h-6 text-slate-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 3v11.25A2.25 2.25 0 006 16.5h2.25M3.75 3h-1.5m1.5 0h16.5m0 0h1.5m-1.5 0v11.25A2.25 2.25 0 0118 16.5h-2.25m-7.5 0h7.5m-7.5 0l-1 3m8.5-3l1 3m0 0l.5 1.5m-.5-1.5h-9.5m0 0l-.5 1.5M9 11.25v1.5M12 9v3.75m3-6v6" />
                </svg>
              </div>
              <p className="text-sm text-slate-400">{periodLabel}에 등록된 지출 내역이 없습니다.</p>
            </div>
          )}
        </>
      )}
    </div>
  )
}
