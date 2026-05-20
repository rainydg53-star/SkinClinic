import { useEffect, useState } from 'react'
import { adminGetReservationStats } from '@/api/reservationApi'
import './AdminMainPage.css'
import { API_BASE_URL } from '@/config/api'

const SATISFACTION_STATS_PATH = '/admin/satisfaction'

const PERIOD_OPTIONS = [
  { key: 'TODAY', label: '오늘' },
  { key: '7D', label: '최근 7일' },
  { key: '30D', label: '최근 30일' },
  { key: 'MONTHLY', label: '월별' },
  { key: 'ALL', label: '전체' },
]

const getCurrentYearMonth = () => {
  const now = new Date()
  const year = now.getFullYear()
  const month = String(now.getMonth() + 1).padStart(2, '0')
  return `${year}-${month}`
}

const parseYearMonth = (value) => {
  const [yearText, monthText] = String(value || getCurrentYearMonth()).split('-')
  const year = Number(yearText)
  const month = Number(monthText)
  const now = new Date()

  return {
    year: Number.isFinite(year) ? year : now.getFullYear(),
    month: Number.isFinite(month) ? month : now.getMonth() + 1,
  }
}

function AdminMainPage() {
  const now = new Date()
  const currentYear = now.getFullYear()
  const currentMonth = now.getMonth() + 1
  const startYear = currentYear - 5

  const yearOptions = Array.from(
    { length: currentYear - startYear + 1 },
    (_, index) => startYear + index,
  ).reverse()

  const monthOptions = Array.from({ length: 12 }, (_, index) => index + 1)

  const initialPending = parseYearMonth(getCurrentYearMonth())

  const [summary, setSummary] = useState(null)
  const [reservationStats, setReservationStats] = useState(null)
  const [loading, setLoading] = useState(true)
  const [downloading, setDownloading] = useState(false)
  const [period, setPeriod] = useState('30D')
  const [periodMonth, setPeriodMonth] = useState(getCurrentYearMonth())
  const [monthModalOpen, setMonthModalOpen] = useState(false)
  const [pendingYear, setPendingYear] = useState(initialPending.year)
  const [pendingMonth, setPendingMonth] = useState(initialPending.month)
  const [topProcedureTab, setTopProcedureTab] = useState('revenue')
  const [selectedMonth, setSelectedMonth] = useState(currentMonth)
  const [errorMessage, setErrorMessage] = useState('')

  const formatNumber = (value) => Number(value || 0).toLocaleString('ko-KR')

  const formatRate = (value) => {
    const number = Number(value || 0)
    const sign = number > 0 ? '+' : ''
    return `${sign}${number.toFixed(1)}%`
  }

  const fetchSummary = async (selectedPeriod, selectedPeriodMonth) => {
    try {
      setLoading(true)
      setErrorMessage('')

      const query = new URLSearchParams({ period: selectedPeriod })
      if (selectedPeriod === 'MONTHLY') {
        query.set('month', selectedPeriodMonth || getCurrentYearMonth())
      }

      const response = await fetch(
        `${API_BASE_URL}/api/admin/dashboard/summary?${query.toString()}`,
        {
          credentials: 'include',
        },
      )

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.message || '대시보드 통계 데이터를 불러오지 못했습니다.')
      }

      setSummary(data)
    } catch (error) {
      setErrorMessage(error.message || '알 수 없는 오류가 발생했습니다.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchSummary(period, periodMonth)
  }, [period, periodMonth])

  useEffect(() => {
    const today = new Date().toISOString().slice(0, 10)
    adminGetReservationStats(today)
      .then((data) => setReservationStats(data))
      .catch(() => setReservationStats(null))
  }, [])

  useEffect(() => {
    if (!summary?.monthlySalesTrend?.length) return

    const months = summary.monthlySalesTrend.map((item) => Number(item.month))
    const currentMonthNumber = new Date().getMonth() + 1
    setSelectedMonth(months.includes(currentMonthNumber) ? currentMonthNumber : months[0])
  }, [summary])

  const handlePeriodClick = (nextPeriod) => {
    if (nextPeriod === 'MONTHLY') {
      const parsed = parseYearMonth(periodMonth)
      setPendingYear(parsed.year)
      setPendingMonth(parsed.month)
      setMonthModalOpen(true)
      return
    }

    setPeriod(nextPeriod)
  }

  const handleApplyMonthlyPeriod = () => {
    const safeMonth = String(
      Math.min(Math.max(Number(pendingMonth) || 1, 1), 12),
    ).padStart(2, '0')

    setPeriodMonth(`${pendingYear}-${safeMonth}`)
    setPeriod('MONTHLY')
    setMonthModalOpen(false)
  }

  const handleDownloadExcel = async () => {
    try {
      setDownloading(true)
      setErrorMessage('')

      const response = await fetch(
        `${API_BASE_URL}/api/admin/dashboard/statistics/excel`,
        {
          credentials: 'include',
        },
      )

      if (!response.ok) {
        let message = '통계 엑셀 파일을 다운로드하지 못했습니다.'
        try {
          const data = await response.json()
          message = data.message || message
        } catch {
          // 기본 메시지 유지
        }
        throw new Error(message)
      }

      const blob = await response.blob()
      const disposition = response.headers.get('content-disposition') || ''
      const utf8Match = disposition.match(/filename\*=UTF-8''([^;]+)/i)
      const plainMatch = disposition.match(/filename="([^"]+)"/i)
      const decodedUtf8Name = utf8Match?.[1] ? decodeURIComponent(utf8Match[1]) : ''
      const fileName =
        decodedUtf8Name || plainMatch?.[1] || `통계_데이터_${Date.now()}.xlsx`

      const objectUrl = window.URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = objectUrl
      link.download = fileName
      document.body.appendChild(link)
      link.click()
      link.remove()
      window.URL.revokeObjectURL(objectUrl)
    } catch (error) {
      setErrorMessage(error.message || '다운로드 중 오류가 발생했습니다.')
    } finally {
      setDownloading(false)
    }
  }

  if (loading) {
    return (
      <section className="admin-main-page">
        <div className="admin-main-header">
          <div>
            <h2>관리자 대시보드</h2>
            <p>통계 데이터를 불러오는 중입니다.</p>
          </div>
        </div>
      </section>
    )
  }

  if (!summary) {
    return (
      <section className="admin-main-page">
        <div className="admin-main-header">
          <div>
            <h2>관리자 대시보드</h2>
            <p>통계 데이터를 불러오지 못했습니다.</p>
          </div>
        </div>
        {errorMessage && <p className="admin-main-error">{errorMessage}</p>}
      </section>
    )
  }

  const rateClass =
    Number(summary.weekOverWeekChangeRate) > 0
      ? 'positive'
      : Number(summary.weekOverWeekChangeRate) < 0
        ? 'negative'
        : 'neutral'

  const topProcedures =
    topProcedureTab === 'revenue'
      ? summary.topProceduresByRevenue || []
      : summary.topProceduresByCount || []

  const monthlySalesTrend = summary.monthlySalesTrend || []
  const maxMonthlySales = Math.max(
    ...monthlySalesTrend.map((item) => Number(item.salesAmount || 0)),
    1,
  )

  const chartWidth = 1200
  const chartHeight = 190
  const chartTop = 16
  const chartBottom = 168
  const chartRange = chartBottom - chartTop
  const gridPercents = [0, 25, 50, 75, 100]

  const monthlyLinePoints = monthlySalesTrend.map((item, index) => {
    const amount = Number(item.salesAmount || 0)
    const x = ((index + 0.5) / Math.max(monthlySalesTrend.length, 1)) * chartWidth
    const y = chartBottom - (amount / maxMonthlySales) * chartRange

    return {
      x,
      y,
      amount,
      month: item.month,
    }
  })

  const monthlyPolyline = monthlyLinePoints
    .map((point) => `${point.x},${point.y}`)
    .join(' ')

  const selectedMonthlyPoint =
    monthlySalesTrend.find((item) => Number(item.month) === Number(selectedMonth)) || {
      month: selectedMonth,
      salesAmount: 0,
    }

  return (
    <section className="admin-main-page">
      <div className="admin-main-header">
        <div>
          <h2>관리자 대시보드</h2>
          <p>예약, 결제, 회원, 매출 현황을 한눈에 확인할 수 있습니다.</p>
        </div>
        <button type="button" onClick={handleDownloadExcel} disabled={downloading}>
          {downloading ? '엑셀 다운로드 중...' : '통계 엑셀 다운로드 (Excel)'}
        </button>
      </div>

      <div className="admin-main-period-filter">
        {PERIOD_OPTIONS.map((option) => (
          <button
            key={option.key}
            type="button"
            className={period === option.key ? 'active' : ''}
            onClick={() => handlePeriodClick(option.key)}
            disabled={loading}
          >
            {option.label}
          </button>
        ))}
        <span className="admin-main-period-label">조회 기간: {summary.period}</span>
      </div>

      {monthModalOpen && (
        <div
          className="admin-main-month-modal-backdrop"
          onClick={() => setMonthModalOpen(false)}
        >
          <div
            className="admin-main-month-modal"
            onClick={(event) => event.stopPropagation()}
          >
            <h4>월별 조회 기간 설정</h4>
            <p>조회할 연도와 월을 선택해주세요.</p>

            <div className="admin-main-month-modal-fields">
              <label>
                <span>월</span>
                <select
                  value={pendingMonth}
                  onChange={(event) => setPendingMonth(Number(event.target.value))}
                >
                  {monthOptions.map((month) => (
                    <option
                      key={`month-${month}`}
                      value={month}
                      disabled={pendingYear === currentYear && month > currentMonth}
                    >
                      {month}월
                    </option>
                  ))}
                </select>
              </label>

              <label>
                <span>연도</span>
                <select
                  value={pendingYear}
                  onChange={(event) => {
                    const nextYear = Number(event.target.value)
                    setPendingYear(nextYear)
                    if (nextYear === currentYear && pendingMonth > currentMonth) {
                      setPendingMonth(currentMonth)
                    }
                  }}
                >
                  {yearOptions.map((year) => (
                    <option key={`year-${year}`} value={year}>
                      {year}년
                    </option>
                  ))}
                </select>
              </label>
            </div>

            <div className="admin-main-month-modal-actions">
              <button type="button" onClick={() => setMonthModalOpen(false)}>
                취소
              </button>
              <button type="button" className="apply" onClick={handleApplyMonthlyPeriod}>
                적용
              </button>
            </div>
          </div>
        </div>
      )}

      {errorMessage && <p className="admin-main-error">{errorMessage}</p>}

      <div className="admin-main-kpi-grid">
        <article className="admin-main-kpi-card">
          <span>전체 회원 수</span>
          <strong>{formatNumber(summary.memberCount)}명</strong>
        </article>

        <article className="admin-main-kpi-card">
          <span>전체 결제 건수</span>
          <strong>{formatNumber(summary.paymentCount)}건</strong>
        </article>

        <article className="admin-main-kpi-card">
          <span>조회 기간 총 결제 금액</span>
          <strong>{formatNumber(summary.paidAmountTotal)}원</strong>
        </article>

        <article className="admin-main-kpi-card">
          <span>예약 현황</span>
          <strong>{formatNumber(reservationStats?.todayCount)}건</strong>
          <small>당일 예약자 기준</small>
        </article>
      </div>

      <div className="admin-main-sales-grid">
        <article className="admin-main-kpi-card">
          <span>연간 총 매출</span>
          <strong>{formatNumber(summary.yearlySalesTotal)}원</strong>
        </article>

        <article className="admin-main-kpi-card">
          <span>연간 월평균 매출</span>
          <strong>{formatNumber(summary.yearlyMonthlyAverageSales)}원</strong>
        </article>

        <article className="admin-main-kpi-card">
          <span>이번 달 매출</span>
          <strong>{formatNumber(summary.monthlySalesTotal)}원</strong>
        </article>

        <article className="admin-main-kpi-card">
          <span>이번 달 신규 회원 수</span>
          <strong>{formatNumber(summary.monthlyNewMembersCount)}명</strong>
        </article>

        <article className="admin-main-kpi-card">
          <span>이번 주 매출</span>
          <strong>{formatNumber(summary.weeklySalesTotal)}원</strong>
        </article>

        <article className={`admin-main-kpi-card rate ${rateClass}`}>
          <span>전주 대비 매출 증감률</span>
          <strong>{formatRate(summary.weekOverWeekChangeRate)}</strong>
          <small>지난주 매출 {formatNumber(summary.lastWeeklySalesTotal)}원</small>
        </article>
      </div>

      <div className="admin-main-payment-panel">
        <h3>결제 상태 통계</h3>
        <div className="admin-main-payment-grid">
          <div>
            <span>결제 완료</span>
            <strong>{formatNumber(summary.paidCount)}건</strong>
          </div>
          <div>
            <span>결제 취소</span>
            <strong>{formatNumber(summary.canceledCount)}건</strong>
          </div>
          <div>
            <span>결제 실패</span>
            <strong>{formatNumber(summary.failedCount)}건</strong>
          </div>
          <div>
            <span>결제 대기</span>
            <strong>{formatNumber(summary.readyCount)}건</strong>
          </div>
          <div>
            <span>결제 만료</span>
            <strong>{formatNumber(summary.expiredCount)}건</strong>
          </div>
          <div>
            <span>조회 기간 총 취소 금액</span>
            <strong>{formatNumber(summary.canceledAmountTotal)}원</strong>
          </div>
        </div>
      </div>

      <div className="admin-main-top-procedure-panel">
        <div className="admin-main-top-procedure-header">
          <h3>인기 시술 TOP 6</h3>
          <div className="admin-main-top-procedure-actions">
            <div className="admin-main-top-procedure-tabs">
              <button
                type="button"
                className={topProcedureTab === 'revenue' ? 'active' : ''}
                onClick={() => setTopProcedureTab('revenue')}
              >
                매출 기준
              </button>
              <button
                type="button"
                className={topProcedureTab === 'count' ? 'active' : ''}
                onClick={() => setTopProcedureTab('count')}
              >
                건수 기준
              </button>
            </div>

            <button
              type="button"
              className="admin-main-satisfaction-btn"
              onClick={() => window.location.assign(SATISFACTION_STATS_PATH)}
            >
              만족도 통계 보러가기
            </button>
          </div>
        </div>

        {topProcedures.length === 0 ? (
          <p className="admin-main-top-procedure-empty">
            조회 기간에 해당하는 시술 통계 데이터가 없습니다.
          </p>
        ) : (
          <div className="admin-main-top-procedure-list">
            {topProcedures.map((item) => (
              <article
                key={`${topProcedureTab}-${item.procedureId}-${item.rank}`}
                className="admin-main-top-procedure-item"
              >
                <div className="rank">{item.rank}</div>
                <div className="name">{item.procedureName}</div>
                <div className="meta">
                  <span>매출 {formatNumber(item.totalAmount)}원</span>
                  <span>건수 {formatNumber(item.totalCount)}건</span>
                </div>
              </article>
            ))}
          </div>
        )}
      </div>

      <div className="admin-main-monthly-chart-panel">
        <h3>월별 매출 차트 (연간 기준)</h3>
        <div className="admin-main-monthly-chart-layout">
          <aside className="admin-main-month-selector">
            <h4>월 선택</h4>
            <div className="admin-main-month-selector-grid">
              {monthlySalesTrend.map((item) => (
                <button
                  key={`select-${item.month}`}
                  type="button"
                  className={Number(item.month) === Number(selectedMonth) ? 'active' : ''}
                  onClick={() => setSelectedMonth(Number(item.month))}
                >
                  {item.month}월
                </button>
              ))}
            </div>

            <div className="admin-main-month-selector-summary">
              <span>선택한 월 매출</span>
              <strong>
                {selectedMonthlyPoint.month}월 {formatNumber(selectedMonthlyPoint.salesAmount)}원
              </strong>
            </div>
          </aside>

          <div className="admin-main-monthly-chart-wrap">
            <div className="admin-main-monthly-chart">
              {monthlySalesTrend.map((item) => {
                const amount = Number(item.salesAmount || 0)
                const height = Math.max(6, Math.round((amount / maxMonthlySales) * 100))
                const isSelected = Number(item.month) === Number(selectedMonth)

                return (
                  <div
                    key={item.month}
                    className={`admin-main-monthly-chart-item ${isSelected ? 'selected' : ''}`}
                  >
                    <div className="bar-wrap">
                      <div className="bar" style={{ height: `${height}%` }} />
                    </div>
                    <div className="month">{item.month}월</div>
                  </div>
                )
              })}

              <svg
                className="admin-main-monthly-line-svg"
                viewBox={`0 0 ${chartWidth} ${chartHeight}`}
                preserveAspectRatio="none"
              >
                {gridPercents.map((percent) => {
                  const y = chartBottom - (percent / 100) * chartRange
                  return (
                    <line
                      key={`grid-${percent}`}
                      className="admin-main-monthly-grid-line"
                      x1="0"
                      y1={y}
                      x2={chartWidth}
                      y2={y}
                    />
                  )
                })}

                {monthlyPolyline && (
                  <polyline className="admin-main-monthly-line" points={monthlyPolyline} />
                )}

                {monthlyLinePoints.map((point) => (
                  <g key={`point-${point.month}`}>
                    <circle
                      className="admin-main-monthly-point"
                      cx={point.x}
                      cy={point.y}
                      r="5"
                    />
                    <text
                      className="admin-main-monthly-point-label"
                      x={point.x}
                      y={point.y < chartTop + 14 ? point.y + 16 : point.y - 10}
                      textAnchor="middle"
                    >
                      {formatNumber(point.amount)}
                    </text>
                  </g>
                ))}
              </svg>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

export default AdminMainPage
