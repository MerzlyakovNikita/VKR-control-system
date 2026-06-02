import { Router } from 'express'
import { db } from '../db/index.js'
import auth from '../middleware/auth.middleware.js'

const router = Router()

router.get('/', auth, async (req, res) => {
  try {
    const result = await db.query('SELECT * FROM reviewers ORDER BY last_name')
    res.json(result.rows)
  } catch (e) {
    console.error(e)
    res.status(500).json({ message: 'Ошибка загрузки рецензентов' })
  }
})

router.put('/student/:studentId', auth, async (req, res) => {
  try {
    const { studentId } = req.params
    const { reviewer_id } = req.body
    await db.query('UPDATE reviewers SET student_id = NULL WHERE student_id = $1', [studentId])
    if (reviewer_id) {
      await db.query('UPDATE reviewers SET student_id = $1 WHERE id = $2', [studentId, reviewer_id])
    }
    res.json({ ok: true })
  } catch (e) {
    console.error(e)
    res.status(500).json({ message: 'Ошибка назначения рецензента' })
  }
})

export default router
