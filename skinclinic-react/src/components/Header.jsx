import { useEffect, useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import './Header.css'
import { API_BASE_URL } from '@/config/api'

function Header({ isLoggedIn, setIsLoggedIn, role, setRole }) {
  const navigate = useNavigate()
  const [procedureCategories, setProcedureCategories] = useState([])

  useEffect(() => {
    const fetchProcedureCategories = async () => {
      try {
        const response = await fetch(`${API_BASE_URL}/api/procedures`, {
          method: 'GET',
        })

        if (!response.ok) {
          return
        }

        const data = await response.json()
        const categories = Array.from(
          new Set(
            (Array.isArray(data) ? data : [])
              .map((procedure) => String(procedure.category || '').trim())
              .filter(Boolean),
          ),
        )
        setProcedureCategories(categories)
      } catch (error) {
        console.error('헤더 카테고리 로드 실패:', error)
      }
    }

    fetchProcedureCategories()
  }, [])

  const procedureCategoryLinks = useMemo(
    () =>
      procedureCategories.map((category) => ({
        label: category,
        to: `/procedures?category=${encodeURIComponent(category)}`,
      })),
    [procedureCategories],
  )

  const handleLogout = async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/logout`, {
        method: 'POST',
        credentials: 'include',
      })

      if (!res.ok) {
        console.error('로그아웃 실패:', res.status)
        return
      }

      setIsLoggedIn(false)
      setRole('')
      navigate('/')
    } catch (error) {
      console.error('로그아웃 요청 실패:', error)
    }
  }

  return (
    <header className="header">
      <div className="header-left">
        <div className="logo">
          <h2>
            <Link to="/">누리클리닉</Link>
          </h2>
        </div>

        <nav className="nav-menu">
          <div className="nav-procedure-dropdown">
            <Link to="/procedures" className="nav-procedure-link">
              시술 목록
            </Link>
            <div className="nav-procedure-panel">
              {procedureCategoryLinks.map((categoryLink) => (
                <Link
                  key={categoryLink.label}
                  to={categoryLink.to}
                  className="nav-procedure-item"
                >
                  {categoryLink.label}
                </Link>
              ))}
            </div>
          </div>
          <Link to="/reservations">시술예약</Link>
          <Link to="/skin-diagnosis">피부진단</Link>
          <Link to="/skin-survey">피부설문</Link>
        </nav>
      </div>

      <div className="auth-menu">
        {!isLoggedIn ? (
          <>
            <Link to="/login" className="auth-link">
              로그인
            </Link>
            <Link to="/signup" className="auth-link">
              회원가입
            </Link>
          </>
        ) : (
          <>
            {role === 'ROLE_ADMIN' && (
              <Link to="/admin" className="auth-link admin-link">
                관리자
              </Link>
            )}

            <Link to="/mypage" className="auth-link">
              마이페이지
            </Link>

            <button type="button" className="auth-link logout-btn" onClick={handleLogout}>
              로그아웃
            </button>
          </>
        )}
      </div>
    </header>
  )
}

export default Header
