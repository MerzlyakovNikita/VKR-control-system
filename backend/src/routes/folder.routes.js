import { Router } from 'express'
import auth from '../middleware/auth.middleware.js'
import { createFolder, getFolders, deleteFolder } from '../controllers/folder.controller.js'

const router = Router()

router.get('/', auth, getFolders)
router.post('/', auth, createFolder)
router.delete('/:id', auth, deleteFolder)

export default router
