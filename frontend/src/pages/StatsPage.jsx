import { useState, useEffect } from 'react'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend,
} from 'recharts'
import { getStats } from '../api/receiptApi'

const PIE_COLORS = [
  '#3b82f6', '#f59e0b', '#10b981', '#ef4444', '#8b5cf6',
  '#ec4899', '#14b8a6', '#f97316', '#6b7280',
]

const CATEGORY_COLORS = {
  '식비': 'bg-orange-100 text-orange-700',
  '카페/음료': 'bg-amber-100 text-amber-700',
  '편의점/마트': 'bg-green-100 text-green-700',
  '교통': 'bg-blue-100 text-blue-700',
  '의류/패션': 'bg-pink-100 text-pink-700',
  '생활용품': 'bg-teal-100 text-teal-700',
  '의료/건강': 'bg-red-100 text-red-700',
  '문화/여가': 'bg-purple-100 text-purple-700',
  '기타': 'bg-slate-100 text-slate-700',
}

function formatAmount(v) {
  if (v >= 10000) return `${(v / 10000).toFixed(1)}만`
  return `${v.toLocaleString()}`
}

const CustomBarTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null
  return (
    <div className="bg-white border border-slate-200 rounded-xl shadow-lg px-4 py-3 text-sm">
      <p className="text-slate-500 mb-1">{label}</p>
      <p className="font-semibold text-slate-800">{payload[0].value.toLocaleString()}원</p>
    </div>
  )
}

const CustomPieTooltip = ({ active, payload }) => {
  if (!active || !payload?.length) return null
  return (
    <div className="bg-white border border-slate-200 rounded-xl shadow-lg px-4 py-3 text-sm">
      <p className="font-medium text-slate-700">{payload[0].name}</p>
      <p className="text-slate-800">{payload[0].value.toLocaleString()}원</p>
      <p className="text-slate-400">{payload[0].payload.ratio}%</p>
    </div>
  )
}

export default function StatsPage() {
  const now = new Date()
  const [year, setYear] = useState(now.getFullYear())
  const [month, setMonth] = useState(now.getMonth() + 1)
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  useEffect(() => {
    const fetch = async () => {
      setLoading(true)
      setError(null)
      try {
        const res = await getStats(year, month)
        setData(res.data)
      } catch {
        setError('통계를 불러오지 못했습니다.')
      } finally {
        setLoading(false)
      }
    }
    fetch()
  }, [year, month])

  const diff = data ? data.total_amount - data.prev_month_amount : 0
  const diffPercent = data?.prev_month_amount > 0
    ? Math.round((diff / data.prev_month_amount) * 100)
    : null

  const years = Array.from({ length: 5 }, (_, i) => now.getFullYear() - i)
  const months = Array.from({ length: 12 }, (_, i) => i + 1)

  return (
    <div className="max-w-4xl mx-auto px-4 py-8 space-y-6">
      {/* ── 헤더 + 월 선택 ── */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <h1 className="text-xl font-bold text-slate-800">통계 대시보드</h1>
        <div className="flex gap-2">
          <select
            value={year}
            onChange={(e) => setYear(Number(e.target.value))}
            className="border border-slate-300 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
          >
            {years.map((y) => <option key={y} value={y}>{y}년</option>)}
          </select>
          <select
            value={month}
            onChange={(e) => setMonth(Number(e.target.value))}
            className="border border-slate-300 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
          >
            {months.map((m) => <option key={m} value={m}>{m}월</option>)}
          </select>
        </div>
      </div>

      {loading && (
        <div className="text-center py-20 text-slate-400">불러오는 중...</div>
      )}
      {error && (
        <div className="text-center py-20 text-red-400">{error}</div>
      )}

      {data && !loading && (
        <>
          {/* ── 요약 카드 ── */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="bg-white border border-slate-200 rounded-2xl p-5">
              <p className="text-sm text-slate-500 mb-1">이번 달 총 지출</p>
              <p className="text-2xl font-bold text-slate-800">
                {data.total_amount.toLocaleString()}원
              </p>
            </div>
            <div className="bg-white border border-slate-200 rounded-2xl p-5">
              <p className="text-sm text-slate-500 mb-1">전월 대비</p>
              <p className={`text-2xl font-bold ${diff > 0 ? 'text-red-500' : diff < 0 ? 'text-blue-500' : 'text-slate-800'}`}>
                {diff === 0 ? '변동 없음' : `${diff > 0 ? '+' : ''}${diff.toLocaleString()}원`}
              </p>
              {diffPercent !== null && (
                <p className="text-xs text-slate-400 mt-0.5">{diff > 0 ? '▲' : '▼'} {Math.abs(diffPercent)}%</p>
              )}
            </div>
            <div className="bg-white border border-slate-200 rounded-2xl p-5">
              <p className="text-sm text-slate-500 mb-1">지출 카테고리 수</p>
              <p className="text-2xl font-bold text-slate-800">{data.by_category.length}개</p>
              {data.by_category[0] && (
                <p className="text-xs text-slate-400 mt-0.5">최다 {data.by_category[0].category}</p>
              )}
            </div>
          </div>

          {/* ── 월별 지출 추이 막대 차트 ── */}
          <div className="bg-white border border-slate-200 rounded-2xl p-5">
            <h2 className="text-base font-semibold text-slate-700 mb-4">월별 지출 추이</h2>
            {data.monthly_trend.length === 0 ? (
              <p className="text-center text-slate-400 py-10">데이터가 없습니다.</p>
            ) : (
              <ResponsiveContainer width="100%" height={240}>
                <BarChart data={data.monthly_trend} margin={{ top: 4, right: 8, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                  <XAxis
                    dataKey="month"
                    tick={{ fontSize: 11, fill: '#94a3b8' }}
                    tickFormatter={(v) => v.slice(5)}
                  />
                  <YAxis
                    tick={{ fontSize: 11, fill: '#94a3b8' }}
                    tickFormatter={formatAmount}
                    width={50}
                  />
                  <Tooltip content={<CustomBarTooltip />} />
                  <Bar dataKey="amount" fill="#3b82f6" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>

          {/* ── 카테고리 파이 차트 + 목록 ── */}
          {data.by_category.length > 0 && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {/* 파이 차트 */}
              <div className="bg-white border border-slate-200 rounded-2xl p-5">
                <h2 className="text-base font-semibold text-slate-700 mb-4">카테고리별 비율</h2>
                <ResponsiveContainer width="100%" height={260}>
                  <PieChart>
                    <Pie
                      data={data.by_category}
                      dataKey="amount"
                      nameKey="category"
                      cx="50%"
                      cy="50%"
                      outerRadius={90}
                      innerRadius={50}
                      paddingAngle={2}
                    >
                      {data.by_category.map((_, i) => (
                        <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip content={<CustomPieTooltip />} />
                    <Legend
                      formatter={(v) => <span style={{ fontSize: 12, color: '#64748b' }}>{v}</span>}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>

              {/* 카테고리별 금액 목록 */}
              <div className="bg-white border border-slate-200 rounded-2xl p-5">
                <h2 className="text-base font-semibold text-slate-700 mb-4">카테고리별 지출</h2>
                <div className="space-y-3">
                  {data.by_category.map((item, i) => (
                    <div key={item.category}>
                      <div className="flex items-center justify-between mb-1">
                        <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${CATEGORY_COLORS[item.category] ?? CATEGORY_COLORS['기타']}`}>
                          {item.category}
                        </span>
                        <span className="text-sm font-semibold text-slate-700">
                          {item.amount.toLocaleString()}원
                          <span className="text-xs text-slate-400 font-normal ml-1">({item.ratio}%)</span>
                        </span>
                      </div>
                      {/* 비율 바 */}
                      <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
                        <div
                          className="h-full rounded-full transition-all duration-500"
                          style={{
                            width: `${item.ratio}%`,
                            backgroundColor: PIE_COLORS[i % PIE_COLORS.length],
                          }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {data.by_category.length === 0 && (
            <div className="bg-white border border-slate-200 rounded-2xl p-16 text-center text-slate-400">
              <p className="text-3xl mb-2">📭</p>
              <p>{year}년 {month}월에 등록된 지출 내역이 없습니다.</p>
            </div>
          )}
        </>
      )}
    </div>
  )
}
