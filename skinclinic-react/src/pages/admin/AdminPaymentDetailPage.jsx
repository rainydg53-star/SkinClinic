import { useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { useAlertModal } from '../../components/useAlertModal'
import './AdminPaymentDetailPage.css'
import { API_BASE_URL } from '@/config/api'


function AdminPaymentDetailPage() {
  const { paymentId } = useParams()
  const navigate = useNavigate()
  const { showConfirm } = useAlertModal()

  const [payment, setPayment] = useState(null)
  const [loading, setLoading] = useState(true)
  const [errorMessage, setErrorMessage] = useState('')
  const [refunding, setRefunding] = useState(false)

  useEffect(() => {
    const fetchPayment = async () => {
      try {
        setLoading(true)
        setErrorMessage('')

        const response = await fetch(`${API_BASE_URL}/api/admin/payments/${paymentId}`, {
          credentials: 'include',
        })

        const data = await response.json()

        if (!response.ok) {
          throw new Error(data.message || '결제 상세 정보를 불러오지 못했습니다.')
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

  const getStatusLabel = (status) => {
    if (status === 'PAID') return '결제 완료'
    if (status === 'CANCELED') return '결제 취소'
    if (status === 'FAILED') return '결제 실패'
    if (status === 'READY') return '결제 대기'
    if (status === 'EXPIRED') return '결제 만료'
    return status
  }

  const processRefund = async () => {
    try {
      setRefunding(true)
      setErrorMessage('')

      const response = await fetch(`${API_BASE_URL}/api/admin/payments/${paymentId}/refund`, {
        method: 'POST',
        credentials: 'include',
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.message || '환불 처리에 실패했습니다.')
      }

      setPayment(data)
    } catch (error) {
      setErrorMessage(error.message)
    } finally {
      setRefunding(false)
    }
  }

  const handleRefund = () => {
    showConfirm({
      title: '환불 확인',
      message: '이 결제를 환불 처리하시겠습니까?',
      confirmText: '환불',
      cancelText: '취소',
      onConfirm: processRefund,
    })
  }

  if (loading) {
    return <div className="admin-payment-detail-page">결제 정보를 불러오는 중...</div>
  }

  if (!payment) {
    return <div className="admin-payment-detail-page">{errorMessage || '결제 정보가 없습니다.'}</div>
  }

  return (
    <section className="admin-payment-detail-page">
      <div className="admin-payment-detail-header">
        <h2>결제 상세</h2>
        <div className="admin-payment-detail-actions">
          <Link to="/admin/payments" className="back-link">
            목록으로
          </Link>
          <button type="button" onClick={() => navigate(-1)}>
            뒤로가기
          </button>
        </div>
      </div>

      {errorMessage && <p className="admin-payment-error">{errorMessage}</p>}

      <div className="admin-payment-detail-card">
        <div className="detail-row">
          <span className="label">결제번호</span>
          <span className="value">{payment.id}</span>
        </div>
        <div className="detail-row">
          <span className="label">주문번호</span>
          <span className="value">{payment.orderId}</span>
        </div>
        <div className="detail-row">
          <span className="label">회원</span>
          <span className="value">
            {payment.memberName} ({payment.memberLoginId})
          </span>
        </div>
        <div className="detail-row">
          <span className="label">회원 이메일</span>
          <span className="value">{payment.memberEmail}</span>
        </div>
        <div className="detail-row">
          <span className="label">시술명</span>
          <span className="value">{payment.procedureName}</span>
        </div>
        <div className="detail-row">
          <span className="label">결제수단</span>
          <span className="value">{payment.paymentMethod}</span>
        </div>
        <div className="detail-row">
          <span className="label">결제상태</span>
          <span className="value">{getStatusLabel(payment.status)}</span>
        </div>
        <div className="detail-row">
          <span className="label">결제금액</span>
          <span className="value">{payment.amount.toLocaleString()}원</span>
        </div>
        <div className="detail-row">
          <span className="label">거래 ID</span>
          <span className="value">{payment.tid || '-'}</span>
        </div>
        <div className="detail-row">
          <span className="label">결제일시</span>
          <span className="value">
            {payment.paidAt ? new Date(payment.paidAt).toLocaleString('ko-KR') : '-'}
          </span>
        </div>
        <div className="detail-row">
          <span className="label">생성일시</span>
          <span className="value">{new Date(payment.createdAt).toLocaleString('ko-KR')}</span>
        </div>
      </div>

      <div className="admin-payment-reservation-box">
        <h3>예약 연결 정보</h3>
        <p>{payment.reservationLinkStatus}</p>
      </div>

      {payment.status === 'PAID' && (
        <div className="admin-payment-refund-actions">
          <button type="button" className="admin-payment-refund-btn" onClick={handleRefund} disabled={refunding}>
            {refunding ? '환불 처리 중...' : '관리자 환불 처리'}
          </button>
        </div>
      )}
    </section>
  )
}

export default AdminPaymentDetailPage


