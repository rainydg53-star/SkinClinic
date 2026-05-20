import { useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import './ProcedureDetailPage.css'
import { API_BASE_URL } from '@/config/api'


function ProcedureDetailPage() {
  const { procedureId } = useParams()
  const navigate = useNavigate()

  const [procedure, setProcedure] = useState(null)
  const [loading, setLoading] = useState(true)
  const [errorMessage, setErrorMessage] = useState('')

  useEffect(() => {
    const fetchProcedureDetail = async () => {
      try {
        setLoading(true)
        setErrorMessage('')

        const detailRes = await fetch(`${API_BASE_URL}/api/procedures/${procedureId}`, { method: 'GET' })

        if (!detailRes.ok) {
          throw new Error('시술 상세 정보를 불러오지 못했습니다.')
        }

        const detailData = await detailRes.json()
        setProcedure(detailData)
      } catch (error) {
        setErrorMessage(error.message)
      } finally {
        setLoading(false)
      }
    }

    fetchProcedureDetail()
  }, [procedureId])

  const getImageUrl = (imageUrl) => {
    if (!imageUrl) return ''
    return `${API_BASE_URL}${imageUrl}`
  }

  if (loading) {
    return <div className="procedure-detail-status">로딩 중...</div>
  }

  if (errorMessage) {
    return <div className="procedure-detail-status error">{errorMessage}</div>
  }

  if (!procedure) {
    return <div className="procedure-detail-status error">시술 정보가 없습니다.</div>
  }

  return (
    <section className="procedure-detail-page">
      <div className="procedure-detail-container">
        <div className="procedure-detail-top">
          <button type="button" className="procedure-back-btn" onClick={() => navigate('/procedures')}>
            목록으로
          </button>
        </div>

        <section className="procedure-hero-card">
          <div className="procedure-hero-image-wrap">
            {procedure.imageUrl ? (
              <img src={getImageUrl(procedure.imageUrl)} alt={procedure.name} className="procedure-hero-image" />
            ) : (
              <div className="procedure-detail-placeholder">시술 이미지</div>
            )}
          </div>

          <div className="procedure-hero-content">
            <span className="procedure-detail-category">{procedure.category || '시술'}</span>
            <h1>{procedure.name}</h1>
            <p className="procedure-hero-summary">{procedure.summary || '맞춤형 시술 안내를 확인해보세요.'}</p>

            <div className="procedure-hero-meta">
              <div className="procedure-meta-row">
                <span>가격</span>
                <strong>{Number(procedure.price || 0).toLocaleString()}원</strong>
              </div>
              <div className="procedure-meta-row description-row">
                <span>시술 설명</span>
                <p>{procedure.description || procedure.summary || '-'}</p>
              </div>
            </div>

            <div className="procedure-detail-btn-group">
              <Link to="/procedures" className="procedure-list-btn">
                시술 목록
              </Link>
              <Link to={`/reservations?procedureId=${procedure.id}`} className="procedure-reserve-btn">
                시술예약
              </Link>
            </div>
          </div>
        </section>

        <section className="procedure-key-icons">
          <article>
            <span>탄력 개선</span>
            <p>리프팅 포인트</p>
          </article>
          <article>
            <span>맞춤 시술</span>
            <p>개인별 플랜</p>
          </article>
          <article>
            <span>정밀 케어</span>
            <p>섬세한 에너지</p>
          </article>
        </section>

        {procedure.detailImageUrls && procedure.detailImageUrls.length > 0 ? (
          <section className="procedure-detail-gallery">
            <h3>상세 이미지</h3>
            {procedure.detailImageUrls.map((imageUrl, index) => (
              <img
                key={`${imageUrl}-${index}`}
                src={getImageUrl(imageUrl)}
                alt={`${procedure.name} 상세 이미지 ${index + 1}`}
              />
            ))}
          </section>
        ) : (
          <section className="procedure-no-detail-images">
            <p>등록된 상세 이미지가 없습니다.</p>
          </section>
        )}
      </div>
    </section>
  )
}

export default ProcedureDetailPage
