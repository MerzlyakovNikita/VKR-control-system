import { Routes, Route, Navigate } from 'react-router-dom'
import { MainLayout } from '../layouts/MainLayout'
import LoginPage from '../../pages/auth/LoginPage'
import RegisterPage from '../../pages/auth/RegisterPage'
import ProfilePage from '../../pages/profile/ProfilePage'
import GroupsPage from '../../pages/secretary/GroupsPage'
import ThesesPage from '../../pages/theses/ThesesPage'
import RegistrationRequestsPage from '../../pages/secretary/RegistrationRequestsPage'
import { ProtectedRoute } from '../providers/ProtectedRoute'

export const AppRouter = () => {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />

      <Route path="/" element={<MainLayout />}>
        <Route index element={<Navigate to="/profile" />} />

        <Route
          path="profile"
          element={
            <ProtectedRoute>
              <ProfilePage />
            </ProtectedRoute>
          }
        />

        <Route
          path="groups"
          element={
            <ProtectedRoute roles={['SECRETARY', 'PRACTICE_SUPERVISOR']}>
              <GroupsPage />
            </ProtectedRoute>
          }
        />

        <Route
          path="theses"
          element={
            <ProtectedRoute>
              <ThesesPage />
            </ProtectedRoute>
          }
        />

        <Route
          path="requests/registration"
          element={
            <ProtectedRoute roles={['SECRETARY']}>
              <RegistrationRequestsPage />
            </ProtectedRoute>
          }
        />
      </Route>
    </Routes>
  )
}
