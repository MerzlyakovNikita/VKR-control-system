import { Router } from 'express'
import { db } from '../db/index.js'
import auth from '../middleware/auth.middleware.js'
import { capitalize } from '../shared/normalize.js'

const router = Router()

router.get('/', auth, async (req, res) => {
  try {
    const now = new Date()
    const currentYear = now.getMonth() >= 8 ? now.getFullYear() + 1 : now.getFullYear()
    const result = await db.query(
      `
      SELECT r.id, r.last_name, r.first_name, r.middle_name, r.degree, r.position,
             r.workplace, r.email, r.phone, r.is_active,
             COUNT(CASE WHEN g.graduation_year = $1 THEN s.id END)::int AS student_count
      FROM reviewers r
      LEFT JOIN students s ON s.reviewer_id = r.id
      LEFT JOIN groups g ON g.id = s.group_id
      GROUP BY r.id
      ORDER BY r.last_name, r.first_name
    `,
      [currentYear],
    )
    res.json(result.rows)
  } catch (e) {
    console.error(e)
    res.status(500).json({ message: 'Ошибка загрузки рецензентов' })
  }
})

router.get('/:id/students', auth, async (req, res) => {
  try {
    const now = new Date()
    const currentYear = now.getMonth() >= 8 ? now.getFullYear() + 1 : now.getFullYear()
    const result = await db.query(
      `
      SELECT s.id, s.last_name, s.first_name, s.middle_name, g.name AS group_name
      FROM students s
      JOIN groups g ON g.id = s.group_id
      WHERE s.reviewer_id = $1 AND g.graduation_year = $2
      ORDER BY g.name, s.last_name, s.first_name
    `,
      [req.params.id, currentYear],
    )
    res.json(result.rows)
  } catch (e) {
    console.error(e)
    res.status(500).json({ message: 'Ошибка загрузки студентов рецензента' })
  }
})

router.post('/', auth, async (req, res) => {
  try {
    if (!req.user.roles?.includes('SECRETARY')) {
      return res.status(403).json({ message: 'Нет доступа' })
    }
    const { last_name, first_name, middle_name, degree, position, workplace, email, phone } = req.body
    if (!last_name?.trim() || !first_name?.trim()) {
      return res.status(400).json({ message: 'Фамилия и имя обязательны' })
    }
    const result = await db.query(
      `INSERT INTO reviewers (last_name, first_name, middle_name, degree, position, workplace, email, phone, is_active)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, true)
       RETURNING *`,
      [
        capitalize(last_name),
        capitalize(first_name),
        middle_name?.trim() ? capitalize(middle_name) : null,
        degree || null,
        position?.trim() || null,
        workplace?.trim() || null,
        email?.trim() || null,
        phone?.trim() || null,
      ],
    )
    res.json(result.rows[0])
  } catch (e) {
    console.error(e)
    res.status(500).json({ message: 'Ошибка добавления рецензента' })
  }
})

router.put('/:id', auth, async (req, res) => {
  try {
    if (!req.user.roles?.includes('SECRETARY')) {
      return res.status(403).json({ message: 'Нет доступа' })
    }
    const { last_name, first_name, middle_name, degree, position, workplace, email, phone } = req.body
    if (!last_name?.trim() || !first_name?.trim()) {
      return res.status(400).json({ message: 'Фамилия и имя обязательны' })
    }
    const result = await db.query(
      `UPDATE reviewers
       SET last_name=$1, first_name=$2, middle_name=$3, degree=$4,
           position=$5, workplace=$6, email=$7, phone=$8
       WHERE id=$9
       RETURNING *`,
      [
        capitalize(last_name),
        capitalize(first_name),
        middle_name?.trim() ? capitalize(middle_name) : null,
        degree || null,
        position?.trim() || null,
        workplace?.trim() || null,
        email?.trim() || null,
        phone?.trim() || null,
        req.params.id,
      ],
    )
    if (result.rowCount === 0) return res.status(404).json({ message: 'Рецензент не найден' })
    res.json(result.rows[0])
  } catch (e) {
    console.error(e)
    res.status(500).json({ message: 'Ошибка обновления рецензента' })
  }
})

router.patch('/:id/active', auth, async (req, res) => {
  try {
    if (!req.user.roles?.includes('SECRETARY')) {
      return res.status(403).json({ message: 'Нет доступа' })
    }
    const { is_active } = req.body
    await db.query('UPDATE reviewers SET is_active = $1 WHERE id = $2', [is_active, req.params.id])
    res.json({ ok: true })
  } catch (e) {
    console.error(e)
    res.status(500).json({ message: 'Ошибка обновления статуса' })
  }
})

router.put('/student/:studentId', auth, async (req, res) => {
  try {
    const { studentId } = req.params
    const { reviewer_id } = req.body
    await db.query('UPDATE students SET reviewer_id = $1 WHERE id = $2', [
      reviewer_id || null,
      studentId,
    ])
    res.json({ ok: true })
  } catch (e) {
    console.error(e)
    res.status(500).json({ message: 'Ошибка назначения рецензента' })
  }
})

export default router
