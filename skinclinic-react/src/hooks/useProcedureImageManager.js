import { useEffect, useRef, useState } from 'react'

export const MAX_DETAIL_IMAGES = 5

function isImageFile(file) {
  return file?.type?.startsWith('image/')
}

function revokeUrl(url) {
  if (url) {
    URL.revokeObjectURL(url)
  }
}

export function useProcedureImageManager() {
  const [currentThumbnail, setCurrentThumbnail] = useState('')
  const [currentDetailImages, setCurrentDetailImages] = useState([])
  const [thumbnailImage, setThumbnailImage] = useState(null)
  const [thumbnailPreview, setThumbnailPreview] = useState('')
  const [detailImages, setDetailImages] = useState([])
  const [detailPreviews, setDetailPreviews] = useState([])
  const [isThumbnailDragOver, setIsThumbnailDragOver] = useState(false)
  const [isDetailDragOver, setIsDetailDragOver] = useState(false)
  const thumbnailPreviewRef = useRef('')
  const detailPreviewRef = useRef([])

  useEffect(() => {
    return () => {
      revokeUrl(thumbnailPreviewRef.current)
      detailPreviewRef.current.forEach(revokeUrl)
    }
  }, [])

  const replaceThumbnailPreview = (nextUrl) => {
    revokeUrl(thumbnailPreviewRef.current)
    thumbnailPreviewRef.current = nextUrl
    setThumbnailPreview(nextUrl)
  }

  const replaceDetailPreviews = (nextUrls) => {
    detailPreviewRef.current.forEach(revokeUrl)
    detailPreviewRef.current = nextUrls
    setDetailPreviews(nextUrls)
  }

  const syncExistingImages = ({ thumbnailUrl = '', detailUrls = [] } = {}) => {
    setCurrentThumbnail(thumbnailUrl)
    setCurrentDetailImages(detailUrls)
  }

  const setThumbnailFile = (file) => {
    if (!file) {
      return { ok: false }
    }

    if (!isImageFile(file)) {
      return { ok: false, message: '썸네일은 이미지 파일만 업로드할 수 있습니다.' }
    }

    setThumbnailImage(file)
    replaceThumbnailPreview(URL.createObjectURL(file))
    return { ok: true }
  }

  const addDetailFiles = (files) => {
    const nextFiles = Array.from(files || [])

    if (nextFiles.length === 0) {
      return { ok: false }
    }

    const invalidFile = nextFiles.find((file) => !isImageFile(file))
    if (invalidFile) {
      return { ok: false, message: '상세 이미지는 이미지 파일만 업로드할 수 있습니다.' }
    }

    const remainingSlots = MAX_DETAIL_IMAGES - detailImages.length
    if (remainingSlots <= 0) {
      return { ok: false, message: `상세 이미지는 최대 ${MAX_DETAIL_IMAGES}장까지 등록할 수 있습니다.` }
    }

    const acceptedFiles = nextFiles.slice(0, remainingSlots)
    const acceptedPreviews = acceptedFiles.map((file) => URL.createObjectURL(file))

    setDetailImages((prev) => [...prev, ...acceptedFiles])
    replaceDetailPreviews([...detailPreviewRef.current, ...acceptedPreviews])

    if (acceptedFiles.length < nextFiles.length) {
      return {
        ok: true,
        message: `상세 이미지는 최대 ${MAX_DETAIL_IMAGES}장까지 등록할 수 있어 ${acceptedFiles.length}장만 추가했습니다.`,
      }
    }

    return { ok: true }
  }

  const removeThumbnail = () => {
    setThumbnailImage(null)
    replaceThumbnailPreview('')
  }

  const removeDetailImage = (index) => {
    setDetailImages((prev) => prev.filter((_, itemIndex) => itemIndex !== index))
    const nextUrls = detailPreviewRef.current.filter((_, itemIndex) => itemIndex !== index)
    revokeUrl(detailPreviewRef.current[index])
    detailPreviewRef.current = nextUrls
    setDetailPreviews(nextUrls)
  }

  const appendToFormData = (formData) => {
    if (thumbnailImage) {
      formData.append('thumbnailImage', thumbnailImage)
    }

    detailImages.forEach((image) => {
      formData.append('detailImages', image)
    })
  }

  return {
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
    syncExistingImages,
    setThumbnailFile,
    addDetailFiles,
    removeThumbnail,
    removeDetailImage,
    appendToFormData,
  }
}
