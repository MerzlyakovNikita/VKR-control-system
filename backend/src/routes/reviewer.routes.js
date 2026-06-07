import { Router } from 'express'
import { db } from '../db/index.js'
import auth from '../middleware/auth.middleware.js'

const router = Router()

router.get('/', auth, async (req, res) => {
  try {
    const result = await db.query(`
      SELECT r.id, r.last_name, r.first_name, r.middle_name, r.degree, r.position,
             r.workplace, r.email, r.phone, r.is_active,
             COUNT(s.id)::int AS student_count
      FROM reviewers r
      LEFT JOIN students s ON s.reviewer_id = r.id
      GROUP BY r.id
      ORDER BY r.last_name, r.first_name
    `)
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
