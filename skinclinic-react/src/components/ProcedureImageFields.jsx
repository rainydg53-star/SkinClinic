import './ProcedureImageFields.css'
import { MAX_DETAIL_IMAGES } from '../hooks/useProcedureImageManager'
import { API_BASE_URL } from '@/config/api'


function getImageUrl(imageUrl) {
  if (!imageUrl) {
    return ''
  }

  return `${API_BASE_URL}${imageUrl}`
}

function ProcedureImageFields({
  idPrefix,
  manager,
  onError,
  editMode = false,
}) {
  const {
    currentThumbnail,
    currentDetailImages,
    thumbnailImage,
    thumbnailPreview,
    detailImages,
    detailPreviews,
    isThumbnailDragOver,
    isDetailDragOver,
    setIsThumbnailDragOver,
    setIsDetailDragOver,
    setThumbnailFile,
    addDetailFiles,
    removeThumbnail,
    removeDetailImage,
  } = manager

  const hasCurrentThumbnail = Boolean(currentThumbnail) && !thumbnailPreview
  const hasCurrentDetails = currentDetailImages.length > 0 && detailPreviews.length === 0
  const isReplacingDetailImages = editMode && currentDetailImages.length > 0 && detailImages.length > 0

  const handleThumbnailChange = (event) => {
    const file = event.target.files?.[0]
    const result = setThumbnailFile(file)

    if (result?.message) {
      onError(result.message)
    } else if (result?.ok) {
      onError('')
    }

    event.target.value = ''
  }

  const handleDetailChange = (event) => {
    const result = addDetailFiles(event.target.files)

    if (result?.message) {
      onError(result.message)
    } else if (result?.ok) {
      onError('')
    }

    event.target.value = ''
  }

  const handleThumbnailDrop = (event) => {
    event.preventDefault()
    setIsThumbnailDragOver(false)
    const result = setThumbnailFile(event.dataTransfer.files?.[0])

    if (result?.message) {
      onError(result.message)
    } else if (result?.ok) {
      onError('')
    }
  }

  const handleDetailDrop = (event) => {
    event.preventDefault()
    setIsDetailDragOver(false)
    const result = addDetailFiles(event.dataTransfer.files)

    if (result?.message) {
      onError(result.message)
    } else if (result?.ok) {
      onError('')
    }
  }

  return (
    <div className="procedure-image-fields">
      <div className="form-group">
        <div className="image-section-header">
          <div>
            <label htmlFor={`${idPrefix}-thumbnail`}>썸네일 이미지</label>
            <p className="image-section-description">
              목록 카드와 상단에 노출되는 메인 이미지입니다.
            </p>
          </div>
          <span className="image-section-badge required">필수 권장</span>
        </div>

        {(hasCurrentThumbnail || thumbnailPreview) && (
          <div className="preview-grid preview-grid-single">
            {hasCurrentThumbnail && (
              <div className="preview-card">
                <span className="preview-card-badge">현재 이미지</span>
                <img
                  src={getImageUrl(currentThumbnail)}
                  alt="현재 썸네일"
                  className="preview-thumbnail"
                />
              </div>
            )}

            {thumbnailPreview && (
              <div className="preview-card">
                <span className="preview-card-badge accent">업로드 예정</span>
                <img src={thumbnailPreview} alt="썸네일 미리보기" className="preview-thumbnail" />
                <div className="preview-card-footer">
                  <span className="selected-file-name">{thumbnailImage?.name}</span>
                  <button type="button" className="preview-remove-btn" onClick={removeThumbnail}>
                    제거
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        <div
          className={`image-drop-zone ${isThumbnailDragOver ? 'drag-over' : ''}`}
          onDragOver={(event) => {
            event.preventDefault()
            setIsThumbnailDragOver(true)
          }}
          onDragLeave={() => setIsThumbnailDragOver(false)}
          onDrop={handleThumbnailDrop}
        >
          <div className="image-drop-zone-inner">
            <div className="upload-icon">IMG</div>
            <p className="drop-zone-title">썸네일을 드래그하거나 파일을 선택해 주세요</p>
            <p className="drop-zone-subtitle">
              권장 비율은 1:1 또는 4:3, 첫 인상에 결정되는 대표 이미지입니다.
            </p>
            <label htmlFor={`${idPrefix}-thumbnail`} className="file-select-btn">
              썸네일 선택
            </label>
            <input
              type="file"
              id={`${idPrefix}-thumbnail`}
              accept="image/*"
              onChange={handleThumbnailChange}
              className="hidden-file-input"
            />
          </div>
        </div>
      </div>

      <div className="form-group">
        <div className="image-section-header">
          <div>
            <label htmlFor={`${idPrefix}-detail`}>상세 이미지</label>
            <p className="image-section-description">
              상세 페이지에서 시술 분위기와 과정을 보여주는 보조 이미지입니다.
            </p>
          </div>
          <span className="image-section-badge">
            {detailImages.length}/{MAX_DETAIL_IMAGES}장
          </span>
        </div>

        {editMode && currentDetailImages.length > 0 && (
          <div className={`image-status-note ${isReplacingDetailImages ? 'warning' : ''}`}>
            {isReplacingDetailImages
              ? '새 상세 이미지를 추가하면 기존 상세 이미지가 새 목록으로 교체됩니다.'
              : '현재 등록된 상세 이미지를 유지하려면 그대로 두고, 새 파일을 추가하면 전체 목록이 교체됩니다.'}
          </div>
        )}

        {(hasCurrentDetails || detailPreviews.length > 0) && (
          <div className="preview-grid">
            {hasCurrentDetails &&
              currentDetailImages.map((imageUrl, index) => (
                <div key={`current-${imageUrl}-${index}`} className="preview-card">
                  <span className="preview-card-badge">현재 이미지</span>
                  <img
                    src={getImageUrl(imageUrl)}
                    alt={`현재 상세 이미지 ${index + 1}`}
                    className="preview-detail-image"
                  />
                </div>
              ))}

            {detailPreviews.map((preview, index) => (
              <div key={`next-${preview}`} className="preview-card">
                <span className="preview-card-badge accent">업로드 예정</span>
                <img
                  src={preview}
                  alt={`상세 이미지 미리보기 ${index + 1}`}
                  className="preview-detail-image"
                />
                <div className="preview-card-footer">
                  <span className="selected-file-name">{detailImages[index]?.name}</span>
                  <button
                    type="button"
                    className="preview-remove-btn"
                    onClick={() => removeDetailImage(index)}
                  >
                    제거
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        <div
          className={`image-drop-zone detail-drop-zone ${isDetailDragOver ? 'drag-over' : ''}`}
          onDragOver={(event) => {
            event.preventDefault()
            setIsDetailDragOver(true)
          }}
          onDragLeave={() => setIsDetailDragOver(false)}
          onDrop={handleDetailDrop}
        >
          <div className="image-drop-zone-inner">
            <div className="upload-icon">+N</div>
            <p className="drop-zone-title">상세 이미지는 여러 장을 한 번에 추가할 수 있습니다</p>
            <p className="drop-zone-subtitle">드래그 또는 파일 선택으로 최대 5장까지 등록할 수 있습니다.</p>
            <label htmlFor={`${idPrefix}-detail`} className="file-select-btn">
              상세 이미지 추가
            </label>
            <input
              type="file"
              id={`${idPrefix}-detail`}
              accept="image/*"
              multiple
              onChange={handleDetailChange}
              className="hidden-file-input"
            />
            <p className="image-guide-text">JPG, PNG, WEBP 권장</p>
          </div>
        </div>
      </div>
    </div>
  )
}

export default ProcedureImageFields

