import { Router } from 'express'
import auth from '../middleware/auth.middleware.js'
import {
  getDirections,
  createDirection,
  updateDirection,
  deleteDirection,
  getProfiles,
  createProfile,
  updateProfile,
  deleteProfile,
} from '../controllers/direction.controller.js'

const router = Router()

router.get('/', auth, getDirections)
router.post('/', auth, createDirection)
router.put('/:id', auth, updateDirection)
router.delete('/:id', auth, deleteDirection)
router.get('/:id/profiles', auth, getProfiles)
router.post('/:id/profiles', auth, createProfile)
router.put('/:id/profiles/:profileId', auth, updateProfile)
router.delete('/:id/profiles/:profileId', auth, deleteProfile)

export default router
