import { useEffect, useState } from 'react'
import { Link, Outlet } from 'react-router-dom'
import './MyPageLayout.css'
import { API_BASE_URL } from '@/config/api'

function MyPageLayout() {
  const [editPath, setEditPath] = useState('/mypage/verify-password')

  useEffect(() => {
    const fetchMyInfo = async () => {
      try {
        const response = await fetch(`${API_BASE_URL}/api/members/me`, {
          credentials: 'include',
        })

        if (!response.ok) {
          return
        }

        const data = await response.json()

        if (data.socialLogin) {
          setEditPath('/mypage/edit')
        }
      } catch (error) {
        console.error('Failed to load member info:', error)
      }
    }

    fetchMyInfo()
  }, [])

  return (
    <section className="mypage-page">
      <div className="mypage-layout">
        <aside className="mypage-sidebar">
          <h2 className="mypage-title">마이페이지</h2>

          <nav className="mypage-nav">
            <Link to="/mypage">통합조회</Link>
            <Link to="/mypage/payments">결제 내역</Link>
            <Link to="/mypage/consultations">상담 내역</Link>
            <Link to="/mypage/recommendation">맞춤 추천</Link>
            <Link to="/mypage/records">시술 기록</Link>
            <Link to="/mypage/notifications">알림 내역</Link>
            <Link to={editPath}>회원정보 수정</Link>
            <Link to="/mypage/withdraw">회원탈퇴</Link>
          </nav>
        </aside>

        <main className="mypage-content">
          <Outlet />
        </main>
      </div>
    </section>
  )
}

export default MyPageLayout
