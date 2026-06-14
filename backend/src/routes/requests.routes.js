import { Router } from 'express'
import auth from '../middleware/auth.middleware.js'
import {
  getPendingCounts,
  getAssignmentRequests,
  approveAssignmentRequest,
  rejectAssignmentRequest,
  getApprovalRequests,
  approveApprovalRequest,
  rejectApprovalRequest,
} from '../controllers/requests.controller.js'

const router = Router()

router.get('/counts', auth, getPendingCounts)
router.get('/assignment', auth, getAssignmentRequests)
router.post('/assignment/:id/approve', auth, approveAssignmentRequest)
router.post('/assignment/:id/reject', auth, rejectAssignmentRequest)

router.get('/approval', auth, getApprovalRequests)
router.post('/approval/:id/approve', auth, approveApprovalRequest)
router.post('/approval/:id/reject', auth, rejectApprovalRequest)

export default router
