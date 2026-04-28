import { Router } from 'express'
import {
  createGroup,
  getGroups,
  updateGroup
} from '../controllers/group.controller.js'
import auth from '../middleware/auth.middleware.js'

const router = Router()

router.post('/', auth, createGroup)
router.get('/', auth, getGroups)
router.put('/:id', auth, updateGroup)

export default router