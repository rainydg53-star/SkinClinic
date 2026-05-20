import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAlertModal } from '../../components/useAlertModal'
import { API_BASE_URL } from '@/config/api'

function MyPageMainPage() {
  const navigate = useNavigate()
  const { showAlert } = useAlertModal()

  const [member, setMember] = useState({
    loginId: '',
    name: '',
    email: '',
    phone: '',
  })

  const [loading, setLoading] = useState(true)
  const [errorMessage, setErrorMessage] = useState('')
  const [withdrawPassword, setWithdrawPassword] = useState('')
  const [withdrawing, setWithdrawing] = useState(false)

  useEffect(() => {
    const fetchMyInfo = async () => {
      try {
        const res = await fetch(`${API_BASE_URL}/api/members/me`, {
          method: 'GET',
          credentials: 'include',
        })

        if (res.status === 401) {
          showAlert({
            title: '로그인 필요',
            message: '로그인이 필요한 서비스입니다.',
            onConfirm: () => navigate('/login'),
          })
          return
        }

        if (!res.ok) {
          throw new Error('마이페이지 정보를 불러오지 못했습니다.')
        }

        const data = await res.json()

        setMember({
          loginId: data.loginId || '',
          name: data.name || '',
          email: data.email || '',
          phone: data.phone || '',
        })
      } catch (error) {
        setErrorMessage(error.message)
      } finally {
        setLoading(false)
      }
    }

    fetchMyInfo()
  }, [navigate, showAlert])

  const handleWithdraw = async () => {
    const confirmed = window.confirm(
      '정말 회원탈퇴 하시겠습니까? 탈퇴 후 다시 로그인할 수 없습니다.'
    )

    if (!confirmed) {
      return
    }

    try {
      setWithdrawing(true)
      setErrorMessage('')

      const response = await fetch(`${API_BASE_URL}/api/members/me`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          password: withdrawPassword,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.message || '회원탈퇴를 진행하지 못했습니다.')
      }

      showAlert({
        title: '회원탈퇴 완료',
        message: '회원탈퇴가 완료되었습니다.',
        onConfirm: () => navigate('/'),
      })
    } catch (error) {
      setErrorMessage(error.message)
    } finally {
      setWithdrawing(false)
    }
  }

  if (loading) {
    return <div className="page-status">로딩 중...</div>
  }

  return (
    <section className="mypage-page">
      <div className="mypage-container">
        <div className="mypage-profile-card">
          <div className="mypage-profile-top">
            <div className="profile-image">S</div>
            <div className="profile-info">
              <h2>마이페이지</h2>
              <p>회원 정보를 확인하고 자주 쓰는 메뉴로 빠르게 이동할 수 있습니다.</p>
            </div>
          </div>

          {errorMessage && <div className="form-error">{errorMessage}</div>}

          <div className="mypage-user-info">
            <div className="info-row">
              <span className="info-label">아이디</span>
              <span className="info-value">{member.loginId || 'guest'}</span>
            </div>
            <div className="info-row">
              <span className="info-label">이름</span>
              <span className="info-value">{member.name || '미등록 회원'}</span>
            </div>
            <div className="info-row">
              <span className="info-label">이메일</span>
              <span className="info-value">{member.email || 'example@email.com'}</span>
            </div>
            <div className="info-row">
              <span className="info-label">휴대폰번호</span>
              <span className="info-value">{member.phone || '01012345678'}</span>
            </div>
          </div>
        </div>

        <div className="mypage-withdraw-card">
          <h3>회원탈퇴</h3>
          <p>탈퇴를 진행하면 현재 계정으로 다시 로그인할 수 없습니다.</p>

          <input
            type="password"
            className="mypage-withdraw-input"
            placeholder="비밀번호를 입력하세요"
            value={withdrawPassword}
            onChange={(e) => setWithdrawPassword(e.target.value)}
          />

          <button
            type="button"
            className="mypage-withdraw-btn"
            onClick={handleWithdraw}
            disabled={withdrawing}
          >
            {withdrawing ? '탈퇴 처리 중...' : '회원탈퇴'}
          </button>
        </div>

        <div className="mypage-menu-grid">
          <Link to="/mypage/summary" className="mypage-menu-card">
            <h3>마이페이지 통합 조회</h3>
            <p>진단, 추천, 예약, 결제, 상담, 시술 기록, 알림 내역을 확인하세요.</p>
          </Link>

          <Link to="/reservations" className="mypage-menu-card">
            <h3>예약 내역</h3>
            <p>시술 예약 현황과 방문 일정을 확인할 수 있습니다.</p>
          </Link>

          <Link to="/skin/diagnosis" className="mypage-menu-card">
            <h3>피부 진단 결과</h3>
            <p>누적된 피부 상태 진단 결과를 모아볼 수 있습니다.</p>
          </Link>

          <Link to="/skin/recommendation" className="mypage-menu-card">
            <h3>맞춤 추천</h3>
            <p>내 피부 상태에 맞는 시술 추천 내용을 확인해보세요.</p>
          </Link>
        </div>
      </div>
    </section>
  )
}

export default MyPageMainPage

