import { Router } from 'express'
import auth from '../middleware/auth.middleware.js'
import { db } from '../db/index.js'
import { getMyThesis, saveThesis, getAllTheses, updateStudentAndThesis, deleteStudent } from '../controllers/thesis.controller.js'

const router = Router()

router.get('/me', auth, getMyThesis)
router.post('/me', auth, saveThesis)
router.get('/all', auth, getAllTheses)
router.put('/student/:id', auth, updateStudentAndThesis)
router.delete('/student/:id', auth, deleteStudent)

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
