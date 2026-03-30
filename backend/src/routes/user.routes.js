import { Router } from 'express'
import { db } from '../db/index.js'
import auth from '../middleware/auth.middleware.js'

const router = Router()

router.get('/me', auth, async (req, res) => {
  try {
    const result = await db.query(
      `SELECT 
        id,
        email,
        role,
        last_name,
        first_name,
        middle_name,
        phone
       FROM users
       WHERE id = $1`,
      [req.user.id]
    )

    res.json(result.rows[0])
  } catch (e) {
    res.status(500).json({ message: 'Ошибка сервера' })
  }
})

export default router