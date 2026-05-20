import { useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import UserConsultationChatPage from './chat/UserConsultationChatPage'
import AdminChatPage from './admin/AdminChatPage'
import ChatbotPage from './chatbot/ChatbotPage'
import './MainPage.css'
import { API_BASE_URL } from '@/config/api'


function MainPage() {
  const bannerSlides = useMemo(
    () => [
      { src: '/images/home-banner-slide-1.jpg', alt: '배너3' },
      { src: '/images/home-banner-slide-2.png', alt: '배너4' },
      { src: '/images/home-banner-slide-3.jpg', alt: '배너5' },
    ],
    [],
  )
  const [currentSlide, setCurrentSlide] = useState(1)
  const [isBannerTransitionEnabled, setIsBannerTransitionEnabled] = useState(true)
  const [isBannerAnimating, setIsBannerAnimating] = useState(false)
  const [procedures, setProcedures] = useState([])
  const [isChatbotOpen, setIsChatbotOpen] = useState(false)
  const [isConsultationModalOpen, setIsConsultationModalOpen] = useState(false)
  const [isCheckingAuth, setIsCheckingAuth] = useState(false)
  const [myRole, setMyRole] = useState('')
  const navigate = useNavigate()
  const cardSliderRef = useRef(null)
  const isBannerAnimatingRef = useRef(false)

  const moveSlide = (direction) => {
    if (isBannerAnimatingRef.current) return

    isBannerAnimatingRef.current = true
    setIsBannerAnimating(true)
    setCurrentSlide((prev) => prev + direction)
  }

  useEffect(() => {
    const timerId = window.setInterval(() => {
      if (isBannerAnimatingRef.current) return

      isBannerAnimatingRef.current = true
      setIsBannerAnimating(true)
      setCurrentSlide((prev) => prev + 1)
    }, 3000)

    return () => window.clearInterval(timerId)
  }, [])

  const handleBannerTransitionEnd = () => {
    if (currentSlide >= bannerSlides.length + 1) {
      setIsBannerTransitionEnabled(false)
      setCurrentSlide(1)
      isBannerAnimatingRef.current = false
      setIsBannerAnimating(false)
      return
    }

    if (currentSlide <= 0) {
      setIsBannerTransitionEnabled(false)
      setCurrentSlide(bannerSlides.length)
      isBannerAnimatingRef.current = false
      setIsBannerAnimating(false)
      return
    }

    isBannerAnimatingRef.current = false
    setIsBannerAnimating(false)
  }

  useEffect(() => {
    if (!isBannerTransitionEnabled) {
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          setIsBannerTransitionEnabled(true)
        })
      })
    }
  }, [isBannerTransitionEnabled])

  useEffect(() => {
    if (!isBannerAnimating) return

    const guardTimerId = window.setTimeout(() => {
      isBannerAnimatingRef.current = false
      setIsBannerAnimating(false)
    }, 700)

    return () => window.clearTimeout(guardTimerId)
  }, [isBannerAnimating])

  const scrollSlider = (direction) => {
    if (!cardSliderRef.current) return

    const scrollAmount = 300
    cardSliderRef.current.scrollLeft += direction * scrollAmount
  }

  const consultationTitle = myRole === 'ROLE_ADMIN' ? '회원 1:1 상담' : '1:1 상담'

  const featuredProcedures = useMemo(() => {
    if (procedures.length === 0) {
      return []
    }

    const shuffled = [...procedures]
    for (let i = shuffled.length - 1; i > 0; i -= 1) {
      const j = Math.floor(Math.random() * (i + 1))
      const temp = shuffled[i]
      shuffled[i] = shuffled[j]
      shuffled[j] = temp
    }

    return shuffled.slice(0, 9)
  }, [procedures])

  useEffect(() => {
    const fetchMyRole = async () => {
      try {
        const response = await fetch(`${API_BASE_URL}/api/auth/me`, {
          credentials: 'include',
        })

        if (!response.ok) {
          setMyRole('')
          return
        }

        const data = await response.json()
        setMyRole(data.role || '')
      } catch {
        setMyRole('')
      }
    }

    fetchMyRole()
  }, [])

  useEffect(() => {
    const fetchProcedures = async () => {
      try {
        const response = await fetch(`${API_BASE_URL}/api/procedures`)
        if (!response.ok) {
          return
        }

        const data = await response.json()
        setProcedures(Array.isArray(data) ? data : [])
      } catch {
        setProcedures([])
      }
    }

    fetchProcedures()
  }, [])

  const getImageUrl = (imageUrl) => {
    if (!imageUrl) return ''
    return `${API_BASE_URL}${imageUrl}`
  }

  const handleConsultationClick = async () => {
    if (isCheckingAuth) {
      return
    }

    setIsCheckingAuth(true)
    try {
      const response = await fetch(`${API_BASE_URL}/api/auth/me`, {
        credentials: 'include',
      })

      if (!response.ok) {
        navigate('/login')
        return
      }

      const data = await response.json()
      setMyRole(data.role || '')
      setIsConsultationModalOpen(true)
    } catch {
      navigate('/login')
    } finally {
      setIsCheckingAuth(false)
    }
  }

  const handleMoveToConsultationFromChatbot = () => {
    setIsChatbotOpen(false)
    handleConsultationClick()
  }

  useEffect(() => {
    if (!isConsultationModalOpen) {
      return
    }

    const onKeyDown = (event) => {
      if (event.key === 'Escape') {
        setIsConsultationModalOpen(false)
      }
    }

    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [isConsultationModalOpen])

  return (
    <div className="main-page">
      <section className="banner">
        <div
          className="slide-container"
          style={{
            transform: `translateX(-${currentSlide * 100}%)`,
            transition: isBannerTransitionEnabled ? 'transform 0.5s ease-in-out' : 'none',
          }}
          onTransitionEnd={handleBannerTransitionEnd}
        >
          <div className="slide">
            <img src={bannerSlides[bannerSlides.length - 1].src} alt={bannerSlides[bannerSlides.length - 1].alt} />
          </div>
          {bannerSlides.map((slide) => (
            <div className="slide" key={slide.src}>
              <img src={slide.src} alt={slide.alt} />
            </div>
          ))}
          <div className="slide">
            <img src={bannerSlides[0].src} alt={bannerSlides[0].alt} />
          </div>
        </div>

        <button className="prev-btn" onClick={() => moveSlide(-1)}>
          &#10094;
        </button>
        <button className="next-btn" onClick={() => moveSlide(1)}>
          &#10095;
        </button>
      </section>

      <section className="procedure-section">
        <div className="slider-wrapper">
          <div className="card-slider" ref={cardSliderRef}>
            {featuredProcedures.length === 0 ? (
              <div className="card">
                <h3>등록된 시술이 없습니다</h3>
                <p>관리자 페이지에서 시술을 등록해 주세요.</p>
              </div>
            ) : (
              featuredProcedures.map((procedure) => (
                <div
                  key={procedure.id}
                  className="card clickable"
                  onClick={() => navigate(`/procedures/${procedure.id}`)}
                  role="button"
                  tabIndex={0}
                  onKeyDown={(event) => {
                    if (event.key === 'Enter' || event.key === ' ') {
                      event.preventDefault()
                      navigate(`/procedures/${procedure.id}`)
                    }
                  }}
                >
                  <div className="procedure-card-thumb">
                    {procedure.imageUrl ? (
                      <img src={getImageUrl(procedure.imageUrl)} alt={procedure.name} />
                    ) : (
                      <div className="procedure-card-placeholder">시술 이미지</div>
                    )}
                  </div>
                  <h3>{procedure.name}</h3>
                  <p>{procedure.summary || '시술 상세 페이지에서 정보를 확인해 주세요.'}</p>
                </div>
              ))
            )}
          </div>

          <div className="slider-controls">
            <button className="nav-btn prev" onClick={() => scrollSlider(-1)}>
              &#10094;
            </button>
            <button className="nav-btn next" onClick={() => scrollSlider(1)}>
              &#10095;
            </button>
          </div>
        </div>
      </section>

      <section className="main-survey-hero">
        <div className="main-survey-hero__content">
          <span className="main-survey-badge">SKIN CONSULTING</span>
          <h2 className="main-survey-hero__title">
            나에게 맞는
            <br />
            피부 솔루션 찾기
          </h2>
          <p className="main-survey-hero__desc">
            피부 타입, 고민, 부위별 상태, 추가 문진 10문항을 바탕으로 점수를 합산해서 맞춤 시술을 추천해드려요.
          </p>
          <div className="main-survey-hero-widget-row">
            <div
              className="main-survey-hero-widget main-survey-hero-widget--action"
              role="button"
              tabIndex={0}
              onClick={() => navigate('/skin-survey')}
              onKeyDown={(event) => {
                if (event.key === 'Enter' || event.key === ' ') {
                  event.preventDefault()
                  navigate('/skin-survey')
                }
              }}
            >
              <div>
                <strong>맞춤 시술 확인하기</strong>
              </div>
            </div>
          </div>
        </div>
        <div className="main-survey-hero__image">
          <div className="main-hero-image-card">
            <img
              src="/images/solution-consultation-hero.jpg"
              alt="Find my solution"
              className="main-hero-image-card__photo"
            />
            <div className="main-hero-image-card__text">
              <span>NURI CLINIC</span>
              <strong>Find my solution</strong>
            </div>
          </div>
        </div>
      </section>

      <button
        type="button"
        className="chatbot-main-fab"
        aria-label="챗봇 상담 열기"
        onClick={() => setIsChatbotOpen(true)}
      >
        <span className="consultation-fab-text">챗봇 상담</span>
      </button>

      <button
        type="button"
        className="consultation-fab"
        aria-label={`${consultationTitle} 열기`}
        onClick={handleConsultationClick}
        disabled={isCheckingAuth}
      >
        <span className="consultation-fab-text">
          {isCheckingAuth ? '확인 중...' : consultationTitle}
        </span>
      </button>

      <ChatbotPage
        isOpen={isChatbotOpen}
        onClose={() => setIsChatbotOpen(false)}
        onMoveToConsultation={handleMoveToConsultationFromChatbot}
        hideTrigger
      />

      {isConsultationModalOpen && (
        <div
          className="consultation-modal-backdrop"
          onClick={() => setIsConsultationModalOpen(false)}
          role="presentation"
        >
          <div className="consultation-modal-panel" onClick={(event) => event.stopPropagation()}>
            <div className="consultation-modal-top">
              <h3>{consultationTitle}</h3>
              <button
                type="button"
                className="consultation-modal-close"
                onClick={() => setIsConsultationModalOpen(false)}
              >
                닫기
              </button>
            </div>

            {myRole === 'ROLE_ADMIN' ? <AdminChatPage /> : <UserConsultationChatPage />}
          </div>
        </div>
      )}
    </div>
  )
}

export default MainPage








