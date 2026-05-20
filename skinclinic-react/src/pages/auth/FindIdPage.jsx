import { useState } from 'react'
import './FindIdPage.css'
import { API_BASE_URL } from '@/config/api'

function FindIdPage() {
  const [form, setForm] = useState({
    name: '',
    email: '',
  })

  const [result, setResult] = useState('')
  const [errorMessage, setErrorMessage] = useState('')
  const [successMessage, setSuccessMessage] = useState('')

  const handleChange = (e) => {
    const { name, value } = e.target
    setForm((prev) => ({
      ...prev,
      [name]: value,
    }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setErrorMessage('')
    setSuccessMessage('')
    setResult('')

    try {
      const response = await fetch(`${API_BASE_URL}/api/members/find-id`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(form),
      })

      const data = await response.json()

      if (response.ok) {
        setResult(data.loginId)
        setSuccessMessage(data.message)
      } else {
        setErrorMessage(data.message || '아이디 찾기에 실패했습니다.')
      }
    } catch (error) {
      console.error('아이디 찾기 실패:', error)
      setErrorMessage('서버 오류가 발생했습니다.')
    }
  }

  return (
    <section className="find-id-page">
      <div className="find-id-card">
        <div className="find-id-title-wrap">
          <h2 className="find-id-title">아이디 찾기</h2>
          <p className="find-id-subtitle">가입 시 등록한 이름과 이메일을 입력해 주세요.</p>
        </div>

        {errorMessage && <div className="form-error">{errorMessage}</div>}
        {successMessage && <div className="form-success">{successMessage}</div>}

        <form onSubmit={handleSubmit} className="find-id-form">
          <div className="form-group">
            <label htmlFor="name">이름</label>
            <input
              type="text"
              id="name"
              name="name"
              value={form.name}
              onChange={handleChange}
              placeholder="이름을 입력하세요"
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="email">이메일</label>
            <input
              type="email"
              id="email"
              name="email"
              value={form.email}
              onChange={handleChange}
              placeholder="이메일을 입력하세요"
              required
            />
          </div>

          <button type="submit" className="find-id-btn">
            아이디 찾기
          </button>
        </form>

        {result && (
          <div className="find-id-result">
            <p>회원님의 아이디는 아래와 같습니다.</p>
            <strong>{result}</strong>
          </div>
        )}
      </div>
    </section>
  )
}

export default FindIdPage

