import { Router } from 'express'
import auth from '../middleware/auth.middleware.js'
import { getMyThesis, saveThesis } from '../controllers/thesis.controller.js'

const router = Router()

router.get('/me', auth, getMyThesis)
router.post('/me', auth, saveThesis)

export default router
