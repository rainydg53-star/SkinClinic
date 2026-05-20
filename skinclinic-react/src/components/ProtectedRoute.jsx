import { Navigate, useLocation } from 'react-router-dom'

function ProtectedRoute({ isLoggedIn, children }) {
  const location = useLocation()

  if (!isLoggedIn) {
    const redirect = `${location.pathname}${location.search}`
    return <Navigate to={`/login?redirect=${encodeURIComponent(redirect)}`} replace />
  }

  return children
}

export default ProtectedRoute