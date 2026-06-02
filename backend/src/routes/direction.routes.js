import { Router } from 'express'
import { db } from '../db/index.js'
import auth from '../middleware/auth.middleware.js'

const router = Router()

router.get('/', auth, async (req, res) => {
  try {
    const result = await db.query('SELECT * FROM directions ORDER BY code')
    res.json(result.rows)
  } catch (e) {
    console.error(e)
    res.status(500).json({ message: 'Ошибка загрузки направлений' })
  }
})

router.get('/:id/profiles', auth, async (req, res) => {
  try {
    const result = await db.query('SELECT * FROM profiles WHERE direction_id = $1 ORDER BY name', [
      req.params.id,
    ])
    res.json(result.rows)
  } catch (e) {
    console.error(e)
    res.status(500).json({ message: 'Ошибка загрузки профилей' })
  }
})

export default router
