import { useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import ProcedureImageFields from '../../components/ProcedureImageFields'
import { useProcedureImageManager } from '../../hooks/useProcedureImageManager'
import './AdminProcedureEditPage.css'
import { API_BASE_URL } from '@/config/api'

function AdminProcedureEditPage() {
  const { procedureId } = useParams()
  const navigate = useNavigate()
  const imageManager = useProcedureImageManager()

  const [form, setForm] = useState({
    name: '',
    summary: '',
    description: '',
    price: '',
    category: '',
    visible: true,
  })
  const [loading, setLoading] = useState(true)
  const [errorMessage, setErrorMessage] = useState('')
  const [successMessage, setSuccessMessage] = useState('')
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [categoryOptions, setCategoryOptions] = useState([])
  const [newCategory, setNewCategory] = useState('')

  useEffect(() => {
    const loadPageData = async () => {
      try {
        setLoading(true)
        setErrorMessage('')

        const [procedureResponse, categoryResponse] = await Promise.all([
          fetch(`${API_BASE_URL}/api/admin/procedures/${procedureId}`, {
            method: 'GET',
            credentials: 'include',
          }),
          fetch(`${API_BASE_URL}/api/admin/procedures/categories`, {
            method: 'GET',
            credentials: 'include',
          }),
        ])

        if (!procedureResponse.ok) {
          throw new Error('시술 정보를 불러오지 못했습니다.')
        }

        if (!categoryResponse.ok) {
          throw new Error('카테고리 목록을 불러오지 못했습니다.')
        }

        const procedureData = await procedureResponse.json()
        const categoryData = await categoryResponse.json()
        const loadedCategory = String(procedureData.category || '').trim()
        const normalizedCategories = Array.isArray(categoryData) ? categoryData : []

        const mergedCategories =
          loadedCategory && !normalizedCategories.some((category) => category.name === loadedCategory)
            ? [...normalizedCategories, { id: null, name: loadedCategory }]
            : normalizedCategories

        setCategoryOptions(mergedCategories)

        setForm({
          name: procedureData.name || '',
          summary: procedureData.summary || '',
          description: procedureData.description || '',
          price: procedureData.price || '',
          category: loadedCategory,
          visible: procedureData.visible ?? true,
        })

        imageManager.syncExistingImages({
          thumbnailUrl: procedureData.imageUrl || '',
          detailUrls: procedureData.detailImageUrls || [],
        })
      } catch (error) {
        setErrorMessage(error.message)
      } finally {
        setLoading(false)
      }
    }

    loadPageData()
  }, [procedureId])

  const handleChange = (event) => {
    const { name, value, type, checked } = event.target
    setForm((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }))
  }

  const handleCategorySelect = (categoryName) => {
    setErrorMessage('')
    setForm((prev) => ({
      ...prev,
      category: categoryName,
    }))
  }

  const handleAddCategory = () => {
    const normalizedCategory = newCategory.trim()

    if (!normalizedCategory) {
      setErrorMessage('추가할 카테고리명을 입력해 주세요.')
      return
    }

    const existingCategory = categoryOptions.find((category) => category.name === normalizedCategory)
    if (existingCategory) {
      setForm((prev) => ({
        ...prev,
        category: existingCategory.name,
      }))
      setNewCategory('')
      setErrorMessage('')
      return
    }

    setErrorMessage('')
    setCategoryOptions((prev) => [...prev.filter((item) => item.name !== normalizedCategory), { id: null, name: normalizedCategory }])
    setForm((prev) => ({
      ...prev,
      category: normalizedCategory,
    }))
    setNewCategory('')
  }

  const handleDeleteCategory = async (category) => {
    try {
      setErrorMessage('')

      if (category?.id) {
        const response = await fetch(`${API_BASE_URL}/api/admin/procedures/categories/${category.id}`, {
          method: 'DELETE',
          credentials: 'include',
        })

        const data = await response.json()

        if (!response.ok) {
          throw new Error(data.message || '카테고리 삭제에 실패했습니다.')
        }
      }

      setCategoryOptions((prev) => prev.filter((item) => item.name !== category.name))
      setForm((prev) => ({
        ...prev,
        category: prev.category === category.name ? '' : prev.category,
      }))
    } catch (error) {
      setErrorMessage(error.message)
    }
  }

  const handleSubmit = async (event) => {
    event.preventDefault()
    setErrorMessage('')
    setSuccessMessage('')

    try {
      const normalizedCategory = form.category.trim()
      if (!normalizedCategory) {
        throw new Error('카테고리를 선택하거나 추가해 주세요.')
      }

      const formData = new FormData()
      formData.append('name', form.name)
      formData.append('summary', form.summary)
      formData.append('description', form.description)
      formData.append('price', form.price)
      formData.append('category', normalizedCategory)
      formData.append('visible', String(form.visible))
      imageManager.appendToFormData(formData)

      const response = await fetch(`${API_BASE_URL}/api/admin/procedures/${procedureId}`, {
        method: 'PUT',
        credentials: 'include',
        body: formData,
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.message || '시술 수정에 실패했습니다.')
      }

      setSuccessMessage(data.message || '시술이 수정되었습니다.')

      setTimeout(() => {
        navigate('/admin/procedures')
      }, 800)
    } catch (error) {
      setErrorMessage(error.message)
    }
  }

  const handleDelete = async () => {
    setErrorMessage('')
    setSuccessMessage('')

    try {
      const response = await fetch(`${API_BASE_URL}/api/admin/procedures/${procedureId}`, {
        method: 'DELETE',
        credentials: 'include',
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.message || '시술 삭제에 실패했습니다.')
      }

      setShowDeleteModal(false)
      navigate('/admin/procedures')
    } catch (error) {
      setErrorMessage(error.message)
      setShowDeleteModal(false)
    }
  }

  if (loading) {
    return <div className="admin-procedure-status">로딩 중...</div>
  }

  return (
    <section className="admin-procedure-form-page">
      <div className="admin-procedure-form-container">
        <div className="admin-procedure-form-header">
          <h2 className="admin-procedure-form-title">시술 수정</h2>
          <p className="admin-procedure-form-subtitle">등록된 시술 정보와 이미지를 수정해 주세요.</p>
        </div>

        {errorMessage && <div className="form-error">{errorMessage}</div>}
        {successMessage && <div className="form-success">{successMessage}</div>}

        <form onSubmit={handleSubmit} className="admin-procedure-form">
          <div className="form-group">
            <label htmlFor="name">시술명</label>
            <input type="text" id="name" name="name" value={form.name} onChange={handleChange} />
          </div>

          <div className="form-group">
            <label htmlFor="summary">한 줄 설명</label>
            <input type="text" id="summary" name="summary" value={form.summary} onChange={handleChange} />
          </div>

          <div className="form-group">
            <label htmlFor="description">상세 설명</label>
            <textarea
              id="description"
              name="description"
              rows="6"
              value={form.description}
              onChange={handleChange}
            />
          </div>

          <div className="form-row">
            <div className="form-group">
              <label htmlFor="price">가격</label>
              <input type="number" id="price" name="price" value={form.price} onChange={handleChange} />
            </div>

            <div className="form-group">
              <label>카테고리</label>
              <div className="category-toggle-group">
                {categoryOptions.map((category) => (
                  <div key={category.id ?? category.name} className="category-chip">
                    <button
                      type="button"
                      className={`category-toggle-btn${form.category === category.name ? ' active' : ''}`}
                      onClick={() => handleCategorySelect(category.name)}
                    >
                      {category.name}
                    </button>
                    <button
                      type="button"
                      className="category-delete-btn"
                      onClick={() => handleDeleteCategory(category)}
                      aria-label={`${category.name} 카테고리 삭제`}
                    >
                      x
                    </button>
                  </div>
                ))}
              </div>
              <div className="category-add-row">
                <input
                  type="text"
                  id="newCategory"
                  value={newCategory}
                  onChange={(event) => setNewCategory(event.target.value)}
                  placeholder="카테고리 직접 입력"
                />
                <button type="button" className="category-add-btn" onClick={handleAddCategory}>
                  카테고리 추가
                </button>
              </div>
              <p className="category-selected-text">
                선택된 카테고리: {form.category || '선택 안 됨'}
              </p>
            </div>
          </div>

          <ProcedureImageFields
            idPrefix="procedure-edit"
            manager={imageManager}
            onError={setErrorMessage}
            editMode
          />

          <div className="visibility-toggle-group">
            <div className="visibility-toggle-text">
              <strong>시술 게시판 노출</strong>
              <p>현재 상태: {form.visible ? '노출' : '비노출'}</p>
            </div>

            <label className="visibility-switch">
              <input type="checkbox" name="visible" checked={form.visible} onChange={handleChange} />
              <span className="visibility-slider"></span>
            </label>
          </div>

          <div className="admin-procedure-btn-group">
            <button type="submit" className="admin-procedure-submit-btn">
              수정 완료
            </button>
            <button
              type="button"
              className="admin-procedure-delete-btn"
              onClick={() => setShowDeleteModal(true)}
            >
              삭제
            </button>
            <Link to="/admin/procedures" className="admin-procedure-cancel-btn">
              취소
            </Link>
          </div>
        </form>
      </div>

      {showDeleteModal && (
        <div className="modal-overlay">
          <div className="modal-box">
            <h3>시술 삭제</h3>
            <p>정말 삭제하시겠습니까?</p>

            <div className="modal-btn-group">
              <button type="button" className="modal-confirm-btn" onClick={handleDelete}>
                삭제
              </button>
              <button type="button" className="modal-cancel-btn" onClick={() => setShowDeleteModal(false)}>
                취소
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  )
}

export default AdminProcedureEditPage
