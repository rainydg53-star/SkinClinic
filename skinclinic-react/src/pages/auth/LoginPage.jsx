import { useMemo, useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import './LoginPage.css'
import { API_BASE_URL } from '@/config/api'

function LoginPage({ setIsLoggedIn, setRole, refreshAuth }) {
  const navigate = useNavigate()
  const location = useLocation()
  const redirectPath = useMemo(() => {
    const searchParams = new URLSearchParams(location.search)
    const redirect = searchParams.get('redirect')
    return redirect && redirect.startsWith('/') ? redirect : '/'
  }, [location.search])

  const [form, setForm] = useState({
    username: '',
    password: '',
  })
  const [errorMessage, setErrorMessage] = useState('')

  const handleChange = (e) => {
    const { name, value } = e.target
    setForm((prev) => ({
      ...prev,
      [name]: value,
    }))
  }

  const handleKakaoLogin = () => {
    window.location.href = `${API_BASE_URL}/oauth2/authorization/kakao`
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setErrorMessage('')

    try {
      const body = new URLSearchParams()
      body.append('username', form.username)
      body.append('password', form.password)

      const response = await fetch(`${API_BASE_URL}/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        credentials: 'include',
        body: body.toString(),
      })

      if (response.ok) {
        setIsLoggedIn(true)
        if (typeof refreshAuth === 'function') {
          await refreshAuth()
        } else {
          setRole('')
        }
        navigate(redirectPath, { replace: true })
      } else {
        setErrorMessage('아이디 또는 비밀번호가 올바르지 않습니다.')
      }
    } catch (error) {
      console.error('로그인 실패:', error)
      setErrorMessage('로그인 중 오류가 발생했습니다.')
    }
  }

  return (
    <section className="login-page">
      <div className="login-card">
        <div className="login-title-wrap">
          <h2 className="login-title">로그인</h2>
          <p className="login-subtitle">진단, 예약, 결제와 회원 기능을 편하게 이용해보세요.</p>
        </div>

        {errorMessage && <div className="form-error">{errorMessage}</div>}

        <form onSubmit={handleSubmit} className="login-form">
          <div className="form-group">
            <label htmlFor="username">아이디</label>
            <input
              type="text"
              id="username"
              name="username"
              value={form.username}
              onChange={handleChange}
              placeholder="아이디를 입력해 주세요"
            />
          </div>

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

          <button type="submit" className="login-btn">
            로그인
          </button>
        </form>

        <button type="button" className="kakao-login-btn" onClick={handleKakaoLogin}>
          카카오로 로그인
        </button>

        <div className="login-links">
          <Link to="/find-id">아이디 찾기</Link>
          <span className="divider">|</span>
          <Link to="/find-password">비밀번호 찾기</Link>
        </div>
        <div className="login-footer">
          <span>아직 계정이 없으신가요?</span>
          <Link to="/signup">회원가입</Link>
        </div>
      </div>
    </section>
  )
}

export default LoginPage
