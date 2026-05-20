import { useEffect, useMemo, useState } from 'react'
import { useNavigate, useParams, useSearchParams } from 'react-router-dom'
import './TestPaymentPage.css'
import { API_BASE_URL, PORTONE_SDK_URL } from '@/config/api'

let portOneSdkPromise = null
const EMAIL_REGEX = /^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$/

async function readJsonResponse(response) {
  const raw = await response.text()
  if (!raw) {
    return {}
  }

  try {
    return JSON.parse(raw)
  } catch {
    if (response.status === 401 || response.status === 403) {
      throw new Error('로그인이 필요합니다. 다시 로그인 후 결제를 시도해 주세요.')
    }

    throw new Error('서버 응답 형식이 올바르지 않습니다. 잠시 후 다시 시도해 주세요.')
  }
}

function loadPortOneSdk() {
  if (window.PortOne) {
    return Promise.resolve(window.PortOne)
  }

  if (!portOneSdkPromise) {
    portOneSdkPromise = new Promise((resolve, reject) => {
      const existingScript = document.querySelector(`script[src="${PORTONE_SDK_URL}"]`)

      if (existingScript) {
        existingScript.addEventListener('load', () => resolve(window.PortOne), { once: true })
        existingScript.addEventListener(
          'error',
          () => reject(new Error('포트원 SDK를 불러오지 못했습니다.')),
          { once: true },
        )
        return
      }

      const script = document.createElement('script')
      script.src = PORTONE_SDK_URL
      script.async = true
      script.onload = () => resolve(window.PortOne)
      script.onerror = () => reject(new Error('포트원 SDK를 불러오지 못했습니다.'))
      document.head.appendChild(script)
    })
  }

  return portOneSdkPromise
}

function TestPaymentPage() {
  const { procedureId } = useParams()
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const reservationId = useMemo(() => {
    const raw = searchParams.get('reservationId')
    const parsed = Number(raw)
    return Number.isFinite(parsed) && parsed > 0 ? parsed : null
  }, [searchParams])

  const [procedure, setProcedure] = useState(null)
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [errorMessage, setErrorMessage] = useState('')
  const [isPaymentMethodModalOpen, setIsPaymentMethodModalOpen] = useState(false)

  useEffect(() => {
    const fetchProcedure = async () => {
      try {
        const response = await fetch(`${API_BASE_URL}/api/procedures/${procedureId}`, {
          credentials: 'include',
        })

        if (!response.ok) {
          throw new Error('시술 정보를 불러오지 못했습니다.')
        }

        const data = await response.json()
        setProcedure(data)
      } catch (error) {
        setErrorMessage(error.message)
      } finally {
        setLoading(false)
      }
    }

    fetchProcedure()
  }, [procedureId])

  const handlePayment = async (method = 'CARD') => {
    if (!reservationId) {
      setErrorMessage('예약 정보를 확인할 수 없습니다. 예약 내역에서 다시 결제를 진행해 주세요.')
      return
    }
    setSubmitting(true)
    setErrorMessage('')
    setIsPaymentMethodModalOpen(false)

    if (method === 'KAKAOPAY') {
      try {
        const readyResponse = await fetch(`${API_BASE_URL}/api/payments/kakao/ready`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          credentials: 'include',
          body: JSON.stringify({
            procedureId: Number(procedureId),
            reservationId,
          }),
        })

        const readyData = await readJsonResponse(readyResponse)
        if (!readyResponse.ok) {
          throw new Error(readyData.message || '카카오페이 결제 준비에 실패했습니다.')
        }

        if (!readyData.redirectUrl) {
          throw new Error('카카오페이 결제창 URL이 없습니다.')
        }

        window.location.href = readyData.redirectUrl
        return
      } catch (error) {
        setErrorMessage(error.message)
        setSubmitting(false)
        return
      }
    }

    let preparedPaymentId = null
    let statusNotified = false

    try {
      const prepareResponse = await fetch(`${API_BASE_URL}/api/payments/portone/prepare`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          procedureId: Number(procedureId),
            reservationId,
          }),
      })

      const prepareData = await readJsonResponse(prepareResponse)

      if (!prepareResponse.ok) {
        throw new Error(prepareData.message || '결제 준비에 실패했습니다.')
      }

      preparedPaymentId = prepareData.paymentId

      const PortOne = await loadPortOneSdk()
      const normalizedEmail = (prepareData.customerEmail || '').trim().toLowerCase()
      const isValidEmail = EMAIL_REGEX.test(normalizedEmail)
      const requestBody = {
        storeId: prepareData.storeId,
        channelKey: prepareData.channelKey,
        paymentId: prepareData.paymentId,
        orderName: prepareData.orderName,
        totalAmount: prepareData.totalAmount,
        currency: 'CURRENCY_KRW',
        payMethod: 'CARD',
        redirectUrl: prepareData.redirectUrl,
        customer: {
          fullName: prepareData.customerName,
          ...(isValidEmail ? { email: normalizedEmail } : {}),
          phoneNumber: prepareData.customerPhone,
        },
      }

      const paymentResult = await PortOne.requestPayment(requestBody)

      if (paymentResult.code !== undefined) {
        const failedPaymentId = paymentResult.paymentId || prepareData.paymentId
        const reason = `${paymentResult.code || ''} ${paymentResult.message || ''}`.toLowerCase()
        const endpoint = reason.includes('cancel') ? 'cancel' : 'fail'
        if (failedPaymentId) {
          statusNotified = true
          fetch(
            `${API_BASE_URL}/api/payments/portone/${endpoint}?paymentId=${encodeURIComponent(failedPaymentId)}`,
            {
              method: 'POST',
              credentials: 'include',
            },
          ).catch(() => {})
        }
        throw new Error(paymentResult.message || '결제가 완료되지 않았습니다.')
      }

      const completeResponse = await fetch(`${API_BASE_URL}/api/payments/portone/complete`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          paymentId: paymentResult.paymentId,
        }),
      })

      const completeData = await readJsonResponse(completeResponse)

      if (!completeResponse.ok) {
        throw new Error(completeData.message || '결제 검증에 실패했습니다.')
      }

      navigate(`/payments/success/${completeData.id}`)
    } catch (error) {
      if (preparedPaymentId && !statusNotified) {
        const reason = `${error?.message || ''}`.toLowerCase()
        const endpoint =
          reason.includes('cancel') || reason.includes('취소') ? 'cancel' : 'fail'

        fetch(
          `${API_BASE_URL}/api/payments/portone/${endpoint}?paymentId=${encodeURIComponent(preparedPaymentId)}`,
          {
            method: 'POST',
            credentials: 'include',
          },
        ).catch(() => {})
      }

      setErrorMessage(error.message)
      setSubmitting(false)
    }
  }

  if (loading) {
    return <div className="payment-page-status">결제를 준비하는 중입니다...</div>
  }

  if (errorMessage && !procedure) {
    return <div className="payment-page-status error">{errorMessage}</div>
  }

  return (
    <section className="test-payment-page">
      <div className="test-payment-card">
        <div className="test-payment-header">
          <span className="test-payment-badge">결제 준비</span>
          <h2>결제 하기</h2>
          <p>결제하기를 누르면 결제수단을 선택한 뒤 결제창으로 이동합니다.</p>
        </div>

        {errorMessage && <div className="payment-form-error">{errorMessage}</div>}

        {procedure && (
          <div className="test-payment-summary">
            <div className="summary-row">
              <span>시술명</span>
              <strong>{procedure.name}</strong>
            </div>
            <div className="summary-row">
              <span>카테고리</span>
              <strong>{procedure.category}</strong>
            </div>
            <div className="summary-row">
              <span>결제수단</span>
              <strong>포트원 카드 / 카카오페이 간편결제</strong>
            </div>
            <div className="summary-row total">
              <span>총 결제금액</span>
              <strong>{procedure.price.toLocaleString()}원</strong>
            </div>
          </div>
        )}

        <div className="test-payment-actions">
          <button type="button" className="payment-secondary-btn" onClick={() => navigate(-1)}>
            이전으로
          </button>
          <button
            type="button"
            className="payment-primary-btn"
            onClick={() => setIsPaymentMethodModalOpen(true)}
            disabled={submitting}
          >
            {submitting ? '결제창을 여는 중...' : '결제하기'}
          </button>
        </div>
      </div>

      {isPaymentMethodModalOpen && (
        <div className="payment-method-modal-backdrop" onClick={() => setIsPaymentMethodModalOpen(false)}>
          <div className="payment-method-modal" onClick={(event) => event.stopPropagation()}>
            <h3>결제수단 선택</h3>
            <p>원하시는 결제 방식을 선택해주세요.</p>

            <button
              type="button"
              className="payment-method-option"
              onClick={() => handlePayment('CARD')}
              disabled={submitting}
            >
              포트원 일반 결제 (카드)
            </button>

            <button
              type="button"
              className="payment-method-option kakao"
              onClick={() => handlePayment('KAKAOPAY')}
              disabled={submitting}
            >
              카카오페이 간편결제
            </button>

            <button
              type="button"
              className="payment-method-close"
              onClick={() => setIsPaymentMethodModalOpen(false)}
              disabled={submitting}
            >
              닫기
            </button>
          </div>
        </div>
      )}
    </section>
  )
}

export default TestPaymentPage


