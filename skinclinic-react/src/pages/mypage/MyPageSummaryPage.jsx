import { Link } from 'react-router-dom'
import './MyPageSummaryPage.css'

function MyPageSummaryPage() {
  return (
    <div className="mypage-summary">
      <h2 className="mypage-section-title">마이페이지</h2>
      <div className="mypage-menu-grid">
        <Link to="/mypage/dashboard" className="mypage-menu-card">
          <h3>통합조회</h3>
          <p>피부 진단, 추천, 예약, 결제, 상담, 시술 기록, 알림을 한 번에 확인합니다.</p>
        </Link>
        <Link to="/mypage/payments" className="mypage-menu-card">
          <h3>결제 내역</h3>
          <p>시술명, 결제 금액, 결제 상태를 확인할 수 있습니다.</p>
        </Link>

        <Link to="/mypage/consultations" className="mypage-menu-card">
          <h3>상담 내역</h3>
          <p>채팅 상담과 1:1 상담 기록을 확인할 수 있습니다.</p>
        </Link>

        <Link to="/mypage/recommendation" className="mypage-menu-card">
          <h3>맞춤 추천</h3>
          <p>내 피부 상태에 맞는 추천 시술을 확인할 수 있습니다.</p>
        </Link>

        <Link to="/mypage/treatments" className="mypage-menu-card">
          <h3>시술 기록</h3>
          <p>지금까지 받은 시술 이력과 결과를 확인할 수 있습니다.</p>
        </Link>

        <Link to="/mypage/notifications" className="mypage-menu-card">
          <h3>알림 내역</h3>
          <p>예약, 결제, 상담 관련 알림과 발송 상태를 확인할 수 있습니다.</p>
        </Link>


        <Link to="/mypage/edit" className="mypage-menu-card">
          <h3>회원정보 수정</h3>
          <p>이름, 연락처 등의 정보를 수정하고 계정을 관리할 수 있습니다.</p>
        </Link>

        <Link to="/mypage/withdraw" className="mypage-menu-card">
          <h3>회원탈퇴</h3>
          <p>탈퇴 전 주의사항을 확인하고 계정 탈퇴를 진행할 수 있습니다.</p>
        </Link>
      </div>
    </div>
  )
}

export default MyPageSummaryPage
