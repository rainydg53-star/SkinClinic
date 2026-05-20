import { useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { useAlertModal } from '../../components/useAlertModal'
import './AdminTreatmentRecordDetailPage.css'
import { API_BASE_URL } from '@/config/api'


function AdminTreatmentRecordDetailPage() {
  const { memberId, treatmentRecordId } = useParams()
  const navigate = useNavigate()
  const { showAlert, showConfirm } = useAlertModal()

  const [record, setRecord] = useState(null)
  const [loading, setLoading] = useState(true)
  const [errorMessage, setErrorMessage] = useState('')
  const [deleting, setDeleting] = useState(false)
  const [zoomedImageUrl, setZoomedImageUrl] = useState('')
  const [zoomedImageLabel, setZoomedImageLabel] = useState('')

  useEffect(() => {
    const fetchRecord = async () => {
      try {
        setLoading(true)
        setErrorMessage('')

        const response = await fetch(
          `${API_BASE_URL}/api/admin/members/${memberId}/treatment-records/${treatmentRecordId}`,
          {
            credentials: 'include',
          }
        )

        if (!response.ok) {
          throw new Error('시술 기록 상세를 불러오지 못했습니다.')
        }

        const data = await response.json()
        setRecord(data)
      } catch (error) {
        console.error(error)
        setErrorMessage(error.message || '시술 기록을 불러오는 중 오류가 발생했습니다.')
      } finally {
        setLoading(false)
      }
    }

    fetchRecord()
  }, [memberId, treatmentRecordId])

  const getImageUrl = (imageUrl) => {
    if (!imageUrl) return ''
    return `${API_BASE_URL}${imageUrl}`
  }

  const openImageModal = (imageUrl, label) => {
    setZoomedImageUrl(getImageUrl(imageUrl))
    setZoomedImageLabel(label)
  }

  const closeImageModal = () => {
    setZoomedImageUrl('')
    setZoomedImageLabel('')
  }

  const processDelete = async () => {
    try {
      setDeleting(true)
      setErrorMessage('')

      const response = await fetch(
        `${API_BASE_URL}/api/admin/members/${memberId}/treatment-records/${treatmentRecordId}`,
        {
          method: 'DELETE',
          credentials: 'include',
        }
      )

      if (!response.ok) {
        const text = await response.text()
        throw new Error(text || '시술 기록 삭제에 실패했습니다.')
      }

      showAlert({
        title: '삭제 완료',
        message: '시술 기록이 삭제되었습니다.',
        onConfirm: () => navigate(`/admin/members/${memberId}`),
      })
    } catch (error) {
      console.error(error)
      setErrorMessage(error.message || '시술 기록 삭제 중 오류가 발생했습니다.')
    } finally {
      setDeleting(false)
    }
  }

  const handleDelete = () => {
    showConfirm({
      title: '시술 기록 삭제',
      message: '이 시술 기록을 삭제하시겠습니까? 삭제 후 복구할 수 없습니다.',
      confirmText: '삭제',
      cancelText: '취소',
      onConfirm: processDelete,
    })
  }

  if (loading) {
    return <div className="admin-treatment-record-detail-page">로딩 중...</div>
  }

  if (!record) {
    return <div className="admin-treatment-record-detail-page">시술 기록 정보가 없습니다.</div>
  }

  return (
    <section className="admin-treatment-record-detail-page">
      <div className="admin-treatment-record-detail-header">
        <div>
          <h2>{record.procedureName}</h2>
          <p>시술 날짜: {record.treatmentDate}</p>
        </div>
        <div className="admin-treatment-record-detail-actions">
          <Link to={`/admin/members/${memberId}`}>회원 상세로</Link>
          <button
            type="button"
            className="admin-treatment-record-delete-button"
            onClick={handleDelete}
            disabled={deleting}
          >
            {deleting ? '삭제 중...' : '시술 기록 삭제'}
          </button>
          <button type="button" onClick={() => navigate(-1)}>
            뒤로가기
          </button>
        </div>
      </div>

      {errorMessage && <p className="admin-treatment-record-detail-error">{errorMessage}</p>}

      {record.notes && (
        <div className="admin-treatment-record-notes-box">
          <h3>시술 메모</h3>
          <p>{record.notes}</p>
        </div>
      )}

      <div className="admin-treatment-record-image-grid">
        <div className="admin-treatment-record-image-card">
          <h3>시술 전 사진</h3>
          {record.beforeImageUrl ? (
            <img
              src={getImageUrl(record.beforeImageUrl)}
              alt="시술 전 사진"
              className="admin-treatment-record-image"
              onClick={() => openImageModal(record.beforeImageUrl, '시술 전 사진')}
            />
          ) : (
            <div className="admin-treatment-record-image-placeholder">등록된 시술 전 사진이 없습니다.</div>
          )}
        </div>

        <div className="admin-treatment-record-image-card">
          <h3>시술 후 사진</h3>
          {record.afterImageUrl ? (
            <img
              src={getImageUrl(record.afterImageUrl)}
              alt="시술 후 사진"
              className="admin-treatment-record-image"
              onClick={() => openImageModal(record.afterImageUrl, '시술 후 사진')}
            />
          ) : (
            <div className="admin-treatment-record-image-placeholder">등록된 시술 후 사진이 없습니다.</div>
          )}
        </div>
      </div>

      {zoomedImageUrl && (
        <div className="admin-treatment-record-image-modal-overlay" onClick={closeImageModal}>
          <div
            className="admin-treatment-record-image-modal"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="admin-treatment-record-image-modal-header">
              <strong>{zoomedImageLabel}</strong>
              <button type="button" onClick={closeImageModal}>
                닫기
              </button>
            </div>
            <img
              src={zoomedImageUrl}
              alt={zoomedImageLabel}
              className="admin-treatment-record-image-modal-preview"
            />
          </div>
        </div>
      )}
    </section>
  )
}

export default AdminTreatmentRecordDetailPage
