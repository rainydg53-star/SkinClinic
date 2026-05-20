import { Link, Outlet } from 'react-router-dom'
import './AdminLayout.css'

function AdminLayout() {
  return (
    <div className="admin-layout">
      <aside className="admin-sidebar">
        <h2 className="admin-logo">관리자</h2>

        <nav className="admin-menu">
          <Link to="/admin" className="admin-menu-item">
            관리자 홈
          </Link>

          <Link to="/admin/procedures" className="admin-menu-item">
            시술 등록
          </Link>

          <Link to="/admin/members" className="admin-menu-item">
            회원 관리
          </Link>

          <Link to="/admin/payments" className="admin-menu-item">
            결제 관리
          </Link>

          <Link to="/admin/reservations" className="admin-menu-item">
            예약 관리
          </Link>

          <Link to="/admin/consultations" className="admin-menu-item">
            1:1 상담
          </Link>

          <Link to="/admin/notifications" className="admin-menu-item">
            자동 알림 관리
          </Link>

          <Link to="/admin/procedure-satisfaction" className="admin-menu-item">
            시술 만족도 통계
          </Link>

          <Link to="/admin/skin-diagnoses" className="admin-menu-item">
            피부진단결과 관리
          </Link>

          <Link to="/admin/treatment-records" className="admin-menu-item">
            시술 기록 관리
          </Link>

          <Link to="/admin/treatment-records/new" className="admin-menu-item">
            시술 기록 등록
          </Link>
        </nav>
      </aside>

      <main className="admin-content">
        <Outlet />
      </main>
    </div>
  )
}

export default AdminLayout
