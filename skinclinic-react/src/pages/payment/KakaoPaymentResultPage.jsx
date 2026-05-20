import { useEffect, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import './PaymentSuccessPage.css'
import { API_BASE_URL } from '@/config/api'


function KakaoPaymentResultPage({ type }) {
  const [searchParams] = useSearchParams()
  const [message, setMessage] = useState('')

  useEffect(() => {
    const orderId = searchParams.get('orderId')

    if (!orderId) {
      setMessage(type === 'cancel' ? '결제가 취소되었습니다.' : '결제에 실패했습니다.')
      return
    }

    const endpoint = type === 'cancel' ? 'cancel' : 'fail'

    fetch(`${API_BASE_URL}/api/payments/kakao/${endpoint}?orderId=${encodeURIComponent(orderId)}`, {
      method: 'POST',
      credentials: 'include',
    }).finally(() => {
      setMessage(type === 'cancel' ? '결제가 취소되었습니다.' : '결제에 실패했습니다.')
    })
  }, [searchParams, type])

  return (
    <section className="payment-success-page">
      <div className="payment-success-card">
        <div className="payment-success-top">
          <span className="payment-success-chip">{type === 'cancel' ? 'CANCELED' : 'FAILED'}</span>
          <h2>{message || '결제 상태를 확인하는 중입니다.'}</h2>
          <p>다시 시도하거나 결제 내역에서 현재 상태를 확인해보세요.</p>
        </div>

        <div className="payment-success-actions">
          <Link to="/mypage/payments" className="payment-success-primary">
            결제 내역 보기
          </Link>
          <Link to="/procedures" className="payment-success-secondary">
            시술 목록 보기
          </Link>
        </div>
      </div>
    </section>
  )
}

export default KakaoPaymentResultPage

