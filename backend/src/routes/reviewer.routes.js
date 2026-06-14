import { Router } from 'express'
import auth from '../middleware/auth.middleware.js'
import {
  getReviewers,
  getReviewerStudents,
  getReviewerYears,
  createReviewer,
  updateReviewer,
  toggleReviewerActive,
  assignStudentReviewer,
} from '../controllers/reviewer.controller.js'

const router = Router()

router.get('/years', auth, getReviewerYears)
router.get('/', auth, getReviewers)
router.get('/:id/students', auth, getReviewerStudents)
router.post('/', auth, createReviewer)
router.put('/:id', auth, updateReviewer)
router.patch('/:id/active', auth, toggleReviewerActive)
router.put('/student/:studentId', auth, assignStudentReviewer)

export default router
