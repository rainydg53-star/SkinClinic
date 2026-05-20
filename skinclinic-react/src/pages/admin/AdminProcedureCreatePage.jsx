import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import ProcedureImageFields from '../../components/ProcedureImageFields'
import { useProcedureImageManager } from '../../hooks/useProcedureImageManager'
import './AdminProcedureCreatePage.css'
import { API_BASE_URL } from '@/config/api'

function AdminProcedureCreatePage() {
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
  const [errorMessage, setErrorMessage] = useState('')
  const [successMessage, setSuccessMessage] = useState('')
  const [categoryOptions, setCategoryOptions] = useState([])
  const [newCategory, setNewCategory] = useState('')

  useEffect(() => {
    const loadCategories = async () => {
      try {
        const response = await fetch(`${API_BASE_URL}/api/admin/procedures/categories`, {
          method: 'GET',
          credentials: 'include',
        })

        if (!response.ok) {
          throw new Error('카테고리 목록을 불러오지 못했습니다.')
        }

        const data = await response.json()
        setCategoryOptions(Array.isArray(data) ? data : [])
      } catch (error) {
        setErrorMessage(error.message)
      }
    }

    loadCategories()
  }, [])

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
    setCategoryOptions((prev) => [...prev, { id: null, name: normalizedCategory }])
    setForm((prev) => ({
      ...prev,
      category: normalizedCategory,
    }))
    setNewCategory('')
  }

  const handleDeleteCategory = async (category) => {
    if (!category?.id) {
      return
    }

    try {
      setErrorMessage('')

      const response = await fetch(`${API_BASE_URL}/api/admin/procedures/categories/${category.id}`, {
        method: 'DELETE',
        credentials: 'include',
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.message || '카테고리 삭제에 실패했습니다.')
      }

      setCategoryOptions((prev) => prev.filter((item) => item.id !== category.id))
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

      const response = await fetch(`${API_BASE_URL}/api/admin/procedures`, {
        method: 'POST',
        credentials: 'include',
        body: formData,
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.message || '시술 등록에 실패했습니다.')
      }

      setSuccessMessage(data.message || '시술이 등록되었습니다.')
      setTimeout(() => {
        navigate('/admin/procedures')
      }, 800)
    } catch (error) {
      setErrorMessage(error.message)
    }
  }

  return (
    <section className="admin-procedure-form-page">
      <div className="admin-procedure-form-container">
        <div className="admin-procedure-form-header">
          <h2 className="admin-procedure-form-title">시술 등록</h2>
          <p className="admin-procedure-form-subtitle">새로운 시술 정보와 이미지를 등록해 주세요.</p>
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
            <input
              type="text"
              id="summary"
              name="summary"
              value={form.summary}
              onChange={handleChange}
            />
          </div>

          <div className="form-group">
            <label htmlFor="description">상세 설명</label>
            <textarea
              id="description"
              name="description"
              value={form.description}
              onChange={handleChange}
              rows="6"
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
                  <div key={category.id} className="category-chip">
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
            idPrefix="procedure-create"
            manager={imageManager}
            onError={setErrorMessage}
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
              등록 완료
            </button>
            <Link to="/admin/procedures" className="admin-procedure-cancel-btn">
              취소
            </Link>
          </div>
        </form>
      </div>
    </section>
  )
}

export default AdminProcedureCreatePage
