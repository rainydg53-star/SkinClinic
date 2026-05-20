import { useEffect, useMemo, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import './ProcedureListPage.css'
import { API_BASE_URL } from '@/config/api'

const ALL_CATEGORY = '전체보기'

function ProcedureListPage() {
  const [searchParams] = useSearchParams()
  const [procedures, setProcedures] = useState([])
  const [loading, setLoading] = useState(true)
  const [errorMessage, setErrorMessage] = useState('')
  const [selectedCategory, setSelectedCategory] = useState(ALL_CATEGORY)

  useEffect(() => {
    fetchProcedures()
  }, [])

  const fetchProcedures = async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/api/procedures`, {
        method: 'GET',
      })

      if (!res.ok) {
        throw new Error('시술 목록을 불러오지 못했습니다.')
      }

      const data = await res.json()
      setProcedures(data)
    } catch (error) {
      setErrorMessage(error.message)
    } finally {
      setLoading(false)
    }
  }

  const categoryOptions = useMemo(() => {
    const existingCategories = Array.from(
      new Set(
        procedures
          .map((procedure) => String(procedure.category || '').trim())
          .filter(Boolean),
      ),
    )

    return [ALL_CATEGORY, ...existingCategories]
  }, [procedures])

  useEffect(() => {
    const categoryFromQuery = String(searchParams.get('category') || '').trim()
    if (!categoryFromQuery) return
    if (categoryOptions.includes(categoryFromQuery)) {
      setSelectedCategory(categoryFromQuery)
    }
  }, [searchParams, categoryOptions])

  const filteredProcedures = useMemo(() => {
    if (selectedCategory === ALL_CATEGORY) return procedures
    return procedures.filter(
      (procedure) => String(procedure.category || '').trim() === selectedCategory,
    )
  }, [procedures, selectedCategory])

  const getImageUrl = (imageUrl) => {
    if (!imageUrl) return ''
    return `${API_BASE_URL}${imageUrl}`
  }

  if (loading) {
    return <div className="procedure-status">로딩 중...</div>
  }

  if (errorMessage) {
    return <div className="procedure-status error">{errorMessage}</div>
  }

  return (
    <section className="procedure-page">
      <div className="procedure-container">
        <header className="procedure-hero">
          <p className="procedure-hero-eyebrow">NURI CLINIC</p>
          <h1>시술 정보</h1>
          <p className="procedure-hero-subtitle">원하시는 시술정보를 만나보세요</p>
        </header>

        <div className="procedure-category-tabs" role="tablist" aria-label="시술 카테고리">
          {categoryOptions.map((category) => (
            <button
              key={category}
              type="button"
              className={selectedCategory === category ? 'active' : ''}
              onClick={() => setSelectedCategory(category)}
            >
              {category}
            </button>
          ))}
        </div>

        {filteredProcedures.length === 0 ? (
          <div className="procedure-empty">선택한 카테고리에 표시할 시술이 없습니다.</div>
        ) : (
          <div className="procedure-list">
            {filteredProcedures.map((procedure) => (
              <article key={procedure.id} className="procedure-row">
                <Link to={`/procedures/${procedure.id}`} className="procedure-row-image-link">
                  <div className="procedure-row-image-wrap">
                    {procedure.imageUrl ? (
                      <img src={getImageUrl(procedure.imageUrl)} alt={procedure.name} className="procedure-row-image" />
                    ) : (
                      <div className="procedure-row-placeholder">시술 이미지</div>
                    )}
                  </div>
                </Link>

                <div className="procedure-row-content">
                  <p className="procedure-row-kicker">Nuri Clinic treatment</p>
                  <h2>{procedure.name}</h2>
                  <p className="procedure-row-highlight">{procedure.summary || '맞춤형 시술 솔루션을 제공합니다.'}</p>
                  <p className="procedure-row-description">{procedure.description || procedure.summary || '-'}</p>
                  <div className="procedure-row-footer">
                    <span className="procedure-row-price">{Number(procedure.price || 0).toLocaleString()}원</span>
                    <Link to={`/procedures/${procedure.id}`} className="procedure-row-more-btn">
                      더보기
                    </Link>
                  </div>
                </div>
              </article>
            ))}
          </div>
        )}
      </div>
    </section>
  )
}

export default ProcedureListPage
