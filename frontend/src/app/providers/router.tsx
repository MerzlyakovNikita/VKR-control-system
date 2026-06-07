import { Routes, Route, Navigate } from 'react-router-dom'
import { MainLayout } from '../layouts/MainLayout'
import LoginPage from '../../pages/auth/LoginPage'
import RegisterPage from '../../pages/auth/RegisterPage'
import ProfilePage from '../../pages/profile/ProfilePage'
import GroupsPage from '../../pages/secretary/GroupsPage'
import ThesesPage from '../../pages/theses/ThesesPage'
import AdministrationPage from '../../pages/secretary/AdministrationPage'
import AssignmentRequestsPage from '../../pages/head/AssignmentRequestsPage'
import DirectionsPage from '../../pages/secretary/DirectionsPage'
import ReviewersPage from '../../pages/reviewers/ReviewersPage'
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
          path="administration"
          element={
            <ProtectedRoute roles={['SECRETARY']}>
              <AdministrationPage />
            </ProtectedRoute>
          }
        />

        <Route
          path="directions"
          element={
            <ProtectedRoute roles={['SECRETARY']}>
              <DirectionsPage />
            </ProtectedRoute>
          }
        />

        <Route
          path="reviewers"
          element={
            <ProtectedRoute roles={['SECRETARY', 'HEAD_OF_DEPARTMENT']}>
              <ReviewersPage />
            </ProtectedRoute>
          }
        />

        <Route
          path="requests/assignment"
          element={
            <ProtectedRoute roles={['HEAD_OF_DEPARTMENT']}>
              <AssignmentRequestsPage />
            </ProtectedRoute>
          }
        />
      </Route>
    </Routes>
  )
}
