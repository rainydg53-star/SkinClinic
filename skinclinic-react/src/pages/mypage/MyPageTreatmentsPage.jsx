import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { formatDateTime } from '@/utils/date'
import './mypagesection.css'
import './MyPageTreatmentsPage.css'
import { API_BASE_URL } from '@/config/api'


function MyPageTreatmentsPage() {
  const navigate = useNavigate()
  const [records, setRecords] = useState([])
  const [selectedRecord, setSelectedRecord] = useState(null)
  const [loading, setLoading] = useState(true)
  const [detailLoading, setDetailLoading] = useState(false)
  const [errorMessage, setErrorMessage] = useState('')
  const [zoomedImageUrl, setZoomedImageUrl] = useState('')
  const [zoomedImageLabel, setZoomedImageLabel] = useState('')

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

  const fetchRecordDetail = async (recordId) => {
    try {
      setDetailLoading(true)
      setErrorMessage('')

      const response = await fetch(`${API_BASE_URL}/api/treatment-records/${recordId}`, {
        credentials: 'include',
      })
      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.message || '시술 기록 상세 정보를 불러오지 못했습니다.')
      }

      setSelectedRecord(data)
    } catch (error) {
      setErrorMessage(error.message)
    } finally {
      setDetailLoading(false)
    }
  }

  useEffect(() => {
    const fetchRecords = async () => {
      try {
        const response = await fetch(`${API_BASE_URL}/api/treatment-records/me`, {
          credentials: 'include',
        })
        const data = await response.json()

        if (!response.ok) {
          throw new Error(data.message || '시술 기록을 불러오지 못했습니다.')
        }

        const recordList = Array.isArray(data) ? data : []
        setRecords(recordList)

      } catch (error) {
        setErrorMessage(error.message)
      } finally {
        setLoading(false)
      }
    }

    fetchRecords()
  }, [])

  if (loading) {
    return <div className="treatment-page-status">시술 기록을 불러오는 중...</div>
  }

  if (errorMessage && records.length === 0) {
    return <div className="treatment-page-status error">{errorMessage}</div>
  }

  return (
    <section className="mypage-section-card">
      <div className="notification-header">
        <div>
          <h2>시술 기록</h2>
          <p className="notification-subtitle">
            등록된 시술 기록을 선택해서 시술 전후 사진과 상세 메모를 확인해보세요.
          </p>
        </div>
      </div>

      {errorMessage && <div className="treatment-page-inline-error">{errorMessage}</div>}

      {records.length === 0 ? (
        <p>아직 등록된 시술 기록이 없습니다.</p>
      ) : (
        <>
          <div className="procedure-review-candidate-list" style={{ marginBottom: 24 }}>
            {records.map((record) => {
              const isActive = selectedRecord?.id === record.id

              return (
                <div
                  key={record.id}
                  className={`mypage-section-item procedure-review-candidate-card ${isActive ? 'active' : ''}`}
                >
                  <div className="procedure-review-candidate-main">
                    <strong>{record.procedureName}</strong>
                    <div className="procedure-review-candidate-meta">
                      <span>시술일 {formatDateTime(record.treatmentDate)}</span>
                    </div>
                  </div>

                  <button
                    type="button"
                    className="notification-read-button procedure-review-candidate-button"
                    onClick={() => fetchRecordDetail(record.id)}
                  >
                    상세 보기
                  </button>
                </div>
              )
            })}
          </div>

          <div className="mypage-section-list">
            <div className="mypage-section-item procedure-review-history-card">
              {detailLoading ? (
                <p>상세 정보를 불러오는 중...</p>
              ) : !selectedRecord ? (
                <p>목록에서 시술 기록의 상세 보기를 눌러주세요.</p>
              ) : (
                <>
                  <div className="procedure-review-card-top">
                    <strong>{selectedRecord.procedureName}</strong>
                    <div className="procedure-review-rating-badge">기록</div>
                  </div>

                  <div className="procedure-review-meta-grid">
                    <div className="procedure-review-meta-item">
                      <span>시술일</span>
                      <strong>{formatDateTime(selectedRecord.treatmentDate)}</strong>
                    </div>
                  </div>

                  {selectedRecord.notes ? (
                    <div className="procedure-review-comment-box">
                      <span>시술 메모</span>
                      <p>{selectedRecord.notes}</p>
                    </div>
                  ) : null}

                  <div className="treatment-compare-grid">
                    <div className="treatment-image-card">
                      <h4>시술 전</h4>
                      {selectedRecord.beforeImageUrl ? (
                        <img
                          src={getImageUrl(selectedRecord.beforeImageUrl)}
                          alt="시술 전 사진"
                          className="treatment-image clickable"
                          onClick={() => openImageModal(selectedRecord.beforeImageUrl, '시술 전 사진')}
                        />
                      ) : (
                        <div className="treatment-image-placeholder">등록된 시술 전 사진이 없습니다.</div>
                      )}
                    </div>

                    <div className="treatment-image-card">
                      <h4>시술 후</h4>
                      {selectedRecord.afterImageUrl ? (
                        <img
                          src={getImageUrl(selectedRecord.afterImageUrl)}
                          alt="시술 후 사진"
                          className="treatment-image clickable"
                          onClick={() => openImageModal(selectedRecord.afterImageUrl, '시술 후 사진')}
                        />
                      ) : (
                        <div className="treatment-image-placeholder">등록된 시술 후 사진이 없습니다.</div>
                      )}
                    </div>
                  </div>

                  <div style={{ marginTop: 16 }}>
                    <button
                      type="button"
                      className="notification-read-button"
                      onClick={() => navigate('/mypage/reviews')}
                    >
                      만족도 평가 하러가기
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        </>
      )}

      {zoomedImageUrl && (
        <div className="treatment-image-modal" onClick={closeImageModal}>
          <div className="treatment-image-modal-content" onClick={(event) => event.stopPropagation()}>
            <div className="treatment-image-modal-header">
              <strong>{zoomedImageLabel}</strong>
              <button type="button" className="treatment-image-modal-close" onClick={closeImageModal}>
                닫기
              </button>
            </div>

            <img src={zoomedImageUrl} alt={zoomedImageLabel} className="treatment-image-modal-preview" />
          </div>
        </div>
      )}
    </section>
  )
}

export default MyPageTreatmentsPage
