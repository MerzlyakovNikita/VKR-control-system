import { Router } from 'express'
import auth from '../middleware/auth.middleware.js'
import {
  getMe,
  updateMe,
  changePassword,
  getPendingUsers,
  approveUser,
  rejectUser,
  getActiveUsers,
  updateUserRoles,
  resetPassword,
} from '../controllers/user.controller.js'

const router = Router()

router.get('/me', auth, getMe)
router.put('/me', auth, updateMe)
router.put('/me/password', auth, changePassword)

router.get('/pending', auth, getPendingUsers)
router.get('/active', auth, getActiveUsers)
router.post('/:id/approve', auth, approveUser)
router.delete('/:id/reject', auth, rejectUser)
router.put('/:id/roles', auth, updateUserRoles)
router.post('/:id/reset-password', auth, resetPassword)

export default router
