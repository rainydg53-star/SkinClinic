import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAlertModal } from '../../components/useAlertModal'
import './MyPageWithdrawPage.css'
import { API_BASE_URL } from '@/config/api'

function MyPageWithdrawPage({ refreshAuth }) {
  const navigate = useNavigate()
  const { showAlert, showConfirm } = useAlertModal()

  const [member, setMember] = useState({
    socialLogin: false,
  })
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [errorMessage, setErrorMessage] = useState('')

  useEffect(() => {
    const fetchMyInfo = async () => {
      try {
        const response = await fetch(`${API_BASE_URL}/api/members/me`, {
          credentials: 'include',
        })

        if (!response.ok) {
          throw new Error('회원 정보를 불러오지 못했습니다.')
        }

        const data = await response.json()
        setMember({
          socialLogin: data.socialLogin || false,
        })
      } catch (error) {
        setErrorMessage(error.message)
      } finally {
        setLoading(false)
      }
    }

    fetchMyInfo()
  }, [])

  const withdrawMember = async () => {
    try {
      setSubmitting(true)
      setErrorMessage('')

      const response = await fetch(`${API_BASE_URL}/api/members/me`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          password: member.socialLogin ? null : password,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.message || '회원탈퇴를 진행하지 못했습니다.')
      }

      showAlert({
        title: '회원탈퇴 완료',
        message: '회원탈퇴가 완료되었습니다.',
        onConfirm: async () => {
          if (typeof refreshAuth === 'function') {
            await refreshAuth()
          }
          navigate('/')
        },
      })
    } catch (error) {
      setErrorMessage(error.message)
    } finally {
      setSubmitting(false)
    }
  }

  const handleWithdraw = () => {
    showConfirm({
      title: '회원탈퇴',
      message: '정말 회원탈퇴 하시겠습니까?\n탈퇴 후 다시 로그인할 수 없습니다.',
      confirmText: '탈퇴',
      cancelText: '취소',
      onConfirm: withdrawMember,
    })
  }

  if (loading) {
    return <div className="withdraw-page-status">불러오는 중...</div>
  }

  return (
    <section className="withdraw-page">
      <div className="withdraw-card">
        <h2>회원탈퇴</h2>
        <p className="withdraw-description">
          탈퇴를 진행하면 계정 사용이 중지되고 다시 로그인할 수 없습니다.
        </p>

        <div className="withdraw-warning-box">
          <strong>탈퇴 전 꼭 확인해 주세요.</strong>
          <ul>
            <li>결제 및 이용 이력은 별도로 보관될 수 있습니다.</li>
            <li>탈퇴한 계정은 복구가 어렵습니다.</li>
            <li>소셜 로그인 계정도 동일하게 탈퇴 처리됩니다.</li>
          </ul>
        </div>

        {!member.socialLogin && (
          <div className="withdraw-form-group">
            <label htmlFor="withdraw-password">비밀번호 확인</label>
            <input
              id="withdraw-password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="비밀번호를 입력하세요"
              className="withdraw-input"
            />
          </div>
        )}

        {errorMessage && <div className="withdraw-error">{errorMessage}</div>}

        <div className="withdraw-actions">
          <button type="button" className="withdraw-cancel-btn" onClick={() => navigate('/mypage')}>
            취소
          </button>
          <button
            type="button"
            className="withdraw-confirm-btn"
            onClick={handleWithdraw}
            disabled={submitting}
          >
            {submitting ? '탈퇴 처리 중...' : '회원탈퇴'}
          </button>
        </div>
      </div>
    </section>
  )
}

export default MyPageWithdrawPage

