import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import './MyPageVerifyPasswordPage.css'
import { API_BASE_URL } from '@/config/api'

function MyPageVerifyPasswordPage() {
  const navigate = useNavigate()

  const [password, setPassword] = useState('')
  const [errorMessage, setErrorMessage] = useState('')
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
          navigate('/mypage/edit', { replace: true })
          return
        }
      } catch {
        setErrorMessage('회원 정보를 확인하지 못했습니다.')
      } finally {
        setLoading(false)
      }
    }

    fetchMyInfo()
  }, [navigate])

  const handleSubmit = async (e) => {
    e.preventDefault()
    setErrorMessage('')

    try {
      const res = await fetch(`${API_BASE_URL}/api/members/verify-password`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({ password }),
      })

      const data = await res.json()

      if (!res.ok) {
        throw new Error(data.message || '비밀번호가 올바르지 않습니다.')
      }

      navigate('/mypage/edit')
    } catch (error) {
      setErrorMessage(error.message)
    }
  }

  if (loading) {
    return <div className="page-status">확인 중...</div>
  }

  return (
    <section className="verify-page">
      <div className="verify-card">
        <h2 className="verify-title">비밀번호 확인</h2>
        <p className="verify-subtitle">회원정보 수정을 위해 현재 비밀번호를 입력해 주세요.</p>

        {errorMessage && <div className="form-error">{errorMessage}</div>}

        <form onSubmit={handleSubmit} className="verify-form">
          <div className="form-group">
            <label htmlFor="password">현재 비밀번호</label>
            <input
              type="password"
              id="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="현재 비밀번호를 입력해 주세요"
            />
          </div>

          <div className="verify-btn-group">
            <button type="submit" className="verify-submit-btn">
              확인
            </button>

            <Link to="/mypage" className="verify-cancel-btn">
              취소
            </Link>
          </div>
        </form>
      </div>
    </section>
  )
}

export default MyPageVerifyPasswordPage
