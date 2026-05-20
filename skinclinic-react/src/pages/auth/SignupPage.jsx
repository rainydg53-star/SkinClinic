import { useEffect, useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { useAlertModal } from '../../components/useAlertModal'
import './SignupPage.css'
import { API_BASE_URL } from '@/config/api'

function SignupPage() {
  const navigate = useNavigate()
  const location = useLocation()
  const { showAlert } = useAlertModal()

  const [form, setForm] = useState({
    loginId: '',
    password: '',
    name: '',
    email: '',
    phone: '',
    emailCode: '',
    emailVerified: false,
    socialSignup: false,
    socialProvider: '',
    socialId: '',
  })

  const [errorMessage, setErrorMessage] = useState('')
  const [emailVerifyMessage, setEmailVerifyMessage] = useState('')
  const [emailMessageClass, setEmailMessageClass] = useState('field-info')
  const [isSending, setIsSending] = useState(false)
  const [isCodeSent, setIsCodeSent] = useState(false)
  const [timeLeft, setTimeLeft] = useState(0)
  const [showSuccessModal, setShowSuccessModal] = useState(false)

  useEffect(() => {
    const params = new URLSearchParams(location.search)
    const socialSignup = params.get('social') === 'true'

    if (!socialSignup) {
      return
    }

    setForm((prev) => ({
      ...prev,
      name: params.get('name') || '',
      email: params.get('email') || '',
      emailVerified: true,
      socialSignup: true,
      socialProvider: params.get('provider') || '',
      socialId: params.get('socialId') || '',
    }))

    setIsCodeSent(false)
    setTimeLeft(0)
    setEmailVerifyMessage('카카오 계정 이메일은 인증 완료 상태로 처리됩니다.')
    setEmailMessageClass('field-info')
  }, [location.search])

  useEffect(() => {
    if (!isCodeSent || form.emailVerified || timeLeft <= 0) return

    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timer)
          setEmailVerifyMessage('인증번호가 만료되었습니다. 다시 요청해 주세요.')
          setEmailMessageClass('field-error')
          return 0
        }
        return prev - 1
      })
    }, 1000)

    return () => clearInterval(timer)
  }, [isCodeSent, form.emailVerified, timeLeft])

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
      ...(name === 'email' && !prev.socialSignup
        ? {
            emailVerified: false,
            emailCode: '',
          }
        : {}),
    }))

    if (name === 'email' && !form.socialSignup) {
      setEmailVerifyMessage('')
      setEmailMessageClass('field-info')
      setIsCodeSent(false)
      setTimeLeft(0)
    }
  }

  const handleSendEmailCode = async () => {
    if (!form.email.trim()) {
      showAlert({
        title: '입력 확인',
        message: '이메일을 입력해 주세요.',
      })
      return
    }

    try {
      setIsSending(true)

      const response = await fetch(`${API_BASE_URL}/members/email/send`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        credentials: 'include',
        body: `email=${encodeURIComponent(form.email)}`,
      })

      if (!response.ok) {
        throw new Error(`status: ${response.status}`)
      }

      const result = await response.text()

      if (result === 'success') {
        setIsCodeSent(true)
        setTimeLeft(300)
        setForm((prev) => ({
          ...prev,
          emailVerified: false,
          emailCode: '',
        }))
        setEmailVerifyMessage('인증번호가 전송되었습니다.')
        setEmailMessageClass('field-success')
      } else {
        setEmailVerifyMessage(result)
        setEmailMessageClass('field-error')
      }
    } catch (error) {
      console.error(error)
      setEmailVerifyMessage('인증번호 전송 중 오류가 발생했습니다.')
      setEmailMessageClass('field-error')
    } finally {
      setIsSending(false)
    }
  }

  const handleVerifyEmail = async () => {
    if (!form.email.trim()) {
      showAlert({
        title: '입력 확인',
        message: '이메일을 입력해 주세요.',
      })
      return
    }

    if (!form.emailCode.trim()) {
      showAlert({
        title: '입력 확인',
        message: '인증번호를 입력해 주세요.',
      })
      return
    }

    if (timeLeft <= 0) {
      setEmailVerifyMessage('인증번호가 만료되었습니다. 다시 요청해 주세요.')
      setEmailMessageClass('field-error')
      return
    }

    try {
      const response = await fetch(`${API_BASE_URL}/members/email/verify`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        credentials: 'include',
        body: `email=${encodeURIComponent(form.email)}&code=${encodeURIComponent(form.emailCode)}`,
      })

      if (!response.ok) {
        throw new Error(`status: ${response.status}`)
      }

      const result = await response.json()

      if (result === true) {
        setForm((prev) => ({
          ...prev,
          emailVerified: true,
        }))
        setTimeLeft(0)
        setEmailVerifyMessage('이메일 인증이 완료되었습니다.')
        setEmailMessageClass('field-success')
      } else {
        setForm((prev) => ({
          ...prev,
          emailVerified: false,
        }))
        setEmailVerifyMessage('인증번호가 올바르지 않습니다.')
        setEmailMessageClass('field-error')
      }
    } catch (error) {
      console.error(error)
      setForm((prev) => ({
        ...prev,
        emailVerified: false,
      }))
      setEmailVerifyMessage('이메일 인증 중 오류가 발생했습니다.')
      setEmailMessageClass('field-error')
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()

    if (!form.socialSignup && !form.emailVerified) {
      showAlert({
        title: '이메일 인증 필요',
        message: '이메일 인증을 완료해 주세요.',
      })
      return
    }

    try {
      setErrorMessage('')

      const response = await fetch(`${API_BASE_URL}/api/members/signup`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          loginId: form.loginId,
          password: form.password,
          name: form.name,
          email: form.email,
          phone: form.phone,
          emailVerified: form.emailVerified,
          socialSignup: form.socialSignup,
          socialProvider: form.socialProvider,
          socialId: form.socialId,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.message || '회원가입에 실패했습니다.')
      }

      setShowSuccessModal(true)
    } catch (error) {
      console.error('회원가입 오류:', error)
      setErrorMessage(error.message || '회원가입 중 오류가 발생했습니다.')
    }
  }

  const successTitle = form.socialSignup ? '소셜회원가입이 완료되었습니다.' : '회원가입이 완료되었습니다.'
  const successMessage = form.socialSignup
    ? '이제 카카오로 다시 로그인해 서비스를 이용할 수 있습니다.'
    : '이제 로그인해서 예약, 결제, 마이페이지 기능을 이용할 수 있습니다.'

  return (
    <section className="signup-page">
      <div className="signup-card">
        <div className="signup-title-wrap">
          <h2 className="signup-title">{form.socialSignup ? '소셜회원가입' : '회원가입'}</h2>
          <p className="signup-subtitle">
            {form.socialSignup
              ? '카카오 계정 정보로 가입을 이어가고 추가 정보만 입력해 주세요.'
              : '예약과 서비스 이용을 위한 계정을 만들고 다양한 기능을 시작해 보세요.'}
          </p>
        </div>

        {errorMessage && <div className="form-error">{errorMessage}</div>}

        <form onSubmit={handleSubmit} className="signup-form">
          <input type="hidden" name="emailVerified" value={String(form.emailVerified)} readOnly />

          {!form.socialSignup && (
            <div className="form-group">
              <label htmlFor="loginId">아이디</label>
              <input
                type="text"
                id="loginId"
                name="loginId"
                value={form.loginId}
                onChange={handleChange}
                placeholder="아이디를 입력해 주세요"
              />
            </div>
          )}

          {!form.socialSignup && (
            <div className="form-group">
              <label htmlFor="password">비밀번호</label>
              <input
                type="password"
                id="password"
                name="password"
                value={form.password}
                onChange={handleChange}
                placeholder="비밀번호를 입력해 주세요"
              />
            </div>
          )}

          <div className="form-group">
            <label htmlFor="name">이름</label>
            <input
              type="text"
              id="name"
              name="name"
              value={form.name}
              onChange={handleChange}
              placeholder="이름을 입력해 주세요"
              readOnly={form.socialSignup}
              className={form.socialSignup ? 'readonly-input' : ''}
            />
          </div>

          <div className="form-group">
            <label htmlFor="email">이메일</label>
            {form.socialSignup ? (
              <>
                <input
                  type="email"
                  id="email"
                  name="email"
                  value={form.email}
                  readOnly
                  className="readonly-input"
                />
                <div className="field-info">소셜회원가입은 이메일 인증 없이 진행됩니다.</div>
              </>
            ) : (
              <div className="email-row">
                <input
                  type="email"
                  id="email"
                  name="email"
                  value={form.email}
                  onChange={handleChange}
                  placeholder="이메일을 입력해 주세요"
                  disabled={form.emailVerified}
                />
                <button
                  type="button"
                  className="sub-btn"
                  onClick={handleSendEmailCode}
                  disabled={isSending || form.emailVerified}
                >
                  {isSending ? '전송 중...' : '인증번호 보내기'}
                </button>
              </div>
            )}
          </div>

          {!form.socialSignup && (
            <div className="form-group">
              <label htmlFor="emailCode">인증번호</label>
              <div className="email-row">
                <input
                  type="text"
                  id="emailCode"
                  name="emailCode"
                  value={form.emailCode}
                  onChange={handleChange}
                  placeholder="인증번호를 입력해 주세요"
                  disabled={form.emailVerified}
                />
                <button
                  type="button"
                  className="sub-btn"
                  onClick={handleVerifyEmail}
                  disabled={form.emailVerified || timeLeft <= 0 || !isCodeSent}
                >
                  인증 확인
                </button>
              </div>

              {isCodeSent && !form.emailVerified && (
                <div className="timer-text">남은 시간: {formatTime(timeLeft)}</div>
              )}

              {emailVerifyMessage && <div className={emailMessageClass}>{emailVerifyMessage}</div>}
            </div>
          )}

          <div className="form-group">
            <label htmlFor="phone">휴대폰 번호</label>
            <input
              type="text"
              id="phone"
              name="phone"
              value={form.phone}
              onChange={handleChange}
              placeholder="'-' 없이 입력해 주세요"
            />
          </div>

          <button
            type="submit"
            className={`signup-btn ${form.emailVerified ? 'verified-btn' : ''}`}
          >
            {form.socialSignup ? '소셜회원가입 완료' : form.emailVerified ? '회원가입 계속' : '회원가입'}
          </button>
        </form>

        <div className="signup-footer">
          <span>이미 계정이 있으신가요?</span>
          <Link to="/login">로그인</Link>
        </div>
      </div>

      {showSuccessModal && (
        <div className="signup-modal-overlay" role="dialog" aria-modal="true">
          <div className="signup-modal">
            <div className="signup-modal-badge">Welcome</div>
            <h3 className="signup-modal-title">{successTitle}</h3>
            <p className="signup-modal-text">{successMessage}</p>
            <div className="signup-modal-actions">
              <button type="button" className="signup-modal-btn" onClick={() => navigate('/login')}>
                로그인하러 가기
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  )
}

export default SignupPage

