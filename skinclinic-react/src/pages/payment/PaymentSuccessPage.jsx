import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import './PaymentSuccessPage.css'
import { API_BASE_URL } from '@/config/api'


function PaymentSuccessPage() {
  const { paymentId } = useParams()
  const [payment, setPayment] = useState(null)
  const [loading, setLoading] = useState(true)
  const [errorMessage, setErrorMessage] = useState('')

  useEffect(() => {
    const fetchPayment = async () => {
      try {
        const response = await fetch(`${API_BASE_URL}/api/payments/${paymentId}`, {
          credentials: 'include',
        })

        const data = await response.json()

        if (!response.ok) {
          throw new Error(data.message || '결제 정보를 불러오지 못했습니다.')
        }

        setPayment(data)
      } catch (error) {
        setErrorMessage(error.message)
      } finally {
        setLoading(false)
      }
    }

    fetchPayment()
  }, [paymentId])

  const getPaymentMethodLabel = (method) => {
    if (method === 'KAKAOPAY_TEST') return '카카오페이 간편결제(테스트)'
    if (method === 'PORTONE_INICIS_CARD') return '포트원 결제'
    if (method === 'KAKAO_PAY') return '카카오페이'
    if (method === 'TEST_CARD') return '테스트 카드'
    return method
  }

  if (loading) {
    return <div className="payment-success-status">결제 결과를 불러오는 중...</div>
  }

  if (errorMessage) {
    return <div className="payment-success-status error">{errorMessage}</div>
  }

  return (
    <section className="payment-success-page">
      <div className="payment-success-card">
        <div className="payment-success-top">
          <span className="payment-success-chip">{payment?.status || 'PAID'}</span>
          <h2>결제가 완료되었습니다.</h2>
          <p>결제 정보는 마이페이지 결제 내역에서 다시 확인할 수 있습니다.</p>
        </div>

        {payment && (
          <div className="payment-success-info">
            <div className="info-row">
              <span>주문번호</span>
              <strong>{payment.orderId}</strong>
            </div>
            <div className="info-row">
              <span>시술명</span>
              <strong>{payment.procedureName}</strong>
            </div>
            <div className="info-row">
              <span>결제수단</span>
              <strong>{getPaymentMethodLabel(payment.paymentMethod)}</strong>
            </div>
            <div className="info-row total">
              <span>결제금액</span>
              <strong>{payment.amount.toLocaleString()}원</strong>
            </div>
          </div>
        )}

        <div className="payment-success-actions">
          <Link to="/mypage/payments" className="payment-success-primary">
            결제 내역 보기
          </Link>
          <Link to="/procedures" className="payment-success-secondary">
            다른 시술 보기
          </Link>
        </div>
      </div>
    </section>
  )
}

export default PaymentSuccessPage


