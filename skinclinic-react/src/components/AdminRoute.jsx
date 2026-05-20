import { useEffect, useRef } from 'react'
import { Navigate, useNavigate } from 'react-router-dom'
import { useAlertModal } from './useAlertModal'

function AdminRoute({ isLoggedIn, role, children }) {
  const navigate = useNavigate()
  const { showAlert } = useAlertModal()
  const hasShownAlert = useRef(false)

  useEffect(() => {
    if (isLoggedIn && role !== 'ROLE_ADMIN' && !hasShownAlert.current) {
      hasShownAlert.current = true
      showAlert({
        title: '접근 제한',
        message: '관리자만 접근할 수 있는 페이지입니다.',
        onConfirm: () => navigate('/'),
      })
    }
  }, [isLoggedIn, navigate, role, showAlert])

  if (!isLoggedIn) {
    return <Navigate to="/login" replace />
  }

  if (role !== 'ROLE_ADMIN') {
    return null
  }

  return children
}

export default AdminRoute
