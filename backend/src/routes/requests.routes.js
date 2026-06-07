import { Router } from 'express'
import auth from '../middleware/auth.middleware.js'
import { getAssignmentRequests, approveAssignmentRequest, rejectAssignmentRequest } from '../controllers/requests.controller.js'

const router = Router()

router.get('/assignment', auth, getAssignmentRequests)
router.post('/assignment/:id/approve', auth, approveAssignmentRequest)
router.post('/assignment/:id/reject', auth, rejectAssignmentRequest)

export default router
