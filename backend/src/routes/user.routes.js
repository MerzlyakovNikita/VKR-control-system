import { Router } from 'express'
import auth from '../middleware/auth.middleware.js'
import {
  getMe,
  updateMe,
  changePassword,
  getPendingUsers,
  approveUser,
  rejectUser,
} from '../controllers/user.controller.js'

const router = Router()

router.get('/me', auth, getMe)
router.put('/me', auth, updateMe)
router.put('/me/password', auth, changePassword)

router.get('/pending', auth, getPendingUsers)
router.post('/:id/approve', auth, approveUser)
router.delete('/:id/reject', auth, rejectUser)

export default router
