import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAlertModal } from '../../components/useAlertModal'
import './FindPasswordPage.css'
import { API_BASE_URL } from '@/config/api'

function FindPasswordPage() {
  const navigate = useNavigate()
  const { showAlert } = useAlertModal()

  const [form, setForm] = useState({
    loginId: '',
    email: '',
    code: '',
    newPassword: '',
    confirmPassword: '',
  })

  const [isCodeSent, setIsCodeSent] = useState(false)
  const [isVerified, setIsVerified] = useState(false)
  const [timeLeft, setTimeLeft] = useState(0)
  const [errorMessage, setErrorMessage] = useState('')
  const [successMessage, setSuccessMessage] = useState('')

  useEffect(() => {
    if (!isCodeSent || isVerified || timeLeft <= 0) return

    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timer)
          return 0
        }
        return prev - 1
      })
    }, 1000)

    return () => clearInterval(timer)
  }, [isCodeSent, isVerified, timeLeft])

  const formatTime = (seconds) => {
    const minutes = String(Math.floor(seconds / 60)).padStart(2, '0')
    const secs = String(seconds % 60).padStart(2, '0')
    return `${minutes}:${secs}`
  }

  const handleChange = (e) => {
    const { name, value } = e.target
    setForm((prev) => ({
      ...prev,
      [name]: value,
    }))
  }

  const parseResponse = async (response) => {
    const text = await response.text()
    try {
      return text ? JSON.parse(text) : {}
    } catch {
      return { message: text }
    }
  }

  const handleSendCode = async () => {
    setErrorMessage('')
    setSuccessMessage('')

    if (!form.loginId.trim() || !form.email.trim()) {
      setErrorMessage('아이디와 이메일을 입력해 주세요.')
      return
    }

    try {
      const response = await fetch(`${API_BASE_URL}/api/members/send-code`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          loginId: form.loginId,
          email: form.email,
        }),
      })

      const data = await parseResponse(response)

      if (response.ok) {
        setIsCodeSent(true)
        setIsVerified(false)
        setTimeLeft(300)
        setForm((prev) => ({ ...prev, code: '' }))
        setSuccessMessage(data.message || '인증번호가 전송되었습니다.')
      } else {
        setErrorMessage(data.message || '인증번호 전송에 실패했습니다.')
      }
    } catch (error) {
      console.error('인증번호 전송 실패:', error)
      setErrorMessage('서버 오류가 발생했습니다.')
    }
  }

  const handleVerifyCode = async () => {
    setErrorMessage('')
    setSuccessMessage('')

    if (!form.code.trim()) {
      setErrorMessage('인증번호를 입력해 주세요.')
      return
    }

    if (timeLeft <= 0) {
      setErrorMessage('인증번호가 만료되었습니다. 다시 요청해 주세요.')
      return
    }

    try {
      const response = await fetch(`${API_BASE_URL}/api/members/verify-code`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          email: form.email,
          code: form.code,
        }),
      })

      const data = await parseResponse(response)

      if (response.ok) {
        setIsVerified(true)
        setTimeLeft(0)
        setSuccessMessage(data.message || '이메일 인증이 완료되었습니다.')
      } else {
        setErrorMessage(data.message || '인증번호가 올바르지 않습니다.')
      }
    } catch (error) {
      console.error('인증번호 확인 실패:', error)
      setErrorMessage('서버 오류가 발생했습니다.')
    }
  }

  const handleResetPassword = async (e) => {
    e.preventDefault()
    setErrorMessage('')
    setSuccessMessage('')

    if (!isVerified) {
      setErrorMessage('이메일 인증을 먼저 완료해 주세요.')
      return
    }

    if (!form.newPassword.trim() || !form.confirmPassword.trim()) {
      setErrorMessage('새 비밀번호와 비밀번호 확인을 입력해 주세요.')
      return
    }

    if (form.newPassword !== form.confirmPassword) {
      setErrorMessage('새 비밀번호와 비밀번호 확인이 일치하지 않습니다.')
      return
    }

    try {
      const response = await fetch(`${API_BASE_URL}/api/members/reset`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          loginId: form.loginId,
          newPassword: form.newPassword,
        }),
      })

      const data = await parseResponse(response)

      if (response.ok) {
        showAlert({
          title: '비밀번호 변경 완료',
          message: data.message || '비밀번호가 변경되었습니다.',
          onConfirm: () => navigate('/login'),
        })
      } else {
        setErrorMessage(data.message || '비밀번호 변경에 실패했습니다.')
      }
    } catch (error) {
      console.error('비밀번호 변경 실패:', error)
      setErrorMessage('서버 오류가 발생했습니다.')
    }
  }

  return (
    <section className="find-password-page">
      <div className="find-password-card">
        <div className="find-password-title-wrap">
          <h2 className="find-password-title">비밀번호 찾기</h2>
          <p className="find-password-subtitle">
            아이디와 이메일 인증 후 새 비밀번호로 재설정할 수 있습니다.
          </p>
        </div>

        {errorMessage && <div className="form-error">{errorMessage}</div>}
        {successMessage && <div className="form-success">{successMessage}</div>}

        <form onSubmit={handleResetPassword} className="find-password-form">
          <div className="form-group">
            <label htmlFor="loginId">아이디</label>
            <input
              type="text"
              id="loginId"
              name="loginId"
              value={form.loginId}
              onChange={handleChange}
              placeholder="아이디를 입력해 주세요"
              disabled={isVerified}
            />
          </div>

          <div className="form-group">
            <label htmlFor="email">이메일</label>
            <div className="input-action-row">
              <input
                type="email"
                id="email"
                name="email"
                value={form.email}
                onChange={handleChange}
                placeholder="이메일을 입력해 주세요"
                disabled={isVerified}
              />
              <button type="button" className="sub-btn" onClick={handleSendCode} disabled={isVerified}>
                인증번호 발송
              </button>
            </div>
          </div>

          {isCodeSent && (
            <div className="form-group">
              <label htmlFor="code">인증번호</label>
              <div className="input-action-row">
                <input
                  type="text"
                  id="code"
                  name="code"
                  value={form.code}
                  onChange={handleChange}
                  placeholder="인증번호를 입력해 주세요"
                  disabled={isVerified}
                />
                <button
                  type="button"
                  className="sub-btn"
                  onClick={handleVerifyCode}
                  disabled={isVerified || timeLeft <= 0}
                >
                  인증 확인
                </button>
              </div>

              {!isVerified && <div className="timer-text">남은 시간: {formatTime(timeLeft)}</div>}
            </div>
          )}

          {isVerified && (
            <>
              <div className="verified-box">이메일 인증이 완료되었습니다.</div>

              <div className="form-group">
                <label htmlFor="newPassword">새 비밀번호</label>
                <input
                  type="password"
                  id="newPassword"
                  name="newPassword"
                  value={form.newPassword}
                  onChange={handleChange}
                  placeholder="새 비밀번호를 입력해 주세요"
                />
              </div>

              <div className="form-group">
                <label htmlFor="confirmPassword">새 비밀번호 확인</label>
                <input
                  type="password"
                  id="confirmPassword"
                  name="confirmPassword"
                  value={form.confirmPassword}
                  onChange={handleChange}
                  placeholder="새 비밀번호를 다시 입력해 주세요"
                />
              </div>

              <button type="submit" className="find-password-btn">
                비밀번호 변경
              </button>
            </>
          )}
        </form>
      </div>
    </section>
  )
}

export default FindPasswordPage
