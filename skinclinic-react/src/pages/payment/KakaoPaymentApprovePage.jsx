import { useEffect, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { API_BASE_URL } from '@/config/api'

const processedKakaoApproveRequests = new Set()

function KakaoPaymentApprovePage() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const [errorMessage, setErrorMessage] = useState('')

  useEffect(() => {
    const approvePayment = async () => {
      const orderId = searchParams.get('orderId')
      const pgToken = searchParams.get('pg_token')

      if (!orderId || !pgToken) {
        setErrorMessage('카카오페이 승인에 필요한 정보가 없습니다.')
        return
      }

      const requestKey = `${orderId}:${pgToken}`
      if (processedKakaoApproveRequests.has(requestKey)) {
        return
      }
      processedKakaoApproveRequests.add(requestKey)

      try {
        const response = await fetch(`${API_BASE_URL}/api/payments/kakao/approve`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          credentials: 'include',
          body: JSON.stringify({
            orderId,
            pgToken,
          }),
        })

        const data = await response.json()

        if (!response.ok) {
          throw new Error(data.message || '카카오페이 승인에 실패했습니다.')
        }

        navigate(`/payments/success/${data.id}`, { replace: true })
      } catch (error) {
        processedKakaoApproveRequests.delete(requestKey)
        setErrorMessage(error.message)
      }
    }

    approvePayment()
  }, [navigate, searchParams])

  if (errorMessage) {
    return <div className="payment-page-status error">{errorMessage}</div>
  }

  return <div className="payment-page-status">카카오페이 결제를 승인하는 중...</div>
}

export default KakaoPaymentApprovePage