import { useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import './AdminMemberDetailPage.css'
import { API_BASE_URL } from '@/config/api'

function AdminMemberDetailPage() {
  const { memberId } = useParams()
  const navigate = useNavigate()

  const [member, setMember] = useState(null)
  const [selectedRole, setSelectedRole] = useState('')
  const [loading, setLoading] = useState(true)
  const [errorMessage, setErrorMessage] = useState('')
  const [successModalOpen, setSuccessModalOpen] = useState(false)
  const [treatmentRecords, setTreatmentRecords] = useState([])
  const [treatmentLoading, setTreatmentLoading] = useState(true)

  useEffect(() => {
    fetchMember()
    fetchTreatmentRecords()
  }, [memberId])

  const fetchMember = async () => {
    try {
      setLoading(true)
      setErrorMessage('')

      const res = await fetch(`${API_BASE_URL}/api/admin/members/${memberId}`, {
        method: 'GET',
        credentials: 'include',
      })

      if (!res.ok) {
        throw new Error('회원 상세 조회에 실패했습니다.')
      }

      const data = await res.json()
      setMember(data)
      setSelectedRole(data.role)
    } catch (error) {
      console.error(error)
      setErrorMessage(error.message || '회원 정보를 불러오는 중 오류가 발생했습니다.')
    } finally {
      setLoading(false)
    }
  }

  const fetchTreatmentRecords = async () => {
    try {
      setTreatmentLoading(true)

      const res = await fetch(`${API_BASE_URL}/api/admin/members/${memberId}/treatment-records`, {
        credentials: 'include',
      })

      if (!res.ok) {
        throw new Error('시술 기록을 불러오지 못했습니다.')
      }

      const data = await res.json()
      setTreatmentRecords(data)
    } catch (error) {
      console.error(error)
      setErrorMessage(error.message || '시술 기록 조회 중 오류가 발생했습니다.')
    } finally {
      setTreatmentLoading(false)
    }
  }

  const handleRoleUpdate = async () => {
    try {
      setErrorMessage('')

      const res = await fetch(`${API_BASE_URL}/api/admin/members/${memberId}/role`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({ role: selectedRole }),
      })

      const message = await res.text()

      if (!res.ok) {
        throw new Error(message || '권한 변경에 실패했습니다.')
      }

      await fetchMember()
      setSuccessModalOpen(true)
    } catch (error) {
      console.error(error)
      setErrorMessage(error.message || '권한 변경 중 오류가 발생했습니다.')
    }
  }

  const closeSuccessModal = () => {
    setSuccessModalOpen(false)
  }

  if (loading) {
    return <div className="admin-member-detail-page">로딩 중...</div>
  }

  if (!member) {
    return <div className="admin-member-detail-page">회원 정보가 없습니다.</div>
  }

  return (
    <div className="admin-member-detail-page">
      <div className="admin-member-detail-header">
        <h2>회원 상세</h2>
        <div className="admin-member-detail-actions">
          <Link to="/admin/members" className="back-link">
            목록으로
          </Link>
          <button type="button" onClick={() => navigate(-1)}>
            뒤로가기
          </button>
        </div>
      </div>

      {errorMessage && <p className="admin-member-error">{errorMessage}</p>}

      <div className="admin-member-detail-card">
        <div className="detail-row">
          <span className="label">회원번호</span>
          <span className="value">{member.id}</span>
        </div>

        <div className="detail-row">
          <span className="label">아이디</span>
          <span className="value">{member.loginId}</span>
        </div>

        <div className="detail-row">
          <span className="label">이름</span>
          <span className="value">{member.name}</span>
        </div>

        <div className="detail-row">
          <span className="label">이메일</span>
          <span className="value">{member.email}</span>
        </div>

        <div className="detail-row">
          <span className="label">휴대폰번호</span>
          <span className="value">{member.phone}</span>
        </div>

        <div className="detail-row">
          <span className="label">현재 권한</span>
          <span className="value">{member.role === 'ADMIN' ? '관리자' : '일반회원'}</span>
        </div>
      </div>

      <div className="admin-member-role-box">
        <h3>권한 변경</h3>

        <select value={selectedRole} onChange={(e) => setSelectedRole(e.target.value)}>
          <option value="USER">일반회원</option>
          <option value="ADMIN">관리자</option>
        </select>

        <button type="button" onClick={handleRoleUpdate}>
          권한 변경
        </button>
      </div>

      <div className="admin-member-treatment-box">
        <div className="admin-member-treatment-header">
          <div>
            <h3>시술 기록</h3>
            <p>기록을 클릭하면 시술 전후 사진과 메모를 자세히 볼 수 있습니다.</p>
          </div>
          <Link to="/admin/treatment-records/new" className="admin-member-treatment-create-link">
            시술 기록 등록
          </Link>
        </div>

        {treatmentLoading ? (
          <p className="admin-member-treatment-empty">시술 기록을 불러오는 중입니다.</p>
        ) : treatmentRecords.length === 0 ? (
          <p className="admin-member-treatment-empty">등록된 시술 기록이 없습니다.</p>
        ) : (
          <div className="admin-member-treatment-list">
            {treatmentRecords.map((record) => (
              <Link
                key={record.id}
                to={`/admin/members/${memberId}/treatment-records/${record.id}`}
                className="admin-member-treatment-card"
              >
                <div className="admin-member-treatment-top">
                  <strong>{record.procedureName}</strong>
                  <span>{record.treatmentDate}</span>
                </div>
                <p className="admin-member-treatment-hint">전후 사진과 시술 기록 상세 보기</p>
              </Link>
            ))}
          </div>
        )}
      </div>

      {successModalOpen && (
        <div className="admin-modal-overlay">
          <div className="admin-modal">
            <h3>알림</h3>
            <p>변경되었습니다.</p>
            <div className="admin-modal-buttons">
              <button type="button" onClick={closeSuccessModal}>
                확인
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default AdminMemberDetailPage

