import { Router } from 'express'
import auth from '../middleware/auth.middleware.js'
import { getReviewDirection } from '../controllers/document.controller.js'

const router = Router()

router.get('/review-direction/:studentId', auth, getReviewDirection)

export default router
