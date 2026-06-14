import { Router } from 'express'
import auth from '../middleware/auth.middleware.js'
import { getReviewDirectionTemplate } from '../controllers/document.controller.js'
import { getReviewerOrderDocument } from '../controllers/reviewer_order.controller.js'
import { getThesesOrderDocument } from '../controllers/theses_order.controller.js'

const router = Router()

router.get('/review-direction/:studentId', auth, getReviewDirectionTemplate)
router.get('/reviewer-order', auth, getReviewerOrderDocument)
router.get('/theses-order', auth, getThesesOrderDocument)

export default router
