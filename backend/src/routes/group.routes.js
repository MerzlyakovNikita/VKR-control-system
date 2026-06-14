import { Router } from 'express'
import {
  createGroup,
  getGroups,
  updateGroup,
  deleteGroup,
  getGroupStudents,
  getGroupById,
  getCurrentYear,
} from '../controllers/group.controller.js'
import auth from '../middleware/auth.middleware.js'

const router = Router()

router.get('/current-year', auth, getCurrentYear)
router.post('/', auth, createGroup)
router.get('/', auth, getGroups)
router.put('/:id', auth, updateGroup)
router.delete('/:id', auth, deleteGroup)
router.get('/:id/students', auth, getGroupStudents)
router.get('/:id', auth, getGroupById)

export default router
