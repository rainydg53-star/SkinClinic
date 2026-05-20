import { useEffect, useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import './AdminTreatmentRecordCreatePage.css'
import { API_BASE_URL } from '@/config/api'


function AdminTreatmentRecordCreatePage() {
  const navigate = useNavigate()

  const [members, setMembers] = useState([])
  const [procedures, setProcedures] = useState([])
  const [payments, setPayments] = useState([])
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [errorMessage, setErrorMessage] = useState('')
  const [successMessage, setSuccessMessage] = useState('')

  const [form, setForm] = useState({
    memberId: '',
    procedureId: '',
    paymentId: '',
    treatmentDate: '',
    notes: '',
    beforeImage: null,
    afterImage: null,
  })

  useEffect(() => {
    const fetchOptions = async () => {
      try {
        setLoading(true)
        setErrorMessage('')

        const [memberRes, procedureRes, paymentRes] = await Promise.all([
          fetch(`${API_BASE_URL}/api/admin/members`, { credentials: 'include' }),
          fetch(`${API_BASE_URL}/api/admin/procedures`, { credentials: 'include' }),
          fetch(`${API_BASE_URL}/api/admin/payments`, { credentials: 'include' }),
        ])

        const memberData = await memberRes.json()
        const procedureData = await procedureRes.json()
        const paymentData = await paymentRes.json()

        if (!memberRes.ok) {
          throw new Error(memberData.message || '회원 목록을 불러오지 못했습니다.')
        }

        if (!procedureRes.ok) {
          throw new Error(procedureData.message || '시술 목록을 불러오지 못했습니다.')
        }

        if (!paymentRes.ok) {
          throw new Error(paymentData.message || '결제 목록을 불러오지 못했습니다.')
        }

        setMembers(memberData)
        setProcedures(procedureData)
        setPayments(paymentData)
      } catch (error) {
        setErrorMessage(error.message)
      } finally {
        setLoading(false)
      }
    }

    fetchOptions()
  }, [])

  const availablePayments = useMemo(() => {
    return payments.filter((payment) => {
      if (payment.status !== 'PAID') return false
      if (!form.memberId) return true
      return String(payment.memberId || '') === String(form.memberId)
    })
  }, [payments, form.memberId])

  const handleChange = (event) => {
    const { name, value } = event.target

    if (name === 'paymentId') {
      const selectedPayment = payments.find((payment) => String(payment.id) === String(value))

      setForm((prev) => ({
        ...prev,
        paymentId: value,
        procedureId:
          selectedPayment && selectedPayment.procedureId
            ? String(selectedPayment.procedureId)
            : prev.procedureId,
      }))
      return
    }

    setForm((prev) => ({
      ...prev,
      [name]: value,
      ...(name === 'memberId' ? { paymentId: '' } : {}),
    }))
  }

  const handleFileChange = (event) => {
    const { name, files } = event.target

    setForm((prev) => ({
      ...prev,
      [name]: files && files[0] ? files[0] : null,
    }))
  }

  const getPreviewUrl = (file) => {
    if (!file) return ''
    return URL.createObjectURL(file)
  }

  const handleSubmit = async (event) => {
    event.preventDefault()

    try {
      setSubmitting(true)
      setErrorMessage('')
      setSuccessMessage('')

      const formData = new FormData()
      formData.append('memberId', form.memberId)
      formData.append('procedureId', form.procedureId)
      formData.append('treatmentDate', form.treatmentDate)
      formData.append('notes', form.notes)

      if (form.paymentId) {
        formData.append('paymentId', form.paymentId)
      }

      if (form.beforeImage) {
        formData.append('beforeImage', form.beforeImage)
      }

      if (form.afterImage) {
        formData.append('afterImage', form.afterImage)
      }

      const response = await fetch(`${API_BASE_URL}/api/admin/treatment-records`, {
        method: 'POST',
        credentials: 'include',
        body: formData,
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.message || '시술 기록 등록에 실패했습니다.')
      }

      setSuccessMessage(data.message || '시술 기록이 등록되었습니다.')

      setTimeout(() => {
        navigate('/admin/members')
      }, 800)
    } catch (error) {
      setErrorMessage(error.message)
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) {
    return <div className="admin-treatment-status">등록 화면을 준비하는 중...</div>
  }

  return (
    <section className="admin-treatment-page">
      <div className="admin-treatment-container">
        <div className="admin-treatment-header">
          <h2>시술 기록 등록</h2>
          <p>회원, 시술, 연결 결제, 날짜와 전후 사진을 선택해 시술 기록을 등록합니다.</p>
        </div>

        {errorMessage && <div className="form-error">{errorMessage}</div>}
        {successMessage && <div className="form-success">{successMessage}</div>}

        <form className="admin-treatment-form" onSubmit={handleSubmit}>
          <div className="form-row">
            <div className="form-group">
              <label htmlFor="memberId">회원 선택</label>
              <select
                id="memberId"
                name="memberId"
                value={form.memberId}
                onChange={handleChange}
                required
              >
                <option value="">회원 선택</option>
                {members.map((member) => (
                  <option key={member.id} value={member.id}>
                    {member.name} ({member.loginId})
                  </option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label htmlFor="procedureId">시술 선택</label>
              <select
                id="procedureId"
                name="procedureId"
                value={form.procedureId}
                onChange={handleChange}
                disabled={Boolean(form.paymentId)}
                required
              >
                <option value="">시술 선택</option>
                {procedures.map((procedure) => (
                  <option key={procedure.id} value={procedure.id}>
                    {procedure.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label htmlFor="paymentId">연결 결제 선택</label>
              <select
                id="paymentId"
                name="paymentId"
                value={form.paymentId}
                onChange={handleChange}
              >
                <option value="">선택 안 함</option>
                {availablePayments.map((payment) => (
                  <option key={payment.id} value={payment.id}>
                    {payment.orderId} / {payment.procedureName} / {payment.amount.toLocaleString()}원
                  </option>
                ))}
              </select>
              <p className="form-helper-text">
                결제를 연결해두면 시술 완료 후 해당 결제를 취소할 수 없게 됩니다.
              </p>
            </div>

            <div className="form-group">
              <label htmlFor="treatmentDate">시술 날짜</label>
              <input
                type="date"
                id="treatmentDate"
                name="treatmentDate"
                value={form.treatmentDate}
                onChange={handleChange}
                required
              />
            </div>
          </div>

          <div className="form-group">
            <label htmlFor="notes">시술 메모</label>
            <textarea
              id="notes"
              name="notes"
              value={form.notes}
              onChange={handleChange}
              rows="5"
              placeholder="시술 내용, 변화, 특이사항 등을 입력하세요."
            />
          </div>

          <div className="treatment-image-upload-grid">
            <div className="treatment-image-upload-card">
              <div className="image-section-header">
                <div>
                  <h3>시술 전 사진</h3>
                  <p className="image-section-description">
                    시술 전 상태를 확인할 수 있는 이미지를 등록하세요.
                  </p>
                </div>
                <span className="image-section-badge">Before</span>
              </div>

              <label htmlFor="beforeImage" className="image-drop-zone">
                <div className="image-drop-zone-inner">
                  {form.beforeImage ? (
                    <>
                      <img
                        src={getPreviewUrl(form.beforeImage)}
                        alt="시술 전 미리보기"
                        className="treatment-preview-image"
                      />
                      <p className="image-guide-text">{form.beforeImage.name}</p>
                    </>
                  ) : (
                    <>
                      <strong>시술 전 사진 업로드</strong>
                      <p className="image-guide-text">클릭해서 이미지를 선택하세요.</p>
                      <p className="image-guide-text">JPG, PNG, WEBP 권장</p>
                    </>
                  )}
                </div>
              </label>

              <input
                type="file"
                id="beforeImage"
                name="beforeImage"
                accept="image/*"
                onChange={handleFileChange}
                className="image-hidden-input"
              />
            </div>

            <div className="treatment-image-upload-card">
              <div className="image-section-header">
                <div>
                  <h3>시술 후 사진</h3>
                  <p className="image-section-description">
                    시술 후 변화를 확인할 수 있는 이미지를 등록하세요.
                  </p>
                </div>
                <span className="image-section-badge">After</span>
              </div>

              <label htmlFor="afterImage" className="image-drop-zone">
                <div className="image-drop-zone-inner">
                  {form.afterImage ? (
                    <>
                      <img
                        src={getPreviewUrl(form.afterImage)}
                        alt="시술 후 미리보기"
                        className="treatment-preview-image"
                      />
                      <p className="image-guide-text">{form.afterImage.name}</p>
                    </>
                  ) : (
                    <>
                      <strong>시술 후 사진 업로드</strong>
                      <p className="image-guide-text">클릭해서 이미지를 선택하세요.</p>
                      <p className="image-guide-text">JPG, PNG, WEBP 권장</p>
                    </>
                  )}
                </div>
              </label>

              <input
                type="file"
                id="afterImage"
                name="afterImage"
                accept="image/*"
                onChange={handleFileChange}
                className="image-hidden-input"
              />
            </div>
          </div>

          <div className="admin-treatment-actions">
            <button
              type="submit"
              className="admin-treatment-submit-btn"
              disabled={submitting}
            >
              {submitting ? '등록 중...' : '시술 기록 등록'}
            </button>

            <Link to="/admin" className="admin-treatment-cancel-btn">
              취소
            </Link>
          </div>
        </form>
      </div>
    </section>
  )
}

export default AdminTreatmentRecordCreatePage


