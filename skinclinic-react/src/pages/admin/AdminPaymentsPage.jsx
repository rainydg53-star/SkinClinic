import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import './AdminPaymentsPage.css'
import { API_BASE_URL } from '@/config/api'


function AdminPaymentsPage() {
  const [payments, setPayments] = useState([])
  const [loading, setLoading] = useState(true)
  const [errorMessage, setErrorMessage] = useState('')
  const [paidDateFilter, setPaidDateFilter] = useState('')
  const dateInputRef = useRef(null)

  useEffect(() => {
    const fetchPayments = async () => {
      try {
        setLoading(true)
        setErrorMessage('')

        const query = new URLSearchParams()
        if (paidDateFilter) {
          query.set('paidDate', paidDateFilter)
        }

        const queryString = query.toString()
        const endpoint = queryString
          ? `${API_BASE_URL}/api/admin/payments?${queryString}`
          : `${API_BASE_URL}/api/admin/payments`

        const response = await fetch(endpoint, {
          credentials: 'include',
        })

        const data = await response.json()

        if (!response.ok) {
          throw new Error(data.message || '결제 목록을 불러오지 못했습니다.')
        }

        setPayments(data)
      } catch (error) {
        setErrorMessage(error.message)
      } finally {
        setLoading(false)
      }
    }

    fetchPayments()
  }, [paidDateFilter])

  const getStatusLabel = (status) => {
    if (status === 'PAID') return '결제 완료'
    if (status === 'CANCELED') return '결제 취소'
    if (status === 'FAILED') return '결제 실패'
    if (status === 'READY') return '결제 대기'
    if (status === 'EXPIRED') return '결제 만료'
    return status
  }

  const handleOpenDatePicker = () => {
    if (!dateInputRef.current) {
      return
    }

    dateInputRef.current.focus()
    if (typeof dateInputRef.current.showPicker === 'function') {
      dateInputRef.current.showPicker()
    }
  }

  if (loading) {
    return <div className="admin-payments-status">결제 목록을 불러오는 중...</div>
  }

  if (errorMessage) {
    return <div className="admin-payments-status error">{errorMessage}</div>
  }

  return (
    <section className="admin-payments-page">
      <div className="admin-payments-header">
        <h2>결제 관리</h2>
        <p>
          {paidDateFilter
            ? `${paidDateFilter} 결제 내역만 표시됩니다.`
            : '전체 결제 내역과 상태를 한눈에 확인할 수 있습니다.'}
        </p>
      </div>

      <div className="admin-payments-filter">
        {paidDateFilter && (
          <button type="button" onClick={() => setPaidDateFilter('')}>
            전체보기
          </button>
        )}
        <input
          id="admin-payments-date-filter"
          ref={dateInputRef}
          type="date"
          value={paidDateFilter}
          onChange={(event) => setPaidDateFilter(event.target.value)}
        />
      </div>

      <div className="admin-payments-table-wrap">
        <table className="admin-payments-table">
          <thead>
            <tr>
              <th>주문번호</th>
              <th>회원</th>
              <th>시술명</th>
              <th>결제수단</th>
              <th>금액</th>
              <th>상태</th>
              <th>
                <button type="button" className="admin-payments-date-th" onClick={handleOpenDatePicker}>
                  결제일시
                </button>
              </th>
              <th>상세</th>
            </tr>
          </thead>
          <tbody>
            {payments.length === 0 ? (
              <tr>
                <td colSpan="8" className="empty-row">
                  등록된 결제 내역이 없습니다.
                </td>
              </tr>
            ) : (
              payments.map((payment) => (
                <tr key={payment.id}>
                  <td>{payment.orderId}</td>
                  <td>
                    <strong>{payment.memberName}</strong>
                    <div className="payment-subtext">{payment.memberLoginId}</div>
                  </td>
                  <td>{payment.procedureName}</td>
                  <td>{payment.paymentMethod}</td>
                  <td>{payment.amount.toLocaleString()}원</td>
                  <td>
                    <span className={`admin-payment-status-chip status-${payment.status.toLowerCase()}`}>
                      {getStatusLabel(payment.status)}
                    </span>
                  </td>
                  <td>{payment.paidAt ? new Date(payment.paidAt).toLocaleString('ko-KR') : '-'}</td>
                  <td>
                    <Link to={`/admin/payments/${payment.id}`} className="detail-link">
                      상세보기
                    </Link>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </section>
  )
}

export default AdminPaymentsPage
