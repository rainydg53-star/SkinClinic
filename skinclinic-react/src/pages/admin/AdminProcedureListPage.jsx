import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useAlertModal } from '../../components/useAlertModal'
import './AdminProcedureListPage.css'
import { API_BASE_URL } from '@/config/api'

function AdminProcedureListPage() {
  const { showAlert, showConfirm } = useAlertModal()
  const [procedures, setProcedures] = useState([])
  const [loading, setLoading] = useState(true)
  const [errorMessage, setErrorMessage] = useState('')

  useEffect(() => {
    const fetchProcedures = async () => {
      try {
        const res = await fetch(`${API_BASE_URL}/api/admin/procedures`, {
          method: 'GET',
          credentials: 'include',
        })

        const contentType = res.headers.get('content-type')

        if (!res.ok) {
          throw new Error('시술 관리 목록을 불러오지 못했습니다.')
        }

        if (!contentType || !contentType.includes('application/json')) {
          throw new Error('응답 형식이 올바르지 않습니다.')
        }

        const data = await res.json()
        setProcedures(data)
      } catch (error) {
        setErrorMessage(error.message)
      } finally {
        setLoading(false)
      }
    }

    fetchProcedures()
  }, [])

  const deleteProcedure = async (procedureId) => {
    try {
      const res = await fetch(`${API_BASE_URL}/api/admin/procedures/${procedureId}`, {
        method: 'DELETE',
        credentials: 'include',
      })

      if (!res.ok) {
        const contentType = res.headers.get('content-type') || ''
        if (contentType.includes('application/json')) {
          const data = await res.json()
          throw new Error(data?.message || '시술 삭제에 실패했습니다.')
        }
        throw new Error('시술 삭제에 실패했습니다.')
      }

      setProcedures((prev) => prev.filter((p) => p.id !== procedureId))
    } catch (error) {
      showAlert({
        title: '삭제 실패',
        message: error.message,
      })
    }
  }

  if (loading) {
    return <div className="admin-procedure-status">로딩 중...</div>
  }

  if (errorMessage) {
    return <div className="admin-procedure-status error">{errorMessage}</div>
  }

  return (
    <section className="admin-procedure-page">
      <div className="admin-procedure-container">
        <div className="admin-procedure-header">
          <div>
            <h2 className="admin-procedure-title">시술 관리</h2>
            <p className="admin-procedure-subtitle">
              등록된 시술을 조회하고 수정 또는 삭제할 수 있습니다.
            </p>
          </div>

          <Link to="/admin/procedures/new" className="admin-procedure-create-btn">
            시술 등록
          </Link>
        </div>

        <div className="admin-procedure-table-wrap">
          <table className="admin-procedure-table">
            <thead>
              <tr>
                <th>ID</th>
                <th>시술명</th>
                <th>카테고리</th>
                <th>가격</th>
                <th>노출 여부</th>
                <th>관리</th>
              </tr>
            </thead>

            <tbody>
              {procedures.length === 0 ? (
                <tr>
                  <td colSpan="6" className="empty-row">
                    등록된 시술이 없습니다.
                  </td>
                </tr>
              ) : (
                procedures.map((procedure) => (
                  <tr key={procedure.id}>
                    <td>{procedure.id}</td>
                    <td>{procedure.name}</td>
                    <td>{procedure.category}</td>
                    <td>{Number(procedure.price || 0).toLocaleString()}원</td>
                    <td>
                      <span className={procedure.visible ? 'visible-badge' : 'hidden-badge'}>
                        {procedure.visible ? '노출' : '비노출'}
                      </span>
                    </td>
                    <td className="admin-action-cell">
                      <Link to={`/admin/procedures/${procedure.id}/edit`} className="admin-edit-link">
                        수정
                      </Link>

                      <button
                        type="button"
                        className="admin-delete-btn"
                        onClick={() =>
                          showConfirm({
                            title: '시술 삭제',
                            message: '정말 삭제하시겠습니까?',
                            confirmText: '삭제',
                            cancelText: '취소',
                            onConfirm: () => deleteProcedure(procedure.id),
                          })
                        }
                      >
                        삭제
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </section>
  )
}

export default AdminProcedureListPage
