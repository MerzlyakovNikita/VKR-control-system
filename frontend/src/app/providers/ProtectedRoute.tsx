import { Navigate } from 'react-router-dom'
import { getRole, isAuthenticated } from '../../shared/lib/auth'

export const ProtectedRoute = ({ children, roles }: any) => {
  if (!isAuthenticated()) {
    return <Navigate to="/login" />
  }

  const role = getRole()

  if (roles && !roles.includes(role)) {
    return <Navigate to="/thesis" />
  }

  return children
}