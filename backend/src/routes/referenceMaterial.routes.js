import { Router } from 'express'
import auth from '../middleware/auth.middleware.js'
import { upload } from '../middleware/upload.js'
import {
  getAllMaterials,
  createMultipleMaterials,
  downloadMaterial,
  deleteMaterial
} from '../controllers/referenceMaterial.controller.js'

const router = Router()

router.get('/', auth, getAllMaterials)
router.post('/multiple', auth, upload.array('files'), createMultipleMaterials)
router.get('/download/:id', auth, downloadMaterial)
router.delete('/:id', auth, deleteMaterial)

export default router