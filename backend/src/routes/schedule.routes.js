import { Router } from 'express'
import auth from '../middleware/auth.middleware.js'
import { uploadMiddleware, importSchedule, getSchedule, autoAssign, exportSchedule, getScheduleYears } from '../controllers/schedule.controller.js'

const router = Router()

router.get('/years', auth, getScheduleYears)
router.get('/', auth, getSchedule)
router.get('/export', auth, exportSchedule)
router.post('/import', auth, uploadMiddleware, importSchedule)
router.post('/auto-assign', auth, autoAssign)

export default router
