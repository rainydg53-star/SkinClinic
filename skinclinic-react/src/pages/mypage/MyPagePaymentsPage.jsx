import { useEffect, useState } from 'react'
import { useAlertModal } from '@/components/useAlertModal'
import './MyPagePaymentsPage.css'
import { API_BASE_URL } from '@/config/api'


function MyPagePaymentsPage() {
  const { showConfirm } = useAlertModal()
  const [payments, setPayments] = useState([])
  const [loading, setLoading] = useState(true)
  const [cancelingPaymentId, setCancelingPaymentId] = useState(null)
  const [errorMessage, setErrorMessage] = useState('')
  const [paidDateFilter, setPaidDateFilter] = useState('')

  useEffect(() => {
    fetchPayments(paidDateFilter)
  }, [paidDateFilter])

  const fetchPayments = async (paidDate) => {
    try {
      setLoading(true)
      setErrorMessage('')

      const query = new URLSearchParams()
      if (paidDate) {
        query.set('paidDate', paidDate)
      }

      const endpoint = query.toString()
        ? `${API_BASE_URL}/api/payments/me?${query.toString()}`
        : `${API_BASE_URL}/api/payments/me`

      const response = await fetch(endpoint, {
        credentials: 'include',
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.message || '결제 내역을 불러오지 못했습니다.')
      }

      setPayments(data)
    } catch (error) {
      setErrorMessage(error.message)
    } finally {
      setLoading(false)
    }
  }

  const getStatusLabel = (status) => {
    if (status === 'PAID') return '결제 완료'
    if (status === 'CANCELED') return '결제 취소'
    if (status === 'FAILED') return '결제 실패'
    if (status === 'READY') return '결제 준비'
    if (status === 'EXPIRED') return '결제 만료'
    return status
  }

  const getPaymentMethodLabel = (method) => {
    if (method === 'KAKAOPAY_TEST') return '카카오페이 간편결제(테스트)'
    if (method === 'PORTONE_INICIS_CARD') return '포트원 결제'
    if (method === 'KAKAO_PAY') return '카카오페이'
    if (method === 'TEST_CARD') return '테스트 카드'
    return method
  }

  const handleCancelPayment = (paymentId) => {
    showConfirm({
      title: '결제 취소',
      message: '이 결제를 정말 취소하시겠습니까?',
      confirmText: '취소 진행',
      cancelText: '닫기',
      onConfirm: async () => {
        try {
          setCancelingPaymentId(paymentId)
          setErrorMessage('')

          const response = await fetch(`${API_BASE_URL}/api/payments/${paymentId}/cancel`, {
            method: 'POST',
            credentials: 'include',
          })

          const data = await response.json()

          if (!response.ok) {
            throw new Error(data.message || '결제 취소에 실패했습니다.')
          }

          setPayments((prev) =>
            prev.map((payment) =>
              payment.id === paymentId
                ? { ...payment, status: data.status, paidAt: data.paidAt, cancelable: data.cancelable }
                : payment,
            ),
          )
        } catch (error) {
          setErrorMessage(error.message)
        } finally {
          setCancelingPaymentId(null)
        }
      },
    })
  }

  if (loading) {
    return <div className="mypage-payment-status">결제 내역을 불러오는 중...</div>
  }

  if (errorMessage && payments.length === 0) {
    return <div className="mypage-payment-status error">{errorMessage}</div>
  }

  return (
    <div className="mypage-payments">
      <div className="mypage-payments-header">
        <h2 className="mypage-section-title">결제 내역</h2>
        <p>
          최근 결제 내역을 확인하고 취소 가능한 결제만 바로 취소할 수 있습니다.
        </p>
      </div>

      <div className="mypage-payments-filter">
        {paidDateFilter && (
          <button type="button" onClick={() => setPaidDateFilter('')}>
            전체보기
          </button>
        )}
        <input
          type="date"
          value={paidDateFilter}
          onChange={(event) => setPaidDateFilter(event.target.value)}
        />
      </div>

      {errorMessage && <div className="mypage-payment-inline-error">{errorMessage}</div>}

      {payments.length === 0 ? (
        <div className="mypage-payment-empty">해당 날짜의 결제 내역이 없습니다.</div>
      ) : (
        <div className="mypage-payment-list">
          {payments.map((payment) => (
            <article key={payment.id} className="mypage-payment-card">
              <div className="payment-card-top">
                <span className={`payment-status-chip status-${payment.status.toLowerCase()}`}>
                  {getStatusLabel(payment.status)}
                </span>
                <span className="payment-order-id">{payment.orderId}</span>
              </div>

              <h3>{payment.procedureName}</h3>

              <div className="payment-meta">
                <span>결제수단: {getPaymentMethodLabel(payment.paymentMethod)}</span>
                <span>금액: {payment.amount.toLocaleString()}원</span>
              </div>

              <div className="payment-date">
                결제시각:{' '}
                {payment.paidAt
                  ? new Date(payment.paidAt).toLocaleString('ko-KR')
                  : '아직 승인되지 않았습니다.'}
              </div>

              {payment.status === 'PAID' && (
                <div className="payment-card-actions">
                  {payment.cancelable ? (
                    <button
                      type="button"
                      className="payment-cancel-btn"
                      onClick={() => handleCancelPayment(payment.id)}
                      disabled={cancelingPaymentId === payment.id}
                    >
                      {cancelingPaymentId === payment.id ? '취소 처리 중...' : '결제 취소'}
                    </button>
                  ) : (
                    <span className="payment-completed-badge">결제 완료</span>
                  )}
                </div>
              )}
            </article>
          ))}
        </div>
      )}
    </div>
  )
}

export default MyPagePaymentsPage
