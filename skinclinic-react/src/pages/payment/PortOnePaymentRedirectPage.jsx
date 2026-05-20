import { useEffect, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { API_BASE_URL } from '@/config/api'

const processedPortOneCompleteRequests = new Set()

function PortOnePaymentRedirectPage() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const [errorMessage, setErrorMessage] = useState('')

  useEffect(() => {
    const completePayment = async () => {
      const paymentId = searchParams.get('payment_id') || searchParams.get('paymentId')
      const code = searchParams.get('code')
      const message = searchParams.get('message')

      if (!paymentId) {
        setErrorMessage('Payment ID is missing.')
        return
      }

      const mode = code ? 'result' : 'complete'
      const requestKey = `${mode}:${paymentId}:${code || ''}`
      if (processedPortOneCompleteRequests.has(requestKey)) {
        return
      }
      processedPortOneCompleteRequests.add(requestKey)

      if (code) {
        const reason = `${code || ''} ${message || ''}`.toLowerCase()
        const endpoint = reason.includes('cancel') ? 'cancel' : 'fail'
        fetch(
          `${API_BASE_URL}/api/payments/portone/${endpoint}?paymentId=${encodeURIComponent(paymentId)}`,
          {
            method: 'POST',
            credentials: 'include',
          },
        ).catch(() => {})

        setErrorMessage(message || 'Payment was canceled or failed.')
        return
      }

      try {
        const response = await fetch(`${API_BASE_URL}/api/payments/portone/complete`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          credentials: 'include',
          body: JSON.stringify({
            paymentId,
          }),
        })

        const data = await response.json()

        if (!response.ok) {
          throw new Error(data.message || 'Failed to verify payment.')
        }

        navigate(`/payments/success/${data.id}`, { replace: true })
      } catch (error) {
        processedPortOneCompleteRequests.delete(requestKey)
        setErrorMessage(error.message)
      }
    }

    completePayment()
  }, [navigate, searchParams])

  if (errorMessage) {
    return <div className="payment-page-status error">{errorMessage}</div>
  }

  return <div className="payment-page-status">Verifying payment...</div>
}

export default PortOnePaymentRedirectPage