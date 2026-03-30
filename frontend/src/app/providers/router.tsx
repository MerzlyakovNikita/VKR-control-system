import { Routes, Route, Navigate } from 'react-router-dom'
import { MainLayout } from '../layouts/MainLayout'
import ThesisPage from '../../pages/thesis/ThesisPage'
import LoginPage from '../../pages/auth/LoginPage'
import RegisterPage from '../../pages/auth/RegisterPage'
import ProfilePage from '../../pages/profile/ProfilePage'

export const AppRouter = () => {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />

      <Route path="/" element={<MainLayout />}>
        <Route index element={<Navigate to="/thesis" />} />

        <Route path="thesis" element={<ThesisPage />} />
        <Route path="profile" element={<ProfilePage />} />
      </Route>
    </Routes>
  )
}