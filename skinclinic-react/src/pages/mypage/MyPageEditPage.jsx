import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import './MyPageEditPage.css'
import { API_BASE_URL } from '@/config/api'

function MyPageEditPage() {
  const navigate = useNavigate()

  const [form, setForm] = useState({
    name: '',
    email: '',
    phone: '',
  })
  const [isSocialLogin, setIsSocialLogin] = useState(false)
  const [socialProvider, setSocialProvider] = useState('')
  const [errorMessage, setErrorMessage] = useState('')
  const [successMessage, setSuccessMessage] = useState('')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchMyInfo = async () => {
      try {
        const res = await fetch(`${API_BASE_URL}/api/members/me`, {
          method: 'GET',
          credentials: 'include',
        })

        if (res.status === 401 || res.redirected) {
          navigate('/login')
          return
        }

        if (!res.ok) {
          throw new Error('회원 정보를 불러오지 못했습니다.')
        }

        const data = await res.json()

        setForm({
          name: data.name || '',
          email: data.email || '',
          phone: data.phone || '',
        })
        setIsSocialLogin(Boolean(data.socialLogin))
        setSocialProvider(data.socialProvider || '')
      } catch (error) {
        setErrorMessage(error.message)
      } finally {
        setLoading(false)
      }
    }

    fetchMyInfo()
  }, [navigate])

  const handleChange = (e) => {
    const { name, value } = e.target
    setForm((prev) => ({
      ...prev,
      [name]: value,
    }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setErrorMessage('')
    setSuccessMessage('')

    try {
      const res = await fetch(`${API_BASE_URL}/api/members/me`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          name: form.name,
          email: form.email,
          phone: form.phone,
        }),
      })

      const data = await res.json()

      if (!res.ok) {
        throw new Error(data.message || '회원정보 수정에 실패했습니다.')
      }

      setSuccessMessage(data.message || '회원정보가 수정되었습니다.')
    } catch (error) {
      setErrorMessage(error.message)
    }
  }

  if (loading) {
    return <div className="page-status">로딩 중...</div>
  }

  return (
    <section className="signup-page">
      <div className="signup-card">
        <div className="signup-title-wrap">
          <h2 className="signup-title">회원정보 수정</h2>
          <p className="signup-subtitle">회원님의 정보를 수정해보세요.</p>
        </div>

        {isSocialLogin && (
          <div className="form-success">
            {socialProvider === 'KAKAO'
              ? '카카오 로그인 회원은 이름과 이메일을 변경할 수 없고, 연락처만 수정할 수 있습니다.'
              : '소셜 로그인 회원은 이름과 이메일을 변경할 수 없고, 연락처만 수정할 수 있습니다.'}
          </div>
        )}

        {errorMessage && <div className="form-error">{errorMessage}</div>}
        {successMessage && <div className="form-success">{successMessage}</div>}

        <form onSubmit={handleSubmit} className="signup-form">
          <div className="form-group">
            <label htmlFor="name">이름</label>
            <input
              type="text"
              id="name"
              name="name"
              value={form.name}
              onChange={handleChange}
              placeholder="이름을 입력해 주세요"
              readOnly={isSocialLogin}
              className={isSocialLogin ? 'readonly-input' : ''}
            />
          </div>

          <div className="form-group">
            <label htmlFor="email">이메일</label>
            <input
              type="email"
              id="email"
              name="email"
              value={form.email}
              readOnly
              className="readonly-input"
              placeholder="이메일을 입력해 주세요"
            />
          </div>

          <div className="form-group">
            <label htmlFor="phone">휴대폰번호</label>
            <input
              type="text"
              id="phone"
              name="phone"
              value={form.phone}
              onChange={handleChange}
              placeholder="'-' 없이 입력해 주세요"
            />
          </div>

          <div className="edit-btn-group">
            <button type="submit" className="edit-submit-btn">
              수정 완료
            </button>

            {!isSocialLogin && (
              <Link to="/mypage/password" className="edit-password-btn">
                비밀번호 변경
              </Link>
            )}
          </div>
        </form>
      </div>
    </section>
  )
}

export default MyPageEditPage

