import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import './MyPagePasswordPage.css'
import { API_BASE_URL } from '@/config/api'

function MyPagePasswordPage() {
  const navigate = useNavigate()

  const [form, setForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  })
  const [isSocialLogin, setIsSocialLogin] = useState(false)
  const [errorMessage, setErrorMessage] = useState('')
  const [successMessage, setSuccessMessage] = useState('')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchMyInfo = async () => {
      try {
        const response = await fetch(`${API_BASE_URL}/api/members/me`, {
          credentials: 'include',
        })

        if (!response.ok) {
          navigate('/login')
          return
        }

        const data = await response.json()

        if (data.socialLogin) {
          setIsSocialLogin(true)
        }
      } catch {
        setErrorMessage('회원 정보를 확인하지 못했습니다.')
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

    if (form.newPassword !== form.confirmPassword) {
      setErrorMessage('새 비밀번호가 일치하지 않습니다.')
      return
    }

    try {
      const res = await fetch(`${API_BASE_URL}/api/members/me/password`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          currentPassword: form.currentPassword,
          newPassword: form.newPassword,
          confirmPassword: form.confirmPassword,
        }),
      })

      const data = await res.json()

      if (!res.ok) {
        throw new Error(data.message || '비밀번호 변경에 실패했습니다.')
      }

      setSuccessMessage(data.message || '비밀번호가 변경되었습니다.')
      navigate('/mypage/edit')
    } catch (error) {
      setErrorMessage(error.message)
    }
  }

  if (loading) {
    return <div className="page-status">로딩 중...</div>
  }

  if (isSocialLogin) {
    return (
      <section className="signup-page">
        <div className="signup-card">
          <h2 className="signup-title">비밀번호 변경</h2>
          <div className="form-success">
            카카오 로그인 회원은 비밀번호 변경 기능을 사용할 수 없습니다. 회원정보 수정에서 필요한 정보를 변경해 주세요.
          </div>
          <div className="password-btn-group">
            <Link to="/mypage/edit" className="password-submit-btn">
              회원정보 수정으로 이동
            </Link>
            <Link to="/mypage" className="password-cancel-btn">
              마이페이지로 이동
            </Link>
          </div>
        </div>
      </section>
    )
  }

  return (
    <section className="signup-page">
      <div className="signup-card">
        <h2 className="signup-title">비밀번호 변경</h2>

        {errorMessage && <div className="form-error">{errorMessage}</div>}
        {successMessage && <div className="form-success">{successMessage}</div>}

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="currentPassword">현재 비밀번호</label>
            <input
              type="password"
              id="currentPassword"
              name="currentPassword"
              value={form.currentPassword}
              onChange={handleChange}
            />
          </div>

          <div className="form-group">
            <label htmlFor="newPassword">새 비밀번호</label>
            <input
              type="password"
              id="newPassword"
              name="newPassword"
              value={form.newPassword}
              onChange={handleChange}
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
            />
          </div>

          <div className="password-btn-group">
            <button type="submit" className="password-submit-btn">
              비밀번호 변경
            </button>

            <Link to="/mypage/edit" className="password-cancel-btn">
              취소
            </Link>
          </div>
        </form>
      </div>
    </section>
  )
}

export default MyPagePasswordPage
