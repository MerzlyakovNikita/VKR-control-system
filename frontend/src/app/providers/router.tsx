import { Routes, Route, Navigate } from 'react-router-dom'
import { MainLayout } from '../layouts/MainLayout'
import LoginPage from '../../pages/auth/LoginPage'
import RegisterPage from '../../pages/auth/RegisterPage'
import ProfilePage from '../../pages/profile/ProfilePage'
import GroupsPage from '../../pages/secretary/GroupsPage'
import ReferenceMaterialsPage from '../../pages/reference/ReferenceMaterialsPage'
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
            <ProtectedRoute roles={['SECRETARY']}>
              <GroupsPage />
            </ProtectedRoute>
          }
        />
        
        <Route path="groups/:id" element={<div>Страница группы</div>} />

        <Route path="documents" element={<ReferenceMaterialsPage />} />
      </Route>
    </Routes>
  )
}