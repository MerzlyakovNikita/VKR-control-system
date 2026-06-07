import { Router } from 'express'
import multer from 'multer'
import auth from '../middleware/auth.middleware.js'
import { db } from '../db/index.js'
import { getMyThesis, saveThesis, getAllTheses, updateStudentAndThesis, deleteStudent, importStudents, assignSupervisor, createStudent, getThesisSupervisors, setThesisSupervisor } from '../controllers/thesis.controller.js'

const memUpload = multer({
  storage: multer.memoryStorage(),
  fileFilter: (_req, file, cb) => {
    const ok =
      file.originalname.toLowerCase().endsWith('.xlsx') ||
      file.mimetype === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    cb(ok ? null : new Error('Только файлы .xlsx'), ok)
  },
})

const router = Router()

router.post('/import', auth, memUpload.single('file'), importStudents)
router.get('/supervisors', auth, getThesisSupervisors)
router.put('/student/:id/supervisor', auth, setThesisSupervisor)
router.get('/me', auth, getMyThesis)
router.post('/me', auth, saveThesis)
router.get('/all', auth, getAllTheses)
router.put('/student/:id', auth, updateStudentAndThesis)
router.post('/student', auth, createStudent)
router.delete('/student/:id', auth, deleteStudent)
router.post('/student/:id/assign', auth, assignSupervisor)

router.get('/defense-dates/group/:groupId', auth, async (req, res) => {
  try {
    const result = await db.query(
      'SELECT * FROM defense_dates WHERE group_id = $1 ORDER BY defense_date',
      [req.params.groupId],
    )
    res.json(result.rows)
  } catch (e) {
    console.error(e)
    res.status(500).json({ message: 'Ошибка загрузки дат защиты' })
  }
})

export default router
