import { Navigate } from 'react-router-dom'
import { hasRole, isAuthenticated } from '../../shared/lib/auth'

export const ProtectedRoute = ({ children, roles }: any) => {
  if (!isAuthenticated()) {
    return <Navigate to="/login" />
  }

  if (roles && !roles.some((r: string) => hasRole(r))) {
    return <Navigate to="/theses" />
  }

  return children
}
